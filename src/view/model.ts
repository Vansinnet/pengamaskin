// ============================================================
//  Vymodell: användarens indata → allt som ska visas.
//  Ren funktion utan DOM — testas i tests/model.test.ts.
// ============================================================
import { simulate, schedule } from '../engine/simulate';
import { simulateAccount, monthlyGrowth, type AccountResult } from '../engine/account';
import { solveMonthly } from '../engine/goal';
import { REGIMES } from '../engine/regimes';
import type { Row } from '../engine/types';
import { COUNTRIES } from '../rules/countries';
import type { AccountDef, Country, CountryCode, Lang } from '../rules/types';
import { translator, formatters, type Format, type Translate } from '../i18n';

export type Mode = 'save' | 'goal';

export interface ModelInput {
  lang: Lang;
  country: CountryCode;
  mode: Mode;
  initial: number;
  monthly: number;
  target: number;
  targetReal: boolean;
  years: number;
  returnPct: number;
  feePct: number;
  inflationPct: number;
  /** användarjusterade parametrar för det skattegynnade kontot (t.ex. { schablonRate: 3.55 }) */
  adjust: Record<string, number>;
}

/** Pengarnas väg: insatt → +avkastning → −avgifter → −skatt → netto → i dagens pengar. */
export interface Waterfall {
  invested: number;
  ret: number;
  fees: number;
  tax: number;
  taxDrag: number;
  net: number;
  real: number;
}

export interface AccountView {
  key: 'standard' | 'advantaged';
  label: string;
  summary: string;
  monthly: number;
  reachable: boolean;
  result: AccountResult;
  waterfall: Waterfall;
  overflowText: string | null;
  explain: string[];
  best?: boolean;
  difference?: string;
}

export interface TimelineRow {
  year: number;
  invested: number;
  beforeTax: number;
  net: number[];
}

export interface Model {
  country: Country;
  mode: Mode;
  years: number;
  growth: number;
  accounts: AccountView[];
  timeline: TimelineRow[];
  timelineMonthly: number;
  compound: { deposits: number; simple: number; compound: number; share: number };
  general: string[];
  target: { nominal: number; input: number; real: boolean } | null;
  format: Format;
  t: Translate;
}

/** Kontots värde år för år utan skatt (för avgifter, "före skatt" och ränta-på-ränta). */
function untaxed(initial: number, monthly: number, growth: number, years: number): Row[] {
  return simulate({ deposits: schedule(initial, monthly, years), growth, years, regime: REGIMES.TAX_FREE, params: {} }).rows;
}

/** Värdet om avkastningen bara räknades på det insatta beloppet (enkel ränta). */
function simpleInterest(initial: number, monthly: number, annualReturn: number, years: number): number {
  const months = years * 12;
  let total = initial * (1 + annualReturn * years);
  for (let m = 1; m <= months; m++) total += monthly * (1 + annualReturn * (months - m) / 12);
  return total;
}

