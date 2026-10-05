// ============================================================
//  Pengamaskinen — start och händelser.
//  Läser formuläret → bygger vymodellen → ritar om resultatet.
// ============================================================
import { COUNTRIES, REGIONS, RULES_VERIFIED } from './rules/countries.js';
import { LANGUAGES, translator, formatters } from './i18n/index.js';
import { buildModel } from './view/model.js';
import { renderAccounts } from './view/accounts.js';
import { renderChart, renderTable } from './view/chart.js';
import { renderRules, renderExplain, renderCompound } from './view/panels.js';
import { FLAGS } from './view/flags.js';
import { h } from './view/dom.js';

const $ = (id) => document.getElementById(id);
const form = $('inputs');

const stored = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
const store = (key, value) => { try { localStorage.setItem(key, value); } catch { /* privat läge */ } };

const state = {
  lang: stored('pm-lang', navigator.language?.startsWith('sv') ? 'sv' : 'en'),
  country: stored('pm-country', 'SE'),
  theme: stored('pm-theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  adjust: {},
};
if (!LANGUAGES[state.lang]) state.lang = 'sv';
if (!COUNTRIES[state.country]) state.country = 'SE';

// Giltiga intervall för fälten (min, max, heltal)
const LIMITS = {
  initial: [0, 1e8], monthly: [0, 1e6], target: [1, 1e9], years: [1, 100, true], returnPct: [-50, 100],
};

let t = translator(state.lang);

// ---------- Inställningar: språk, land, tema ----------

function applyLanguage() {
  t = translator(state.lang);
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  document.title = `${t('appName')} – ${t('tagline')}`;
  $('lang').value = state.lang;
  $('table-toggle').textContent = t('showTable');
  $('footer-verified').textContent = t('rulesVerified', { date: RULES_VERIFIED });
  fillCountries();
  applyTheme();
}

function fillCountries() {
  const names = (code) => COUNTRIES[code].name[state.lang];
  $('country').replaceChildren(...REGIONS.map((region) => h('optgroup', { label: region.name[state.lang] },
    Object.keys(COUNTRIES).filter((c) => COUNTRIES[c].region === region.id)
      .sort((a, b) => names(a).localeCompare(names(b), state.lang))
      .map((c) => h('option', { value: c }, names(c))))));
  $('country').value = state.country;
}

function applyCountry() {
  const c = COUNTRIES[state.country];
  $('flag').src = `data:image/svg+xml,${encodeURIComponent(FLAGS[state.country])}`;
  const { currencySymbol } = formatters(c, state.lang);
  document.querySelectorAll('[data-currency]').forEach((el) => { el.textContent = currencySymbol; });

  // Justerbar parameter (t.ex. ISK-schablonränta)
  const adj = c.advantaged?.adjustable;
  $('adjust-field').hidden = !adj;
  if (adj) {
    const input = $('adjust');
    Object.assign(input, { min: adj.min, max: adj.max, step: adj.step });
    input.value = state.adjust[adj.key] ?? c.advantaged.params[adj.key];
    $('adjust-label').textContent = adj.label[state.lang];
    $('adjust-help').textContent = adj.hint[state.lang];
  }
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $('theme').setAttribute('aria-label', t(state.theme === 'dark' ? 'themeToLight' : 'themeToDark'));
}

// ---------- Indata ----------

function readInputs() {
  const mode = form.elements.mode.value;
  const num = (id) => form.elements[id].valueAsNumber;
  let valid = true;

  for (const [id, [min, max, integer]] of Object.entries(LIMITS)) {
    const field = form.elements[id];
    const active = !field.closest('[data-mode]') || field.closest('[data-mode]').dataset.mode === mode;
    const v = num(id);
    let error = '';
    if (active && (!Number.isFinite(v) || v < min || v > max)) {
      error = t('errorRange', { min: min.toLocaleString(state.lang), max: max.toLocaleString(state.lang) });
    } else if (active && integer && !Number.isInteger(v)) {
      error = t('errorInteger');
    }
    field.setAttribute('aria-invalid', error ? 'true' : 'false');
    $(`${id}-error`).textContent = error;
    if (error) valid = false;
  }

  const c = COUNTRIES[state.country];
  const adj = c.advantaged?.adjustable;
  if (adj) state.adjust = { [adj.key]: num('adjust') };

  const input = {
    lang: state.lang, country: state.country, mode,
    initial: num('initial'), monthly: num('monthly'), target: num('target'),
    targetReal: form.elements.targetReal.checked,
    years: num('years'), returnPct: num('returnPct'),
    feePct: num('feePct'), inflationPct: num('inflationPct'),
    adjust: state.adjust,
  };

  // Läsbart belopp bredvid beloppsfälten (1000000 → 1 000 000 kr)
  const { money } = formatters(c, state.lang);
  for (const id of ['initial', 'monthly', 'target']) {
    $(`${id}-out`).value = Number.isFinite(input[id]) && input[id] >= 1000 ? money(input[id]) : '';
  }
  const pct = (v) => `${v.toLocaleString(state.lang, { maximumFractionDigits: 2 })} %`;
  $('feePct-out').value = pct(input.feePct);
  $('inflationPct-out').value = pct(input.inflationPct);
  if (adj) $('adjust-out').value = pct(state.adjust[adj.key]);
  $('feePct-error').textContent = valid && input.feePct > input.returnPct ? t('warnFeeAboveReturn') : '';
  document.querySelectorAll('[data-mode]').forEach((el) => { el.hidden = el.dataset.mode !== mode; });

  return valid ? input : null;
}

// ---------- Rita ----------

function render() {
  const input = readInputs();
  $('results').toggleAttribute('aria-busy', !input);
  $('results').classList.toggle('stale', !input);
  if (!input) return;

  const model = buildModel(input);
  const f = model.format;
  renderRules(model, state.lang);
  $('result-title').textContent = input.mode === 'goal'
    ? t('resultGoalTitle', { target: f.money(input.target), years: input.years })
    : t('resultSaveTitle', { years: input.years });
  $('goal-note').textContent = input.mode === 'goal' && input.targetReal
    ? t('goalNominal', { amount: f.money(model.target.nominal), years: input.years }) : '';

  $('timeline-note').textContent = input.mode === 'goal' && model.accounts.length > 1
    ? t('timelineMonthly', { amount: f.money(model.timelineMonthly) }) : '';
  renderAccounts($('accounts'), model);
  renderExplain($('explain'), model);
  renderChart($('chart'), $('chart-readout'), model);
  renderTable($('table'), model);
  renderCompound($('compound'), model);
}

let pending = 0;
const scheduleRender = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(render); };

// ---------- Händelser ----------

form.addEventListener('input', scheduleRender);
let lastWidth = innerWidth;
addEventListener('resize', () => { if (innerWidth !== lastWidth) { lastWidth = innerWidth; scheduleRender(); } });
form.addEventListener('submit', (e) => e.preventDefault());

$('lang').addEventListener('change', (e) => {
  state.lang = e.target.value;
  store('pm-lang', state.lang);
  applyLanguage();
  applyCountry();
  render();
});

$('country').addEventListener('change', (e) => {
  state.country = e.target.value;
  state.adjust = {};
  store('pm-country', state.country);
  applyCountry();
  render();
});

$('theme').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  store('pm-theme', state.theme);
  applyTheme();
});

applyLanguage();
applyCountry();
render();
