<!-- Ett konto: huvudsiffran och pengarnas väg dit. -->
<script lang="ts">
  import type { Format, Translate } from '../i18n';
  import Flow from './Flow.svelte';
  import type { AccountView, Mode } from './model';

  let { acc, mode, scaleMax, t, f }: { acc: AccountView; mode: Mode; scaleMax: number; t: Translate; f: Format } = $props();
  const w = $derived(acc.waterfall);
</script>

<article class={acc.best ? 'account best' : 'account'}>
  <header><h3>{acc.label}</h3>{#if acc.best}<span class="badge">{t('bestChoice')}</span>{/if}</header>
  <p class="summary">{acc.summary}</p>
  {#if mode === 'goal'}
    <p class="figure-label">{t('youNeed')}</p>
    <p class="figure">{f.money(acc.monthly)}<small>{t('perMonth')}</small></p>
    {#if acc.monthly === 0}<p class="figure-sub">{t('goalReached')}</p>{/if}
    {#if !acc.reachable}<p class="error">{t('goalUnreachable')}</p>{/if}
  {:else}
    <p class="figure-label">{t('youGet')}</p>
    <p class="figure">{f.money(w.net)}</p>
    <p class="figure-sub">{t('inTodaysMoney', { amount: f.money(w.real) })}</p>
  {/if}
  {#if acc.difference}<p class="difference">{acc.difference}</p>{/if}
  <Flow {w} {scaleMax} {t} {f} />
  {#if w.taxDrag > 0.5}<p class="flow-note">{t('wTaxDrag', { amount: f.money(w.taxDrag) })}</p>{/if}
  {#if acc.overflowText}<p class="note">{acc.overflowText}</p>{/if}
</article>
