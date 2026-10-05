<!-- Sidhuvud: logotyp, land, språk och tema. -->
<script lang="ts">
  import { LANGUAGES, type Translate } from '../i18n';
  import { COUNTRIES, REGIONS } from '../rules/countries';
  import type { CountryCode, Lang } from '../rules/types';
  import { FLAGS } from './flags';
  import type { Theme } from './prefs';

  interface Props {
    t: Translate;
    lang: Lang;
    country: CountryCode;
    theme: Theme | null;
    onlang: (lang: Lang) => void;
    oncountry: (code: CountryCode) => void;
    ontheme: () => void;
  }
  let { t, lang, country, theme, onlang, oncountry, ontheme }: Props = $props();

  const codes = Object.keys(COUNTRIES) as CountryCode[];
  const groups = $derived(REGIONS.map((region) => ({
    name: region.name[lang],
    countries: codes.filter((c) => COUNTRIES[c].region === region.id)
      .sort((a, b) => COUNTRIES[a].name[lang].localeCompare(COUNTRIES[b].name[lang], lang)),
  })));
  const flag = $derived(`data:image/svg+xml,${encodeURIComponent(FLAGS[country])}`);
</script>

<header class="masthead">
  <div class="brand">
    <svg class="coin" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15"/><circle cx="16" cy="16" r="11" class="coin-ring"/><path d="M12 22V10h5a3.5 3.5 0 0 1 0 7h-5" class="coin-p"/></svg>
    <div>
      <h1>{t('appName')}</h1>
      <p class="tagline">{t('tagline')}</p>
    </div>
  </div>
  <div class="settings">
    <label class="setting">
      <span>{t('settingsCountry')}</span>
      <span class="select-with-flag"><img id="flag" alt="" width="20" height="14" src={flag}><select id="country" bind:value={() => country, (v) => oncountry(v)}>
        {#each groups as group (group.name)}
          <optgroup label={group.name}>
            {#each group.countries as code (code)}<option value={code}>{COUNTRIES[code].name[lang]}</option>{/each}
          </optgroup>
        {/each}
      </select></span>
    </label>
    <label class="setting">
      <span>{t('settingsLanguage')}</span>
      <select id="lang" bind:value={() => lang, (v) => onlang(v)}>
        {#each Object.entries(LANGUAGES) as [code, { name }] (code)}<option value={code}>{name}</option>{/each}
      </select>
    </label>
    <button type="button" id="theme" class="theme-toggle" aria-label={t(theme === 'dark' ? 'themeToLight' : 'themeToDark')} onclick={ontheme}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path class="sun" d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path class="moon" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>
    </button>
  </div>
</header>
