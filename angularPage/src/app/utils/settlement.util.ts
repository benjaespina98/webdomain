import { ExpenseItem, SettlementResult } from '../models/expense.model';

export interface PersonBalance {
  person: string;
  totalPaid: number;
  totalConsumed: number;
  netBalance: number;
}

export interface SettlementSummary {
  results: SettlementResult[];
  personBalances: PersonBalance[];
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
    return { results: [], personBalances: [], totalExpense: 0, averageSpent: 0 };
  }

  const balancesInCents = people.reduce<BalanceMap>((accumulator, person) => {
    accumulator[person] = 0;
    return accumulator;
  }, {});

  const paidInCents = people.reduce<BalanceMap>((accumulator, person) => {
    accumulator[person] = 0;
    return accumulator;
  }, {});

  const consumedInCents = people.reduce<BalanceMap>((accumulator, person) => {
    accumulator[person] = 0;
    return accumulator;
  }, {});

  let totalExpenseInCents = 0;

  expenseItems.forEach((expense) => {
    if (!people.includes(expense.paidBy)) {
      return;
    }

    const amountInCents = Math.round(expense.amount * 100);
    const consumption = splitInCents(expense, amountInCents, people);
    if (consumption.length === 0) {
      return;
    }

    totalExpenseInCents += amountInCents;
    balancesInCents[expense.paidBy] += amountInCents;
    paidInCents[expense.paidBy] += amountInCents;

    consumption.forEach(({ person, cents }) => {
      balancesInCents[person] -= cents;
      consumedInCents[person] += cents;
    });
  });

  const personBalances: PersonBalance[] = people
    .map((person) => ({
      person,
      totalPaid: fromCents(paidInCents[person]),
      totalConsumed: fromCents(consumedInCents[person]),
      netBalance: fromCents(balancesInCents[person])
    }))
    .sort((a, b) => b.netBalance - a.netBalance);

  return {
    results: buildTransfers(balancesInCents),
    personBalances,
    totalExpense: fromCents(totalExpenseInCents),
    averageSpent: fromCents(Math.round(totalExpenseInCents / people.length))
  };
}

/**
 * Cuánto consumió cada persona de un gasto, en centavos. Con `shares` se respetan los montos exactos
 * (siempre que sumen el total); si no suman —un dato corrupto— se cae al reparto en partes iguales
 * en vez de inventar o perder plata.
 */
function splitInCents(expense: ExpenseItem, amountInCents: number, people: string[]): { person: string; cents: number }[] {
  if (expense.shares) {
    const entries = Object.entries(expense.shares)
      .filter(([person, amount]) => people.includes(person) && Number.isFinite(amount) && amount > 0)
      .map(([person, amount]) => ({ person, cents: Math.round(amount * 100) }));
    const sum = entries.reduce((total, entry) => total + entry.cents, 0);

    if (entries.length > 0 && sum === amountInCents) {
      return entries;
    }
  }

  const validParticipants = expense.participants.filter((participant) => people.includes(participant));
  if (validParticipants.length === 0) {
    return [];
  }

  // El resto en centavos se reparte de a uno para que los saldos cierren exactos.
  const baseShare = Math.floor(amountInCents / validParticipants.length);
  const remainder = amountInCents % validParticipants.length;

  return validParticipants.map((person, index) => ({ person, cents: baseShare + (index < remainder ? 1 : 0) }));
}

interface Balance {
  person: string;
  /** En centavos: positivo = le deben, negativo = debe. */
  balance: number;
}

/** Hasta esta cantidad de personas con saldo se busca la partición óptima (2^n · n pasos); más allá, greedy. */
const MAX_PEOPLE_FOR_EXACT_SPLIT = 16;

/**
 * Transferencias que saldan todas las deudas. Un conjunto de k personas cuyos saldos suman cero se
 * salda con k − 1 transferencias, así que el mínimo total es (personas con saldo − cantidad máxima de
 * grupos que suman cero). Se buscan esos grupos de forma exacta y dentro de cada uno se arma el cruce
 * con un greedy (que en un grupo cerrado nunca necesita más de k − 1). Sin esto, un greedy global puede
 * mezclar grupos independientes y pedir transferencias de más.
 */
function buildTransfers(balances: BalanceMap): SettlementResult[] {
  const entries: Balance[] = Object.entries(balances)
    .filter(([, balance]) => balance !== 0)
    .map(([person, balance]) => ({ person, balance }));

  if (entries.length === 0) {
    return [];
  }

  const groups = entries.length <= MAX_PEOPLE_FOR_EXACT_SPLIT ? splitIntoZeroSumGroups(entries) : [entries];

  return groups
    .flatMap((group) => greedyTransfers(group))
    .sort((a, b) => b.amount - a.amount);
}

/** Parte los saldos en la mayor cantidad posible de grupos que suman cero (DP sobre subconjuntos). */
function splitIntoZeroSumGroups(entries: Balance[]): Balance[][] {
  const count = entries.length;
  const full = (1 << count) - 1;
  const sums = new Float64Array(full + 1);
  const best = new Int8Array(full + 1);
  const lastAdded = new Int8Array(full + 1);

  for (let mask = 1; mask <= full; mask++) {
    const lowBit = mask & -mask;
    const index = 31 - Math.clz32(lowBit);
    sums[mask] = sums[mask ^ lowBit] + entries[index].balance;

    let bestCount = -1;
    for (let i = 0; i < count; i++) {
      if (mask & (1 << i)) {
        const previous = best[mask ^ (1 << i)];
        if (previous > bestCount) {
          bestCount = previous;
          lastAdded[mask] = i;
        }
      }
    }
    best[mask] = bestCount + (sums[mask] === 0 ? 1 : 0);
  }

  if (sums[full] !== 0) {
    return [entries];
  }

  // Orden de armado: cada vez que la suma acumulada vuelve a cero se cierra un grupo.
  const order: number[] = [];
  for (let mask = full; mask > 0; mask ^= 1 << lastAdded[mask]) {
    order.push(lastAdded[mask]);
  }
  order.reverse();

  const groups: Balance[][] = [];
  let current: Balance[] = [];
  let running = 0;
  order.forEach((index) => {
    current.push(entries[index]);
    running += entries[index].balance;
    if (running === 0) {
      groups.push(current);
      current = [];
    }
  });

  return current.length > 0 ? [...groups, current] : groups;
}

/** Cruza al que más debe con al que más le deben, de a uno, hasta saldar el grupo. */
function greedyTransfers(group: Balance[]): SettlementResult[] {
  const debtors = group
    .filter(({ balance }) => balance < 0)
    .map(({ person, balance }) => ({ person, amount: -balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = group
    .filter(({ balance }) => balance > 0)
    .map(({ person, balance }) => ({ person, amount: balance }))
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
