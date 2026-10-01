import { FormatMoneyFn, SummaryView, TranslateFn } from './summary-view';

/** Texto para WhatsApp (formato con *negritas*) con el resumen completo y el enlace a la sesión. */
export function buildShareMessage(view: SummaryView, t: TranslateFn, format: FormatMoneyFn, link: string): string {
  const lines: string[] = [
    '🧾 *dividimos?*',
    '',
    `👥 *${t('peopleTitle')}*: ${view.people.join(', ')}`,
    `💰 *${t('shareTotal')}*: ${format(view.totalExpense)}`,
    ...(view.averageSpent !== null ? [`🙋 *${t('perPerson')}*: ${format(view.averageSpent)}`] : []),
    ''
  ];

  if (view.expenses.length > 0) {
    lines.push(`📋 *${t('expensesTitle')}*`);
    view.expenses.forEach((item) => {
      lines.push(`• ${item.emoji} *${item.description}*: ${format(item.amount)} (${t('paidByShort')} ${item.paidBy})`);
    });
    lines.push('');
  }

  if (view.personBalances.length > 0) {
    lines.push(`📊 *${t('personBalancesTitle')}*`);
    view.personBalances.forEach((pb) => {
      const sign = pb.netBalance > 0 ? '+' : '';
      lines.push(`• ${pb.person}: *${sign}${format(pb.netBalance)}*`);
    });
    lines.push('');
  }

  if (view.results.length > 0) {
    lines.push(`💸 *${t('sharePaymentsHeader')}*`);
    view.results.forEach((result) => {
      lines.push(`• *${result.debtor}* ${t('sharePays')} *${format(result.amount)}* ${t('shareTo')} *${result.creditor}*`);
    });
  } else {
    lines.push(`✅ *${t('shareAllSettled')}*`);
  }

  lines.push('', `📲 ${t('shareGeneratedWith')}`, t('shareLinkHint'), link);

  return lines.join('\n');
}
