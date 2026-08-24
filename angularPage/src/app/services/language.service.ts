import { Injectable } from '@angular/core';

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
  private currencyFormatter!: Intl.NumberFormat;

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
   * Formato de moneda consistente en toda la app ($ 1.234,56 en es / $1,234.56 en en).
   * Intl separa símbolo y número con un espacio duro; lo pasamos a espacio normal
   * porque este texto también viaja a WhatsApp, al portapapeles y a la URL compartida.
   */
  formatCurrency(amount: number): string {
    return this.currencyFormatter
      .format(Number.isFinite(amount) ? amount : 0)
      .replace(/[  ]/g, ' ');
  }

  private apply(language: LanguageCode, persist: boolean): void {
    this.language = language;
    this.currencyFormatter = new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol',
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
