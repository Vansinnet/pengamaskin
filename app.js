// ============================================================
//  app.js — UI-logik, i18n, state-hantering, DOM-rendering
//
//  Använder calc/*.js för alla beräkningar.
//  All skatteregimslogik finns i TAX_REGIMES (tax-regimes.js).
//  All landskonfiguration finns i COUNTRY_CONFIG (countries.js).
// ============================================================

// ============================================================
//  Globalt tillstånd
// ============================================================
var state = {
    lang: 'en',
    country: 'SE',
    taxAdvOn: false,
    goalTaxAdvOn: false,
    advChartData: [],
    goalChartData: [],
    advTimeout: null,
    goalTimeout: null
};

// Cachade DOM-referenser
var el = {};
function $(id) { return el[id] || (el[id] = document.getElementById(id)); }

// ============================================================
//  i18n — översättningslexikon (Svenska + Engelska)
// ============================================================
var I18N = {
    sv: {
        appName: 'Pengamaskinen',
        subtitle: '"Pengar \u00E4r v\u00E4l anv\u00E4nd tid!" \u2014 Joakim von Anka',
        langLabel: 'Spr\u00E5k',
        countryLabel: 'Land',
        tabsAriaLabel: 'Verktygsflikar',
        skipLink: 'Hoppa till inneh\u00E5llet',
        appTagline: 'Gratis investeringskalkylator',
        tabAdvanced: 'Pengamaskin',
        tabGoal: 'Sparm\u00E5l',
        colParams: '\u2460 Parametrar',
        colResults: '\u2461 Resultat',
        colTimeline: '\u2462 Tidslinje',
        rprToggle: '\uD83D\uDCA1 Vad \u00E4r r\u00E4nta-p\u00E5-r\u00E4nta-effekten?',
        rprTitle: 'Enkelt f\u00F6rklarat \u2014 utan kr\u00E5ngliga ord',
        rprPara1: 'F\u00F6rest\u00E4ll dig att du s\u00E4tter in pengar p\u00E5 ett konto som ger 7\xa0% i avkastning per \u00E5r. Det f\u00F6rsta \u00E5ret tj\u00E4nar du r\u00E4nta p\u00E5 det du satte in. Det andra \u00E5ret tj\u00E4nar du r\u00E4nta p\u00E5 <em>det du satte in + den r\u00E4nta du redan f\u00E5tt</em>. Tredje \u00E5ret tj\u00E4nar du r\u00E4nta p\u00E5 allt det. Och s\u00E5 vidare.',
        rprPara2: 'Det l\u00E5ter som en liten grej \u2014 men det \u00E4r som en sn\u00F6boll som rullar nerf\u00F6r ett berg. I b\u00F6rjan \u00E4r den liten. Mot slutet \u00E4r den enorm.',
        rprExampleTitle: 'Konkret exempel:',
        rprExampleText: 'Du sparar <strong>1\xa0000\xa0kr/m\u00E5nad</strong> i <strong>30\xa0\u00E5r</strong> med <strong>7\xa0% avkastning</strong> per \u00E5r.',
        rprExampleDetail: 'Du har satt in totalt: <strong>360\xa0000\xa0kr</strong><br>Utan avkastning alls: <strong>360\xa0000\xa0kr</strong><br>Med enkel r\u00E4nta (7\xa0% bara p\u00E5 det insatta, varje \u00E5r): <strong>~\xa01\xa0116\xa0000\xa0kr</strong><br>Med r\u00E4nta-p\u00E5-r\u00E4nta (7\xa0% p\u00E5 allt som v\u00E4xer): <strong>~\xa01\xa0220\xa0000\xa0kr</strong>',
        rprBarInsatt: 'Vad du satt in (1 000 kr/m\u00E5n \u00D7 30 \u00E5r)',
        rprBarVanlig: 'Med vanlig r\u00E4nta efter 30 \u00E5r (bara p\u00E5 insatt kapital)',
        rprBarRpr: 'Med r\u00E4nta-p\u00E5-r\u00E4nta efter 30 \u00E5r \u2728',
        rprBarsNote: 'Exempel i SEK:',
        rprTakeaway: '\uD83C\uDF31 <strong>Vad det inneb\u00E4r f\u00F6r dig:</strong> Ju tidigare du b\u00F6rjar, desto kraftfullare blir effekten. Tio extra \u00E5r kan f\u00F6rdubbla slutsumman \u2014 inte f\u00F6r att du sparar dubbelt s\u00E5 mycket, utan f\u00F6r att pengarna hinner v\u00E4xa p\u00E5 sin egen tillv\u00E4xt. Tid \u00E4r din viktigaste tillg\u00E5ng.',
        labelInitialCapital: 'Startkapital',
        tipInitialCapital: 'Pengar du redan har sparat och vill b\u00F6rja med. Har du 0 kr? Skriv 0. Har du ett buffertspar p\u00E5 50 000 kr du vill r\u00E4kna p\u00E5? Skriv 50000.',
        labelMonthlyAmount: 'M\u00E5nadligt sparande',
        tipMonthlyAmount: 'Hur mycket du s\u00E4tter in varje m\u00E5nad. Det beh\u00F6ver inte vara ett j\u00E4mnt belopp \u2014 testa dig fram! Ens 300 kr/m\u00E5n g\u00F6r stor skillnad \u00F6ver l\u00E5ng tid.',
        labelRate: '\u00C5rlig avkastning (%)',
        tipRate: 'Hur mycket dina pengar f\u00F6rv\u00E4ntas v\u00E4xa per \u00E5r. Sparkonto: 2\u20133 %. Global indexfond: historiskt ~8\u201310 %. Obligationer/r\u00E4ntefonder: 3\u20135 %. Ingen kan garantera framtida avkastning.',
        hintRate: 'Tolkas som nominell \u00E5rsr\u00E4nta \u2014 t.ex. 5 % blir 5/12 % per m\u00E5nad. Effektiv \u00E5rsavkastning blir d\u00E5 n\u00E5got h\u00F6gre (~5,12 %).',
        labelYears: 'Tidsperiod (\u00E5r)',
        tipYears: 'Hur m\u00E5nga \u00E5r du t\u00E4nker spara innan du tar ut pengarna. Ju l\u00E4ngre tid, desto kraftigare r\u00E4nta-p\u00E5-r\u00E4nta-effekt. 10 \u00E5r \u00E4r OK, 30 \u00E5r \u00E4r kraftfullt.',
        labelFees: 'F\u00F6rvaltningsavgifter per \u00E5r (%)',
        tipFees: 'Avgiften fonden tar varje \u00E5r \u2014 syns inte p\u00E5 kontot men dras automatiskt. Billiga indexfonder tar 0,1\u20130,4 %. Dyra aktivt f\u00F6rvaltade fonder kan ta 1\u20132 %. L\u00E4gre avgift = mer pengar till dig.',
        labelCapitalGainsTax: 'Skatt p\u00E5 kapitalvinst',
        tipCapitalGainsTax: 'N\u00E4r du tar ut pengarna betalar du skatt p\u00E5 vinsten (inte p\u00E5 det du satt in). Skattesatsen varierar per land. Exempel: du satte in 100 000 kr, tar ut 200 000 kr \u2192 betalar skatt p\u00E5 100 000 kr vinst.',
        capitalGainsTaxDesc: 'G\u00E4ller vid uttag enligt lag',
        hintCapitalGainsTax: 'Till\u00E4mpas p\u00E5 vinsten vid uttag (eng\u00E5ngsbeskattning, inte \u00E5rlig).',
        labelInflation: 'Inflation (%)',
        tipInflation: 'Inflation betyder att pengar tappar k\u00F6pkraft med \u00E5ren. Det som kostar 100 kr idag kostar kanske 122 kr om 10 \u00E5r med 2 % inflation. Kalkylatorn visar d\u00E5 vad ditt sparande \u00E4r v\u00E4rt i DAGENS penningv\u00E4rde. Riksbankens m\u00E5l \u00E4r 2 %.',
        taxAdvCheckboxLabel: 'Skattegynnat konto',
        taxAdvDescription: 'Reglerna varierar per land \u2014 se f\u00F6rklaringen vid aktivering.',
        labelAdvRate: 'Schablonr\u00E4nta (%)',
        tipAdvRate: 'Den r\u00E4nta som styr skatten. Best\u00E4ms av staten varje \u00E5r.',
        goalHeading: 'S\u00E5h\u00E4r mycket pengar vill jag ha',
        goalSubheading: 'Fyll i ditt m\u00E5l \u2014 s\u00E5 r\u00E4knar vi ut hur mycket du beh\u00F6ver spara varje m\u00E5nad.',
        labelGoalTarget: 'Jag vill ha',
        tipGoalTarget: 'Det belopp du vill ha sparat. T\u00E4nk p\u00E5 vad du sparar till \u2014 kontantinsats till bostad, pension, dr\u00F6mresa, ekonomisk frihet? Skriv in summan i kronor.',
        goalRealTerms: 'Beloppet \u00E4r i <em>dagens pengar</em> (justerat f\u00F6r inflation)',
        tipGoalRealTerms: 'Ibockad: du t\u00E4nker p\u00E5 vad pengarna \u00E4r v\u00E4rda NU. Kalkylatorn r\u00E4knar ut hur mycket mer du faktiskt beh\u00F6ver spara f\u00F6r att kompensera f\u00F6r inflation. Exempel: 1 miljon i dag = mer kronor om 20 \u00E5r p.g.a. inflation.',
        goalRealTermsHint: 'Avmarkerat = du anger det belopp du faktiskt vill ha i framtiden (nominellt).',
        labelGoalInitial: 'Startkapital (befintliga besparingar)',
        tipGoalInitial: 'Pengar du redan har sparat och kan anv\u00E4nda som startpunkt. Dessa pengar jobbar direkt mot ditt m\u00E5l. Har du inget sparat \u00E4nnu? Skriv 0.',
        labelGoalYears: 'Tidsperiod (\u00E5r)',
        tipGoalYears: 'Hur m\u00E5nga \u00E5r du har p\u00E5 dig att n\u00E5 ditt m\u00E5l. Sparar du till pension om 30 \u00E5r? Skriv 30. Kontantinsats om 5 \u00E5r? Skriv 5. Kortare tid kr\u00E4ver mer sparande per m\u00E5nad.',
        labelGoalRate: '\u00C5rlig avkastning (%)',
        tipGoalRate: 'Hur mycket dina pengar f\u00F6rv\u00E4ntas v\u00E4xa per \u00E5r. Sparkonto: 2\u20133 %. Global indexfond: historiskt ~8\u201310 %. S\u00E4tt l\u00E4gre om du \u00E4r os\u00E4ker \u2014 b\u00E4ttre att bli positivt \u00F6verraskad.',
        hintGoalRate: 'Tolkas som nominell \u00E5rsr\u00E4nta (delas med 12 till m\u00E5nadsr\u00E4nta).',
        labelGoalFees: 'F\u00F6rvaltningsavgifter per \u00E5r (%)',
        tipGoalFees: 'Avgiften fonden tar varje \u00E5r \u2014 syns inte p\u00E5 kontot men dras automatiskt. Billiga indexfonder tar 0,1\u20130,4 %. Dyra aktivt f\u00F6rvaltade fonder kan ta 1\u20132 %. L\u00E4gre avgift = mer pengar till dig.',
        labelGoalCapitalGainsTax: 'Skatt p\u00E5 kapitalvinst',
        tipGoalCapitalGainsTax: 'N\u00E4r du tar ut pengarna betalar du skatt p\u00E5 vinsten (inte p\u00E5 det du satt in). Skattesatsen varierar per land.',
        goalCapitalGainsTaxDesc: 'G\u00E4ller vid uttag enligt lag',
        labelGoalInflation: 'Inflation (%)',
        tipGoalInflation: 'Inflation betyder att pengar tappar k\u00F6pkraft med \u00E5ren. Det som kostar 100 kr idag kostar kanske 122 kr om 10 \u00E5r med 2 % inflation. Riksbankens m\u00E5l \u00E4r 2 %.',
        goalNeedSave: 'DU BEH\u00D6VER SPARA',
        goalNoSavings: '\u2705 Ditt startkapital r\u00E4cker! Du beh\u00F6ver inte spara n\u00E5got extra m\u00E5nadsvis.',
        goalNominalLabel: 'M\u00E5lbelopp (nominellt):',
        goalRealLabel: 'Motsvarar i dagens pengar:',
        goalTotalInLabel: 'Totalt du s\u00E4tter in:',
        goalGainLabel: 'Avkastning (netto):',
        goalFeesLabel: 'F\u00F6rvaltningsavgifter:',
        goalTaxLabel: 'Skatt:',
        goalBreakdownTitle: 'F\u00F6rdelning',
        goalTimelineTitle: '\uD83D\uDCC8 Sparplan \u2014 \u00C5rlig tillv\u00E4xt',
        goalThTotal: 'Slutv\u00E4rde',
        footerLicense: '\u00D6ppen k\u00E4llkod \u2014',
        footerUpdated: 'Senast uppdaterat: 8 maj 2026',
        footerGitHub: 'Visa k\u00E4llkoden p\u00E5 GitHub',
        legendInvested: 'Investerat',
        legendGain: 'Nettovinst',
        legendFees: 'Avgifter',
        legendTax: 'Skatt',
        legendISKTax: 'ISK-skatt',
        legendASKTax: 'ASK-skatt',
        chartTooltipYear: '\u00C5r',
        chartTooltipTotal: 'Totalt',
        chartTooltipInvested: 'Investerat',
        chartTooltipGain: 'Avkastning',
        chartAriaLabel: 'Diagram \u00F6ver \u00E5rlig tillv\u00E4xt. Anv\u00E4nd piltangenter f\u00F6r att bl\u00E4ddra mellan \u00E5ren.',
        errorRequired: '\u26A0\uFE0F Obligatoriskt f\u00E4lt',
        errorMin: '\u26A0\uFE0F Minimumv\u00E4rde:',
        errorMax: '\u26A0\uFE0F Maxv\u00E4rde:',
        feesErrorHigher: '\u26A0\uFE0F Avgifterna kan inte vara st\u00F6rre \u00E4n avkastningen',
        feesErrorNetNegative: '\u2139\uFE0F Avgiften \u00E4r h\u00F6gre \u00E4n avkastningen \u2014 kontot tappar i v\u00E4rde \u00F6ver tid.',
        feesErrorGoal: '\u2139\uFE0F Avgiften \u00E4r h\u00F6gre \u00E4n avkastningen \u2014 m\u00E5let kan vara sv\u00E5rt eller om\u00F6jligt att n\u00E5.',
        breakdownEmpty: 'Ange avkastning och/eller sparande f\u00F6r att se f\u00F6rdelning.',
        warningLargeNumbers: '\u26A0\uFE0F Mycket stora tal kan ha begr\u00E4nsad precision',
        goalZeroSavings: '0 kr/m\u00E5n',
        goalStartCapitalSuffices: 'Ditt startkapital r\u00E4cker p\u00E5',
        goalYearsSuffix: '\u00E5r.',
        resultTitle: 'Detaljerade Resultat',
        labelTotalInvested: 'Totalt investerat:',
        labelTaxesResult: 'Skatt p\u00E5 kapitalvinst:',
        labelGrossValue: 'Bruttov\u00E4rde (ingen skatt/avgift):',
        labelGrossISKValue: 'ISK-kontots v\u00E4rde:',
        labelGrossASKValue: 'ASK-kontots v\u00E4rde:',
        labelGrossDeferredValue: 'Kontots v\u00E4rde (f\u00F6re skatt):',
        labelFeesResult: 'F\u00F6rvaltningsavgifter:',
        labelRealValue: 'Realv\u00E4rde (efter inflation):',
        labelNetValue: 'Slutv\u00E4rde efter skatt & avgifter:',
        breakdownTitle: 'F\u00F6rdelning av slutv\u00E4rdet',
        validationPrefix: 'V\u00E4nligen ange',
        timelineTitle: '\uD83D\uDCC8 Tidslinje \u2014 \u00C5rlig tillv\u00E4xt',
        thYear: '\u00C5r',
        thInvested: 'Investerat',
        thReturn: 'Avkastning',
        thReturnPlus: 'Avkastning +',
        thReturnPlusTitle: '\u00C5rets avkastnings\u00F6kning j\u00E4mf\u00F6rt med f\u00F6reg\u00E5ende \u00E5r',
        thTotal: 'Slutv\u00E4rde',
        taxTypeISK: 'ISK-skatt (betalas separat):',
        taxTypeASK: 'ASK-skatt (dras fr\u00E5n kontot):',
        taxTypeCapitalGains: 'Skatt p\u00E5 kapitalvinst:',
        taxTypeWealth: 'F\u00F6rm\u00F6genhetsskatt:',
        taxTypeTaxFree: 'Skatt (skattefri):',
        legendWealthTax: 'F\u00F6rm\u00F6genhetsskatt',
        labelGrossAccountValue: 'Kontots v\u00E4rde:',
        labelGrossTaxFreeValue: 'Kontots v\u00E4rde (skattefritt):',
        chartLegendInvested: 'Investerat',
        chartLegendReturn: 'Avkastning',
        perMonth: '/m\u00E5n',
        goalStandardAccount: 'vanligt konto',
        goalUnder: 'Under ',
        goalYearsSpan: ' \u00E5r \u00B7 ',
        goalUnreachable: 'M\u00E5let kan vara ouppn\u00E5eligt med dessa parametrar'
    },
    en: {
        appName: 'The Money Machine',
        subtitle: '"Money is time well spent!" \u2014 Scrooge McDuck',
        langLabel: 'Language',
        countryLabel: 'Country',
        tabsAriaLabel: 'Tool tabs',
        skipLink: 'Skip to content',
        appTagline: 'Free investment calculator',
        tabAdvanced: 'Calculator',
        tabGoal: 'Savings Goal',
        colParams: '\u2460 Parameters',
        colResults: '\u2461 Results',
        colTimeline: '\u2462 Timeline',
        rprToggle: '\uD83D\uDCA1 What is compound interest?',
        rprTitle: 'Simply explained \u2014 no jargon',
        rprPara1: 'Imagine you deposit money into an account that earns 7% return per year. The first year you earn interest on what you deposited. The second year you earn interest on <em>what you deposited + the interest you already earned</em>. The third year you earn interest on all of it. And so on.',
        rprPara2: 'It sounds like a small thing \u2014 but it\'s like a snowball rolling down a mountain. It starts small. Near the bottom, it\'s enormous.',
        rprExampleTitle: 'Concrete example:',
        rprExampleText: 'You save <strong>1,000 kr/month</strong> for <strong>30 years</strong> with <strong>7% annual return</strong>.',
        rprExampleDetail: 'Total deposits: <strong>360,000 kr</strong><br>Without any return: <strong>360,000 kr</strong><br>With simple interest (7% only on deposits, each year): <strong>~1,116,000 kr</strong><br>With compound interest (7% on everything that grows): <strong>~1,220,000 kr</strong>',
        rprBarInsatt: 'What you deposited (1,000 kr/month \u00D7 30 years)',
        rprBarVanlig: 'With simple interest after 30 years (only on deposits)',
        rprBarRpr: 'With compound interest after 30 years \u2728',
        rprBarsNote: 'Example in SEK:',
        rprTakeaway: '\uD83C\uDF31 <strong>What it means for you:</strong> The earlier you start, the more powerful the effect. Ten extra years can double the final sum \u2014 not because you save twice as much, but because the money grows on its own growth. Time is your most valuable asset.',
        labelInitialCapital: 'Starting capital',
        tipInitialCapital: 'Money you already have saved and want to start with. Have 0? Write 0. Have a 50,000 buffer? Write 50000.',
        labelMonthlyAmount: 'Monthly savings',
        tipMonthlyAmount: 'How much you deposit each month. Even small amounts make a big difference over time.',
        labelRate: 'Annual return (%)',
        tipRate: 'How much your money is expected to grow per year. Savings account: 2\u20133%. Global index fund: historically ~8\u201310%. Bonds/interest funds: 3\u20135%. Future returns are never guaranteed.',
        hintRate: 'Interpreted as nominal annual rate \u2014 e.g. 5% becomes 5/12% per month. Effective annual return is then slightly higher (~5.12%).',
        labelYears: 'Time period (years)',
        tipYears: 'How many years you plan to save before withdrawing. The longer, the stronger the compound effect. 10 years is OK, 30 years is powerful.',
        labelFees: 'Annual management fees (%)',
        tipFees: 'The fee the fund charges each year \u2014 invisible on your statement but deducted automatically. Cheap index funds: 0.1\u20130.4%. Expensive actively managed funds: 1\u20132%. Lower fee = more money for you.',
        labelCapitalGainsTax: 'Capital gains tax',
        tipCapitalGainsTax: 'When you withdraw, you pay tax on the profit (not on what you deposited). The tax rate varies by country. Example: deposited 100,000, withdraw 200,000 \u2192 tax on 100,000 profit.',
        capitalGainsTaxDesc: 'Applied at withdrawal per national law',
        hintCapitalGainsTax: 'Applied on profit at withdrawal (one-time taxation, not annual).',
        labelInflation: 'Inflation (%)',
        tipInflation: 'Inflation means money loses purchasing power over time. What costs 100 today might cost 122 in 10 years at 2% inflation. The calculator shows what your savings are worth in TODAY\'s money.',
        taxAdvCheckboxLabel: 'Tax-advantaged account',
        taxAdvDescription: 'Rules vary by country \u2014 see explanation when activated.',
        labelAdvRate: 'Standard rate (%)',
        tipAdvRate: 'The rate that determines the tax. Set annually by the government.',
        goalHeading: 'This is how much money I want',
        goalSubheading: 'Enter your goal \u2014 we\'ll calculate how much you need to save each month.',
        labelGoalTarget: 'I want',
        tipGoalTarget: 'The amount you want to have saved. Think about what you\'re saving for \u2014 down payment, pension, dream trip, financial freedom? Enter the amount.',
        goalRealTerms: 'The amount is in <em>today\'s money</em> (inflation adjusted)',
        tipGoalRealTerms: 'Checked: you think in terms of what money is worth NOW. The calculator figures out how much more you actually need to save to compensate for inflation.',
        goalRealTermsHint: 'Unchecked = you enter the amount you actually want in the future (nominal).',
        labelGoalInitial: 'Starting capital (existing savings)',
        tipGoalInitial: 'Money you already have saved that can work toward your goal right away. Have nothing saved yet? Write 0.',
        labelGoalYears: 'Time period (years)',
        tipGoalYears: 'How many years you have to reach your goal. Saving for retirement in 30 years? Enter 30. Down payment in 5 years? Enter 5. Shorter time requires more saving per month.',
        labelGoalRate: 'Annual return (%)',
        tipGoalRate: 'How much your money is expected to grow per year. Set lower if uncertain \u2014 better to be pleasantly surprised.',
        hintGoalRate: 'Interpreted as nominal annual rate (divided by 12 for monthly rate).',
        labelGoalFees: 'Annual management fees (%)',
        tipGoalFees: 'The fee the fund charges each year. Cheap index funds: 0.1\u20130.4%. Expensive actively managed funds: 1\u20132%. Lower fee = more money for you.',
        labelGoalCapitalGainsTax: 'Capital gains tax',
        tipGoalCapitalGainsTax: 'When you withdraw, you pay tax on the profit. The rate varies by country.',
        goalCapitalGainsTaxDesc: 'Applied at withdrawal per national law',
        labelGoalInflation: 'Inflation (%)',
        tipGoalInflation: 'Inflation means money loses purchasing power over time.',
        goalNeedSave: 'YOU NEED TO SAVE',
        goalNoSavings: '\u2705 Your starting capital is enough! No additional monthly savings needed.',
        goalNominalLabel: 'Target amount (nominal):',
        goalRealLabel: 'Equivalent in today\'s money:',
        goalTotalInLabel: 'Total you deposit:',
        goalGainLabel: 'Return (net):',
        goalFeesLabel: 'Management fees:',
        goalTaxLabel: 'Tax:',
        goalBreakdownTitle: 'Breakdown',
        goalTimelineTitle: '\uD83D\uDCC8 Savings Plan \u2014 Annual growth',
        goalThTotal: 'Net value',
        footerLicense: 'Open source \u2014',
        footerUpdated: 'Last updated: May 8, 2026',
        footerGitHub: 'View source code on GitHub',
        legendInvested: 'Invested',
        legendGain: 'Net profit',
        legendFees: 'Fees',
        legendTax: 'Tax',
        legendISKTax: 'ISK tax',
        legendASKTax: 'ASK tax',
        chartTooltipYear: 'Year',
        chartTooltipTotal: 'Total',
        chartTooltipInvested: 'Invested',
        chartTooltipGain: 'Return',
        chartAriaLabel: 'Chart showing annual growth. Use arrow keys to browse between years.',
        errorRequired: '\u26A0\uFE0F Required field',
        errorMin: '\u26A0\uFE0F Minimum value:',
        errorMax: '\u26A0\uFE0F Maximum value:',
        feesErrorHigher: '\u26A0\uFE0F Fees cannot exceed the return',
        feesErrorNetNegative: '\u2139\uFE0F Fees exceed return \u2014 the account loses value over time.',
        feesErrorGoal: '\u2139\uFE0F Fees exceed return \u2014 the goal may be difficult or impossible to reach.',
        breakdownEmpty: 'Enter return and/or savings to see the breakdown.',
        warningLargeNumbers: '\u26A0\uFE0F Very large numbers may have limited precision',
        goalZeroSavings: '0/month',
        goalStartCapitalSuffices: 'Your starting capital is enough for',
        goalYearsSuffix: 'years.',
        resultTitle: 'Detailed Results',
        labelTotalInvested: 'Total invested:',
        labelTaxesResult: 'Capital gains tax:',
        labelGrossValue: 'Gross value (no tax/fees):',
        labelGrossISKValue: 'ISK account value:',
        labelGrossASKValue: 'ASK account value:',
        labelGrossDeferredValue: 'Account value (pre-tax):',
        labelFeesResult: 'Management fees:',
        labelRealValue: 'Real value (inflation adjusted):',
        labelNetValue: 'Net value after tax & fees:',
        breakdownTitle: 'Breakdown of final value',
        validationPrefix: 'Please enter',
        timelineTitle: '\uD83D\uDCC8 Timeline \u2014 Annual growth',
        thYear: 'Year',
        thInvested: 'Invested',
        thReturn: 'Return',
        thReturnPlus: 'Return +',
        thReturnPlusTitle: 'Year-on-year increase in return compared to previous year',
        thTotal: 'Net value',
        taxTypeISK: 'ISK tax (paid separately):',
        taxTypeASK: 'ASK tax (deducted from account):',
        taxTypeCapitalGains: 'Capital gains tax:',
        taxTypeWealth: 'Wealth tax:',
        taxTypeTaxFree: 'Tax (tax-free):',
        legendWealthTax: 'Wealth tax',
        labelGrossAccountValue: 'Account value:',
        labelGrossTaxFreeValue: 'Account value (tax-free):',
        chartLegendInvested: 'Invested',
        chartLegendReturn: 'Return',
        perMonth: '/month',
        goalStandardAccount: 'standard account',
        goalUnder: 'Over ',
        goalYearsSpan: ' years \u00B7 ',
        goalUnreachable: 'Goal may be unreachable with these parameters'
    }
};

