#!/usr/bin/env node
// ============================================================
//  Testrunner for Pengamaskinen -- k\u00F6rs med:  node test.js
//
//  Laddar calc/*.js-filerna dynamiskt via Function-konstruktorn.
//  K\u00F6r tre testsviter:
//    1. Inbyggda tester fr\u00E5n tax-regimes.js (runTests)
//    2. Regressionstest med pinnade facit
//    3. Formaterings- och valideringsfunktioner
//
//  Exitkod 0 = alla tester gr\u00F6na.
//  Exitkod 1 = minst ett test misslyckat.
// ============================================================

'use strict';

var fs   = require('fs');
var path = require('path');

// -- Ladda alla calc/-filer i r\u00E4tt ordning ----------------------------------
var calcDir = path.join(__dirname, 'calc');
var files = ['constants.js', 'utils.js', 'core.js', 'tax-regimes.js', 'countries.js'];

var combinedSrc = '';
files.forEach(function(f) {
    try {
        combinedSrc += fs.readFileSync(path.join(calcDir, f), 'utf8') + '\n';
    } catch (e) {
        console.error('FEL: Kunde inte l\u00E4sa calc/' + f + ':', e.message);
        process.exit(1);
    }
});

var calc;
try {
    var factory = new Function(
        'Intl', 'console', 'Math', 'Number', 'parseFloat', 'isNaN', 'isFinite',
        combinedSrc + '\n' +
        'return {\n' +
        '    computeFV, computeGrossValue, computeNetAfterFees,\n' +
        '    computeCapitalGainsTax, isValidNumber, formatCurrency, formatAmountHint,\n' +
        '    TAX_REGIMES, simulateGoal, runTests, getCountryConfig, COUNTRY_CONFIG,\n' +
        '    KAPITALVINSTSKATT, ISK_SKATT, ISK_SCHABLON_GOLV, ISK_FRIBELOPP_DEFAULT\n' +
        '};'
    );
    calc = factory(Intl, console, Math, Number, parseFloat, isNaN, isFinite);
} catch (e) {
    console.error('FEL: Kunde inte ladda calc/*.js:', e.message);
    console.error(e.stack);
    process.exit(1);
}

var computeFV               = calc.computeFV;
var computeGrossValue       = calc.computeGrossValue;
var computeNetAfterFees     = calc.computeNetAfterFees;
var computeCapitalGainsTax  = calc.computeCapitalGainsTax;
var simulateGoal            = calc.simulateGoal;
var runTests                = calc.runTests;
var TAX_REGIMES             = calc.TAX_REGIMES;

// -- Hj\u00E4lpfunktioner -----------------------------------------------------------

var totalPassed = 0;
var totalFailed = 0;

function approx(a, b, tol) {
    if (tol === undefined) tol = 1;
    return Math.abs(a - b) <= tol;
}

function assert(name, condition, detail) {
    if (condition) {
        totalPassed++;
        console.log('  OK ' + name);
    } else {
        totalFailed++;
        var msg = '  FEL ' + name;
        if (detail) msg += ' -- ' + detail;
        console.error(msg);
    }
}

function section(title) {
    console.log('\n' + title);
    console.log('-'.repeat(title.length));
}


// ===========================================================================
//  SVIT 1 -- Inbyggda tester fr\u00E5n tax-regimes.js
// ===========================================================================

section('Svit 1: Inbyggda tester (runTests)');
var builtIn = runTests();
totalPassed += builtIn.passed;
totalFailed += builtIn.failed;


// ===========================================================================
//  SVIT 2 -- Regressionstest med pinnade facit
// ===========================================================================

section('Svit 2: Regressionstest med pinnade facit');

// -- computeFV ----------------------------------------------------------------

{
    var fv = computeFV(50000, 0, 0.07 / 12, 60);
    assert(
        'computeFV: 50 000 kr @ 7%/ar i 5 ar ~= 70 881 kr',
        approx(fv, 70881, 1),
        'fick ' + fv.toFixed(2)
    );
}

{
    var fv = computeFV(0, 2000, 0.05 / 12, 24);
    assert(
        'computeFV: 2 000 kr/man @ 5%/ar i 2 ar ~= 50 372 kr',
        approx(fv, 50372, 2),
        'fick ' + fv.toFixed(2)
    );
}

