// ============================================================
//  Globalt tillstånd
//  lang: 'sv' | 'en'
//  country: 'SE' | 'NO' | 'DK' | 'FI' | 'IS'
// ============================================================
const state = {
    lang: 'sv',
    country: 'SE',
    iskOn: false,
    goalIskOn: false,
    advChartData: [],
    goalChartData: [],
    advTimeout: null,
    goalTimeout: null
};

// Cachade DOM-referenser
const el = {};
function $(id) { return el[id] || (el[id] = document.getElementById(id)); }

// ============================================================
//  i18n — översättningslexikon (Svenska + Engelska)
//  Nycklar matchar data-i18n-attribut i index.html.
//  Alla UI-strängar som kan översättas finns här.
// ============================================================
const I18N = {
    sv: {
        // Header / globalt
        appName: 'Pengamaskinen',
        subtitle: '"Pengar är väl använd tid!" — Joakim von Anka',
        langLabel: 'Språk',
        countryLabel: 'Land',
        skipLink: 'Hoppa till innehållet',
        // Tabs
        tabAdvanced: 'Pengamaskin',
        tabGoal: 'Sparmål',
        // Column headers
        colParams: '① Parametrar',
        colResults: '② Resultat',
        colTimeline: '③ Tidslinje',
        // RPR (Ränta-på-ränta-explainer)
        rprToggle: '💡 Vad är ränta-på-ränta-effekten?',
        rprTitle: 'Enkelt förklarat — utan krångliga ord',
        rprPara1: 'Föreställ dig att du sätter in pengar på ett konto som ger 7\xa0% i avkastning per år. Det första året tjänar du ränta på det du satte in. Det andra året tjänar du ränta på <em>det du satte in + den ränta du redan fått</em>. Tredje året tjänar du ränta på allt det. Och så vidare.',
        rprPara2: 'Det låter som en liten grej — men det är som en snöboll som rullar nerför ett berg. I början är den liten. Mot slutet är den enorm.',
        rprExampleTitle: 'Konkret exempel:',
        rprExampleText: 'Du sparar <strong>1\xa0000\xa0kr/månad</strong> i <strong>30\xa0år</strong> med <strong>7\xa0% avkastning</strong> per år.',
        rprExampleDetail: 'Du har satt in totalt: <strong>360\xa0000\xa0kr</strong><br>Utan avkastning alls: <strong>360\xa0000\xa0kr</strong><br>Med enkel ränta (7\xa0% bara på det insatta, varje år): <strong>~\xa01\xa0116\xa0000\xa0kr</strong><br>Med ränta-på-ränta (7\xa0% på allt som växer): <strong>~\xa01\xa0220\xa0000\xa0kr</strong>',
        rprBarInsatt: 'Vad du satt in (1 000 kr/mån × 30 år)',
        rprBarVanlig: 'Med vanlig ränta efter 30 år (bara på insatt kapital)',
        rprBarRpr: 'Med ränta-på-ränta efter 30 år ✨',
        rprBarsNote: 'Exempel i SEK:',
        rprTakeaway: '🌱 <strong>Vad det innebär för dig:</strong> Ju tidigare du börjar, desto kraftfullare blir effekten. Tio extra år kan fördubbla slutsumman — inte för att du sparar dubbelt så mycket, utan för att pengarna hinner växa på sin egen tillväxt. Tid är din viktigaste tillgång.',
        // Advanced — formulär
        labelInitialCapital: 'Startkapital',
        tipInitialCapital: 'Pengar du redan har sparat och vill börja med. Har du 0 kr? Skriv 0. Har du ett buffertspar på 50 000 kr du vill räkna på? Skriv 50000.',
        labelMonthlyAmount: 'Månadligt sparande',
        tipMonthlyAmount: 'Hur mycket du sätter in varje månad. Det behöver inte vara ett jämnt belopp — testa dig fram! Ens 300 kr/mån gör stor skillnad över lång tid.',
        labelRate: 'Årlig avkastning (%)',
        tipRate: 'Hur mycket dina pengar förväntas växa per år. Sparkonto: 2–3 %. Global indexfond: historiskt ~8–10 %. Obligationer/räntefonder: 3–5 %. Ingen kan garantera framtida avkastning.',
        hintRate: 'Tolkas som nominell årsränta — t.ex. 5 % blir 5/12 % per månad. Effektiv årsavkastning blir då något högre (~5,12 %).',
        labelYears: 'Tidsperiod (år)',
        tipYears: 'Hur många år du tänker spara innan du tar ut pengarna. Ju längre tid, desto kraftigare ränta-på-ränta-effekt. 10 år är OK, 30 år är kraftfullt.',
        labelFees: 'Förvaltningsavgifter per år (%)',
        tipFees: 'Avgiften fonden tar varje år — syns inte på kontot men dras automatiskt. Billiga indexfonder tar 0,1–0,4 %. Dyra aktivt förvaltade fonder kan ta 1–2 %. Lägre avgift = mer pengar till dig.',
        labelCapitalGainsTax: 'Skatt på kapitalvinst',
        tipCapitalGainsTax: 'När du tar ut pengarna betalar du skatt på vinsten (inte på det du satt in). Skattesatsen varierar per land. Exempel: du satte in 100 000 kr, tar ut 200 000 kr → betalar skatt på 100 000 kr vinst.',
        capitalGainsTaxDesc: 'Gäller vid uttag enligt lag',
        hintCapitalGainsTax: 'Tillämpas på vinsten vid uttag (engångsbeskattning, inte årlig).',
        labelInflation: 'Inflation (%)',
        tipInflation: 'Inflation betyder att pengar tappar köpkraft med åren. Det som kostar 100 kr idag kostar kanske 122 kr om 10 år med 2 % inflation. Kalkylatorn visar då vad ditt sparande är värt i DAGENS penningvärde. Riksbankens mål är 2 %.',
        iskCheckboxLabel: 'ISK-konto (Investeringssparkonto)',
        tipISK: 'ISK är ett speciellt sparkonto hos banker och nätmäklare. Istället för att betala skatt när du säljer, betalar du en liten schablonskatt varje år — oavsett om du gått med vinst eller förlust. Oftast fördelaktigt om avkastningen är hög.',
        iskDescription: 'Schablonbeskattning på kapitalunderlaget varje år — ingen reavinstskatt vid uttag.',
        labelISKRate: 'ISK schablonränta 2026 (%)',
        tipISKRate: 'Den ränta som styr hur stor ISK-skatten är. Bestäms av staten varje år som statslåneräntan + 1 %. År 2026: 2,55 % + 1 % = 3,55 %. Du behöver inte ändra detta om du inte vet bättre.',
        iskRateHint: '2026: statslåneränta 2,55 % + 1 % = 3,55 % · Effektiv skatt = schablonränta × 30 % · Golv: 1,25 %. Kapitalunderlag = (värdet 1/1, 1/4, 1/7, 1/10 + årets insättningar) ÷ 4. De första 300 000 kr av kapitalunderlaget är skattefria (fr.o.m. 2026).',
        labelASKRate: 'ASK årlig lagerbeskatning',
        tipASKRate: 'Dansk Aktiesparekonto (ASK) beskattas med 17 % på årets totala avkastning — både realiserad och orealiserad. Skatten dras direkt från kontot varje år.',
        askRateFixed: 'Fast årlig skatt på avkastningen (lagerbeskatning)',
        askRateHint: 'Dansk ASK: 17 % skatt på årets avkastning (realiserad + orealiserad). Skatten dras direkt från kontot. Förluster kan framföras till nästa år.',
        // Advanced — resultat
        resultTitle: 'Detaljerade Resultat',
        labelTotalInvested: 'Totalt investerat:',
        labelGrossValue: 'Bruttovärde (ingen skatt/avgift):',
        labelFeesResult: 'Förvaltningsavgifter:',
        labelTaxesResult: 'Skatt på kapitalvinst:',
        labelRealValue: 'Realvärde (efter inflation):',
        labelNetValue: 'Slutvärde efter skatt & avgifter:',
        breakdownTitle: 'Fördelning av slutvärdet',
        validationPrefix: 'Vänligen ange',
        // Timeline
        timelineTitle: '📈 Tidslinje — Årlig tillväxt',
        thYear: 'År',
        thInvested: 'Investerat',
        thReturn: 'Avkastning',
        thReturnPlus: 'Avkastning +',
        thTotal: 'Totalt värde',
        // Goal — formulär
        goalHeading: 'Såhär mycket pengar vill jag ha',
        goalSubheading: 'Fyll i ditt mål — så räknar vi ut hur mycket du behöver spara varje månad.',
        labelGoalTarget: 'Jag vill ha',
        tipGoalTarget: 'Det belopp du vill ha sparat. Tänk på vad du sparar till — kontantinsats till bostad, pension, drömresa, ekonomisk frihet? Skriv in summan i kronor.',
        goalRealTerms: 'Beloppet är i dagens pengar (justerat för inflation)',
        tipGoalRealTerms: 'Ibockad: du tänker på vad pengarna är värda NU. Kalkylatorn räknar ut hur mycket mer du faktiskt behöver spara för att kompensera för inflation. Exempel: 1 miljon i dag = mer kronor om 20 år p.g.a. inflation.',
        goalRealTermsHint: 'Avmarkerat = du anger det belopp du faktiskt vill ha i framtiden (nominellt).',
        labelGoalInitial: 'Startkapital (befintliga besparingar)',
        tipGoalInitial: 'Pengar du redan har sparat och kan använda som startpunkt. Dessa pengar jobbar direkt mot ditt mål. Har du inget sparat ännu? Skriv 0.',
        labelGoalYears: 'Tidsperiod (år)',
        tipGoalYears: 'Hur många år du har på dig att nå ditt mål. Sparar du till pension om 30 år? Skriv 30. Kontantinsats om 5 år? Skriv 5. Kortare tid kräver mer sparande per månad.',
        labelGoalRate: 'Årlig avkastning (%)',
        tipGoalRate: 'Hur mycket dina pengar förväntas växa per år. Sparkonto: 2–3 %. Global indexfond: historiskt ~8–10 %. Sätt lägre om du är osäker — bättre att bli positivt överraskad.',
        hintGoalRate: 'Tolkas som nominell årsränta (delas med 12 till månadsränta).',
        labelGoalFees: 'Förvaltningsavgifter per år (%)',
        tipGoalFees: 'Avgiften fonden tar varje år — syns inte på kontot men dras automatiskt. Billiga indexfonder tar 0,1–0,4 %. Dyra aktivt förvaltade fonder kan ta 1–2 %. Lägre avgift = mer pengar till dig.',
        labelGoalCapitalGainsTax: 'Skatt på kapitalvinst',
        tipGoalCapitalGainsTax: 'När du tar ut pengarna betalar du skatt på vinsten (inte på det du satt in). Skattesatsen varierar per land.',
        goalCapitalGainsTaxDesc: 'Gäller vid uttag enligt lag',
        labelGoalInflation: 'Inflation (%)',
        tipGoalInflation: 'Inflation betyder att pengar tappar köpkraft med åren. Det som kostar 100 kr idag kostar kanske 122 kr om 10 år med 2 % inflation. Riksbankens mål är 2 %.',
        tipGoalISK: 'Skattegynnat konto som i vissa länder ger lägre eller uppskjuten skatt. Reglerna varierar per land — se förklaringen vid aktivering.',
        goalIskDescription: 'Skattegynnat konto — reglerna varierar per land.',
        labelGoalISKRate: 'ISK schablonränta (%)',
        tipGoalISKRate: 'Den ränta som styr hur stor ISK-skatten är. Bestäms av staten varje år.',
        labelGoalASKRate: 'ASK årlig lagerbeskatning',
        tipGoalASKRate: 'Dansk ASK beskattas med 17 % på årets avkastning.',
        goalAskRateFixed: 'Fast årlig skatt på avkastningen (lagerbeskatning)',
        goalAskRateHint: 'Dansk ASK: 17 % skatt på årets avkastning (realiserad + orealiserad). Skatten dras direkt från kontot.',
        // Goal — resultat
        goalNeedSave: 'DU BEHÖVER SPARA',
        goalNoSavings: '✅ Ditt startkapital räcker! Du behöver inte spara något extra månadsvis.',
        goalNominalLabel: 'Målbelopp (nominellt):',
        goalRealLabel: 'Motsvarar i dagens pengar:',
        goalTotalInLabel: 'Totalt du sätter in:',
        goalGainLabel: 'Avkastning (netto):',
        goalFeesLabel: 'Förvaltningsavgifter:',
        goalTaxLabel: 'Skatt:',
        goalBreakdownTitle: 'Fördelning',
        goalTimelineTitle: '📈 Sparplan — Årlig tillväxt',
        goalThTotal: 'Kontovärde',
        // Legend / chart
        legendInvested: 'Investerat',
        legendGain: 'Nettovinst',
        legendFees: 'Avgifter',
        legendTax: 'Skatt',
        legendISKTax: 'ISK-skatt',
        legendASKTax: 'ASK-skatt',
        chartTooltipYear: 'År',
        chartTooltipTotal: 'Totalt',
        chartTooltipInvested: 'Investerat',
        chartTooltipGain: 'Avkastning',
        chartAriaLabel: 'Diagram över årlig tillväxt. Använd piltangenter för att bläddra mellan åren.',
        // Felmeddelanden
        errorRequired: '⚠️ Obligatoriskt fält',
        errorMin: '⚠️ Minimumvärde:',
        errorMax: '⚠️ Maxvärde:',
        feesErrorHigher: '⚠️ Avgifterna kan inte vara större än avkastningen',
        feesErrorNetNegative: 'ℹ️ Avgiften är högre än avkastningen — kontot tappar i värde över tid.',
        feesErrorGoal: 'ℹ️ Avgiften är högre än avkastningen — målet kan vara svårt eller omöjligt att nå.',
        breakdownEmpty: 'Ange avkastning och/eller sparande för att se fördelning.',
        warningLargeNumbers: '⚠️ Mycket stora tal kan ha begränsad precision',
        goalZeroSavings: '0 kr/mån',
        goalStartCapitalSuffices: 'Ditt startkapital räcker på',
        goalYearsSuffix: 'år.',
        // Länders kontotyper (landsspecifika etiketter — inte bundna till språk)
        accountTypeAF: 'AF-konto (Aktiefondkonto)',
        accountTypeISK: 'ISK (Investeringssparkonto)',
        accountTypeASK_NO: 'ASK (Aksjesparekonto)',
        accountTypeASK_DK: 'ASK (Aktiesparekonto)',
        accountTypeOSK: 'OSK (Osakesäästötili)',
        accountTypeStandardNO: 'Vanlig aksjekonto',
        accountTypeStandardDK: 'Almindeligt depot',
        accountTypeStandardFI: 'Arvo-osuustili',
        accountTypeStandardIS: 'Venjulegur reikningur',
        accountTypeStandardSE: 'AF-konto (Aktiefondkonto)',
        taxTypeISK: 'ISK-skatt (betalas separat):',
        taxTypeASK: 'ASK-skatt (dras från kontot):',
        taxTypeCapitalGains: 'Skatt på kapitalvinst:',
        // Diagram-teckenförklaring
        chartLegendInvested: 'Investerat',
        chartLegendReturn: 'Avkastning',
        // Period suffix
        perMonth: '/mån',
        monthsOver: 'månader över',
    },
    en: {
        appName: 'The Money Machine',
        subtitle: '"Money is time well spent!" — Scrooge McDuck',
        langLabel: 'Language',
        countryLabel: 'Country',
        skipLink: 'Skip to content',
        tabAdvanced: 'Calculator',
        tabGoal: 'Savings Goal',
        colParams: '① Parameters',
        colResults: '② Results',
        colTimeline: '③ Timeline',
        rprToggle: '💡 What is compound interest?',
        rprTitle: 'Simply explained — no jargon',
        rprPara1: 'Imagine you deposit money into an account that earns 7% return per year. The first year you earn interest on what you deposited. The second year you earn interest on <em>what you deposited + the interest you already earned</em>. The third year you earn interest on all of it. And so on.',
        rprPara2: 'It sounds like a small thing — but it\'s like a snowball rolling down a mountain. It starts small. Near the bottom, it\'s enormous.',
        rprExampleTitle: 'Concrete example:',
        rprExampleText: 'You save <strong>1,000 kr/month</strong> for <strong>30 years</strong> with <strong>7% annual return</strong>.',
        rprExampleDetail: 'Total deposits: <strong>360,000 kr</strong><br>Without any return: <strong>360,000 kr</strong><br>With simple interest (7% only on deposits, each year): <strong>~1,116,000 kr</strong><br>With compound interest (7% on everything that grows): <strong>~1,220,000 kr</strong>',
        rprBarInsatt: 'What you deposited (1,000 kr/month × 30 years)',
        rprBarVanlig: 'With simple interest after 30 years (only on deposits)',
        rprBarRpr: 'With compound interest after 30 years ✨',
        rprBarsNote: 'Example in SEK:',
        rprTakeaway: '🌱 <strong>What it means for you:</strong> The earlier you start, the more powerful the effect. Ten extra years can double the final sum — not because you save twice as much, but because the money grows on its own growth. Time is your most valuable asset.',
        labelInitialCapital: 'Starting capital',
        tipInitialCapital: 'Money you already have saved and want to start with. Have 0? Write 0. Have a 50,000 buffer? Write 50000.',
        labelMonthlyAmount: 'Monthly savings',
        tipMonthlyAmount: 'How much you deposit each month. Even small amounts make a big difference over time.',
        labelRate: 'Annual return (%)',
        tipRate: 'How much your money is expected to grow per year. Savings account: 2–3%. Global index fund: historically ~8–10%. Bonds/interest funds: 3–5%. Future returns are never guaranteed.',
        hintRate: 'Interpreted as nominal annual rate — e.g. 5% becomes 5/12% per month. Effective annual return is then slightly higher (~5.12%).',
        labelYears: 'Time period (years)',
        tipYears: 'How many years you plan to save before withdrawing. The longer, the stronger the compound effect. 10 years is OK, 30 years is powerful.',
        labelFees: 'Annual management fees (%)',
        tipFees: 'The fee the fund charges each year — invisible on your statement but deducted automatically. Cheap index funds: 0.1–0.4%. Expensive actively managed funds: 1–2%. Lower fee = more money for you.',
        labelCapitalGainsTax: 'Capital gains tax',
        tipCapitalGainsTax: 'When you withdraw, you pay tax on the profit (not on what you deposited). The tax rate varies by country. Example: deposited 100,000, withdraw 200,000 → tax on 100,000 profit.',
        capitalGainsTaxDesc: 'Applied at withdrawal per national law',
        hintCapitalGainsTax: 'Applied on profit at withdrawal (one-time taxation, not annual).',
        labelInflation: 'Inflation (%)',
        tipInflation: 'Inflation means money loses purchasing power over time. What costs 100 today might cost 122 in 10 years at 2% inflation. The calculator shows what your savings are worth in TODAY\'s money.',
        iskCheckboxLabel: 'ISK account (Investment Savings Account)',
        tipISK: 'ISK is a special account at banks and online brokers. Instead of paying tax when you sell, you pay a small standard-rate tax each year — regardless of profit or loss. Usually advantageous when returns are high.',
        iskDescription: 'Standard-rate taxation on the capital base each year — no capital gains tax on withdrawal.',
        labelISKRate: 'ISK standard rate 2026 (%)',
        tipISKRate: 'The rate that determines the ISK tax. Set annually by the government. 2026: 2.55% + 1% = 3.55%. No need to change unless you know better.',
        iskRateHint: '2026: government bond rate 2.55% + 1% = 3.55% · Effective tax = standard rate × 30% · Floor: 1.25%. Capital base = (value Jan 1, Apr 1, Jul 1, Oct 1 + annual deposits) ÷ 4. The first 300,000 kr of the capital base is tax-free (from 2026).',
        labelASKRate: 'ASK annual inventory taxation',
        tipASKRate: 'Danish Share Savings Account (ASK) is taxed at 17% on the year\'s total return — both realized and unrealized. Tax is deducted directly from the account each year.',
        askRateFixed: 'Fixed annual tax on returns (inventory taxation)',
        askRateHint: 'Danish ASK: 17% tax on the year\'s return (realized + unrealized). Tax is deducted from the account. Losses can be carried forward.',
        resultTitle: 'Detailed Results',
        labelTotalInvested: 'Total invested:',
        labelGrossValue: 'Gross value (no tax/fees):',
        labelFeesResult: 'Management fees:',
        labelTaxesResult: 'Capital gains tax:',
        labelRealValue: 'Real value (inflation adjusted):',
        labelNetValue: 'Net value after tax & fees:',
        breakdownTitle: 'Breakdown of final value',
        validationPrefix: 'Please enter',
        timelineTitle: '📈 Timeline — Annual growth',
        thYear: 'Year',
        thInvested: 'Invested',
        thReturn: 'Return',
        thReturnPlus: 'Return +',
        thTotal: 'Total value',
        goalHeading: 'This is how much money I want',
        goalSubheading: 'Enter your goal — we\'ll calculate how much you need to save each month.',
        labelGoalTarget: 'I want',
        tipGoalTarget: 'The amount you want to have saved. Think about what you\'re saving for — down payment, pension, dream trip, financial freedom? Enter the amount.',
        goalRealTerms: 'The amount is in today\'s money (inflation adjusted)',
        tipGoalRealTerms: 'Checked: you think in terms of what money is worth NOW. The calculator figures out how much more you actually need to save to compensate for inflation.',
        goalRealTermsHint: 'Unchecked = you enter the amount you actually want in the future (nominal).',
        labelGoalInitial: 'Starting capital (existing savings)',
        tipGoalInitial: 'Money you already have saved that can work toward your goal right away. Have nothing saved yet? Write 0.',
        labelGoalYears: 'Time period (years)',
        tipGoalYears: 'How many years you have to reach your goal. Saving for retirement in 30 years? Enter 30. Down payment in 5 years? Enter 5. Shorter time requires more saving per month.',
        labelGoalRate: 'Annual return (%)',
        tipGoalRate: 'How much your money is expected to grow per year. Set lower if uncertain — better to be pleasantly surprised.',
        hintGoalRate: 'Interpreted as nominal annual rate (divided by 12 for monthly rate).',
        labelGoalFees: 'Annual management fees (%)',
        tipGoalFees: 'The fee the fund charges each year. Cheap index funds: 0.1–0.4%. Expensive actively managed funds: 1–2%. Lower fee = more money for you.',
        labelGoalCapitalGainsTax: 'Capital gains tax',
        tipGoalCapitalGainsTax: 'When you withdraw, you pay tax on the profit. The rate varies by country.',
        goalCapitalGainsTaxDesc: 'Applied at withdrawal per national law',
        labelGoalInflation: 'Inflation (%)',
        tipGoalInflation: 'Inflation means money loses purchasing power over time.',
        tipGoalISK: 'Tax-advantaged account that in some countries offers lower or deferred tax. Rules vary by country.',
        goalIskDescription: 'Tax-advantaged account — rules vary by country.',
        labelGoalISKRate: 'ISK standard rate (%)',
        tipGoalISKRate: 'The rate that determines the ISK tax. Set annually by the government.',
        labelGoalASKRate: 'ASK annual inventory taxation',
        tipGoalASKRate: 'Danish ASK is taxed at 17% on the year\'s return.',
        goalAskRateFixed: 'Fixed annual tax on returns (inventory taxation)',
        goalAskRateHint: 'Danish ASK: 17% tax on the year\'s return (realized + unrealized). Tax is deducted from the account.',
        goalNeedSave: 'YOU NEED TO SAVE',
        goalNoSavings: '✅ Your starting capital is enough! No additional monthly savings needed.',
        goalNominalLabel: 'Target amount (nominal):',
        goalRealLabel: 'Equivalent in today\'s money:',
        goalTotalInLabel: 'Total you deposit:',
        goalGainLabel: 'Return (net):',
        goalFeesLabel: 'Management fees:',
        goalTaxLabel: 'Tax:',
        goalBreakdownTitle: 'Breakdown',
        goalTimelineTitle: '📈 Savings Plan — Annual growth',
        goalThTotal: 'Account value',
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
        errorRequired: '⚠️ Required field',
        errorMin: '⚠️ Minimum value:',
        errorMax: '⚠️ Maximum value:',
        feesErrorHigher: '⚠️ Fees cannot exceed the return',
        feesErrorNetNegative: 'ℹ️ Fees exceed return — the account loses value over time.',
        feesErrorGoal: 'ℹ️ Fees exceed return — the goal may be difficult or impossible to reach.',
        breakdownEmpty: 'Enter return and/or savings to see the breakdown.',
        warningLargeNumbers: '⚠️ Very large numbers may have limited precision',
        goalZeroSavings: '0/month',
        goalStartCapitalSuffices: 'Your starting capital is enough for',
        goalYearsSuffix: 'years.',
        accountTypeAF: 'AF account (Equity Fund Account)',
        accountTypeISK: 'ISK (Investment Savings Account)',
        accountTypeASK_NO: 'ASK (Share Savings Account)',
        accountTypeASK_DK: 'ASK (Share Savings Account)',
        accountTypeOSK: 'OSK (Equity Savings Account)',
        accountTypeStandardNO: 'Regular share account',
        accountTypeStandardDK: 'Regular depot',
        accountTypeStandardFI: 'Book-entry account',
        accountTypeStandardIS: 'Regular account',
        accountTypeStandardSE: 'AF account (Equity Fund Account)',
        taxTypeISK: 'ISK tax (paid separately):',
        taxTypeASK: 'ASK tax (deducted from account):',
        taxTypeCapitalGains: 'Capital gains tax:',
        chartLegendInvested: 'Invested',
        chartLegendReturn: 'Return',
        perMonth: '/month',
        monthsOver: 'months over',
    }
};