function t(key) {
    var lang = state.lang || 'sv';
    var dict = I18N[lang] || I18N.sv;
    return dict[key] !== undefined ? dict[key] : (I18N.sv[key] || key);
}

// ============================================================
//  Landshantering
// ============================================================
function getCountry() {
    return getCountryConfig(state.country);
}

function activeCurrencySym() {
    return getCurrencySymbol(getCountry().currency);
}

function getLocale() {
    return getCountry().locale;
}

// ============================================================
//  UI-\u00F6vers\u00E4ttning
// ============================================================
function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
        el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-tip]').forEach(function(el) {
        el.setAttribute('data-tip', t(el.getAttribute('data-i18n-tip')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
        el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    document.documentElement.lang = state.lang;
    document.title = t('appName') + ' \u2013 ' + t('appTagline');
}

function formatTaxRate(rate) {
    if (rate === undefined || rate === null) return '';
    return parseFloat((rate * 100).toFixed(2)) + ' %';
}

// ============================================================
//  Uppdatera landsspecifik UI — helt datadriven
// ============================================================
function updateCountryUI() {
    var c = getCountry();
    var sym = activeCurrencySym();

    // Valutasymboler i input-grupper
    ['advCurrencyUnit', 'advMonthlyCurrencyUnit', 'goalCurrencyUnit', 'goalInitialCurrencyUnit'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = sym;
    });

    // Kapitalvinstskatt-display
    var taxDisplay;
    if (c.standardParams.capitalGainsTax !== undefined) {
        taxDisplay = formatTaxRate(c.standardParams.capitalGainsTax);
        if (c.standardParams.capitalGainsTaxHigh) {
            taxDisplay = formatTaxRate(c.standardParams.capitalGainsTax) + ' / ' + formatTaxRate(c.standardParams.capitalGainsTaxHigh);
        }
    } else {
        taxDisplay = '\u2014';
    }
    var taxDisplays = document.querySelectorAll('#taxRateDisplay, #advTaxRateDisplay');
    taxDisplays.forEach(function(el) { el.textContent = taxDisplay; });
    var goalTaxDisplay = document.getElementById('goalTaxRateDisplay');
    if (goalTaxDisplay) goalTaxDisplay.textContent = taxDisplay;

    // Skattegynnat konto-sektion
    var advSection = document.getElementById('taxAdvSection');
    var goalAdvSection = document.getElementById('goalTaxAdvSection');
    var lang = state.lang;
    var ui = c.ui && c.ui[lang] ? c.ui[lang] : (c.ui && c.ui.sv ? c.ui.sv : null);

    if (c.taxAdvRegime && ui && ui.taxAdvLabel) {
        if (advSection) advSection.style.display = '';
        if (goalAdvSection) goalAdvSection.style.display = '';

        var advCb = document.getElementById('advTaxAdvCheckboxText');
        var goalCb = document.getElementById('goalTaxAdvCheckboxText');
        var advDesc = document.getElementById('taxAdvDescription');
        var goalDesc = document.getElementById('goalTaxAdvDescription');
        var advTip = document.querySelector('#taxAdvSection .info-tip');
        var goalTip = document.querySelector('#goalTaxAdvSection .info-tip');

        if (advCb) advCb.textContent = ui.taxAdvLabel;
        if (goalCb) goalCb.textContent = ui.taxAdvLabel;
        if (advDesc) advDesc.textContent = ui.taxAdvDesc;
        if (goalDesc) goalDesc.textContent = ui.taxAdvDesc;
        if (advTip) advTip.setAttribute('data-tip', ui.taxAdvTip);
        if (goalTip) goalTip.setAttribute('data-tip', ui.taxAdvTip);

        // Slider hint för ISK-ränta
        var advSliderHint = document.getElementById('advRateSliderHint');
        var goalSliderHint = document.getElementById('goalAdvRateSliderHint');
        if (advSliderHint && ui.taxAdvSliderHint) advSliderHint.innerHTML = ui.taxAdvSliderHint;
        if (goalSliderHint && ui.taxAdvSliderHint) goalSliderHint.innerHTML = ui.taxAdvSliderHint;

        // Visa/dölj rate-fält baserat på regimen
        var regime = TAX_REGIMES[c.taxAdvRegime];
        var rateFields = regime.getUI().rateFields;
        var advRateGroup = document.getElementById('advRateGroup');
        var goalAdvRateGroup = document.getElementById('goalAdvRateGroup');

        if (advRateGroup) advRateGroup.style.display = (rateFields.indexOf('iskRate') >= 0 && state.taxAdvOn) ? 'block' : 'none';
        if (goalAdvRateGroup) goalAdvRateGroup.style.display = (rateFields.indexOf('iskRate') >= 0 && state.goalTaxAdvOn) ? 'block' : 'none';

        // Återställ kapitalvinstgrupper
        if ($('taxRateGroup')) { $('taxRateGroup').style.opacity = state.taxAdvOn ? '0.4' : '1'; $('taxRateGroup').style.pointerEvents = state.taxAdvOn ? 'none' : 'auto'; }
        if ($('goalTaxGroup')) { $('goalTaxGroup').style.opacity = state.goalTaxAdvOn ? '0.4' : '1'; $('goalTaxGroup').style.pointerEvents = state.goalTaxAdvOn ? 'none' : 'auto'; }
    } else {
        // Inget skattegynnat konto
        if (advSection) advSection.style.display = 'none';
        if (goalAdvSection) goalAdvSection.style.display = 'none';
        var advRateGroup2 = document.getElementById('advRateGroup');
        var goalAdvRateGroup2 = document.getElementById('goalAdvRateGroup');
        if (advRateGroup2) advRateGroup2.style.display = 'none';
        if (goalAdvRateGroup2) goalAdvRateGroup2.style.display = 'none';
        if ($('taxRateGroup')) { $('taxRateGroup').style.opacity = '1'; $('taxRateGroup').style.pointerEvents = 'auto'; }
        if ($('goalTaxGroup')) { $('goalTaxGroup').style.opacity = '1'; $('goalTaxGroup').style.pointerEvents = 'auto'; }
    }

    // Förenklingsnotis (gäller alla länder)
    var simplEl = document.getElementById('simplificationNote');
    if (simplEl) {
        if (ui && ui.simplificationNote) {
            simplEl.textContent = ui.simplificationNote;
            simplEl.classList.add('show');
        } else {
            simplEl.classList.remove('show');
            simplEl.textContent = '';
        }
    }

    // Uppdatera beloppshints så att de reflekterar valt lands valuta
    [{ id: 'advInitialCapital', hint: 'advInitialCapitalHint' },
     { id: 'advMonthlyAmount',  hint: 'advMonthlyAmountHint' },
     { id: 'goalTarget',        hint: 'goalTargetHint' },
     { id: 'goalInitial',       hint: 'goalInitialHint' }].forEach(function(pair) {
        var input = document.getElementById(pair.id);
        var hint  = document.getElementById(pair.hint);
        if (input && hint && input.value !== '' && !isNaN(parseFloat(input.value))) {
            hint.textContent = formatAmountHint(parseFloat(input.value), getLocale(), getCountry().currency);
        }
    });
}

