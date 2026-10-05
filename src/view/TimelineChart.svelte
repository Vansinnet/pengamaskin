<!--
  Tidslinjediagram (SVG): insatt, värde före skatt och netto per konto.
  Välj år med mus/finger eller piltangenterna; siffrorna visas under diagrammet.
-->
<script lang="ts">
  import type { Model, TimelineRow } from './model';

  let { model }: { model: Model } = $props();

  const H = 260;
  const PAD = { left: 62, right: 14, top: 12, bottom: 28 };

  function niceTicks(max: number, count = 4) {
    const raw = max / count;
    const mag = 10 ** Math.floor(Math.log10(raw || 1));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => st >= raw) || raw;
    const ticks = [0];
    while (ticks.at(-1)! < max) ticks.push(ticks.length * step);
    return ticks;
  }

  // Rita i containerns faktiska bredd så att texten behåller sin storlek på mobil
  let clientWidth = $state(0);
  const W = $derived(Math.max(300, Math.min(760, clientWidth || 640)));

  const { timeline, accounts, t, format: f } = $derived(model);
  const n = $derived(timeline.length);
  const ticks = $derived(niceTicks(Math.max(1, ...timeline.flatMap((r) => [r.beforeTax, r.invested, ...r.net]))));
  const top = $derived(ticks.at(-1)!);
  const plotW = $derived(W - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (Math.max(0, v) / top) * plotH;
  const path = (get: (r: TimelineRow) => number) => timeline.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(get(r)).toFixed(1)}`).join('');
  const lineClass = (i: number) => `line-${accounts.length === 1 ? 1 : i}`;
  const step = $derived(Math.max(1, Math.ceil((n - 1) / 6)));

  // Valt år: sista året efter varje ny beräkning.
  let selected = $derived(timeline.length - 1);
  const row = $derived(timeline[selected]);
  const select = (i: number) => { selected = Math.min(n - 1, Math.max(0, i)); };

  function fromPointer(e: PointerEvent) {
    const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    select(Math.round(((px - PAD.left) / plotW) * (n - 1)));
  }

  const MOVES: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 };
  function onkeydown(e: KeyboardEvent) {
    if (e.key in MOVES) select(selected + MOVES[e.key]);
    else if (e.key === 'Home') select(0);
    else if (e.key === 'End') select(n - 1);
    else return;
    e.preventDefault();
  }
</script>

<div id="chart" class="chart" bind:clientWidth>
  <!-- Diagrammet är en bild som går att styra med tangentbordet; uppläsningen sker i #chart-readout. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <svg viewBox="0 0 {W} {H}" role="img" tabindex="0" aria-label={t('chartLabel')}
    onpointermove={fromPointer} onpointerdown={fromPointer} {onkeydown}>
    {#each ticks as v (v)}
      <g><line class="grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)}></line><text x={PAD.left - 8} y={y(v) + 4} text-anchor="end">{f.compact(v)}</text></g>
    {/each}
    {#each timeline as r, i (r.year)}
      {#if i % step === 0 || i === n - 1}<text x={x(i)} y={H - 8} text-anchor="middle">{r.year}</text>{/if}
    {/each}
    <path class="area-invested" d="{path((r) => r.invested)}L{x(n - 1)},{y(0)}L{x(0)},{y(0)}Z"></path>
    <path class="line-invested" d={path((r) => r.invested)}></path>
    <path class="line-before" d={path((r) => r.beforeTax)}></path>
    {#each accounts as acc, i (acc.key)}<path class={lineClass(i)} d={path((r) => r.net[i])}></path>{/each}
    <line class="cursor" y1={PAD.top} y2={PAD.top + plotH} x1={x(selected)} x2={x(selected)}></line>
    {#each accounts as acc, k (acc.key)}
      <circle class="dot" r="4" fill="var(--{accounts.length === 1 || k === 1 ? 'net' : 'ink'})" cx={x(selected)} cy={y(row.net[k])}></circle>
    {/each}
  </svg>
  <div class="legend">
    <span class="k-invested">{t('legendInvested')}</span>
    <span class="k-before">{t('thBeforeTax')}</span>
    {#each accounts as acc, i (acc.key)}<span class="k-{accounts.length === 1 ? 1 : i}">{acc.label}</span>{/each}
  </div>
</div>
<div id="chart-readout" class="readout" aria-live="polite">
  <dl class="readout">
    {#each [[t('thYear'), String(row.year)], [t('thInvested'), f.money(row.invested)], [t('thBeforeTax'), f.money(row.beforeTax)],
      ...accounts.map((a, k) => [t('thAfterTax', { account: a.label }), f.money(row.net[k])])] as [dt, dd]}
      <div><dt>{dt}</dt><dd>{dd}</dd></div>
    {/each}
  </dl>
</div>
