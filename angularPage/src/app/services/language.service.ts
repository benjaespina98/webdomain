import { Injectable } from '@angular/core';
import { CurrencySymbol } from '../models/expense.model';

export type LanguageCode = 'es' | 'en';

/**
 * Única fuente de verdad del idioma: detección, persistencia y formateo de moneda.
 * Antes esta lógica estaba duplicada en landing, split y share.
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly storageKey = 'split-language';
  private language: LanguageCode = 'es';
  private numberFormatter!: Intl.NumberFormat;

  constructor() {
    this.apply(this.readStoredLanguage() ?? this.detectDeviceLanguage(), false);
  }

  get current(): LanguageCode {
    return this.language;
  }

  get isSpanish(): boolean {
    return this.language === 'es';
  }

  set(language: LanguageCode): void {
    this.apply(language, true);
  }

  /**
   * Formatea el número con los separadores de miles/decimales del idioma actual
   * (1.234,56 en es / 1,234.56 en en) y le antepone el símbolo elegido en el
   * selector de moneda. Antes usábamos `Intl.NumberFormat` con `style: 'currency'`
   * fijo en USD, lo que ataba el símbolo mostrado al locale en vez de a la elección
   * real de la persona (en es-AR, Intl imprime "US$" en vez de "$"). Separar el
   * número del símbolo nos da control total y hace que el símbolo elegido se
   * refleje igual en la UI, en el portapapeles y en el mensaje de WhatsApp.
   */
  formatCurrency(amount: number, currencySymbol: CurrencySymbol = '$'): string {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `${currencySymbol} ${this.numberFormatter.format(safeAmount)}`;
  }

  private apply(language: LanguageCode, persist: boolean): void {
    this.language = language;
    this.numberFormatter = new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    document.documentElement.setAttribute('lang', language);

    if (persist) {
      try {
        localStorage.setItem(this.storageKey, language);
      } catch {
        // Storage bloqueado (modo privado): el idioma sigue vivo en memoria.
      }
    }
  }

  private readStoredLanguage(): LanguageCode | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved === 'es' || saved === 'en' ? saved : null;
    } catch {
      return null;
    }
  }

  private detectDeviceLanguage(): LanguageCode {
    const browserLanguage = (navigator.languages?.[0] ?? navigator.language ?? 'es').toLowerCase();
    return browserLanguage.startsWith('es') ? 'es' : 'en';
  }
}
