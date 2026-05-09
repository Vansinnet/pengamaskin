// ============================================================
//  calc/core.js — Kärnberäkningar (sammansatt ränta, avgifter, CGT)
//  Rena matematikfunktioner — noll landsspecifik logik.
// ============================================================

/**
 * Framtida värde av engångsbelopp + månadssparande med månatlig ränta.
 * Formel: P·(1+r)^n + PMT·((1+r)^n − 1) / r
 * där P = startkapital, r = månadsränta (decimal), n = antal månader
 */
function computeFV(initial, monthly, monthlyRate, months) {
    if (monthlyRate === 0) {
        return Number(initial) + monthly * months;
    }
    var growth = Math.pow(1 + monthlyRate, months);
    return initial * growth + monthly * (growth - 1) / monthlyRate;
}

/**
 * Bruttovärde — full avkastning, utan avgifter eller skatt.
 */
function computeGrossValue(initialCapital, monthlyAmount, annualRate, years) {
    var monthlyRate = annualRate / 100 / 12;
    var months = years * 12;
    return computeFV(initialCapital, monthlyAmount, monthlyRate, months);
}

/**
 * Värde efter förvaltningsavgifter, före skatt.
 * Använder nettoavkastning = årlig avkastning − avgift.
 * Tillåter negativ nettoränta (om avgift > avkastning).
 */
function computeNetAfterFees(initialCapital, monthlyAmount, annualRate, fees, years) {
    var monthlyRateNet = (annualRate - fees) / 100 / 12;
    var months = years * 12;
    return computeFV(initialCapital, monthlyAmount, monthlyRateNet, months);
}

/**
 * Kapitalvinstskatt på vinst.
 *
 * Två anropsmodeller:
 *   1. Array av brytpunkter (ny, föredragen):
 *      computeCapitalGainsTax(gain, [{threshold: 6000, rate: 0.19}, {rate: 0.26}])
 *      Varje bracket har en absolut threshold — sista bracket saknar threshold (obegränsad).
 *      0 %-brackets används för skattefria grundbelopp (exemption).
 *
 *   2. Platt/progressiv skattesats (bakåtkompatibel):
 *      computeCapitalGainsTax(gain, rate, threshold, rateHigh)
 *      rate = platt skattesats. threshold/rateHigh valfria för progressivitet.
 *
 * @param {number} gain - Vinsten
 * @param {number|Array} rate - Skattesats (decimal) eller bracket-array
 * @param {number} [threshold] - Progressionsgräns
 * @param {number} [rateHigh] - Högre skattesats över progressionsgränsen
 * @returns {number} Skatt att betala (0 om ingen vinst)
 */
function computeCapitalGainsTax(gain, rate, threshold, rateHigh) {
    if (gain <= 0) return 0;

    if (Array.isArray(rate)) {
        var brackets = rate;
        var tax = 0;
        var prevThreshold = 0;
        for (var i = 0; i < brackets.length; i++) {
            var b = brackets[i];
            if (b.threshold === undefined || b.threshold === null) {
                tax += Math.max(0, gain - prevThreshold) * b.rate;
                break;
            }
            var inBracket = Math.min(Math.max(0, gain - prevThreshold), b.threshold - prevThreshold);
            tax += inBracket * b.rate;
            prevThreshold = b.threshold;
            if (gain <= b.threshold) break;
        }
        return tax;
    }

    rate = (rate !== undefined) ? rate : KAPITALVINSTSKATT;
    if (rateHigh === undefined || gain <= (threshold || 0)) {
        return gain * rate;
    }
    return (threshold || 0) * rate + (gain - (threshold || 0)) * rateHigh;
}
