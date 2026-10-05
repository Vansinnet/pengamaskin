# Pengamaskinen

**[Öppna Pengamaskinen →](https://pengamaskin.pages.dev)**

En gratis kalkylator som visar hur ett sparande växer, och hur mycket skatt, avgifter och inflation tar. Den har stöd för 19 europeiska länder och deras skatteregler. Kalkylatorn finns på svenska och engelska och har ljust och mörkt tema.

## Vad den gör

- **Två lägen.** *Vad blir mitt sparande värt?* räknar fram slutvärdet från startkapital och månadssparande. *Hur mycket behöver jag spara?* räknar baklänges från ett mål. Målet kan anges i dagens pengar.
- **Konton sida vid sida.** Landets vanliga konto jämförs alltid med landets skattegynnade konto (ISK, ASK, ISA, PEA …), och det som ger mest markeras.
- **Pengarnas väg.** Varje konto visar vägen från insatt belopp till slutsumma: insatt, plus avkastning, minus avgifter, minus skatt, kvar efter skatt och värdet i dagens pengar.
- **Så räknade vi.** Landets formel visas med användarens egna siffror.
- **År för år.** Ett diagram (tangentbordsstyrt) och en tabell.
- **Ränta-på-ränta.** Insättningar, enkel ränta och ränta-på-ränta jämförs med användarens egna siffror.
- **Insättningstak.** Det som inte ryms i ett skattegynnat konto räknas automatiskt på vanligt konto.

## Antaganden

| | |
|---|---|
| Avkastning | Effektiv årsavkastning före avgifter. Månadsfaktor = ((1 + avkastning) × (1 − avgift))^(1/12) |
| Avgift | Dras löpande på kapitalet (som en fonds TER) |
| Insättningar | I slutet av varje månad; startkapitalet 1 januari år 1 |
| Skatt vid försäljning | Allt antas säljas i slutet av sista året |
| Inflation | Realvärde = netto / (1 + inflation)^år |

Landsspecifika förenklingar står i appen under *Skatteregler i …* och i `src/rules/countries.ts`.

## Kod

Svelte 5 och TypeScript, byggt med Vite till statiska filer. Inga beroenden i webbläsaren utöver det Svelte kompilerar in, inga externa anrop. Sidan förrenderas vid bygget, så hela kalkylatorn syns innan JavaScript har laddats.

```
index.html                         sidans <head> (metadata, JSON-LD)
public/_headers                    säkerhetsheaders och CSP för Cloudflare Pages
scripts/prerender.js               efter bygget: förrendera sidan, lägg in CSP-hashen
src/
  main.ts, entry-server.ts         start i webbläsaren (hydrering) och vid förrenderingen
  App.svelte                       tillstånd: språk, land, tema och formulär
  styles.css, assets/fonts/        stilmall och typsnitt (Schibsted Grotesk, OFL-licens)
  rules/
    countries.ts                   skatteregler per land — ren data med källor
    types.ts                       typer: varje regim har egna parametrar
  engine/
    simulate.ts                    den enda månadsloopen → huvudbok (en rad per år)
    regimes/                       en fil per skatteregel (ISK, dansk ASK, Box 3 …)
    account.ts                     vanligt/skattegynnat konto, insättningstak
    caps.ts, tax.ts, goal.ts       tak, skatt på vinst, sparmål (intervallhalvering)
  view/
    model.ts                       indata → allt som visas (ren funktion, testad)
    inputs.ts, prefs.ts            formulärets validering, sparade val
    *.svelte                       komponenterna (formulär, konton, diagram, tabell …)
  i18n/sv.ts, en.ts                alla texter (samma nycklar, typkontrollerat)
tests/                             Vitest
```

Flödet är **regler → motor → vymodell → vy**. Sammanfattning, diagram och tabell läser alla från samma huvudbok och kan därför inte visa olika siffror.

### Köra lokalt

Kräver Node 22.12 eller senare.

```bash
npm install
npm run dev        # utvecklingsserver på http://localhost:5173
npm test           # tester (Vitest)
npm run check      # typkontroll (svelte-check)
npm run build      # bygger till dist/
npm run preview    # visar bygget på http://localhost:4173
```

### Cloudflare Pages

| Inställning | Värde |
|---|---|
| Byggkommando | `npm run build` |
| Utdatamapp | `dist` |
| Node-version | från `.node-version` (22) |

### Lägga till ett land

1. Lägg till landskoden i `CountryCode` i `src/rules/types.ts`.
2. Lägg till landet i `src/rules/countries.ts` med en befintlig regim och dess parametrar. TypeScript säger till om en parameter saknas eller är fel.
3. Lägg till landets flagga i `src/view/flags.ts` (krävs av typen).
4. Kör `npm run check` och `npm test`. Testerna kontrollerar texter, regim och valuta för alla länder.

En ny skatteregel skrivs som en ny fil i `src/engine/regimes/`, med sina parametrar i `src/rules/types.ts`. Den kan reagera vid årets början (`yearStart`), varje månad (`month`) och vid årets slut (`yearEnd`), och anger vad det skulle kosta i skatt att sälja allt (`taxIfSold`).

### Årlig uppdatering

`tests/rules.test.ts` misslyckas när kalenderåret passerat `RULES_YEAR`. Så här uppdaterar du:

1. Gå igenom varje land i `src/rules/countries.ts` mot källorna i `sources`. Kontrollera satser, fribelopp, tak och schablonräntor (t.ex. ISK).
2. Höj `RULES_YEAR` och `RULES_VERIFIED`.

### Content Security Policy

CSP:n står i `public/_headers` och tillåter bara filer från samma ursprung (`'self'`) plus JSON-LD-blocket i `index.html`. Vid bygget räknar `scripts/prerender.js` ut hashen för JSON-LD-blocket, skriver in den i `dist/_headers` och lägger samma CSP som meta-tagg i `dist/index.html`. Bygget avbryts om sidan skulle innehålla inline-skript eller `style`-attribut, eftersom CSP:n blockerar dem. Dynamiska mått sätts därför via `element.style` i webbläsaren, aldrig som attribut.

## Ansvarsfriskrivning

Pengamaskinen är en förenklad modell för att förstå sparande. Den är inte finansiell rådgivning. Kontrollera alltid reglerna hos skattemyndigheten.

MIT-licens.
