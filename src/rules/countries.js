// ============================================================
//  Skatteregler per land — ren data.
//
//  Varje land har:
//    standard    vanligt konto        { regime, params, label?, summary }
//    advantaged  skattegynnat konto   { regime, params, cap?, adjustable?, label, summary } (eller null)
//    notes       förenklingar som användaren bör känna till
//    sources     var satserna kan kontrolleras
//
//  Regimerna och deras parametrar beskrivs i src/engine/regimes/.
//  Satser i decimalform (0.30 = 30 %). Belopp i landets valuta.
//
//  ÅRLIG UPPDATERING: ändra RULES_YEAR och gå igenom varje land mot
//  källorna. Testet i tests/rules.test.js påminner när året passerats.
// ============================================================

export const RULES_YEAR = 2026;
export const RULES_VERIFIED = '2026-10';

const tx = (sv, en) => ({ sv, en });
const flat = (rate) => ({ rate });

export const REGIONS = [
  { id: 'nordic', name: tx('Norden', 'Nordic countries') },
  { id: 'western', name: tx('Västeuropa', 'Western Europe') },
  { id: 'british', name: tx('Brittiska öarna', 'British Isles') },
  { id: 'benelux', name: tx('Benelux', 'Benelux') },
  { id: 'central', name: tx('Centraleuropa', 'Central Europe') },
  { id: 'southern', name: tx('Sydeuropa', 'Southern Europe') },
  { id: 'baltics', name: tx('Baltikum', 'Baltics') },
  { id: 'eastern', name: tx('Östeuropa', 'Eastern Europe') },
];

