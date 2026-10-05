// Användarens val (språk, land, tema) sparas i localStorage — ingenting annat.
import { LANGUAGES } from '../i18n';
import { COUNTRIES } from '../rules/countries';
import type { CountryCode, Lang } from '../rules/types';

export type Theme = 'light' | 'dark';

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

export function savePref(key: 'pm-lang' | 'pm-country' | 'pm-theme', value: string) {
  try { localStorage.setItem(key, value); } catch { /* privat läge */ }
}

/** Sparade val, annars webbläsarens språk och färgschema. */
export function loadPrefs(): { lang: Lang; country: CountryCode; theme: Theme } {
  const lang = read('pm-lang') || (navigator.language?.startsWith('sv') ? 'sv' : 'en');
  const country = read('pm-country') || 'SE';
  const theme = read('pm-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  return {
    lang: Object.hasOwn(LANGUAGES, lang) ? (lang as Lang) : 'sv',
    country: Object.hasOwn(COUNTRIES, country) ? (country as CountryCode) : 'SE',
    theme: theme === 'dark' ? 'dark' : 'light',
  };
}
