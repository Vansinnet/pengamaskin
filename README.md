# Pengamaskinen – Europeisk investeringskalkylator

**🌐 [Öppna Pengamaskinen →](https://pengamaskin.pages.dev)**

Pengamaskinen är en **gratis, webbaserad investeringskalkylator** för europeiska sparare. Beräkna hur dina pengar växer med ränta-på-ränta, landsspecifika skatteregler, förvaltningsavgifter och inflation — allt på en sida, utan registrering.

Stöd för **19 europeiska länder** med respektive lands skattesystem och kontotyper. Tillgänglig på både **svenska och engelska**.

## 🎯 Funktioner

### Pengamaskin — Beräkna framtida värde
Se hur ditt sparande växer år för år med:
- Startkapital och månadligt sparande
- Årlig avkastning (nominell ränta, månadsvis kapitalisering)
- Förvaltningsavgifter (TER)
- Landsspecifika skatteregler automatiskt
- Skattegynnat konto per land (ISK, ASK, OSK, ISA, PIR, IKE m.fl.)
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

## 🌍 Länder och regioner (19 länder)

| Region | Länder |
|--------|--------|
| Norden | 🇸🇪 Sverige, 🇳🇴 Norge, 🇩🇰 Danmark, 🇫🇮 Finland |
| Västeuropa | 🇩🇪 Tyskland, 🇫🇷 Frankrike |
| Brittiska öarna | 🇬🇧 Storbritannien, 🇮🇪 Irland |
| Benelux | 🇳🇱 Nederländerna, 🇧🇪 Belgien |
| Centraleuropa | 🇦🇹 Österrike |
| Östeuropa | 🇵🇱 Polen, 🇨🇿 Tjeckien |
| Sydeuropa | 🇮🇹 Italien, 🇪🇸 Spanien, 🇬🇷 Grekland |
| Baltikum | 🇪🇪 Estland, 🇱🇻 Lettland, 🇱🇹 Litauen |

### Skatteregimer (9 st, pluggbara)

| Regim | Beskrivning | Används av |
|-------|------------|-----------|
| `CGT_ONLY` | Kapitalvinstskatt vid försäljning (valfritt: Teilfreistellung, årlig fondschablon) | De flesta länders standardkonton |
| `ISK` | Svensk schablonbeskattning (kvartalsformel) | Sverige (SE) |
| `LAGER_ANNUAL` | Årlig lagerbeskattning, förluster förs fram utan tidsgräns | Danmark (DK) |
| `DEFERRED_SKJERMING` | Skatt vid uttag med skjermingsfradrag (oanvänd skjerming växer) | Norge (ASK + vanligt konto) |
| `DEFERRED_PLAIN` | Uppskjuten skatt utan avdrag (progressiv CGT) | Finland, Estland, Lettland, Litauen |
| `TAX_FREE_WRAPPER` | Helt skattefri investeringsform | Storbritannien, Polen |
| `DUTCH_BOX3` | Förmögenhetsskatt (schablonavkastning) | Nederländerna (NL) |
| `TIME_TEST_CGT` | Skattefritt efter X års innehav — per köp eller per konto | Tjeckien (standardkonto), Frankrike (PEA), Italien (PIR) |
| `EXIT_TAX` | Irländsk exit tax på fonder med deemed disposal vart 8:e år | Irland (IE) |

**Insättningstak:** skattegynnade konton med tak (ISA, IKE, PIR, PEA, OSK, dansk ASK) anges med `taxAdvCap` i `countries.js`. Det som inte ryms beräknas automatiskt på landets standardkonto och resultaten summeras (`simulateAccount` i `tax-regimes.js`).

**Skattesatser:** gäller inkomstår 2026. Landsspecifika förenklingar visas i appen under landsvalet.

*Arkitekturen är designad för att göra nya länder triviala — ~20 rader konfiguration, noll kodändringar i beräknings- eller UI-logik (förutsatt att regimen redan finns).*

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

**Resultat (schablonränta 3,55 %):** Investerat: 410 000 kr · Kontots värde: ~1 456 000 kr · ISK-skatt totalt: ~92 000 kr · Netto efter skatt: ~1 364 000 kr.

*Notera: Exemplet är simulerat. Verklig avkastning varierar.*

## 🔧 Teknisk information

| Egenskap | Detalj |
|----------|--------|
| Språk | JavaScript (vanilla, inga ramverk) |
| Styling | CSS3 (guld/brun-tema, flexbox, responsiv grid) |
| Arkitektur | `calc/` — rena beräkningsfunktioner (5 filer) + `app.js` (UI) |
| i18n | Dynamiskt lexikon, `data-i18n`-attribut |
| Flaggor | Inline SVG, CSP-kompatibla |
| Diagram | Canvas med tooltip + tangentbordsnavigering |
| Tester | `node test.js` — 187 tester (3 sviter) |
| Licens | MIT |

### Filstruktur

```
/
├── index.html              # UI-struktur (HTML + event-attribut)
├── styles.css              # All styling
├── app.js                  # UI-logik, i18n, state, DOM, canvas
│
├── calc/                   # Beräkningsbibliotek — rena funktioner
│   ├── constants.js        # Lagstadgade skattekontanter (fallback)
│   ├── utils.js            # Validering och formatering
│   ├── core.js             # Kärnberäkningar (FV, avgifter, CGT)
│   ├── tax-regimes.js      # Skatteregimer (9 st) + insättningstak (simulateAccount)
│   └── countries.js        # Landskonfiguration (19 länder) + regioner
│
├── test.js                 # Node.js-testrunner
└── _headers                # CSP- och säkerhetsheaders (Cloudflare Pages)
```

## 📮 Feedback & bidrag

Har du förslag på förbättringar? Hittade du en bugg? Skapa ett [GitHub issue](https://github.com/Vansinnet/pengamaskin/issues) eller en pull request!

## ⚠️ Ansvarsfriskrivning

Pengamaskinen är ett **utbildningsverktyg**. Skatteregler kan ändras — kontrollera alltid mot respektive lands skattemyndighet för aktuella satser. Använd siffrorna som vägledning, inte som garantier. För personlig finansiell rådgivning, kontakta en licensierad rådgivare.

---

**🌐 [Starta Pengamaskinen nu →](https://pengamaskin.pages.dev)**
