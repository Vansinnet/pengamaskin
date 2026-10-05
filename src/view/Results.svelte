<!-- Resultatet: konton, förklaringar, tidslinje och ränta-på-ränta. -->
<script lang="ts">
  import type { Translate } from '../i18n';
  import AccountCard from './AccountCard.svelte';
  import Compound from './Compound.svelte';
  import Explain from './Explain.svelte';
  import TimelineChart from './TimelineChart.svelte';
  import TimelineTable from './TimelineTable.svelte';
  import type { Model, ModelInput } from './model';

  interface Props {
    /** senaste giltiga indata och dess vymodell */
    input: ModelInput;
    model: Model;
    /** false när ett fält är ogiltigt: senaste resultatet visas nedtonat */
    valid: boolean;
    /** texter för aktuellt språk */
    t: Translate;
  }
  let { input, model, valid, t }: Props = $props();

  const f = $derived(model.format);
  const mt = $derived(model.t);
  const scaleMax = $derived(Math.max(1, ...model.accounts.map((a) => Math.max(a.waterfall.invested + a.waterfall.ret, a.waterfall.invested))));
  const title = $derived(input.mode === 'goal'
    ? mt('resultGoalTitle', { target: f.money(input.target), years: input.years })
    : mt('resultSaveTitle', { years: input.years }));
  const goalNote = $derived(input.mode === 'goal' && input.targetReal && model.target
    ? mt('goalNominal', { amount: f.money(model.target.nominal), years: input.years }) : '');
  const timelineNote = $derived(input.mode === 'goal' && model.accounts.length > 1
    ? mt('timelineMonthly', { amount: f.money(model.timelineMonthly) }) : '');
</script>

<div class={valid ? 'results' : 'results stale'} id="results" aria-busy={valid ? undefined : 'true'}>
  <h2 class="result-title" id="result-title" aria-live="polite">{title}</h2>
  <p class="goal-note" id="goal-note">{goalNote}</p>
  <div class="accounts" id="accounts">
    {#each model.accounts as acc (acc.key)}<AccountCard {acc} mode={model.mode} {scaleMax} t={mt} {f} />{/each}
  </div>

  <details class="panel">
    <summary>{t('explainTitle')}</summary>
    <div id="explain"><Explain {model} /></div>
  </details>

  <section class="panel timeline" aria-labelledby="timeline-title">
    <h2 class="section-title" id="timeline-title">{t('timelineTitle')}</h2>
    <p class="timeline-note" id="timeline-note">{timelineNote}</p>
    <TimelineChart {model} />
    <details>
      <summary id="table-toggle">{t('showTable')}</summary>
      <div class="table-wrap"><table id="table"><TimelineTable {model} /></table></div>
    </details>
  </section>

  <details class="panel">
    <summary>{t('compoundTitle')}</summary>
    <p>{t('compoundText')}</p>
    <div id="compound"><Compound {model} /></div>
  </details>
</div>
