<!-- Landets skatteregler, förenklingar och källor. -->
<script lang="ts">
  import type { Translate } from '../i18n';
  import { RULES_YEAR } from '../rules/countries';
  import type { Country, Lang } from '../rules/types';

  let { country, lang, t }: { country: Country; lang: Lang; t: Translate } = $props();

  const accounts = $derived([country.standard, country.advantaged].filter((a) => a !== null));
  const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');
</script>

<section class="rules" aria-labelledby="rules-title">
  <h2 class="section-title" id="rules-title">{t('rulesTitle', { country: country.name[lang] })}</h2>
  <dl id="rules-list">
    {#each accounts as acc}<dt>{acc.label ? acc.label[lang] : t('standardAccount')}</dt><dd>{acc.summary[lang]}</dd>{/each}
  </dl>
  <p class="note" id="rules-notes">{country.notes[lang]}</p>
  <p class="meta"><span id="rules-year">{t('rulesYear', { year: RULES_YEAR })}.</span> <span id="rules-sources">{t('rulesSources')}: {#each country.sources as url, i}{i ? ', ' : ''}<a href={url} rel="noopener noreferrer">{host(url)}</a>{/each}</span></p>
</section>
