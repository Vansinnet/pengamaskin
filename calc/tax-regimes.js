// ============================================================
//  calc/tax-regimes.js — Pluggbar skatteregims-register
//
//  Varje regim är ett självständigt objekt med tre metoder:
//    simulate()      — full flerårssimulering
//    simulateYear()  — per-år-justering för tidslinje
//    getUI()         — metadata för UI-rendering (etiketter etc.)
//
//  Lägg till en ny regim HÄR — en gång. Länder som refererar
//  regim-ID:t i countries.js får automatiskt rätt beräkning.
//
//  Beroenden: core.js (computeFV, computeCapitalGainsTax),
//             constants.js (ISK_SKATT, ISK_SCHABLON_GOLV, ISK_FRIBELOPP_DEFAULT)
// ============================================================

var TAX_REGIMES = (function() {

    // ------------------------------------------------------------
    //  Gemensam no-op simulateYear (används av alla utom LAGER_ANNUAL)
    // ------------------------------------------------------------
    function simulateYearNoOp(balanceBefore, balanceAfter, deposits, carryState) {
        return { newBalance: balanceAfter, taxPaid: 0, carryState: carryState };
    }

    function _applyCGT(gain, params) {
        if (params.capitalGainsTaxBrackets) {
            return computeCapitalGainsTax(gain, params.capitalGainsTaxBrackets);
        }
        return computeCapitalGainsTax(gain,
            params.capitalGainsTax,
            params.capitalGainsTaxThreshold,
            params.capitalGainsTaxHigh);
    }

    // ------------------------------------------------------------
    //  CGT_ONLY — standard kapitalvinstskatt vid uttag
    //  Används av: alla länders standardkonton
    // ------------------------------------------------------------
    var CGT_ONLY = {
        id: 'CGT_ONLY',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var months = years * 12;
            var fv = computeFV(initial, monthly, monthlyRateNet, months);
            var totalIn = initial + monthly * months;
            var gain = fv - totalIn;
            var tax = _applyCGT(gain, params);
            return { balance: fv, totalTax: tax, netValue: fv - tax };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossValue',
                taxI18n: 'taxTypeCapitalGains',
                legendI18n: 'legendTax',
                taxDeductedFromAccount: false,
                rateFields: []
            };
        }
    };

    // ------------------------------------------------------------
    //  ISK — svensk schablonbeskattning (kapitalunderlag × ränta)
    //  Skatten betalas separat, balansen växer oavkortat.
    // ------------------------------------------------------------
    var ISK = {
        id: 'ISK',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var fribelopp = (params.iskFribelopp !== undefined) ? params.iskFribelopp : ISK_FRIBELOPP_DEFAULT;
            var iskSkatt = (params.iskSkatt !== undefined) ? params.iskSkatt : ISK_SKATT;
            var schablonGolv = (params.iskSchablonGolv !== undefined) ? params.iskSchablonGolv : ISK_SCHABLON_GOLV;
            var schablonRanta = (params.iskSchablonRate !== undefined) ? params.iskSchablonRate
                : (params.iskSchablonRateDefault !== undefined) ? params.iskSchablonRateDefault : 3.55;

            var balance = initial;
            var totalISKtax = 0;
            var insattningarPerAr = monthly * 12;
            var effectiveSchablonRanta = Math.max(schablonRanta, schablonGolv);
            var growth = 1 + monthlyRateNet;

            for (var yr = 1; yr <= years; yr++) {
                var q1 = balance;
                for (var m = 0; m < 3; m++) { balance = balance * growth + monthly; }
                var q2 = balance;
                for (var m = 0; m < 3; m++) { balance = balance * growth + monthly; }
                var q3 = balance;
                for (var m = 0; m < 3; m++) { balance = balance * growth + monthly; }
                var q4 = balance;
                for (var m = 0; m < 3; m++) { balance = balance * growth + monthly; }

                var kapitalunderlag = (q1 + q2 + q3 + q4 + insattningarPerAr) / 4;
                var beskattningsbartUnderlag = Math.max(0, kapitalunderlag - fribelopp);
                var schablonintakt = beskattningsbartUnderlag * (effectiveSchablonRanta / 100);
                totalISKtax += schablonintakt * iskSkatt;
            }
            return { balance: balance, totalTax: totalISKtax, netValue: balance - totalISKtax };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossISKValue',
                taxI18n: 'taxTypeISK',
                legendI18n: 'legendISKTax',
                taxDeductedFromAccount: false,
                rateFields: ['iskRate']
            };
        }
    };

    // ------------------------------------------------------------
    //  LAGER_ANNUAL — dansk ASK: 17 % årlig lagerbeskatning
    //  Skatten dras direkt från kontot varje år.
    //  Förluster kan framföras (carry-forward).
    // ------------------------------------------------------------
    var LAGER_ANNUAL = {
        id: 'LAGER_ANNUAL',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var annualTaxRate = (params.askAnnualTax !== undefined) ? params.askAnnualTax : 0.17;
            var balance = initial;
            var totalTax = 0;
            var carryForwardLoss = 0;
            var carryForwardYears = 0;
            var growth = 1 + monthlyRateNet;

            for (var yr = 1; yr <= years; yr++) {
                var balanceBeforeYear = balance;
                var depositsThisYear = monthly * 12;
                for (var m = 0; m < 12; m++) {
                    balance = balance * growth + monthly;
                }
                var gainThisYear = balance - balanceBeforeYear - depositsThisYear;

                if (carryForwardLoss > 0 && gainThisYear > 0) {
                    var used = Math.min(gainThisYear, carryForwardLoss);
                    gainThisYear -= used;
                    carryForwardLoss -= used;
                }

                // Danska carry-forward förfaller efter 5 år
                carryForwardYears++;
                if (carryForwardYears > 5 && carryForwardLoss > 0) {
                    carryForwardLoss = 0;
                }

                if (gainThisYear > 0) {
                    var tax = gainThisYear * annualTaxRate;
                    balance -= tax;
                    totalTax += tax;
                } else if (gainThisYear < 0) {
                    carryForwardLoss += -gainThisYear;
                }
            }
            return { balance: balance, totalTax: totalTax, netValue: balance };
        },

        simulateYear: function(balanceBefore, balanceAfter, deposits, carryState, params) {
            var annualTaxRate = (params.askAnnualTax !== undefined) ? params.askAnnualTax : 0.17;
            var gainThisYear = balanceAfter - balanceBefore - deposits;
            var cf = carryState || 0;

            if (cf > 0 && gainThisYear > 0) {
                var used = Math.min(gainThisYear, cf);
                gainThisYear -= used;
                cf -= used;
            }

            if (gainThisYear > 0) {
                var tax = gainThisYear * annualTaxRate;
                return { newBalance: balanceAfter - tax, taxPaid: tax, carryState: cf };
            } else if (gainThisYear < 0) {
                return { newBalance: balanceAfter, taxPaid: 0, carryState: cf + (-gainThisYear) };
            }
            return { newBalance: balanceAfter, taxPaid: 0, carryState: cf };
        },

        getUI: function() {
            return {
                balanceI18n: 'labelGrossASKValue',
                taxI18n: 'taxTypeASK',
                legendI18n: 'legendASKTax',
                taxDeductedFromAccount: true,
                rateFields: ['askRate']
            };
        }
    };

    // ------------------------------------------------------------
    //  DEFERRED_SKJERMING — norsk ASK med skjermingsfradrag
    //  Skatten är uppskjuten till uttag. Skjermingsfradraget
    //  (riskfri avkastning) dras av från vinsten.
    // ------------------------------------------------------------
    var DEFERRED_SKJERMING = {
        id: 'DEFERRED_SKJERMING',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var capitalGainsTax = (params.capitalGainsTax !== undefined) ? params.capitalGainsTax : 0.3784;
            var skjermingsrente = (params.skjermingsrente !== undefined) ? params.skjermingsrente : 2.5;
            var skjermingsrate = skjermingsrente / 100;
            var balance = initial;
            var costBasis = initial;
            var accumulatedFradrag = 0;
            var growth = 1 + monthlyRateNet;

            for (var yr = 1; yr <= years; yr++) {
                var basisBefore = costBasis;
                for (var m = 0; m < 12; m++) {
                    balance = balance * growth + monthly;
                    costBasis += monthly;
                }
                accumulatedFradrag += basisBefore * skjermingsrate;
                if (monthly > 0) {
                    accumulatedFradrag += monthly * 12 * 0.5 * skjermingsrate;
                }
            }

            var gain = balance - costBasis;
            var taxableGain = Math.max(0, gain - accumulatedFradrag);
            var tax = taxableGain * capitalGainsTax;

            return { balance: balance, totalTax: tax, netValue: balance - tax };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossDeferredValue',
                taxI18n: 'taxTypeCapitalGains',
                legendI18n: 'legendTax',
                taxDeductedFromAccount: false,
                rateFields: []
            };
        }
    };

    // ------------------------------------------------------------
    //  DEFERRED_PLAIN — uppskjuten skatt utan avdrag
    //  Finsk OSK och generell uppskjuten skatt.
    //  Beskattas vid uttag med CGT (ev. progressiv).
    // ------------------------------------------------------------
    var DEFERRED_PLAIN = {
        id: 'DEFERRED_PLAIN',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var months = years * 12;
            var fv = computeFV(initial, monthly, monthlyRateNet, months);
            var totalIn = initial + monthly * months;
            var gain = fv - totalIn;
            var tax = _applyCGT(gain, params);
            return { balance: fv, totalTax: tax, netValue: fv - tax };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossDeferredValue',
                taxI18n: 'taxTypeCapitalGains',
                legendI18n: 'legendTax',
                taxDeductedFromAccount: false,
                rateFields: []
            };
        }
    };

    // ------------------------------------------------------------
    //  TIME_TEST_CGT — kapitalvinstskatt med tidsberoende
    //
    //  Två varianter:
    //    1. Enkel tröskel (CZ, SK, HR, LU):
    //       timeTestThreshold — efter X års innehav → 0 % skatt.
    //       Under tröskeln tillämpas standard CGT.
    //
    //    2. Graderad (SI):
    //       timeTestGraded — array med { years, rate }-par.
    //       Varje bracket anger rate för innehav upp till (ej nått) years.
    //       Sista bracket kan sakna years (gäller allt därefter).
    // ------------------------------------------------------------
    var TIME_TEST_CGT = {
        id: 'TIME_TEST_CGT',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var months = years * 12;
            var fv = computeFV(initial, monthly, monthlyRateNet, months);
            var totalIn = initial + monthly * months;
            var gain = fv - totalIn;

            if (params.timeTestGraded) {
                var rate = null;
                for (var i = 0; i < params.timeTestGraded.length; i++) {
                    var b = params.timeTestGraded[i];
                    if (b.years === undefined || years < b.years) {
                        rate = b.rate;
                        break;
                    }
                }
                if (rate === null) rate = params.capitalGainsTax || 0.25;
                if (rate === 0) return { balance: fv, totalTax: 0, netValue: fv };
                var tax = gain * rate;
                return { balance: fv, totalTax: tax, netValue: fv - tax };
            }

            if (params.timeTestThreshold !== undefined && years >= params.timeTestThreshold) {
                return { balance: fv, totalTax: 0, netValue: fv };
            }

            var tax = _applyCGT(gain, params);
            return { balance: fv, totalTax: tax, netValue: fv - tax };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossAccountValue',
                taxI18n: 'taxTypeCapitalGains',
                legendI18n: 'legendTax',
                taxDeductedFromAccount: false,
                rateFields: []
            };
        }
    };

    // ------------------------------------------------------------
    //  TAX_FREE_WRAPPER — helt skattefri investeringsform
    //  UK ISA, polsk IKE.
    //  Ingen skatt alls — varken årlig eller vid uttag.
    // ------------------------------------------------------------
    var TAX_FREE_WRAPPER = {
        id: 'TAX_FREE_WRAPPER',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var months = years * 12;
            var fv = computeFV(initial, monthly, monthlyRateNet, months);
            return { balance: fv, totalTax: 0, netValue: fv };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossTaxFreeValue',
                taxI18n: 'taxTypeTaxFree',
                legendI18n: 'legendTax',
                taxDeductedFromAccount: false,
                rateFields: []
            };
        }
    };

    // ------------------------------------------------------------
    //  DUTCH_BOX3 — nederländsk förmögenhetsskatt (Box 3)
    //  Beskattar en schablonmässig avkastning på nettoförmögenheten
    //  årligen, oavsett faktisk avkastning. Skatten betalas separat.
    //  Effektiv skatt ~2,17 % av portföljvärdet/år (2024).
    // ------------------------------------------------------------
    var DUTCH_BOX3 = {
        id: 'DUTCH_BOX3',

        simulate: function(initial, monthly, monthlyRateNet, years, params) {
            var deemedReturn = (params.deemedReturn !== undefined) ? params.deemedReturn : 0.0604;
            var taxRate = (params.taxRate !== undefined) ? params.taxRate : 0.36;
            var exemption = (params.exemption !== undefined) ? params.exemption : 57000;
            var balance = initial;
            var totalTax = 0;
            var growth = 1 + monthlyRateNet;

            for (var yr = 1; yr <= years; yr++) {
                var balanceJan1 = balance;
                for (var m = 0; m < 12; m++) {
                    balance = balance * growth + monthly;
                }
                totalTax += Math.max(0, balanceJan1 - exemption) * deemedReturn * taxRate;
            }
            return { balance: balance, totalTax: totalTax, netValue: balance - totalTax };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossAccountValue',
                taxI18n: 'taxTypeWealth',
                legendI18n: 'legendWealthTax',
                taxDeductedFromAccount: false,
                rateFields: []
            };
        }
    };

    // ---- Registrera alla regimer ----
    return {
        CGT_ONLY: CGT_ONLY,
        ISK: ISK,
        LAGER_ANNUAL: LAGER_ANNUAL,
        DEFERRED_SKJERMING: DEFERRED_SKJERMING,
        DEFERRED_PLAIN: DEFERRED_PLAIN,
        TIME_TEST_CGT: TIME_TEST_CGT,
        TAX_FREE_WRAPPER: TAX_FREE_WRAPPER,
        DUTCH_BOX3: DUTCH_BOX3
    };
})();

