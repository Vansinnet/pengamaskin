import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gainTax } from '../src/engine/tax.js';
import { simulate, schedule } from '../src/engine/simulate.js';
import { simulateAccount, monthlyGrowth, feeCost } from '../src/engine/account.js';
import { solveMonthly } from '../src/engine/goal.js';
import { REGIMES } from '../src/engine/regimes/index.js';
import { COUNTRIES } from '../src/rules/countries.js';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);
const run = (regime, params, initial, monthly, growth, years) =>
  simulate({ deposits: schedule(initial, monthly, years), growth, years, regime: REGIMES[regime], params }).rows.at(-1);

test('gainTax: platt, steg, fribelopp, skattefri andel', () => {
  near(gainTax(1000, { rate: 0.3 }), 300);
  near(gainTax(-500, { rate: 0.3 }), 0);
  near(gainTax(400000, COUNTRIES.ES.standard.params), 1140 + 9240 + 34500 + 27000 + 30000);
  near(gainTax(10000, COUNTRIES.DE.standard.params), (7000 - 1000) * 0.26375);
  near(gainTax(2000, COUNTRIES.BE.standard.params), 0);
});

test('monthlyGrowth: årlig avkastning är effektiv; avgiften dras på kapitalet', () => {
  near(Math.pow(monthlyGrowth(7), 12), 1.07, 1e-12);
  near(Math.pow(monthlyGrowth(7, 1), 12), 1.07 * 0.99, 1e-12);
  near(monthlyGrowth(0), 1, 0);
});

test('feeCost: 100 000 i 10 år, 7 % och 1 % avgift', () => {
  const f = feeCost({ initial: 100000, monthly: 0, years: 10, annualReturn: 7, annualFee: 1 });
  near(f, 100000 * (1.07 ** 10 - (1.07 * 0.99) ** 10), 0.01);
});

test('huvudbok: en rad per år + år 0, sista raden = slutresultat', () => {
  const r = simulateAccount(COUNTRIES.SE, { advantaged: true, initial: 1000, monthly: 100, growth: monthlyGrowth(5), years: 3 });
  assert.equal(r.rows.length, 4);
  assert.equal(r.rows[0].year, 0);
  assert.equal(r.rows[0].invested, 1000);
  assert.equal(r.final, r.rows[3]);
  near(r.final.invested, 1000 + 3600);
});

test('ISK: Skatteverkets formel, fribelopp och golv', () => {
  const p = COUNTRIES.SE.advantaged.params;
  near(run('ISK', p, 500000, 0, 1, 1).paidOutside, 200000 * 0.0355 * 0.3);
  near(run('ISK', p, 100000, 0, 1, 1).paidOutside, 0);
  near(run('ISK', { ...p, schablonRate: 1, exemption: 0 }, 100000, 0, 1, 1).paidOutside, 100000 * 0.0125 * 0.3);
  // Insättningar räknas in: 12 × 10 000 → kvartal 0, 30k, 60k, 90k + 120k insatt = 300k / 4
  const r = simulate({ deposits: schedule(0, 10000, 1), growth: 1, years: 1, regime: REGIMES.ISK, params: { ...p, exemption: 0 } });
  near(r.rows[1].detail.base, 75000);
});

test('SE AF: fondschablon 0,12 % av värdet 1 januari varje år', () => {
  near(run('CGT', COUNTRIES.SE.standard.params, 100000, 0, 1, 3).paidOutside, 360);
});

test('Dansk ASK: 17 % per år, förluster förs fram utan tidsgräns', () => {
  const lager = REGIMES.LAGER;
  const st = lager.init();
  const s = { yearDeposits: 0, paidFromAccount: 0, payFromAccount(t) { this.paidFromAccount += t; this.balance -= t; } };
  Object.assign(s, { yearStartBalance: 100000, balance: 90000 });
  lager.yearEnd(s, st, { rate: 0.17 });
  for (let i = 0; i < 6; i++) { Object.assign(s, { yearStartBalance: 90000, balance: 90000 }); lager.yearEnd(s, st, { rate: 0.17 }); }
  Object.assign(s, { yearStartBalance: 90000, balance: 105000 });
  const d = lager.yearEnd(s, st, { rate: 0.17 });
  near(d.tax, 5000 * 0.17);
  near(st.carry, 0);
});

test('Norge: skjerming växer, ASK ger avdrag först året efter insättning', () => {
  const st = REGIMES.SKJERMING;
  const two = simulate({ deposits: schedule(100000, 0, 2), growth: 1, years: 2, regime: st, params: { rate: 0.3784, shieldRate: 0.036, basis: 'lowest' } });
  near(two.rows[2].detail.accumulated, 3600 + 103600 * 0.036);
  const ask = simulate({ deposits: schedule(0, 1000, 1), growth: 1, years: 1, regime: st, params: { shieldRate: 0.036, basis: 'lowest' } });
  const std = simulate({ deposits: schedule(0, 1000, 1), growth: 1, years: 1, regime: st, params: { shieldRate: 0.036, basis: 'yearEnd' } });
  near(ask.rows[1].detail.accumulated, 0);
  near(std.rows[1].detail.accumulated, 432);
});

