import { ExpenseItem, SettlementResult } from '../models/expense.model';

export interface SettlementSummary {
  results: SettlementResult[];
  totalExpense: number;
  averageSpent: number;
}

type BalanceMap = Record<string, number>;

/**
 * Motor de liquidación puro, sin dependencias de Angular: dado un grupo de personas
 * y sus gastos, calcula el total, el promedio por persona y las transferencias que
 * saldan las deudas cruzadas. Vive fuera de SplitComponent para poder testearlo de
 * forma aislada y para que un futuro `computed()` lo reevalúe solo cuando cambian
 * `people` o `expenseItems`.
 *
 * Todo el cálculo intermedio ocurre en centavos (enteros) para evitar los errores
 * de redondeo de punto flotante que aparecerían operando directamente con decimales.
 */
export function calculateSettlement(people: string[], expenseItems: ExpenseItem[]): SettlementSummary {
  if (people.length === 0 || expenseItems.length === 0) {
    return { results: [], totalExpense: 0, averageSpent: 0 };
  }

  const balancesInCents = people.reduce<BalanceMap>((accumulator, person) => {
    accumulator[person] = 0;
    return accumulator;
  }, {});

  let totalExpenseInCents = 0;

  expenseItems.forEach((expense) => {
    const validParticipants = expense.participants.filter((participant) => people.includes(participant));
    if (validParticipants.length === 0 || !people.includes(expense.paidBy)) {
      return;
    }

    const amountInCents = Math.round(expense.amount * 100);
    totalExpenseInCents += amountInCents;
    balancesInCents[expense.paidBy] += amountInCents;

    // El resto en centavos se reparte de a uno para que los saldos cierren exactos.
    const baseShare = Math.floor(amountInCents / validParticipants.length);
    const remainder = amountInCents % validParticipants.length;

    validParticipants.forEach((participant, index) => {
      balancesInCents[participant] -= baseShare + (index < remainder ? 1 : 0);
    });
  });

  return {
    results: buildTransfers(balancesInCents),
    totalExpense: fromCents(totalExpenseInCents),
    averageSpent: fromCents(Math.round(totalExpenseInCents / people.length))
  };
}

/** Greedy sobre saldos ordenados: minimiza la cantidad de transferencias. */
function buildTransfers(balances: BalanceMap): SettlementResult[] {
  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < 0)
    .map(([person, balance]) => ({ person, amount: -balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0)
    .map(([person, balance]) => ({ person, amount: balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: SettlementResult[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transfers.push({ debtor: debtor.person, creditor: creditor.person, amount: fromCents(amount) });
      debtor.amount -= amount;
      creditor.amount -= amount;
    }

    if (debtor.amount <= 0) {
      debtorIndex++;
    }

    if (creditor.amount <= 0) {
      creditorIndex++;
    }
  }

  return transfers;
}

function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}
