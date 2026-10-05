// ============================================================
//  Formulärets tillstånd och validering (ren logik, utan DOM).
// ============================================================
import type { Translate } from '../i18n';
import type { Country, Lang } from '../rules/types';
import type { Mode, ModelInput } from './model';

export type FieldId = 'initial' | 'monthly' | 'target' | 'years' | 'returnPct';

/** Formulärets värden. Tomma eller ogiltiga sifferfält är null. */
export interface FormState {
  mode: Mode;
  initial: number | null;
  monthly: number | null;
  target: number | null;
  targetReal: boolean;
  years: number | null;
  returnPct: number | null;
  feePct: number;
  inflationPct: number;
  /** värdet för landets justerbara parameter (t.ex. ISK-schablonräntan), annars null */
  adjust: number | null;
}

/** Giltiga intervall per fält. `mode`: fältet visas och valideras bara i det läget. */
export const LIMITS: Record<FieldId, { min: number; max: number; integer?: boolean; mode?: Mode }> = {
  initial: { min: 0, max: 1e8 },
  monthly: { min: 0, max: 1e6, mode: 'save' },
  target: { min: 1, max: 1e9, mode: 'goal' },
  years: { min: 1, max: 100, integer: true },
  returnPct: { min: -50, max: 100 },
};

export const initialForm = (country: Country): FormState => ({
  mode: 'save',
  initial: 10000,
  monthly: 1000,
  target: 1000000,
  targetReal: false,
  years: 20,
  returnPct: 7,
  feePct: 0.3,
  inflationPct: 2,
  adjust: defaultAdjust(country),
});

/** Landets standardvärde för den justerbara parametern. */
export function defaultAdjust(country: Country): number | null {
  const adj = country.advantaged?.adjustable;
  return adj ? (country.advantaged!.params as Record<string, number>)[adj.key] : null;
}

/** Felmeddelande per fält ('' = inget fel). */
export function fieldErrors(form: FormState, t: Translate, lang: Lang): Record<FieldId, string> {
  const errors = {} as Record<FieldId, string>;
  for (const [id, { min, max, integer, mode }] of Object.entries(LIMITS) as [FieldId, (typeof LIMITS)[FieldId]][]) {
    const v = form[id];
    const active = !mode || mode === form.mode;
    let error = '';
    if (active && (v === null || !Number.isFinite(v) || v < min || v > max)) {
      error = t('errorRange', { min: min.toLocaleString(lang), max: max.toLocaleString(lang) });
    } else if (active && integer && !Number.isInteger(v)) {
      error = t('errorInteger');
    }
    errors[id] = error;
  }
  return errors;
}

/** Indata till vymodellen, eller null om något fält är ogiltigt. */
export function toModelInput(form: FormState, errors: Record<FieldId, string>, lang: Lang, country: Country, code: ModelInput['country']): ModelInput | null {
  if (Object.values(errors).some(Boolean)) return null;
  const adj = country.advantaged?.adjustable;
  const num = (v: number | null) => v ?? NaN;
  return {
    lang, country: code, mode: form.mode,
    initial: num(form.initial), monthly: num(form.monthly), target: num(form.target),
    targetReal: form.targetReal,
    years: num(form.years), returnPct: num(form.returnPct),
    feePct: form.feePct, inflationPct: form.inflationPct,
    adjust: adj && form.adjust !== null ? { [adj.key]: form.adjust } : {},
  };
}

/** Procent i etiketterna: 0,3 % / 0.3 %. */
export const pctLabel = (v: number | null, lang: Lang) =>
  v === null ? '' : `${v.toLocaleString(lang, { maximumFractionDigits: 2 })} %`;