// ============================================================
//  Delade hj\u00E4lpfunktioner
// ============================================================
function setFeesError(rateVal, feesVal, errorEl, msg) {
    if (feesVal > rateVal) {
        errorEl.textContent = msg || t('feesErrorHigher');
        errorEl.classList.add('show');
    } else {
        errorEl.classList.remove('show');
    }
}

function showCalc() { document.querySelectorAll('.results.show').forEach(function(r) { r.classList.add('calculating'); }); }
function hideCalc() { document.querySelectorAll('.results.calculating').forEach(function(r) { r.classList.remove('calculating'); }); }

function setupTaxAdvToggle(checkboxId, taxGroupId, stateKey, recalcFn, debounceMs) {
    var cb = document.getElementById(checkboxId);
    if (!cb) return;
    cb.addEventListener('change', function() {
        state[stateKey] = this.checked;
        var c = getCountry();
        var taxGroup = document.getElementById(taxGroupId);
        var advRateGroup = document.getElementById(stateKey === 'taxAdvOn' ? 'advRateGroup' : 'goalAdvRateGroup');

        // Visa/dölj rate-fält
        if (advRateGroup) {
            if (c.taxAdvRegime) {
                var regime = TAX_REGIMES[c.taxAdvRegime];
                var rateFields = regime.getUI().rateFields;
                advRateGroup.style.display = (rateFields.indexOf('iskRate') >= 0 && this.checked) ? 'block' : 'none';
            }
        }

        // Dimma kapitalvinstgrupp
        if (taxGroup) {
            taxGroup.style.opacity = this.checked ? '0.4' : '1';
            taxGroup.style.pointerEvents = this.checked ? 'none' : 'auto';
        }
        document.querySelectorAll('.results.show').forEach(function(r) { r.classList.add('calculating'); });
        clearTimeout(state[stateKey === 'taxAdvOn' ? 'advTimeout' : 'goalTimeout']);
        state[stateKey === 'taxAdvOn' ? 'advTimeout' : 'goalTimeout'] = setTimeout(recalcFn, debounceMs);
    });
}

