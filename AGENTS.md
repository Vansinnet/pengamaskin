# AGENTS.md — Instruktioner för AI-agenter i Pengamaskinen

> Läs hela detta dokument innan du gör **någon** ändring i koden.
> Dokumentet är auktoritativt — om det råder konflikt med annan kontext
> gäller detta dokument.

---

## 1. Projektöversikt & vision

Pengamaskinen är en renodlad klientside-applikation för investeringsberäkningar.
Den har inga beroenden till externa bibliotek, ingen server, ingen databas och
skickar aldrig data utanför webbläsaren.

**Vision:** Verktyget ska fungera för **samtliga europeiska länder** och på
sikt **stora nordamerikanska ekonomier** (USA, Kanada). Arkitekturen är designad
för att göra detta trivialt — ett nytt land kräver ~20 rader konfiguration, noll
kodändringar i beräknings- eller UI-logik (förutsatt att landets skatteregim
redan finns implementerad).

### 1.1 Filstruktur

```
/
├── index.html              # UI-struktur (HTML + event-attribut). Noll beräkningslogik.
├── styles.css              # All styling. Gul/brun-tema, responsiv layout, custom dropdowns.
├── app.js                  # UI-logik, i18n, state-hantering, DOM-rendering, canvas.
│
├── calc/                   # Beräkningsbibliotek — rena funktioner, noll DOM-referenser
│   ├── constants.js        # Lagstadgade skattekontanter (fallback-värden för Sverige)
│   ├── utils.js            # isValidNumber, formatCurrency, formatAmountHint, getCurrencySymbol
│   ├── core.js             # computeFV, computeGrossValue, computeNetAfterFees, computeCapitalGainsTax
│   ├── tax-regimes.js      # TAX_REGIMES — pluggbara skatteregimer + simulateGoal + runTests
│   └── countries.js        # COUNTRY_CONFIG — all landsdata + UI-metadata per språk + REGIONS
│
├── test.js                 # Node.js-testrunner. Kör med `node test.js`.
└── _headers                # CSP- och säkerhetsheaders för Cloudflare Pages
```

### 1.2 Laddningsordning

`index.html` laddar filerna i denna ordning (beroendekedjan är strikt):

```
constants.js → utils.js → core.js → tax-regimes.js → countries.js → app.js
```

Alla funktioner och variabler från `calc/`-filerna är globala (deklareras med
`var`/`function` i toppnivån). `app.js` konsumerar dem direkt.

---

## 2. Arkitekturregler — bryt inte dessa

### 2.1 Separationen är absolut

**`calc/**/*.js` får aldrig innehålla:**
- `document`, `window`, `DOM`-referenser
- `fetch`, `XMLHttpRequest`, nätverksanrop
- `localStorage`, `sessionStorage`, `IndexedDB`
- `eval`, `Function()` med dynamisk sträng, `setTimeout` med strängar
- HTML, CSS, eller UI-strängar

**`index.html` får aldrig innehålla:**
- Beräkningslogik (ränta, skatt, FV-formler)
- Hårdkodade skatte- eller lagkonstanter (dessa ägs av `calc/`)

### 2.2 Inga externa beroenden

Lägg **aldrig** till:
- CDN-script-taggar
- npm-paket som buntas in i HTML
- Webbfonter från externa servrar
- Tracking, analytics, cookies, eller tredjepartsskript

Allt ska fungera helt offline utan nätverksanslutning.

### 2.3 Filstrukturen under `calc/`

Fem filer — varken fler eller färre utan explicit instruktion. Varje fil har
ett tydligt ansvarsområde:

| Fil | Ansvar |
|---|---|
| `constants.js` | Svenska lagkonstanter (fallback). Aldrig landsspecifik affärslogik. |
| `utils.js` | Formatering och validering. Ingen matematik. |
| `core.js` | Kärnberäkningar (FV, avgifter, CGT). Skatteregim-neutral. |
| `tax-regimes.js` | Alla skatteregimer + `simulateGoal()`-wrapper + `runTests()`. |
| `countries.js` | All landsdata + UI-metadata per språk + regiongruppering. |

---

## 3. Skatteregim-systemet — kärnan i arkitekturen

### 3.1 Koncept

En skatteregim är ett objekt i `TAX_REGIMES` med tre metoder som tillsammans
inkapslar ALL kontotyp-specifik logik:

