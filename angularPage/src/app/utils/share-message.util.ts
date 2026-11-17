import { FormatMoneyFn, SummaryView, TranslateFn } from './summary-view';

/** Si la lista de gastos supera este largo se omite entera: nunca se recorta ni se resume con "+N más". */
const MAX_EXPENSE_NAMES_LENGTH = 60;

/** "$ 15.000,00" → "$ 15.000": en un mensaje los centavos en cero sobran. */
function compactMoney(formatted: string): string {
  return formatted.replace(/[.,]00$/, '');
}

/**
 * Nombres de los gastos para el encabezado: "Asado", "Asado y Uber", "Asado, Uber y Vino".
 * Sin repetidos. Si no entra en una línea corta devuelve '' (mejor no decir nada que cortarla).
 */
export function listExpenseNames(descriptions: string[], andWord: string): string {
  const seen = new Set<string>();
  const names = descriptions
    .map((description) => description.trim())
    .filter((description) => {
      const key = description.toLocaleLowerCase();
      if (!description || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

  const text = names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} ${andWord} ${names[names.length - 1]}`;

  return text.length <= MAX_EXPENSE_NAMES_LENGTH ? text : '';
}

/**
 * Mensaje de WhatsApp corto. Es lo primero que ve alguien que todavía no conoce la app, así que va
 * ordenado por quien cobra: cuánto recibe, su alias (en su propia línea, fácil de copiar) y quiénes le
 * pasan plata. Los gastos y saldos por persona se ven al abrir el enlace.
 */
export function buildShareMessage(view: SummaryView, t: TranslateFn, format: FormatMoneyFn, link: string): string {
  const money = (amount: number): string => compactMoney(format(amount));

  const names = listExpenseNames(view.expenses.map((expense) => expense.description), t('andWord'));
  const peopleCount = view.people.length > 1 ? `${view.people.length} ${t('peopleWord')}` : '';
  const context = [names, peopleCount].filter(Boolean).join(' · ');

  const lines: string[] = [`🧾 *${t('shareTitle')}* · ${t('shareTotal')} *${money(view.totalExpense)}*`];
  if (context) {
    lines.push(context);
  }
  lines.push('');

  if (view.results.length > 0) {
    lines.push(`*${t('shareSettleHeader')}*`);

    // Agrupado por quien cobra, en el orden en que aparece (el que más cobra primero).
    const byCreditor = new Map<string, { debtor: string; amount: number }[]>();
    view.results.forEach((result) => {
      byCreditor.set(result.creditor, [...(byCreditor.get(result.creditor) ?? []), { debtor: result.debtor, amount: result.amount }]);
    });

    byCreditor.forEach((payments, creditor) => {
      const collected = Math.round(payments.reduce((sum, payment) => sum + payment.amount * 100, 0)) / 100;
      lines.push('', `💸 *${creditor}* ${t('shareCollects')} *${money(collected)}*`);
      if (view.aliases[creditor]) {
        lines.push(`💳 ${t('shareAlias')}: *${view.aliases[creditor]}*`);
      }
      payments.forEach((payment) => lines.push(`• ${payment.debtor} ${t('sharePasses')} *${money(payment.amount)}*`));
    });
  } else {
    lines.push(`✅ *${t('shareAllSettled')}*`);
  }

  lines.push('', t('shareLinkHint'), link, '', `_${t('shareSignature')}_`);

  return lines.join('\n');
}
