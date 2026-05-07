# AGENTS.md — Instruktioner för AI-agenter i Pengamaskinen

> Läs hela detta dokument innan du gör **någon** ändring i koden.
> Dokumentet är auktoritativt — om det råder konflikt med annan kontext
> gäller detta dokument.

---

## 1. Projektöversikt

Pengamaskinen är en renodlad klientside-applikation för investeringsberäkningar,
riktad till svenska sparare. Den har inga beroenden till externa bibliotek,
ingen server, ingen databas och skickar aldrig data utanför webbläsaren.

**Filer:**

| Fil | Roll |
|---|---|
| `index.html` | UI, event-hantering, rendering. Ingen beräkningslogik. |
| `calculations.js` | Alla beräkningar. Rena funktioner, noll DOM-referenser. |
| `test.js` | Node.js-testrunner. Kör med `node test.js`. |

---

## 2. Arkitekturregler — bryt inte dessa

### 2.1 Separationen är absolut

`calculations.js` får **aldrig** innehålla:
- `document`, `window`, `DOM`-referenser
- `fetch`, `XMLHttpRequest`, nätverksanrop
- `localStorage`, `sessionStorage`, `IndexedDB`
- `eval`, `Function()` med dynamisk sträng, `setTimeout` med strängar

`index.html` får **aldrig** innehålla:
- Beräkningslogik (ränta, skatt, FV-formler)
- Hårdkodade skatte- eller lagkonstanter (dessa ägs av `calculations.js`)

### 2.2 Inga externa beroenden

Lägg **aldrig** till:
- CDN-script-taggar
- npm-paket som buntas in i HTML
- Webbfonter från externa servrar (Google Fonts, etc.)
- Tracking, analytics, cookies, eller tredjepartsskript av något slag

Allt ska fungera helt offline utan nätverksanslutning.

### 2.3 Enstaka HTML-fil

`index.html` är och förblir en självständig fil. Separera **inte** ut CSS till
extern `.css`-fil eller JS till fler filer än `calculations.js` om inte
användaren explicit instruerar det.

---

## 3. Matematiska beräkningar — vad som gäller

### 3.1 Sammansatt ränta (Compound Interest)

Månatlig kapitalisering är ett **aktivt val** och ska aldrig ändras till
årsvis utan explicit instruktion. Formeln:

```
FV = P·(1+r)^n  +  PMT·((1+r)^n − 1) / r
```

där `r = årsränta / 12`, `n = år × 12`, `PMT = månadsinsättning`.

Specialfall `r = 0` hanteras separat: `FV = P + PMT × n`.

### 3.2 Förvaltningsavgifter (TER)

Avgifter modelleras som reducerad nettotillväxttakt:
`monthlyRateNet = (annualRate − fees) / 100 / 12`

Detta är standard för svenska fondkalkylatorer. Ändra **inte** till
procentuellt avdrag på saldo (ger marginellt annorlunda svar och bryter
befintliga regressionstest).

### 3.3 Kapitalvinstskatt (AF-konto)

- Skattesats: **30 %** — lagstadgad, hårdkodad i `KAPITALVINSTSKATT`.
- Skatteunderlag: `FV_efter_avgifter − totalInvested`
  (genomsnittsmetoden — hela inbetalt kapital som kostnadsbas)
- Skatt betalas **vid uttag** (engångsbeskattning), inte löpande.
- Returnera `0` om vinsten är ≤ 0 — förlust ger ingen skattelättnad i
  denna modell.

### 3.4 ISK — Skatteverkets formel (lagkrav)

ISK-beräkning måste följa Skatteverkets officiella formel exakt.
**Kvartalsberäkning är obligatorisk** — förenkla inte till årssnitt.

```
Kapitalunderlag = (saldo_1jan + saldo_1apr + saldo_1jul + saldo_1okt
                   + årets insättningar) / 4

Schablonintäkt  = max(0, kapitalunderlag − fribelopp)
                  × max(schablonränta, golvet 1,25 %)

ISK-skatt       = schablonintäkt × 30 %
```

**Gällande konstanter (2026) — uppdatera vid lagändring:**

