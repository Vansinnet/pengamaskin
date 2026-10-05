import { test } from 'vitest';
import assert from 'node:assert/strict';
import { COUNTRIES, REGIONS, RULES_YEAR } from '../src/rules/countries';
import { REGIMES } from '../src/engine/regimes';
import type { Lang } from '../src/rules/types';

test('alla länder har giltig regim, texter på båda språken och källor', () => {
  const regions = new Set(REGIONS.map((r) => r.id));
  for (const [code, c] of Object.entries(COUNTRIES)) {
    assert.ok(regions.has(c.region), `${code}: region`);
    assert.ok(c.sources?.length, `${code}: källor`);
    for (const lang of ['sv', 'en'] as Lang[]) {
      assert.ok(c.name[lang] && c.notes[lang] && c.standard.summary[lang], `${code}: texter ${lang}`);
      if (c.advantaged) assert.ok(c.advantaged.label[lang] && c.advantaged.summary[lang], `${code}: kontotext ${lang}`);
    }
    for (const acc of [c.standard, c.advantaged]) {
      if (!acc) continue;
      assert.ok(REGIMES[acc.regime], `${code}: okänd regim ${acc.regime}`);
    }
    assert.doesNotThrow(() => new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency }), code);
  }
});

test(`skattereglerna gäller innevarande år (${RULES_YEAR})`, () => {
  assert.ok(new Date().getFullYear() <= RULES_YEAR,
    `Skattereglerna är från ${RULES_YEAR}. Gå igenom src/rules/countries.ts mot källorna och höj RULES_YEAR.`);
});
