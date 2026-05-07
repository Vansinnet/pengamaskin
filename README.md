# Pengamaskinen – Nordisk investeringskalkylator

**🌐 [Öppna Pengamaskinen →](https://pengamaskin.pages.dev)**

Pengamaskinen är en **gratis, webbaserad investeringskalkylator** för nordiska sparare. Beräkna hur dina pengar växer med ränta-på-ränta, landsspecifika skatteregler, förvaltningsavgifter och inflation — allt på en sida, utan registrering.

Stöd för **Sverige, Norge, Danmark, Finland och Island** med respektive lands skattesystem och kontotyper. Tillgänglig på både **svenska och engelska**.

## 🎯 Funktioner

### Pengamaskin — Beräkna framtida värde
Se hur ditt sparande växer år för år med:
- Startkapital och månadligt sparande
- Årlig avkastning (nominell ränta, månadsvis kapitalisering)
- Förvaltningsavgifter (TER)
- Landsspecifika skatteregler automatiskt (se landstabell nedan)
- Skattegynnat konto per land (ISK, ASK, OSK)
- Inflationsjustering för realvärde

### Sparmål — Räkna ut månadssparande
Sätt ett målbelopp och få svar på frågan "Hur mycket måste jag spara varje månad?"
- Målbelopp (nominellt eller i dagens pengar)
- Tidsperiod
- Binärsökning för exakt månadsbelopp

### Visualisering
- **Fördelningsdiagram** — hur fördelas slutvärdet på insatt kapital, avkastning, avgifter och skatt?
- **År-för-år tidslinje** — detaljerad tabell + interaktivt Canvas-diagram
- **Ränta-på-ränta-explainer** — expanderbar förklaring med visuella staplar

## 🌍 Länder och kontotyper

| Land | Standardkonto | Skattegynnat konto | Kapitalvinstskatt |
|------|--------------|-------------------|-------------------|
| 🇸🇪 Sverige | AF-konto | **ISK** (schablonbeskattning, 1,25% golv, 300k fribelopp) | 30 % |
| 🇳🇴 Norge | Vanlig konto | **ASK** (skjermingsfradrag ~2,5%/år, beskattas vid uttag) | 37,84 % |
| 🇩🇰 Danmark | Frit depot | **ASK** (17 % årlig lagerbeskatning, dras från kontot) | 27/42 % |
| 🇫🇮 Finland | Arvo-osuustili | **OSK** (uppskjuten skatt, beskattas vid uttag) | 30/34 % |
| 🇮🇸 Island | Venjulegur reikningur | — (inget skattegynnat konto) | 22 % |

### Så fungerar skattegynnade konton i verktyget:

- **Svensk ISK** — Skatteverkets officiella kvartalsformel: `(saldo 1/1 + 1/4 + 1/7 + 1/10 + insättningar) / 4`. Skatten betalas separat (minskar inte kontosaldot).
- **Norsk ASK** — Skjermingsfradrag (riskfri avkastning × anskaffningsvärde) dras av från vinsten före skatt. Årligt fradrag ackumuleras över sparperioden.
- **Dansk ASK** — 17 % årlig skatt på faktisk avkastning (lagerbeskatning). Skatten dras direkt från kontot. Förluster kan framföras till nästa år.
- **Finsk OSK** — Uppskjuten skatt vid uttag. Progressiv skatt 30/34 % med gräns vid 30 000 €.
- **Island** — Endast standardkonto med 22 % kapitalvinstskatt.

## 💡 Användning

1. **Öppna** [pengamaskin.pages.dev](https://pengamaskin.pages.dev)
2. **Välj land** i dropdown-menyn — skatteparametrar och kontotyper anpassas automatiskt
3. **Välj språk** — svenska eller engelska, oberoende av valt land
4. **Fyll i** dina siffror — resultatet uppdateras i realtid (auto-beräkning)
5. **Experimentera** — ändra värden för att jämföra scenarier

## 🛡️ Säkerhet & integritet

- **Ingen server:** All beräkning sker i din webbläsare
- **Ingen datainsamling:** Vi sparar inte din data
- **Inga externa beroenden:** Vanilla JavaScript, inga CDN:er, inga trackers
- **Open Source:** MIT-licens — fritt att använda och modifiera
- **CSP-skyddad:** Content Security Policy förhindrar externa angrepp
- **Offline-kapabel:** Fungerar utan nätverksanslutning efter första laddning

## 📊 Matematiska antaganden

### Ränta-på-ränta
Månadsvis kapitalisering med end-of-month-insättningar:
```
FV = P(1+r)^n + PMT × [((1+r)^n − 1) / r]
```
Där `r = årsränta / 12`, `n = år × 12`, `PMT = månadsinsättning`.

### Avgifter
`nettoränta = annualRate − fees` — avgifter modelleras som reducerad nettotillväxttakt.

### Inflation
`Realvärde = nominellt värde / (1 + inflation)^år` — sammansatt diskontering.

## 📖 Exempel

**Scenario:** Du sparar 1 000 kr/månad under 30 år, börjar med 50 000 kr, svensk ISK.

| Inställning | Värde |
|-------------|-------|
| Land | Sverige |
| Startkapital | 50 000 kr |
| Månadligt | 1 000 kr |
| Avkastning | 7 % årlig |
| Period | 30 år |
| Avgifter | 0,5 % |
| Konto | ISK |

**Resultat:** Investerat: 410 000 kr · Slutvärde: ~2 800 000 kr (efter ISK-skatt) · Avkastning: ~2 390 000 kr netto.

*Notera: Exemplet är simulerat. Verklig avkastning varierar.*

## 🔧 Teknisk information

| Egenskap | Detalj |
|----------|--------|
| Språk | JavaScript (vanilla, inga ramverk) |
| Styling | CSS3 (guld/brun-tema, flexbox, responsiv grid) |
| Arkitektur | `calculations.js` (rena funktioner) + `app.js` (UI) |
| i18n | Dynamiskt lexikon, `data-i18n`-attribut |
| Flaggor | Inline SVG, CSP-kompatibla |
| Diagram | Canvas med tooltip + tangentbordsnavigering |
| Tester | `node test.js` — 58 regressionstester |
| Licens | MIT |

## 📮 Feedback & bidrag

Har du förslag på förbättringar? Hittade du en bugg? Skapa ett [GitHub issue](https://github.com/Vansinnet/pengamaskin/issues) eller en pull request!

## ⚠️ Ansvarsfriskrivning

Pengamaskinen är ett **utbildningsverktyg**. Skatteregler kan ändras — kontrollera alltid mot Skatteverket/Skatteetaten/Vero/Skatturinn för aktuella satser. Använd siffrorna som vägledning, inte som garantier. För personlig finansiell rådgivning, kontakta en licensierad rådgivare.

---

**🌐 [Starta Pengamaskinen nu →](https://pengamaskin.pages.dev)**
