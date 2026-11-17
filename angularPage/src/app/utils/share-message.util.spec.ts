import { buildShareMessage, listExpenseNames } from './share-message.util';
import { SummaryView } from './summary-view';

describe('buildShareMessage', () => {
  const t = (key: string) => key;
  const money = (amount: number) => `$${amount}`;

  const view: SummaryView = {
    people: ['Ana', 'Beto'],
    expenses: [{ description: 'Cena', amount: 100, paidBy: 'Ana', emoji: '🍽️' }],
    totalExpense: 100,
    averageSpent: 50,
    personBalances: [
      { person: 'Ana', totalPaid: 100, totalConsumed: 50, netBalance: 50 },
      { person: 'Beto', totalPaid: 0, totalConsumed: 50, netBalance: -50 }
    ],
    results: [{ debtor: 'Beto', creditor: 'Ana', amount: 50 }],
    aliases: {}
  };

  it('arma un mensaje corto: total, nombres de los gastos, quién cobra, enlace y firma', () => {
    const message = buildShareMessage(view, t as never, money, 'https://x/share#data=abc');

    expect(message).toBe([
      '🧾 *shareTitle* · shareTotal $100',
      'Cena · 2 peopleWord',
      '',
      '*Ana* shareCollects $50',
      '• Beto sharePasses $50',
      '',
      'shareLinkHint',
      'https://x/share#data=abc',
      '_shareSignature_'
    ].join('\n'));
  });

  it('no incluye el detalle que ya está en el enlace (gastos, saldos, promedio)', () => {
    const message = buildShareMessage(view, t as never, money, 'l');

    expect(message).not.toContain('perPerson');
    expect(message).not.toContain('personBalancesTitle');
    expect(message).not.toContain('🍽️');
  });

  it('quita los centavos en cero pero conserva los que no lo son', () => {
    const cents = (amount: number) => `$ ${amount.toFixed(2).replace('.', ',')}`;
    const message = buildShareMessage({ ...view, totalExpense: 15000, results: [{ debtor: 'Beto', creditor: 'Ana', amount: 33.33 }] }, t as never, cents, 'l');

    expect(message).toContain('shareTotal $ 15000');
    expect(message).toContain('shareCollects $ 33,33');
    expect(message).toContain('sharePasses $ 33,33');
  });

  it('pone el alias de quien cobra al lado de su nombre, una sola vez, y no el de quien paga', () => {
    const many = { ...view, aliases: { Ana: 'ana.mp', Beto: 'beto.cbu' }, results: [
      { debtor: 'Beto', creditor: 'Ana', amount: 30 }, { debtor: 'Caro', creditor: 'Ana', amount: 20 }
    ] };
    const message = buildShareMessage(many, t as never, money, 'l');

    expect(message.match(/ana\.mp/g)?.length).toBe(1);
    expect(message).toContain('*Ana* shareCollects $50 · shareAlias: *ana.mp*\n• Beto sharePasses $30\n• Caro sharePasses $20');
    expect(message).not.toContain('beto.cbu');
  });

  it('con varios que cobran arma un bloque por cada uno, con alias solo si lo tienen', () => {
    const two = { ...view, aliases: { Caro: 'caro.uala' }, results: [
      { debtor: 'Beto', creditor: 'Ana', amount: 40 }, { debtor: 'Beto', creditor: 'Caro', amount: 10 }
    ] };
    const message = buildShareMessage(two, t as never, money, 'l');

    expect(message).toContain('*Ana* shareCollects $40\n• Beto sharePasses $40\n\n*Caro* shareCollects $10 · shareAlias: *caro.uala*\n• Beto sharePasses $10');
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