function t(key) {
    const lang = state.lang || 'sv';
    const dict = I18N[lang] || I18N.sv;
    return dict[key] !== undefined ? dict[key] : (I18N.sv[key] || key);
}

function tForLang(key, lang) {
    const dict = I18N[lang] || I18N.sv;
    return dict[key] !== undefined ? dict[key] : (I18N.sv[key] || key);
}

// ============================================================
//  Landshantering — hämta aktiv landskonfiguration
// ============================================================
function getCountry() {
    return getCountryConfig(state.country);
}

function activeCurrencySym() {
    const c = getCountry();
    return c.currency === 'SEK' ? 'kr' : c.currency === 'NOK' ? 'kr' : c.currency === 'DKK' ? 'kr' : c.currency === 'EUR' ? '€' : 'kr';
}

function getLocale() {
    return getCountry().locale;
}

// ============================================================
//  UI-översättning — uppdatera alla data-i18n-element
// ============================================================
function translatePage(lang) {
    lang = lang || state.lang;

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        el.textContent = tForLang(el.getAttribute('data-i18n'), lang);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
        el.innerHTML = tForLang(el.getAttribute('data-i18n-html'), lang);
    });
    document.querySelectorAll('[data-i18n-tip]').forEach(function(el) {
        el.setAttribute('data-tip', tForLang(el.getAttribute('data-i18n-tip'), lang));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
        el.setAttribute('aria-label', tForLang(el.getAttribute('data-i18n-aria'), lang));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
        el.setAttribute('title', tForLang(el.getAttribute('data-i18n-title'), lang));
    });

    document.documentElement.lang = lang;
    document.title = tForLang('appName', lang) + ' – ' + (lang === 'sv' ? 'Gratis investeringskalkylator' : 'Free investment calculator');
}