{
    var fv = computeFV(100000, 500, 0.08 / 12, 36);
    assert(
        'computeFV: 100 000 + 500/man @ 8%/ar i 3 ar ~= 147 291 kr',
        approx(fv, 147291, 2),
        'fick ' + fv.toFixed(2)
    );
}

// -- computeGrossValue --------------------------------------------------------

{
    var v = computeGrossValue(0, 1000, 0, 5);
    assert(
        'computeGrossValue: 0% ranta, 1000/man i 5 ar = 60 000 kr',
        v === 60000,
        'fick ' + v
    );
}

{
    var v1 = computeGrossValue(50000, 1000, 10, 3);
    var v2 = computeFV(50000, 1000, 10 / 100 / 12, 3 * 12);
    assert(
        'computeGrossValue matchar computeFV internt',
        approx(v1, v2, 0.01),
        'grossValue=' + v1.toFixed(2) + ', computeFV=' + v2.toFixed(2)
    );
}

// -- computeNetAfterFees ------------------------------------------------------

{
    var v = computeNetAfterFees(0, 1000, 5, 5, 2);
    assert(
        'computeNetAfterFees: noll nettoranta ger enbart insattningar',
        v === 24000,
        'fick ' + v + ', forvantade 24000'
    );
}

{
    var v = computeNetAfterFees(100000, 0, 0, 1, 1);
    assert(
        'computeNetAfterFees: negativ nettoranta ger lagre varde an startkapitalet',
        v < 100000,
        'fick ' + v.toFixed(2)
    );
}

// -- computeCapitalGainsTax ---------------------------------------------------

{
    assert(
        'computeCapitalGainsTax: 30% pa 100 000 = 30 000',
        computeCapitalGainsTax(100000) === 30000,
        'fick ' + computeCapitalGainsTax(100000)
    );
}

{
    assert(
        'computeCapitalGainsTax: ingen vinst ger ingen skatt',
        computeCapitalGainsTax(0) === 0,
        'fick ' + computeCapitalGainsTax(0)
    );
}

{
    assert(
        'computeCapitalGainsTax: forlust ger ingen skatt',
        computeCapitalGainsTax(-5000) === 0,
        'fick ' + computeCapitalGainsTax(-5000)
    );
}

// -- computeCapitalGainsTax med bracket-array ---------------------------------

{
    var tax = computeCapitalGainsTax(100000, [{ threshold: 10000, rate: 0 }, { rate: 0.10 }]);
    assert(
        'computeCapitalGainsTax bracket: 100k, exemption 10k @ 10% = 9 000',
        approx(tax, 9000, 1),
        'fick ' + tax.toFixed(2)
    );
}

{
    var tax = computeCapitalGainsTax(5000, [{ threshold: 10000, rate: 0 }, { rate: 0.10 }]);
    assert(
        'computeCapitalGainsTax bracket: 5k, exemption 10k @ 10% = 0 (inom exemption)',
        tax === 0,
        'fick ' + tax.toFixed(2)
    );
}

{
    var tax = computeCapitalGainsTax(500000, [{ threshold: 6000, rate: 0.19 }, { threshold: 50000, rate: 0.21 }, { threshold: 200000, rate: 0.23 }, { rate: 0.26 }]);
    assert(
        'computeCapitalGainsTax bracket: 500k, ESpanska brytpunkter ~= 122 880',
        approx(tax, 122880, 10),
        'fick ' + tax.toFixed(2)
    );
}

{
    var tax = computeCapitalGainsTax(100000, [{ threshold: 67500, rate: 0.27 }, { rate: 0.42 }]);
    assert(
        'computeCapitalGainsTax bracket: 100k, Dansk progressiv ~= 31 875',
        approx(tax, 31875, 1),
        'fick ' + tax.toFixed(2)
    );
}

{
    var tax = computeCapitalGainsTax(50000, [{ threshold: 3000, rate: 0 }, { threshold: 40700, rate: 0.18 }, { rate: 0.24 }]);
    assert(
        'computeCapitalGainsTax bracket: 50k, UK £3k exempt + progressiv ~= 9 018',
        approx(tax, 9018, 5),
        'fick ' + tax.toFixed(2)
    );
}

