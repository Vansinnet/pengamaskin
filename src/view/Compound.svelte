<!-- Ränta-på-ränta: insättningar, enkel ränta och ränta-på-ränta med användarens siffror. -->
<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import type { Model } from './model';

  let { model }: { model: Model } = $props();
  const { compound: c, t, format: f, years } = $derived(model);
  const max = $derived(Math.max(1, c.compound, c.simple, c.deposits));
  const bars = $derived([
    { label: t('compoundDeposits'), value: c.deposits, cls: '' },
    { label: t('compoundSimple'), value: c.simple, cls: 'simple' },
    { label: t('compoundCompound'), value: c.compound, cls: 'compound-fill' },
  ]);

  // Bredden sätts via CSSOM i webbläsaren (tillåtet av CSP utan 'unsafe-inline'),
  // aldrig som style-attribut i HTML.
  const width = (fraction: number): Attachment<HTMLElement> => (el) => {
    el.style.width = `${(fraction * 100).toFixed(2)}%`;
  };
</script>

<div class="compound">
  <p>{t('compoundWithYourNumbers', { years })}</p>
  {#each bars as bar (bar.cls)}
    <div class="row">
      <span>{bar.label}</span>
      <div class="track">
        <div class={bar.cls ? `fill ${bar.cls}` : 'fill'} {@attach width(bar.value / max)}></div>
        <span class="value">{f.money(bar.value)}</span>
      </div>
    </div>
  {/each}
  <p>{t('compoundShare', { share: f.pct(c.share) })}</p>
</div>