function formatTaxRate(rate) {
    return parseFloat((rate * 100).toFixed(2)) + ' %';
}

// ============================================================
//  Uppdatera landsspecifik UI (kontotypsetiketter, skattesatser)
// ============================================================
function updateCountryUI() {
    const c = getCountry();
    const sym = activeCurrencySym();

    // Uppdatera valutasymboler i input-grupper
    ['advCurrencyUnit','advMonthlyCurrencyUnit','goalCurrencyUnit','goalInitialCurrencyUnit'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = sym;
    });

    // Uppdatera kapitalvinstsskatt-visning
    var taxDisplay = formatTaxRate(c.capitalGainsTax);
    if (c.capitalGainsTaxHigh) {
        taxDisplay = formatTaxRate(c.capitalGainsTax) + ' / ' + formatTaxRate(c.capitalGainsTaxHigh);
    }
    var taxDisplays = document.querySelectorAll('#taxRateDisplay, #advTaxRateDisplay');
    taxDisplays.forEach(function(el) { el.textContent = taxDisplay; });
    var goalTaxDisplay = document.getElementById('goalTaxRateDisplay');
    if (goalTaxDisplay) goalTaxDisplay.textContent = taxDisplay;

    // Uppdatera landsspecifik skattebeskrivning
    var taxDesc = document.getElementById('taxRateDescription');
    var goalTaxDesc = document.getElementById('goalTaxRateDescription');

    // Hantera skattegynnat konto-sektion
    var advSection = document.getElementById('taxAdvSection');
    var goalAdvSection = document.getElementById('goalTaxAdvSection');

    if (c.hasTaxAdvantaged) {
        if (advSection) advSection.style.display = '';
        if (goalAdvSection) goalAdvSection.style.display = '';

        var advType = c.taxAdvantagedType;
        var checkboxText, checkboxLabel, tipText, descriptionText;
        var lang = state.lang;

        if (advType === 'ISK') {
            checkboxText = lang === 'sv' ? 'ISK-konto (Investeringssparkonto)' : 'ISK (Investment Savings Account)';
            tipText = t('tipISK');
            descriptionText = t('iskDescription');
        } else if (advType === 'ASK_ANNUAL') {
            checkboxText = lang === 'sv' ? 'ASK (Aktiesparekonto)' : 'ASK (Share Savings Account)';
            tipText = t('tipASKRate');
            descriptionText = lang === 'sv'
                ? '17 % årlig lagerbeskatning — skatten dras direkt från kontot varje år.'
                : '17% annual inventory taxation — tax is deducted from the account each year.';
        } else if (advType === 'DEFERRED') {
            if (state.country === 'NO') {
                checkboxText = lang === 'sv' ? 'ASK (Aksjesparekonto)' : 'ASK (Share Savings Account)';
                tipText = lang === 'sv'
                    ? 'Norsk ASK: uppskjuten skatt med skjermingsfradrag. En riskfri avkastning (satt av Skatteetaten, ~2,5 %) dras av från vinsten innan skatt beräknas. Skatt betalas först vid uttag.'
                    : 'Norwegian ASK: deferred tax with shield deduction. A risk-free return (set by Skatteetaten, ~2.5%) is deducted from gains before tax is calculated. Tax paid only on withdrawal.';
                descriptionText = lang === 'sv'
                    ? 'Uppskjuten skatt med skjermingsfradrag (~2,5 %/år) — beskattas vid uttag (37,84 % på vinsten efter avdrag).'
                    : 'Deferred tax with shield deduction (~2.5%/year) — taxed upon withdrawal (37.84% on gains after deduction).';
            } else {
                checkboxText = lang === 'sv' ? 'OSK (Osakesäästötili)' : 'OSK (Equity Savings Account)';
                tipText = lang === 'sv'
                    ? 'Finsk OSK: uppskjuten skatt — du betalar skatt först vid uttag. Max 100 000 € insättningar.'
                    : 'Finnish OSK: deferred tax — you pay tax only on withdrawal. Max €100,000 deposits.';
                descriptionText = lang === 'sv'
                    ? 'Uppskjuten skatt — beskattas först vid uttag (30/34 % på vinsten).'
                    : 'Deferred tax — taxed only upon withdrawal (30/34% on gains).';
            }
        }

        var advCb = document.getElementById('iskCheckboxText');
        var goalCb = document.getElementById('goalIskCheckboxText');
        var advDesc = document.getElementById('iskDescription');
        var goalDesc = document.getElementById('goalIskDescription');
        var advTip = document.querySelector('#taxAdvSection .info-tip');
        var goalTip = document.querySelector('#goalTaxAdvSection .info-tip');

        if (advCb) advCb.textContent = checkboxText;
        if (goalCb) goalCb.textContent = checkboxText;
        if (advDesc) advDesc.textContent = descriptionText;
        if (goalDesc) goalDesc.textContent = descriptionText;
        if (advTip) advTip.setAttribute('data-tip', tipText);
        if (goalTip) goalTip.setAttribute('data-tip', tipText);

        // Visa/dölj landsspecifika fält baserat på taxAdvantagedType
        var iskRateGrp = document.getElementById('iskRateGroup');
        var askRateGrp = document.getElementById('askRateGroup');
        var goalIskRateGrp = document.getElementById('goalIskRateGroup');
        var goalAskRateGrp = document.getElementById('goalAskRateGroup');

        var iskEnabled = state.iskOn;
        var goalIskEnabled = state.goalIskOn;

        if (advType === 'ISK') {
            if (iskRateGrp) iskRateGrp.style.display = iskEnabled ? 'block' : 'none';
            if (askRateGrp) askRateGrp.style.display = 'none';
            if (goalIskRateGrp) goalIskRateGrp.style.display = goalIskEnabled ? 'block' : 'none';
            if (goalAskRateGrp) goalAskRateGrp.style.display = 'none';
        } else if (advType === 'ASK_ANNUAL') {
            if (iskRateGrp) iskRateGrp.style.display = 'none';
            if (askRateGrp) askRateGrp.style.display = iskEnabled ? 'block' : 'none';
            if (goalIskRateGrp) goalIskRateGrp.style.display = 'none';
            if (goalAskRateGrp) goalAskRateGrp.style.display = goalIskEnabled ? 'block' : 'none';
        } else {
            if (iskRateGrp) iskRateGrp.style.display = 'none';
            if (askRateGrp) askRateGrp.style.display = 'none';
            if (goalIskRateGrp) goalIskRateGrp.style.display = 'none';
            if (goalAskRateGrp) goalAskRateGrp.style.display = 'none';
        }
    } else {
        // Island — inget skattegynnat konto
        if (advSection) advSection.style.display = 'none';
        if (goalAdvSection) goalAdvSection.style.display = 'none';
        var iskRateGrp = document.getElementById('iskRateGroup');
        var askRateGrp = document.getElementById('askRateGroup');
        var goalIskRateGrp = document.getElementById('goalIskRateGroup');
        var goalAskRateGrp = document.getElementById('goalAskRateGroup');
        if (iskRateGrp) iskRateGrp.style.display = 'none';
        if (askRateGrp) askRateGrp.style.display = 'none';
        if (goalIskRateGrp) goalIskRateGrp.style.display = 'none';
        if (goalAskRateGrp) goalAskRateGrp.style.display = 'none';
        // Återställ kapitalvinstgrupperna som kan ha dimmats av ISK-toggle
        if ($('taxRateGroup')) { $('taxRateGroup').style.opacity = '1'; $('taxRateGroup').style.pointerEvents = 'auto'; }
        if ($('goalTaxGroup')) { $('goalTaxGroup').style.opacity = '1'; $('goalTaxGroup').style.pointerEvents = 'auto'; }
    }

    // Uppdatera varningsmeddelande
    var advWarning = document.getElementById('advWarning');
    if (advWarning) advWarning.textContent = t('warningLargeNumbers');
}