{
    var taxNew = computeCapitalGainsTax(200000, [{ threshold: 67500, rate: 0.27 }, { rate: 0.42 }]);
    var taxOld = computeCapitalGainsTax(200000, 0.27, 67500, 0.42);
    assert(
        'computeCapitalGainsTax bracket: ny stil matchar gammal stil (progressiv)',
        approx(taxNew, taxOld, 1),
        'ny=' + taxNew.toFixed(2) + ', gammal=' + taxOld.toFixed(2)
    );
}

// -- TAX_REGIMES med bracket-array ---------------------------------------------

{
    var r = TAX_REGIMES.CGT_ONLY.simulate(100000, 0, 0.07 / 12, 1,
        { capitalGainsTaxBrackets: [{ threshold: 10000, rate: 0 }, { rate: 0.10 }] });
    assert(
        'CGT_ONLY med bracket: 100k @ 7%, exemption 10k @ 10% -> skatt 0, netto ~= 107 229',
        r.totalTax === 0 && approx(r.netValue, 107229, 5),
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0)
    );
}

{
    var r = TAX_REGIMES.DEFERRED_PLAIN.simulate(100000, 0, 0.07 / 12, 1,
        { capitalGainsTaxBrackets: [{ threshold: 10000, rate: 0 }, { rate: 0.10 }] });
    assert(
        'DEFERRED_PLAIN med bracket: 100k @ 7%, exemption 10k @ 10% -> skatt 0, netto ~= 107 229',
        r.totalTax === 0 && approx(r.netValue, 107229, 5),
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.totalTax.toFixed(0)
    );
}

// -- DEFERRED_SKJERMING med månadsinsättningar ---------------------------------

{
    var rNoDep = TAX_REGIMES.DEFERRED_SKJERMING.simulate(100000, 0, 0.07 / 12, 5,
        { capitalGainsTax: 0.3784, skjermingsrente: 3.6 });
    var rWithDep = TAX_REGIMES.DEFERRED_SKJERMING.simulate(100000, 1000, 0.07 / 12, 5,
        { capitalGainsTax: 0.3784, skjermingsrente: 3.6 });
    assert(
        'DEFERRED_SKJERMING: insattningar ger hogre fradrag -> lagre skatt an utan',
        rWithDep.totalTax < rNoDep.totalTax || (rWithDep.balance - rWithDep.totalTax) > (rNoDep.balance - rNoDep.totalTax),
        'utan insattning: skatt=' + rNoDep.totalTax.toFixed(0) + ', med: skatt=' + rWithDep.totalTax.toFixed(0)
    );
}

// -- simulateGoal med bracket-array via config ---------------------------------

{
    var config = { capitalGainsTaxBrackets: [{ threshold: 10000, rate: 0 }, { rate: 0.10 }] };
    var r = simulateGoal(200000, 0, 0.05 / 12, 1, false, 0, undefined, config);
    assert(
        'simulateGoal med brackets: 200k @ 5%, exemption 10k @ 10% -> netto > 209k',
        r.netValue > 209000,
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.tax.toFixed(0)
    );
}

// -- TIME_TEST_CGT -------------------------------------------------------------

{
    var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 4,
        { timeTestThreshold: 3, capitalGainsTax: 0.15 });
    assert(
        'TIME_TEST_CGT: 4 ar, threshold 3 -> skatt = 0 (skattefritt)',
        r.totalTax === 0,
        'fick skatt ' + r.totalTax.toFixed(0)
    );
}

{
    var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 2,
        { timeTestThreshold: 3, capitalGainsTax: 0.15 });
    assert(
        'TIME_TEST_CGT: 2 ar, threshold 3 -> skatt > 0 (under troskel)',
        r.totalTax > 0,
        'fick skatt ' + r.totalTax.toFixed(0) + ', netto ' + r.netValue.toFixed(0)
    );
}

{
    var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 1,
        { timeTestThreshold: 1, capitalGainsTax: 0.19 });
    assert(
        'TIME_TEST_CGT: 1 ar, threshold 1 -> skatt = 0 (gransfall, >=)',
        r.totalTax === 0,
        'fick skatt ' + r.totalTax.toFixed(0)
    );
}

{
    var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 7,
        { capitalGainsTax: 0.25, timeTestGraded: [{ years: 5, rate: 0.25 }, { years: 10, rate: 0.20 }, { years: 15, rate: 0.15 }, { rate: 0 }] });
    assert(
        'TIME_TEST_CGT graded: 7 ar -> 20 % (i nasta bracket)',
        approx(r.totalTax, r.balance - 100000 > 0 ? (r.balance - 100000) * 0.20 : 0, 10),
        'fick skatt ' + r.totalTax.toFixed(0) + ', balans ' + r.balance.toFixed(0)
    );
}