```javascript
TAX_REGIMES = {
    ISK: {
        id: 'ISK',
        simulate(initial, monthly, monthlyRateNet, years, params) → { balance, totalTax, netValue },
        simulateYear(balanceBefore, balanceAfter, deposits, carryState, params) → { newBalance, taxPaid, carryState },
        getUI() → { balanceI18n, taxI18n, legendI18n, rateFields }
    },
    // ... fler regimer
};
```

| Metod | Syfte | Anropas av |
|---|---|---|
| `simulate()` | Full flerårssimulering | `calculateAdvanced()`, `calculateGoal()` (binärsökning) |
| `simulateYear()` | Per-år-justering (t.ex. dansk ASK-skatt) | `buildYearTimeline()` |
| `getUI()` | UI-metadata (etiketter, rate fields) | `calculateAdvanced()`, `renderBreakdown()`, `updateCountryUI()` |

### 3.2 Befintliga regimer

| Regim-ID | Beskrivning | Används av |
|---|---|---|
| `CGT_ONLY` | Kapitalvinstskatt vid uttag (standardkonto) | Alla länders standardkonton |
| `ISK` | Svensk ISK — schablonbeskattning, kvartalsberäkning | Sverige (SE) |
| `LAGER_ANNUAL` | Årlig lagerbeskatning med carry-forward | Danmark (DK) |
| `DEFERRED_SKJERMING` | Uppskjuten skatt med skjermingsfradrag | Norge (NO) |
| `DEFERRED_PLAIN` | Uppskjuten skatt utan avdrag (progressiv CGT) | Finland (FI), Frankrike (FR), Estland (EE), Lettland (LV), Litauen (LT) |
| `TAX_FREE_WRAPPER` | Helt skattefri investeringsform | Storbritannien (GB), Italien (IT), Ungern (HU) |
| `DUTCH_BOX3` | Nederländsk förmögenhetsskatt (schablonavkastning) | Nederländerna (NL) |

### 3.3 Lägg till en ny regim — checklista

1. Implementera `simulate()`, `simulateYear()`, `getUI()` i `TAX_REGIMES`-objektet i `tax-regimes.js`
2. Använd `simulateYearNoOp()` som `simulateYear` om skatten inte dras från kontot löpande
3. Lägg till nödvändiga I18N-nycklar i `app.js` om regimen behöver nya UI-texter
4. Lägg till regressionstest i `test.js` (Svit 2) med pinnade facit
5. Lägg till browser-test i `runTests()` i `tax-regimes.js`

Exempel på framtida regimer:
- `PRE_TAX_DEFERRED` — US 401k/Traditional IRA (avdragsgilla insättningar, inkomstskatt vid uttag)
- `TIME_TEST_CGT` — Tjeckien/Slovakien/Slovenien (skattefritt efter X års innehav)
- `EXIT_TAX` — Skatt på orealiserade vinster vid utflyttning

> **Notera:** Nederländerna (NL) är det enda landet där standardregimen inte är
> `CGT_ONLY` — den använder `DUTCH_BOX3` som standardregim. All kod i `app.js`
> som väljer regim använder `TAX_REGIMES[c.standardRegime]` (aldrig hårdkodat).

### 3.4 `simulateYear()` — viktigt för tidslinjen

`buildYearTimeline()` anropar `regime.simulateYear()` för varje år i tidslinjen.
Metoden får saldot FÖRE årets tillväxt, EFTER årets tillväxt, årets insättningar,
ett carry-state (godtyckligt objekt) och regim-parametrar. Den returnerar ett
justerat saldo, eventuell skatt för året, och ett nytt carry-state.

**De flesta regimer använder `simulateYearNoOp()`** — endast `LAGER_ANNUAL`
(dansk ASK) har en egen implementation eftersom skatten dras från kontot varje år.

---

## 4. Landskonfiguration — 100 % datadriven

### 4.1 Struktur för en landspost

Varje land i `COUNTRY_CONFIG` (i `countries.js`) har denna struktur:

