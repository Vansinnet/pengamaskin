<!-- Formuläret: läge, användarens siffror och landets skatteregler. -->
<script lang="ts">
  import type { Format, Translate } from '../i18n';
  import type { Country, Lang } from '../rules/types';
  import NumberField from './NumberField.svelte';
  import Rules from './Rules.svelte';
  import { pctLabel, type FieldId, type FormState } from './inputs';

  interface Props {
    form: FormState;
    errors: Record<FieldId, string>;
    valid: boolean;
    country: Country;
    lang: Lang;
    t: Translate;
    f: Format;
  }
  let { form = $bindable(), errors, valid, country, lang, t, f }: Props = $props();

  const adj = $derived(country.advantaged?.adjustable ?? null);
  /** Läsbart belopp bredvid beloppsfälten (1000000 → 1 000 000 kr). */
  const amount = (v: number | null) => (v !== null && Number.isFinite(v) && v >= 1000 ? f.money(v) : '');
  const feeWarning = $derived(valid && form.returnPct !== null && form.feePct > form.returnPct ? t('warnFeeAboveReturn') : '');
</script>

<form id="inputs" class="inputs" novalidate onsubmit={(e) => e.preventDefault()}>
  <fieldset class="mode">
    <legend>{t('modeLegend')}</legend>
    <label><input type="radio" name="mode" value="save" bind:group={form.mode}><span>{t('modeSave')}</span></label>
    <label><input type="radio" name="mode" value="goal" bind:group={form.mode}><span>{t('modeGoal')}</span></label>
  </fieldset>

  <h2 class="section-title">{t('inputsTitle')}</h2>

  <NumberField id="target" mode="goal" hidden={form.mode !== 'goal'} label={t('target')} output={amount(form.target)}
    unit={f.currencySymbol} help={t('targetHelp')} error={errors.target}
    inputmode="decimal" min={1} max={1000000000} step="any" bind:value={form.target}>
    <label class="check"><input type="checkbox" id="targetReal" name="targetReal" bind:checked={form.targetReal}><span>{t('targetReal')}</span></label>
  </NumberField>

  <NumberField id="initial" label={t('initial')} output={amount(form.initial)}
    unit={f.currencySymbol} help={t('initialHelp')} error={errors.initial}
    inputmode="decimal" min={0} max={100000000} step="any" bind:value={form.initial} />

  <NumberField id="monthly" mode="save" hidden={form.mode !== 'save'} label={t('monthly')} output={amount(form.monthly)}
    unit={f.currencySymbol} help={t('monthlyHelp')} error={errors.monthly}
    inputmode="decimal" min={0} max={1000000} step="any" bind:value={form.monthly} />

  <NumberField id="years" label={t('years')} unit={t('unitYears')} error={errors.years}
    inputmode="numeric" min={1} max={100} step={1} bind:value={form.years} />

  <NumberField id="returnPct" label={t('return')} unit="%" help={t('returnHelp')} error={errors.returnPct}
    inputmode="decimal" min={-50} max={100} step={0.1} bind:value={form.returnPct} />

  <div class="field">
    <label for="feePct"><span>{t('fee')}</span> <output for="feePct" id="feePct-out">{pctLabel(form.feePct, lang)}</output></label>
    <input id="feePct" name="feePct" type="range" min="0" max="5" step="0.05" bind:value={form.feePct} aria-describedby="feePct-help feePct-error">
    <p class="help" id="feePct-help">{t('feeHelp')}</p>
    <p class="error warn" id="feePct-error">{feeWarning}</p>
  </div>

  <div class="field">
    <label for="inflationPct"><span>{t('inflation')}</span> <output for="inflationPct" id="inflationPct-out">{pctLabel(form.inflationPct, lang)}</output></label>
    <input id="inflationPct" name="inflationPct" type="range" min="0" max="10" step="0.1" bind:value={form.inflationPct} aria-describedby="inflationPct-help">
    <p class="help" id="inflationPct-help">{t('inflationHelp')}</p>
  </div>

  <!-- Justerbar parameter (t.ex. ISK-schablonränta). Skapas om för varje land så att
       min/max/step finns på plats innan värdet sätts. -->
  <div class="field" id="adjust-field" hidden={!adj}>
    {#if adj}
      {#key country}
        <label for="adjust"><span id="adjust-label">{adj.label[lang]}</span> <output for="adjust" id="adjust-out">{pctLabel(form.adjust, lang)}</output></label>
        <input id="adjust" name="adjust" type="range" min={adj.min} max={adj.max} step={adj.step} bind:value={form.adjust}>
        <p class="help" id="adjust-help">{adj.hint[lang]}</p>
      {/key}
    {/if}
  </div>

  <Rules {country} {lang} {t} />
</form>
