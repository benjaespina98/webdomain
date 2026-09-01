import { calculateSettlement } from './settlement.util';

describe('calculateSettlement', () => {
  it('returns an empty summary when there are no people or no expenses', () => {
    expect(calculateSettlement([], [])).toEqual({ results: [], totalExpense: 0, averageSpent: 0 });
    expect(calculateSettlement(['Ana'], [])).toEqual({ results: [], totalExpense: 0, averageSpent: 0 });
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
});
