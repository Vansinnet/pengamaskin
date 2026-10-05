import type { Country, Lang } from '../rules/types';
import sv, { type TextKey } from './sv';
import en from './en';

export type { TextKey };

export const LANGUAGES: Record<Lang, { name: string; texts: Record<TextKey, string> }> = {
  sv: { name: 'Svenska', texts: sv },
  en: { name: 'English', texts: en },
};

export type Translate = (key: TextKey, vars?: Record<string, string | number>) => string;

/** t('key', { name: värde }) — ersätter {name} i texten. */
export function translator(lang: Lang): Translate {
  const texts = LANGUAGES[lang]?.texts ?? sv;
  return (key, vars = {}) =>
    (texts[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export interface Format {
  money(v: number): string;
  pct(fraction: number): string;
  currencySymbol: string;
  compact(v: number): string;
}

/** Formatterare: landets valuta, skriven som språket användaren valt (1 000 € på svenska, €1,000 på engelska). */
export function formatters(country: Pick<Country, 'currency'>, lang: Lang): Format {
  const uiLocale = lang === 'sv' ? 'sv-SE' : 'en-GB';
  const money = new Intl.NumberFormat(uiLocale, { style: 'currency', currency: country.currency, maximumFractionDigits: 0 });
  const pct = new Intl.NumberFormat(uiLocale, { style: 'percent', maximumFractionDigits: 2 });
  return {
    money: (v) => money.format(Math.round(v) || 0),
    pct: (fraction) => pct.format(fraction),
    currencySymbol: money.formatToParts(0).find((p) => p.type === 'currency')!.value,
    // Axeletiketter: hela tal upp till en miljon, därefter kort form (1,5 mn / 1.5M)
    compact: (v) => new Intl.NumberFormat(uiLocale, v >= 1e6
      ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(v),
  };
}