function buildYearTimeline(years, startCapital, monthlyAmount, monthlyRateNet, tbodyId, regime, params) {
    years = Math.floor(years);
    var frag = document.createDocumentFragment();
    var chartData = [];
    var balance = startCapital;
    var invested = startCapital;
    var prevGain = null;
    var loc = getLocale();
    var curr = getCountry().currency;
    var carryState = null;

    for (var year = 1; year <= years; year++) {
        var balBeforeYear = balance;
        for (var m = 0; m < 12; m++) {
            balance = balance * (1 + monthlyRateNet) + monthlyAmount;
            invested += monthlyAmount;
        }

        // Anropa regimens simulateYear f\u00F6r per-\u00E5r-justeringar (t.ex. dansk ASK-skatt)
        var yrResult = regime.simulateYear(balBeforeYear, balance, monthlyAmount * 12, carryState, params);
        balance = yrResult.newBalance;
        carryState = yrResult.carryState;

        // Slutv\u00E4rde efter skatt vid uttag detta \u00E5r
        var simResult = regime.simulate(startCapital, monthlyAmount, monthlyRateNet, year, params);
        var netValue = simResult.netValue;

        var gain = netValue - invested;
        var delta = prevGain === null ? null : gain - prevGain;
        prevGain = gain;

        chartData.push({ year: year, invested: invested, gain: gain, total: netValue });

        var tr = document.createElement('tr');
        var c1 = document.createElement('td');
        c1.textContent = year;
        tr.appendChild(c1);
        var c2 = document.createElement('td');
        c2.textContent = formatCurrency(invested, loc, curr);
        tr.appendChild(c2);
        var c3 = document.createElement('td');
        c3.textContent = formatCurrency(gain, loc, curr);
        tr.appendChild(c3);
        var c4 = document.createElement('td');
        if (delta === null) {
            c4.textContent = '\u2014';
            c4.style.color = '#8b5a2b';
        } else if (delta >= 0) {
            c4.textContent = '+' + formatCurrency(delta, loc, curr);
            c4.style.color = '#2d5016';
            c4.style.fontWeight = '600';
        } else {
            c4.textContent = formatCurrency(delta, loc, curr);
            c4.style.color = '#8b0000';
            c4.style.fontWeight = '600';
        }
        tr.appendChild(c4);
        var c5 = document.createElement('td');
        var strong = document.createElement('strong');
        strong.textContent = formatCurrency(netValue, loc, curr);
        c5.appendChild(strong);
        tr.appendChild(c5);
        frag.appendChild(tr);
    }
    var tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    tbody.appendChild(frag);
    return chartData;
}

function renderBreakdown(chartElId, legendElId, base, invested, netValue, fees, taxAmt, taxLegendLabel) {
    var chartEl = document.getElementById(chartElId);
    var legendEl = document.getElementById(legendElId);
    while (chartEl.firstChild) chartEl.removeChild(chartEl.firstChild);
    while (legendEl.firstChild) legendEl.removeChild(legendEl.firstChild);
    if (base <= 0) {
        var msg = document.createElement('div');
        msg.style.cssText = 'padding:8px;font-size:12px;color:#8b5a2b;';
        msg.textContent = t('breakdownEmpty');
        chartEl.appendChild(msg);
        return;
    }
    var iPct = Math.min((invested / base) * 100, 100);
    var gPct = Math.max(((netValue - invested) / base) * 100, 0);
    var fPct = Math.max((fees / base) * 100, 0);
    var tPct = Math.max(0, (taxAmt / base) * 100);

    [[iPct, 'chart-invested'], [gPct, 'chart-interest'], [fPct, 'chart-fees'], [tPct, 'chart-taxes']].forEach(function(s) {
        var seg = document.createElement('div');
        seg.className = 'chart-segment ' + s[1];
        seg.style.width = s[0] + '%';
        if (s[0] > 5) seg.textContent = Math.round(s[0]) + '%';
        chartEl.appendChild(seg);
    });

    [[t('legendInvested'), 'chart-invested'], [t('legendGain'), 'chart-interest'], [t('legendFees'), 'chart-fees'], [taxLegendLabel, 'chart-taxes']].forEach(function(r) {
        var item = document.createElement('div');
        item.className = 'legend-item';
        var clr = document.createElement('div');
        clr.className = 'legend-color ' + r[1];
        item.appendChild(clr);
        var span = document.createElement('span');
        span.textContent = r[0];
        item.appendChild(span);
        legendEl.appendChild(item);
    });
}

