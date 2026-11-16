import { calculateSettlement } from './settlement.util';

describe('calculateSettlement', () => {
  it('returns an empty summary when there are no people or no expenses', () => {
    expect(calculateSettlement([], [])).toEqual({ results: [], personBalances: [], totalExpense: 0, averageSpent: 0 });
    expect(calculateSettlement(['Ana'], [])).toEqual({ results: [], personBalances: [], totalExpense: 0, averageSpent: 0 });
  });

  it('produces no transfers when a single person pays for themselves', () => {
    const summary = calculateSettlement(['Ana'], [
      { id: 1, description: 'Café', amount: 5, paidBy: 'Ana', participants: ['Ana'] }
    ]);

    expect(summary.totalExpense).toBe(5);
    expect(summary.averageSpent).toBe(5);
    expect(summary.results).toEqual([]);
  });

  it('splits an evenly divisible amount with no remainder', () => {
    const summary = calculateSettlement(['Ana', 'Beto'], [
      { id: 1, description: 'Cine', amount: 100, paidBy: 'Ana', participants: ['Ana', 'Beto'] }
    ]);

    expect(summary.results).toEqual([{ debtor: 'Beto', creditor: 'Ana', amount: 50 }]);
  });

  it('distributes the leftover cent(s) so the totals always close exactly', () => {
    // 10 / 3 = 3.333...: el reparto no puede perder ni inventar centavos.
    const summary = calculateSettlement(['Ana', 'Beto', 'Caro'], [
      { id: 1, description: 'Taxi', amount: 10, paidBy: 'Ana', participants: ['Ana', 'Beto', 'Caro'] }
    ]);

    const totalOwedToAna = summary.results
      .filter((result) => result.creditor === 'Ana')
      .reduce((sum, result) => sum + result.amount, 0);

    expect(summary.totalExpense).toBe(10);
    // A Ana le corresponden 3.34 (se queda con el centavo de más de su propia parte);
    // el resto, 6.66, es lo que le deben entre Beto y Caro.
    expect(Number(totalOwedToAna.toFixed(2))).toBe(6.66);
    expect(summary.results.every((result) => Number.isInteger(Math.round(result.amount * 100)))).toBeTrue();
  });

  it('gives the odd cent to exactly one debtor, never split across float rounding', () => {
    // El pagador no participa del gasto: el centavo de más queda en manos de un solo deudor.
    const summary = calculateSettlement(['Ana', 'Beto', 'Caro'], [
      { id: 1, description: 'Regalo', amount: 10.01, paidBy: 'Ana', participants: ['Beto', 'Caro'] }
    ]);

    const amounts = summary.results.map((result) => result.amount).sort((a, b) => a - b);
    expect(amounts).toEqual([5, 5.01]);
    expect(amounts[0] + amounts[1]).toBe(10.01);
  });

  it('keeps cent-level precision with awkward decimal amounts (no floating point drift)', () => {
    const summary = calculateSettlement(['Ana', 'Beto', 'Caro'], [
      { id: 1, description: 'Almuerzo', amount: 33.31, paidBy: 'Ana', participants: ['Ana', 'Beto', 'Caro'] }
    ]);

    const totalOwedToAna = summary.results
      .filter((result) => result.creditor === 'Ana')
      .reduce((sum, result) => sum + result.amount, 0);

    expect(summary.totalExpense).toBe(33.31);
    expect(Number(totalOwedToAna.toFixed(2))).toBe(22.2);
    expect(summary.results.every((result) => Number.isInteger(Math.round(result.amount * 100)))).toBeTrue();
  });

  it('ignores participants who are no longer part of the group', () => {
    const summary = calculateSettlement(['Ana', 'Beto'], [
      { id: 1, description: 'Cena', amount: 90, paidBy: 'Ana', participants: ['Ana', 'Beto', 'Caro'] }
    ]);

    // "Caro" ya no está en `people`: el gasto se reparte solo entre Ana y Beto.
    expect(summary.results).toEqual([{ debtor: 'Beto', creditor: 'Ana', amount: 45 }]);
  });

  it('ignores an expense whose payer is no longer part of the group', () => {
    const summary = calculateSettlement(['Beto'], [
      { id: 1, description: 'Cena', amount: 90, paidBy: 'Ana', participants: ['Beto'] }
    ]);

    expect(summary.results).toEqual([]);
    expect(summary.totalExpense).toBe(0);
  });

  it('nets multiple expenses into the minimum number of transfers', () => {
    const summary = calculateSettlement(['Ana', 'Beto', 'Caro'], [
      { id: 1, description: 'Cena', amount: 90, paidBy: 'Ana', participants: ['Ana', 'Beto', 'Caro'] },
      { id: 2, description: 'Nafta', amount: 30, paidBy: 'Beto', participants: ['Ana', 'Beto', 'Caro'] }
    ]);

    // Ana puso 90, Beto puso 30, Caro no puso nada; cada uno "debería" poner 40.
    // Ana: +50, Beto: -10, Caro: -40 → alcanza con 2 transferencias, no 3.
    expect(summary.results.length).toBe(2);
    expect(summary.results).toContain(jasmine.objectContaining({ debtor: 'Caro', creditor: 'Ana', amount: 40 }));
    expect(summary.results).toContain(jasmine.objectContaining({ debtor: 'Beto', creditor: 'Ana', amount: 10 }));
  });

  it('usa el mínimo de transferencias cuando hay grupos independientes que se saldan entre sí', () => {
    // Ana +5 / Yago -5 se saldan solos; Beto +4 y Caro +3 le deben cobrar a Xavi -7.
    // Un greedy global pide 4 transferencias; lo óptimo son 3.
    const summary = calculateSettlement(['Ana', 'Beto', 'Caro', 'Xavi', 'Yago'], [
      { id: 1, description: 'a', amount: 5, paidBy: 'Ana', participants: ['Yago'], shares: { Yago: 5 } },
      { id: 2, description: 'b', amount: 4, paidBy: 'Beto', participants: ['Xavi'], shares: { Xavi: 4 } },
      { id: 3, description: 'c', amount: 3, paidBy: 'Caro', participants: ['Xavi'], shares: { Xavi: 3 } }
    ]);

    expect(summary.results.length).toBe(3);
    expect(summary.results).toContain({ debtor: 'Yago', creditor: 'Ana', amount: 5 });
  });

  it('las transferencias dejan a todos en cero y nunca superan (personas con saldo − 1)', () => {
    const people = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    let seed = 7;
    const rnd = (max: number): number => (seed = (seed * 1103515245 + 12345) % 2147483648) % max;

    for (let round = 0; round < 60; round++) {
      const expenses = Array.from({ length: 1 + rnd(8) }, (_, i) => {
        const participants = people.filter(() => rnd(3) > 0);
        return {
          id: i + 1,
          description: `g${i}`,
          amount: (1 + rnd(200000)) / 100,
          paidBy: people[rnd(people.length)],
          participants: participants.length > 0 ? participants : ['A']
        };
      });

      const summary = calculateSettlement(people, expenses);
      const net: Record<string, number> = {};
      summary.personBalances.forEach((p) => (net[p.person] = Math.round(p.netBalance * 100)));
      summary.results.forEach((r) => {
        net[r.debtor] += Math.round(r.amount * 100);
        net[r.creditor] -= Math.round(r.amount * 100);
      });

      expect(Object.values(net).every((value) => value === 0)).toBeTrue();
      const withBalance = summary.personBalances.filter((p) => p.netBalance !== 0).length;
      expect(summary.results.length).toBeLessThanOrEqual(Math.max(0, withBalance - 1));
    }
  });

  it('respeta los montos exactos de un gasto con shares', () => {
    const result = calculateSettlement(['Ana', 'Beto', 'Caro'], [
      { id: 1, description: 'Cena', amount: 100, paidBy: 'Ana', participants: ['Ana', 'Beto'], shares: { Ana: 30, Beto: 70 } }
    ]);

    expect(result.personBalances.find((p) => p.person === 'Beto')?.totalConsumed).toBe(70);
    expect(result.results).toEqual([{ debtor: 'Beto', creditor: 'Ana', amount: 70 }]);
  });

  it('si los shares no suman el total, cae al reparto en partes iguales', () => {
    const result = calculateSettlement(['Ana', 'Beto'], [
      { id: 1, description: 'Cena', amount: 100, paidBy: 'Ana', participants: ['Ana', 'Beto'], shares: { Ana: 10, Beto: 10 } }
    ]);

    expect(result.results).toEqual([{ debtor: 'Beto', creditor: 'Ana', amount: 50 }]);
  });

  it('combina gastos parejos y gastos con montos exactos', () => {
    const result = calculateSettlement(['Ana', 'Beto'], [
      { id: 1, description: 'Pizza', amount: 100, paidBy: 'Ana', participants: ['Ana', 'Beto'] },
      { id: 2, description: 'Vino', amount: 60, paidBy: 'Beto', participants: ['Beto'], shares: { Beto: 60 } }
    ]);

    expect(result.totalExpense).toBe(160);
    expect(result.results).toEqual([{ debtor: 'Beto', creditor: 'Ana', amount: 50 }]);
  });
});