```javascript
SE: {
    code: 'SE',
    name: { sv: 'Sverige', en: 'Sweden' },
    currency: 'SEK',
    locale: 'sv-SE',
    region: 'nordic',

    standardRegime: 'CGT_ONLY',
    standardParams: { capitalGainsTax: 0.30 },

    taxAdvRegime: 'ISK',
    taxAdvParams: { iskSchablonGolv: 1.25, iskFribelopp: 300000, ... },

    ui: {
        sv: { taxAdvLabel: '...', taxAdvDesc: '...', taxAdvTip: '...', taxAdvSliderHint: '...' },
        en: { taxAdvLabel: '...', taxAdvDesc: '...', taxAdvTip: '...', taxAdvSliderHint: '...' }
    }
}
```

### 4.2 Lägg till ett nytt land — steg-för-steg

1. **Avgör vilken regim landet använder** — standard är alltid `CGT_ONLY`. Om landet har ett skattegynnat konto, identifiera rätt regim (t.ex. `TAX_FREE_WRAPPER` för UK ISA).

2. **Lägg till landsposten** i `COUNTRY_CONFIG` i `countries.js`. Fyll i alla fält: valuta, locale, region, skatteparametrar, och UI-texter på både svenska och engelska.

3. **Lägg till flagga-SVG** i `FLAGS`-objektet i `app.js` (24×16 viewBox). `CTRY_OPTIONS` byggs automatiskt från `COUNTRY_CONFIG` — inget mer behövs.

4. **Om regimen redan finns:** Klart. Inga ändringar i `app.js`, `tax-regimes.js` eller någon annanstans.

5. **Om regimen är ny:** Följ checklistan i §3.3 först.

### 4.3 Regioner

`REGIONS`-objektet i `countries.js` definierar geografisk gruppering för
landsdropdownen:

```javascript
var REGIONS = {
    nordic:   { order: 1, label: { sv: 'Norden',         en: 'Nordic countries' } },
    western:  { order: 2, label: { sv: 'Västeuropa',     en: 'Western Europe'   } },
    // ... etc
};
```

Länder sorteras i dropdownen efter `REGIONS[country.region].order` → landsnamn.

---

## 5. Matematiska beräkningar — vad som gäller

### 5.1 Sammansatt ränta (Compound Interest)

Månatlig kapitalisering — `computeFV()` i `core.js`. Formeln:

```
FV = P·(1+r)^n  +  PMT·((1+r)^n − 1) / r
```

där `r = årsränta / 12`, `n = år × 12`, `PMT = månadsinsättning`.

Specialfall `r = 0` hanteras separat: `FV = P + PMT × n`.

### 5.2 Förvaltningsavgifter (TER)

Avgifter modelleras som reducerad nettotillväxttakt i `computeNetAfterFees()`:
`monthlyRateNet = (annualRate − fees) / 100 / 12`

### 5.3 Kapitalvinstskatt

`computeCapitalGainsTax()` i `core.js` hanterar grundläggande CGT med stöd för
progressiv skattesats (via threshold/rateHigh). Fallback till `KAPITALVINSTSKATT`
(30 %) om ingen rate anges.

### 5.4 ISK (Sverige)

Implementeras av `TAX_REGIMES.ISK` i `tax-regimes.js`. Följer Skatteverkets
kvartalsformel exakt. Skatten minskar INTE kontosaldot — `netValue = balance − totalTax`.

### 5.5 Inflation

`realValue = nominalVärde / (1 + inflation)^år` — sammansatt diskontering.

### 5.6 Sparmål — binärsökning

Övre gräns `hi = nominalTarget`. Anropar `regime.simulate()` i varje iteration.
Ändra inte sökalgoritmens struktur utan att verifiera att `node test.js` är grönt.

---

## 6. Testkrav — obligatoriskt

### 6.1 Kör alltid `node test.js` efter ändringar i `calc/`

```bash
node test.js
```

Exitkod `0` = alla tester gröna. Exitkod `1` = stopp, åtgärda innan du går vidare.

### 6.2 Vad som triggar obligatorisk test-körning

- Ändringar i **någon** fil under `calc/` (alltid)
- Ändringar i `app.js` som berör `calculateAdvanced()`, `calculateGoal()`,
  `buildYearTimeline()`, eller `renderBreakdown()`
- Ändringar i `index.html` som berör input-fält eller deras ID:n
- Ändringar i konstanter (skattesatser, fribelopp, golv)

### 6.3 Testernas struktur

```
Svit 1 (runTests)  — i tax-regimes.js, körs i webbläsaren vid localhost
Svit 2             — regressionstest med pinnade facit (beräkningar)
Svit 3             — formaterings- och valideringsfunktioner
```

