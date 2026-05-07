// ============================================================
//  Globalt tillstånd
// ============================================================
const state = {
    iskOn: false,
    goalIskOn: false,
    advChartData: [],
    goalChartData: [],
    advTimeout: null,
    goalTimeout: null
};

// Cachade DOM-referenser — slås upp en gång, återanvänds
const el = {};
function $(id) { return el[id] || (el[id] = document.getElementById(id)); }

// ============================================================
//  Delade hjälpfunktioner
// ============================================================

function setFeesError(rateVal, feesVal, errorEl, msg) {
    if (feesVal > rateVal) {
        errorEl.textContent = msg || '⚠️ Avgifterna kan inte vara större än avkastningen';
        errorEl.classList.add('show');
    } else {
        errorEl.classList.remove('show');
    }
}

function showCalc() { document.querySelectorAll('.results.show').forEach(function(r) { r.classList.add('calculating'); }); }
function hideCalc() { document.querySelectorAll('.results.calculating').forEach(function(r) { r.classList.remove('calculating'); }); }

function setupIskToggle(checkboxId, rateGroupId, taxGroupId, stateKey, timeoutKey, recalcFn, debounceMs) {
    $(checkboxId).addEventListener('change', function () {
        state[stateKey] = this.checked;
        const iskActive = state[stateKey];
        const taxGroup = $(taxGroupId);
        $(rateGroupId).style.display = iskActive ? 'block' : 'none';
        taxGroup.style.opacity = iskActive ? '0.4' : '1';
        taxGroup.style.pointerEvents = iskActive ? 'none' : 'auto';
        document.querySelectorAll('.results.show').forEach(function(r) { r.classList.add('calculating'); });
        clearTimeout(state[timeoutKey]);
        state[timeoutKey] = setTimeout(recalcFn, debounceMs);
    });
}

function buildYearTimeline(years, startCapital, monthlyAmount, monthlyRateNet, tbodyId) {
    const frag = document.createDocumentFragment();
    const chartData = [];
    let balance = startCapital;
    let invested = startCapital;
    let prevGain = null;

    for (let year = 1; year <= years; year++) {
        for (let m = 0; m < 12; m++) {
            balance = balance * (1 + monthlyRateNet) + monthlyAmount;
            invested += monthlyAmount;
        }
        const gain = balance - invested;
        const delta = prevGain === null ? null : gain - prevGain;
        prevGain = gain;
        chartData.push({ year, invested, gain, total: balance });
        const tr = document.createElement('tr');
        const c1 = document.createElement('td');
        c1.textContent = year;
        tr.appendChild(c1);
        const c2 = document.createElement('td');
        c2.textContent = formatCurrency(invested);
        tr.appendChild(c2);
        const c3 = document.createElement('td');
        c3.textContent = formatCurrency(gain);
        tr.appendChild(c3);
        const c4 = document.createElement('td');
        if (delta === null) {
            c4.textContent = '—';
            c4.style.color = '#8b5a2b';
        } else if (delta >= 0) {
            c4.textContent = '+' + formatCurrency(delta);
            c4.style.color = '#2d5016';
            c4.style.fontWeight = '600';
        } else {
            c4.textContent = formatCurrency(delta);
            c4.style.color = '#8b0000';
            c4.style.fontWeight = '600';
        }
        tr.appendChild(c4);
        const c5 = document.createElement('td');
        const strong = document.createElement('strong');
        strong.textContent = formatCurrency(balance);
        c5.appendChild(strong);
        tr.appendChild(c5);
        frag.appendChild(tr);
    }
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    tbody.appendChild(frag);
    return chartData;
}

