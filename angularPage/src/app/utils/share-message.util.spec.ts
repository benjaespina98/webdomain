import { buildShareMessage, listExpenseNames } from './share-message.util';
import { SummaryView } from './summary-view';

describe('buildShareMessage', () => {
  const t = (key: string) => key;
  const money = (amount: number) => `$${amount}`;

  const view: SummaryView = {
    people: ['Ana', 'Beto'],
    expenses: [{ description: 'Cena', amount: 100, paidBy: 'Ana', emoji: '🍕' }],
    totalExpense: 100,
    averageSpent: 50,
    personBalances: [
      { person: 'Ana', totalPaid: 100, totalConsumed: 50, netBalance: 50 },
      { person: 'Beto', totalPaid: 0, totalConsumed: 50, netBalance: -50 }
    ],
    results: [{ debtor: 'Beto', creditor: 'Ana', amount: 50 }],
    aliases: {}
  };

  it('arma un mensaje corto: total, nombres de los gastos, pagos y enlace', () => {
    const message = buildShareMessage(view, t as never, money, 'https://x/share#data=abc');

    expect(message).toBe([
      '🧾 *dividimos?* · shareTotal *$100*',
      'Cena · 2 peopleWord',
      '',
      '*sharePaymentsHeader*',
      '• Beto → Ana: *$50*',
      '',
      'shareLinkHint',
      'https://x/share#data=abc'
    ].join('\n'));
  });

  it('no incluye el detalle que ya está en el enlace (gastos, saldos, promedio)', () => {
    const message = buildShareMessage(view, t as never, money, 'l');

    expect(message).not.toContain('perPerson');
    expect(message).not.toContain('personBalancesTitle');
    expect(message).not.toContain('🍕');
  });

  it('quita los centavos en cero pero conserva los que no lo son', () => {
    const cents = (amount: number) => `$ ${amount.toFixed(2).replace('.', ',')}`;
    const message = buildShareMessage({ ...view, totalExpense: 15000, results: [{ debtor: 'Beto', creditor: 'Ana', amount: 33.33 }] }, t as never, cents, 'l');

    expect(message).toContain('*$ 15000*');
    expect(message).toContain('*$ 33,33*');
  });

  it('agrega el alias de quien cobra, una sola vez aunque cobre de varios', () => {
    const many = { ...view, aliases: { Ana: 'ana.mp' }, results: [
      { debtor: 'Beto', creditor: 'Ana', amount: 30 }, { debtor: 'Caro', creditor: 'Ana', amount: 20 }
    ] };
    const message = buildShareMessage(many, t as never, money, 'l');

    expect(message.match(/ana\.mp/g)?.length).toBe(1);
    expect(message).toContain('💳 *Ana*: ana.mp');
  });

  it('avisa que está todo saldado cuando no hay pagos pendientes', () => {
    expect(buildShareMessage({ ...view, results: [] }, t as never, money, 'l')).toContain('shareAllSettled');
  });
});

describe('listExpenseNames', () => {
  it('une los nombres de todos los gastos, sin repetidos', () => {
    expect(listExpenseNames(['Asado'], 'y')).toBe('Asado');
    expect(listExpenseNames(['Asado', 'Uber'], 'y')).toBe('Asado y Uber');
    expect(listExpenseNames(['Asado', 'Uber', 'Vino'], 'y')).toBe('Asado, Uber y Vino');
    expect(listExpenseNames(['Cena', 'cena', ' Cena '], 'y')).toBe('Cena');
  });

  it('nunca resume con "+N más": si no entra, no dice nada', () => {
    const many = Array.from({ length: 12 }, (_, index) => `Gasto número ${index + 1}`);

    expect(listExpenseNames(many, 'y')).toBe('');
    expect(listExpenseNames(many, 'y')).not.toMatch(/más|more|\+/);
  });

  it('devuelve vacío si no hay gastos', () => {
    expect(listExpenseNames([], 'y')).toBe('');
  });
});
