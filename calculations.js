// ============================================================
//  Beräkningsfunktioner för Pengamaskinen
//  Alla funktioner är rena — inga DOM-referenser.
//  Designade för enhetstestning.
// ============================================================

// ------------------------------------------------------------
//  Lagstadgade konstanter — svenska standardvärden (2026)
//  Dessa används som fallback när inget land specificeras.
// ------------------------------------------------------------
const KAPITALVINSTSKATT       = 0.30;    // 30 % på realiserad vinst (AF-konto)
const ISK_SKATT               = 0.30;    // 30 % på schablonintäkten (ISK)
const ISK_SCHABLON_GOLV       = 1.25;    // procentenheter — minsta schablonräntan
const ISK_FRIBELOPP_DEFAULT   = 300000;  // SEK skattefritt av kapitalunderlaget (2026)

// ------------------------------------------------------------
//  Landskonfiguration — skatteparametrar för Norden
//  Alla värden gäller för 2026. Uppdatera vid lagändringar.
//
//  taxAdvantagedType:
//    'ISK'           = svensk ISK (schablonformel, kvartalsvis)
//    'ASK_ANNUAL'    = dansk ASK (17 % årlig lagerbeskatning)
//    'DEFERRED'      = norsk ASK / finsk OSK (uppskjuten skatt,
//                      beskattas vid uttag som vanligt konto)
//    null            = inget skattegynnat konto (Island)
// ------------------------------------------------------------
const COUNTRY_CONFIG = {
    SE: {
        code: 'SE',
        name: 'Sverige',
        currency: 'SEK',
        locale: 'sv-SE',
        capitalGainsTax: 0.30,                  // 30 % på realiserad vinst
        hasTaxAdvantaged: true,
        taxAdvantagedType: 'ISK',
        iskSchablonGolv: 1.25,                  // minsta schablonränta (%)
        iskFribelopp: 300000,                   // skattefritt underlag (SEK)
        iskSchablonRateDefault: 3.55,           // statslåneränta 2,55 % + 1 %
        iskSkatt: 0.30                          // 30 % på schablonintäkt
    },
    NO: {
        code: 'NO',
        name: 'Norge',
        currency: 'NOK',
        locale: 'nb-NO',
        capitalGainsTax: 0.3784,                // 37,84 % (2026, upp från 35,2 %)
        hasTaxAdvantaged: true,
        taxAdvantagedType: 'DEFERRED',          // ASK = uppskjuten skatt, beskattas vid uttag
        skjermingsrente: 2.5                    // % — skjermingsfradrag (Skatteetaten, ~2026-nivå)
    },
    DK: {
        code: 'DK',
        name: 'Danmark',
        currency: 'DKK',
        locale: 'da-DK',
        capitalGainsTax: 0.27,                  // 27 % upp till progressionsgräns
        capitalGainsTaxHigh: 0.42,              // 42 % över progressionsgränsen (79 400 DKK 2026)
        capitalGainsTaxThreshold: 79400,        // progressionsgräns i DKK (2026)
        hasTaxAdvantaged: true,
        taxAdvantagedType: 'ASK_ANNUAL',
        askAnnualTax: 0.17                      // 17 % årlig lagerbeskatning på ASK
    },
    FI: {
        code: 'FI',
        name: 'Finland',
        currency: 'EUR',
        locale: 'fi-FI',
        capitalGainsTax: 0.30,                  // 30 % upp till 30 000 €
        capitalGainsTaxHigh: 0.34,              // 34 % över 30 000 €
        capitalGainsTaxThreshold: 30000,        // progressionsgräns i EUR
        hasTaxAdvantaged: true,
        taxAdvantagedType: 'DEFERRED'           // OSK = uppskjuten skatt, beskattas vid uttag
    },
    IS: {
        code: 'IS',
        name: 'Island',
        currency: 'ISK',
        locale: 'is-IS',
        capitalGainsTax: 0.22,                  // 22 % kapitalvinstskatt
        hasTaxAdvantaged: false,
        taxAdvantagedType: null                 // inget skattegynnat investeringskonto
    }
};

/**
 * Hämtar landskonfiguration för en landskod.
 * Returnerar Sverige som fallback om koden saknas.
 */
function getCountryConfig(code) {
    return COUNTRY_CONFIG[code] || COUNTRY_CONFIG.SE;
}