### 6.4 Lägg till test vid ny funktionalitet

- **Ny regim:** Lägg till regressionstest i `test.js` Svit 2 OCH ett snabbtest
  i `runTests()` i `tax-regimes.js`.
- **Nytt land med befintlig regim:** Inga nya tester krävs (regressionstesterna
  täcker regimen redan). Verifiera att `node test.js` fortfarande är grönt.
- Pinnade facit ska beräknas manuellt mot formeln innan de låses.

---

## 7. Säkerhet — hårdkrav

### 7.1 Content Security Policy

Gällande CSP (både i `index.html` meta-tagg och i `_headers`):

```
default-src 'none';
script-src  'self' 'sha256-OadHFs9E68V4Ppz+Z/IE+vFaitpd5HD9mS1vSLYNK5A=';
style-src   'self' 'unsafe-inline';
img-src     data:;
form-action 'none';
base-uri    'none';
```

Hash:en gäller `<script type="application/ld+json">` (JSON-LD strukturerad data).
`script-src 'self'` täcker alla externa `.js`-filer (inklusive `calc/**/*.js`).

**Regler:**
- Ta **aldrig** bort eller försvaga `default-src 'none'`, `form-action 'none'`,
  eller `base-uri 'none'`.
- Lägg **aldrig** till `script-src 'unsafe-eval'`.
- Lägg **aldrig** till externa domäner i `script-src` eller `style-src`.
- Uppdatera hashen i **både** `index.html` och `_headers` om JSON-LD-blocket ändras.

### 7.2 Input-validering

- `parseFloat()`, aldrig `parseInt()` för decimal-fält.
- `isValidNumber()` från `calc/utils.js` kontrollerar alla beräkningsresultat.
- Returnera aldrig `NaN`, `Infinity` eller `undefined` från beräkningsfunktioner.

### 7.3 XSS-skydd

- `textContent` för all användarinmatning — aldrig `innerHTML`.
- `data-i18n-html` används ENDAST för hårdkodade översättningssträngar med
  HTML-taggar (aldrig användarinmatning).
- Tidslinjetabellen byggs med `createElement()` + `textContent`.

### 7.4 Övriga säkerhetsregler

- Alla `<button>` har `type="button"`.
- Alla `<label>` har `for="..."` som pekar på existerande input-id.
- `form-action 'none'` — inga `<form>` får ha `action`-attribut.
- `new Function()` används endast i `test.js` (Node.js) — aldrig i webbläsarkoden.

---

## 8. UI-standarder

### 8.1 Design — ändra inte utan instruktion

Guld/brun-tema, serif-typografi, trekolumns layout (≥900px). Alla befintliga
funktioner ska finnas kvar:
- Pengamaskin + Sparmål-flikar
- TaxAdvantage-toggle med landsspecifik regim-slider
- Tidslinje-tabell + Canvas-diagram med "Avkastning +"-kolumn
- Ränta-på-ränta-explainer (`#rprBody`)
- Tooltips (`data-tip`)
- Realtidsberäkning (debounce 300 ms, 150 ms för checkboxar)
- Inflationsjustering och realvärdesvisning
- Formateringshints under belopps-fält

### 8.2 DOM-struktur för resultat

```
#advSummary / #goalSummary     (.results, show/hide)
#advTimeline / #goalTimeline   (.results, show/hide)
```

Show/hide sker på **båda** samtidigt:
```javascript
['advSummary','advTimeline'].forEach(id => document.getElementById(id).classList.add('show'));
```

### 8.3 Responsivitet

| Bredd | Layout |
|---|---|
| < 768px | Mobil — staplade kolumner |
| 768px–899px | Mellan — staplade |
| ≥ 900px | Trekolumns grid |

Layout ska fungera på 320px bredd. Touch-målytor ≥ 44×44px.

### 8.4 Kodstil

- `var`, inte `let`/`const` (konsekvent genom hela kodbasen — inga build steps).
- Tydlighet framför korthet i beräkningslogik.
- Korthet framför tydlighet i UI-rendering.
- Inga klasser, ramverk eller state-management-bibliotek.

---

## 9. i18n — språkstöd

### 9.1 Översättningslexikonet

Alla användarsynliga strängar finns i `I18N`-objektet i `app.js` med nycklar för
`sv` och `en`. Nya nycklar läggs till i **båda** språkversionerna samtidigt.

