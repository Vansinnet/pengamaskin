<!-- Vattenfall: insatt → +avkastning → −avgifter → −skatt → netto → i dagens pengar. -->
<script lang="ts">
  import type { Format, Translate } from '../i18n';
  import type { Waterfall } from './model';

  let { w, scaleMax, t, f }: { w: Waterfall; scaleMax: number; t: Translate; f: Format } = $props();

  const ROW = 30;
  const LABEL_W = 104;
  const BAR_X = LABEL_W;
  const BAR_W = 136;
  const WIDTH = 360;

  const x = (v: number) => BAR_X + (Math.max(0, v) / scaleMax) * BAR_W;
  const signed = (v: number, sign: string) => (v < 0.5 ? f.money(0) : `${sign}${f.money(v)}`);

  const afterReturn = $derived(w.invested + w.ret);
  const afterFees = $derived(afterReturn - w.fees);
  const rows = $derived([
    { key: 'invested', label: t('wInvested'), from: 0, to: w.invested, amount: f.money(w.invested) },
    { key: 'return', label: t('wReturn'), from: Math.min(w.invested, afterReturn), to: Math.max(w.invested, afterReturn),
      amount: w.ret < 0 ? `−${f.money(-w.ret)}` : signed(w.ret, '+') },
    { key: 'fees', label: t('wFees'), from: afterFees, to: afterReturn, amount: signed(w.fees, '−') },
    { key: 'tax', label: t('wTax'), from: Math.min(w.net, afterFees), to: Math.max(w.net, afterFees), amount: signed(w.tax, '−') },
    { key: 'net', label: t('wNet'), from: 0, to: w.net, amount: f.money(w.net) },
    { key: 'real', label: t('wReal'), from: 0, to: w.real, amount: f.money(w.real) },
  ]);
  const ends = $derived([w.invested, afterReturn, afterFees, w.net, w.net]);
</script>

<svg class="flow" viewBox="0 0 {WIDTH} {rows.length * ROW}" role="img" aria-label={rows.map((r) => `${r.label} ${r.amount}`).join(', ')}>
  {#each rows as r, i (r.key)}
    {@const y = i * ROW}
    {@const bx = x(r.from)}
    <g>
      <text x="0" y={y + 19}>{r.label}</text>
      <rect class="bar-{r.key}" x={bx} y={y + 6} width={Math.max(r.to - r.from > 0.5 ? 2 : 0, x(r.to) - bx)} height="18" rx="2"></rect>
      <text class="amount" x={WIDTH} y={y + 19} text-anchor="end">{r.amount}</text>
      {#if i < ends.length}<line class="connector" x1={x(ends[i])} x2={x(ends[i])} y1={y + 24} y2={y + ROW + 6}></line>{/if}
    </g>
  {/each}
</svg>
