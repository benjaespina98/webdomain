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
  /**
   * Reparto por montos exactos (persona → monto que consumió). Cuando existe, `participants` son
   * quienes tienen monto > 0 y los montos suman `amount`; si no, el gasto se divide en partes iguales.
   */
  shares?: Record<string, number>;
}

/** Copia profunda de un gasto (arrays y `shares`), para snapshots de undo y para no compartir referencias con las signals. */
export function cloneExpense(item: ExpenseItem): ExpenseItem {
  return { ...item, participants: [...item.participants], ...(item.shares ? { shares: { ...item.shares } } : {}) };
}

export interface SettlementResult {
  debtor: string;
  creditor: string;
  amount: number;
}

/** `all`: partes iguales entre todos · `custom`: partes iguales entre algunos · `amounts`: monto exacto por persona. */
export type SplitMode = 'all' | 'custom' | 'amounts';

/** Símbolos de moneda soportados por el selector. Es solo una etiqueta visual: no hay conversión entre ellos. */
export type CurrencySymbol = '$' | 'US$' | '€';

export const CURRENCY_OPTIONS: readonly CurrencySymbol[] = ['$', 'US$', '€'];