export function buildModel(input: ModelInput): Model {
  const country = COUNTRIES[input.country];
  const t = translator(input.lang);
  const f = formatters(country, input.lang);
  const { initial, years, returnPct, feePct, inflationPct, mode } = input;

  const growth = monthlyGrowth(returnPct, feePct);
  const grossGrowth = monthlyGrowth(returnPct);
  const inflationFactor = Math.pow(1 + inflationPct / 100, years);
  const targetNominal = mode === 'goal' ? (input.targetReal ? input.target * inflationFactor : input.target) : null;

  const accountDefs: { key: AccountView['key']; advantaged: boolean; def: AccountDef }[] = [
    { key: 'standard', advantaged: false, def: country.standard },
    ...(country.advantaged ? [{ key: 'advantaged' as const, advantaged: true, def: country.advantaged }] : []),
  ];

  const accounts: AccountView[] = accountDefs.map(({ key, advantaged, def }) => {
    const label = def.label ? def.label[input.lang] : t('standardAccount');
    const overrides = advantaged ? input.adjust : undefined;
    const run = (monthly: number) => simulateAccount(country, { advantaged, initial, monthly, growth, years, overrides });

    let monthly = input.monthly;
    let reachable = true;
    if (targetNominal !== null) {
      ({ monthly, reachable } = solveMonthly(targetNominal, (m) => run(m).final.net));
    }
    const result = run(monthly);
    const final = result.final;

    const gross = untaxed(initial, monthly, grossGrowth, years).at(-1)!.balance;
    const beforeTax = untaxed(initial, monthly, growth, years).at(-1)!.balance;
    const taxCost = beforeTax - final.net;
    const waterfall: Waterfall = {
      invested: final.invested,
      ret: gross - final.invested,
      fees: gross - beforeTax,
      tax: taxCost,
      taxDrag: Math.max(0, taxCost - final.totalTax),
      net: final.net,
      real: final.net / inflationFactor,
    };

    return {
      key, label, summary: def.summary[input.lang],
      monthly, reachable, result, waterfall,
      overflowText: result.overflow > 0.5 ? t('overflowNote', { amount: f.money(result.overflow), account: label }) : null,
      explain: explainAccount(def, result, t, f, years),
    };
  });

  // Vilket konto är bäst? Spara-läge: mest netto. Mål-läge: minst per månad.
  if (accounts.length === 2) {
    const [a, b] = accounts;
    const score = (acc: AccountView) => (mode === 'goal' ? -acc.monthly : acc.waterfall.net);
    const diff = Math.abs(score(a) - score(b));
    if (diff >= 1) {
      const [best, other] = score(a) > score(b) ? [a, b] : [b, a];
      best.best = true;
      best.difference = t(mode === 'goal' ? 'differenceLess' : 'differenceMore', { amount: f.money(diff), other: other.label });
    }
  }

  // Tidslinje: samma månadsbelopp för alla konton så att linjerna går att jämföra.
  // I mål-läget används det bästa kontots belopp.
  const base = accounts.find((a) => a.best) ?? accounts.at(-1)!;
  const monthly = base.monthly;
  const rowsFor = (acc: AccountView) => (acc.monthly === monthly ? acc.result.rows
    : simulateAccount(country, { advantaged: acc.key === 'advantaged', initial, monthly, growth, years, overrides: input.adjust }).rows);
  const netRows = accounts.map(rowsFor);
  const timeline: TimelineRow[] = untaxed(initial, monthly, growth, years).map((row, i) => ({
    year: row.year,
    invested: row.invested,
    beforeTax: row.balance,
    net: netRows.map((rows) => rows[i].net),
  }));

  // Ränta-på-ränta med användarens egna siffror (före skatt och avgifter).
  const deposits = timeline.at(-1)!.invested;
  const simple = simpleInterest(initial, monthly, returnPct / 100, years);
  const compounded = untaxed(initial, monthly, grossGrowth, years).at(-1)!.balance;
  const compound = {
    deposits, simple, compound: compounded,
    share: compounded > 0 ? Math.max(0, compounded - simple) / compounded : 0,
  };

  const general = [
    t('explainGrowth', {
      ret: f.pct(returnPct / 100), fee: f.pct(feePct / 100),
      net: f.pct(Math.pow(growth, 12) - 1), monthly: f.pct(growth - 1),
    }),
    t('explainReal', {
      inflation: f.pct(inflationPct / 100), years,
      net: f.money(base.waterfall.net), real: f.money(base.waterfall.real),
    }),
  ];

  return {
    country, mode, years, growth, accounts, timeline, timelineMonthly: monthly, compound, general,
    target: targetNominal !== null ? { nominal: targetNominal, input: input.target, real: input.targetReal } : null,
    format: f, t,
  };
}

/** "Så räknade vi" — en förklaring per regim, med användarens siffror. */
function explainAccount(def: AccountDef, result: AccountResult, t: Translate, f: Format, years: number): string[] {
  const fin = result.final;
  const gain = fin.balance - fin.invested;
  const lines: string[] = [];
  switch (def.regime) {
    case 'CGT':
      lines.push(t('explainCGT', { balance: f.money(fin.balance), invested: f.money(fin.invested), gain: f.money(gain), tax: f.money(fin.taxIfSold) }));
      if (def.params.fundLevy) lines.push(t('explainFundLevy', { levy: f.money(fin.paidOutside) }));
      break;
    case 'ISK': {
      const d = fin.detail;
      if (d) lines.push(t('explainISK', { base: f.money(d.base), rate: f.pct(d.rate), income: f.money(d.income), tax: f.money(d.tax), total: f.money(fin.paidOutside) }));
      break;
    }
    case 'LAGER':
      lines.push(t('explainLager', { total: f.money(fin.paidFromAccount) }));
      break;
    case 'SKJERMING': {
      const shield = fin.detail ? fin.detail.accumulated : 0;
      lines.push(t('explainSkjerming', { shield: f.money(shield), gain: f.money(gain), taxable: f.money(Math.max(0, gain - shield)), tax: f.money(fin.taxIfSold) }));
      break;
    }
    case 'BOX3':
      lines.push(t('explainBox3', { total: f.money(fin.paidOutside) }));
      break;
    case 'TIME_TEST':
      lines.push(t(def.params.perLot ? 'explainTimeTest' : 'explainTimeTestAccount', { years, tax: f.money(fin.taxIfSold) }));
      break;
    case 'EXIT_TAX':
      lines.push(t('explainExit', { deemed: f.money(fin.paidFromAccount), tax: f.money(fin.taxIfSold) }));
      break;
    default:
      lines.push(t('explainTaxFree'));
  }
  return lines;
}
