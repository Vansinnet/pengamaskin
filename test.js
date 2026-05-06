#!/usr/bin/env node
// ============================================================
//  Testrunner for Pengamaskinen -- kors med:  node test.js
//
//  Laddar calculations.js dynamiskt och kor tva testsviter:
//
//  1. Den inbyggda runTests() i calculations.js
//  2. Utokade regressionstest med kanda facit
//
//  Exitkod 0 = alla tester grona.
//  Exitkod 1 = minst ett test misslyckat -- CI/CD bor flagga detta.
// ============================================================

'use strict';

const fs   = require('fs');
const path = require('path');

// -- Ladda calculations.js utan att andra originalfilen --------------------------
// Function-konstruktorn kor koden i en isolerad scope dar alla const/let/var
// blir lokala variabler som vi sedan returnerar explicit.
const calcSrc = fs.readFileSync(
    path.join(__dirname, 'calculations.js'),
    'utf8'
);

let calc;
try {
    const factory = new Function(
        'Intl', 'console', 'Math', 'Number', 'parseFloat', 'isNaN', 'isFinite',
        calcSrc + '\nreturn {\n' +
        '    computeFV, computeGrossValue, computeNetAfterFees,\n' +
        '    computeCapitalGainsTax, simulateISK, simulateGoal,\n' +
        '    runTests, isValidNumber, formatCurrency, formatAmountHint,\n' +
        '    KAPITALVINSTSKATT, ISK_SKATT, ISK_SCHABLON_GOLV, ISK_FRIBELOPP_DEFAULT\n' +
        '};'
    );
    calc = factory(Intl, console, Math, Number, parseFloat, isNaN, isFinite);
} catch (e) {
    console.error('FEL: Kunde inte ladda calculations.js:', e.message);
    process.exit(1);
}

const {
    computeFV, computeGrossValue, computeNetAfterFees,
    computeCapitalGainsTax, simulateISK, simulateGoal, runTests
} = calc;


// -- Hjalpfunktioner -----------------------------------------------------------

let totalPassed = 0;
let totalFailed = 0;

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
//  SVIT 1 -- Inbyggda tester fran calculations.js
// ===========================================================================

section('Svit 1: Inbyggda tester (runTests)');
var builtIn = runTests();
totalPassed += builtIn.passed;
totalFailed += builtIn.failed;


// ===========================================================================
//  SVIT 2 -- Regressionstest med kanda facit
//  Alla forvantade varden ar verifierade mot den befintliga implementationen
//  och validerade matematiskt.
// ===========================================================================

section('Svit 2: Regressionstest med kanda facit');

// -- computeFV ----------------------------------------------------------------

{
    // Enbart startkapital: 50 000 x (1 + 0.07/12)^60 = 70 881.26
    // (manadskapitalisering; nagot lagre an enkel arsranta)
    var fv = computeFV(50000, 0, 0.07 / 12, 60);
    assert(
        'computeFV: 50 000 kr @ 7%/ar i 5 ar ~= 70 881 kr',
        approx(fv, 70881, 1),
        'fick ' + fv.toFixed(2)
    );
}

{
    // Enbart manadsinsattning: 2000 x ((1+0.05/12)^24 - 1) / (0.05/12) = 50 371.84
    var fv = computeFV(0, 2000, 0.05 / 12, 24);
    assert(
        'computeFV: 2 000 kr/man @ 5%/ar i 2 ar ~= 50 372 kr',
        approx(fv, 50372, 2),
        'fick ' + fv.toFixed(2)
    );
}

{
    // Kombination startkapital + manadsinsattning = 147 291.48
    var fv = computeFV(100000, 500, 0.08 / 12, 36);
    assert(
        'computeFV: 100 000 + 500/man @ 8%/ar i 3 ar ~= 147 291 kr',
        approx(fv, 147291, 2),
        'fick ' + fv.toFixed(2)
    );
}

// -- computeGrossValue --------------------------------------------------------

{
    // Noll ranta: enbart insattningar 0 + 1 000 x 12 x 5 = 60 000
    var v = computeGrossValue(0, 1000, 0, 5);
    assert(
        'computeGrossValue: 0% ranta, 1000/man i 5 ar = 60 000 kr',
        v === 60000,
        'fick ' + v
    );
}