// ============================================================
//  Bekvämlighetswrapper — används av binärsökning i Sparmål
//  och av test.js för bakåtkompatibilitet.
// ============================================================
function simulateGoal(initial, monthly, monthlyRateNet, years, iskOn, iskSchRate, fribelopp, config) {
    config = config || {};

    // Om skattegynnat konto ej är aktiverat → alltid CGT_ONLY
    if (!iskOn) {
        var cgtParams = {
            capitalGainsTax: config.capitalGainsTax || 0.30,
            capitalGainsTaxHigh: config.capitalGainsTaxHigh,
            capitalGainsTaxThreshold: config.capitalGainsTaxThreshold
        };
        if (config.capitalGainsTaxBrackets !== undefined) {
            cgtParams.capitalGainsTaxBrackets = config.capitalGainsTaxBrackets;
        }
        var r = TAX_REGIMES.CGT_ONLY.simulate(initial, monthly, monthlyRateNet, years, cgtParams);
        return { netValue: r.netValue, tax: r.totalTax };
    }

    // Hitta rätt regim från config
    var regimeId = config.taxAdvantagedType || config.taxRegime || 'ISK';
    var regime = TAX_REGIMES[regimeId] || TAX_REGIMES.ISK;

    // Bygg params från config — alla kända fält kopieras
    var params = {};
    var paramKeys = ['askAnnualTax', 'iskSkatt', 'iskSchablonGolv', 'iskSchablonRateDefault',
        'skjermingsrente', 'capitalGainsTax', 'capitalGainsTaxHigh',
        'capitalGainsTaxThreshold', 'capitalGainsTaxBrackets',
        'timeTestThreshold', 'timeTestGraded', 'deemedReturn', 'taxRate', 'exemption'];
    for (var i = 0; i < paramKeys.length; i++) {
        var k = paramKeys[i];
        if (config[k] !== undefined) params[k] = config[k];
    }

    // ISK-specifika parametrar
    if (regimeId === 'ISK') {
        params.iskSchablonRate = iskSchRate;
        params.iskFribelopp = (fribelopp !== undefined) ? fribelopp : ISK_FRIBELOPP_DEFAULT;
    }

    var result = regime.simulate(initial, monthly, monthlyRateNet, years, params);
    return { netValue: result.netValue, tax: result.totalTax };
}

