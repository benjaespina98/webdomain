import { Injectable } from '@angular/core';
import * as LZString from 'lz-string';
import { CURRENCY_OPTIONS, CurrencySymbol, ExpenseItem } from '../models/expense.model';
import { LanguageCode } from './language.service';
import { PersistableState } from './persistence.service';

export interface ShareExpenseDto {
  d: string;
  a: number;
  b: number;
  r?: number[];
}

export interface SharePayload {
  p: string[];
  e: ShareExpenseDto[];
  /** Moneda elegida por quien compartió. Opcional: los enlaces generados antes de este campo no la traen. */
  c?: CurrencySymbol;
}

/** Formato de la v3: pagador/participantes por nombre en vez de índice. Ver `migrateLegacyPayload`. */
interface LegacyShareExpenseDto {
  d: string;
  a: number;
  b: string;
  r?: string[];
}

interface LegacySharePayload {
  p: string[];
  e: LegacyShareExpenseDto[];
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private readonly schemaVersion = 4;

  /** Versiones de enlace anteriores que todavía podemos migrar al formato actual. */
  private readonly minSupportedVersion = 3;

  encodeState(state: unknown): string {
    return LZString.compressToEncodedURIComponent(JSON.stringify(state));
  }

  buildShareUrl(state: unknown): string {
    const encoded = this.encodeState(state);
    return `${window.location.origin}/share?data=${encoded}&v=${this.schemaVersion}`;
  }

  /**
   * Decodifica y valida un enlace compartido. Si la versión es más nueva que la actual,
   * el JSON es inválido, o cualquier índice/nombre de pagador o participante viene
   * corrupto, devuelve `null` en vez de aplicar un estado a medias con un fallback
   * silencioso (antes `people[item.b] ?? people[0]` podía asignarle un gasto al
   * pagador equivocado sin avisar a nadie).
   *
   * Los enlaces de la v3 (pagador/participantes por nombre, antes de pasar a índices)
   * se migran al vuelo: son enlaces ya mandados por WhatsApp antes de ese cambio, y
   * rechazarlos de golpe los rompe para siempre sin que quien los recibe pueda hacer nada.
   */
  parseShareLink(data: string, version: number): SharePayload | null {
    if (version > this.schemaVersion || version < this.minSupportedVersion) {
      return null;
    }

    let decoded: SharePayload | LegacySharePayload | null = null;
    try {
      const json = LZString.decompressFromEncodedURIComponent(data);
      decoded = json ? (JSON.parse(json) as SharePayload | LegacySharePayload) : null;
    } catch {
      decoded = null;
    }

    if (!decoded) {
      return null;
    }

    if (version === this.schemaVersion) {
      return this.isValidPayload(decoded as SharePayload) ? (decoded as SharePayload) : null;
    }

    return this.migrateLegacyPayload(decoded as LegacySharePayload);
  }

  /** Convierte un payload de la v3 (nombres) al formato actual (índices), validando en el proceso. */
  private migrateLegacyPayload(payload: LegacySharePayload): SharePayload | null {
    if (!Array.isArray(payload.p) || payload.p.length === 0) {
      return null;
    }

    if (!payload.p.every((person) => typeof person === 'string' && person.trim().length > 0)) {
      return null;
    }

    if (!Array.isArray(payload.e)) {
      return null;
    }

    const people = payload.p;
    const nameToIndex = (name: string): number => people.indexOf(name);

    const migratedExpenses: ShareExpenseDto[] = [];
    for (const item of payload.e) {
      const payerIndex = typeof item.b === 'string' ? nameToIndex(item.b) : -1;
      if (typeof item.d !== 'string' || !item.d.trim() || typeof item.a !== 'number' || !Number.isFinite(item.a) || item.a <= 0 || payerIndex < 0) {
        return null;
      }

      let participantIndexes: number[] | undefined;
      if (item.r !== undefined) {
        if (!Array.isArray(item.r) || item.r.length === 0) {
          return null;
        }
        participantIndexes = item.r.map(nameToIndex);
        if (participantIndexes.some((index) => index < 0)) {
          return null;
        }
      }

      migratedExpenses.push({ d: item.d, a: item.a, b: payerIndex, ...(participantIndexes ? { r: participantIndexes } : {}) });
    }

    return { p: people, e: migratedExpenses };
  }

  /** Asume que `payload` ya pasó por `parseShareLink`. */
  buildImportedState(payload: SharePayload, currentLanguage: LanguageCode): PersistableState {
    const people = payload.p;
    const expenseItems: ExpenseItem[] = payload.e.map((item, index) => ({
      id: index + 1,
      description: item.d,
      amount: item.a,
      paidBy: people[item.b],
      participants: item.r ? item.r.map((personIndex) => people[personIndex]) : [...people]
    }));

    return {
      people,
      expenseItems,
      newPersonName: '',
      newExpenseDescription: '',
      newExpenseAmount: null,
      newExpensePaidBy: '',
      splitMode: 'all',
      selectedParticipants: [...people],
      nextExpenseId: expenseItems.length + 1,
      currentLanguage,
      isSharedView: true,
      // El símbolo de moneda es solo cosmético: a diferencia de los índices de
      // pagador/participante, un valor inesperado no corrompe ningún cálculo,
      // así que alcanza con un fallback seguro en vez de rechazar todo el import.
      currency: payload.c && CURRENCY_OPTIONS.includes(payload.c) ? payload.c : '$'
    };
  }

  private isValidPayload(payload: SharePayload): payload is SharePayload {
    if (!Array.isArray(payload.p) || payload.p.length === 0) {
      return false;
    }

    if (!payload.p.every((person) => typeof person === 'string' && person.trim().length > 0)) {
      return false;
    }

    if (!Array.isArray(payload.e)) {
      return false;
    }

    const peopleCount = payload.p.length;
    const isValidIndex = (index: number): boolean => Number.isInteger(index) && index >= 0 && index < peopleCount;

    return payload.e.every((item) =>
      typeof item.d === 'string' && item.d.trim().length > 0
      && typeof item.a === 'number' && Number.isFinite(item.a) && item.a > 0
      && isValidIndex(item.b)
      && (item.r === undefined || (Array.isArray(item.r) && item.r.length > 0 && item.r.every(isValidIndex)))
    );
  }
}