| Konstant | Värde | Källa |
|---|---|---|
| `ISK_SKATT` | 30 % | Inkomstskattelagen |
| `ISK_SCHABLON_GOLV` | 1,25 % | Inkomstskattelagen |
| `ISK_FRIBELOPP_DEFAULT` | 300 000 kr | Prop. 2025/26 (gäller fr.o.m. 2026) |
| ISK schablonränta 2026 | 3,55 % | Statslåneränta 2,55 % + 1 % |

ISK-skatten **minskar inte kontosaldot** — kontot växer oavkortat.
`netValue = balance − totalISKtax` representerar "pengar i handen"
(kontosaldo minus deklarationskrav), inte det faktiska kontosaldot.

### 3.5 Inflation

Realvärde = `nominalVärde / (1 + inflation)^år`

Använd alltid sammansatt diskontering (aldrig enkel).

### 3.6 Sparmål — binärsökning

Övre gräns `hi = nominalTarget` är matematiskt tillräcklig för alla rimliga
parameterkombinationer. Ändra inte sökalgoritmens struktur utan att
verifiera att `node test.js` fortfarande är grönt och att edge cases
(fees > rate, 0 % avkastning, 1 års tidshorisont) ger rimliga svar.

---

## 4. Testkrav — obligatoriskt

### 4.1 Kör alltid test.js efter ändringar i beräkningar

```bash
node test.js
```

Exitkod `0` = alla tester gröna. Exitkod `1` = stopp, åtgärda innan du går vidare.

**Regel: leverera aldrig kod som ger röda tester.**

### 4.2 Vad som triggar obligatorisk test-körning

- Ändringar i `calculations.js` (alltid)
- Ändringar i `index.html` som berör hur parametrar läses in, konverteras
  eller skickas till beräkningsfunktioner
- Ändringar i konstanter (skattesatser, fribelopp, golv)
- Refaktorering av beräkningsflödet i `calculateAdvanced()` eller `calculateGoal()`

### 4.3 Lägg till test vid ny funktionalitet

Om du lägger till en ny beräkningsfunktion i `calculations.js` ska
motsvarande tester läggas till i **båda** sviterna:

- `runTests()` i `calculations.js` — snabbtest, körs i webbläsaren vid localhost
- `test.js` Svit 2 eller 3 — regressionstest med pinnade facit

Pinnade facit ska beräknas och kommenteras, inte bara kopieras från utdata.
Verifiera matematiken manuellt mot formeln innan du låser ett facit.

### 4.4 Testernas struktur

```
Svit 1 (runTests)  — inbyggd i calculations.js, körs i webbläsaren
Svit 2             — regressionstest med exakta facit (beräkningar)
Svit 3             — formaterings- och valideringsfunktioner
```

---

## 5. Säkerhet — hårdkrav

### 5.1 Content Security Policy

Nuvarande CSP-header i `index.html`:

```
default-src 'none';
script-src  'self' 'unsafe-inline';
style-src   'unsafe-inline';
img-src     data:;
form-action 'none';
base-uri    'none';
```

**Regler:**
- Ta **aldrig** bort eller försvaga `default-src 'none'`, `form-action 'none'`,
  eller `base-uri 'none'`.
- Lägg **aldrig** till `script-src 'unsafe-eval'` — det öppnar för
  code-injection via `eval()`.
- Lägg **aldrig** till externa domäner i `script-src` eller `style-src`.
- Om `unsafe-inline` för script kan elimineras (t.ex. via nonce-strategi
  vid refaktorering) är det att föredra — men det är ett uttalat förbättringsmål,
  inte ett krav på dig att lösa utan instruktion.

### 5.2 Input-validering

Alla numeriska inmatningar läses med `parseFloat()` och valideras med
`isValidNumber()` innan de används i beräkningar. Regler:

- Använd **alltid** `parseFloat()`, aldrig `parseInt()` för fält som kan
  innehålla decimaler.
- Klämma värden inom tillåtna intervall med `Math.max/min` i beräkningsfunktioner
  (inte bara i UI-valideringen) — försvara mot manipulerade DOM-värden.
