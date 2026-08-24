import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { LanguageCode } from './language.service';

export interface ParsedExpense {
  description: string;
  amount: number | null;
  paidBy: string | null;
  participants: string[] | null;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

/**
 * Dictado de gastos con la Web Speech API del navegador.
 * Todo ocurre en el dispositivo: la app no manda audio a ningún servidor.
 */
@Injectable({
  providedIn: 'root'
})
export class VoiceInputService {
  private recognition: SpeechRecognitionLike | null = null;

  constructor(private readonly zone: NgZone) {}

  get isSupported(): boolean {
    return typeof window !== 'undefined'
      && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /** Emite transcripciones parciales y completa al terminar de escuchar. */
  listen(language: LanguageCode): Observable<{ transcript: string; isFinal: boolean }> {
    return new Observable((subscriber) => {
      const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        subscriber.error(new Error('unsupported'));
        return;
      }

      const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
      this.recognition = recognition;

      recognition.lang = language === 'es' ? 'es-AR' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          isFinal = isFinal || event.results[i].isFinal;
        }

        this.zone.run(() => subscriber.next({ transcript: transcript.trim(), isFinal }));
      };

      recognition.onerror = (event: any) => {
        this.zone.run(() => subscriber.error(new Error(event?.error ?? 'speech-error')));
      };

      recognition.onend = () => {
        this.zone.run(() => subscriber.complete());
      };

      try {
        recognition.start();
      } catch (error) {
        subscriber.error(error);
      }

      return () => {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          // Ya estaba detenido.
        }
        this.recognition = null;
      };
    });
  }

  stop(): void {
    try {
      this.recognition?.stop();
    } catch {
      // Ya estaba detenido.
    }
  }

  /**
   * Interpreta una frase dictada del estilo "Ana pagó 12500 de cena entre Ana y Bruno".
   * Devuelve sólo lo que pudo reconocer; el resto queda en null para que el
   * formulario conserve sus valores actuales.
   */
  parseExpense(transcript: string, people: string[], language: LanguageCode): ParsedExpense {
    const normalized = this.normalize(transcript);
    let working = ` ${normalized} `;

    const payerKeywords = language === 'es'
      ? ['pago', 'pagó', 'puso', 'abono', 'invito']
      : ['paid', 'payed', 'covered'];
    const splitKeywords = language === 'es'
      ? ['entre', 'para', 'con', 'dividido']
      : ['between', 'among', 'for', 'with'];

    // 1. Nombres mencionados, con su posición en la frase.
    const mentions = people
      .map((person) => ({ person, index: this.indexOfWord(working, this.normalize(person)) }))
      .filter((mention) => mention.index >= 0)
      .sort((a, b) => a.index - b.index);

    // 2. Monto.
    const amountMatch = this.extractAmount(working);
    const amount = amountMatch?.value ?? null;
    if (amountMatch) {
      working = working.replace(amountMatch.raw, ' ');
    }

    // 3. Quién pagó: el nombre más cercano a un verbo de pago, o el primero nombrado.
    let paidBy: string | null = null;
    const payerKeywordIndex = payerKeywords
      .map((keyword) => this.indexOfWord(working, this.normalize(keyword)))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];

    if (mentions.length > 0) {
      if (payerKeywordIndex !== undefined) {
        const closest = [...mentions].sort(
          (a, b) => Math.abs(a.index - payerKeywordIndex) - Math.abs(b.index - payerKeywordIndex)
        )[0];
        paidBy = closest.person;
      } else {
        paidBy = mentions[0].person;
      }
    }

    // 4. Participantes: los nombres que siguen a "entre/para/con".
    let participants: string[] | null = null;
    const splitIndex = splitKeywords
      .map((keyword) => this.indexOfWord(working, this.normalize(keyword)))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];

    if (splitIndex !== undefined) {
      const named = mentions.filter((mention) => mention.index > splitIndex).map((mention) => mention.person);
      if (named.length > 0) {
        participants = paidBy && !named.includes(paidBy) ? [paidBy, ...named] : named;
      }
    }

    // 5. Descripción: lo que queda al sacar nombres, montos y palabras de relleno.
    const noise = [
      ...payerKeywords,
      ...splitKeywords,
      ...people,
      ...(language === 'es'
        ? ['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'e', 'pesos', 'peso', 'gasto', 'gaste', 'gastamos']
        : ['of', 'the', 'a', 'an', 'and', 'dollars', 'bucks', 'spent', 'expense', 'on'])
    ].map((word) => this.normalize(word));

    const description = working
      .split(/\s+/)
      .filter((word) => word && !noise.includes(word))
      .join(' ')
      .trim();

    return {
      description: description ? this.capitalize(description) : '',
      amount,
      paidBy,
      participants
    };
  }

  /** Acepta "12500", "12.500,50", "12,500.50", "8 mil", "3k". */
  private extractAmount(text: string): { value: number; raw: string } | null {
    const multiplierMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(mil|k|thousand)\b/);
    if (multiplierMatch) {
      const base = Number.parseFloat(multiplierMatch[1].replace(',', '.'));
      if (Number.isFinite(base)) {
        return { value: base * 1000, raw: multiplierMatch[0] };
      }
    }

    const numberMatch = text.match(/\d[\d.,]*/);
    if (!numberMatch) {
      return null;
    }

    const value = this.parseLocalizedNumber(numberMatch[0]);
    return Number.isFinite(value) && value > 0 ? { value, raw: numberMatch[0] } : null;
  }

  private parseLocalizedNumber(raw: string): number {
    const cleaned = raw.replace(/[.,]$/, '');
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    // El separador que aparece último y deja 1-2 dígitos detrás es el decimal.
    const decimalSeparator = lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : '';
    const decimalIndex = decimalSeparator === ',' ? lastComma : lastDot;
    const hasDecimals = decimalSeparator !== '' && cleaned.length - decimalIndex - 1 <= 2;

    if (!hasDecimals) {
      return Number.parseFloat(cleaned.replace(/[.,]/g, ''));
    }

    const integerPart = cleaned.slice(0, decimalIndex).replace(/[.,]/g, '');
    const decimalPart = cleaned.slice(decimalIndex + 1);
    return Number.parseFloat(`${integerPart}.${decimalPart}`);
  }

  private indexOfWord(haystack: string, needle: string): number {
    if (!needle) {
      return -1;
    }
    const match = haystack.match(new RegExp(`\\b${this.escapeRegExp(needle)}\\b`));
    return match?.index ?? -1;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalize(value: string): string {
    return value
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\w\s.,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private capitalize(value: string): string {
    return value.charAt(0).toLocaleUpperCase() + value.slice(1);
  }
}
