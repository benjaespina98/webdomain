import { Injectable } from '@angular/core';
import { CurrencySymbol, ExpenseItem, SplitMode } from '../models/expense.model';
import { LanguageCode } from './language.service';

export interface AppState {
  schemaVersion: number;
  people: string[];
  expenseItems: ExpenseItem[];
  newPersonName: string;
  newExpenseDescription: string;
  newExpenseAmount: number | null;
  newExpensePaidBy: string;
  splitMode: SplitMode;
  selectedParticipants: string[];
  nextExpenseId: number;
  currentLanguage: LanguageCode;
  isSharedView: boolean;
  /** Opcional: las sesiones guardadas antes de agregar el selector de moneda no lo traen. */
  currency?: CurrencySymbol;
  savedAt?: number;
}

export type PersistableState = Omit<AppState, 'schemaVersion' | 'savedAt'>;

@Injectable({
  providedIn: 'root'
})
export class PersistenceService {
  private readonly storageKey = 'dividimos_app_state';
  private readonly currentSchemaVersion = 2;

  /**
   * `savedAt` marca la última interacción real del usuario. Se puede preservar
   * explícitamente para que restaurar una sesión no la vuelva a marcar como reciente.
   */
  saveState(state: PersistableState, savedAt: number = Date.now()): void {
    try {
      const fullState: AppState = {
        ...state,
        schemaVersion: this.currentSchemaVersion,
        savedAt
      };
      localStorage.setItem(this.storageKey, JSON.stringify(fullState));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }

  /**
   * Lee y normaliza la sesión guardada. Antes, cualquier `schemaVersion` distinto del actual
   * borraba la sesión entera; ahora las versiones anteriores se migran (`migrate`) y solo se
   * descarta lo que está realmente corrupto. Una versión *más nueva* (el usuario volvió a un
   * deploy viejo) se ignora sin borrarla, para no destruir datos de una versión que sí los entiende.
   */
  loadState(): AppState | null {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized) as Partial<AppState> | null;

      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.people)) {
        this.clearState();
        return null;
      }

      const version = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;
      if (version > this.currentSchemaVersion) {
        return null;
      }

      return this.migrate(parsed);
    } catch (error) {
      console.error('Failed to read state from localStorage:', error);
      this.clearState();
      return null;
    }
  }

  /**
   * Lleva cualquier sesión guardada (de la versión que sea) al formato actual, completando
   * con valores por defecto lo que falte y descartando gastos mal formados.
   * Cuando el esquema cambie de forma incompatible, agregar acá un paso por versión.
   */
  private migrate(saved: Partial<AppState>): AppState {
    const people = (saved.people ?? []).filter((person): person is string => typeof person === 'string' && person.trim().length > 0);

    const expenseItems = (Array.isArray(saved.expenseItems) ? saved.expenseItems : [])
      .filter((item) => !!item
        && typeof item.description === 'string'
        && typeof item.amount === 'number' && Number.isFinite(item.amount)
        && typeof item.paidBy === 'string'
        && Array.isArray(item.participants))
      .map((item) => ({ ...item, participants: item.participants.filter((participant) => typeof participant === 'string') }));

    const nextId = Math.max(saved.nextExpenseId ?? 1, ...expenseItems.map((item) => item.id + 1), 1);

    return {
      schemaVersion: this.currentSchemaVersion,
      people,
      expenseItems,
      newPersonName: saved.newPersonName ?? '',
      newExpenseDescription: saved.newExpenseDescription ?? '',
      newExpenseAmount: typeof saved.newExpenseAmount === 'number' ? saved.newExpenseAmount : null,
      newExpensePaidBy: saved.newExpensePaidBy ?? '',
      splitMode: saved.splitMode === 'custom' ? 'custom' : 'all',
      selectedParticipants: Array.isArray(saved.selectedParticipants) ? saved.selectedParticipants : [...people],
      nextExpenseId: nextId,
      currentLanguage: saved.currentLanguage === 'en' ? 'en' : 'es',
      isSharedView: saved.isSharedView === true,
      currency: saved.currency,
      savedAt: saved.savedAt
    };
  }

  clearState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear state in localStorage:', error);
    }
  }
}
