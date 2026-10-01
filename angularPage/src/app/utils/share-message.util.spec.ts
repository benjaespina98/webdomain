import { buildShareMessage } from './share-message.util';
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
    results: [{ debtor: 'Beto', creditor: 'Ana', amount: 50 }]
  };

  it('incluye personas, gastos, balances, pagos y el enlace', () => {
    const message = buildShareMessage(view, t as never, money, 'https://x/share#data=abc');

    expect(message).toContain('Ana, Beto');
    expect(message).toContain('🍕 *Cena*: $100');
    expect(message).toContain('+$50');
    expect(message).toContain('*Beto* sharePays *$50* shareTo *Ana*');
    expect(message.endsWith('https://x/share#data=abc')).toBeTrue();
  });

  it('omite el promedio por persona cuando el reparto es desigual', () => {
    expect(buildShareMessage({ ...view, averageSpent: null }, t as never, money, 'l')).not.toContain('perPerson');
    expect(buildShareMessage(view, t as never, money, 'l')).toContain('perPerson');
  });

  it('avisa que está todo saldado cuando no hay pagos pendientes', () => {
    expect(buildShareMessage({ ...view, results: [] }, t as never, money, 'l')).toContain('shareAllSettled');
  });
});
