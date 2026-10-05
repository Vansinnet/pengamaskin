// ============================================================
//  Ett lands konto: vanligt konto eller skattegynnat konto.
//
//  Skattegynnat konto med tak: det som ryms simuleras med kontots
//  regler, överskottet med landets vanliga konto, och de två
//  huvudböckerna summeras rad för rad.
// ============================================================
import type { AccountDef, Cap, Country } from '../rules/types';
import { simulate, schedule } from './simulate';
import { createCap } from './caps';
import { REGIMES } from './regimes';
import type { AnyRegime, Row } from './types';

/** Månadsfaktor från årlig avkastning och årlig avgift (båda i procent). */
export function monthlyGrowth(annualReturnPct: number, annualFeePct = 0): number {
  return Math.pow((1 + annualReturnPct / 100) * (1 - annualFeePct / 100), 1 / 12);
}

const SUM_KEYS = ['invested', 'balance', 'paidOutside', 'paidFromAccount', 'taxIfSold', 'totalTax', 'net'] as const;

function mergeRows(a: Row[], b: Row[]): Row[] {
  return a.map((row, i) => {
    const out = { ...row };
    for (const k of SUM_KEYS) out[k] = row[k] + b[i][k];
    return out;
  });
}

export interface AccountOptions {
  /** använd landets skattegynnade konto */
  advantaged?: boolean;
  initial: number;
  monthly: number;
  growth: number;
  years: number;
  /** användarjusterade parametrar (ISK-schablonränta) */
  overrides?: Record<string, number>;
}

export interface AccountResult {
  rows: Row[];
  final: Row;
  overflow: number;
  account: AccountDef;
}

export function simulateAccount(country: Country, { advantaged, initial, monthly, growth, years, overrides }: AccountOptions): AccountResult {
  const deposits = schedule(initial, monthly, years);
  const std = country.standard;
  const run = (account: AccountDef, deps: number[], cap?: Cap) => simulate({
    deposits: deps, growth, years,
    regime: REGIMES[account.regime] as AnyRegime,
    params: { ...account.params, ...(account === country.advantaged ? overrides : {}) },
    cap: cap ? createCap(cap) : undefined,
  });

  const adv = advantaged && country.advantaged;
  if (!adv) {
    const { rows } = run(std, deposits);
    return { rows, final: rows[rows.length - 1], overflow: 0, account: std };
  }

  const wrapper = run(adv, deposits, adv.cap);
  const overflow = wrapper.overflow.reduce((a, b) => a + b, 0);
  const rows = overflow > 0 ? mergeRows(wrapper.rows, run(std, wrapper.overflow).rows) : wrapper.rows;
  return { rows, final: rows[rows.length - 1], overflow, account: adv };
}

/** Avgifternas kostnad = värdet utan avgift − värdet med avgift (före skatt). */
export function feeCost({ initial, monthly, years, annualReturn, annualFee }:
  { initial: number; monthly: number; years: number; annualReturn: number; annualFee: number }): number {
  const value = (g: number) => simulate({
    deposits: schedule(initial, monthly, years), growth: g, years, regime: REGIMES.TAX_FREE, params: {},
  }).rows.at(-1)!.balance;
  return value(monthlyGrowth(annualReturn)) - value(monthlyGrowth(annualReturn, annualFee));
}