/**
 * Validerar att ett värde är ett giltigt, ändligt tal.
 */
function isValidNumber(value) {
    return !isNaN(value) && isFinite(value);
}

/**
 * Formaterar ett tal som valuta med angiven locale och valutakod.
 * Default: sv-SE / SEK.
 */
function formatCurrency(value, locale, currency) {
    locale = locale || 'sv-SE';
    currency = currency || 'SEK';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Formaterar ett inmatningsvärde som en läsbar summa.
 * T.ex. "1000000" → "1 000 000 kr (1 miljon)"
 * locale och currency används för siffergruppering resp. valutasymbol.
 */
function formatAmountHint(value, locale, currency) {
    locale = locale || 'sv-SE';
    currency = currency || 'SEK';
    if (isNaN(value) || value === '' || value === null) return '';
    const n = parseFloat(value);
    if (n === 0) return '0 ' + getCurrencySymbol(currency);
    const grouped = new Intl.NumberFormat(locale).format(Math.round(n));
    const sym = getCurrencySymbol(currency);
    const fmtDec = v => { const s = parseFloat(v.toFixed(2)).toString(); return (locale === 'en-US' || locale === 'en-GB') ? s : s.replace('.', ','); };
    if (n >= 1e9)       return grouped + ' ' + sym + ' (' + fmtDec(n / 1e9) + ' ' + (locale === 'sv-SE' ? 'miljarder' : 'billion') + ')';
    if (n >= 1e6) { const m = n / 1e6; return grouped + ' ' + sym + ' (' + fmtDec(m) + (m === 1 ? ' ' + (locale === 'sv-SE' ? 'miljon' : 'million') : ' ' + (locale === 'sv-SE' ? 'miljoner' : 'million')) + ')'; }
    if (n >= 1e3)       return grouped + ' ' + sym;
    return grouped + ' ' + sym;
}

function getCurrencySymbol(currency) {
    const symbols = { 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr', 'EUR': '€', 'ISK': 'kr' };
    return symbols[currency] || currency;
}

// ============================================================
//  Sammansatt ränta (Compound Interest)
//
//  AKTIVT VAL: Månadskapitalisering med end-of-month-insättningar.
//  En angiven årsränta r ger en effektiv årsavkastning på
//  (1 + r/12)^12 − 1 (något högre än r). Detta är standard
//  för svenska sparkalkylatorer eftersom månadsinsättningarna
//  börjar förränta sig direkt.
// ============================================================

/**
 * Framtida värde av engångsbelopp + månadssparande med månatlig ränta.
 * Formel: P·(1+r)^n + PMT·((1+r)^n − 1) / r
 * där P = startkapital, r = månadsränta (decimal), n = antal månader
 */
function computeFV(initial, monthly, monthlyRate, months) {
    if (monthlyRate === 0) {
        return initial + monthly * months;
    }
    return initial * Math.pow(1 + monthlyRate, months)
         + monthly * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
}

/**
 * Bruttovärde — full avkastning, utan avgifter eller skatt.
 */
function computeGrossValue(initialCapital, monthlyAmount, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    return computeFV(initialCapital, monthlyAmount, monthlyRate, months);
}

/**
 * Värde efter förvaltningsavgifter, före skatt.
 * Använder nettoavkastning = årlig avkastning − avgift.
 * Tillåter negativ nettoränta (om avgift > avkastning).
 */
function computeNetAfterFees(initialCapital, monthlyAmount, annualRate, fees, years) {
    const monthlyRateNet = (annualRate - fees) / 100 / 12;
    const months = years * 12;
    return computeFV(initialCapital, monthlyAmount, monthlyRateNet, months);
}

/**
 * Kapitalvinstskatt på vinst.
 * @param {number} gain - Vinsten
 * @param {number} [rate] - Skattesats (default: svensk 30 %)
 * @param {number} [threshold] - Progressionsgräns (default: oändlig)
 * @param {number} [rateHigh] - Högre skattesats över progressionsgränsen
 * @returns {number} Skatt att betala (0 om ingen vinst)
 */
function computeCapitalGainsTax(gain, rate, threshold, rateHigh) {
    if (gain <= 0) return 0;
    rate = (rate !== undefined) ? rate : KAPITALVINSTSKATT;
    if (threshold === undefined || rateHigh === undefined || gain <= threshold) {
        return gain * rate;
    }
    return threshold * rate + (gain - threshold) * rateHigh;
}

// ============================================================
//  ISK-beräkning enligt Skatteverkets formel (Sverige)
//
//  Kapitalunderlag = (V_jan + V_apr + V_jul + V_okt
//                     + årets insättningar) / 4
//
//  Schablonintäkt = max(0, kapitalunderlag − fribelopp)
//                   × max(schablonränta, golvet 1,25 %)
//
//  Skatt = schablonintäkt × 30 %
//
//  AKTIVT VAL: ISK-skatten betalas via deklarationen och
//  minskar INTE kontots värde — kontot växer oavkortat.
//
//  Returnerar { balance, totalISKtax }.
// ============================================================
function simulateISK(initial, monthly, monthlyRateNet, years, schablonRanta, fribelopp, iskSkatt, schablonGolv) {
    fribelopp = (fribelopp !== undefined) ? fribelopp : ISK_FRIBELOPP_DEFAULT;
    iskSkatt = (iskSkatt !== undefined) ? iskSkatt : ISK_SKATT;
    schablonGolv = (schablonGolv !== undefined) ? schablonGolv : ISK_SCHABLON_GOLV;

    let balance = initial;
    let totalISKtax = 0;
    const insattningarPerÅr = monthly * 12;
    const effectiveSchablonRanta = Math.max(schablonRanta, schablonGolv);

    for (let yr = 1; yr <= years; yr++) {
        const q1 = balance;                                                                     // ingången av Q1 (1 jan)
        for (let m = 0; m < 3; m++) balance = balance * (1 + monthlyRateNet) + monthly;
        const q2 = balance;                                                                     // ingången av Q2 (1 apr)
        for (let m = 0; m < 3; m++) balance = balance * (1 + monthlyRateNet) + monthly;
        const q3 = balance;                                                                     // ingången av Q3 (1 jul)
        for (let m = 0; m < 3; m++) balance = balance * (1 + monthlyRateNet) + monthly;
        const q4 = balance;                                                                     // ingången av Q4 (1 okt)
        for (let m = 0; m < 3; m++) balance = balance * (1 + monthlyRateNet) + monthly;

        // Skatteverkets formel: alla insättningar adderas och hela summan delas med 4.
        const kapitalunderlag       = (q1 + q2 + q3 + q4 + insattningarPerÅr) / 4;
        const beskattningsbartUnderlag = Math.max(0, kapitalunderlag - fribelopp);
        const schablonintakt        = beskattningsbartUnderlag * (effectiveSchablonRanta / 100);
        totalISKtax += schablonintakt * iskSkatt;
    }
    return { balance, totalISKtax };
}

// ============================================================
//  Dansk ASK (Aktiesparekonto) — 17 % årlig lagerbeskatning
//
//  Till skillnad från svensk ISK (schablon) beskattas dansk
//  ASK på den faktiska avkastningen varje år, med 17 %.
//  Skatten dras direkt från kontot (inte separat deklaration).
//  Negativ avkastning kan framföras till nästa år.
// ============================================================
function simulateDanishASK(initial, monthly, monthlyRateNet, years, annualTaxRate) {
    let balance = initial;
    let totalTax = 0;
    let carryForwardLoss = 0;

    for (let yr = 1; yr <= years; yr++) {
        const balanceBeforeYear = balance;
        const depositsThisYear = monthly * 12;
        for (let m = 0; m < 12; m++) {
            balance = balance * (1 + monthlyRateNet) + monthly;
        }
        let gainThisYear = balance - balanceBeforeYear - depositsThisYear;

        // Framförbar förlust från tidigare år (används bara mot positiv vinst)
        if (carryForwardLoss > 0 && gainThisYear > 0) {
            const used = Math.min(gainThisYear, carryForwardLoss);
            gainThisYear -= used;
            carryForwardLoss -= used;
        }

        if (gainThisYear > 0) {
            const tax = gainThisYear * annualTaxRate;
            balance -= tax;
            totalTax += tax;
        } else if (gainThisYear < 0) {
            carryForwardLoss += -gainThisYear;
        }
    }
    return { balance, totalTax };
}

// ============================================================
//  Norsk ASK (Aksjesparekonto) — skjermingsfradrag
//
//  Skatten är uppskjuten till uttag. Vid uttag:
//    skattepliktig vinst = max(0, totalvinst − ackumulerat
//                           skjermingsfradrag)
//    skatt = skattepliktig vinst × 37,84 %
//
//  Skjermingsfradraget beräknas årsvis som:
//    fradrag = genomsnittligt anskaffningsvärde × skjermingsrente
//
//  där skjermingsrenten sätts av Skatteetaten (typiskt 2–4 %).
//  Fradraget beräknas på kostnadsbasen vid årets ingång.
// ============================================================
function simulateNorwegianASK(initial, monthly, monthlyRateNet, years, capitalGainsTax, skjermingsrente) {
    let balance = initial;
    let costBasis = initial;
    let accumulatedFradrag = 0;

    for (let yr = 1; yr <= years; yr++) {
        const basisBefore = costBasis;
        for (let m = 0; m < 12; m++) {
            balance = balance * (1 + monthlyRateNet) + monthly;
            costBasis += monthly;
        }
        // Skjermingsfradrag beräknas på ingångsvärdet (Skatteetatens regler)
        accumulatedFradrag += basisBefore * (skjermingsrente / 100);
    }

    const gain = balance - costBasis;
    const taxableGain = Math.max(0, gain - accumulatedFradrag);
    const tax = taxableGain * capitalGainsTax;

    return { balance, totalTax: tax, accumulatedFradrag };
}

// ============================================================
//  Simulering för sparmål — returnerar { netValue, tax }
//  Hanterar ISK, dansk ASK, norsk ASK, uppskjuten skatt och AF.
// ============================================================
function simulateGoal(initialCapital, monthlyAmount, monthlyRateNet, years, iskOn, iskSchablonRate, fribelopp, config) {
    fribelopp = (fribelopp !== undefined) ? fribelopp : ISK_FRIBELOPP_DEFAULT;
    config = config || {};

    if (iskOn) {
        const advType = config.taxAdvantagedType || 'ISK';

        if (advType === 'ASK_ANNUAL') {
            // Dansk ASK: 17 % årlig lagerbeskatning
            const r = simulateDanishASK(initialCapital, monthlyAmount, monthlyRateNet, years,
                config.askAnnualTax || 0.17);
            return { netValue: r.balance, tax: r.totalTax };
        }

        if (advType === 'ISK') {
            // Svensk ISK
            const iskSkattRate = config.iskSkatt || ISK_SKATT;
            const schablonGolv = config.iskSchablonGolv || ISK_SCHABLON_GOLV;
            const r = simulateISK(initialCapital, monthlyAmount, monthlyRateNet, years,
                iskSchablonRate, fribelopp, iskSkattRate, schablonGolv);
            return { netValue: r.balance - r.totalISKtax, tax: r.totalISKtax };
        }

        if (advType === 'DEFERRED') {
            // Norsk ASK med skjermingsfradrag
            if (config.skjermingsrente !== undefined) {
                const r = simulateNorwegianASK(initialCapital, monthlyAmount, monthlyRateNet, years,
                    config.capitalGainsTax || KAPITALVINSTSKATT, config.skjermingsrente);
                return { netValue: r.balance - r.totalTax, tax: r.totalTax };
            }
            // Finsk OSK / generell uppskjuten skatt utan skjermingsfradrag
            const months  = years * 12;
            const fv      = computeFV(initialCapital, monthlyAmount, monthlyRateNet, months);
            const totalIn = initialCapital + monthlyAmount * months;
            const gain    = fv - totalIn;
            const taxRate = config.capitalGainsTax || KAPITALVINSTSKATT;
            const taxHigh = config.capitalGainsTaxHigh;
            const taxThreshold = config.capitalGainsTaxThreshold;
            const tax = computeCapitalGainsTax(gain, taxRate, taxThreshold, taxHigh);
            return { netValue: fv - tax, tax: tax };
        }
    }

    // Standardkonto (AF / vanlig konto / Island)
    const months  = years * 12;
    const fv      = computeFV(initialCapital, monthlyAmount, monthlyRateNet, months);
    const totalIn = initialCapital + monthlyAmount * months;
    const gain    = fv - totalIn;
    const taxRate = config.capitalGainsTax || KAPITALVINSTSKATT;
    const taxHigh = config.capitalGainsTaxHigh;
    const taxThreshold = config.capitalGainsTaxThreshold;
    const tax     = computeCapitalGainsTax(gain, taxRate, taxThreshold, taxHigh);
    return { netValue: fv - tax, tax: tax };
}

// ============================================================
//  Testsuite — körs i development-läge.
//  Verifierar de scenarier som listas i AGENTS.md.
// ============================================================
function runTests() {
    let passed = 0, failed = 0;
    const log = (name, ok, detail) => {
        if (ok) { passed++; console.log('✓', name); }
        else    { failed++; console.error('✗', name, detail); }
    };
    const approx = (a, b, tol = 1) => Math.abs(a - b) <= tol;

    // 1. Nollränta, ingen insättning
    {
        const v = computeFV(100000, 0, 0, 120);
        log('Nollränta, ingen insättning, 10 år', v === 100000, `fick ${v}`);
    }

    // 2. Ränta-på-ränta (1 år, månadsvis)
    {
        const v = computeFV(10000, 0, 0.10/12, 12);
        log('10 000 kr @ 10 %/år, månadsvis, 1 år ≈ 11 047,13', approx(v, 11047.13, 0.01), `fick ${v}`);
    }

    // 3. Ren månadsinsättning
    {
        const v = computeFV(0, 1000, 0, 12);
        log('1 000 kr/mån utan ränta, 1 år = 12 000', v === 12000, `fick ${v}`);
    }

    // 4. Avgift minskar avkastningen
    {
        const v = computeNetAfterFees(100000, 0, 8, 2, 1);
        log('100 000 kr @ 8 % minus 2 % avgift, 1 år ≈ 106 167,78', approx(v, 106167.78, 0.5), `fick ${v}`);
    }

    // 5. AF kapitalvinstskatt
    {
        const fv = computeNetAfterFees(100000, 0, 10, 0, 1);
        const tax = computeCapitalGainsTax(fv - 100000);
        const net = fv - tax;
        log('AF: 100 000 @ 10 %, 1 år, netto ≈ 107 330', approx(net, 107330, 5), `fick netto ${net}, skatt ${tax}`);
    }

    // 6. ISK med fribelopp (under 300k → ingen skatt)
    {
        const r = simulateISK(100000, 0, 0, 1, 3.55);
        log('ISK 100 000 kr (under fribelopp) → skatt = 0', r.totalISKtax === 0, `fick skatt ${r.totalISKtax}`);
    }

    // 7. ISK med fribelopp (över 300k)
    {
        const r = simulateISK(500000, 0, 0, 1, 3.55);
        // beskattningsbart = 200 000; schablonintäkt = 7 100; skatt = 2 130
        log('ISK 500 000 kr → skatt ≈ 2 130', approx(r.totalISKtax, 2130, 1), `fick skatt ${r.totalISKtax}`);
    }

    // 8. Schablonräntans golv
    {
        // Kapitalunderlag 100 000, fribelopp 0, schablonränta 1 % → höjs till 1,25 %
        const r = simulateISK(100000, 0, 0, 1, 1.0, 0);
        // schablonintäkt = 100 000 × 0,0125 = 1 250; skatt = 375
        log('ISK schablonräntans golv 1,25 % används', approx(r.totalISKtax, 375, 1), `fick skatt ${r.totalISKtax}`);
    }

    // 9. Inflationsjustering via computeFV — realvärdet av 200 000 kr
    //    vid 2 % inflation i 10 år = computeFV(200000, 0, -0.02/12, 120) ≈ 163 719
    {
        const realValue = computeFV(200000, 0, -0.02 / 12, 120);
        log('computeFV: realvärde 200 000 kr vid 2% inflation i 10 år ≈ 163 719', approx(realValue, 163719, 1), `fick ${realValue.toFixed(2)}`);
    }

    // 10. Sparmål (sanity check) — binärsökningens utgångspunkt
    {
        const r = simulateGoal(0, 1000, 0.05/12, 10, false, 0);
        // 10 år månadssparande @ 5 % nominellt, AF: bör ligga ~155 000 efter skatt
        log('simulateGoal AF 1 000/mån @ 5 % i 10 år ger rimligt netto', r.netValue > 140000 && r.netValue < 160000, `fick ${r.netValue}`);
    }

    console.log(`\nTesterna klara: ${passed} OK, ${failed} fel.`);
    return { passed, failed };
}