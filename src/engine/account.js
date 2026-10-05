// ============================================================
//  Ett lands konto: vanligt konto eller skattegynnat konto.
//
//  Skattegynnat konto med tak: det som ryms simuleras med kontots
//  regler, överskottet med landets vanliga konto, och de två
//  huvudböckerna summeras rad för rad.
// ============================================================
import { simulate, schedule } from './simulate.js';
import { createCap } from './caps.js';
import { REGIMES } from './regimes/index.js';

/** Månadsfaktor från årlig avkastning och årlig avgift (båda i procent). */
export function monthlyGrowth(annualReturnPct, annualFeePct = 0) {
  return Math.pow((1 + annualReturnPct / 100) * (1 - annualFeePct / 100), 1 / 12);
}

const SUM_KEYS = ['invested', 'balance', 'paidOutside', 'paidFromAccount', 'taxIfSold', 'totalTax', 'net'];

function mergeRows(a, b) {
  return a.map((row, i) => {
    const out = { ...row };
    for (const k of SUM_KEYS) out[k] = row[k] + b[i][k];
    return out;
  });
}

/**
 * @param {object} country   en post ur rules/countries.js
 * @param {object} o
 * @param {boolean} o.advantaged  använd landets skattegynnade konto
 * @param {number}  o.initial, o.monthly, o.growth, o.years
 * @param {object}  [o.overrides]  användarjusterade parametrar (ISK-schablonränta)
 * @returns {{ rows: object[], final: object, overflow: number, account: object }}
 */
export function simulateAccount(country, { advantaged, initial, monthly, growth, years, overrides }) {
  const deposits = schedule(initial, monthly, years);
  const std = country.standard;
  const run = (account, deps, cap) => simulate({
    deposits: deps, growth, years,
    regime: REGIMES[account.regime],
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
export function feeCost({ initial, monthly, years, annualReturn, annualFee }) {
  const value = (g) => simulate({
    deposits: schedule(initial, monthly, years), growth: g, years, regime: REGIMES.TAX_FREE, params: {},
  }).rows.at(-1).balance;
  return value(monthlyGrowth(annualReturn)) - value(monthlyGrowth(annualReturn, annualFee));
}
