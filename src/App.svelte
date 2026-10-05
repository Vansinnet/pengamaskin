<!--
  Pengamaskinen. Formulärets värden → vymodellen (view/model.ts) → resultatet.
  Allt räknas i webbläsaren; bara språk, land och tema sparas (localStorage).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { formatters, translator } from './i18n';
  import { COUNTRIES, RULES_VERIFIED } from './rules/countries';
  import type { CountryCode, Lang } from './rules/types';
  import InputForm from './view/InputForm.svelte';
  import Masthead from './view/Masthead.svelte';
  import Results from './view/Results.svelte';
  import { defaultAdjust, fieldErrors, initialForm, toModelInput } from './view/inputs';
  import { buildModel, type Model, type ModelInput } from './view/model';
  import { loadPrefs, savePref, type Theme } from './view/prefs';

  // Startläget är detsamma på servern (förrenderingen) och i webbläsaren, så att
  // hydreringen matchar. Sparade val läses in direkt efter (onMount).
  let lang = $state<Lang>('sv');
  let code = $state<CountryCode>('SE');
  let theme = $state<Theme | null>(null);
  let form = $state(initialForm(COUNTRIES.SE));

  const t = $derived(translator(lang));
  const country = $derived(COUNTRIES[code]);
  const f = $derived(formatters(country, lang));
  const errors = $derived(fieldErrors(form, t, lang));
  const input = $derived(toModelInput(form, errors, lang, country, code));

  // Vid ogiltiga fält visas senaste giltiga resultat (nedtonat).
  let last: { input: ModelInput; model: Model };
  const view = $derived.by(() => {
    if (input) last = { input, model: buildModel(input) };
    return last;
  });

  function selectCountry(next: CountryCode) {
    code = next;
    form.adjust = defaultAdjust(COUNTRIES[next]);
  }

  onMount(() => {
    const prefs = loadPrefs();
    lang = prefs.lang;
    theme = prefs.theme;
    if (prefs.country !== code) selectCountry(prefs.country);
  });

  $effect(() => {
    document.documentElement.lang = lang;
    document.title = `${t('appName')} – ${t('tagline')}`;
  });
  $effect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  });
</script>

<a class="skip" href="#inputs">{t('skipLink')}</a>

<Masthead {t} {lang} country={code} {theme}
  onlang={(next) => { lang = next; savePref('pm-lang', next); }}
  oncountry={(next) => { selectCountry(next); savePref('pm-country', next); }}
  ontheme={() => { theme = theme === 'dark' ? 'light' : 'dark'; savePref('pm-theme', theme); }} />

<main class="layout">
  <InputForm bind:form {errors} valid={input !== null} {country} {lang} {t} {f} />
  <Results input={view.input} model={view.model} valid={input !== null} {t} />
</main>

<footer class="footer">
  <p class="quote">{t('quote')}</p>
  <p>{t('footerDisclaimer')}</p>
  <p><span id="footer-verified">{t('rulesVerified', { date: RULES_VERIFIED })}</span> <a href="https://github.com/Vansinnet/pengamaskin">{t('footerSource')}</a></p>
</footer>