// ============================================================
//  Delade hjälpfunktioner
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

function setupIskToggle(checkboxId, advRateGroupId, askRateGroupId, taxGroupId, stateKey, timeoutKey, recalcFn, debounceMs) {
    var cb = document.getElementById(checkboxId);
    if (!cb) return;
    cb.addEventListener('change', function () {
        state[stateKey] = this.checked;
        var c = getCountry();
        var advType = c.taxAdvantagedType;
        var taxGroup = document.getElementById(taxGroupId);
        var advRateGrp = document.getElementById(advRateGroupId);
        var askRateGrp = document.getElementById(askRateGroupId);

        if (advType === 'ISK') {
            if (advRateGrp) advRateGrp.style.display = this.checked ? 'block' : 'none';
        }
        if (advType === 'ASK_ANNUAL') {
            if (askRateGrp) askRateGrp.style.display = this.checked ? 'block' : 'none';
        }

        if (taxGroup) {
            taxGroup.style.opacity = this.checked ? '0.4' : '1';
            taxGroup.style.pointerEvents = this.checked ? 'none' : 'auto';
        }
        document.querySelectorAll('.results.show').forEach(function(r) { r.classList.add('calculating'); });
        clearTimeout(state[timeoutKey]);
        state[timeoutKey] = setTimeout(recalcFn, debounceMs);
    });
}

