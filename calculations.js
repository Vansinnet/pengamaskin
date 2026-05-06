// ============================================================
//  Beräkningsfunktioner för Pengamaskinen
//  Alla funktioner är rena — inga DOM-referenser.
//  Designade för enhetstestning.
// ============================================================

// ------------------------------------------------------------
//  Lagstadgade konstanter (svensk skattelag, gäller 2026)
//  Höj/sänk här om Riksdagen ändrar reglerna.
// ------------------------------------------------------------
const KAPITALVINSTSKATT       = 0.30;    // 30 % på realiserad vinst (AF-konto)
const ISK_SKATT               = 0.30;    // 30 % på schablonintäkten (ISK)
const ISK_SCHABLON_GOLV       = 1.25;    // procentenheter — minsta schablonräntan
const ISK_FRIBELOPP_DEFAULT   = 300000;  // SEK skattefritt av kapitalunderlaget (2026)

/**
 * Validerar att ett värde är ett giltigt, ändligt tal.
 */
function isValidNumber(value) {
    return !isNaN(value) && isFinite(value);
}

/**
 * Formaterar ett tal som svensk valuta (SEK), utan ören.
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('sv-SE', {
        style: 'currency',
        currency: 'SEK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Formaterar ett inmatningsvärde som en läsbar summa.
 * T.ex. "1000000" → "1 000 000 kr (1 miljon)"
 */
function formatAmountHint(value) {
    if (isNaN(value) || value === '' || value === null) return '';
    const n = parseFloat(value);
    if (n === 0) return '0 kr';
    const grouped = new Intl.NumberFormat('sv-SE').format(Math.round(n));
    if (n >= 1e9)       return grouped + ' kr (' + (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 2).replace('.', ',') + ' miljarder)';
    if (n >= 1e6) { const m = n / 1e6; return grouped + ' kr (' + m.toFixed(m % 1 === 0 ? 0 : 2).replace('.', ',') + (m === 1 ? ' miljon)' : ' miljoner)'); }
    if (n >= 1e3)       return grouped + ' kr';
    return grouped + ' kr';
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
 * Kapitalvinstskatt på vinst. Returnerar 0 om ingen vinst.
 * Skattesatsen är hårdkodad till 30 % (svensk lag).
 */
function computeCapitalGainsTax(gain) {
    return gain > 0 ? gain * KAPITALVINSTSKATT : 0;
}

// ============================================================
//  ISK-beräkning enligt Skatteverkets formel
//
//  Kapitalunderlag = (V_jan + V_apr + V_jul + V_okt
//                     + årets insättningar och överföringar in) / 4
//
//  Schablonintäkt = max(0, kapitalunderlag − fribelopp)
//                   × max(schablonränta, golvet 1,25 %)
//
//  Skatt = schablonintäkt × 30 %
//
//  AKTIVT VAL: ISK-skatten betalas via deklarationen och
//  minskar INTE kontots värde — kontot växer oavkortat.
//
//  Returnerar { balance, totalIskTax }.
// ============================================================
function simulateISK(initial, monthly, monthlyRateNet, years, schablonRanta, fribelopp = ISK_FRIBELOPP_DEFAULT) {
    let balance = initial;
    let totalISKtax = 0;
    const insattningarPerÅr = monthly * 12;
    const effectiveSchablonRanta = Math.max(schablonRanta, ISK_SCHABLON_GOLV);

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
        totalISKtax += schablonintakt * ISK_SKATT;
    }
    return { balance, totalISKtax };
}

// ============================================================
//  Simulering för sparmål — returnerar { netValue, tax }
//  Hanterar både ISK och AF-konto.
//  Används av binärsökningen i calculateGoal.
// ============================================================
function simulateGoal(initialCapital, monthlyAmount, monthlyRateNet, years, iskOn, iskSchablonRate, fribelopp = ISK_FRIBELOPP_DEFAULT) {
    if (iskOn) {
        const r = simulateISK(initialCapital, monthlyAmount, monthlyRateNet, years, iskSchablonRate, fribelopp);
        // ISK-skatten betalas separat — användarens "pengar i handen" =
        // kontosaldo minus den skatt deklarationen kommer kräva.
        return { netValue: r.balance - r.totalISKtax, tax: r.totalISKtax };
    } else {
        const months  = years * 12;
        const fv      = computeFV(initialCapital, monthlyAmount, monthlyRateNet, months);
        const totalIn = initialCapital + monthlyAmount * months;
        const gain    = fv - totalIn;
        const tax     = computeCapitalGainsTax(gain);
        return { netValue: fv - tax, tax: tax };
    }
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

    // 9. Inflationsjustering
    {
        const realValue = 200000 / Math.pow(1.02, 10);
        log('200 000 kr / (1,02)^10 ≈ 164 070', approx(realValue, 164070, 1), `fick ${realValue}`);
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
