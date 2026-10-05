// Paritet mot den tidigare motorn.
// tests/fixtures/facit.json skapades av den tidigare motorn (calc/ i commit
// 84f0fee, oktober 2026) för samma månadstillväxt. Skatteberäkningarna
// ska ge samma resultat på öret — utom där den nya motorn är medvetet mer
// korrekt (se UNDANTAG).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COUNTRIES } from '../src/rules/countries';
import { simulateAccount } from '../src/engine/account';
import type { CountryCode } from '../src/rules/types';

interface Fixture {
  code: CountryCode; adv: boolean; initial: number; monthly: number; monthlyGrowth: number; years: number;
  balance: number; totalTax: number; netValue: number; overflow: number;
}

const facit: Fixture[] = JSON.parse(readFileSync(new URL('./fixtures/facit.json', import.meta.url), 'utf8'));

// Dansk ASK med tak: den gamla motorn uppskattade kontots värde vid årets
// början (för insättningsutrymmet) med en förenklad projektion. Den nya
// simulerar värdet exakt, så små avvikelser är väntade.
const isException = (f: Fixture) => f.code === 'DK' && f.adv && f.overflow > 0;

test(`paritet mot facit (${facit.length} scenarier)`, () => {
  let exceptions = 0;
  for (const f of facit) {
    const r = simulateAccount(COUNTRIES[f.code], {
      advantaged: f.adv, initial: f.initial, monthly: f.monthly, growth: f.monthlyGrowth, years: f.years,
    }).final;
    const label = `${f.code} ${f.adv ? 'skattegynnat' : 'vanligt'} ${f.initial}+${f.monthly}/mån ${f.years} år g=${f.monthlyGrowth}`;
    if (isException(f)) {
      exceptions++;
      assert.ok(Math.abs(r.net - f.netValue) / f.netValue < 0.005, `${label}: netto ${r.net} vs ${f.netValue}`);
      continue;
    }
    const tol = Math.max(0.02, Math.abs(f.balance) * 1e-9);
    assert.ok(Math.abs(r.balance - f.balance) <= tol, `${label}: saldo ${r.balance} vs ${f.balance}`);
    assert.ok(Math.abs(r.totalTax - f.totalTax) <= tol, `${label}: skatt ${r.totalTax} vs ${f.totalTax}`);
    assert.ok(Math.abs(r.net - f.netValue) <= tol, `${label}: netto ${r.net} vs ${f.netValue}`);
  }
  assert.ok(exceptions < facit.length * 0.05);
});