function buildYearTimeline(years, startCapital, monthlyAmount, monthlyRateNet, tbodyId, danishAskTaxRate) {
    years = Math.floor(years);
    var frag = document.createDocumentFragment();
    var chartData = [];
    var balance = startCapital;
    var invested = startCapital;
    var prevGain = null;
    var loc = getLocale();
    var curr = getCountry().currency;
    var carryForwardLoss = 0;

    for (var year = 1; year <= years; year++) {
        var balBeforeYear = balance;
        for (var m = 0; m < 12; m++) {
            balance = balance * (1 + monthlyRateNet) + monthlyAmount;
            invested += monthlyAmount;
        }
        // Dansk ASK — årlig 17 % lagerbeskatning (samma logik som simulateDanishASK)
        if (danishAskTaxRate) {
            var yrGain = balance - balBeforeYear - (monthlyAmount * 12);
            if (carryForwardLoss > 0) {
                var used = Math.min(yrGain, carryForwardLoss);
                yrGain -= used;
                carryForwardLoss -= used;
            }
            if (yrGain > 0) {
                balance -= yrGain * danishAskTaxRate;
            } else if (yrGain < 0) {
                carryForwardLoss += -yrGain;
            }
        }
        var gain = balance - invested;
        var delta = prevGain === null ? null : gain - prevGain;
        prevGain = gain;
        chartData.push({ year: year, invested: invested, gain: gain, total: balance });
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
        strong.textContent = formatCurrency(balance, loc, curr);
        c5.appendChild(strong);
        tr.appendChild(c5);
        frag.appendChild(tr);
    }
    var tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    tbody.appendChild(frag);
    return chartData;
}

