import { FormatMoneyFn, SummaryView, TranslateFn } from './summary-view';

/** Dibuja el resumen como imagen (2x para pantallas retina). Devuelve `null` si el navegador no da contexto 2D. */
export function renderSummaryCanvas(view: SummaryView, t: TranslateFn, format: FormatMoneyFn): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const width = 750;
  const padding = 30;

  const personCount = view.personBalances.length;
  const settlementCount = view.results.length;

  const headerH = 100;
  const summaryH = 100;
  const personBalancesH = personCount > 0 ? 45 + personCount * 40 : 0;
  const settlementsH = settlementCount > 0 ? 55 + settlementCount * 46 : 60;
  const footerH = 50;

  const height = padding * 2 + headerH + summaryH + personBalancesH + settlementsH + footerH;

  canvas.width = width * 2;
  canvas.height = height * 2;
  ctx.scale(2, 2);

  // Fondo degradado dark
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0f172a');
  bgGradient.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Card principal
  const cardX = padding;
  const cardY = padding;
  const cardW = width - padding * 2;
  const cardH = height - padding * 2;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20, true, true);

  let curY = cardY + 40;

  // Header logo
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('d/', cardX + 30, curY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('dividimos?', cardX + 60, curY);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('https://dividimos.vercel.app', cardX + cardW - 30, curY);
  ctx.textAlign = 'left';

  curY += 35;

  // Divisor
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(cardX + 30, curY);
  ctx.lineTo(cardX + cardW - 30, curY);
  ctx.stroke();

  curY += 25;

  // Cajas de resumen (Total y Promedio)
  const boxW = (cardW - 75) / 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  roundRect(ctx, cardX + 30, curY, boxW, 75, 12, true, false);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText(t('totalSpent').toUpperCase(), cardX + 45, curY + 25);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(format(view.totalExpense), cardX + 45, curY + 56);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  roundRect(ctx, cardX + 45 + boxW, curY, boxW, 75, 12, true, false);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  // Con gastos repartidos de forma desigual no hay un "promedio por persona" que tenga sentido: mostramos la cantidad de gastos.
  const hasAverage = view.averageSpent !== null;
  ctx.fillText((hasAverage ? t('perPerson') : t('expensesTitle')).toUpperCase(), cardX + 60 + boxW, curY + 25);
  ctx.fillStyle = '#c084fc';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(hasAverage ? format(view.averageSpent as number) : String(view.expenses.length), cardX + 60 + boxW, curY + 56);

  curY += 95;

  // Resumen por persona
  if (view.personBalances.length > 0) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(t('personBalancesTitle'), cardX + 30, curY);
    curY += 20;

    view.personBalances.forEach((pb) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      roundRect(ctx, cardX + 30, curY, cardW - 60, 34, 8, true, false);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px sans-serif';
      ctx.fillText(pb.person, cardX + 45, curY + 22);

      const sign = pb.netBalance > 0 ? '+' : '';
      const netStr = sign + format(pb.netBalance);
      ctx.textAlign = 'right';
      ctx.fillStyle = pb.netBalance > 0 ? '#4ade80' : pb.netBalance < 0 ? '#f87171' : '#94a3b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(netStr, cardX + cardW - 45, curY + 22);
      ctx.textAlign = 'left';

      curY += 38;
    });

    curY += 15;
  }

  // Liquidación final
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(t('settlementsTitle'), cardX + 30, curY);
  curY += 20;

  if (view.results.length === 0) {
    ctx.fillStyle = '#4ade80';
    ctx.font = '14px sans-serif';
    ctx.fillText('😎 ' + t('allSettled'), cardX + 30, curY + 20);
    curY += 40;
  } else {
    view.results.forEach((res) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      roundRect(ctx, cardX + 30, curY, cardW - 60, 38, 10, true, false);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(res.debtor, cardX + 45, curY + 24);

      const debtorW = ctx.measureText(res.debtor).width;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(` ${t('sharePays')} `, cardX + 48 + debtorW, curY + 24);

      const paysW = ctx.measureText(` ${t('sharePays')} `).width;
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(res.creditor, cardX + 48 + debtorW + paysW, curY + 24);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(format(res.amount), cardX + cardW - 45, curY + 24);
      ctx.textAlign = 'left';

      curY += 44;
    });
  }

  curY += 10;
  ctx.fillStyle = '#64748b';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('shareGeneratedWith'), cardX + cardW / 2, curY + 15);
  ctx.textAlign = 'left';


  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: boolean, stroke: boolean): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