function renderBreakdown(chartElId, legendElId, base, invested, netValue, fees, taxAmt, isk, labels) {
    const chartEl = document.getElementById(chartElId);
    const legendEl = document.getElementById(legendElId);
    while (chartEl.firstChild) chartEl.removeChild(chartEl.firstChild);
    while (legendEl.firstChild) legendEl.removeChild(legendEl.firstChild);
    if (base <= 0) {
        const msg = document.createElement('div');
        msg.style.cssText = 'padding:8px;font-size:12px;color:#8b5a2b;';
        msg.textContent = 'Ange avkastning och/eller sparande för att se fördelning.';
        chartEl.appendChild(msg);
        return;
    }
    const iPct = Math.min((invested / base) * 100, 100);
    const gPct = Math.max(((netValue - invested) / base) * 100, 0);
    const fPct = Math.max((fees / base) * 100, 0);
    const tPct = Math.max(0, (taxAmt / base) * 100);
    [[iPct,'chart-invested'],[gPct,'chart-interest'],[fPct,'chart-fees'],[tPct,'chart-taxes']].forEach(function(s) {
        const seg = document.createElement('div');
        seg.className = 'chart-segment ' + s[1];
        seg.style.width = s[0] + '%';
        if (s[0] > 5) seg.textContent = Math.round(s[0]) + '%';
        chartEl.appendChild(seg);
    });
    [[labels.invested,'chart-invested'],[labels.gain,'chart-interest'],['Avgifter','chart-fees'],[isk?'ISK-skatt':'Skatt','chart-taxes']].forEach(function(r) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        const c = document.createElement('div');
        c.className = 'legend-color ' + r[1];
        item.appendChild(c);
        const span = document.createElement('span');
        span.textContent = r[0];
        item.appendChild(span);
        legendEl.appendChild(item);
    });
}

// ============================================================
//  Validering av input
// ============================================================
function validateInput(id, min = 0, max = 100000000, isRequired = true) {
    const element = document.getElementById(id);
    if (!element) return true;

    const value = parseFloat(element.value);
    const errorElement = document.getElementById(id + 'Error');

    if (!errorElement) return true;

    if (isNaN(value) || element.value === '') {
        if (isRequired) {
            errorElement.textContent = '⚠️ Obligatoriskt fält';
            errorElement.classList.add('show');
            return false;
        } else {
            errorElement.classList.remove('show');
            return true;
        }
    }

    if (value < min) {
        errorElement.textContent = `⚠️ Minimumvärde: ${min}`;
        errorElement.classList.add('show');
        return false;
    }

    if (value > max) {
        errorElement.textContent = `⚠️ Maxvärde: ${max.toLocaleString('sv-SE')}`;
        errorElement.classList.add('show');
        return false;
    }

    errorElement.classList.remove('show');
    errorElement.textContent = '';
    return true;
}

