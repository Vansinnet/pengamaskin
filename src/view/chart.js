// Tidslinjediagram (SVG): insatt, värde före skatt och netto per konto.
// Välj år med mus/finger eller piltangenterna; siffrorna visas under diagrammet.
import { h, s } from './dom.js';

const H = 260;
const PAD = { left: 62, right: 14, top: 12, bottom: 28 };

function niceTicks(max, count = 4) {
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => st >= raw) || raw;
  const ticks = [0];
  while (ticks.at(-1) < max) ticks.push(ticks.length * step);
  return ticks;
}

export function renderChart(container, readout, model) {
  const { timeline, accounts, t, format: f } = model;
  // Rita i containerns faktiska bredd så att texten behåller sin storlek på mobil
  const W = Math.max(300, Math.min(760, container.clientWidth || 640));
  const n = timeline.length;
  const max = Math.max(1, ...timeline.flatMap((r) => [r.beforeTax, r.invested, ...r.net]));
  const ticks = niceTicks(max);
  const top = ticks.at(-1);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v) => PAD.top + plotH - (Math.max(0, v) / top) * plotH;
  const path = (get) => timeline.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(get(r)).toFixed(1)}`).join('');
  const lineClass = (i) => `line-${accounts.length === 1 ? 1 : i}`;
  const step = Math.max(1, Math.ceil((n - 1) / 6));

  const cursor = s('line', { class: 'cursor', y1: PAD.top, y2: PAD.top + plotH });
  const dots = accounts.map((_, i) => s('circle', { class: 'dot', r: 4, fill: `var(--${accounts.length === 1 || i === 1 ? 'net' : 'ink'})` }));

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', tabindex: 0, 'aria-label': t('chartLabel') },
    ticks.map((v) => s('g', null,
      s('line', { class: 'grid', x1: PAD.left, x2: W - PAD.right, y1: y(v), y2: y(v) }),
      s('text', { x: PAD.left - 8, y: y(v) + 4, 'text-anchor': 'end' }, f.compact(v)))),
    timeline.map((r, i) => (i % step === 0 || i === n - 1)
      ? s('text', { x: x(i), y: H - 8, 'text-anchor': 'middle' }, String(r.year)) : null),
    s('path', { class: 'area-invested', d: `${path((r) => r.invested)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z` }),
    s('path', { class: 'line-invested', d: path((r) => r.invested) }),
    s('path', { class: 'line-before', d: path((r) => r.beforeTax) }),
    accounts.map((_, i) => s('path', { class: lineClass(i), d: path((r) => r.net[i]) })),
    cursor, dots);

  let selected = n - 1;
  const select = (i) => {
    selected = Math.min(n - 1, Math.max(0, i));
    const r = timeline[selected];
    cursor.setAttribute('x1', x(selected));
    cursor.setAttribute('x2', x(selected));
    dots.forEach((d, k) => { d.setAttribute('cx', x(selected)); d.setAttribute('cy', y(r.net[k])); });
    readout.replaceChildren(h('dl', { class: 'readout' },
      [[t('thYear'), String(r.year)], [t('thInvested'), f.money(r.invested)], [t('thBeforeTax'), f.money(r.beforeTax)],
        ...accounts.map((a, k) => [t('thAfterTax', { account: a.label }), f.money(r.net[k])])]
        .map(([dt, dd]) => h('div', null, h('dt', null, dt), h('dd', null, dd)))));
  };

  const fromPointer = (e) => {
    const box = svg.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    select(Math.round(((px - PAD.left) / plotW) * (n - 1)));
  };
  svg.addEventListener('pointermove', fromPointer);
  svg.addEventListener('pointerdown', fromPointer);
  svg.addEventListener('keydown', (e) => {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 };
    if (e.key in moves) select(selected + moves[e.key]);
    else if (e.key === 'Home') select(0);
    else if (e.key === 'End') select(n - 1);
    else return;
    e.preventDefault();
  });

  const legend = h('div', { class: 'legend' },
    h('span', { class: 'k-invested' }, t('legendInvested')),
    h('span', { class: 'k-before' }, t('thBeforeTax')),
    accounts.map((a, i) => h('span', { class: `k-${accounts.length === 1 ? 1 : i}` }, a.label)));

  container.replaceChildren(svg, legend);
  select(n - 1);
}

export function renderTable(table, model) {
  const { timeline, accounts, t, format: f } = model;
  table.replaceChildren(
    h('thead', null, h('tr', null,
      [t('thYear'), t('thInvested'), t('thReturnTotal'), t('thReturnYear'), t('thBeforeTax'),
        ...accounts.map((a) => t('thAfterTax', { account: a.label }))]
        .map((c) => h('th', { scope: 'col' }, c)))),
    h('tbody', null, timeline.map((r, i) => h('tr', null,
      h('th', { scope: 'row' }, String(r.year)),
      h('td', null, f.money(r.invested)),
      h('td', null, f.money(r.beforeTax - r.invested)),
      h('td', null, i ? f.money(r.beforeTax - r.invested - (timeline[i - 1].beforeTax - timeline[i - 1].invested)) : '–'),
      h('td', null, f.money(r.beforeTax)),
      r.net.map((v) => h('td', null, f.money(v)))))));
}
