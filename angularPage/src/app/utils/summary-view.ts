import { SettlementResult } from '../models/expense.model';
import { PersonBalance } from './settlement.util';
import { TranslationMap } from '../i18n/translations';

/** Foto del estado lista para mostrar: la comparten el mensaje de WhatsApp y la imagen PNG. */
export interface SummaryView {
  people: string[];
  expenses: { description: string; amount: number; paidBy: string; emoji: string }[];
  totalExpense: number;
  /** `null` cuando hay gastos con participantes parciales: ahí un promedio por persona confunde. */
  averageSpent: number | null;
  personBalances: PersonBalance[];
  results: SettlementResult[];
}

export type TranslateFn = (key: keyof TranslationMap) => string;
export type FormatMoneyFn = (amount: number) => string;