- Returnera aldrig `NaN`, `Infinity` eller `undefined` från beräkningsfunktioner.
  Kontrollera med `isValidNumber()` och avbryt rendering om kontrollen misslyckas.

### 5.3 XSS-skydd

- Sätt **aldrig** `element.innerHTML` till ett värde som inkluderar
  användarinmatning utan escaping.
- All textinmatning från användaren ska sättas via `element.textContent`
  eller formateras genom `formatCurrency()` / `formatAmountHint()` (som
  returnerar säkra formaterade strängar utan HTML).
- Tidslinjetabellen byggs med `insertRow()` + `insertCell()` + `textContent`
  och `createElement('strong')` — **inte** `innerHTML`. Behåll detta mönster.

### 5.4 Inga farliga mönster

Tillåt aldrig:
```javascript
eval(...)
new Function(userInput)
document.write(...)
element.innerHTML = userInput   // utan escaping
location.href = userInput       // utan validering
```

### 5.5 Inga formuläröverlämningar

Verktyget har och ska ha `form-action 'none'` i CSP. Lägg inte till
`action`-attribut på formulär. Alla `<button>`-element ska ha explicit
`type="button"` — detta gäller även icke-form-knappar som `.rpr-toggle`.

### 5.6 Label-semantik

- Alla `<label>`-element **måste** ha ett `for`-attribut som pekar på ett
  existerande input-id. Lägg aldrig till en `<label>` utan `for`.