// ============================================================
//  Slider-lyssnare — Pengamaskin
// ============================================================
document.getElementById('fees').addEventListener('input', function() {
    const val = parseFloat(this.value);
    if (val < 0) this.value = 0;
    if (val > 5) this.value = 5;
    setFeesError(parseFloat($('advRate').value) || 0, val, $('feesError'));
    $('feesValue').textContent = parseFloat(this.value).toFixed(2) + '%';
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

// (Skatteslidern borttagen — kapitalvinstskatten är hårdkodad till 30 % enligt lag.)

document.getElementById('advInflation').addEventListener('input', function() {
    const val = parseFloat(this.value);
    if (val < 0) this.value = 0;
    if (val > 10) this.value = 10;
    document.getElementById('advInflationValue').textContent = parseFloat(this.value).toFixed(1) + '%';
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

setupIskToggle('iskEnabled', 'iskRateGroup', 'taxRateGroup', 'iskOn', 'advTimeout', calculateAdvanced, 150);

document.getElementById('iskRate').addEventListener('input', function() {
    const val = parseFloat(this.value);
    document.getElementById('iskRateValue').textContent = val.toFixed(2) + '%';
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

// ============================================================
//  Tab-hantering — använder explicit btn-referens (inget globalt event)
// ============================================================
function toggleRpr(btn) {
    const body = document.getElementById('rprBody');
    const isOpen = body.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
}

function switchTab(tabName, btnElement) {
            if (document.getElementById(tabName).classList.contains('active')) return;

            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });

            document.getElementById(tabName).classList.add('active');
            if (btnElement) { btnElement.classList.add('active'); btnElement.setAttribute('aria-selected', 'true'); }

            // Rita om diagram när fliken blir synlig (canvas hade bredd 0 när dold)
            requestAnimationFrame(() => {
                if (tabName === 'goal' && state.goalChartData.length > 0)
                    drawTimelineChart(state.goalChartData, 'goalTimelineChart', 'goalChartTooltip');
                if (tabName === 'advanced' && state.advChartData.length > 0)
                    drawTimelineChart(state.advChartData);
            });
        }

document.getElementById('rprToggle').addEventListener('click', function() { toggleRpr(this); });
document.getElementById('tabBtnAdvanced').addEventListener('click', function() { switchTab('advanced', this); });
document.getElementById('tabBtnGoal').addEventListener('click', function() { switchTab('goal', this); });

// ============================================================
//  Formatering
// ============================================================

function bindAmountHint(inputId, hintId) {
    const input = document.getElementById(inputId);
    const hint  = document.getElementById(hintId);
    if (!input || !hint) return;
    input.addEventListener('input', () => {
        hint.textContent = formatAmountHint(input.value);
    });
}

bindAmountHint('advInitialCapital', 'advInitialCapitalHint');
bindAmountHint('advMonthlyAmount',  'advMonthlyAmountHint');
bindAmountHint('goalTarget',        'goalTargetHint');
bindAmountHint('goalInitial',       'goalInitialHint');

// ============================================================
//  PENGAMASKIN — beräkning
// ============================================================
function calculateAdvanced() {
            hideCalc();
            if (!validateInput('advInitialCapital', 0, 100000000, false) ||
        !validateInput('advMonthlyAmount', 0, 1000000, false) ||
        !validateInput('advRate', 0, 100, true) ||
        !validateInput('advYears', 1, 100, true)) {
        ['advSummary','advTimeline'].forEach(id=>document.getElementById(id).classList.remove('show'));
        return;
    }

    const initialCapital  = parseFloat(document.getElementById('advInitialCapital').value) || 0;
    const monthlyAmount   = parseFloat(document.getElementById('advMonthlyAmount').value)  || 0;
    const annualRate      = parseFloat(document.getElementById('advRate').value)            || 0;
    const years           = parseFloat(document.getElementById('advYears').value)           || 0;
    const fees            = Math.max(0, Math.min(5, parseFloat(document.getElementById('fees').value) || 0));
    const inflation       = Math.max(0, Math.min(10, parseFloat(document.getElementById('advInflation').value) || 0));
    const iskSchablonRate = Math.max(0, Math.min(5, parseFloat(document.getElementById('iskRate').value) || 0));

    setFeesError(annualRate, fees, $('feesError'), 'ℹ️ Avgiften är högre än avkastningen — kontot tappar i värde över tid.');

    const monthlyRateGross = annualRate / 100 / 12;
    const monthlyRateNet   = (annualRate - fees) / 100 / 12;
    const months = years * 12;

    const grossValue = computeGrossValue(initialCapital, monthlyAmount, annualRate, years);
    const netAfterFees = computeNetAfterFees(initialCapital, monthlyAmount, annualRate, fees, years);

    const totalInvested = initialCapital + monthlyAmount * months;
    const totalFees     = grossValue - netAfterFees;

    let netValue, taxesOwed, iskAccountValue = null;

    if (state.iskOn) {
        const iskResult = simulateISK(initialCapital, monthlyAmount, monthlyRateNet, years, iskSchablonRate);
        iskAccountValue = iskResult.balance;
        netValue  = iskResult.balance - iskResult.totalISKtax;
        taxesOwed = iskResult.totalISKtax;
    } else {
        taxesOwed  = computeCapitalGainsTax(netAfterFees - totalInvested);
        netValue   = netAfterFees - taxesOwed;
    }

    if (!isValidNumber(grossValue) || !isValidNumber(netValue) || !isValidNumber(taxesOwed)) {
        ['advSummary','advTimeline'].forEach(id=>document.getElementById(id).classList.remove('show'));
        return;
    }

    const inflationFactor = Math.pow(1 + inflation / 100, years);
    const realValue = netValue / inflationFactor;
    if (!isValidNumber(realValue)) {
        ['advSummary','advTimeline'].forEach(id=>document.getElementById(id).classList.remove('show'));
        return;
    }

    // Etiketter
    document.getElementById('advTaxesLabel').textContent = state.iskOn
        ? 'ISK-skatt (betalas separat):'
        : 'Skatt på kapitalvinst:';

    document.getElementById('advTotalInvested').textContent = formatCurrency(totalInvested);
    document.getElementById('advGrossLabel').textContent    = state.iskOn ? 'ISK-kontots värde:' : 'Bruttovärde (ingen skatt/avgift):';
    document.getElementById('advGrossValue').textContent    = state.iskOn ? formatCurrency(iskAccountValue) : formatCurrency(grossValue);
    document.getElementById('advTotalFees').textContent     = formatCurrency(totalFees);
    document.getElementById('advTaxes').textContent         = formatCurrency(taxesOwed);
    document.getElementById('advNetValue').textContent      = formatCurrency(netValue);
    document.getElementById('advRealValue').textContent     = formatCurrency(realValue);

    document.getElementById('advWarning').style.display = netValue > 1e9 ? 'block' : 'none';

    // Fördelningsdiagram
    renderBreakdown('advChart', 'advLegend', grossValue, totalInvested, netValue, totalFees, taxesOwed, state.iskOn,
        { invested: 'Investerat', gain: 'Nettovinst' });

    ['advSummary','advTimeline'].forEach(id=>document.getElementById(id).classList.add('show'));

    // Tidslinje
    const chartData = buildYearTimeline(years, initialCapital, monthlyAmount, monthlyRateNet, 'timelineBody');
    state.advChartData = chartData;
    requestAnimationFrame(() => drawTimelineChart(chartData));
}

// ============================================================
//  TIDSLINJE — diagram (delas av Pengamaskin & Sparmål)
// ============================================================
function drawTimelineChart(dataPoints, canvasId = 'timelineChart', tooltipId = 'chartTooltip') {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !dataPoints || dataPoints.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 260 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = 260;
    const PAD = { top: 20, right: 20, bottom: 50, left: 70 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const maxVal = Math.max(...dataPoints.map(d => d.total)) * 1.05;
    const minVal = 0;
    const range = maxVal - minVal || 1;

    function xPos(i) { return dataPoints.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i / (dataPoints.length - 1)) * plotW; }
    function yPos(v) { return PAD.top + plotH - ((v - minVal) / range) * plotH; }

    ctx.clearRect(0, 0, W, H);

    // Rutnät
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(212,166,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
        const v = minVal + (i / gridLines) * maxVal;
        const y = yPos(v);
        ctx.beginPath();
        ctx.moveTo(PAD.left, y);
        ctx.lineTo(PAD.left + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#8b5a2b';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        const label = v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' :
                      v >= 1000    ? (v / 1000).toFixed(0) + 'k' :
                      v.toFixed(0);
        ctx.fillText(label + ' kr', PAD.left - 6, y + 4);
    }

    // Område — investerat
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(dataPoints[0].invested));
    dataPoints.forEach((d, i) => ctx.lineTo(xPos(i), yPos(d.invested)));
    ctx.lineTo(xPos(dataPoints.length - 1), yPos(0));
    ctx.lineTo(xPos(0), yPos(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(139,90,43,0.35)';
    ctx.fill();

    // Linje — investerat
    ctx.beginPath();
    dataPoints.forEach((d, i) => i === 0 ? ctx.moveTo(xPos(i), yPos(d.invested)) : ctx.lineTo(xPos(i), yPos(d.invested)));
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Område — avkastning ovanpå investerat
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(dataPoints[0].invested));
    dataPoints.forEach((d, i) => ctx.lineTo(xPos(i), yPos(d.total)));
    ctx.lineTo(xPos(dataPoints.length - 1), yPos(dataPoints[dataPoints.length - 1].invested));
    for (let i = dataPoints.length - 1; i >= 0; i--) ctx.lineTo(xPos(i), yPos(dataPoints[i].invested));
    ctx.closePath();
    ctx.fillStyle = 'rgba(212,166,0,0.4)';
    ctx.fill();

    // Linje — totalt värde
    ctx.beginPath();
    dataPoints.forEach((d, i) => i === 0 ? ctx.moveTo(xPos(i), yPos(d.total)) : ctx.lineTo(xPos(i), yPos(d.total)));
    ctx.strokeStyle = '#d4a600';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X-axel
    ctx.fillStyle = '#6b4423';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    const step = Math.ceil(dataPoints.length / 10);
    dataPoints.forEach((d, i) => {
        if (i === 0 || (i + 1) % step === 0 || i === dataPoints.length - 1) {
            const x = xPos(i);
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(107,68,35,0.4)';
            ctx.lineWidth = 1;
            ctx.moveTo(x, PAD.top + plotH);
            ctx.lineTo(x, PAD.top + plotH + 5);
            ctx.stroke();
            ctx.fillStyle = '#6b4423';
            ctx.fillText('År ' + d.year, x, H - PAD.bottom + 18);
        }
    });

    // Axlar
    ctx.beginPath();
    ctx.strokeStyle = '#d4a600';
    ctx.lineWidth = 2;
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
    ctx.stroke();

    // Teckenförklaring
    const legY = H - 12;
    const legItems = [
        { color: 'rgba(139,90,43,0.7)', label: 'Investerat' },
        { color: 'rgba(212,166,0,0.8)', label: 'Avkastning' }
    ];
    let legX = PAD.left;
    legItems.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(legX, legY - 8, 14, 10);
        ctx.fillStyle = '#6b4423';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legX + 18, legY);
        legX += 100;
    });

    // Tooltip (mus + tangentbord)
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Diagram över årlig tillväxt. Använd piltangenter för att bläddra mellan åren.');
    canvas.style.outline = 'none';
    var focusIdx = dataPoints.length - 1;

    function showTooltip(idx, clientX, clientY) {
        if (idx < 0 || idx >= dataPoints.length) return;
        var d = dataPoints[idx];
        var tooltip = document.getElementById(tooltipId);
        tooltip.textContent = '';
        ['År ' + d.year, 'Totalt: ' + formatCurrency(d.total), 'Investerat: ' + formatCurrency(d.invested), 'Avkastning: ' + formatCurrency(d.gain)].forEach(function (t, i) {
            if (i > 0) tooltip.appendChild(document.createElement('br'));
            tooltip.appendChild(document.createTextNode(t));
        });
        tooltip.style.display = 'block';
        var bRect = canvas.getBoundingClientRect();
        var tipX = Math.min(clientX !== undefined ? clientX + 12 : xPos(idx) + 10, bRect.width - 160);
        tooltip.style.left = tipX + 'px';
        tooltip.style.top = (clientY !== undefined ? clientY - bRect.top - 20 : yPos(dataPoints[idx].total) - 10) + 'px';
        if (clientX === undefined) {
            tooltip.style.top = (yPos(dataPoints[idx].total) - 50) + 'px';
        }
    }

    function hideTooltip() { document.getElementById(tooltipId).style.display = 'none'; }

    canvas.onmousemove = function (e) {
        var bRect = canvas.getBoundingClientRect();
        var mouseX = e.clientX - bRect.left;
        focusIdx = Math.round((mouseX - PAD.left) / plotW * (dataPoints.length - 1));
        if (focusIdx >= 0 && focusIdx < dataPoints.length)
            showTooltip(focusIdx, mouseX, e.clientY);
    };
    canvas.onmouseleave = hideTooltip;

    canvas.addEventListener('focus', function () {
        canvas.style.boxShadow = '0 0 0 2px #d4a600';
        showTooltip(focusIdx);
    });
    canvas.addEventListener('blur', function () {
        canvas.style.boxShadow = 'none';
        hideTooltip();
    });
    canvas.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { focusIdx = Math.min(focusIdx + 1, dataPoints.length - 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft')  { focusIdx = Math.max(focusIdx - 1, 0); e.preventDefault(); }
        else if (e.key === 'Home')       { focusIdx = 0; e.preventDefault(); }
        else if (e.key === 'End')        { focusIdx = dataPoints.length - 1; e.preventDefault(); }
        else return;
        showTooltip(focusIdx);
    });
}

// ============================================================
//  App-tester (körs i webbläsaren — kräver DOM)
// ============================================================
function runAppTests() {
    var ok = 0, fail = 0;
    function t(name, cond, detail) { if (cond) { ok++; console.log('  OK ' + name); } else { fail++; console.error('  FEL ' + name + (detail ? ' — ' + detail : '')); } }

    // buildYearTimeline — skapa temporär tbody, verifiera struktur
    (function() {
        var tmpTbody = document.createElement('tbody');
        tmpTbody.id = '_appTestTbody';
        document.body.appendChild(tmpTbody);
        var cd = buildYearTimeline(3, 10000, 500, 0.07 / 12, '_appTestTbody');
        t('buildYearTimeline: returnerar chartData med 3 år', cd.length === 3, 'fick ' + cd.length);
        t('buildYearTimeline: chartData[0] har year, invested, gain, total',
            cd[0].year === 1 && cd[0].invested > 0 && cd[0].gain >= 0 && cd[0].total > 0);
        t('buildYearTimeline: chartData sista år > första år', cd[2].total > cd[0].total);
        var rows = tmpTbody.querySelectorAll('tr');
        t('buildYearTimeline: 3 rader i tbody', rows.length === 3);
        t('buildYearTimeline: första rad har 5 celler', rows[0].querySelectorAll('td').length === 5);
        t('buildYearTimeline: sista cell innehåller <strong>', rows[0].querySelectorAll('td')[4].querySelector('strong') !== null);
        document.body.removeChild(tmpTbody);
    })();

    // renderBreakdown — skapa temporär chart/legend, verifiera DOM
    (function() {
        var chartDiv = document.createElement('div');
        chartDiv.id = '_appTestChart';
        var legendDiv = document.createElement('div');
        legendDiv.id = '_appTestLegend';
        document.body.appendChild(chartDiv);
        document.body.appendChild(legendDiv);
        renderBreakdown('_appTestChart', '_appTestLegend', 200000, 120000, 170000, 5000, 0, false,
            { invested: 'TestInsatt', gain: 'TestVinst' });

        var segs = chartDiv.querySelectorAll('.chart-segment');
        t('renderBreakdown: 4 chart-segment element', segs.length === 4);
        t('renderBreakdown: första segment är chart-invested', segs[0].classList.contains('chart-invested'));
        t('renderBreakdown: segment har satt width', segs[0].style.width !== '');

        var items = legendDiv.querySelectorAll('.legend-item');
        t('renderBreakdown: 4 legend-item element', items.length === 4);
        t('renderBreakdown: legend visar "TestInsatt"', legendDiv.textContent.includes('TestInsatt'));
        t('renderBreakdown: legend visar "Avgifter"', legendDiv.textContent.includes('Avgifter'));
        t('renderBreakdown: legend visar "Skatt" (ej ISK)', legendDiv.textContent.includes('Skatt') && !legendDiv.textContent.includes('ISK-skatt'));

        document.body.removeChild(chartDiv);
        document.body.removeChild(legendDiv);
    })();

    // renderBreakdown med ISK — verifiera ISK-skatt-etikett
    (function() {
        var cd = document.createElement('div'); cd.id = '_appTC2';
        var ld = document.createElement('div'); ld.id = '_appTL2';
        document.body.appendChild(cd); document.body.appendChild(ld);
        renderBreakdown('_appTC2', '_appTL2', 100000, 90000, 95000, 1000, 0, true, { invested: 'I', gain: 'G' });
        t('renderBreakdown ISK: legend visar "ISK-skatt"', ld.textContent.includes('ISK-skatt'));
        document.body.removeChild(cd); document.body.removeChild(ld);
    })();

    // renderBreakdown med base <= 0 — ska visa fallback-text
    (function() {
        var cd = document.createElement('div'); cd.id = '_appTC3';
        var ld = document.createElement('div'); ld.id = '_appTL3';
        document.body.appendChild(cd); document.body.appendChild(ld);
        renderBreakdown('_appTC3', '_appTL3', 0, 0, 0, 0, 0, false, { invested: 'I', gain: 'G' });
        t('renderBreakdown base=0: fallback-text visas', cd.textContent.includes('Ange avkastning'));
        t('renderBreakdown base=0: legend är tom', ld.children.length === 0);
        document.body.removeChild(cd); document.body.removeChild(ld);
    })();

    console.log('App-tester klara: ' + ok + ' OK, ' + fail + ' fel.');
}

// Initial beräkning
window.addEventListener('load', () => {
    // Synkronisera ISK-flaggorna med aktuella checkbox-states
    state.iskOn     = document.getElementById('iskEnabled').checked;
    state.goalIskOn = document.getElementById('goalIskEnabled').checked;

    calculateAdvanced();
    calculateGoal();

    // Kör testsuiten lokalt (file:// eller localhost) för att
    // upptäcka regressioner i beräkningslogiken.
    if (location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.protocol === 'file:') {
        try { runTests(); } catch (e) { console.error('runTests fel:', e); }
        try { runAppTests(); } catch (e) { console.error('runAppTests fel:', e); }
    }
});

// Auto-beräkna vid ändringar — Pengamaskin
const advInputs = ['advInitialCapital', 'advMonthlyAmount', 'advRate', 'advYears'];
advInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', () => {
            showCalc();
            clearTimeout(state.advTimeout);
            state.advTimeout = setTimeout(calculateAdvanced, 300);

            if (id === 'advRate') {
                setFeesError(parseFloat($('advRate').value) || 0, parseFloat($('fees').value) || 0, $('feesError'));
            }
        });
        element.addEventListener('blur', () => {
            if (id === 'advInitialCapital') validateInput(id, 0, 100000000, false);
            if (id === 'advMonthlyAmount') validateInput(id, 0, 1000000, false);
            if (id === 'advRate') validateInput(id, 0, 100, true);
            if (id === 'advYears') validateInput(id, 1, 100, true);
        });
    }
});

