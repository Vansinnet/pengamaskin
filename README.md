# 💰 Ekonomiska Kalkyler

Ett webbaserat verktyg för att planera och visualisera ekonomisk tillväxt — utan installation, utan konton, direkt i webbläsaren.

---

## Funktioner

### Pengamaskin
Beräknar hur ditt sparande växer över tid med full kontroll över alla faktorer:
- Startkapital och månadssparande
- Årlig avkastning och förvaltningsavgifter
- Kapitalvinstskatt eller ISK-beskattning
- Inflation (realvärde)
- Interaktivt tillväxtdiagram med kvartalsvisa data
- Tidslinje med årsvis uppföljning

**ISK-stöd** följer Skatteverkets regler:
- Schablonränta förifylld med aktuellt värde (3,55% för 2026)
- Kapitalunderlag beräknas som genomsnitt av kvartalsingångsvärden (jan, apr, jul, okt)
- De första 300 000 kr av kapitalunderlaget är skattefria (fr.o.m. 2026)
- Effektiv skatt = schablonränta × 30% på beskattningsbart kapitalunderlag

### Jämföring
Ställ två sparscenarier mot varandra — olika räntesatser, insatser eller startkapital — och se skillnaden direkt.

### Sparmål
Omvänd kalkylator: ange hur mycket pengar du vill ha, och få svar på hur mycket du behöver spara per månad.
- Stöd för mål i dagens pengar (realt) eller framtida kronor (nominellt)
- Samma ISK-logik som Pengamaskin
- Binsökning med 80 iterationer för exakt resultat

---

## Kom igång

Inga beroenden. Inga ramverk. Öppna bara filen:

```
index.html
```

Fungerar i alla moderna webbläsare (Chrome, Firefox, Safari, Edge).

---

## Teknisk information

| Egenskap | Detalj |
|---|---|
| Språk | HTML, CSS, JavaScript (vanilla) |
| Beroenden | Inga |
| Persistens | Ingen — allt körs lokalt i webbläsaren |
| ISK-beräkning | Skatteverkets kvartalsvisa kapitalunderlagsmetod |
| Sparmålslösning | Binsökning, 80 iterationer |

---

## ISK-beräkning i detalj

Skatteverket beräknar ISK-skatten enligt:

1. **Kapitalunderlag** = medelvärdet av kontosaldot vid ingången av varje kvartal (1 jan, 1 apr, 1 jul, 1 okt)
2. **Skattefritt belopp** = 300 000 kr (fr.o.m. 2026)
3. **Schablonintäkt** = max(0, kapitalunderlag − 300 000) × schablonränta
4. **ISK-skatt** = schablonintäkt × 30 %

Schablonräntan = statslåneräntan per 30 november föregående år + 1 procentenhet.

---

## Licens

MIT — se [LICENSE](LICENSE).