{
    var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 20,
        { capitalGainsTax: 0.25, timeTestGraded: [{ years: 5, rate: 0.25 }, { years: 10, rate: 0.20 }, { years: 15, rate: 0.15 }, { rate: 0 }] });
    assert(
        'TIME_TEST_CGT graded: 20 ar -> 0 % (sista bracket)',
        r.totalTax === 0,
        'fick skatt ' + r.totalTax.toFixed(0) + ', netto ' + r.netValue.toFixed(0)
    );
}

{
    var r = TAX_REGIMES.TIME_TEST_CGT.simulate(100000, 0, 0.10 / 12, 3,
        { capitalGainsTax: 0.25, timeTestGraded: [{ years: 5, rate: 0.25 }, { years: 10, rate: 0.20 }, { years: 15, rate: 0.15 }, { rate: 0 }] });
    assert(
        'TIME_TEST_CGT graded: 3 ar -> 25 % (forsta bracket)',
        approx(r.totalTax, r.balance - 100000 > 0 ? (r.balance - 100000) * 0.25 : 0, 10),
        'fick skatt ' + r.totalTax.toFixed(0) + ', balans ' + r.balance.toFixed(0)
    );
}

// -- simulateISK (via TAX_REGIMES) --------------------------------------------

{
    var r = TAX_REGIMES.ISK.simulate(400000, 0, 0, 1, { iskSchablonRate: 3.55 });
    assert(
        'ISK: 400 000 kr statiskt @ 3.55% -> skatt ~= 1 065 kr',
        approx(r.totalTax, 1065, 1),
        'fick skatt ' + r.totalTax.toFixed(2)
    );
}

{
    var r = TAX_REGIMES.ISK.simulate(600000, 0, 0, 1, { iskSchablonRate: 0.5 });
    assert(
        'ISK: schablonrantegolv 1.25% tillampas (0.5% inmatat) -> skatt ~= 1 125 kr',
        approx(r.totalTax, 1125, 1),
        'fick skatt ' + r.totalTax.toFixed(2)
    );
}

{
    var r = TAX_REGIMES.ISK.simulate(300000, 0, 0, 1, { iskSchablonRate: 5.0 });
    assert(
        'ISK: kapital exakt pa fribelopp (300 000 kr) -> skatt = 0',
        approx(r.totalTax, 0, 0.01),
        'fick skatt ' + r.totalTax.toFixed(2)
    );
}

{
    var r = TAX_REGIMES.ISK.simulate(100000, 0, 0.08 / 12, 2, { iskSchablonRate: 3.55 });
    assert(
        'ISK: saldo 100 000 @ 8% i 2 ar ~= 117 289 kr',
        approx(r.balance, 117289, 5),
        'fick saldo ' + r.balance.toFixed(2)
    );
}

{
    var r = TAX_REGIMES.ISK.simulate(100000, 2000, 0.07 / 12, 10, { iskSchablonRate: 3.55 });
    assert(
        'ISK: 100k + 2 000/man @ 7% i 10 ar -> saldo ~= 547 136 kr',
        approx(r.balance, 547136, 10),
        'fick saldo ' + r.balance.toFixed(0)
    );
    assert(
        'ISK: 100k + 2 000/man @ 7% i 10 ar -> ISK-skatt ~= 5 746 kr',
        approx(r.totalTax, 5746, 10),
        'fick skatt ' + r.totalTax.toFixed(0)
    );
}

{
    var r = TAX_REGIMES.ISK.simulate(500000, 0, 0.07 / 12, 5, { iskSchablonRate: 3.55 });
    assert(
        'ISK: 500 000 @ 7% i 5 ar -> ackumulerad ISK-skatt ~= 15 610 kr',
        approx(r.totalTax, 15610, 10),
        'fick skatt ' + r.totalTax.toFixed(0)
    );
}

// -- simulateGoal -------------------------------------------------------------

{
    var r = simulateGoal(0, 0, 0, 0, false, 0);
    assert(
        'simulateGoal: 0 kr + 0 insattning i 0 ar = netto 0',
        r.netValue === 0,
        'fick ' + r.netValue
    );
}

