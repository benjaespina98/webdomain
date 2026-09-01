export interface ExpenseItem {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
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