// ============================================================
//  SPARMÅL — slider-lyssnare
// ============================================================
document.getElementById('goalFees').addEventListener('input', function() {
    $('goalFeesValue').textContent = parseFloat(this.value).toFixed(2) + '%';
    setFeesError(parseFloat($('goalRate').value) || 0, parseFloat(this.value), $('goalFeesError'));
            showCalc();
            clearTimeout(state.goalTimeout);
            state.goalTimeout = setTimeout(calculateGoal, 300);
});
// (goalTax-slidern borttagen — kapitalvinstskatten är hårdkodad.)

document.getElementById('goalInflation').addEventListener('input', function() {
    document.getElementById('goalInflationValue').textContent = parseFloat(this.value).toFixed(1) + '%';
            showCalc();
            clearTimeout(state.goalTimeout);
            state.goalTimeout = setTimeout(calculateGoal, 300);
});

// ISK-toggle — Sparmål
setupIskToggle('goalIskEnabled', 'goalIskRateGroup', 'goalTaxGroup', 'goalIskOn', 'goalTimeout', calculateGoal, 150);

document.getElementById('goalIskRate').addEventListener('input', function() {
    document.getElementById('goalIskRateValue').textContent = parseFloat(this.value).toFixed(2) + '%';
            showCalc();
            clearTimeout(state.goalTimeout);
            state.goalTimeout = setTimeout(calculateGoal, 300);
});

