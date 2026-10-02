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
 * Mensaje de WhatsApp corto: total, quién paga a quién y el enlace con el detalle completo.
 * Todo lo demás (gastos, saldos por persona) se ve al abrir el enlace.
 */
export function buildShareMessage(view: SummaryView, t: TranslateFn, format: FormatMoneyFn, link: string): string {
  const money = (amount: number): string => compactMoney(format(amount));

  const names = listExpenseNames(view.expenses.map((expense) => expense.description), t('andWord'));
  const peopleCount = view.people.length > 1 ? `${view.people.length} ${t('peopleWord')}` : '';
  const context = [names, peopleCount].filter(Boolean).join(' · ');

  const lines: string[] = [`🧾 *dividimos?* · ${t('shareTotal')} *${money(view.totalExpense)}*`];
  if (context) {
    lines.push(context);
  }
  lines.push('');

  if (view.results.length > 0) {
    lines.push(`*${t('sharePaymentsHeader')}*`);
    view.results.forEach((result) => {
      lines.push(`• ${result.debtor} → ${result.creditor}: *${money(result.amount)}*`);
    });

    const creditorsWithAlias = [...new Set(view.results.map((result) => result.creditor))].filter((person) => !!view.aliases[person]);
    if (creditorsWithAlias.length > 0) {
      lines.push('');
      creditorsWithAlias.forEach((person) => lines.push(`💳 *${person}*: ${view.aliases[person]}`));
    }
  } else {
    lines.push(`✅ *${t('shareAllSettled')}*`);
  }

  lines.push('', t('shareLinkHint'), link);

  return lines.join('\n');
}