### 9.2 `textContent` vs `innerHTML`

- `data-i18n` → `textContent` (dödar underliggande HTML — använd för ren text)
- `data-i18n-html` → `innerHTML` (bevarar `<strong>`, `<em>`, `<br>` — använd
  ENDAST för hårdkodade översättningar, aldrig användarinmatning)

### 9.3 Språk och land är oberoende

Användaren kan välja vilket språk som helst med vilket land som helst.
`COUNTRY_CONFIG.ui[lang]` styr landsspecifika UI-texter. `I18N[lang]` styr
generella UI-texter. De samverkar aldrig — en ändring i språk påverkar
aldrig skatteberäkningar, och ett byte av land påverkar aldrig språkvalet.

---

## 10. Lärdomar — fällorna att undvika

### 10.1 Tidslinjen är nu regim-agnostisk

`buildYearTimeline()` anropar `regime.simulateYear()` för per-år-justeringar.
**Ingen** kontotyp-specifik logik finns kvar i tidslinjen. När en ny regim
läggs till, implementera `simulateYear()` korrekt — inget annat behöver ändras.

### 10.2 CSS-specificitet och `.results`-paneler

`.results` har `display: none`, `.results.show` har `display: block`.
**Alla** CSS-regler som sätter `display` på `.results` måste inkludera `.show`:

```css
/* RÄTT */
.tab-summary .results.show { display: block; }
```

### 10.3 `updateCountryUI()` är nu datadriven

Funktionen läser UI-texter från `COUNTRY_CONFIG.ui[lang]` och regim-metadata
från `TAX_REGIMES[id].getUI()`. Inga hårdkodade landsspecifika strängar.
Alla UI-tillstånd (opacity, pointer-events, display) återställs i alla grenar.

### 10.4 Ingen kodduplicering mellan `simulate()` och `simulateYear()`

Varje regim har EN implementation av skattelogiken — `simulate()` för den
fullständiga simuleringen och `simulateYear()` för per-år-versionen som
används av tidslinjen. Dessa två metoder får duplicera samma matematiska
formel (de opererar på olika tidsskalor), men logiken får aldrig finnas
på en tredje plats (t.ex. inline i `app.js`).

### 10.5 Regim-parametrar slås samman vid anrop

`calculateAdvanced()` och `calculateGoal()` skapar en kopia av landets
`standardParams`/`taxAdvParams` och slår samman med användarjusterade
värden från sliders innan `regime.simulate()` anropas. Originalobjekten
i `COUNTRY_CONFIG` muteras **aldrig**.

### 10.6 App-tester är oberoende av valt land

`runAppTests()` i `app.js` anropar `renderBreakdown()` med explicita
parametrar — det är inte beroende av `state.country`. Tester som behöver
specifika länder sätter `state.country` explicit.

### 10.7 Custom dropdown-komponenter — bygg bara vid behov

Native `<select>` stödjer inte HTML/flaggor i `<option>`. Custom dropdown
används endast för språk- och lands-väljarna. Bygg inte nya custom-komponenter
utan att först verifiera att native-element inte räcker.

---

## 11. Checklista innan du levererar

```
[ ] node test.js → exitkod 0 (58+ tester gröna)
[ ] Inga nya externa resurser (script, style, font, fetch)
[ ] Inga nya innerHTML-tilldelningar med rå användarinmatning
[ ] Tidslinjetabell byggs med createElement() + textContent
[ ] CSP-headern oförändrad eller stärkt (aldrig försvagad)
[ ] Vid ny regim: simulate(), simulateYear(), getUI() implementerade
[ ] Vid ny regim: tester i runTests() + test.js Svit 2
[ ] Vid nytt land: ui.sv + ui.en ifyllda med alla fält
[ ] Vid nytt land: flagga-SVG tillagd i FLAGS i app.js
[ ] Befintliga UI-funktioner intakta (tooltip, debounce, tidslinje, RPR)
[ ] Alla <button> har type="button"
[ ] Alla <label> har for="..." eller är ersatta med <p>/<div>
[ ] Trekolumns layout fungerar på ≥ 900px, enkelt staplade på < 900px
[ ] Responsiv layout fungerar på 320px
[ ] Vid i18n-ändringar: data-i18n-html för text med HTML-taggar
[ ] Inga mutationer av COUNTRY_CONFIG-objekt vid merge av params
```
