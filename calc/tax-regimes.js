// ============================================================
//  calc/tax-regimes.js — Pluggbar skatteregims-register
//
//  Varje regim är ett självständigt objekt med:
//    simulateSchedule() — kärnsimulering över ett insättningsschema
//    simulate()         — bekvämlighetsvariant (startkapital + fast
//                         månadsbelopp), bygger schemat och anropar
//                         simulateSchedule()
//    simulateYear()     — per-år-justering (används av LAGER_ANNUAL)
//    getUI()            — metadata för UI-rendering (etiketter etc.)
//
//  Insättningsschema: array med längd months + 1.
//    deps[0]  = startkapital (insatt vid t = 0, 1 januari år 1)
//    deps[m]  = insättning vid slutet av månad m (m = 1..months)
//  Alla regimer använder samma konvention som computeFV():
//    saldo = saldo × (1 + r) + insättning   (end-of-month)
//
//  Ett schema (i stället för fast månadsbelopp) behövs för att
//  kunna hantera insättningstak: det som inte ryms i det
//  skattegynnade kontot flyttas till standardkontot (se
//  simulateAccount längst ned).
//
//  Lägg till en ny regim HÄR — en gång. Länder som refererar
//  regim-ID:t i countries.js får automatiskt rätt beräkning.
//
//  Beroenden: core.js (computeCapitalGainsTax),
//             constants.js (ISK_SKATT, ISK_SCHABLON_GOLV, ISK_FRIBELOPP_DEFAULT)
// ============================================================

/**
 * Bygger ett insättningsschema för startkapital + fast månadsbelopp.
 */
function makeDepositSchedule(initial, monthly, months) {
    var deps = new Array(months + 1);
    deps[0] = Number(initial) || 0;
    var mo = Number(monthly) || 0;
    for (var m = 1; m <= months; m++) deps[m] = mo;
    return deps;
}

function sumSchedule(deps) {
    var s = 0;
    for (var i = 0; i < deps.length; i++) s += deps[i];
    return s;
}

