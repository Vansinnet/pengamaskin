# Pengamaskinen – Investeringskalkylator

**🌐 [Öppna Pengamaskinen →](https://pengamaskin.pages.dev)**

Pengamaskinen är en **gratis, webbaserad investeringskalkylator** för svenska sparare. Beräkna hur dina pengar växer med ränta-på-ränta, ISK-skatt, förvaltningsavgifter och inflation — allt på en sida, utan registrering.

## 🎯 Vad gör Pengamaskinen?

Pengamaskinen hjälper dig att förstå sparande genom tre kraftfulla funktioner:

### 1. **Pengamaskin** — Beräkna framtida värde
Se hur ditt sparande växer år för år med:
- 📊 Startkapital och månadligt sparande
- 📈 Årlig avkastning (nominell ränta)
- 🏦 Förvaltningsavgifter (TER)
- 🇸🇪 ISK-konto enligt Skatteverkets officiella formel
- 💰 Skatt på kapitalvinst (engångsbeskattning)
- 📉 Inflationsjustering för realvärde

**Resultat inkluderar:**
- Slutvärde efter skatt och avgifter
- Årlig tidslinje med diagram
- Fördelning av investeringar, avkastning, avgifter och skatt

### 2. **Sparmål** — Räkna ut månadssparande
Sätt ett målbelopp och få svar på: *Hur mycket måste jag spara varje månad?*
- 🎯 Målbelopp (nominellt eller i dagens pengar)
- ⏰ Tidsperiod på år
- 💵 Befintliga besparingar
- 📊 År-för-år prognoser

Verktygen tar hänsyn till alla samma faktorer som Pengamaskin.

## 🔐 ISK-beräkning enligt Skatteverket

Pengamaskinen använder **Skatteverkets officiella formel** för ISK-skatteberäkning:

```
Kapitalunderlag = (värdet 1/1 + 1/4 + 1/7 + 1/10 + årets insättningar) ÷ 4
Schablonintäkt = (Kapitalunderlag − 300 000 kr) × schablonränta
ISK-skatt = Schablonintäkt × 30%
```

- 2026: **Schablonränta 3,55%** (statslåneränta 2,55% + 1%)
- **300 000 kr skattefritt** från och med 2026
- Ingen reavinstskatt vid uttag

## 💡 Hur använder jag Pengamaskinen?

1. **Öppna** [pengamaskin.pages.dev](https://pengamaskin.pages.dev)
2. **Fyll i** dina siffror (startkapital, månadssparande, förväntad avkastning osv.)
3. **Se resultat** direkt — inga knappar att klicka (auto-beräkning)
4. **Experimentera** — ändra värden för att se hur olika scenarier påverkar resultatet

### Tips:
- **Årlig avkastning:** Tolkas som nominell ränta. 5% blir 5%/12 per månad.
- **Förvaltningsavgifter:** Typisk fond har 0,3–1% TER.
- **Skatt på kapitalvinst:** 30% är standard vid kapitalvinst för icke-ISK konton.
- **ISK:** Eliminerar reavinstskatt — bra för höga avkastningar.
- **Inflation:** Standard 2% per år (motsvarar långsiktig inflation i Sverige).

## 📊 Resultat & visualisering

Varje beräkning visar:

- **Slutvärde:** Dina pengar efter skatt, avgifter och inflation
- **Fördelningsdiagram:** Hur mycket är investerat, avkastning, avgifter och skatt?
- **År-för-år tabell:** Detaljerade siffror för varje år
- **Interaktivt diagram:** Hovra för att se värden per år

## 🛡️ Säkerhet & integritet

- ✅ **Ingen server:** All beräkning sker i din webbläsare
- ✅ **Ingen datainsamling:** Vi sparar inte din data
- ✅ **Open Source:** Källkoden finns tillgänglig
- ✅ **MIT-licens:** Gratis att använda och modifiera
- ✅ **CSP-skyddad:** Content Security Policy förhindrar externa angrepp

## 📱 Kompatibilitet

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android)
- ✅ Mobil (responsiv design)
- ✅ Offline möjligt (laddad en gång)

## 🎓 Matematiska antaganden

### Ränta-på-ränta
Används standard slutvärdeskalkyl för annuitet (månadsvisa insättningar):
```
FV = P(1+r)^n + PMT × [((1+r)^n − 1) / r]
```
Där:
- `P` = startkapital
- `PMT` = månadligt sparande
- `r` = månatlig ränta (årlig ränta ÷ 12)
- `n` = antal månader

### Avgifter
Dras linjärt från räntan: `nettoränta = annualRate − fees`

### Skatt
För icke-ISK: Kapitalvinstskatt på total vinst vid uttag (30% standard)
För ISK: Schablonbeskattning årligen enligt Skatteverkets formel

### Inflation
Reala värde = nominellt värde ÷ (1 + inflation)^år

## 📖 Exempel

**Scenario:** Du sparar 1 000 kr/månad under 30 år, börjar med 50 000 kr

| Inställning | Värde |
|-------------|-------|
| Startkapital | 50 000 kr |
| Månadligt | 1 000 kr |
| Avkastning | 7% årlig |
| Period | 30 år |
| Avgifter | 0,5% |
| ISK | Ja |

**Resultat:**
- Investerat: 410 000 kr (50 000 + 1 000 × 360 månader)
- Slutvärde: ~2 800 000 kr (efter ISK-skatt)
- Avkastning: ~2 390 000 kr netto

*Notera: Exempel är simulerat och baserat på antaganden. Verklig avkastning varierar.*

## 🔧 Teknisk information

- **Språk:** JavaScript (vanilla, ingen bibliotek)
- **Styling:** CSS3 med gradient och flexbox
- **Data:** Allt beräknat i webbläsaren
- **Format:** Single-page HTML-fil (~80 KB)
- **Licensiering:** MIT

## 📝 Källkod

Pengamaskinen är **open source** under MIT-licens. Källkoden är tillgänglig på:
- 📂 [GitHub: Vansinnet/pengamaskin](https://github.com/Vansinnet/pengamaskin)

Du kan:
- ✅ Använda det fritt för personligt bruk
- ✅ Modifiera och anpassa det
- ✅ Driftsätta det själv
- ✅ Dela förbättringar

## ⚠️ Ansvarsfriskrivning

Pengamaskinen är ett **utbildningsverktyg** och gör **antaganden** om framtida avkastning, skatter och inflation. 

**Verklig avkastning kan skilja sig från beräkningarna.** Använd dessa siffror som vägledning, inte som garantier. För personlig finansiell rådgivning, kontakta en licensierad finansiell rådgivare.

- Skatteregler kan ändras
- ISK-regler uppdateras årligen
- Inflation är svårförutsägbar
- Marknader är volatila

## 📮 Feedback & bidrag

Har du förslag på förbättringar? Hitta du en bugg? Skapa ett [GitHub issue](https://github.com/Vansinnet/pengamaskin/issues) eller en pull request!

## 🙏 Tack

Pengamaskinen är gjord med ❤️ för svenska sparare som vill förstå sitt sparande utan krångel.

---

**🌐 [Starta Pengamaskinen nu →](https://pengamaskin.pages.dev)**

*Lycka till med sparandet! 💰*
