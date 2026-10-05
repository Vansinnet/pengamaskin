// Ett kort per konto: huvudsiffran och pengarnas väg dit (vattenfallet).
import { h, s } from './dom.js';

const ROW = 30;
const LABEL_W = 104;
const BAR_X = LABEL_W;
const BAR_W = 136;
const WIDTH = 360;

/** Vattenfall: insatt → +avkastning → −avgifter → −skatt → netto → i dagens pengar. */
function flow(w, scaleMax, t, f) {
  const x = (v) => BAR_X + (Math.max(0, v) / scaleMax) * BAR_W;
  const afterReturn = w.invested + w.ret;
  const afterFees = afterReturn - w.fees;
  const signed = (v, sign) => (v < 0.5 ? f.money(0) : `${sign}${f.money(v)}`);
  const rows = [
    { key: 'invested', label: t('wInvested'), from: 0, to: w.invested, amount: f.money(w.invested) },
    { key: 'return', label: t('wReturn'), from: Math.min(w.invested, afterReturn), to: Math.max(w.invested, afterReturn),
      amount: w.ret < 0 ? `−${f.money(-w.ret)}` : signed(w.ret, '+') },
    { key: 'fees', label: t('wFees'), from: afterFees, to: afterReturn, amount: signed(w.fees, '−') },
    { key: 'tax', label: t('wTax'), from: Math.min(w.net, afterFees), to: Math.max(w.net, afterFees), amount: signed(w.tax, '−') },
    { key: 'net', label: t('wNet'), from: 0, to: w.net, amount: f.money(w.net) },
    { key: 'real', label: t('wReal'), from: 0, to: w.real, amount: f.money(w.real) },
  ];
  const ends = [w.invested, afterReturn, afterFees, w.net, w.net];

  return s('svg', { class: 'flow', viewBox: `0 0 ${WIDTH} ${rows.length * ROW}`, role: 'img',
    'aria-label': rows.map((r) => `${r.label} ${r.amount}`).join(', ') },
    rows.map((r, i) => {
      const y = i * ROW;
      const bx = x(r.from);
      const bw = Math.max(r.to - r.from > 0.5 ? 2 : 0, x(r.to) - bx);
      return s('g', null,
        s('text', { x: 0, y: y + 19 }, r.label),
        s('rect', { class: `bar-${r.key}`, x: bx, y: y + 6, width: bw, height: 18, rx: 2 }),
        s('text', { class: 'amount', x: WIDTH, y: y + 19, 'text-anchor': 'end' }, r.amount),
        i < ends.length ? s('line', { class: 'connector', x1: x(ends[i]), x2: x(ends[i]), y1: y + 24, y2: y + ROW + 6 }) : null);
    }));
}

export function renderAccounts(container, model) {
  const { t, format: f, mode } = model;
  const scaleMax = Math.max(1, ...model.accounts.map((a) => Math.max(a.waterfall.invested + a.waterfall.ret, a.waterfall.invested)));

  container.replaceChildren(...model.accounts.map((acc) => {
    const w = acc.waterfall;
    let headline;
    if (mode === 'goal') {
      headline = [
        h('p', { class: 'figure-label' }, t('youNeed')),
        h('p', { class: 'figure' }, f.money(acc.monthly), h('small', null, t('perMonth'))),
        acc.monthly === 0 ? h('p', { class: 'figure-sub' }, t('goalReached')) : null,
        !acc.reachable ? h('p', { class: 'error' }, t('goalUnreachable')) : null,
      ];
    } else {
      headline = [
        h('p', { class: 'figure-label' }, t('youGet')),
        h('p', { class: 'figure' }, f.money(w.net)),
        h('p', { class: 'figure-sub' }, t('inTodaysMoney', { amount: f.money(w.real) })),
      ];
    }
    return h('article', { class: acc.best ? 'account best' : 'account' },
      h('header', null, h('h3', null, acc.label), acc.best ? h('span', { class: 'badge' }, t('bestChoice')) : null),
      h('p', { class: 'summary' }, acc.summary),
      headline,
      acc.difference ? h('p', { class: 'difference' }, acc.difference) : null,
      flow(w, scaleMax, t, f),
      w.taxDrag > 0.5 ? h('p', { class: 'flow-note' }, t('wTaxDrag', { amount: f.money(w.taxDrag) })) : null,
      acc.overflowText ? h('p', { class: 'note' }, acc.overflowText) : null);
  }));
}