var TAX_REGIMES = (function() {

    // ------------------------------------------------------------
    //  Gemensamma hjälpfunktioner
    // ------------------------------------------------------------
    function simulateYearNoOp(balanceBefore, balanceAfter, deposits, carryState) {
        return { newBalance: balanceAfter, taxPaid: 0, carryState: carryState };
    }

    function withSchedule(regime) {
        regime.simulate = function(initial, monthly, monthlyRateNet, years, params) {
            var deps = makeDepositSchedule(initial, monthly, years * 12);
            return regime.simulateSchedule(deps, monthlyRateNet, years, params || {});
        };
        return regime;
    }

    /** Slutsaldo för ett schema (ingen skatt). */
    function runBalance(deps, monthlyRate, months) {
        var g = 1 + monthlyRate;
        var bal = deps[0];
        for (var m = 1; m <= months; m++) bal = bal * g + deps[m];
        return bal;
    }

    /**
     * Kapitalvinstskatt med landsparametrar.
     * partialExemption (t.ex. tysk Teilfreistellung 30 %) minskar den
     * skattepliktiga vinsten innan fribelopp/brytpunkter tillämpas.
     */
    function _applyCGT(gain, params) {
        if (gain > 0 && params.partialExemption) {
            gain = gain * (1 - params.partialExemption);
        }
        if (params.capitalGainsTaxBrackets) {
            return computeCapitalGainsTax(gain, params.capitalGainsTaxBrackets);
        }
        return computeCapitalGainsTax(gain,
            params.capitalGainsTax,
            params.capitalGainsTaxThreshold,
            params.capitalGainsTaxHigh);
    }

    /**
     * Gemensam "skatt vid försäljning/uttag"-simulering.
     * Stöder valfri årlig schablonskatt på fondinnehav (svensk
     * schablonintäkt på fondandelar: 0,4 % av värdet 1 januari,
     * beskattas med 30 % ⇒ 0,12 %/år). Den betalas via deklarationen
     * och minskar inte kontots värde.
     */
    function _simulateDeferredCGT(deps, monthlyRate, years, params) {
        var months = years * 12;
        var g = 1 + monthlyRate;
        var bal = deps[0];
        var levyRate = 0;
        if (params.fundSchablon) {
            var levyTax = (params.fundSchablonTax !== undefined) ? params.fundSchablonTax
                : (params.capitalGainsTax !== undefined ? params.capitalGainsTax : KAPITALVINSTSKATT);
            levyRate = params.fundSchablon * levyTax;
        }
        var levy = 0;
        for (var yr = 1; yr <= years; yr++) {
            if (levyRate > 0) levy += Math.max(0, bal) * levyRate;
            for (var k = 1; k <= 12; k++) {
                var m = (yr - 1) * 12 + k;
                bal = bal * g + deps[m];
            }
        }
        var gain = bal - sumSchedule(deps.slice(0, months + 1));
        var tax = _applyCGT(gain, params);
        return { balance: bal, totalTax: tax + levy, netValue: bal - tax - levy, annualLevy: levy };
    }

    // ------------------------------------------------------------
    //  CGT_ONLY — standard kapitalvinstskatt vid försäljning
    //  Används av: de flesta länders standardkonton
    // ------------------------------------------------------------
    var CGT_ONLY = withSchedule({
        id: 'CGT_ONLY',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            return _simulateDeferredCGT(deps, monthlyRateNet, years, params);
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
    });

    // ------------------------------------------------------------
    //  ISK — svensk schablonbeskattning
    //  Kapitalunderlag = (värde 1/1 + 1/4 + 1/7 + 1/10
    //                     + årets insättningar) / 4
    //  Skatten betalas via deklarationen — kontot växer oavkortat.
    // ------------------------------------------------------------
    var ISK = withSchedule({
        id: 'ISK',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            var fribelopp = (params.iskFribelopp !== undefined) ? params.iskFribelopp : ISK_FRIBELOPP_DEFAULT;
            var iskSkatt = (params.iskSkatt !== undefined) ? params.iskSkatt : ISK_SKATT;
            var schablonGolv = (params.iskSchablonGolv !== undefined) ? params.iskSchablonGolv : ISK_SCHABLON_GOLV;
            var schablonRanta = (params.iskSchablonRate !== undefined) ? params.iskSchablonRate
                : (params.iskSchablonRateDefault !== undefined) ? params.iskSchablonRateDefault : 3.55;

            var effectiveSchablonRanta = Math.max(schablonRanta, schablonGolv);
            var g = 1 + monthlyRateNet;
            var balance = deps[0];
            var totalISKtax = 0;

            for (var yr = 1; yr <= years; yr++) {
                var quarterSum = 0;
                var depositsThisYear = 0;
                for (var k = 1; k <= 12; k++) {
                    if (k === 1 || k === 4 || k === 7 || k === 10) quarterSum += balance;
                    var m = (yr - 1) * 12 + k;
                    balance = balance * g + deps[m];
                    depositsThisYear += deps[m];
                }
                var kapitalunderlag = (quarterSum + depositsThisYear) / 4;
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
    });

    // ------------------------------------------------------------
    //  LAGER_ANNUAL — dansk ASK: 17 % årlig lagerbeskattning
    //  Skatten dras från kontot varje år. Negativ avkastning förs
    //  fram och kvittas mot framtida avkastning på kontot UTAN
    //  tidsgräns.
    // ------------------------------------------------------------
    function _carryToNumber(carryState) {
        if (typeof carryState === 'number') return carryState;
        if (Array.isArray(carryState)) {
            return carryState.reduce(function(s, l) { return s + (l && l.amount ? l.amount : 0); }, 0);
        }
        return 0;
    }

    function _lagerYear(gainThisYear, carry, annualTaxRate) {
        if (gainThisYear > 0 && carry > 0) {
            var used = Math.min(gainThisYear, carry);
            gainThisYear -= used;
            carry -= used;
        }
        var tax = 0;
        if (gainThisYear > 0) {
            tax = gainThisYear * annualTaxRate;
        } else if (gainThisYear < 0) {
            carry += -gainThisYear;
        }
        return { tax: tax, carry: carry };
    }

    var LAGER_ANNUAL = withSchedule({
        id: 'LAGER_ANNUAL',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            var annualTaxRate = (params.askAnnualTax !== undefined) ? params.askAnnualTax : 0.17;
            var g = 1 + monthlyRateNet;
            var balance = deps[0];
            var totalTax = 0;
            var carry = 0;

            for (var yr = 1; yr <= years; yr++) {
                var balanceBeforeYear = balance;
                var depositsThisYear = 0;
                for (var k = 1; k <= 12; k++) {
                    var m = (yr - 1) * 12 + k;
                    balance = balance * g + deps[m];
                    depositsThisYear += deps[m];
                }
                var res = _lagerYear(balance - balanceBeforeYear - depositsThisYear, carry, annualTaxRate);
                carry = res.carry;
                balance -= res.tax;
                totalTax += res.tax;
            }
            return { balance: balance, totalTax: totalTax, netValue: balance };
        },

        simulateYear: function(balanceBefore, balanceAfter, deposits, carryState, params) {
            params = params || {};
            var annualTaxRate = (params.askAnnualTax !== undefined) ? params.askAnnualTax : 0.17;
            var res = _lagerYear(balanceAfter - balanceBefore - deposits, _carryToNumber(carryState), annualTaxRate);
            return { newBalance: balanceAfter - res.tax, taxPaid: res.tax, carryState: res.carry };
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
    });

    // ------------------------------------------------------------
    //  DEFERRED_SKJERMING — norsk beskattning med skjermingsfradrag
    //
    //  Skjermingsgrunnlag = insatt kapital + oanvänd skjerming från
    //  tidigare år (oanvänd skjerming växer alltså med räntan).
    //
    //  skjermingBasis:
    //    'lowest'  (ASK, default) — lägsta innskudd under året, dvs.
    //              insatt kapital vid årets början. Årets nya
    //              insättningar ger skjerming först nästa år.
    //    'yearEnd' (vanligt konto) — innehav 31 december; aktier/
    //              fonder köpta under året ger skjerming hela året.
    //
    //  Skatten (37,84 %) tas ut vid uttag/försäljning på vinst minus
    //  ackumulerad skjerming (aldrig under 0).
    // ------------------------------------------------------------
    var DEFERRED_SKJERMING = withSchedule({
        id: 'DEFERRED_SKJERMING',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            var capitalGainsTax = (params.capitalGainsTax !== undefined) ? params.capitalGainsTax : 0.3784;
            var skjermingsrente = (params.skjermingsrente !== undefined) ? params.skjermingsrente : 3.6;
            var rate = skjermingsrente / 100;
            var yearEnd = params.skjermingBasis === 'yearEnd';
            var g = 1 + monthlyRateNet;

            var balance = deps[0];
            var costBasis = deps[0];
            var unusedSkjerming = 0;

            for (var yr = 1; yr <= years; yr++) {
                var costAtStart = costBasis;
                for (var k = 1; k <= 12; k++) {
                    var m = (yr - 1) * 12 + k;
                    balance = balance * g + deps[m];
                    costBasis += deps[m];
                }
                var grunnlag = (yearEnd ? costBasis : costAtStart) + unusedSkjerming;
                unusedSkjerming += grunnlag * rate;
            }

            var gain = balance - costBasis;
            var taxableGain = Math.max(0, gain - unusedSkjerming);
            var tax = taxableGain * capitalGainsTax;

            return { balance: balance, totalTax: tax, netValue: balance - tax, skjerming: unusedSkjerming };
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
    });

    // ------------------------------------------------------------
    //  DEFERRED_PLAIN — uppskjuten skatt utan avdrag
    //  Finsk OSK, baltiska investeringskonton.
    //  Beskattas vid uttag med CGT (ev. progressiv).
    // ------------------------------------------------------------
    var DEFERRED_PLAIN = withSchedule({
        id: 'DEFERRED_PLAIN',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            return _simulateDeferredCGT(deps, monthlyRateNet, years, params);
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
    });

    // ------------------------------------------------------------
    //  TIME_TEST_CGT — kapitalvinstskatt med tidsberoende
    //
    //  timeTestPerLot (CZ, IT PIR):
    //    Varje insättning har sin egen innehavstid. Bara de poster
    //    som hållits ≥ timeTestThreshold år är skattefria; senare
    //    insättningar beskattas med standard-CGT.
    //
    //  Utan timeTestPerLot (FR PEA):
    //    Tiden räknas från kontots öppnande, dvs. hela
    //    placeringshorisonten avgör vilken sats som gäller.
    //
    //  Varianter:
    //    timeTestThreshold — efter X år → 0 % skatt.
    //    timeTestGraded    — [{ years, rate }, ..., { rate }]:
    //                        rate gäller för innehav < years.
    // ------------------------------------------------------------
    function _gradedRate(graded, heldYears, params) {
        for (var i = 0; i < graded.length; i++) {
            var b = graded[i];
            if (b.years === undefined || heldYears < b.years) return b.rate;
        }
        if (typeof console !== 'undefined')
            console.warn('TIME_TEST_CGT: timeTestGraded saknar öppen sista bracket — kontrollera landkonfigurationen');
        return (params.capitalGainsTax !== undefined) ? params.capitalGainsTax : 0.25;
    }

    var TIME_TEST_CGT = withSchedule({
        id: 'TIME_TEST_CGT',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            var months = years * 12;
            var g = 1 + monthlyRateNet;
            var fv = runBalance(deps, monthlyRateNet, months);
            var totalIn = sumSchedule(deps.slice(0, months + 1));
            var tax;

            if (params.timeTestPerLot) {
                var taxableGain = 0;
                var gradedTax = 0;
                for (var m = 0; m <= months; m++) {
                    if (!deps[m]) continue;
                    var heldMonths = months - m;
                    var lotGain = deps[m] * (Math.pow(g, heldMonths) - 1);
                    if (params.timeTestGraded) {
                        gradedTax += lotGain * _gradedRate(params.timeTestGraded, heldMonths / 12, params);
                    } else if (params.timeTestThreshold === undefined || heldMonths < params.timeTestThreshold * 12) {
                        taxableGain += lotGain;
                    }
                }
                tax = params.timeTestGraded ? Math.max(0, gradedTax) : _applyCGT(taxableGain, params);
                return { balance: fv, totalTax: tax, netValue: fv - tax };
            }

            var gain = fv - totalIn;
            if (params.timeTestGraded) {
                var rate = _gradedRate(params.timeTestGraded, years, params);
                tax = gain > 0 ? gain * rate : 0;
                return { balance: fv, totalTax: tax, netValue: fv - tax };
            }

            if (params.timeTestThreshold !== undefined && years >= params.timeTestThreshold) {
                return { balance: fv, totalTax: 0, netValue: fv };
            }

            tax = _applyCGT(gain, params);
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
    });

    // ------------------------------------------------------------
    //  TAX_FREE_WRAPPER — helt skattefri investeringsform
    //  UK ISA, polsk IKE. Insättningstak hanteras av simulateAccount.
    // ------------------------------------------------------------
    var TAX_FREE_WRAPPER = withSchedule({
        id: 'TAX_FREE_WRAPPER',

        simulateSchedule: function(deps, monthlyRateNet, years) {
            var fv = runBalance(deps, monthlyRateNet, years * 12);
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
    });

    // ------------------------------------------------------------
    //  DUTCH_BOX3 — nederländsk förmögenhetsskatt (Box 3)
    //  Schablonavkastning på värdet 1 januari över fribeloppet,
    //  beskattas årligen. Skatten betalas separat.
    //  2026: €59 357 fribelopp, 6,00 % schablon, 36 % skatt.
    // ------------------------------------------------------------
    var DUTCH_BOX3 = withSchedule({
        id: 'DUTCH_BOX3',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            var deemedReturn = (params.deemedReturn !== undefined) ? params.deemedReturn : 0.06;
            var taxRate = (params.taxRate !== undefined) ? params.taxRate : 0.36;
            var exemption = (params.exemption !== undefined) ? params.exemption : 59357;
            var g = 1 + monthlyRateNet;
            var balance = deps[0];
            var totalTax = 0;

            for (var yr = 1; yr <= years; yr++) {
                totalTax += Math.max(0, balance - exemption) * deemedReturn * taxRate;
                for (var k = 1; k <= 12; k++) {
                    balance = balance * g + deps[(yr - 1) * 12 + k];
                }
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
    });

    // ------------------------------------------------------------
    //  EXIT_TAX — irländsk exit tax på fonder/ETF:er
    //  38 % (från 2026) på vinsten, inget årligt fribelopp.
    //  Deemed disposal: vart 8:e år efter varje köp beskattas
    //  orealiserad vinst som om den sålts. Skatten antas betalas
    //  genom att andelar säljs (dras från kontot) och postens
    //  anskaffningsvärde återställs till marknadsvärdet.
    // ------------------------------------------------------------
    var EXIT_TAX = withSchedule({
        id: 'EXIT_TAX',

        simulateSchedule: function(deps, monthlyRateNet, years, params) {
            var rate = (params.exitTax !== undefined) ? params.exitTax : 0.38;
            var ddMonths = ((params.deemedDisposalYears !== undefined) ? params.deemedDisposalYears : 8) * 12;
            var months = years * 12;
            var g = 1 + monthlyRateNet;
            var price = 1;
            var units = new Array(months + 1);
            var basis = new Array(months + 1);
            var deemedTax = 0;

            for (var m = 0; m <= months; m++) {
                if (m > 0) price *= g;
                units[m] = deps[m] / price;
                basis[m] = deps[m];
                if (ddMonths > 0) {
                    for (var k = m - ddMonths; k >= 0; k -= ddMonths) {
                        if (!units[k]) continue;
                        var value = units[k] * price;
                        var lotGain = value - basis[k];
                        if (lotGain > 0) {
                            var tax = lotGain * rate;
                            deemedTax += tax;
                            units[k] -= tax / price;
                            basis[k] = units[k] * price;
                        }
                    }
                }
            }

            var balance = 0;
            var finalTax = 0;
            for (var j = 0; j <= months; j++) {
                if (!units[j]) continue;
                var v = units[j] * price;
                balance += v;
                if (v > basis[j]) finalTax += (v - basis[j]) * rate;
            }
            return { balance: balance, totalTax: deemedTax + finalTax, netValue: balance - finalTax, deemedDisposalTax: deemedTax };
        },

        simulateYear: simulateYearNoOp,

        getUI: function() {
            return {
                balanceI18n: 'labelGrossAccountValue',
                taxI18n: 'taxTypeExitTax',
                legendI18n: 'legendTax',
                taxDeductedFromAccount: true,
                rateFields: []
            };
        }
    });

    // ---- Registrera alla regimer ----
    return {
        CGT_ONLY: CGT_ONLY,
        ISK: ISK,
        LAGER_ANNUAL: LAGER_ANNUAL,
        DEFERRED_SKJERMING: DEFERRED_SKJERMING,
        DEFERRED_PLAIN: DEFERRED_PLAIN,
        TIME_TEST_CGT: TIME_TEST_CGT,
        TAX_FREE_WRAPPER: TAX_FREE_WRAPPER,
        DUTCH_BOX3: DUTCH_BOX3,
        EXIT_TAX: EXIT_TAX
    };
})();

// ============================================================
//  Insättningstak för skattegynnade konton
//
//  cap = {
//    annual:       max insättning per kalenderår (ISA, IKE, PIR)
//    lifetime:     max summa insättningar totalt (OSK, PEA, PIR)
//    yearStartValue: årets insättningsutrymme = tak − kontots
//                  värde vid årets början (dansk ASK)
//  }
//  Returnerar { wrapper, overflow, wrapperTotal, overflowTotal }
//  där wrapper/overflow är insättningsscheman av samma längd.
// ============================================================
function splitDepositsByCap(deps, cap, monthlyRate, params) {
    var n = deps.length;
    var wrapper = new Array(n);
    var overflow = new Array(n);
    var wrapperTotal = 0, overflowTotal = 0;
    params = params || {};

    if (!cap) {
        for (var i = 0; i < n; i++) { wrapper[i] = deps[i]; overflow[i] = 0; wrapperTotal += deps[i]; }
        return { wrapper: wrapper, overflow: overflow, wrapperTotal: wrapperTotal, overflowTotal: 0 };
    }

    var g = 1 + monthlyRate;
    var lifetimeRoom = (cap.lifetime !== undefined) ? cap.lifetime : Infinity;
    var annualRoom = Infinity, valueRoom = Infinity;
    var proj = 0, projYearStart = 0, depsThisYear = 0;
    var lagerTax = params.askAnnualTax || 0;

    function startYear() {
        annualRoom = (cap.annual !== undefined) ? cap.annual : Infinity;
        valueRoom = (cap.yearStartValue !== undefined) ? Math.max(0, cap.yearStartValue - proj) : Infinity;
        projYearStart = proj;
        depsThisYear = 0;
    }

    startYear();
    for (var m = 0; m < n; m++) {
        if (m > 1 && (m - 1) % 12 === 0) {
            // Årsskifte: approximera ev. årlig lagerskatt i projektionen
            if (lagerTax > 0) {
                var yGain = proj - projYearStart - depsThisYear;
                if (yGain > 0) proj -= yGain * lagerTax;
            }
            startYear();
        }
        var dep = deps[m] || 0;
        var allowed = Math.max(0, Math.min(dep, annualRoom, lifetimeRoom, valueRoom));
        wrapper[m] = allowed;
        overflow[m] = dep - allowed;
        annualRoom -= allowed; lifetimeRoom -= allowed; valueRoom -= allowed;
        wrapperTotal += allowed; overflowTotal += dep - allowed;
        depsThisYear += allowed;
        proj = (m === 0) ? allowed : proj * g + allowed;
    }
    return { wrapper: wrapper, overflow: overflow, wrapperTotal: wrapperTotal, overflowTotal: overflowTotal };
}

// ============================================================
//  simulateAccount — huvudingång för UI:t
//
//  useTaxAdv = false → landets standardregim på allt kapital.
//  useTaxAdv = true  → landets skattegynnade konto upp till
//                      insättningstaket; överskottet beräknas på
//                      standardkontot och resultaten summeras.
//  overrides: användarjusterade parametrar (t.ex. ISK-schablonränta).
// ============================================================
function simulateAccount(config, useTaxAdv, initial, monthly, monthlyRateNet, years, overrides) {
    var months = years * 12;
    var deps = makeDepositSchedule(initial, monthly, months);
    var stdRegime = TAX_REGIMES[config.standardRegime];
    var stdParams = Object.assign({}, config.standardParams);

    if (!useTaxAdv || !config.taxAdvRegime || !TAX_REGIMES[config.taxAdvRegime]) {
        var r = stdRegime.simulateSchedule(deps, monthlyRateNet, years, stdParams);
        return {
            balance: r.balance, totalTax: r.totalTax, netValue: r.netValue,
            regime: stdRegime, overflowDeposits: 0, wrapperDeposits: 0
        };
    }

    var advRegime = TAX_REGIMES[config.taxAdvRegime];
    var advParams = Object.assign({}, config.taxAdvParams, overrides || {});
    var split = splitDepositsByCap(deps, config.taxAdvCap, monthlyRateNet, advParams);
    var w = advRegime.simulateSchedule(split.wrapper, monthlyRateNet, years, advParams);

    if (split.overflowTotal <= 0) {
        return {
            balance: w.balance, totalTax: w.totalTax, netValue: w.netValue,
            regime: advRegime, overflowDeposits: 0, wrapperDeposits: split.wrapperTotal
        };
    }

    var o = stdRegime.simulateSchedule(split.overflow, monthlyRateNet, years, stdParams);
    return {
        balance: w.balance + o.balance,
        totalTax: w.totalTax + o.totalTax,
        netValue: w.netValue + o.netValue,
        regime: advRegime,
        overflowDeposits: split.overflowTotal,
        wrapperDeposits: split.wrapperTotal,
        wrapperResult: w,
        overflowResult: o
    };
}

// ============================================================
//  Bekvämlighetswrapper — används av test.js för bakåtkompatibilitet.
// ============================================================
function simulateGoal(initial, monthly, monthlyRateNet, years, iskOn, iskSchRate, fribelopp, config) {
    config = config || {};
    function pick(k, dflt) { return (config[k] !== undefined) ? config[k] : dflt; }

    if (!iskOn) {
        var cgtParams = {
            capitalGainsTax: pick('capitalGainsTax', KAPITALVINSTSKATT),
            capitalGainsTaxHigh: config.capitalGainsTaxHigh,
            capitalGainsTaxThreshold: config.capitalGainsTaxThreshold
        };
        if (config.capitalGainsTaxBrackets !== undefined) {
            cgtParams.capitalGainsTaxBrackets = config.capitalGainsTaxBrackets;
        }
        var r = TAX_REGIMES.CGT_ONLY.simulate(initial, monthly, monthlyRateNet, years, cgtParams);
        return { netValue: r.netValue, tax: r.totalTax };
    }

    var regimeId = config.taxAdvantagedType || config.taxRegime || 'ISK';
    var regime = TAX_REGIMES[regimeId] || TAX_REGIMES.ISK;

    var params = {};
    var paramKeys = ['askAnnualTax', 'iskSkatt', 'iskSchablonGolv', 'iskSchablonRateDefault',
        'skjermingsrente', 'skjermingBasis', 'capitalGainsTax', 'capitalGainsTaxHigh',
        'capitalGainsTaxThreshold', 'capitalGainsTaxBrackets', 'partialExemption',
        'timeTestThreshold', 'timeTestGraded', 'timeTestPerLot', 'deemedReturn', 'taxRate',
        'exemption', 'exitTax', 'deemedDisposalYears'];
    for (var i = 0; i < paramKeys.length; i++) {
        var k = paramKeys[i];
        if (config[k] !== undefined) params[k] = config[k];
    }

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
        log('ASK: f\u00F6rlust\u00E5r ger 0 i skatt', r.totalTax === 0, 'skatt ' + r.totalTax + ', carry=' + (r.balance < 100000));
        // Testa carry-forward sekventiellt: förlustår (simulateYear) → vinstår med kvittning
        var loss = TAX_REGIMES.LAGER_ANNUAL.simulateYear(100000, 90000, 0, null, { askAnnualTax: 0.17 });
        // carryState: [{ amount: 10000, yearsLeft: 5 }]
        var profit = TAX_REGIMES.LAGER_ANNUAL.simulateYear(90000, 115000, 0, loss.carryState, { askAnnualTax: 0.17 });
        // 25000 − 10000 = 15000 beskattningsbart × 0.17 = 2550
        var noCarry = TAX_REGIMES.LAGER_ANNUAL.simulateYear(90000, 115000, 0, null, { askAnnualTax: 0.17 });
        // 25000 × 0.17 = 4250 (ingen kvittning)
        log('ASK: carry-forward minskar skatten mot utan carry',
            profit.taxPaid === 2550 && profit.taxPaid < noCarry.taxPaid,
            'med carry: ' + profit.taxPaid + ', utan: ' + noCarry.taxPaid);
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