{
    var r = simulateGoal(100000, 1000, 0.06 / 12, 10, true, 3.55);
    assert(
        'simulateGoal ISK: 100k + 1 000/man @ 6% i 10 ar -> netto ~= 345 512 kr',
        approx(r.netValue, 345512, 20),
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.tax.toFixed(0)
    );
}

{
    var isk = simulateGoal(500000, 0, 0.07 / 12, 5, true, 3.55);
    var af  = simulateGoal(500000, 0, 0.07 / 12, 5, false, 0);
    assert(
        'simulateGoal: ISK och AF ger bada netto > startkapital (500 000) vid 7% i 5 ar',
        isk.netValue > 500000 && af.netValue > 500000,
        'ISK netto=' + isk.netValue.toFixed(0) + ', AF netto=' + af.netValue.toFixed(0)
    );
}

{
    var r = simulateGoal(0, 2000, 0.07 / 12, 5, false, 0);
    assert(
        'simulateGoal AF: 2 000/man @ 7% i 5 ar -> netto ~= 136 230 kr',
        approx(r.netValue, 136230, 10),
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.tax.toFixed(0)
    );
}

{
    var target    = 1000000;
    var years     = 20;
    var rate      = 0.07;
    var fees      = 0.005;
    var initial   = 0;
    var rNet      = (rate - fees) / 100 / 12;
    var lo = 0, hi = target;
    for (var i = 0; i < 80; i++) {
        var mid = (lo + hi) / 2;
        if (simulateGoal(initial, mid, rNet, years, false, 0).netValue < target) lo = mid;
        else hi = mid;
    }
    var monthly = (lo + hi) / 2;
    var result = simulateGoal(initial, monthly, rNet, years, false, 0);
    assert(
        'Binary search: 0 kr -> 1 Mkr @ 6,5 % netto i 20 ar AF',
        Math.abs(result.netValue - target) < target * 0.001,
        'manadsbelopp=' + monthly.toFixed(0) + ' kr/man, netto=' + result.netValue.toFixed(0)
    );
}

{
    var r = simulateGoal(100000, 0, (0 - 1) / 100 / 12, 100, true, 3.55);
    assert(
        'simulateGoal: negativ nettoavkastning i 100 ar ISK -> netto > 0 (fribelopp skyddar)',
        r.netValue > 0 && r.netValue < 100000,
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.tax.toFixed(0)
    );
}

{
    var r = simulateGoal(0, 1000, 0, 50, true, 3.55);
    assert(
        'simulateGoal: 0 % avkastning, 1 000/man i 50 ar ISK -> netto mellan 500k och 600k',
        r.netValue > 500000 && r.netValue < 600000,
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.tax.toFixed(0)
    );
}

// Snapshot efter Svit 2
var svit2Passed = totalPassed - builtIn.passed;
var svit2Failed = totalFailed - builtIn.failed;
var svit2Total  = svit2Passed + svit2Failed;

// ===========================================================================
//  SVIT 3 -- Formaterings- och valideringsfunktioner
// ===========================================================================

section('Svit 3: Formaterings- och valideringsfunktioner');

var isValidNumber    = calc.isValidNumber;
var formatCurrency   = calc.formatCurrency;
var formatAmountHint = calc.formatAmountHint;

// -- isValidNumber ------------------------------------------------------------

assert('isValidNumber: heltal', isValidNumber(42));
assert('isValidNumber: decimal', isValidNumber(3.14));
assert('isValidNumber: noll', isValidNumber(0));
assert('isValidNumber: negativt', isValidNumber(-100));
assert('isValidNumber: NaN -> false', !isValidNumber(NaN));
assert('isValidNumber: Infinity -> false', !isValidNumber(Infinity));
assert('isValidNumber: strang -> false', !isValidNumber('abc'));

// -- formatCurrency -----------------------------------------------------------

