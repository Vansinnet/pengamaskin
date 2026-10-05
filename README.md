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

Landsspecifika förenklingar står i appen under *Skatteregler i …* och i `src/rules/countries.js`.

## Kod

Inga beroenden och inget byggsteg. Webbläsaren laddar ES-moduler direkt.

```
index.html, styles.css, fonts/     sidan (Schibsted Grotesk, OFL-licens)
src/
  main.js                          start, formulär och händelser
  rules/countries.js               skatteregler per land — ren data med källor
  engine/
    simulate.js                    den enda månadsloopen → huvudbok (en rad per år)
    regimes/                       en fil per skatteregel (ISK, dansk ASK, Box 3 …)
    account.js                     vanligt/skattegynnat konto, insättningstak
    caps.js, tax.js, goal.js       tak, skatt på vinst, sparmål (intervallhalvering)
  view/
    model.js                       indata → allt som visas (ren funktion, testad)
    accounts.js, chart.js, panels.js   ritar korten, diagrammet och förklaringarna
  i18n/sv.js, en.js                alla texter
tests/                             node --test
```

Flödet är **regler → motor → vymodell → vy**. Sammanfattning, diagram och tabell läser alla från samma huvudbok och kan därför inte visa olika siffror.

### Köra lokalt

```bash
python3 -m http.server 8000      # eller valfri statisk server, öppna http://localhost:8000
npm test                         # Node 20+
```

### Lägga till ett land

1. Lägg till landet i `src/rules/countries.js` med en befintlig regim och dess parametrar.
2. Lägg till landets flagga i `src/view/flags.js`.
3. Kör `npm test`. Testerna kontrollerar texter, regim och valuta för alla länder.

En ny skatteregel skrivs som en ny fil i `src/engine/regimes/`. Den kan reagera vid årets början (`yearStart`), varje månad (`month`) och vid årets slut (`yearEnd`), och anger vad det skulle kosta i skatt att sälja allt (`taxIfSold`).

### Årlig uppdatering

`tests/rules.test.js` misslyckas när kalenderåret passerat `RULES_YEAR`. Så här uppdaterar du:

1. Gå igenom varje land i `src/rules/countries.js` mot källorna i `sources`. Kontrollera satser, fribelopp, tak och schablonräntor (t.ex. ISK).
2. Höj `RULES_YEAR` och `RULES_VERIFIED`.

### Content Security Policy

CSP:n finns både i `_headers` (Cloudflare Pages) och som meta-tagg i `index.html`. `script-src` innehåller en hash för JSON-LD-blocket. Om blocket ändras räknar du om hashen och uppdaterar båda ställena:

```bash
python3 -c "import re,hashlib,base64;h=open('index.html').read();m=re.search(r'ld\+json\">(.*?)</script>',h,re.S);print(base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode())"
```

## Ansvarsfriskrivning

Pengamaskinen är en förenklad modell för att förstå sparande. Den är inte finansiell rådgivning. Kontrollera alltid reglerna hos skattemyndigheten.

MIT-licens.