// ============================================================
//  Validering av input
// ============================================================
function validateInput(id, min, max, isRequired) {
    min = (min !== undefined) ? min : 0;
    max = (max !== undefined) ? max : 100000000;
    isRequired = (isRequired !== undefined) ? isRequired : true;

    var element = document.getElementById(id);
    if (!element) return true;

    var value = parseFloat(element.value);
    var errorElement = document.getElementById(id + 'Error');

    if (!errorElement) {
        console.error('validateInput: inget error-element hittat f\u00F6r "' + id + '" \u2014 validering misslyckas');
        return false;
    }

    if (isNaN(value) || element.value === '') {
        if (isRequired) {
            errorElement.textContent = t('errorRequired');
            errorElement.classList.add('show');
            return false;
        } else {
            errorElement.classList.remove('show');
            return true;
        }
    }

    if (value < min) {
        errorElement.textContent = t('errorMin') + ' ' + min;
        errorElement.classList.add('show');
        return false;
    }

    if (value > max) {
        errorElement.textContent = t('errorMax') + ' ' + max.toLocaleString(getLocale());
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
    var val = parseFloat(this.value);
    if (val < 0) this.value = 0;
    if (val > 5) this.value = 5;
    setFeesError(parseFloat($('advRate').value) || 0, val, $('feesError'));
    $('feesValue').textContent = parseFloat(this.value).toFixed(2) + '%';
    showCalc();
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

document.getElementById('advInflation').addEventListener('input', function() {
    var val = parseFloat(this.value);
    if (val < 0) this.value = 0;
    if (val > 10) this.value = 10;
    document.getElementById('advInflationValue').textContent = parseFloat(this.value).toFixed(1) + '%';
    showCalc();
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

setupTaxAdvToggle('taxAdvEnabled', 'taxRateGroup', 'taxAdvOn', calculateAdvanced, 150);

document.getElementById('advRateSlider').addEventListener('input', function() {
    var val = parseFloat(this.value);
    document.getElementById('advRateValue').textContent = val.toFixed(2) + '%';
    showCalc();
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

// ============================================================
//  Tab-hantering
// ============================================================
function toggleRpr(btn) {
    var body = document.getElementById('rprBody');
    var isOpen = body.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
}

function switchTab(tabName, btnElement) {
    if (document.getElementById(tabName).classList.contains('active')) return;

    document.querySelectorAll('.tab-content').forEach(function(tab) { tab.classList.remove('active'); });
    document.querySelectorAll('.tab-button').forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });

    document.getElementById(tabName).classList.add('active');
    if (btnElement) { btnElement.classList.add('active'); btnElement.setAttribute('aria-selected', 'true'); }

    requestAnimationFrame(function() {
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
//  Formatering av beloppshints
// ============================================================
function bindAmountHint(inputId, hintId) {
    var input = document.getElementById(inputId);
    var hint  = document.getElementById(hintId);
    if (!input || !hint) return;
    input.addEventListener('input', function() {
        var val = input.value;
        if (isNaN(val) || val === '' || val === null) { hint.textContent = ''; return; }
        hint.textContent = formatAmountHint(parseFloat(val), getLocale(), getCountry().currency);
    });
}

bindAmountHint('advInitialCapital', 'advInitialCapitalHint');
bindAmountHint('advMonthlyAmount',  'advMonthlyAmountHint');
bindAmountHint('goalTarget',        'goalTargetHint');
bindAmountHint('goalInitial',       'goalInitialHint');

// ============================================================
//  PENGAMASKIN — ber\u00E4kning (TAX_REGIMES-drivna)
// ============================================================
function calculateAdvanced() {
    hideCalc();
    if (!validateInput('advInitialCapital', 0, 100000000, false) ||
        !validateInput('advMonthlyAmount', 0, 1000000, false) ||
        !validateInput('advRate', 0, 100, true) ||
        !validateInput('advYears', 1, 100, true)) {
        ['advSummary', 'advTimeline'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
        return;
    }

    var c = getCountry();
    var loc = c.locale;
    var curr = c.currency;

    var initialCapital  = parseFloat(document.getElementById('advInitialCapital').value) || 0;
    var monthlyAmount   = parseFloat(document.getElementById('advMonthlyAmount').value)  || 0;
    var annualRate      = parseFloat(document.getElementById('advRate').value)            || 0;
    var years           = Math.floor(parseFloat(document.getElementById('advYears').value)) || 0;
    var fees            = Math.max(0, Math.min(5, parseFloat(document.getElementById('fees').value) || 0));
    var inflation       = Math.max(0, Math.min(10, parseFloat(document.getElementById('advInflation').value) || 0));

    setFeesError(annualRate, fees, $('feesError'), t('feesErrorNetNegative'));

    var monthlyRateGross = annualRate / 100 / 12;
    var monthlyRateNet   = (annualRate - fees) / 100 / 12;
    var months = years * 12;

    var grossValue = computeGrossValue(initialCapital, monthlyAmount, annualRate, years);
    var netAfterFees = computeNetAfterFees(initialCapital, monthlyAmount, annualRate, fees, years);
    var totalInvested = initialCapital + monthlyAmount * months;
    var totalFees = grossValue - netAfterFees;

    var netValue, taxesOwed, accountBalance = null;
    var activeRegime, activeParams;

    if (state.taxAdvOn && c.taxAdvRegime) {
        activeRegime = TAX_REGIMES[c.taxAdvRegime];
        activeParams = Object.assign({}, c.taxAdvParams);
        // Merge anv\u00E4ndarjusterade parametrar fr\u00E5n sliders
        if (c.taxAdvRegime === 'ISK') {
            var sliderVal = parseFloat(document.getElementById('advRateSlider').value);
            activeParams.iskSchablonRate = isNaN(sliderVal) ? (c.taxAdvParams.iskSchablonRateDefault || 3.55) : sliderVal;
        }
    } else {
        activeRegime = TAX_REGIMES[c.standardRegime];
        activeParams = Object.assign({}, c.standardParams);
    }

    var result = activeRegime.simulate(initialCapital, monthlyAmount, monthlyRateNet, years, activeParams);
    accountBalance = result.balance;
    netValue = result.netValue;
    taxesOwed = result.totalTax;

    if (!isValidNumber(grossValue) || !isValidNumber(netValue) || !isValidNumber(taxesOwed)) {
        ['advSummary', 'advTimeline'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
        return;
    }

    var inflationFactor = Math.pow(1 + inflation / 100, years);
    var realValue = netValue / inflationFactor;
    if (!isValidNumber(realValue)) {
        ['advSummary', 'advTimeline'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
        return;
    }

    // Etiketter fr\u00E5n regim-UI
    var regimeUI = activeRegime.getUI();
    var taxesLabelEl = document.getElementById('advTaxesLabel');
    var grossLabelEl = document.getElementById('advGrossLabel');

    taxesLabelEl.textContent = t(regimeUI.taxI18n);
    grossLabelEl.textContent = t(regimeUI.balanceI18n);

    document.getElementById('advTotalInvested').textContent = formatCurrency(totalInvested, loc, curr);
    document.getElementById('advGrossValue').textContent    = (state.taxAdvOn || activeRegime.id !== 'CGT_ONLY') ? formatCurrency(accountBalance, loc, curr) : formatCurrency(grossValue, loc, curr);
    document.getElementById('advTotalFees').textContent     = formatCurrency(totalFees, loc, curr);
    document.getElementById('advTaxes').textContent         = formatCurrency(taxesOwed, loc, curr);
    document.getElementById('advNetValue').textContent      = formatCurrency(netValue, loc, curr);
    document.getElementById('advRealValue').textContent     = formatCurrency(realValue, loc, curr);

    var advWarning = document.getElementById('advWarning');
    advWarning.style.display = netValue > 1e9 ? 'block' : 'none';
    if (netValue > 1e9) advWarning.textContent = t('warningLargeNumbers');

    // F\u00F6rdelningsdiagram
    renderBreakdown('advChart', 'advLegend', grossValue, totalInvested, netValue, totalFees, taxesOwed, t(regimeUI.legendI18n));

    ['advSummary', 'advTimeline'].forEach(function(id) { document.getElementById(id).classList.add('show'); });

    // Tidslinje
    var chartData = buildYearTimeline(years, initialCapital, monthlyAmount, monthlyRateNet, 'timelineBody', activeRegime, activeParams);
    state.advChartData = chartData;
    requestAnimationFrame(function() { drawTimelineChart(chartData); });
}

// ============================================================
//  TIDSLINJE — diagram (delas av Pengamaskin & Sparm\u00E5l)
// ============================================================
function drawTimelineChart(dataPoints, canvasId, tooltipId) {
    canvasId = canvasId || 'timelineChart';
    tooltipId = tooltipId || 'chartTooltip';
    var canvas = document.getElementById(canvasId);
    if (!canvas || !dataPoints || dataPoints.length === 0) return;

    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 260 * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var W = rect.width;
    var H = 260;
    var PAD = { top: 20, right: 20, bottom: 50, left: 70 };
    var plotW = W - PAD.left - PAD.right;
    var plotH = H - PAD.top - PAD.bottom;

    var maxVal = Math.max.apply(null, dataPoints.map(function(d) { return d.total; })) * 1.05;
    var minVal = 0;
    var range = maxVal - minVal || 1;

    function xPos(i) { return dataPoints.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i / (dataPoints.length - 1)) * plotW; }
    function yPos(v) { return PAD.top + plotH - ((v - minVal) / range) * plotH; }

    ctx.clearRect(0, 0, W, H);

    var gridLines = 5;
    ctx.strokeStyle = 'rgba(212,166,0,0.25)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= gridLines; i++) {
        var v = minVal + (i / gridLines) * maxVal;
        var y = yPos(v);
        ctx.beginPath();
        ctx.moveTo(PAD.left, y);
        ctx.lineTo(PAD.left + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#8b5a2b';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        var label = v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' :
                    v >= 1000    ? (v / 1000).toFixed(0) + 'k' :
                    v.toFixed(0);
        var sym = activeCurrencySym();
        ctx.fillText(label + ' ' + sym, PAD.left - 6, y + 4);
    }

    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(dataPoints[0].invested));
    dataPoints.forEach(function(d, i) { ctx.lineTo(xPos(i), yPos(d.invested)); });
    ctx.lineTo(xPos(dataPoints.length - 1), yPos(0));
    ctx.lineTo(xPos(0), yPos(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(139,90,43,0.35)';
    ctx.fill();

    ctx.beginPath();
    dataPoints.forEach(function(d, i) { i === 0 ? ctx.moveTo(xPos(i), yPos(d.invested)) : ctx.lineTo(xPos(i), yPos(d.invested)); });
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(dataPoints[0].invested));
    dataPoints.forEach(function(d, i) { ctx.lineTo(xPos(i), yPos(d.total)); });
    ctx.lineTo(xPos(dataPoints.length - 1), yPos(dataPoints[dataPoints.length - 1].invested));
    for (var k = dataPoints.length - 1; k >= 0; k--) ctx.lineTo(xPos(k), yPos(dataPoints[k].invested));
    ctx.closePath();
    ctx.fillStyle = 'rgba(212,166,0,0.4)';
    ctx.fill();

    ctx.beginPath();
    dataPoints.forEach(function(d, i) { i === 0 ? ctx.moveTo(xPos(i), yPos(d.total)) : ctx.lineTo(xPos(i), yPos(d.total)); });
    ctx.strokeStyle = '#d4a600';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#6b4423';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    var step = Math.ceil(dataPoints.length / 10);
    dataPoints.forEach(function(d, i) {
        if (i === 0 || (i + 1) % step === 0 || i === dataPoints.length - 1) {
            var x = xPos(i);
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(107,68,35,0.4)';
            ctx.lineWidth = 1;
            ctx.moveTo(x, PAD.top + plotH);
            ctx.lineTo(x, PAD.top + plotH + 5);
            ctx.stroke();
            ctx.fillStyle = '#6b4423';
            var yearLabel = t('chartTooltipYear') + ' ' + d.year;
            ctx.fillText(yearLabel, x, H - PAD.bottom + 18);
        }
    });

    ctx.beginPath();
    ctx.strokeStyle = '#d4a600';
    ctx.lineWidth = 2;
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
    ctx.stroke();

    var legY = H - 12;
    var legItems = [
        { color: 'rgba(139,90,43,0.7)', label: t('chartLegendInvested') },
        { color: 'rgba(212,166,0,0.8)', label: t('chartLegendReturn') }
    ];
    var legX = PAD.left;
    legItems.forEach(function(item) {
        ctx.fillStyle = item.color;
        ctx.fillRect(legX, legY - 8, 14, 10);
        ctx.fillStyle = '#6b4423';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legX + 18, legY);
        legX += 100;
    });

    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', t('chartAriaLabel'));
    canvas.style.outline = 'none';
    var focusIdx = dataPoints.length - 1;
    var loc = getLocale();
    var curr = getCountry().currency;

    function showTooltip(idx, clientX, clientY) {
        if (idx < 0 || idx >= dataPoints.length) return;
        var d = dataPoints[idx];
        var tooltip = document.getElementById(tooltipId);
        var yearLabel = t('chartTooltipYear') + ' ' + d.year;
        var totalLabel = t('chartTooltipTotal') + ': ';
        var investedLabel = t('chartTooltipInvested') + ': ';
        var gainLabel = t('chartTooltipGain') + ': ';
        tooltip.textContent = '';
        [yearLabel, totalLabel + formatCurrency(d.total, loc, curr), investedLabel + formatCurrency(d.invested, loc, curr), gainLabel + formatCurrency(d.gain, loc, curr)].forEach(function(textPart, i) {
            if (i > 0) tooltip.appendChild(document.createElement('br'));
            tooltip.appendChild(document.createTextNode(textPart));
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

    canvas.onmousemove = function(e) {
        var bRect = canvas.getBoundingClientRect();
        var mouseX = e.clientX - bRect.left;
        focusIdx = Math.round((mouseX - PAD.left) / plotW * (dataPoints.length - 1));
        if (focusIdx >= 0 && focusIdx < dataPoints.length)
            showTooltip(focusIdx, mouseX, e.clientY);
    };
    canvas.onmouseleave = hideTooltip;

    canvas.onfocus = function() {
        canvas.style.boxShadow = '0 0 0 2px #d4a600';
        showTooltip(focusIdx);
    };
    canvas.onblur = function() {
        canvas.style.boxShadow = 'none';
        hideTooltip();
    };
    canvas.onkeydown = function(e) {
        if (e.key === 'ArrowRight') { focusIdx = Math.min(focusIdx + 1, dataPoints.length - 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft')  { focusIdx = Math.max(focusIdx - 1, 0); e.preventDefault(); }
        else if (e.key === 'Home')       { focusIdx = 0; e.preventDefault(); }
        else if (e.key === 'End')        { focusIdx = dataPoints.length - 1; e.preventDefault(); }
        else return;
        showTooltip(focusIdx);
    };
}

// ============================================================
//  App-tester
// ============================================================
function runAppTests() {
    var ok = 0, fail = 0;
    function tst(name, cond, detail) { if (cond) { ok++; console.log('  OK ' + name); } else { fail++; console.error('  FEL ' + name + (detail ? ' \u2014 ' + detail : '')); } }

    (function() {
        var tmpTbody = document.createElement('tbody');
        tmpTbody.id = '_appTestTbody';
        document.body.appendChild(tmpTbody);
        var cd = buildYearTimeline(3, 10000, 500, 0.07 / 12, '_appTestTbody', TAX_REGIMES.CGT_ONLY, { capitalGainsTax: 0.30 });
        tst('buildYearTimeline: returnerar chartData med 3 \u00E5r', cd.length === 3, 'fick ' + cd.length);
        tst('buildYearTimeline: chartData[0] har year, invested, gain, total',
            cd[0].year === 1 && cd[0].invested > 0 && cd[0].total > 0);
        tst('buildYearTimeline: chartData sista \u00E5r > f\u00F6rsta \u00E5r', cd[2].total > cd[0].total);
        tst('buildYearTimeline: chartData[2] netto > investerat (avkastning > skatt)',
            cd[2].total > cd[2].invested);
        tst('buildYearTimeline: chartData sista \u00E5r > f\u00F6rsta \u00E5r', cd[2].total > cd[0].total);
        var rows = tmpTbody.querySelectorAll('tr');
        tst('buildYearTimeline: 3 rader i tbody', rows.length === 3);
        tst('buildYearTimeline: f\u00F6rsta rad har 5 celler', rows[0].querySelectorAll('td').length === 5);
        tst('buildYearTimeline: sista cell inneh\u00E5ller <strong>', rows[0].querySelectorAll('td')[4].querySelector('strong') !== null);
        document.body.removeChild(tmpTbody);
    })();

    (function() {
        var chartDiv = document.createElement('div');
        chartDiv.id = '_appTestChart';
        var legendDiv = document.createElement('div');
        legendDiv.id = '_appTestLegend';
        document.body.appendChild(chartDiv);
        document.body.appendChild(legendDiv);
        renderBreakdown('_appTestChart', '_appTestLegend', 200000, 120000, 170000, 5000, 0, t('legendTax'));

        var segs = chartDiv.querySelectorAll('.chart-segment');
        tst('renderBreakdown: 4 chart-segment element', segs.length === 4);
        tst('renderBreakdown: f\u00F6rsta segment \u00E4r chart-invested', segs[0].classList.contains('chart-invested'));
        tst('renderBreakdown: segment har satt width', segs[0].style.width !== '');

        var items = legendDiv.querySelectorAll('.legend-item');
        tst('renderBreakdown: 4 legend-item element', items.length === 4);
        tst('renderBreakdown: legend visar avgiftsetikett', legendDiv.textContent.indexOf(t('legendFees')) >= 0);

        document.body.removeChild(chartDiv);
        document.body.removeChild(legendDiv);
    })();

    (function() {
        var cd = document.createElement('div'); cd.id = '_appTC2';
        var ld = document.createElement('div'); ld.id = '_appTL2';
        document.body.appendChild(cd); document.body.appendChild(ld);
        renderBreakdown('_appTC2', '_appTL2', 100000, 90000, 95000, 1000, 0, t('legendISKTax'));
        tst('renderBreakdown ISK: legend visar "ISK-skatt"', ld.textContent.indexOf('ISK-skatt') >= 0 || ld.textContent.indexOf('ISK tax') >= 0);
        document.body.removeChild(cd); document.body.removeChild(ld);
    })();

    (function() {
        var cd = document.createElement('div'); cd.id = '_appTC3';
        var ld = document.createElement('div'); ld.id = '_appTL3';
        document.body.appendChild(cd); document.body.appendChild(ld);
        renderBreakdown('_appTC3', '_appTL3', 0, 0, 0, 0, 0, t('legendTax'));
        tst('renderBreakdown base=0: fallback-text visas', cd.textContent.indexOf(t('breakdownEmpty')) >= 0);
        tst('renderBreakdown base=0: legend \u00E4r tom', ld.children.length === 0);
        document.body.removeChild(cd); document.body.removeChild(ld);
    })();

    console.log('App-tester klara: ' + ok + ' OK, ' + fail + ' fel.');
}

// ============================================================
//  SPARM\u00C5L — slider-lyssnare
// ============================================================
document.getElementById('goalFees').addEventListener('input', function() {
    $('goalFeesValue').textContent = parseFloat(this.value).toFixed(2) + '%';
    setFeesError(parseFloat($('goalRate').value) || 0, parseFloat(this.value), $('goalFeesError'));
    showCalc();
    clearTimeout(state.goalTimeout);
    state.goalTimeout = setTimeout(calculateGoal, 300);
});

document.getElementById('goalInflation').addEventListener('input', function() {
    document.getElementById('goalInflationValue').textContent = parseFloat(this.value).toFixed(1) + '%';
    showCalc();
    clearTimeout(state.goalTimeout);
    state.goalTimeout = setTimeout(calculateGoal, 300);
});

setupTaxAdvToggle('goalTaxAdvEnabled', 'goalTaxGroup', 'goalTaxAdvOn', calculateGoal, 150);

document.getElementById('goalAdvRateSlider').addEventListener('input', function() {
    document.getElementById('goalAdvRateValue').textContent = parseFloat(this.value).toFixed(2) + '%';
    showCalc();
    clearTimeout(state.goalTimeout);
    state.goalTimeout = setTimeout(calculateGoal, 300);
});

['goalTarget', 'goalInitial', 'goalYears', 'goalRate'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function() {
        showCalc();
        if (id === 'goalRate') {
            setFeesError(parseFloat($('goalRate').value) || 0, parseFloat($('goalFees').value) || 0, $('goalFeesError'));
        }
        clearTimeout(state.goalTimeout);
        state.goalTimeout = setTimeout(calculateGoal, 300);
    });
});
document.getElementById('goalRealTerms').addEventListener('change', function() {
    showCalc();
    clearTimeout(state.goalTimeout);
    state.goalTimeout = setTimeout(calculateGoal, 150);
});

// ============================================================
//  SPARM\u00C5L — ber\u00E4kning (TAX_REGIMES-drivna)
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

    var c = getCountry();
    var loc = c.locale;
    var curr = c.currency;

    var targetRaw  = parseFloat(document.getElementById('goalTarget').value)   || 0;
    var initialCap = parseFloat(document.getElementById('goalInitial').value)  || 0;
    var years      = Math.floor(parseFloat(document.getElementById('goalYears').value)) || 0;
    var annualRate = parseFloat(document.getElementById('goalRate').value)     || 0;
    var fees       = Math.max(0, Math.min(5, parseFloat(document.getElementById('goalFees').value) || 0));
    var inflation  = Math.max(0, Math.min(10, parseFloat(document.getElementById('goalInflation').value) || 0));
    var realTerms  = document.getElementById('goalRealTerms').checked;

    setFeesError(annualRate, fees, $('goalFeesError'), t('feesErrorGoal'));

    var monthlyRateNet   = (annualRate - fees) / 100 / 12;
    var monthlyRateGross = annualRate / 100 / 12;
    var months = years * 12;

    var inflationFactor = Math.pow(1 + inflation / 100, years);
    var nominalTarget   = realTerms ? targetRaw * inflationFactor : targetRaw;
    var realEquiv       = realTerms ? targetRaw : targetRaw / inflationFactor;

    // V\u00E4lj regim baserat p\u00E5 toggle
    var activeRegime, activeParams;
    if (state.goalTaxAdvOn && c.taxAdvRegime) {
        activeRegime = TAX_REGIMES[c.taxAdvRegime];
        activeParams = Object.assign({}, c.taxAdvParams);
        if (c.taxAdvRegime === 'ISK') {
            var sliderVal = parseFloat(document.getElementById('goalAdvRateSlider').value);
            activeParams.iskSchablonRate = isNaN(sliderVal) ? (c.taxAdvParams.iskSchablonRateDefault || 3.55) : sliderVal;
        }
    } else {
        activeRegime = TAX_REGIMES[c.standardRegime];
        activeParams = Object.assign({}, c.standardParams);
    }

    var resultsEl     = document.getElementById('goalSummary');
    var timelineEl    = document.getElementById('goalTimeline');
    var noSavingsEl   = document.getElementById('goalNoSavingsNeeded');
    var monthlyEl     = document.getElementById('goalMonthly');
    var monthlyNoteEl = document.getElementById('goalMonthlyNote');

    // Kontrollera om startkapital r\u00E4cker
    var netFromZero = activeRegime.simulate(initialCap, 0, monthlyRateNet, years, activeParams).netValue;

    if (netFromZero >= nominalTarget) {
        // Startkapital r\u00E4cker — inget m\u00E5nadssparande beh\u00F6vs
        resultsEl.classList.add('show');
        timelineEl.classList.add('show');
        noSavingsEl.style.display = 'block';
        document.getElementById('goalRealRow').style.display = 'none';
        monthlyEl.textContent = t('goalZeroSavings');
        monthlyNoteEl.textContent = t('goalStartCapitalSuffices') + ' ' + years + ' ' + t('goalYearsSuffix');

        var grossNoFees = computeFV(initialCap, 0, monthlyRateGross, months);
        var fvWithFeesNoTax = computeFV(initialCap, 0, monthlyRateNet, months);
        var totalFees = Math.max(grossNoFees - fvWithFeesNoTax, 0);

        var finalRes = activeRegime.simulate(initialCap, 0, monthlyRateNet, years, activeParams);

        if (!isValidNumber(finalRes.netValue)) {
            resultsEl.classList.remove('show');
            timelineEl.classList.remove('show');
            return;
        }

        document.getElementById('goalNominalTarget').textContent = formatCurrency(nominalTarget, loc, curr);
        document.getElementById('goalRealEquiv').textContent     = formatCurrency(realEquiv, loc, curr);
        document.getElementById('goalTotalIn').textContent       = formatCurrency(initialCap, loc, curr);
        document.getElementById('goalGain').textContent          = formatCurrency(Math.max(finalRes.netValue - initialCap, 0), loc, curr);
        document.getElementById('goalFeesResult').textContent   = formatCurrency(totalFees, loc, curr);

        var goalWarningEl = document.getElementById('goalWarning');
        goalWarningEl.style.display = finalRes.netValue > 1e9 ? 'block' : 'none';
        if (finalRes.netValue > 1e9) goalWarningEl.textContent = t('warningLargeNumbers');

        document.getElementById('goalTaxResultLabel').textContent = t(activeRegime.getUI().taxI18n);
        document.getElementById('goalTaxResult').textContent = formatCurrency(finalRes.totalTax, loc, curr);

        renderBreakdown('goalChart', 'goalLegend', nominalTarget, initialCap, finalRes.netValue, totalFees, finalRes.totalTax, t(activeRegime.getUI().legendI18n));

        var noSaveChartData = buildYearTimeline(years, initialCap, 0, monthlyRateNet, 'goalTableBody', activeRegime, activeParams);
        state.goalChartData = noSaveChartData;
        requestAnimationFrame(function() { drawTimelineChart(noSaveChartData, 'goalTimelineChart', 'goalChartTooltip'); });
        return;
    }
    noSavingsEl.style.display = 'none';

    // Bin\u00E4rs\u00F6kning f\u00F6r m\u00E5natligt sparande
    var lo = 0, hi = nominalTarget;
    for (var i = 0; i < 80; i++) {
        var mid = (lo + hi) / 2;
        if (activeRegime.simulate(initialCap, mid, monthlyRateNet, years, activeParams).netValue < nominalTarget) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    var requiredMonthly = (lo + hi) / 2;

    var totalIn  = initialCap + requiredMonthly * months;
    var finalRes = activeRegime.simulate(initialCap, requiredMonthly, monthlyRateNet, years, activeParams);
    var finalNet = finalRes.netValue;
    var actualTax = finalRes.totalTax;

    if (!isValidNumber(finalNet) || !isValidNumber(requiredMonthly)) {
        resultsEl.classList.remove('show');
        timelineEl.classList.remove('show');
        return;
    }

    var grossNoFees = computeFV(initialCap, requiredMonthly, monthlyRateGross, months);
    var fvWithFeesNoTax = computeFV(initialCap, requiredMonthly, monthlyRateNet, months);
    var totalFeesResult = Math.max(grossNoFees - fvWithFeesNoTax, 0);

    var goalUnreachable = finalNet < nominalTarget && requiredMonthly > nominalTarget * 0.5;

    // Kontonamn f\u00F6r notering
    var accountTypeStr;
    if (state.goalTaxAdvOn && c.taxAdvRegime) {
        var cui = c.ui[state.lang] || c.ui.sv;
        accountTypeStr = cui.taxAdvLabel || t('goalStandardAccount');
    } else {
        accountTypeStr = t('goalStandardAccount');
    }

    resultsEl.classList.add('show');
    timelineEl.classList.add('show');
    monthlyEl.textContent = formatCurrency(Math.ceil(requiredMonthly), loc, curr) + ' ' + t('perMonth');
    monthlyNoteEl.textContent = (goalUnreachable ? '\u26A0\uFE0F ' + t('goalUnreachable') + ' \u2014 ' : '')
        + t('goalUnder') + years + t('goalYearsSpan') + accountTypeStr;

    document.getElementById('goalNominalTarget').textContent = formatCurrency(nominalTarget, loc, curr);
    document.getElementById('goalRealEquiv').textContent     = formatCurrency(realEquiv, loc, curr);
    document.getElementById('goalRealRow').style.display     = 'flex';
    document.getElementById('goalTotalIn').textContent       = formatCurrency(totalIn, loc, curr);
    document.getElementById('goalGain').textContent          = formatCurrency(Math.max(finalNet - totalIn, 0), loc, curr);
    document.getElementById('goalFeesResult').textContent    = formatCurrency(totalFeesResult, loc, curr);

    document.getElementById('goalTaxResultLabel').textContent = t(activeRegime.getUI().taxI18n);
    document.getElementById('goalTaxResult').textContent = formatCurrency(actualTax, loc, curr);

    var goalWarningEl = document.getElementById('goalWarning');
    goalWarningEl.style.display = finalNet > 1e9 ? 'block' : 'none';
    if (finalNet > 1e9) goalWarningEl.textContent = t('warningLargeNumbers');

    renderBreakdown('goalChart', 'goalLegend', nominalTarget, totalIn, finalNet, totalFeesResult, actualTax, t(activeRegime.getUI().legendI18n));

    var goalChartData = buildYearTimeline(years, initialCap, requiredMonthly, monthlyRateNet, 'goalTableBody', activeRegime, activeParams);
    state.goalChartData = goalChartData;
    requestAnimationFrame(function() { drawTimelineChart(goalChartData, 'goalTimelineChart', 'goalChartTooltip'); });
}

// ============================================================
//  Flaggor och landsnamn
// ============================================================
var FLAGS = {
    // Norden
    SE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#006AA7"/><rect x="0" y="6" width="24" height="4" fill="#FECC02"/><rect x="7" y="0" width="4" height="16" fill="#FECC02"/></svg>',
    NO: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#BA0C2F"/><rect x="0" y="6" width="24" height="4" fill="#fff"/><rect x="7" y="0" width="4" height="16" fill="#fff"/><rect x="0" y="7" width="24" height="2" fill="#00205B"/><rect x="8" y="0" width="2" height="16" fill="#00205B"/></svg>',
    DK: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#C8102E"/><rect x="0" y="6" width="24" height="4" fill="#fff"/><rect x="7" y="0" width="4" height="16" fill="#fff"/></svg>',
    FI: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect x="0" y="6" width="24" height="4" fill="#003580"/><rect x="7" y="0" width="4" height="16" fill="#003580"/></svg>',
    IS: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#02529C"/><rect x="0" y="6" width="24" height="4" fill="#fff"/><rect x="7" y="0" width="4" height="16" fill="#fff"/><rect x="0" y="7" width="24" height="2" fill="#DC1E35"/><rect x="8" y="0" width="2" height="16" fill="#DC1E35"/></svg>',
    // Västeuropa
    DE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#000"/><rect y="5.33" width="24" height="5.33" fill="#DD0000"/><rect y="10.67" width="24" height="5.33" fill="#FFCE00"/></svg>',
    FR: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="8" height="16" fill="#002395"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#ED2939"/></svg>',
    // Brittiska öarna
    GB: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#012169"/><polygon points="0,0 10,8 0,16" fill="#fff"/><polygon points="24,0 14,8 24,16" fill="#fff"/><polygon points="0,0 4,8 0,16" fill="#C8102E"/><polygon points="24,0 20,8 24,16" fill="#C8102E"/><rect x="0" y="5" width="24" height="6" fill="#fff"/><rect x="10" y="0" width="4" height="16" fill="#fff"/><rect x="0" y="6" width="24" height="4" fill="#C8102E"/><rect x="11" y="0" width="2" height="16" fill="#C8102E"/></svg>',
    IE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="8" height="16" fill="#169B62"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#FF883E"/></svg>',
    // Benelux
    NL: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#21468B"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#AE1C28"/></svg>',
    BE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="8" height="16" fill="#000"/><rect x="8" width="8" height="16" fill="#FDDA24"/><rect x="16" width="8" height="16" fill="#EF3340"/></svg>',
    // Centraleuropa
    AT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#EF3340"/><rect y="5.33" width="24" height="5.33" fill="#fff"/></svg>',
    CH: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#FF0000"/><rect x="10" y="4" width="4" height="8" fill="#fff"/><rect x="8" y="6" width="8" height="4" fill="#fff"/></svg>',
    LI: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="8" fill="#002B7F"/><rect y="8" width="24" height="8" fill="#CE1126"/><rect x="6" y="3" width="3" height="4" fill="#FFD100"/></svg>',
    LU: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#00A1DE"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#ED2939"/></svg>',
    // Sydeuropa
    IT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="8" height="16" fill="#009246"/><rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#CE2B37"/></svg>',
    ES: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="4" fill="#AA151B"/><rect y="4" width="24" height="8" fill="#F1BF00"/><rect y="12" width="24" height="4" fill="#AA151B"/></svg>',
    PT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#006600"/><rect x="8.5" width="7" height="16" fill="#FF0000"/><circle cx="10.5" cy="8" r="3.5" fill="#FF0"/><rect x="10" y="7.5" width="1" height="3" fill="#003399"/></svg>',
    GR: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="1.78" fill="#0D5EAF"/><rect y="1.78" width="24" height="1.78" fill="#fff"/><rect y="3.56" width="24" height="1.78" fill="#0D5EAF"/><rect y="5.33" width="24" height="1.78" fill="#fff"/><rect y="7.11" width="24" height="1.78" fill="#0D5EAF"/><rect y="8.89" width="24" height="1.78" fill="#fff"/><rect y="10.67" width="24" height="1.78" fill="#0D5EAF"/><rect y="12.44" width="24" height="1.78" fill="#fff"/><rect y="14.22" width="24" height="1.78" fill="#0D5EAF"/><rect x="0" y="0" width="10" height="8.89" fill="#0D5EAF"/><rect x="4" y="2.2" width="2" height="4.5" fill="#fff"/><rect x="3" y="3.3" width="4" height="2.2" fill="#fff"/></svg>',
    CY: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><path d="M12 3 C12 4.5 15 6.5 16.5 6.5 C18 6.5 17 8 15.5 8.5 C14 9 13.5 8 12 8 C10.5 8 10 9 8.5 8.5 C7 8 6 6.5 7.5 6.5 C9 6.5 12 4.5 12 3Z" fill="#D4760A"/></svg>',
    MT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="12" height="16" fill="#fff"/><rect x="12" width="12" height="16" fill="#CF142B"/></svg>',
    MC: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="8" fill="#CE1126"/><rect y="8" width="24" height="8" fill="#fff"/></svg>',
    AD: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="8" height="16" fill="#0018A8"/><rect x="8" width="8" height="16" fill="#FEDD00"/><rect x="16" width="8" height="16" fill="#D50032"/></svg>',
    SM: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="8" fill="#fff"/><rect y="8" width="24" height="8" fill="#5EB6E4"/></svg>',
    // Baltikum
    EE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#0072CE"/><rect y="5.33" width="24" height="5.33" fill="#000"/><rect y="10.67" width="24" height="5.33" fill="#fff"/></svg>',
    LV: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#9E3039"/><rect y="6.4" width="24" height="3.2" fill="#fff"/></svg>',
    LT: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#FDB913"/><rect y="5.33" width="24" height="5.33" fill="#006A44"/><rect y="10.67" width="24" height="5.33" fill="#C1272D"/></svg>',
    // Östeuropa
    PL: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="8" fill="#fff"/><rect y="8" width="24" height="8" fill="#DC143C"/></svg>',
    CZ: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="8" fill="#fff"/><rect y="8" width="24" height="8" fill="#D7141A"/><polygon points="12,0 0,8 12,16" fill="#11457E"/></svg>',
    SK: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#0B4EA2"/><rect y="10.67" width="24" height="5.33" fill="#EE1C25"/><rect x="0" y="0" width="10" height="9" fill="#fff"/><path d="M3 2 L5 6 L9 6 L6 9 L7 13 L3 10.5 L-1 13 L0 9 L-3 6 L1 6Z" fill="#EE1C25"/></svg>',
    HU: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#CD2A3E"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#436F4D"/></svg>',
    RO: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="8" height="16" fill="#002B7F"/><rect x="8" width="8" height="16" fill="#FCD116"/><rect x="16" width="8" height="16" fill="#CE1126"/></svg>',
    BG: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#00966E"/><rect y="10.67" width="24" height="5.33" fill="#D62612"/></svg>',
    // Balkan
    HR: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#FF0000"/><rect y="5.33" width="24" height="5.33" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#171796"/></svg>',
    SI: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect y="5.33" width="24" height="5.33" fill="#005DA4"/><rect y="10.67" width="24" height="5.33" fill="#ED1C24"/></svg>'
};

var LANG_OPTIONS = [
    { value: 'sv', flag: 'SE', label: 'Svenska' },
    { value: 'en', flag: 'GB', label: 'English' }
];

// Bygg landslista dynamiskt fr\u00E5n COUNTRY_CONFIG
var CTRY_OPTIONS = [];
Object.keys(COUNTRY_CONFIG).forEach(function(code) {
    CTRY_OPTIONS.push({ value: code, flag: code });
});

function getCountryLabel(opt, lang) {
    lang = lang || state.lang;
    var c = COUNTRY_CONFIG[opt.value];
    if (!c) return opt.value;
    return (c.name && c.name[lang]) ? c.name[lang] : (c.name && c.name.sv ? c.name.sv : opt.value);
}

// ============================================================
//  Custom dropdown
// ============================================================
function initCustomDropdown(containerId, options, initialValue, getLabelFn, onChange) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var trigger = container.querySelector('.custom-select-trigger');
    var flagEl = container.querySelector('.custom-select-flag');
    var textEl = container.querySelector('.custom-select-text');
    var panel = container.querySelector('.custom-select-panel');
    var selectedValue = initialValue;
    var optionEls = [];

    function isOpen() { return !panel.hasAttribute('hidden'); }
    function open()   { panel.removeAttribute('hidden'); container.classList.add('open'); }
    function close()  { panel.setAttribute('hidden', ''); container.classList.remove('open'); }

    function selectOption(opt, el) {
        selectedValue = opt.value;
        flagEl.innerHTML = FLAGS[opt.flag] || '';
        textEl.textContent = getLabelFn(opt);
        optionEls.forEach(function(o) { o.el.classList.remove('selected'); });
        el.classList.add('selected');
        if (onChange) onChange(opt.value);
        close();
    }

    function renderPanel(lang) {
        panel.innerHTML = '';
        optionEls = [];
        // Sortera kopian alfabetiskt på landsnamn i aktuellt språk
        var sorted = options.slice().sort(function(a, b) {
            var la = getLabelFn(a, lang).toLowerCase();
            var lb = getLabelFn(b, lang).toLowerCase();
            if (la < lb) return -1;
            if (la > lb) return 1;
            return 0;
        });
        sorted.forEach(function(opt) {
            var div = document.createElement('div');
            div.className = 'custom-select-option';
            div.setAttribute('role', 'option');
            if (opt.value === selectedValue) div.classList.add('selected');
            var f = document.createElement('span');
            f.className = 'custom-select-option-flag';
            f.innerHTML = FLAGS[opt.flag] || '';
            div.appendChild(f);
            var t = document.createElement('span');
            t.textContent = getLabelFn(opt, lang);
            div.appendChild(t);
            div.addEventListener('click', function() { selectOption(opt, div); });
            panel.appendChild(div);
            optionEls.push({ value: opt.value, el: div });
        });
    }

    function setInitial(opt) {
        flagEl.innerHTML = FLAGS[opt.flag] || '';
        textEl.textContent = getLabelFn(opt);
        selectedValue = opt.value;
    }

    function getSelectedOption() {
        for (var i = 0; i < options.length; i++) {
            if (options[i].value === selectedValue) return options[i];
        }
        return options[0];
    }

    renderPanel(state.lang);
    var initOpt = null;
    for (var i = 0; i < options.length; i++) { if (options[i].value === initialValue) { initOpt = options[i]; break; } }
    setInitial(initOpt || options[0]);

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        isOpen() ? close() : open();
    });
    document.addEventListener('click', function() { if (isOpen()) close(); });
    trigger.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    panel.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { close(); trigger.focus(); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            var idx = -1;
            for (var i = 0; i < optionEls.length; i++) { if (optionEls[i].value === selectedValue) { idx = i; break; } }
            if (e.key === 'ArrowDown') idx = (idx + 1) % optionEls.length;
            else idx = (idx - 1 + optionEls.length) % optionEls.length;
            var sel = optionEls[idx];
            if (sel) { selectedValue = sel.value; sel.el.focus(); onOptionFocus(sel.el); }
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var sel = getSelectedOption();
            if (sel) selectOption(sel, optionEls.filter(function(o) { return o.value === sel.value; })[0].el);
        }
    });

    function onOptionFocus(el) {
        optionEls.forEach(function(o) { o.el.classList.remove('focus'); });
        el.classList.add('focus');
        el.scrollIntoView({ block: 'nearest' });
    }

    return {
        getValue: function() { return selectedValue; },
        setValue: function(val) {
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === val) { setInitial(options[i]); selectedValue = val; return; }
            }
        },
        updateLabels: function(lang) {
            renderPanel(lang);
            var sel = getSelectedOption();
            if (sel) textEl.textContent = getLabelFn(sel, lang);
        }
    };
}

// ============================================================
//  Initiera dropdowns
// ============================================================
var langDropdown = initCustomDropdown(
    'langDropdown',
    LANG_OPTIONS,
    'en',
    function(opt) { return opt.label; },
    function(value) {
        state.lang = value;
        countryDropdown.updateLabels(state.lang);
        translatePage();
        updateCountryUI();
        clearTimeout(state.advTimeout);
        clearTimeout(state.goalTimeout);
        state.advTimeout = setTimeout(calculateAdvanced, 50);
        state.goalTimeout = setTimeout(calculateGoal, 50);
    }
);

var countryDropdown = initCustomDropdown(
    'countryDropdown',
    CTRY_OPTIONS,
    'SE',
    getCountryLabel,
    function(value) {
        state.country = value;
        state.taxAdvOn = false;
        state.goalTaxAdvOn = false;
        document.getElementById('taxAdvEnabled').checked = false;
        document.getElementById('goalTaxAdvEnabled').checked = false;
        ['advRateGroup', 'goalAdvRateGroup'].forEach(function(id) {
            var el = document.getElementById(id); if (el) el.style.display = 'none';
        });
        updateCountryUI();
        clearTimeout(state.advTimeout);
        clearTimeout(state.goalTimeout);
        state.advTimeout = setTimeout(calculateAdvanced, 50);
        state.goalTimeout = setTimeout(calculateGoal, 50);
    }
);

// ============================================================
//  Initialisering
// ============================================================
window.addEventListener('load', function() {
    state.taxAdvOn     = document.getElementById('taxAdvEnabled').checked;
    state.goalTaxAdvOn = document.getElementById('goalTaxAdvEnabled').checked;

    translatePage();
    updateCountryUI();

    calculateAdvanced();
    calculateGoal();

    if (location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.protocol === 'file:') {
        try { runTests(); } catch (e) { console.error('runTests fel:', e); }
        try { runAppTests(); } catch (e) { console.error('runAppTests fel:', e); }
    }
});

// Auto-ber\u00E4kna vid \u00E4ndringar — Pengamaskin
var advInputs = ['advInitialCapital', 'advMonthlyAmount', 'advRate', 'advYears'];
advInputs.forEach(function(id) {
    var element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', function() {
            showCalc();
            clearTimeout(state.advTimeout);
            state.advTimeout = setTimeout(calculateAdvanced, 300);

            if (id === 'advRate') {
                setFeesError(parseFloat($('advRate').value) || 0, parseFloat($('fees').value) || 0, $('feesError'));
            }
        });
        element.addEventListener('blur', function() {
            if (id === 'advInitialCapital') validateInput(id, 0, 100000000, false);
            if (id === 'advMonthlyAmount') validateInput(id, 0, 1000000, false);
            if (id === 'advRate') validateInput(id, 0, 100, true);
            if (id === 'advYears') validateInput(id, 1, 100, true);
        });
    }
});