function renderBreakdown(chartElId, legendElId, base, invested, netValue, fees, taxAmt, isk, labels) {
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

    var c = getCountry();
    var taxType = c.taxAdvantagedType;
    var iskActive = isk && (taxType === 'ISK' || taxType === 'ASK_ANNUAL' || taxType === 'DEFERRED');

    [[iPct,'chart-invested'],[gPct,'chart-interest'],[fPct,'chart-fees'],[tPct,'chart-taxes']].forEach(function(s) {
        var seg = document.createElement('div');
        seg.className = 'chart-segment ' + s[1];
        seg.style.width = s[0] + '%';
        if (s[0] > 5) seg.textContent = Math.round(s[0]) + '%';
        chartEl.appendChild(seg);
    });

    var taxLabel;
    if (iskActive) {
        if (taxType === 'ISK') taxLabel = t('legendISKTax');
        else if (taxType === 'ASK_ANNUAL') taxLabel = t('legendASKTax');
        else taxLabel = t('legendTax');
    } else {
        taxLabel = t('legendTax');
    }

    [[labels.invested,'chart-invested'],[labels.gain,'chart-interest'],[t('legendFees'),'chart-fees'],[taxLabel,'chart-taxes']].forEach(function(r) {
        var item = document.createElement('div');
        item.className = 'legend-item';
        var c = document.createElement('div');
        c.className = 'legend-color ' + r[1];
        item.appendChild(c);
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
        console.warn('validateInput: inget error-element hittat för "' + id + '" — validering förbigås');
        return true;
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
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

document.getElementById('advInflation').addEventListener('input', function() {
    var val = parseFloat(this.value);
    if (val < 0) this.value = 0;
    if (val > 10) this.value = 10;
    document.getElementById('advInflationValue').textContent = parseFloat(this.value).toFixed(1) + '%';
    clearTimeout(state.advTimeout);
    state.advTimeout = setTimeout(calculateAdvanced, 300);
});

setupIskToggle('iskEnabled', 'iskRateGroup', 'askRateGroup', 'taxRateGroup', 'iskOn', 'advTimeout', calculateAdvanced, 150);

document.getElementById('iskRate').addEventListener('input', function() {
    var val = parseFloat(this.value);
    document.getElementById('iskRateValue').textContent = val.toFixed(2) + '%';
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
        var n = parseFloat(val);
        var loc = getLocale();
        var curr = getCountry().currency;
        if (n === 0) { hint.textContent = '0 ' + activeCurrencySym(); return; }
        var grouped = new Intl.NumberFormat(loc).format(Math.round(n));
        var sym = activeCurrencySym();
        var fmtDec = function(v) { return parseFloat(v.toFixed(2)).toString().replace('.', ','); };
        var millionsWord = state.lang === 'sv' ? 'miljoner' : 'million';
        var millionWord = state.lang === 'sv' ? 'miljon' : 'million';
        var billionsWord = state.lang === 'sv' ? 'miljarder' : 'billion';
        if (n >= 1e9) { hint.textContent = grouped + ' ' + sym + ' (' + fmtDec(n / 1e9) + ' ' + billionsWord + ')'; return; }
        if (n >= 1e6) { var m = n / 1e6; hint.textContent = grouped + ' ' + sym + ' (' + fmtDec(m) + (m === 1 ? ' ' + millionWord : ' ' + millionsWord) + ')'; return; }
        if (n >= 1e3) { hint.textContent = grouped + ' ' + sym; return; }
        hint.textContent = grouped + ' ' + sym;
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
        ['advSummary','advTimeline'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
        return;
    }

    var c = getCountry();
    var loc = c.locale;
    var curr = c.currency;
    var sym = activeCurrencySym();

    var initialCapital  = parseFloat(document.getElementById('advInitialCapital').value) || 0;
    var monthlyAmount   = parseFloat(document.getElementById('advMonthlyAmount').value)  || 0;
    var annualRate      = parseFloat(document.getElementById('advRate').value)            || 0;
    var years           = Math.floor(parseFloat(document.getElementById('advYears').value))           || 0;
    var fees            = Math.max(0, Math.min(5, parseFloat(document.getElementById('fees').value) || 0));
    var inflation       = Math.max(0, Math.min(10, parseFloat(document.getElementById('advInflation').value) || 0));
    var iskSchablonRate = Math.max(0, Math.min(15, parseFloat(document.getElementById('iskRate').value) || 0));

    setFeesError(annualRate, fees, $('feesError'), t('feesErrorNetNegative'));

    var monthlyRateGross = annualRate / 100 / 12;
    var monthlyRateNet   = (annualRate - fees) / 100 / 12;
    var months = years * 12;

    var grossValue = computeGrossValue(initialCapital, monthlyAmount, annualRate, years);
    var netAfterFees = computeNetAfterFees(initialCapital, monthlyAmount, annualRate, fees, years);

    var totalInvested = initialCapital + monthlyAmount * months;
    var totalFees     = grossValue - netAfterFees;

    var netValue, taxesOwed, iskAccountValue = null;
    var advType = c.taxAdvantagedType;

    if (state.iskOn && advType) {
        var config = {
            capitalGainsTax: c.capitalGainsTax,
            capitalGainsTaxHigh: c.capitalGainsTaxHigh,
            capitalGainsTaxThreshold: c.capitalGainsTaxThreshold,
            taxAdvantagedType: advType,
            askAnnualTax: c.askAnnualTax,
            iskSkatt: c.iskSkatt || 0.30,
            iskSchablonGolv: c.iskSchablonGolv || 1.25
        };

        if (advType === 'ISK') {
            var iskResult = simulateISK(initialCapital, monthlyAmount, monthlyRateNet, years,
                iskSchablonRate, c.iskFribelopp, c.iskSkatt || 0.30, c.iskSchablonGolv || 1.25);
            iskAccountValue = iskResult.balance;
            netValue  = iskResult.balance - iskResult.totalISKtax;
            taxesOwed = iskResult.totalISKtax;
        } else if (advType === 'ASK_ANNUAL') {
            var askResult = simulateDanishASK(initialCapital, monthlyAmount, monthlyRateNet, years, c.askAnnualTax || 0.17);
            iskAccountValue = askResult.balance;
            netValue  = askResult.balance;
            taxesOwed = askResult.totalTax;
        } else {
            // DEFERRED — ASK (NO) / OSK (FI) — uppskjuten skatt
            if (state.country === 'NO' && c.skjermingsrente !== undefined) {
                var noResult = simulateNorwegianASK(initialCapital, monthlyAmount, monthlyRateNet, years,
                    c.capitalGainsTax, c.skjermingsrente);
                iskAccountValue = noResult.balance;
                netValue  = noResult.balance - noResult.totalTax;
                taxesOwed = noResult.totalTax;
            } else {
                var fv = computeFV(initialCapital, monthlyAmount, monthlyRateNet, months);
                var totalIn = initialCapital + monthlyAmount * months;
                var gain = fv - totalIn;
                taxesOwed = computeCapitalGainsTax(gain, c.capitalGainsTax, c.capitalGainsTaxThreshold, c.capitalGainsTaxHigh);
                netValue = fv - taxesOwed;
                iskAccountValue = fv;
            }
        }
    } else {
        taxesOwed  = computeCapitalGainsTax(netAfterFees - totalInvested, c.capitalGainsTax, c.capitalGainsTaxThreshold, c.capitalGainsTaxHigh);
        netValue   = netAfterFees - taxesOwed;
    }

    if (!isValidNumber(grossValue) || !isValidNumber(netValue) || !isValidNumber(taxesOwed)) {
        ['advSummary','advTimeline'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
        return;
    }

    var inflationFactor = Math.pow(1 + inflation / 100, years);
    var realValue = netValue / inflationFactor;
    if (!isValidNumber(realValue)) {
        ['advSummary','advTimeline'].forEach(function(id) { document.getElementById(id).classList.remove('show'); });
        return;
    }

    // Etiketter — dynamiska baserat på kontotyp
    var taxesLabelEl = document.getElementById('advTaxesLabel');
    var grossLabelEl = document.getElementById('advGrossLabel');
    var iskActive = state.iskOn && advType;

    if (iskActive) {
        if (advType === 'ISK') {
            taxesLabelEl.textContent = t('taxTypeISK');
            grossLabelEl.textContent = c.taxAdvantagedType === 'ISK'
                ? (state.lang === 'sv' ? 'ISK-kontots värde:' : 'ISK account value:')
                : (state.lang === 'sv' ? 'Kontots värde:' : 'Account value:');
        } else if (advType === 'ASK_ANNUAL') {
            taxesLabelEl.textContent = t('taxTypeASK');
            grossLabelEl.textContent = state.lang === 'sv' ? 'ASK-kontots värde:' : 'ASK account value:';
        } else {
            taxesLabelEl.textContent = t('taxTypeCapitalGains');
            grossLabelEl.textContent = state.lang === 'sv' ? 'Kontots värde (före skatt):' : 'Account value (pre-tax):';
        }
    } else {
        taxesLabelEl.textContent = t('taxTypeCapitalGains');
        grossLabelEl.textContent = t('labelGrossValue');
    }

    document.getElementById('advTotalInvested').textContent = formatCurrency(totalInvested, loc, curr);
    document.getElementById('advGrossValue').textContent    = iskAccountValue ? formatCurrency(iskAccountValue, loc, curr) : formatCurrency(grossValue, loc, curr);
    document.getElementById('advTotalFees').textContent     = formatCurrency(totalFees, loc, curr);
    document.getElementById('advTaxes').textContent         = formatCurrency(taxesOwed, loc, curr);
    document.getElementById('advNetValue').textContent      = formatCurrency(netValue, loc, curr);
    document.getElementById('advRealValue').textContent     = formatCurrency(realValue, loc, curr);

    var advWarning = document.getElementById('advWarning');
    advWarning.style.display = netValue > 1e9 ? 'block' : 'none';
    if (netValue > 1e9) advWarning.textContent = t('warningLargeNumbers');

    // Fördelningsdiagram
    var gainLabels = { invested: t('legendInvested'), gain: t('legendGain') };
    renderBreakdown('advChart', 'advLegend', grossValue, totalInvested, netValue, totalFees, taxesOwed, iskActive, gainLabels);

    ['advSummary','advTimeline'].forEach(function(id) { document.getElementById(id).classList.add('show'); });

    // Tidslinje
    var askTaxForTimeline = (state.iskOn && advType === 'ASK_ANNUAL') ? (c.askAnnualTax || 0.17) : undefined;
    var chartData = buildYearTimeline(years, initialCapital, monthlyAmount, monthlyRateNet, 'timelineBody', askTaxForTimeline);
    state.advChartData = chartData;
    requestAnimationFrame(function() { drawTimelineChart(chartData); });
}

// ============================================================
//  TIDSLINJE — diagram (delas av Pengamaskin & Sparmål)
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

    // Rutnät
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

    // Område — investerat
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(dataPoints[0].invested));
    dataPoints.forEach(function(d, i) { ctx.lineTo(xPos(i), yPos(d.invested)); });
    ctx.lineTo(xPos(dataPoints.length - 1), yPos(0));
    ctx.lineTo(xPos(0), yPos(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(139,90,43,0.35)';
    ctx.fill();

    // Linje — investerat
    ctx.beginPath();
    dataPoints.forEach(function(d, i) { i === 0 ? ctx.moveTo(xPos(i), yPos(d.invested)) : ctx.lineTo(xPos(i), yPos(d.invested)); });
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Område — avkastning ovanpå investerat
    ctx.beginPath();
    ctx.moveTo(xPos(0), yPos(dataPoints[0].invested));
    dataPoints.forEach(function(d, i) { ctx.lineTo(xPos(i), yPos(d.total)); });
    ctx.lineTo(xPos(dataPoints.length - 1), yPos(dataPoints[dataPoints.length - 1].invested));
    for (var k = dataPoints.length - 1; k >= 0; k--) ctx.lineTo(xPos(k), yPos(dataPoints[k].invested));
    ctx.closePath();
    ctx.fillStyle = 'rgba(212,166,0,0.4)';
    ctx.fill();

    // Linje — totalt värde
    ctx.beginPath();
    dataPoints.forEach(function(d, i) { i === 0 ? ctx.moveTo(xPos(i), yPos(d.total)) : ctx.lineTo(xPos(i), yPos(d.total)); });
    ctx.strokeStyle = '#d4a600';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X-axel
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
            var yearLabel = (state.lang === 'sv' ? 'År ' : 'Yr ') + d.year;
            ctx.fillText(yearLabel, x, H - PAD.bottom + 18);
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

    // Tooltip (mus + tangentbord)
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
        var yearLabel = (state.lang === 'sv' ? 'År ' : 'Yr ') + d.year;
        var totalLabel = (state.lang === 'sv' ? 'Totalt: ' : 'Total: ');
        var investedLabel = (state.lang === 'sv' ? 'Investerat: ' : 'Invested: ');
        var gainLabel = (state.lang === 'sv' ? 'Avkastning: ' : 'Return: ');
        tooltip.textContent = '';
        [yearLabel, totalLabel + formatCurrency(d.total, loc, curr), investedLabel + formatCurrency(d.invested, loc, curr), gainLabel + formatCurrency(d.gain, loc, curr)].forEach(function (t, i) {
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

    canvas.onfocus = function () {
        canvas.style.boxShadow = '0 0 0 2px #d4a600';
        showTooltip(focusIdx);
    };
    canvas.onblur = function () {
        canvas.style.boxShadow = 'none';
        hideTooltip();
    };
    canvas.onkeydown = function (e) {
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
    function tst(name, cond, detail) { if (cond) { ok++; console.log('  OK ' + name); } else { fail++; console.error('  FEL ' + name + (detail ? ' — ' + detail : '')); } }

    (function() {
        var tmpTbody = document.createElement('tbody');
        tmpTbody.id = '_appTestTbody';
        document.body.appendChild(tmpTbody);
        var cd = buildYearTimeline(3, 10000, 500, 0.07 / 12, '_appTestTbody');
        tst('buildYearTimeline: returnerar chartData med 3 år', cd.length === 3, 'fick ' + cd.length);
        tst('buildYearTimeline: chartData[0] har year, invested, gain, total',
            cd[0].year === 1 && cd[0].invested > 0 && cd[0].gain >= 0 && cd[0].total > 0);
        tst('buildYearTimeline: chartData sista år > första år', cd[2].total > cd[0].total);
        var rows = tmpTbody.querySelectorAll('tr');
        tst('buildYearTimeline: 3 rader i tbody', rows.length === 3);
        tst('buildYearTimeline: första rad har 5 celler', rows[0].querySelectorAll('td').length === 5);
        tst('buildYearTimeline: sista cell innehåller <strong>', rows[0].querySelectorAll('td')[4].querySelector('strong') !== null);
        document.body.removeChild(tmpTbody);
    })();

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
        tst('renderBreakdown: 4 chart-segment element', segs.length === 4);
        tst('renderBreakdown: första segment är chart-invested', segs[0].classList.contains('chart-invested'));
        tst('renderBreakdown: segment har satt width', segs[0].style.width !== '');

        var items = legendDiv.querySelectorAll('.legend-item');
        tst('renderBreakdown: 4 legend-item element', items.length === 4);
        tst('renderBreakdown: legend visar "TestInsatt"', legendDiv.textContent.includes('TestInsatt'));
        tst('renderBreakdown: legend visar "Avgifter"', legendDiv.textContent.includes('Avgifter'));
        tst('renderBreakdown: legend visar "Skatt" (ej ISK)', legendDiv.textContent.includes('Skatt') && !legendDiv.textContent.includes('ISK-skatt'));

        document.body.removeChild(chartDiv);
        document.body.removeChild(legendDiv);
    })();

    (function() {
        var cd = document.createElement('div'); cd.id = '_appTC2';
        var ld = document.createElement('div'); ld.id = '_appTL2';
        document.body.appendChild(cd); document.body.appendChild(ld);
        renderBreakdown('_appTC2', '_appTL2', 100000, 90000, 95000, 1000, 0, true, { invested: 'I', gain: 'G' });
        tst('renderBreakdown ISK: legend visar "ISK-skatt"', ld.textContent.includes('ISK-skatt'));
        document.body.removeChild(cd); document.body.removeChild(ld);
    })();

    (function() {
        var cd = document.createElement('div'); cd.id = '_appTC3';
        var ld = document.createElement('div'); ld.id = '_appTL3';
        document.body.appendChild(cd); document.body.appendChild(ld);
        renderBreakdown('_appTC3', '_appTL3', 0, 0, 0, 0, 0, false, { invested: 'I', gain: 'G' });
        tst('renderBreakdown base=0: fallback-text visas', cd.textContent.includes(t('breakdownEmpty')));
        tst('renderBreakdown base=0: legend är tom', ld.children.length === 0);
        document.body.removeChild(cd); document.body.removeChild(ld);
    })();

    console.log('App-tester klara: ' + ok + ' OK, ' + fail + ' fel.');
}

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

document.getElementById('goalInflation').addEventListener('input', function() {
    document.getElementById('goalInflationValue').textContent = parseFloat(this.value).toFixed(1) + '%';
    showCalc();
    clearTimeout(state.goalTimeout);
    state.goalTimeout = setTimeout(calculateGoal, 300);
});

setupIskToggle('goalIskEnabled', 'goalIskRateGroup', 'goalAskRateGroup', 'goalTaxGroup', 'goalIskOn', 'goalTimeout', calculateGoal, 150);

document.getElementById('goalIskRate').addEventListener('input', function() {
    document.getElementById('goalIskRateValue').textContent = parseFloat(this.value).toFixed(2) + '%';
    showCalc();
    clearTimeout(state.goalTimeout);
    state.goalTimeout = setTimeout(calculateGoal, 300);
});

['goalTarget','goalInitial','goalYears','goalRate'].forEach(function(id) {
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

    var c = getCountry();
    var loc = c.locale;
    var curr = c.currency;
    var sym = activeCurrencySym();
    var advType = c.taxAdvantagedType;

    var targetRaw  = parseFloat(document.getElementById('goalTarget').value)   || 0;
    var initialCap = parseFloat(document.getElementById('goalInitial').value)  || 0;
    var years      = Math.floor(parseFloat(document.getElementById('goalYears').value))    || 0;
    var annualRate = parseFloat(document.getElementById('goalRate').value)     || 0;
    var fees       = Math.max(0, Math.min(5, parseFloat(document.getElementById('goalFees').value) || 0));
    var inflation  = Math.max(0, Math.min(10, parseFloat(document.getElementById('goalInflation').value) || 0));
    var iskSchRate = Math.max(0, Math.min(15, parseFloat(document.getElementById('goalIskRate').value) || 0));
    var realTerms  = document.getElementById('goalRealTerms').checked;

    setFeesError(annualRate, fees, $('goalFeesError'), t('feesErrorGoal'));

    var monthlyRateNet   = (annualRate - fees) / 100 / 12;
    var monthlyRateGross = annualRate / 100 / 12;
    var months = years * 12;

    var inflationFactor = Math.pow(1 + inflation / 100, years);
    var nominalTarget   = realTerms ? targetRaw * inflationFactor : targetRaw;
    var realEquiv       = realTerms ? targetRaw : targetRaw / inflationFactor;

    // Bygg config för simulateGoal
    var goalConfig = {
        capitalGainsTax: c.capitalGainsTax,
        capitalGainsTaxHigh: c.capitalGainsTaxHigh,
        capitalGainsTaxThreshold: c.capitalGainsTaxThreshold,
        taxAdvantagedType: advType,
        askAnnualTax: c.askAnnualTax,
        iskSkatt: c.iskSkatt || 0.30,
        iskSchablonGolv: c.iskSchablonGolv || 1.25,
        skjermingsrente: c.skjermingsrente
    };

    var fribelopp = c.iskFribelopp || 300000;

    var netFromZero = simulateGoal(initialCap, 0, monthlyRateNet, years, state.goalIskOn, iskSchRate, fribelopp, goalConfig).netValue;

    var resultsEl     = document.getElementById('goalSummary');
    var timelineEl    = document.getElementById('goalTimeline');
    var noSavingsEl   = document.getElementById('goalNoSavingsNeeded');
    var monthlyEl     = document.getElementById('goalMonthly');
    var monthlyNoteEl = document.getElementById('goalMonthlyNote');

    resultsEl.classList.add('show');
    timelineEl.classList.add('show');

    if (netFromZero >= nominalTarget) {
        noSavingsEl.style.display = 'block';
        document.getElementById('goalRealRow').style.display = 'none';
        monthlyEl.textContent = t('goalZeroSavings');
        monthlyNoteEl.textContent = t('goalStartCapitalSuffices') + ' ' + years + ' ' + t('goalYearsSuffix');

        var grossNoFees = computeFV(initialCap, 0, monthlyRateGross, months);
        var fvWithFeesNoTax = computeFV(initialCap, 0, monthlyRateNet, months);
        var totalFees = Math.max(grossNoFees - fvWithFeesNoTax, 0);

        var finalRes = simulateGoal(initialCap, 0, monthlyRateNet, years, state.goalIskOn, iskSchRate, fribelopp, goalConfig);

        document.getElementById('goalNominalTarget').textContent = formatCurrency(nominalTarget, loc, curr);
        document.getElementById('goalRealEquiv').textContent     = formatCurrency(realEquiv, loc, curr);
        document.getElementById('goalTotalIn').textContent       = formatCurrency(initialCap, loc, curr);
        document.getElementById('goalGain').textContent          = formatCurrency(Math.max(finalRes.netValue - initialCap, 0), loc, curr);
        document.getElementById('goalFeesResult').textContent    = formatCurrency(totalFees, loc, curr);

        if (state.goalIskOn && advType) {
            if (advType === 'ISK')
                document.getElementById('goalTaxResultLabel').textContent = t('taxTypeISK');
            else if (advType === 'ASK_ANNUAL')
                document.getElementById('goalTaxResultLabel').textContent = t('taxTypeASK');
            else
                document.getElementById('goalTaxResultLabel').textContent = t('taxTypeCapitalGains');
        } else {
            document.getElementById('goalTaxResultLabel').textContent = t('taxTypeCapitalGains');
        }
        document.getElementById('goalTaxResult').textContent = formatCurrency(finalRes.tax, loc, curr);

        // Fördelningsdiagram
        renderBreakdown('goalChart', 'goalLegend', nominalTarget, initialCap, finalRes.netValue, totalFees, finalRes.tax, state.goalIskOn,
            { invested: t('legendInvested'), gain: t('legendGain') });

        // Tidslinje
        var noSaveChartData = buildYearTimeline(years, initialCap, 0, monthlyRateNet, 'goalTableBody');
        state.goalChartData = noSaveChartData;
        requestAnimationFrame(function() { drawTimelineChart(noSaveChartData, 'goalTimelineChart', 'goalChartTooltip'); });

        return;
    }
    noSavingsEl.style.display = 'none';

    var lo = 0, hi = nominalTarget;
    for (var i = 0; i < 80; i++) {
        var mid = (lo + hi) / 2;
        if (simulateGoal(initialCap, mid, monthlyRateNet, years, state.goalIskOn, iskSchRate, fribelopp, goalConfig).netValue < nominalTarget) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    var requiredMonthly = (lo + hi) / 2;

    var totalIn  = initialCap + requiredMonthly * months;
    var finalRes = simulateGoal(initialCap, requiredMonthly, monthlyRateNet, years, state.goalIskOn, iskSchRate, fribelopp, goalConfig);
    var finalNet = finalRes.netValue;
    var actualTax = finalRes.tax;

    var grossNoFees = computeFV(initialCap, requiredMonthly, monthlyRateGross, months);
    var fvWithFeesNoTax = computeFV(initialCap, requiredMonthly, monthlyRateNet, months);
    var totalFees = Math.max(grossNoFees - fvWithFeesNoTax, 0);

    var accountTypeStr;
    if (state.goalIskOn && advType) {
        if (advType === 'ISK') accountTypeStr = 'ISK';
        else if (advType === 'ASK_ANNUAL') accountTypeStr = 'ASK';
        else if (state.country === 'NO') accountTypeStr = 'ASK';
        else accountTypeStr = 'OSK';
    } else {
        accountTypeStr = state.lang === 'sv' ? 'vanligt konto' : 'standard account';
    }

    monthlyEl.textContent = formatCurrency(Math.ceil(requiredMonthly), loc, curr) + ' ' + t('perMonth');
    monthlyNoteEl.textContent = (state.lang === 'sv' ? 'Under ' : 'Over ') + years + (state.lang === 'sv' ? ' år · ' : ' years · ') + accountTypeStr;

    document.getElementById('goalNominalTarget').textContent = formatCurrency(nominalTarget, loc, curr);
    document.getElementById('goalRealEquiv').textContent     = formatCurrency(realEquiv, loc, curr);
    document.getElementById('goalRealRow').style.display     = 'flex';
    document.getElementById('goalTotalIn').textContent       = formatCurrency(totalIn, loc, curr);
    document.getElementById('goalGain').textContent          = formatCurrency(Math.max(finalNet - totalIn, 0), loc, curr);
    document.getElementById('goalFeesResult').textContent    = formatCurrency(totalFees, loc, curr);

    if (state.goalIskOn && advType) {
        if (advType === 'ISK')
            document.getElementById('goalTaxResultLabel').textContent = t('taxTypeISK');
        else if (advType === 'ASK_ANNUAL')
            document.getElementById('goalTaxResultLabel').textContent = t('taxTypeASK');
        else
            document.getElementById('goalTaxResultLabel').textContent = t('taxTypeCapitalGains');
    } else {
        document.getElementById('goalTaxResultLabel').textContent = t('taxTypeCapitalGains');
    }
    document.getElementById('goalTaxResult').textContent = formatCurrency(actualTax, loc, curr);

    // Fördelningsdiagram
    var gainLabels = { invested: t('legendInvested'), gain: t('legendGain') };
    renderBreakdown('goalChart', 'goalLegend', nominalTarget, totalIn, finalNet, totalFees, actualTax, state.goalIskOn, gainLabels);

    // Tidslinje
    var goalAskTaxForTimeline = (state.goalIskOn && advType === 'ASK_ANNUAL') ? (c.askAnnualTax || 0.17) : undefined;
    var goalChartData = buildYearTimeline(years, initialCap, requiredMonthly, monthlyRateNet, 'goalTableBody', goalAskTaxForTimeline);
    state.goalChartData = goalChartData;
    requestAnimationFrame(function() { drawTimelineChart(goalChartData, 'goalTimelineChart', 'goalChartTooltip'); });
}

// ============================================================
//  Flaggor och landsnamn
// ============================================================
const FLAGS = {
    SE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#006AA7"/><rect x="0" y="6" width="24" height="4" fill="#FECC02"/><rect x="7" y="0" width="4" height="16" fill="#FECC02"/></svg>',
    NO: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#BA0C2F"/><rect x="0" y="6" width="24" height="4" fill="#fff"/><rect x="7" y="0" width="4" height="16" fill="#fff"/><rect x="0" y="7" width="24" height="2" fill="#00205B"/><rect x="8" y="0" width="2" height="16" fill="#00205B"/></svg>',
    DK: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#C8102E"/><rect x="0" y="6" width="24" height="4" fill="#fff"/><rect x="7" y="0" width="4" height="16" fill="#fff"/></svg>',
    FI: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#fff"/><rect x="0" y="6" width="24" height="4" fill="#003580"/><rect x="7" y="0" width="4" height="16" fill="#003580"/></svg>',
    IS: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#02529C"/><rect x="0" y="6" width="24" height="4" fill="#fff"/><rect x="7" y="0" width="4" height="16" fill="#fff"/><rect x="0" y="7" width="24" height="2" fill="#DC1E35"/><rect x="8" y="0" width="2" height="16" fill="#DC1E35"/></svg>',
    GB: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16"><rect width="24" height="16" fill="#012169"/><polygon points="0,0 10,8 0,16" fill="#fff"/><polygon points="24,0 14,8 24,16" fill="#fff"/><polygon points="0,0 4,8 0,16" fill="#C8102E"/><polygon points="24,0 20,8 24,16" fill="#C8102E"/><rect x="0" y="5" width="24" height="6" fill="#fff"/><rect x="10" y="0" width="4" height="16" fill="#fff"/><rect x="0" y="6" width="24" height="4" fill="#C8102E"/><rect x="11" y="0" width="2" height="16" fill="#C8102E"/></svg>'
};

// Språkalternativ — namnen översätts inte (visas alltid på respektive språk)
const LANG_OPTIONS = [
    { value: 'sv', flag: 'SE', label: 'Svenska' },
    { value: 'en', flag: 'GB', label: 'English' }
];

// Landsnamn — översätts med språkvalet
const CTRY_LABELS = {
    sv: { SE: 'Sverige', NO: 'Norge', DK: 'Danmark', FI: 'Finland', IS: 'Island' },
    en: { SE: 'Sweden',  NO: 'Norway', DK: 'Denmark', FI: 'Finland', IS: 'Iceland'  }
};
const CTRY_OPTIONS = [
    { value: 'SE', flag: 'SE' },
    { value: 'NO', flag: 'NO' },
    { value: 'DK', flag: 'DK' },
    { value: 'FI', flag: 'FI' },
    { value: 'IS', flag: 'IS' }
];

// ============================================================
//  Custom dropdown — renderar flagga + text i varje rad
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
        options.forEach(function(opt) {
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

    // Init
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

    // Public API
    return {
        getValue: function() { return selectedValue; },
        setValue: function(val) {
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === val) { setInitial(options[i]); selectedValue = val; return; }
            }
        },
        updateLabels: function(lang) {
            optionEls.forEach(function(o) {
                for (var i = 0; i < options.length; i++) {
                    if (options[i].value === o.value) {
                        o.el.querySelector('span:last-child').textContent = getLabelFn(options[i], lang);
                        break;
                    }
                }
            });
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
    'sv',
    function(opt) { return opt.label; },
    function(value) {
        state.lang = value;
        countryDropdown.updateLabels(state.lang);
        translatePage(state.lang);
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
    function(opt, lang) { lang = lang || state.lang; var labels = CTRY_LABELS[lang] || CTRY_LABELS.sv; return labels[opt.value] || opt.value; },
    function(value) {
        state.country = value;
        state.iskOn = false;
        state.goalIskOn = false;
        document.getElementById('iskEnabled').checked = false;
        document.getElementById('goalIskEnabled').checked = false;
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
    // Synkronisera ISK-flaggorna
    state.iskOn     = document.getElementById('iskEnabled').checked;
    state.goalIskOn = document.getElementById('goalIskEnabled').checked;

    // Initialisera UI för valt språk och land
    translatePage(state.lang);
    updateCountryUI();

    // Första beräkning
    calculateAdvanced();
    calculateGoal();

    // Kör tester lokalt
    if (location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.protocol === 'file:') {
        try { runTests(); } catch (e) { console.error('runTests fel:', e); }
        try { runAppTests(); } catch (e) { console.error('runAppTests fel:', e); }
    }
});

// Auto-beräkna vid ändringar — Pengamaskin
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
