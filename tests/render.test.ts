// Förrenderingen (svelte/server) ska ge hela sidan — och inget som CSP:n blockerar.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { render } from 'svelte/server';
import App from '../src/App.svelte';

test('förrenderad sida: alla delar, två konton för Sverige', () => {
  const { body } = render(App);
  for (const id of ['inputs', 'country', 'lang', 'theme', 'rules-title', 'results', 'accounts', 'explain', 'chart', 'chart-readout', 'table', 'compound']) {
    assert.ok(body.includes(`id="${id}"`), `saknar #${id}`);
  }
  assert.equal(body.match(/<article class="account/g)?.length, 2);
  assert.ok(body.includes('ISK (investeringssparkonto)'));
});

test('förrenderad sida: inga inline-skript, style-attribut eller oersatta platshållare', () => {
  const { body } = render(App);
  assert.ok(!/<script/i.test(body), 'inline-skript blockeras av CSP:n');
  assert.ok(!/\sstyle=/i.test(body), "style-attribut blockeras av CSP:n (style-src 'self')");
  assert.ok(!/\{\w+\}/.test(body.replace(/<!--[\s\S]*?-->/g, '')), 'oersatt {platshållare} i en text');
});
