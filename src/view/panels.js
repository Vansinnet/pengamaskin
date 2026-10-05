// Förklaringar: skatteregler för landet, "Så räknade vi" och ränta-på-ränta.
import { h } from './dom.js';
import { RULES_YEAR } from '../rules/countries.js';

export function renderRules(model, lang) {
  const { country, t } = model;
  document.getElementById('rules-title').textContent = t('rulesTitle', { country: country.name[lang] });
  const accounts = [country.standard, country.advantaged].filter(Boolean);
  document.getElementById('rules-list').replaceChildren(...accounts.flatMap((acc) => [
    h('dt', null, acc.label ? acc.label[lang] : t('standardAccount')),
    h('dd', null, acc.summary[lang]),
  ]));
  document.getElementById('rules-notes').textContent = country.notes[lang];
  document.getElementById('rules-year').textContent = `${t('rulesYear', { year: RULES_YEAR })}.`;
  document.getElementById('rules-sources').replaceChildren(t('rulesSources') + ': ',
    ...country.sources.flatMap((url, i) => [i ? ', ' : '', h('a', { href: url, rel: 'noopener noreferrer' }, new URL(url).hostname.replace(/^www\./, ''))]));
}

export function renderExplain(container, model) {
  container.replaceChildren(
    h('div', { class: 'explain-group' }, h('ul', null, model.general.map((l) => h('li', null, l)))),
    ...model.accounts.map((acc) => h('div', { class: 'explain-group' },
      h('h3', null, acc.label),
      h('ul', null, acc.explain.map((l) => h('li', null, l)), acc.overflowText ? h('li', null, acc.overflowText) : null))));
}

export function renderCompound(container, model) {
  const { compound: c, t, format: f, years } = model;
  const max = Math.max(1, c.compound, c.simple, c.deposits);
  const bar = (label, value, cls) => h('div', { class: 'row' },
    h('span', null, label),
    h('div', { class: 'track' },
      h('div', { class: `fill ${cls}`, style: null, 'data-w': value / max }),
      h('span', { class: 'value' }, f.money(value))));
  const rows = [bar(t('compoundDeposits'), c.deposits, ''), bar(t('compoundSimple'), c.simple, 'simple'), bar(t('compoundCompound'), c.compound, 'compound-fill')];
  container.replaceChildren(h('div', { class: 'compound' },
    h('p', null, t('compoundWithYourNumbers', { years })), rows,
    h('p', null, t('compoundShare', { share: f.pct(c.share) }))));
  // Bredden sätts via CSSOM (tillåtet av CSP utan 'unsafe-inline').
  container.querySelectorAll('.fill').forEach((el) => { el.style.width = `${(Number(el.dataset.w) * 100).toFixed(2)}%`; });
}