['goalTarget','goalInitial','goalYears','goalRate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
        if (id === 'goalRate') {
            setFeesError(parseFloat($('goalRate').value) || 0, parseFloat($('goalFees').value) || 0, $('goalFeesError'));
        }
        clearTimeout(state.goalTimeout);
        state.goalTimeout = setTimeout(calculateGoal, 300);
    });
});
document.getElementById('goalRealTerms').addEventListener('change', () => {
            showCalc();
            clearTimeout(state.goalTimeout);
            state.goalTimeout = setTimeout(calculateGoal, 150);
});

// ============================================================
//  SPARMÅL — beräkning
// ============================================================
function calculateGoal() {
            hideCalc();
            if (!validateInput('goalTarget', 1, 1000000000, true) ||
        !validateInput('goalInitial', 0, 100000000, false) ||
        !validateInput('goalYears',  1, 100, true) ||
        !validateInput('goalRate',   0, 100, true)) {
        document.getElementById('goalSummary').classList.remove('show');
        document.getElementById('goalTimeline').classList.remove('show');
        return;
    }

    const targetRaw  = parseFloat(document.getElementById('goalTarget').value)   || 0;
    const initialCap = parseFloat(document.getElementById('goalInitial').value)  || 0;
    const years      = parseFloat(document.getElementById('goalYears').value)    || 0;
    const annualRate = parseFloat(document.getElementById('goalRate').value)     || 0;
    const fees       = Math.max(0, Math.min(5, parseFloat(document.getElementById('goalFees').value) || 0));
    const inflation  = Math.max(0, Math.min(10, parseFloat(document.getElementById('goalInflation').value) || 0));
    const iskSchRate = Math.max(0, Math.min(5, parseFloat(document.getElementById('goalIskRate').value) || 0));
    const realTerms  = document.getElementById('goalRealTerms').checked;

    setFeesError(annualRate, fees, $('goalFeesError'), 'ℹ️ Avgiften är högre än avkastningen — målet kan vara svårt eller omöjligt att nå.');

    const monthlyRateNet   = (annualRate - fees) / 100 / 12;
    const monthlyRateGross = annualRate / 100 / 12;
    const months = years * 12;

    const inflationFactor = Math.pow(1 + inflation / 100, years);
    const nominalTarget   = realTerms ? targetRaw * inflationFactor : targetRaw;
    const realEquiv       = realTerms ? targetRaw : targetRaw / inflationFactor;

    const netFromZero = simulateGoal(initialCap, 0, monthlyRateNet, years, state.goalIskOn, iskSchRate).netValue;

    const resultsEl     = document.getElementById('goalSummary');
    const timelineEl    = document.getElementById('goalTimeline');
    const noSavingsEl   = document.getElementById('goalNoSavingsNeeded');
    const monthlyEl     = document.getElementById('goalMonthly');
    const monthlyNoteEl = document.getElementById('goalMonthlyNote');

    resultsEl.classList.add('show');
    timelineEl.classList.add('show');

    if (netFromZero >= nominalTarget) {
        noSavingsEl.style.display = 'block';
        document.getElementById('goalRealRow').style.display = 'none';
        monthlyEl.textContent = '0 kr/mån';
        monthlyNoteEl.textContent = 'Ditt startkapital räcker på ' + years + ' år.';

        const grossNoFees = computeFV(initialCap, 0, monthlyRateGross, months);
        const fvWithFeesNoTax = computeFV(initialCap, 0, monthlyRateNet, months);
        const totalFees = Math.max(grossNoFees - fvWithFeesNoTax, 0);

        const finalRes = simulateGoal(initialCap, 0, monthlyRateNet, years, state.goalIskOn, iskSchRate);

        document.getElementById('goalNominalTarget').textContent = formatCurrency(nominalTarget);
        document.getElementById('goalRealEquiv').textContent     = formatCurrency(realEquiv);
        document.getElementById('goalTotalIn').textContent       = formatCurrency(initialCap);
        document.getElementById('goalGain').textContent          = formatCurrency(Math.max(finalRes.netValue - initialCap, 0));
        document.getElementById('goalFeesResult').textContent    = formatCurrency(totalFees);
        document.getElementById('goalTaxResultLabel').textContent = state.goalIskOn ? 'ISK-skatt (betalas separat):' : 'Skatt (kapitalvinst):';
        document.getElementById('goalTaxResult').textContent     = formatCurrency(finalRes.tax);
        return;
    }
    noSavingsEl.style.display = 'none';

    let lo = 0, hi = nominalTarget;
    for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (simulateGoal(initialCap, mid, monthlyRateNet, years, state.goalIskOn, iskSchRate).netValue < nominalTarget) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    const requiredMonthly = (lo + hi) / 2;

    const totalIn  = initialCap + requiredMonthly * months;
    const finalRes = simulateGoal(initialCap, requiredMonthly, monthlyRateNet, years, state.goalIskOn, iskSchRate);
    const finalNet = finalRes.netValue;
    const actualTax = finalRes.tax;

    const grossNoFees = computeFV(initialCap, requiredMonthly, monthlyRateGross, months);
    const fvWithFeesNoTax = computeFV(initialCap, requiredMonthly, monthlyRateNet, months);
    const totalFees = Math.max(grossNoFees - fvWithFeesNoTax, 0);

    monthlyEl.textContent = formatCurrency(Math.ceil(requiredMonthly)) + ' /mån';
    monthlyNoteEl.textContent = 'Under ' + years + ' år · ' + (state.goalIskOn ? 'ISK' : 'vanligt konto');

    document.getElementById('goalNominalTarget').textContent = formatCurrency(nominalTarget);
    document.getElementById('goalRealEquiv').textContent     = formatCurrency(realEquiv);
    document.getElementById('goalRealRow').style.display     = 'flex';
    document.getElementById('goalTotalIn').textContent       = formatCurrency(totalIn);
    document.getElementById('goalGain').textContent          = formatCurrency(Math.max(finalNet - totalIn, 0));
    document.getElementById('goalFeesResult').textContent    = formatCurrency(totalFees);
    document.getElementById('goalTaxResultLabel').textContent = state.goalIskOn ? 'ISK-skatt (betalas separat):' : 'Skatt (kapitalvinst):';
    document.getElementById('goalTaxResult').textContent     = formatCurrency(actualTax);

    // Fördelningsdiagram
    renderBreakdown('goalChart', 'goalLegend', nominalTarget, totalIn, finalNet, totalFees, actualTax, state.goalIskOn,
        { invested: 'Insatt kapital', gain: 'Avkastning' });

    // Tidslinje
    const goalChartData = buildYearTimeline(years, initialCap, requiredMonthly, monthlyRateNet, 'goalTableBody');
    state.goalChartData = goalChartData;
    requestAnimationFrame(() => drawTimelineChart(goalChartData, 'goalTimelineChart', 'goalChartTooltip'));
}
