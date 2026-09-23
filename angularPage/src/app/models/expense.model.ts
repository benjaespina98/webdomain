export type ExpenseCategory = 'food' | 'drink' | 'supermarket' | 'transport' | 'stay' | 'other';

export interface CategoryOption {
  id: ExpenseCategory;
  emoji: string;
  labelEs: string;
  labelEn: string;
}

export const EXPENSE_CATEGORIES: readonly CategoryOption[] = [
  { id: 'food', emoji: '🍕', labelEs: 'Comida', labelEn: 'Food' },
  { id: 'drink', emoji: '🍻', labelEs: 'Bebidas', labelEn: 'Drinks' },
  { id: 'supermarket', emoji: '🛒', labelEs: 'Supermercado', labelEn: 'Supermarket' },
  { id: 'transport', emoji: '⛽', labelEs: 'Transporte', labelEn: 'Transport' },
  { id: 'stay', emoji: '🏨', labelEs: 'Hospedaje', labelEn: 'Lodging' },
  { id: 'other', emoji: '💸', labelEs: 'Otros', labelEn: 'Other' },
];

export interface ExpenseItem {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  category?: ExpenseCategory;
}

export interface SettlementResult {
  debtor: string;
  creditor: string;
  amount: number;
}

export type SplitMode = 'all' | 'custom';

/** Símbolos de moneda soportados por el selector. Es solo una etiqueta visual: no hay conversión entre ellos. */
export type CurrencySymbol = '$' | 'US$' | '€';

export const CURRENCY_OPTIONS: readonly CurrencySymbol[] = ['$', 'US$', '€'];