test('Tidstest per köp (Tjeckien): bara köp yngre än 3 år beskattas', () => {
  const g = monthlyGrowth(7);
  let expected = 0;
  for (let m = 1; m <= 120; m++) { const held = 120 - m; if (held < 36) expected += 5000 * (g ** held - 1) * 0.15; }
  near(simulateAccount(COUNTRIES.CZ, { initial: 0, monthly: 5000, growth: g, years: 10 }).final.totalTax, expected);
  near(simulateAccount(COUNTRIES.CZ, { initial: 100000, monthly: 0, growth: g, years: 4 }).final.totalTax, 0);
});

test('Fransk PEA: klockan räknas från kontots öppnande', () => {
  const g = monthlyGrowth(5);
  const four = simulateAccount(COUNTRIES.FR, { advantaged: true, initial: 10000, monthly: 0, growth: g, years: 4 }).final;
  const five = simulateAccount(COUNTRIES.FR, { advantaged: true, initial: 10000, monthly: 0, growth: g, years: 5 }).final;
  near(four.taxIfSold, (four.balance - 10000) * 0.314);
  near(five.taxIfSold, (five.balance - 10000) * 0.186);
});

test('Irland: exit tax 38 % och deemed disposal år 8', () => {
  const g = monthlyGrowth(7);
  const p = COUNTRIES.IE.standard.params;
  const five = run('EXIT_TAX', p, 100000, 0, g, 5);
  near(five.totalTax, (100000 * 1.07 ** 5 - 100000) * 0.38, 0.05);
  near(five.paidFromAccount, 0);
  const ten = run('EXIT_TAX', p, 100000, 0, g, 10);
  near(ten.paidFromAccount, (100000 * 1.07 ** 8 - 100000) * 0.38, 0.05);
  assert.ok(ten.balance < 100000 * 1.07 ** 10);
});

test('Box 3: 6 % × 36 % på värdet över fribeloppet, varje 1 januari', () => {
  near(run('BOX3', COUNTRIES.NL.standard.params, 100000, 0, monthlyGrowth(7), 1).paidOutside, (100000 - 59357) * 0.06 * 0.36);
  near(run('BOX3', COUNTRIES.NL.standard.params, 20000, 0, 1, 5).paidOutside, 0);
});

test('Grekland: noterade aktier/UCITS skattefria', () => {
  near(simulateAccount(COUNTRIES.GR, { initial: 100000, monthly: 1000, growth: monthlyGrowth(7), years: 10 }).final.totalTax, 0);
});

test('Insättningstak: överskott räknas på vanligt konto', () => {
  const acc = (code, initial, monthly, years) =>
    simulateAccount(COUNTRIES[code], { advantaged: true, initial, monthly, growth: 1, years });
  near(acc('GB', 30000, 0, 1).overflow, 10000);
  near(acc('GB', 0, 2000, 2).overflow, 8000);
  near(acc('FI', 80000, 1000, 5).overflow, 40000);
  near(acc('IT', 0, 5000, 5).overflow, 100000);
  near(acc('PL', 0, 3000, 1).overflow, 36000 - 28260);
  near(acc('DK', 150000, 5000, 2).overflow, 150000 + 24 * 5000 - 174200);
  const fr = simulateAccount(COUNTRIES.FR, { advantaged: true, initial: 200000, monthly: 0, growth: monthlyGrowth(5), years: 6 });
  near(fr.overflow, 50000);
  near(acc('SE', 1e7, 1e5, 3).overflow, 0);
});

test('Sparmål: hittar minsta månadsbelopp som når målet', () => {
  const c = COUNTRIES.SE;
  const net = (m) => simulateAccount(c, { advantaged: true, initial: 10000, monthly: m, growth: monthlyGrowth(7, 0.5), years: 20 }).final.net;
  const { monthly, reachable } = solveMonthly(1e6, net);
  assert.ok(reachable);
  assert.ok(net(monthly) >= 1e6);
  assert.ok(net(monthly - 0.02) < 1e6);
  assert.equal(solveMonthly(5000, net).monthly, 0);
});

test('Egenskaper för alla länder och konton', () => {
  for (const [code, c] of Object.entries(COUNTRIES)) {
    for (const advantaged of c.advantaged ? [false, true] : [false]) {
      const sim = (monthly, ret) => simulateAccount(c, { advantaged, initial: 50000, monthly, growth: monthlyGrowth(ret, 0.3), years: 15 }).final;
      const a = sim(1000, 6);
      const b = sim(2000, 6);
      assert.ok(a.totalTax >= 0, `${code}: skatt ≥ 0`);
      assert.ok(a.net <= a.balance + 1e-6, `${code}: netto ≤ saldo`);
      assert.ok(b.net > a.net, `${code}: mer sparande ger mer netto`);
      assert.ok(sim(1000, 8).net > a.net, `${code}: högre avkastning ger mer netto`);
    }
  }
});