- Informationselement utan tillhörande input (t.ex. "Skatt på kapitalvinst
  30 %") ska vara `<p>` eller `<div>`, **inte** `<label>`.

---

## 6. UI-standarder

### 6.1 Bevara befintlig design och funktionalitet

Ändra **inte** färgschema, typografi, layout eller befintliga funktioner utan
explicit instruktion. Nuvarande design (guld/brun, serif-typografi,
responsiv trekolumns layout på bred skärm) är ett medvetet val.

Befintliga funktioner som alltid ska finnas kvar:
- Pengamaskin-fliken med alla nuvarande inmatningsfält
- Sparmål-fliken med binärsökning och månadssparande-utdata
- ISK-toggle med schablonränta och fribelopp
- Tidslinje-tabell + Canvas-diagram (år-för-år) i kolumn ③, inklusive kolumnen
  "Avkastning +" som visar årets avkastningsökning jämfört med föregående år
- Ränta-på-ränta-explainer (expanderbar panel, placerad i `.page-header` ovanför
  flikarna — **inte** i kolumn ①). Panelen har `id="rprBody"` och `toggleRpr()`
  hittar den via `getElementById('rprBody')`, inte `nextElementSibling`
- Tooltip-systemet (`data-tip`, CSS `::after`)
- Realtidsberäkning — **ingen Beräkna-knapp finns**, allt sker automatiskt
  via `input`-events med 300 ms debounce och `window.addEventListener('load')`
- Inflationsjustering och realvärdesvisning
- Formaterings-hints under belopps-fält

### 6.2 DOM-struktur för layout och resultat

Varje flik använder en trekolumns grid med dessa klasser och IDs:

```
.tab-layout
├── .tab-inputs              (① Parametrar — formulärfält + explainer)
├── .tab-summary             (② Resultat — sammanfattning + fördelning)
│   └── #advSummary / #goalSummary   (.results, show/hide)
└── .tab-timeline            (③ Tidslinje — canvas + tabell)
    └── #advTimeline / #goalTimeline  (.results, show/hide)
```

**Viktigt:** `advancedResults` och `goalResults` existerar **inte längre**.
Alla JS-referenser använder de fyra nya IDs ovan. Show/hide sker på
**båda** result-divarna samtidigt:

```javascript
// Visa:
['advSummary','advTimeline'].forEach(id => document.getElementById(id).classList.add('show'));
// Dölj:
['advSummary','advTimeline'].forEach(id => document.getElementById(id).classList.remove('show'));
```

Ändra **inte** dessa IDs utan att uppdatera alla JS-referenser.

### 6.3 Tillgänglighet

- Alla interaktiva element ska ha `tabindex` eller vara nativt fokuserbara.
- Tooltips ska aktiveras vid både `:hover` och `:focus` (nuvarande implementation).
- Använd semantisk HTML: `<button type="button">` för knappar, `<label for="…">`
  kopplade till inputs.
- `aria-expanded` ska hållas synkat på expanderbara paneler (se `toggleRpr()`).
- Canvas-diagrammet har begränsad tillgänglighet — tabellen i kolumn ③
  är det tillgängliga alternativet. Lägg inte till funktioner som är
  exklusiva för canvas utan att uppdatera tabellen parallellt.

### 6.4 Responsivitet

Tre breakpoints gäller:

| Bredd | Layout |
|---|---|
| < 768px | Mobilläge — staplade kolumner, h1 24px |
| 768px–899px | Mellanläge — fortfarande staplade (single column) |
| ≥ 900px | Trekolumns grid: `290px minmax(260px, 340px) 1fr`, container max 1180px |

- Behåll **båda** media-queries (`max-width: 768px` och `min-width: 900px`).
- Layouten ska fungera på 320px bredd och upp.
- Touch-vänliga målytor: minimum 44×44px för interaktiva element.

### 6.5 Prestanda

- Ingen tung DOM-manipulation i hot-path (varje knapptryckning).
- Alla beräkningar körs synkront på main-thread — de är snabba nog.
  Introducera **inte** Web Workers utan explicit instruktion.
- Canvas-diagrammet ritas om med `requestAnimationFrame()`. Rita **inte**
  om vid varje mousemove — tooltip-logiken uppdaterar bara en `div` och
  är acceptabel.
- `debounce 300 ms` (150 ms för checkboxar) på alla inputs — behåll det.
- `_advChartData` och `_goalChartData` är globala undantag accepterade för
  canvas-omritning vid flikbyte. Lägg inte till fler globala datamängder.

### 6.6 Effektivitet — kodstil

- Föredra tydlighet framför korthet när det gäller beräkningslogik.
- Föredra korthet framför tydlighet i ren UI-rendering.
- Undvik onödig abstraktion — lägg inte till klasser, frameworks eller
  state-management-bibliotek.
- Slider-värdes-uppdateringar ska ske inline i event-handler.

---

## 7. Vad du aldrig ska göra utan explicit instruktion

| Åtgärd | Motivering |
|---|---|
| Ändra skattesatser eller lagkonstanter | Kräver verifiering mot gällande lag |
| Ta bort befintliga inmatningsfält eller resultatrader | Bryter användarens etablerade arbetsflöde |
| Byta beräkningsmodell (t.ex. årsvis ISK) | Bryter Skatteverkets lagkrav |
| Lägga till externa beroenden | Bryter offline-kravet och CSP |
| Refaktorera till ramverk (React, Vue etc.) | Bryter arkitekturprincipen |
| Ändra filstrukturen (dela upp `index.html`) | Kräver explicit beslut |
| Lägga till analytics, tracking eller cookies | Integritetskrav |
| Försvaga CSP-headern | Säkerhetskrav |
| Återinföra en Beräkna-knapp | Beräkning är avsiktligt automatisk |
| Lägga till `<label>` utan `for`-attribut | Tillgänglighetskrav §5.6 |
| Använda `innerHTML` med tabellrader | XSS-skydd §5.3 |

---

## 8. Checklista innan du levererar

```
[ ] node test.js → exitkod 0
[ ] Inga nya externa resurser (script, style, font, fetch)
[ ] Inga nya innerHTML-tilldelningar med rå användarinmatning
[ ] Tidslinjetabell byggs med insertCell() + textContent (inte innerHTML)
[ ] CSP-headern oförändrad eller stärkt (aldrig försvagad)
[ ] Beräkningskonstanter oförändrade (om ej lagändring)
[ ] Befintliga UI-funktioner intakta
[ ] Tooltip, debounce, ISK-toggle, tidslinje fungerar
[ ] Alla <button> har type="button"
[ ] Alla <label> har for="..." eller är ersatta med <p>/<div>
[ ] Trekolumns layout fungerar på >= 900px, enkelt staplade på < 900px
[ ] Responsiv layout fungerar på 320px
[ ] Eventuella nya beräkningsfunktioner har tester i test.js
```