{
    // computeGrossValue ska ge samma resultat som computeFV med samma parametrar
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
    // Noll nettoranteavkastning (avgift = avkastning): enbart insattningar
    var v = computeNetAfterFees(0, 1000, 5, 5, 2);
    assert(
        'computeNetAfterFees: noll nettoranta ger enbart insattningar',
        v === 24000,
        'fick ' + v + ', forvantade 24000'
    );
}

{
    // Negativ nettoranta (avgift > avkastning): vardet ska krympa
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

// -- simulateISK --------------------------------------------------------------

{
    // 400 000 kr statiskt, 1 ar, schablonranta 3.55%
    // kapitalunderlag = 400 000, beskattningsbart = 100 000
    // schablonintakt = 3 550, skatt = 1 065
    var r = simulateISK(400000, 0, 0, 1, 3.55);
    assert(
        'simulateISK: 400 000 kr statiskt @ 3.55% -> skatt ~= 1 065 kr',
        approx(r.totalISKtax, 1065, 1),
        'fick skatt ' + r.totalISKtax.toFixed(2)
    );
}

{
    // Schablonrantegolv: inmatat 0.5% -> hojs till 1.25%
    // 600 000 kr, fribelopp 300 000 -> beskattningsbart 300 000
    // schablonintakt = 3 750, skatt = 1 125
    var r = simulateISK(600000, 0, 0, 1, 0.5);
    assert(
        'simulateISK: schablonrantegolv 1.25% tillampas (0.5% inmatat) -> skatt ~= 1 125 kr',
        approx(r.totalISKtax, 1125, 1),
        'fick skatt ' + r.totalISKtax.toFixed(2)
    );
}

{
    // Exakt pa fribeloppsgranssen: 300 000 kr -> skatt = 0
    var r = simulateISK(300000, 0, 0, 1, 5.0);
    assert(
        'simulateISK: kapital exakt pa fribelopp (300 000 kr) -> skatt = 0',
        approx(r.totalISKtax, 0, 0.01),
        'fick skatt ' + r.totalISKtax.toFixed(2)
    );
}

{
    // Saldo efter 2 ar med avkastning: 100 000 @ 8%/ar i 2 ar ~= 117 289 kr
    var r = simulateISK(100000, 0, 0.08 / 12, 2, 3.55);
    assert(
        'simulateISK: saldo 100 000 @ 8% i 2 ar ~= 117 289 kr',
        approx(r.balance, 117289, 5),
        'fick saldo ' + r.balance.toFixed(2)
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
        'simulateGoal ISK: 10 ar ger positivt netto',
        r.netValue > 0,
        'fick netto ' + r.netValue.toFixed(0)
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
    // Regressionstest AF: 0 kr start, 2000/man, 7%/ar i 5 ar
    // Brutto ~= 143 186, inbetalat = 120 000, vinst ~= 23 186
    // Skatt 30% pa vinst ~= 6 956, netto ~= 136 230
    var r = simulateGoal(0, 2000, 0.07 / 12, 5, false, 0);
    assert(
        'simulateGoal AF: 2 000/man @ 7% i 5 ar -> netto ~= 136 230 kr',
        approx(r.netValue, 136230, 10),
        'fick netto ' + r.netValue.toFixed(0) + ', skatt ' + r.tax.toFixed(0)
    );
}


// ===========================================================================
//  SAMMANFATTNING
// ===========================================================================

console.log('\n' + '='.repeat(50));

var svit2Passed = totalPassed - builtIn.passed;
var svit2Failed = totalFailed - builtIn.failed;

console.log('Svit 1 (inbyggda):   ' + builtIn.passed + ' OK, ' + builtIn.failed + ' fel');
console.log('Svit 2 (regression): ' + svit2Passed + ' OK, ' + svit2Failed + ' fel');
console.log('-'.repeat(50));
console.log('TOTALT: ' + totalPassed + ' OK, ' + totalFailed + ' fel');

if (totalFailed === 0) {
    console.log('\nAlla tester grona! (exit 0)\n');
    process.exit(0);
} else {
    console.log('\n' + totalFailed + ' test(er) misslyckades -- kontrollera berakningarna. (exit 1)\n');
    process.exit(1);
}