export const COUNTRIES = {
  SE: {
    name: tx('Sverige', 'Sweden'), currency: 'SEK', locale: 'sv-SE', region: 'nordic',
    standard: {
      regime: 'CGT',
      // 30 % på vinsten + schablonintäkt på fondandelar: 0,4 % × 30 % = 0,12 % av värdet 1 jan
      params: { rate: 0.30, fundLevy: 0.0012 },
      label: tx('AF-konto (fonder)', 'Securities account (funds)'),
      summary: tx('30 % skatt på vinsten när du säljer, plus 0,12 % per år i schablonskatt på fonder.',
        '30% tax on the gain when you sell, plus a 0.12% yearly standard levy on funds.'),
    },
    advantaged: {
      regime: 'ISK',
      params: { schablonRate: 3.55, floor: 1.25, exemption: 300000, tax: 0.30 },
      adjustable: { key: 'schablonRate', min: 0, max: 15, step: 0.05,
        label: tx('Schablonränta (%)', 'Standard rate (%)'),
        hint: tx('2026: statslåneränta 2,55 % + 1 % = 3,55 %. Golv 1,25 %.',
          '2026: government bond rate 2.55% + 1% = 3.55%. Floor 1.25%.') },
      label: tx('ISK (investeringssparkonto)', 'ISK (investment savings account)'),
      summary: tx('Ingen skatt på vinsten. I stället en årlig skatt på kontots värde: schablonränta 3,55 % × 30 % ≈ 1,07 % av värdet över 300 000 kr.',
        'No tax on gains. Instead a yearly tax on the account value: standard rate 3.55% × 30% ≈ 1.07% of the value above SEK 300,000.'),
    },
    notes: tx('Fribeloppet 300 000 kr gäller ISK och kapitalförsäkring tillsammans. AF-kontot antas innehålla fonder.',
      'The SEK 300,000 exemption is shared between ISK and endowment insurance. The securities account is assumed to hold funds.'),
    sources: ['https://www.skatteverket.se/privat/skatter/vardepapper/investeringssparkontoisk.4.5fc8c94513259a4ba1d800037851.html'],
  },

  NO: {
    name: tx('Norge', 'Norway'), currency: 'NOK', locale: 'nb-NO', region: 'nordic',
    standard: {
      regime: 'SKJERMING',
      params: { rate: 0.3784, shieldRate: 0.036, basis: 'yearEnd' },
      summary: tx('37,84 % på vinsten när du säljer, efter skjermingsfradrag (3,6 % per år på insatt kapital).',
        '37.84% on the gain when you sell, after the shield deduction (3.6% per year on invested capital).'),
    },
    advantaged: {
      regime: 'SKJERMING',
      params: { rate: 0.3784, shieldRate: 0.036, basis: 'lowest' },
      label: tx('ASK (aksjesparekonto)', 'ASK (share savings account)'),
      summary: tx('Som vanligt konto, men du kan byta fonder och aktier utan skatt. Nya insättningar ger skjerming först året efter.',
        'Like a standard account, but you can switch funds and shares tax-free. New deposits earn the shield deduction from the following year.'),
    },
    notes: tx('Skjermingsrenten fastställs i efterhand; 3,6 % (2025) används för alla år. Oanvänd skjerming växer med åren. Utdelningar och förmögenhetsskatt ingår inte.',
      'The shield rate is set retroactively; 3.6% (2025) is used for all years. Unused deductions grow over time. Dividends and wealth tax are not included.'),
    sources: ['https://www.skatteetaten.no/person/skatt/hjelp-til-riktig-skatt/aksjer-og-verdipapirer/'],
  },

  DK: {
    name: tx('Danmark', 'Denmark'), currency: 'DKK', locale: 'da-DK', region: 'nordic',
    standard: {
      regime: 'CGT',
      params: { brackets: [{ upTo: 79400, rate: 0.27 }, { rate: 0.42 }] },
      summary: tx('Aktieindkomst: 27 % upp till 79 400 kr, 42 % över.', 'Share income: 27% up to DKK 79,400, 42% above.'),
    },
    advantaged: {
      regime: 'LAGER',
      params: { rate: 0.17 },
      cap: { yearStartValue: 174200 },
      label: tx('ASK (aktiesparekonto)', 'ASK (share savings account)'),
      summary: tx('17 % på årets avkastning varje år, även om du inte säljer. Skatten dras från kontot. Förluster förs fram utan tidsgräns. Tak 174 200 kr.',
        '17% on each year’s return, even if you do not sell. The tax is taken from the account. Losses are carried forward without limit. Cap DKK 174,200.'),
    },
    notes: tx('Vanligt konto: hela vinsten antas säljas samma år. ASK-taket hålls fast i dagens kronor; årets utrymme är taket minus kontots värde vid årets början.',
      'Standard account: the whole gain is assumed to be sold in one year. The ASK cap is kept fixed in today’s money; each year’s room is the cap minus the account value at the start of the year.'),
    sources: ['https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto'],
  },

  FI: {
    name: tx('Finland', 'Finland'), currency: 'EUR', locale: 'fi-FI', region: 'nordic',
    standard: {
      regime: 'CGT',
      params: { brackets: [{ upTo: 30000, rate: 0.30 }, { rate: 0.34 }] },
      summary: tx('30 % på vinst upp till 30 000 €, 34 % över.', '30% on gains up to €30,000, 34% above.'),
    },
    advantaged: {
      regime: 'CGT',
      params: { brackets: [{ upTo: 30000, rate: 0.30 }, { rate: 0.34 }] },
      cap: { lifetime: 100000 },
      label: tx('OSK (osakesäästötili)', 'OSK (equity savings account)'),
      summary: tx('Skatt (30/34 %) först när du tar ut pengar. Max 100 000 € insättningar.',
        'Tax (30/34%) only when you withdraw. Max €100,000 in deposits.'),
    },
    notes: tx('Hela vinsten antas tas ut samma år. Hankintameno-olettama ingår inte.',
      'The whole gain is assumed to be withdrawn in one year. The deemed acquisition cost rule is not included.'),
    sources: ['https://www.vero.fi/henkiloasiakkaat/omaisuus/osakkeet-ja-rahastot/osakesaastotili/'],
  },

  DE: {
    name: tx('Tyskland', 'Germany'), currency: 'EUR', locale: 'de-DE', region: 'western',
    standard: {
      regime: 'CGT',
      params: { partialExemption: 0.30, brackets: [{ upTo: 1000, rate: 0 }, { rate: 0.26375 }] },
      label: tx('Depå (aktie-ETF)', 'Brokerage account (equity ETF)'),
      summary: tx('26,375 % (Abgeltungsteuer + solidaritetstillägg). För aktie-ETF:er är 30 % av vinsten skattefri. 1 000 € fribelopp.',
        '26.375% (flat tax + solidarity surcharge). For equity ETFs 30% of the gain is tax-free. €1,000 allowance.'),
    },
    advantaged: null,
    notes: tx('Beräknat för aktie-ETF:er. Vorabpauschale och kyrkoskatt ingår inte; fribeloppet används en gång. Enskilda aktier har ingen skattefri andel.',
      'Calculated for equity ETFs. Vorabpauschale and church tax are not included; the allowance is used once. Individual shares get no partial exemption.'),
    sources: ['https://www.bzst.de/DE/Privatpersonen/Kapitalertraege/kapitalertraege_node.html'],
  },

  FR: {
    name: tx('Frankrike', 'France'), currency: 'EUR', locale: 'fr-FR', region: 'western',
    standard: {
      regime: 'CGT',
      params: flat(0.314),
      label: tx('CTO (vanligt konto)', 'CTO (standard account)'),
      summary: tx('31,4 % (12,8 % inkomstskatt + 18,6 % sociala avgifter).', '31.4% (12.8% income tax + 18.6% social charges).'),
    },
    advantaged: {
      regime: 'TIME_TEST',
      params: { perLot: false, graded: [{ years: 5, rate: 0.314 }, { rate: 0.186 }] },
      cap: { lifetime: 150000 },
      label: tx('PEA (plan d’épargne en actions)', 'PEA (equity savings plan)'),
      summary: tx('Efter 5 år betalar du bara 18,6 % sociala avgifter; dessförinnan 31,4 %. Max 150 000 €.',
        'After 5 years you only pay 18.6% social charges; before that 31.4%. Max €150,000.'),
    },
    notes: tx('PEA-tiden räknas från kontots öppnande.', 'The PEA clock runs from account opening.'),
    sources: ['https://www.impots.gouv.fr/particulier/questions/comment-sont-imposes-les-gains-realises-sur-un-plan-depargne-en-actions'],
  },

  GB: {
    name: tx('Storbritannien', 'United Kingdom'), currency: 'GBP', locale: 'en-GB', region: 'british',
    standard: {
      regime: 'CGT',
      params: { brackets: [{ upTo: 3000, rate: 0 }, { upTo: 40700, rate: 0.18 }, { rate: 0.24 }] },
      summary: tx('£3 000 skattefritt, sedan 18 % inom basic rate band och 24 % över.',
        '£3,000 tax-free, then 18% within the basic rate band and 24% above.'),
    },
    advantaged: {
      regime: 'TAX_FREE',
      params: {},
      cap: { annual: 20000 },
      label: tx('ISA (individual savings account)', 'ISA (individual savings account)'),
      summary: tx('Helt skattefritt. Max £20 000 per år.', 'Completely tax-free. Max £20,000 per year.'),
    },
    notes: tx('Vanligt konto: förutsätter ingen annan beskattningsbar inkomst och att allt säljs samma år.',
      'Standard account: assumes no other taxable income and that everything is sold in one year.'),
    sources: ['https://www.gov.uk/capital-gains-tax/rates', 'https://www.gov.uk/individual-savings-accounts'],
  },

  IE: {
    name: tx('Irland', 'Ireland'), currency: 'EUR', locale: 'en-IE', region: 'british',
    standard: {
      regime: 'EXIT_TAX',
      params: { rate: 0.38, deemedDisposalYears: 8 },
      label: tx('Fonder/ETF:er', 'Funds/ETFs'),
      summary: tx('Exit tax 38 % på vinsten. Vart 8:e år beskattas orealiserad vinst (deemed disposal).',
        '38% exit tax on the gain. Every 8 years unrealised gains are taxed (deemed disposal).'),
    },
    advantaged: null,
    notes: tx('Deemed disposal-skatten antas betalas genom att andelar säljs. Enskilda aktier beskattas i stället med 33 % och €1 270 fribelopp.',
      'The deemed disposal tax is assumed to be paid by selling units. Individual shares are instead taxed at 33% with a €1,270 exemption.'),
    sources: ['https://www.revenue.ie/en/gains-gifts-and-inheritance/transfering-an-asset/index.aspx'],
  },

  NL: {
    name: tx('Nederländerna', 'Netherlands'), currency: 'EUR', locale: 'nl-NL', region: 'benelux',
    standard: {
      regime: 'BOX3',
      params: { deemedReturn: 0.06, rate: 0.36, exemption: 59357 },
      summary: tx('Box 3: en antagen avkastning på 6 % av värdet över €59 357 beskattas med 36 % varje år (≈ 2,16 %).',
        'Box 3: an assumed 6% return on the value above €59,357 is taxed at 36% every year (≈ 2.16%).'),
    },
    advantaged: null,
    notes: tx('Skatten betalas separat. Möjligheten att redovisa faktisk avkastning (tegenbewijs) ingår inte.',
      'The tax is paid separately. The option to report actual returns (tegenbewijs) is not included.'),
    sources: ['https://www.belastingdienst.nl/wps/wcm/connect/nl/box-3/'],
  },

  BE: {
    name: tx('Belgien', 'Belgium'), currency: 'EUR', locale: 'nl-BE', region: 'benelux',
    standard: {
      regime: 'CGT',
      params: { brackets: [{ upTo: 10000, rate: 0 }, { rate: 0.10 }] },
      summary: tx('10 % på vinster från 2026. Första €10 000 skattefria.', '10% on gains from 2026. First €10,000 tax-free.'),
    },
    advantaged: null,
    notes: tx('Fribeloppet används en gång, som om allt säljs samma år. Börsskatt (TOB) ingår inte.',
      'The exemption is used once, as if everything is sold in one year. Stock exchange tax (TOB) is not included.'),
    sources: ['https://financien.belgium.be/nl/particulieren'],
  },

  AT: {
    name: tx('Österrike', 'Austria'), currency: 'EUR', locale: 'de-AT', region: 'central',
    standard: {
      regime: 'CGT', params: flat(0.275),
      summary: tx('KESt 27,5 % på vinsten.', 'KESt 27.5% on the gain.'),
    },
    advantaged: null,
    notes: tx('Årlig beskattning av ackumulerande utländska fonder ingår inte.',
      'Annual taxation of accumulating foreign funds is not included.'),
    sources: ['https://www.bmf.gv.at/themen/steuern/sparen-veranlagen/'],
  },

  PL: {
    name: tx('Polen', 'Poland'), currency: 'PLN', locale: 'pl-PL', region: 'eastern',
    standard: {
      regime: 'CGT', params: flat(0.19),
      summary: tx('19 % på vinsten (podatek Belki).', '19% on the gain (Belka tax).'),
    },
    advantaged: {
      regime: 'TAX_FREE',
      params: {},
      cap: { annual: 28260 },
      label: tx('IKE (indywidualne konto emerytalne)', 'IKE (individual retirement account)'),
      summary: tx('Skattefritt vid uttag efter 60 års ålder. Max 28 260 PLN per år.',
        'Tax-free on withdrawal after age 60. Max PLN 28,260 per year.'),
    },
    notes: tx('IKE-taket indexeras årligen; 2026 års tak används för alla år.',
      'The IKE cap is indexed every year; the 2026 cap is used for all years.'),
    sources: ['https://www.podatki.gov.pl/'],
  },

  CZ: {
    name: tx('Tjeckien', 'Czechia'), currency: 'CZK', locale: 'cs-CZ', region: 'eastern',
    standard: {
      regime: 'TIME_TEST',
      params: { perLot: true, freeAfterYears: 3, rate: 0.15 },
      summary: tx('15 % på vinsten, men skattefritt för det du ägt i minst 3 år.',
        '15% on the gain, but tax-free for what you have held for at least 3 years.'),
    },
    advantaged: null,
    notes: tx('Varje köp har sin egen 3-årsklocka. Värdegränsen 100 000 CZK/år och 23 %-steget ingår inte.',
      'Each purchase has its own 3-year clock. The CZK 100,000/year value test and the 23% band are not included.'),
    sources: ['https://www.financnisprava.cz/'],
  },

  IT: {
    name: tx('Italien', 'Italy'), currency: 'EUR', locale: 'it-IT', region: 'southern',
    standard: {
      regime: 'CGT', params: flat(0.26),
      summary: tx('26 % på vinsten.', '26% on the gain.'),
    },
    advantaged: {
      regime: 'TIME_TEST',
      params: { perLot: true, freeAfterYears: 5, rate: 0.26 },
      cap: { annual: 40000, lifetime: 200000 },
      label: tx('PIR (piano individuale di risparmio)', 'PIR (individual savings plan)'),
      summary: tx('Skattefritt för det du ägt i minst 5 år. Max €40 000 per år och €200 000 totalt.',
        'Tax-free for what you have held for at least 5 years. Max €40,000 per year and €200,000 in total.'),
    },
    notes: tx('PIR: varje insättning har sin egen 5-årsklocka. Kraven på italienska/europeiska innehav antas uppfyllda.',
      'PIR: each deposit has its own 5-year clock. The Italian/European holding requirements are assumed to be met.'),
    sources: ['https://www.agenziaentrate.gov.it/'],
  },

  ES: {
    name: tx('Spanien', 'Spain'), currency: 'EUR', locale: 'es-ES', region: 'southern',
    standard: {
      regime: 'CGT',
      params: { brackets: [
        { upTo: 6000, rate: 0.19 }, { upTo: 50000, rate: 0.21 }, { upTo: 200000, rate: 0.23 },
        { upTo: 300000, rate: 0.27 }, { rate: 0.30 }] },
      summary: tx('19 % upp till €6 000, 21 % till €50 000, 23 % till €200 000, 27 % till €300 000, 30 % över.',
        '19% up to €6,000, 21% to €50,000, 23% to €200,000, 27% to €300,000, 30% above.'),
    },
    advantaged: null,
    notes: tx('Hela vinsten antas realiseras samma år.', 'The whole gain is assumed to be realised in one year.'),
    sources: ['https://sede.agenciatributaria.gob.es/'],
  },

  GR: {
    name: tx('Grekland', 'Greece'), currency: 'EUR', locale: 'el-GR', region: 'southern',
    standard: {
      regime: 'CGT', params: flat(0),
      summary: tx('0 %: vinster på noterade aktier (under 0,5 % av bolaget) och UCITS-fonder från EU/EES är skattefria.',
        '0%: gains on listed shares (under 0.5% of the company) and EU/EEA UCITS funds are tax-exempt.'),
    },
    advantaged: null,
    notes: tx('Större innehav och övriga värdepapper beskattas med 15 %.', 'Larger holdings and other securities are taxed at 15%.'),
    sources: ['https://www.aade.gr/'],
  },

  EE: {
    name: tx('Estland', 'Estonia'), currency: 'EUR', locale: 'et-EE', region: 'baltics',
    standard: {
      regime: 'CGT', params: flat(0.22),
      summary: tx('22 % på vinsten.', '22% on the gain.'),
    },
    advantaged: {
      regime: 'CGT', params: flat(0.22),
      label: tx('Investeringskonto (investeerimiskonto)', 'Investment account (investeerimiskonto)'),
      summary: tx('22 % först när du tar ut mer än du satt in. Byten inom kontot är skattefria.',
        '22% only when you withdraw more than you put in. Switching inside the account is tax-free.'),
    },
    notes: tx('Inkomstskatten är 22 % även 2026.', 'Income tax remains 22% in 2026.'),
    sources: ['https://www.emta.ee/'],
  },

  LV: {
    name: tx('Lettland', 'Latvia'), currency: 'EUR', locale: 'lv-LV', region: 'baltics',
    standard: {
      regime: 'CGT', params: flat(0.255),
      summary: tx('25,5 % på vinsten.', '25.5% on the gain.'),
    },
    advantaged: {
      regime: 'CGT', params: flat(0.255),
      label: tx('Investeringskonto (ieguldījumu konts)', 'Investment account (ieguldījumu konts)'),
      summary: tx('25,5 % först när du tar ut mer än du satt in.', '25.5% only when you withdraw more than you put in.'),
    },
    notes: tx('Tilläggsskatten 3 % för inkomster över €200 000/år ingår inte.',
      'The additional 3% tax on income above €200,000/year is not included.'),
    sources: ['https://www.vid.gov.lv/'],
  },

  LT: {
    name: tx('Litauen', 'Lithuania'), currency: 'EUR', locale: 'lt-LT', region: 'baltics',
    standard: {
      regime: 'CGT',
      params: { brackets: [{ upTo: 500, rate: 0 }, { rate: 0.15 }] },
      summary: tx('15 % på vinsten, €500 fribelopp.', '15% on the gain, €500 exemption.'),
    },
    advantaged: {
      regime: 'CGT', params: flat(0.15),
      label: tx('Investeringskonto (investicinė sąskaita)', 'Investment account (investicinė sąskaita)'),
      summary: tx('15 % först när du tar ut mer än du satt in.', '15% only when you withdraw more than you put in.'),
    },
    notes: tx('15 % förutsätter innehav i minst 5 år eller vinst inom första inkomststeget; annars kan 20–32 % gälla.',
      '15% assumes holdings of at least 5 years or gains within the first income band; otherwise 20–32% may apply.'),
    sources: ['https://www.vmi.lt/'],
  },
};