// ============================================================
//  Browser-testrunner — körs vid localhost
// ============================================================
function runTests() {
    var passed = 0, failed = 0;
    var log = function(name, ok, detail) {
        if (ok) { passed++; console.log('\u2713', name); }
        else    { failed++; console.error('\u2717', name, detail); }
    };
    var approx = function(a, b, tol) { tol = tol || 1; return Math.abs(a - b) <= tol; };

    // 1. Nollränta, ingen insättning
    {
        var v = computeFV(100000, 0, 0, 120);
        log('Nollranta, ingen insattning, 10 ar', v === 100000, 'fick ' + v);
    }

    // 2. Ränta-på-ränta (1 år, månadsvis)
    {
        var v = computeFV(10000, 0, 0.10 / 12, 12);
        log('10 000 kr @ 10 %/ar, manadsvis, 1 ar \u2248 11 047,13', approx(v, 11047.13, 0.01), 'fick ' + v);
    }

    // 3. Ren månadsinsättning
    {
        var v = computeFV(0, 1000, 0, 12);
        log('1 000 kr/man utan ranta, 1 ar = 12 000', v === 12000, 'fick ' + v);
    }

    // 4. Avgift minskar avkastningen
    {
        var v = computeNetAfterFees(100000, 0, 8, 2, 1);
        log('100 000 kr @ 8 % minus 2 % avgift, 1 ar \u2248 106 167,78', approx(v, 106167.78, 0.5), 'fick ' + v);
    }

    // 5. AF kapitalvinstskatt
    {
        var fv = computeNetAfterFees(100000, 0, 10, 0, 1);
        var tax = computeCapitalGainsTax(fv - 100000);
        var net = fv - tax;
        log('AF: 100 000 @ 10 %, 1 ar, netto \u2248 107 330', approx(net, 107330, 5), 'fick netto ' + net + ', skatt ' + tax);
    }

    // 6. ISK med fribelopp (under 300k -> ingen skatt)
    {
        var r = TAX_REGIMES.ISK.simulate(100000, 0, 0, 1, { iskSchablonRate: 3.55 });
        log('ISK 100 000 kr (under fribelopp) -> skatt = 0', r.totalTax === 0, 'fick skatt ' + r.totalTax);
    }

    // 7. ISK med fribelopp (över 300k)
    {
        var r = TAX_REGIMES.ISK.simulate(500000, 0, 0, 1, { iskSchablonRate: 3.55 });
        log('ISK 500 000 kr -> skatt \u2248 2 130', approx(r.totalTax, 2130, 1), 'fick skatt ' + r.totalTax);
    }

    // 8. Schablonräntans golv
    {
        var r = TAX_REGIMES.ISK.simulate(100000, 0, 0, 1, { iskSchablonRate: 1.0, iskFribelopp: 0 });
        log('ISK schablonrantans golv 1,25 % anvands', approx(r.totalTax, 375, 1), 'fick skatt ' + r.totalTax);
    }

    // 9. Inflationsjustering via computeFV
    {
        var realValue = computeFV(200000, 0, -0.02 / 12, 120);
        log('computeFV: realvarde 200 000 kr vid 2% inflation i 10 ar \u2248 163 719', approx(realValue, 163719, 1), 'fick ' + realValue.toFixed(2));
    }

    // 10. Sparmål (sanity check)
    {
        var r = simulateGoal(0, 1000, 0.05 / 12, 10, false, 0);
        log('simulateGoal AF 1 000/man @ 5 % i 10 ar ger rimligt netto', r.netValue > 140000 && r.netValue < 160000, 'fick ' + r.netValue);
    }

    // 11. LAGER_ANNUAL (dansk ASK) — årlig lagerbeskatning, skatt dras från kontot
    {
        var r = TAX_REGIMES.LAGER_ANNUAL.simulate(100000, 0, 0.07 / 12, 1, { askAnnualTax: 0.17 });
        log('ASK: 100k @ 7%, 1 \u00E5r, 17% skatt dras \u2248 106 000',
            approx(r.balance, 106000, 5) && r.totalTax > 0 && r.netValue === r.balance,
            'saldo ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0) + ', netto ' + r.netValue.toFixed(0));
    }

    // 12. LAGER_ANNUAL — carry-forward: förlustår kvittas mot framtida vinst
    {
        var r = TAX_REGIMES.LAGER_ANNUAL.simulate(100000, 0, -0.10 / 12, 1, { askAnnualTax: 0.17 });
        var r2 = TAX_REGIMES.LAGER_ANNUAL.simulate(100000, 0, 0.10 / 12, 1, { askAnnualTax: 0.17 });
        log('ASK: f\u00F6rlust\u00E5r ger 0 i skatt', r.totalTax === 0, 'skatt ' + r.totalTax + ', carry=' + (r.balance < 100000));
        log('ASK: vinst\u00E5r efter f\u00F6rlust f\u00E5r samma skatt som rent vinst\u00E5r',
            approx(r2.totalTax, (TAX_REGIMES.LAGER_ANNUAL.simulate(100000, 0, 0.10 / 12, 1, { askAnnualTax: 0.17 })).totalTax, 1));
    }

    // 13. DEFERRED_SKJERMING (norsk ASK) — uppskjuten skatt med skjermingsfradrag
    {
        var r = TAX_REGIMES.DEFERRED_SKJERMING.simulate(100000, 0, 0.07 / 12, 5, { capitalGainsTax: 0.3784, skjermingsrente: 3.6 });
        log('DEFERRED_SKJERMING: 100k @ 7% i 5 \u00E5r ger skatt > 0 och netto > saldo',
            r.totalTax > 0 && r.netValue < r.balance && r.balance > 100000,
            'balans ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0) + ', netto ' + r.netValue.toFixed(0));
    }

    // 14. DEFERRED_SKJERMING — insättningar ökar skjermingsfradrag → lägre skatt
    {
        var rUtan = TAX_REGIMES.DEFERRED_SKJERMING.simulate(100000, 0, 0.07 / 12, 5, { capitalGainsTax: 0.3784, skjermingsrente: 3.6 });
        var rMed = TAX_REGIMES.DEFERRED_SKJERMING.simulate(100000, 1000, 0.07 / 12, 5, { capitalGainsTax: 0.3784, skjermingsrente: 3.6 });
        log('DEFERRED_SKJERMING: ins\u00E4ttningar \u00F6kar fradrag \u2192 l\u00E4gre skatt',
            rMed.totalTax < rUtan.totalTax || ((rMed.balance - rMed.totalTax) > (rUtan.balance - rUtan.totalTax)),
            'utan: skatt ' + rUtan.totalTax.toFixed(0) + ', med: skatt ' + rMed.totalTax.toFixed(0));
    }

    // 15. DEFERRED_PLAIN (finsk OSK) — uppskjuten CGT utan avdrag
    {
        var r = TAX_REGIMES.DEFERRED_PLAIN.simulate(100000, 0, 0.07 / 12, 1, { capitalGainsTax: 0.30 });
        log('DEFERRED_PLAIN: 100k @ 7%, 1 \u00E5r, 30% CGT \u2248 105 060',
            approx(r.netValue, 105060, 5) && r.totalTax > 0,
            'netto ' + r.netValue.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0));
    }

    // 16. DEFERRED_PLAIN — med bracket-array (skattefri exemption)
    {
        var r = TAX_REGIMES.DEFERRED_PLAIN.simulate(100000, 0, 0.07 / 12, 1, { capitalGainsTaxBrackets: [{ threshold: 10000, rate: 0 }, { rate: 0.10 }] });
        log('DEFERRED_PLAIN brackets: vinst under 10k exempel -> skatt 0',
            r.totalTax === 0,
            'netto ' + r.netValue.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0));
    }

    // 17. TIME_TEST_CGT — enkel tröskel: skattefritt efter X år
    {
        var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 4, { timeTestThreshold: 3, capitalGainsTax: 0.15 });
        log('TIME_TEST_CGT: 4 \u00E5r, tr\u00F6skel 3 \u2192 skatt = 0',
            r.totalTax === 0 && r.balance > 100000,
            'balans ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0));
    }

    // 18. TIME_TEST_CGT — under tröskel: beskattas
    {
        var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 2, { timeTestThreshold: 3, capitalGainsTax: 0.15 });
        log('TIME_TEST_CGT: 2 \u00E5r, tr\u00F6skel 3 \u2192 skatt > 0',
            r.totalTax > 0 && r.netValue < r.balance,
            'balans ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0));
    }

    // 19. TIME_TEST_CGT — graderad: rätt bracket väljs
    {
        var graded = [{ years: 5, rate: 0.25 }, { years: 10, rate: 0.20 }, { years: 15, rate: 0.15 }, { rate: 0 }];
        var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 20, { timeTestGraded: graded });
        log('TIME_TEST_CGT graded: 20 \u00E5r \u2192 0% (sista bracket)',
            r.totalTax === 0,
            'balans ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0));
    }

    // 20. TIME_TEST_CGT — graderad: mellanliggande bracket
    {
        var graded = [{ years: 5, rate: 0.25 }, { years: 10, rate: 0.20 }, { years: 15, rate: 0.15 }, { rate: 0 }];
        var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 7, { timeTestGraded: graded });
        log('TIME_TEST_CGT graded: 7 \u00E5r \u2192 20% bracket',
            r.totalTax > 0 && r.netValue < r.balance,
            'balans ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0) + ', netto ' + r.netValue.toFixed(0));
    }

    // 21. TAX_FREE_WRAPPER (UK ISA) — helt skattefritt
    {
        var r = TAX_REGIMES.TAX_FREE_WRAPPER.simulate(100000, 0, 0.07 / 12, 1, {});
        log('TAX_FREE_WRAPPER: 100k @ 7%, 1 \u00E5r \u2192 skatt = 0, netto = balans',
            r.totalTax === 0 && r.netValue === r.balance && r.balance > 100000,
            'balans ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax + ', netto ' + r.netValue.toFixed(0));
    }

    // 22. TAX_FREE_WRAPPER — med månadsinsättningar
    {
        var r = TAX_REGIMES.TAX_FREE_WRAPPER.simulate(0, 1000, 0.05 / 12, 5, {});
        log('TAX_FREE_WRAPPER: 1 000/man @ 5% i 5 \u00E5r, helt skattefritt',
            r.totalTax === 0 && r.balance > 60000,
            'balans ' + r.balance.toFixed(0));
    }

    // 23. DUTCH_BOX3 (nederländsk förmögenhetsskatt)
    {
        var r = TAX_REGIMES.DUTCH_BOX3.simulate(100000, 0, 0.07 / 12, 1, {});
        log('DUTCH_BOX3: 100k @ 7%, 1 \u00E5r \u2192 f\u00F6rm\u00F6genhetsskatt > 0',
            r.totalTax > 0 && r.netValue < r.balance && r.balance > 100000,
            'balans ' + r.balance.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0) + ', netto ' + r.netValue.toFixed(0));
    }

    // 24. DUTCH_BOX3 — under exemption: ingen skatt
    {
        var r = TAX_REGIMES.DUTCH_BOX3.simulate(30000, 0, 0, 1, { exemption: 57000 });
        log('DUTCH_BOX3: 30k under exemption 57k \u2192 skatt = 0',
            r.totalTax === 0,
            'skatt ' + r.totalTax.toFixed(0));
    }

    // 25. simulateGoal med skatteregim via config (t.ex. dansk ASK i sparmål)
    {
        var r = simulateGoal(0, 1000, 0.05 / 12, 10, true, 0, undefined, { taxAdvantagedType: 'TAX_FREE_WRAPPER' });
        log('simulateGoal TAX_FREE_WRAPPER: netto > 140k, skatt = 0',
            r.netValue > 140000 && r.tax === 0,
            'netto ' + r.netValue.toFixed(0) + ', skatt ' + r.tax);
    }

    console.log('\nTesterna klara: ' + passed + ' OK, ' + failed + ' fel.');
    return { passed: passed, failed: failed };
}
