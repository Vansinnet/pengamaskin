import { test } from 'vitest';
import assert from 'node:assert/strict';
import { buildModel, type ModelInput } from '../src/view/model';
import { COUNTRIES } from '../src/rules/countries';
import sv from '../src/i18n/sv';
import en from '../src/i18n/en';
import type { TextKey } from '../src/i18n';
import type { CountryCode, Lang } from '../src/rules/types';

const base: ModelInput = { lang: 'sv', country: 'SE', mode: 'save', initial: 10000, monthly: 1000, target: 1e6, targetReal: false,
  years: 20, returnPct: 7, feePct: 0.5, inflationPct: 2, adjust: { schablonRate: 3.55 } };

test('i18n: svenska och engelska har samma nycklar och platshållare', () => {
  assert.deepEqual(Object.keys(sv).sort(), Object.keys(en).sort());
  const holes = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of Object.keys(sv) as TextKey[]) assert.equal(holes(sv[k]), holes(en[k]), k);
});

test('vattenfallet går ihop: insatt + avkastning − avgifter − skatt = netto', () => {
  for (const code of Object.keys(COUNTRIES) as CountryCode[]) {
    for (const lang of ['sv', 'en'] as Lang[]) {
      const m = buildModel({ ...base, country: code, lang });
      for (const acc of m.accounts) {
        const w = acc.waterfall;
        assert.ok(Math.abs(w.invested + w.ret - w.fees - w.tax - w.net) < 1e-6, `${code} ${acc.key}`);
        assert.ok(acc.explain.length > 0 && acc.explain.every((l) => !/\{\w+\}/.test(l)), `${code} förklaring`);
      }
      assert.ok(m.general.every((l) => !/\{\w+\}/.test(l)));
    }
  }
});

test('tidslinjen slutar i samma netto som resultatet (spara-läge)', () => {
  const m = buildModel(base);
  assert.equal(m.timeline.length, 21);
  m.accounts.forEach((acc, i) => assert.equal(m.timeline.at(-1)!.net[i], acc.waterfall.net));
});

test('mål-läge: varje konto får sitt månadsbelopp, och det bästa markeras', () => {
  const m = buildModel({ ...base, mode: 'goal', target: 1e6 });
  for (const acc of m.accounts) assert.ok(acc.waterfall.net >= 1e6 - 0.01 && acc.reachable);
  assert.equal(m.accounts.filter((a) => a.best).length, 1);
  const isk = m.accounts.find((a) => a.key === 'advantaged')!;
  assert.ok(isk.best && isk.monthly < m.accounts[0].monthly);
});

test('mål i dagens pengar räknas upp med inflationen', () => {
  const m = buildModel({ ...base, mode: 'goal', target: 1e6, targetReal: true });
  assert.ok(Math.abs(m.target!.nominal - 1e6 * 1.02 ** 20) < 1e-6);
});

test('ränta-på-ränta: insatt < enkel ränta < ränta-på-ränta', () => {
  const c = buildModel(base).compound;
  assert.ok(c.deposits < c.simple && c.simple < c.compound && c.share > 0);
  assert.equal(c.deposits, 10000 + 240 * 1000);
});