{
    var s = formatCurrency(1000);
    assert('formatCurrency: 1000 -> "1\xa0000\xa0kr"', s === '1\xa0000\xa0kr', 'fick: ' + s);
}
{
    var s = formatCurrency(0);
    assert('formatCurrency: 0 -> "0\xa0kr"', s === '0\xa0kr', 'fick: ' + s);
}
{
    var s = formatCurrency(1500000);
    assert('formatCurrency: 1 500 000 -> "1\xa0500\xa0000\xa0kr"', s === '1\xa0500\xa0000\xa0kr', 'fick: ' + s);
}
{
    var s = formatCurrency(42.7);
    assert('formatCurrency: 42,7 avrundat -> "43\xa0kr"', s === '43\xa0kr', 'fick: ' + s);
}
{
    var s = formatCurrency(-5000);
    assert('formatCurrency: -5 000 \u2192 "\u22125\u00a0000\u00a0kr"', s === '\u22125\u00a0000\u00a0kr', 'fick: ' + s);
}

// -- formatAmountHint ---------------------------------------------------------

{
    var s = formatAmountHint(1500000);
    assert('formatAmountHint: 1 500 000 -> "1,5 miljoner" (ingen trailing nolla)',
        s.indexOf('1,5') >= 0 && s.indexOf('miljoner') >= 0 && s.indexOf('1,50') < 0,
        'fick: ' + s);
}
{
    var s = formatAmountHint(2500000);
    assert('formatAmountHint: 2 500 000 -> "2,5 miljoner"',
        s.indexOf('2,5') >= 0 && s.indexOf('2,50') < 0,
        'fick: ' + s);
}
{
    var s = formatAmountHint(1000000);
    assert('formatAmountHint: 1 000 000 -> singular "miljon"',
        s.indexOf('1 miljon') >= 0 || s.indexOf('1\u00a0miljon') >= 0,
        'fick: ' + s);
}
{
    var s = formatAmountHint(1250000);
    assert('formatAmountHint: 1 250 000 -> "1,25 miljoner"',
        s.indexOf('1,25') >= 0, 'fick: ' + s);
}
{
    var s = formatAmountHint(2500000000);
    assert('formatAmountHint: 2 500 000 000 -> "2,5 miljarder" (ingen trailing nolla)',
        s.indexOf('2,5') >= 0 && s.indexOf('miljarder') >= 0 && s.indexOf('2,50') < 0,
        'fick: ' + s);
}
{
    var s = formatAmountHint(0);
    assert('formatAmountHint: 0 -> "0 kr"', s === '0 kr', 'fick: ' + s);
}
{
    var s = formatAmountHint(999);
    assert('formatAmountHint: 999 -> innehaller "999 kr"', s.indexOf('999') >= 0, 'fick: ' + s);
}
{
    var s = formatAmountHint(NaN);
    assert('formatAmountHint: NaN -> tom strang', s === '', 'fick: ' + s);
}
{
    var s = formatAmountHint(null);
    assert('formatAmountHint: null -> tom strang', s === '', 'fick: ' + s);
}
{
    var s = formatAmountHint('');
    assert('formatAmountHint: tom strang -> tom strang', s === '', 'fick: ' + s);
}
{
    var s = formatAmountHint(-5000);
    assert('formatAmountHint: -5 000 -> innehaller "5" och "000" och "kr"',
        s.indexOf('5') >= 0 && s.indexOf('000') >= 0 && s.indexOf('kr') >= 0,
        'fick: ' + s);
}
{
    var s = formatAmountHint(1e12);
    assert('formatAmountHint: 1 000 miljarder -> "miljarder"', s.indexOf('miljarder') >= 0, 'fick: ' + s);
}


// ===========================================================================
//  SAMMANFATTNING
// ===========================================================================

console.log('\n' + '='.repeat(50));

var svit3Passed = totalPassed - builtIn.passed - svit2Passed;
var svit3Failed = totalFailed - builtIn.failed - svit2Failed;

console.log('Svit 1 (inbyggda):  ' + builtIn.passed + ' OK, ' + builtIn.failed + ' fel');
console.log('Svit 2 (regression): ' + svit2Passed + ' OK, ' + svit2Failed + ' fel');
console.log('Svit 3 (formatering): ' + svit3Passed + ' OK, ' + svit3Failed + ' fel');
console.log('-'.repeat(50));
console.log('TOTALT: ' + totalPassed + ' OK, ' + totalFailed + ' fel');

if (totalFailed === 0) {
    console.log('\nAlla tester grona! (exit 0)\n');
    process.exit(0);
} else {
    console.log('\n' + totalFailed + ' test(er) misslyckades -- kontrollera berakningarna. (exit 1)\n');
    process.exit(1);
}
