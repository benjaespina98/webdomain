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
