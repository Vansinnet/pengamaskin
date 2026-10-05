// ============================================================
//  calc/countries.js — Landskonfiguration för Europa
//
//  Varje land definierar:
//    - Valuta, locale, region
//    - standardRegime + standardParams (vanligt konto)
//    - taxAdvRegime + taxAdvParams (skattegynnat konto, om sådant finns)
//    - ui.sv + ui.en — alla landsspecifika UI-texter per språk
//
//  REGIONS-definitioner för landsdropdown-gruppering.
//
//  Lägg till ett nytt land HÄR. Om regimen redan finns i
//  tax-regimes.js krävs INGA ändringar i app.js eller någon
//  annanstans — endast denna fil + flagga-SVG i app.js.
// ============================================================

var REGIONS = {
    nordic:   { order: 1,  label: { sv: 'Norden',              en: 'Nordic countries' } },
    western:  { order: 2,  label: { sv: 'Västeuropa',          en: 'Western Europe'   } },
    british:  { order: 3,  label: { sv: 'Brittiska öarna',     en: 'British Isles'    } },
    benelux:  { order: 4,  label: { sv: 'Benelux',             en: 'Benelux'          } },
    central:  { order: 5,  label: { sv: 'Centraleuropa',       en: 'Central Europe'   } },
    southern: { order: 6,  label: { sv: 'Sydeuropa',           en: 'Southern Europe'  } },
    baltics:  { order: 7,  label: { sv: 'Baltikum',            en: 'Baltics'          } },
    eastern:  { order: 8,  label: { sv: 'Östeuropa',           en: 'Eastern Europe'   } },
    balkans:  { order: 9,  label: { sv: 'Balkan',              en: 'Balkans'          } }
};

var COUNTRY_CONFIG = {
    // ==========================================================
    //  NORDEN (4 länder)
    // ==========================================================

    SE: {
        code: 'SE', name: { sv: 'Sverige', en: 'Sweden' },
        currency: 'SEK', locale: 'sv-SE', region: 'nordic',
        standardRegime: 'CGT_ONLY',
        // AF-konto med fonder: 30 % på vinsten vid försäljning + årlig schablonintäkt
        // på fondandelar (0,4 % av värdet 1 jan, beskattas med 30 % ⇒ 0,12 %/år).
        standardParams: { capitalGainsTax: 0.30, fundSchablon: 0.004 },
        taxAdvRegime: 'ISK',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { iskSchablonGolv: 1.25, iskFribelopp: 300000, iskSchablonRateDefault: 3.55, iskSkatt: 0.30 },
        ui: {
            sv: {
                taxAdvLabel: 'ISK (Investeringssparkonto)',
                taxAdvDesc: 'Schablonbeskattning på kapitalunderlaget varje år — ingen reavinstskatt vid uttag.',
                taxAdvTip: 'ISK beskattas med en schablonskatt varje år oavsett vinst eller förlust. Fördelaktigt vid hög avkastning.',
                taxAdvSliderHint: '2026: statslåneränta 2,55 % + 1 % = <strong>3,55 %</strong>. Effektiv skatt = schablonränta × 30 %. Golv: 1,25 %. Fribelopp: 300 000 kr.',
                simplificationNote: 'Vanligt konto (AF) antas innehålla fonder: 30 % skatt på vinsten vid försäljning plus årlig schablonskatt på fondandelar (0,12 % av värdet 1 januari). Fribeloppet på ISK räknas på ISK och kapitalförsäkring tillsammans.'
            },
            en: {
                taxAdvLabel: 'ISK (Investment Savings Account)',
                taxAdvDesc: 'Standard-rate taxation on the capital base each year — no capital gains tax on withdrawal.',
                taxAdvTip: 'ISK is taxed with a flat rate each year regardless of profit or loss. Advantageous when returns are high.',
                taxAdvSliderHint: '2026: govt bond rate 2.55% + 1% = <strong>3.55%</strong>. Effective tax = rate × 30%. Floor: 1.25%. Exempt: SEK 300,000.',
                simplificationNote: 'The standard (AF) account is assumed to hold funds: 30% tax on gains when sold plus the annual standard levy on fund units (0.12% of the value on 1 January). The ISK exemption is shared between ISK and endowment insurance.'
            }
        }
    },

    NO: {
        code: 'NO', name: { sv: 'Norge', en: 'Norway' },
        currency: 'NOK', locale: 'nb-NO', region: 'nordic',
        // Vanligt konto: aktier/aksjefond har också skjermingsfradrag. Grunnlaget är
        // innehavet 31 december (köp under året ger skjerming hela året).
        standardRegime: 'DEFERRED_SKJERMING',
        standardParams: { capitalGainsTax: 0.3784, skjermingsrente: 3.6, skjermingBasis: 'yearEnd' },
        taxAdvRegime: 'DEFERRED_SKJERMING',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        // ASK: grunnlaget är lägsta innskudd under året (insättningar ger skjerming först året efter).
        taxAdvParams: { capitalGainsTax: 0.3784, skjermingsrente: 3.6, skjermingBasis: 'lowest' },
        ui: {
            sv: {
                taxAdvLabel: 'ASK (Aksjesparekonto)',
                taxAdvDesc: 'Uppskjuten skatt med skjermingsfradrag — beskattas vid uttag (37,84 % efter avdrag).',
                taxAdvTip: 'Norsk ASK: skatten skjuts upp till uttag. Skjermingsfradrag (riskfri avkastning) dras av från vinsten.',
                taxAdvSliderHint: 'Skjermingsrente 3,6 % (fastställd för 2025, används även framåt). Oanvänd skjerming läggs till grunden och växer år för år. Dras av från vinsten innan skatt (37,84 %).',
                simplificationNote: 'Skjermingsrenten fastställs i efterhand varje år; 3,6 % (2025) används för alla år. På ASK ger nya insättningar skjerming först året efter; på vanligt konto räknas innehavet 31 december. Utdelningar och förmögenhetsskatt ingår inte.'
            },
            en: {
                taxAdvLabel: 'ASK (Share Savings Account)',
                taxAdvDesc: 'Deferred tax with shield deduction — taxed upon withdrawal (37.84% on gains after deduction).',
                taxAdvTip: 'Norwegian ASK: tax is deferred to withdrawal. Shield deduction (risk-free return) is subtracted from gains.',
                taxAdvSliderHint: 'Shield rate 3.6% (set for 2025, assumed going forward). Unused shield deduction is added to the base and grows each year. Deducted from gains before tax (37.84%).',
                simplificationNote: 'The shield rate is set retroactively each year; 3.6% (2025) is used for all years. In an ASK, new deposits earn shield deduction from the following year; in a standard account holdings on 31 December count. Dividends and wealth tax are not included.'
            }
        }
    },

    DK: {
        code: 'DK', name: { sv: 'Danmark', en: 'Denmark' },
        currency: 'DKK', locale: 'da-DK', region: 'nordic',
        standardRegime: 'CGT_ONLY',
        // Aktieindkomst 2026: 27 % upp till 79 400 kr, 42 % över (progressionsgräns per år).
        standardParams: { capitalGainsTax: 0.27, capitalGainsTaxHigh: 0.42, capitalGainsTaxThreshold: 79400, capitalGainsTaxBrackets: [{ threshold: 79400, rate: 0.27 }, { rate: 0.42 }] },
        taxAdvRegime: 'LAGER_ANNUAL',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { askAnnualTax: 0.17 },
        // Indskudsloft 2026: 174 200 kr. Årets insättningsutrymme = loft − kontots värde vid årets början.
        taxAdvCap: { yearStartValue: 174200 },
        ui: {
            sv: {
                taxAdvLabel: 'ASK (Aktiesparekonto)',
                taxAdvDesc: '17 % årlig lagerbeskatning — skatten dras direkt från kontot varje år.',
                taxAdvTip: 'Dansk ASK: 17 % skatt på årets avkastning (realiserad + orealiserad). Förluster förs fram utan tidsgräns. Insättningstak 174 200 kr (2026).',
                taxAdvSliderHint: 'Fast 17 % skatt på årets totala avkastning. Skatten dras direkt från kontot.',
                simplificationNote: 'Vanligt konto: 27 %/42 % (gräns 79 400 kr 2026) tillämpas på hela vinsten som om allt säljs samma år. ASK-taket 174 200 kr hålls fast i nominella kronor; det som inte ryms beräknas på vanligt konto.'
            },
            en: {
                taxAdvLabel: 'ASK (Share Savings Account)',
                taxAdvDesc: '17% annual inventory taxation — tax deducted from the account each year.',
                taxAdvTip: 'Danish ASK: 17% tax on the year\'s total return. Losses are carried forward without time limit. Deposit cap DKK 174,200 (2026).',
                taxAdvSliderHint: 'Flat 17% tax on annual total return. Tax is deducted directly from the account.',
                simplificationNote: 'Standard account: 27%/42% (threshold DKK 79,400 in 2026) is applied to the whole gain as if everything is sold in one year. The ASK cap of DKK 174,200 is kept fixed in nominal terms; amounts above it are calculated in a standard account.'
            }
        }
    },

    FI: {
        code: 'FI', name: { sv: 'Finland', en: 'Finland' },
        currency: 'EUR', locale: 'fi-FI', region: 'nordic',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.30, capitalGainsTaxHigh: 0.34, capitalGainsTaxThreshold: 30000, capitalGainsTaxBrackets: [{ threshold: 30000, rate: 0.30 }, { rate: 0.34 }] },
        taxAdvRegime: 'DEFERRED_PLAIN',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { capitalGainsTax: 0.30, capitalGainsTaxHigh: 0.34, capitalGainsTaxThreshold: 30000, capitalGainsTaxBrackets: [{ threshold: 30000, rate: 0.30 }, { rate: 0.34 }] },
        taxAdvCap: { lifetime: 100000 },  // OSK: max 100 000 € insättningar totalt
        ui: {
            sv: {
                taxAdvLabel: 'OSK (Osakesäästötili)',
                taxAdvDesc: 'Uppskjuten skatt — beskattas först vid uttag (30/34 % progressivt).',
                taxAdvTip: 'Finsk OSK: skatten betalas först vid uttag. Max 100 000 € insättningar totalt.',
                taxAdvSliderHint: 'Progressiv skatt: 30 % upp till 30 000 €, 34 % över.',
                simplificationNote: 'Hela vinsten antas tas ut samma år (30 %/34 %). Insättningar över OSK-taket 100 000 € beräknas på vanligt konto. Hankintameno-olettama ingår inte.'
            },
            en: {
                taxAdvLabel: 'OSK (Equity Savings Account)',
                taxAdvDesc: 'Deferred tax — taxed only upon withdrawal (30/34% progressive).',
                taxAdvTip: 'Finnish OSK: tax is paid only on withdrawal. Max €100,000 total deposits.',
                taxAdvSliderHint: 'Progressive tax: 30% up to €30,000, 34% above.',
                simplificationNote: 'The whole gain is assumed to be withdrawn in one year (30%/34%). Deposits above the €100,000 OSK cap are calculated in a standard account. The deemed acquisition cost rule is not included.'
            }
        }
    },

    // ==========================================================
    //  VÄSTEUROPA (2 länder)
    // ==========================================================

    DE: {
        code: 'DE', name: { sv: 'Tyskland', en: 'Germany' },
        currency: 'EUR', locale: 'de-DE', region: 'western',
        standardRegime: 'CGT_ONLY',
        // Aktie-ETF/aktiefond: Teilfreistellung 30 % ⇒ effektivt 0,7 × 26,375 % ≈ 18,46 %.
        standardParams: { capitalGainsTax: 0.26375, partialExemption: 0.30, capitalGainsTaxBrackets: [{ threshold: 1000, rate: 0 }, { rate: 0.26375 }] },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Abgeltungsteuer 25 % + Solidaritätszuschlag 5,5 % = 26,375 %. Sparerpauschbetrag 1 000 €/år skattefritt.',
                simplificationNote: 'Beräknat för aktie-ETF/aktiefonder: 30 % av vinsten är skattefri (Teilfreistellung), resten beskattas med 26,375 % efter Sparerpauschbetrag 1 000 €. Vorabpauschale och kyrkoskatt ingår inte; fribeloppet används en gång vid försäljning. Enskilda aktier har ingen Teilfreistellung.'
            },
            en: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Abgeltungsteuer 25% + Solidarity surcharge 5.5% = 26.375%. Saver\'s allowance €1,000/year tax-free.',
                simplificationNote: 'Calculated for equity ETFs/equity funds: 30% of the gain is tax-exempt (Teilfreistellung), the rest is taxed at 26.375% after the €1,000 saver\'s allowance. Vorabpauschale and church tax are not included; the allowance is used once on sale. Individual shares get no Teilfreistellung.'
            }
        }
    },

    FR: {
        code: 'FR', name: { sv: 'Frankrike', en: 'France' },
        currency: 'EUR', locale: 'fr-FR', region: 'western',
        standardRegime: 'CGT_ONLY',
        // PFU 2026: 12,8 % IR + 18,6 % prélèvements sociaux = 31,4 %.
        standardParams: { capitalGainsTax: 0.314 },
        // PEA: 5-års tröskel för skattelättnad. TIME_TEST_CGT med graderade brytpunkter.
        taxAdvRegime: 'TIME_TEST_CGT',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: {
            timeTestGraded: [
                { years: 5, rate: 0.314 },
                { rate: 0.186 }
            ]
        },
        taxAdvCap: { lifetime: 150000 },  // PEA: max 150 000 € insättningar
        ui: {
            sv: {
                taxAdvLabel: 'PEA (Plan d\'Épargne en Actions)',
                taxAdvDesc: 'Skattegynnat aktiesparkonto — 31,4 % skatt under 5 år, därefter 18,6 % (prélèvements sociaux). Max 150 000 €.',
                taxAdvTip: 'PEA: under 5 år betalar du 31,4 % (12,8 % IR + 18,6 % sociala avgifter). Efter 5 år endast 18,6 %. Max 150 000 € insättningar.',
                taxAdvSliderHint: 'Standard: 31,4 % (12,8 % IR + 18,6 % sociala avgifter, 2026). PEA: 31,4 % under 5 år, därefter 18,6 %.',
                simplificationNote: 'Satser från 2026 (CSG höjd till 10,6 %). PEA-tiden räknas från kontots öppnande. Insättningar över 150 000 € beräknas på vanligt konto (CTO).'
            },
            en: {
                taxAdvLabel: 'PEA (Equity Savings Plan)',
                taxAdvDesc: 'Tax-advantaged stock account — 31.4% tax under 5 years, then 18.6% (social charges). Max €150,000.',
                taxAdvTip: 'PEA: under 5 years you pay 31.4% (12.8% income tax + 18.6% social charges). After 5 years only 18.6%. Max €150,000 deposits.',
                taxAdvSliderHint: 'Standard: 31.4% (12.8% income tax + 18.6% social charges, 2026). PEA: 31.4% under 5 years, then 18.6%.',
                simplificationNote: 'Rates from 2026 (CSG raised to 10.6%). The PEA clock runs from account opening. Deposits above €150,000 are calculated in a standard account (CTO).'
            }
        }
    },

    // ==========================================================
    //  BRITTISKA ÖARNA (2 länder)
    // ==========================================================

    GB: {
        code: 'GB', name: { sv: 'Storbritannien', en: 'United Kingdom' },
        currency: 'GBP', locale: 'en-GB', region: 'british',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.18, capitalGainsTaxHigh: 0.24, capitalGainsTaxThreshold: 37700, capitalGainsTaxBrackets: [{ threshold: 3000, rate: 0 }, { threshold: 40700, rate: 0.18 }, { rate: 0.24 }] },
        taxAdvRegime: 'TAX_FREE_WRAPPER',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: {},
        taxAdvCap: { annual: 20000 },  // ISA: £20 000 per skatteår
        ui: {
            sv: {
                taxAdvLabel: 'ISA (Individual Savings Account)',
                taxAdvDesc: 'Helt skattefri investeringsform — ingen skatt på avkastning eller uttag, max £20 000/år.',
                taxAdvTip: 'ISA: helt skattefritt. Ingen kapitalvinstskatt, ingen inkomstskatt på utdelningar. Max £20 000 per skatteår.',
                taxAdvSliderHint: 'Vanligt konto: 18/24 % kapitalvinstskatt (okt 2024). £3 000 skattefritt/år. 18 % inom basinkomstbandet, 24 % över.',
                simplificationNote: 'Vanligt konto: förutsätter att du saknar annan beskattningsbar inkomst (hela basic rate band ledigt) och att allt säljs samma år. Insättningar över £20 000/år beräknas på vanligt konto.'
            },
            en: {
                taxAdvLabel: 'ISA (Individual Savings Account)',
                taxAdvDesc: 'Completely tax-free wrapper — no tax on gains or withdrawals. Max £20,000/year contributions.',
                taxAdvTip: 'ISA: completely tax-free. No capital gains tax, no income tax on dividends. Max £20,000 per tax year.',
                taxAdvSliderHint: 'Standard account: 18/24% CGT (Oct 2024). £3,000 tax-free allowance/year. 18% within basic rate band, 24% above.',
                simplificationNote: 'Standard account: assumes no other taxable income (full basic rate band available) and that everything is sold in one year. Contributions above £20,000/year are calculated in a standard account.'
            }
        }
    },

    IE: {
        code: 'IE', name: { sv: 'Irland', en: 'Ireland' },
        currency: 'EUR', locale: 'en-IE', region: 'british',
        // ETF:er/fonder: exit tax 38 % (från 2026) + deemed disposal vart 8:e år.
        // (Enskilda aktier: CGT 33 % med €1 270 fribelopp — modelleras ej.)
        standardRegime: 'EXIT_TAX',
        standardParams: { capitalGainsTax: 0.38, exitTax: 0.38, deemedDisposalYears: 8 },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: {
                taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '',
                taxAdvSliderHint: 'Exit tax 38 % på ETF:er/fonder (från 2026), deemed disposal vart 8:e år.',
                simplificationNote: 'Beräknat för ETF:er/fonder: exit tax 38 % (från 2026), utan fribelopp. Vart 8:e år efter varje köp beskattas orealiserad vinst (deemed disposal); skatten antas betalas genom att andelar säljs. Enskilda aktier beskattas i stället med 33 % CGT och €1 270 fribelopp.'
            },
            en: {
                taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '',
                taxAdvSliderHint: 'Exit tax 38% on ETFs/funds (from 2026), deemed disposal every 8 years.',
                simplificationNote: 'Calculated for ETFs/funds: 38% exit tax (from 2026), no annual exemption. Every 8 years after each purchase unrealised gains are taxed (deemed disposal); the tax is assumed to be paid by selling units. Individual shares are instead taxed at 33% CGT with a €1,270 exemption.'
            }
        }
    },

    // ==========================================================
    //  BENELUX (2 länder)
    // ==========================================================

    NL: {
        code: 'NL', name: { sv: 'Nederländerna', en: 'Netherlands' },
        currency: 'EUR', locale: 'nl-NL', region: 'benelux',
        standardRegime: 'DUTCH_BOX3',
        standardParams: { deemedReturn: 0.06, taxRate: 0.36, exemption: 59357 },  // Box 3 2026
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Box 3 (2026): schablonavkastning 6 % × 36 % skatt ≈ 2,16 %/år på förmögenhet över €59 357. Ingen kapitalvinstskatt.',
                simplificationNote: 'Box 3 2026: 6 % schablonavkastning på värdet 1 januari över fribeloppet €59 357 (per person), beskattas med 36 %. Skatten betalas separat. Möjligheten att i stället redovisa faktisk avkastning (tegenbewijs) ingår inte.'
            },
            en: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Box 3 (2026): deemed return 6% × 36% tax ≈ 2.16%/year on assets above €59,357. No capital gains tax.',
                simplificationNote: 'Box 3 2026: 6% deemed return on the 1 January value above the €59,357 allowance (per person), taxed at 36%. Tax is paid separately. The option to report actual returns (tegenbewijs) is not included.'
            }
        }
    },

    BE: {
        code: 'BE', name: { sv: 'Belgien', en: 'Belgium' },
        currency: 'EUR', locale: 'nl-BE', region: 'benelux',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.10, capitalGainsTaxBrackets: [{ threshold: 10000, rate: 0 }, { rate: 0.10 }] },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: {
                taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '',
                taxAdvSliderHint: '10 % kapitalvinstskatt fr.o.m. 2026 (historiska vinster t.o.m. 2025: 0 %). Första €10 000/år undantagna.',
                simplificationNote: 'Fribeloppet €10 000 används en gång, som om allt säljs samma år (i verkligheten kan det utnyttjas årligen). Börsskatt (TOB) ingår inte.'
            },
            en: {
                taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '',
                taxAdvSliderHint: '10% CGT from 2026 (historical gains through 2025: 0%). First €10,000/year exempt.',
                simplificationNote: 'The €10,000 exemption is used once, as if everything is sold in one year (in reality it can be used annually). Stock exchange tax (TOB) is not included.'
            }
        }
    },

    // ==========================================================
    //  CENTRALEUROPA (1 land)
    // ==========================================================

    AT: {
        code: 'AT', name: { sv: 'Österrike', en: 'Austria' },
        currency: 'EUR', locale: 'de-AT', region: 'central',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.275 },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'KESt (Kapitalertragsteuer) 27,5 % på kapitalvinster och utdelningar.', simplificationNote: 'KESt 27,5 % på vinsten vid försäljning. Årlig beskattning av ackumulerande utländska fonder (ausschüttungsgleiche Erträge) ingår inte.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'KESt (Kapitalertragsteuer) 27.5% on capital gains and dividends.', simplificationNote: 'KESt 27.5% on the gain when sold. Annual taxation of accumulating foreign funds (deemed distributed income) is not included.' }
        }
    },

    // ==========================================================
    //  ÖSTEUROPA (2 länder)
    // ==========================================================

    PL: {
        code: 'PL', name: { sv: 'Polen', en: 'Poland' },
        currency: 'PLN', locale: 'pl-PL', region: 'eastern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.19 },
        // IKE (Indywidualne Konto Emerytalne): max 28 260 PLN/år (2026), 0 % skatt.
        // IKZE (Indywidualne Konto Zabezpieczenia Emerytalnego): max ~12 000 PLN/år,
        // insättningar avdragsgilla, uttag beskattas som inkomst (10 %).
        // Modellerar IKE (enklare, populärare).
        taxAdvRegime: 'TAX_FREE_WRAPPER',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: {},
        taxAdvCap: { annual: 28260 },  // IKE 2026: 28 260 PLN/år
        ui: {
            sv: {
                taxAdvLabel: 'IKE (Indywidualne Konto Emerytalne)',
                taxAdvDesc: 'Helt skattefritt pensionssparkonto — 0 % skatt på avkastning och uttag, max 28 260 PLN/år (2026).',
                taxAdvTip: 'IKE: helt skattefritt. Ingen kapitalvinstskatt, ingen inkomstskatt på utdelningar. Max 28 260 PLN per år (2026).',
                taxAdvSliderHint: 'Vanligt konto: 19 % kapitalvinstskatt (rycza\u0142t). IKE: 0 % skatt.',
                simplificationNote: 'IKE är skattefritt vid uttag efter 60 års ålder. Insättningar över 28 260 PLN/år (2026, taket indexeras årligen) beräknas på vanligt konto.'
            },
            en: {
                taxAdvLabel: 'IKE (Individual Retirement Account)',
                taxAdvDesc: 'Completely tax-free retirement account — 0% tax on gains and withdrawals, max 28,260 PLN/yr (2026).',
                taxAdvTip: 'IKE: completely tax-free. No CGT, no income tax on dividends. Max 28,260 PLN per year (2026).',
                taxAdvSliderHint: 'Standard account: 19% CGT (rycza\u0142t). IKE: 0% tax.',
                simplificationNote: 'IKE is tax-free on withdrawal after age 60. Contributions above 28,260 PLN/year (2026, the cap is indexed annually) are calculated in a standard account.'
            }
        }
    },

    CZ: {
        code: 'CZ', name: { sv: 'Tjeckien', en: 'Czechia' },
        currency: 'CZK', locale: 'cs-CZ', region: 'eastern',
        standardRegime: 'TIME_TEST_CGT',
        // Tidstest per köp: varje post blir skattefri efter 3 års innehav.
        standardParams: { timeTestThreshold: 3, timeTestPerLot: true, capitalGainsTax: 0.15 },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 15 %. Skattefritt efter 3 års innehav (tidstest).', simplificationNote: 'Tidstestet gäller varje köp för sig: insättningar gjorda de sista 3 åren före försäljning beskattas med 15 %. Värdegränsen 100 000 CZK/år och 23 %-steget ingår inte.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 15%. Tax-free after 3 years holding (time test).', simplificationNote: 'The time test applies to each purchase separately: deposits made in the last 3 years before sale are taxed at 15%. The CZK 100,000/year value test and the 23% band are not included.' }
        }
    },

    // ==========================================================
    //  SYDEUROPA (3 länder)
    // ==========================================================

    IT: {
        code: 'IT', name: { sv: 'Italien', en: 'Italy' },
        currency: 'EUR', locale: 'it-IT', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.26 },
        // PIR: 5-års tröskel för skattefrihet. TIME_TEST_CGT hanterar tröskeln.
        // Kvalificerade investeringar (minst 70 % i italienska/EU-bolag) antas uppfyllda.
        taxAdvRegime: 'TIME_TEST_CGT',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { timeTestThreshold: 5, timeTestPerLot: true, capitalGainsTax: 0.26 },
        taxAdvCap: { annual: 40000, lifetime: 200000 },  // PIR ordinario
        ui: {
            sv: {
                taxAdvLabel: 'PIR (Piano Individuale di Risparmio)',
                taxAdvDesc: 'Skattefri efter 5 år, 26 % CGT under 5 år — max €40 000/år, €200 000 totalt.',
                taxAdvTip: 'PIR: 26 % kapitalvinstskatt på innehav kortare än 5 år. Därefter skattefritt. Investerar i italienska och europeiska bolag.',
                taxAdvSliderHint: 'Standard: 26 % kapitalvinstskatt. PIR: 26 % under 5 år, därefter 0 % skatt.',
                simplificationNote: 'PIR: varje insättning måste hållas 5 år för att bli skattefri — insättningar de sista 5 åren beskattas med 26 %. Insättningar över €40 000/år eller €200 000 totalt beräknas på vanligt konto.'
            },
            en: {
                taxAdvLabel: 'PIR (Individual Savings Plan)',
                taxAdvDesc: 'Tax-free after 5 years, 26% CGT under 5 years — max €40,000/year, €200,000 total.',
                taxAdvTip: 'PIR: 26% CGT on holdings under 5 years. Then tax-free. Invests in Italian and European companies.',
                taxAdvSliderHint: 'Standard: 26% CGT. PIR: 26% under 5 years, then 0% tax.',
                simplificationNote: 'PIR: each deposit must be held for 5 years to become tax-free — deposits in the last 5 years are taxed at 26%. Deposits above €40,000/year or €200,000 in total are calculated in a standard account.'
            }
        }
    },

    ES: {
        code: 'ES', name: { sv: 'Spanien', en: 'Spain' },
        currency: 'EUR', locale: 'es-ES', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.19, capitalGainsTaxHigh: 0.30, capitalGainsTaxThreshold: 300000, capitalGainsTaxBrackets: [{ threshold: 6000, rate: 0.19 }, { threshold: 50000, rate: 0.21 }, { threshold: 200000, rate: 0.23 }, { threshold: 300000, rate: 0.27 }, { rate: 0.30 }] },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Progressiv kapitalvinstskatt: 19 % upp till €6 000, 21 % €6k–€50k, 23 % €50k–€200k, 27 % €200k–€300k, 30 % över.', simplificationNote: 'Base del ahorro (2025–): 19/21/23/27/30 %. Hela vinsten antas realiseras samma år.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Progressive CGT: 19% up to €6,000, 21% €6k–€50k, 23% €50k–€200k, 27% €200k–€300k, 30% above.', simplificationNote: 'Savings base (2025–): 19/21/23/27/30%. The whole gain is assumed to be realised in one year.' }
        }
    },

    GR: {
        code: 'GR', name: { sv: 'Grekland', en: 'Greece' },
        currency: 'EUR', locale: 'el-GR', region: 'southern',
        standardRegime: 'CGT_ONLY',
        // Noterade aktier (innehav < 0,5 %) och UCITS-fonder från EU/EES: vinster skattefria.
        // 15 % gäller endast innehav ≥ 0,5 % och övriga värdepapper.
        standardParams: { capitalGainsTax: 0 },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Vinster på noterade aktier (innehav under 0,5 %) och UCITS-fonder från EU/EES är skattefria.', simplificationNote: 'Beräknat för en privat sparare i noterade aktier (under 0,5 % av bolaget) eller UCITS-fonder från EU/EES: 0 % kapitalvinstskatt. Större innehav och övriga värdepapper beskattas med 15 %.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Gains on listed shares (holding under 0.5%) and EU/EEA UCITS funds are tax-exempt.', simplificationNote: 'Calculated for a private investor in listed shares (under 0.5% of the company) or EU/EEA UCITS funds: 0% capital gains tax. Larger holdings and other securities are taxed at 15%.' }
        }
    },

    // ==========================================================
    //  BALTIKUM (3 länder)
    // ==========================================================

    EE: {
        code: 'EE', name: { sv: 'Estland', en: 'Estonia' },
        currency: 'EUR', locale: 'et-EE', region: 'baltics',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.22 },
        taxAdvRegime: 'DEFERRED_PLAIN',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { capitalGainsTax: 0.22 },
        ui: {
            sv: {
                taxAdvLabel: 'Investeringskonto (Investeerimiskonto)',
                taxAdvDesc: 'Uppskjuten skatt — du betalar 22 % skatt först vid uttag från kontot.',
                taxAdvTip: 'Estniskt investeringskonto: skatten skjuts upp tills du tar ut pengar från kontot. Alla vinster återinvesteras skattefritt.',
                taxAdvSliderHint: 'Standardkonto: 22 % kapitalvinstskatt vid realisering (fr.o.m. 2025). Investeringskonto: 22 % vid uttag.',
                simplificationNote: 'Inkomstskatten är 22 % även 2026 (den planerade höjningen till 24 % genomfördes inte).'
            },
            en: {
                taxAdvLabel: 'Investment Account (Investeerimiskonto)',
                taxAdvDesc: 'Deferred tax — you pay 22% tax only when withdrawing from the account.',
                taxAdvTip: 'Estonian investment account: tax is deferred until you withdraw. All gains are reinvested tax-free.',
                taxAdvSliderHint: 'Standard: 22% CGT on realization (from 2025). Investment account: 22% on withdrawal.',
                simplificationNote: 'Income tax remains 22% in 2026 (the planned increase to 24% was not implemented).'
            }
        }
    },

    LV: {
        code: 'LV', name: { sv: 'Lettland', en: 'Latvia' },
        currency: 'EUR', locale: 'lv-LV', region: 'baltics',
        standardRegime: 'CGT_ONLY',
        // Kapitalvinster 25,5 % fr.o.m. 2025 (+3 % om total inkomst > €200 000).
        standardParams: { capitalGainsTax: 0.255 },
        taxAdvRegime: 'DEFERRED_PLAIN',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { capitalGainsTax: 0.255 },
        ui: {
            sv: {
                taxAdvLabel: 'Investeringskonto (Ieguldījumu konts)',
                taxAdvDesc: 'Uppskjuten skatt — du betalar 25,5 % skatt först vid uttag från kontot.',
                taxAdvTip: 'Lettiskt investeringskonto: skatten skjuts upp tills uttag. 25,5 % på vinsten.',
                taxAdvSliderHint: 'Standardkonto: 25,5 % kapitalvinstskatt (fr.o.m. 2025). Investeringskonto: uppskjuten 25,5 % vid uttag.',
                simplificationNote: 'Tilläggsskatten 3 % för inkomster över €200 000/år ingår inte.'
            },
            en: {
                taxAdvLabel: 'Investment Account (Ieguldījumu konts)',
                taxAdvDesc: 'Deferred tax — you pay 25.5% tax only when withdrawing from the account.',
                taxAdvTip: 'Latvian investment account: tax deferred until withdrawal. 25.5% on gains.',
                taxAdvSliderHint: 'Standard: 25.5% CGT (from 2025). Investment account: deferred 25.5% on withdrawal.',
                simplificationNote: 'The additional 3% tax on income above €200,000/year is not included.'
            }
        }
    },

    LT: {
        code: 'LT', name: { sv: 'Litauen', en: 'Lithuania' },
        currency: 'EUR', locale: 'lt-LT', region: 'baltics',
        standardRegime: 'CGT_ONLY',
        // 15 % (innehav ≥ 5 år eller inom första inkomststeget), €500 årligt fribelopp
        // utanför investeringskontot. Investeringskonto: 15 % på uttag över insatt belopp.
        standardParams: { capitalGainsTax: 0.15, capitalGainsTaxBrackets: [{ threshold: 500, rate: 0 }, { rate: 0.15 }] },
        taxAdvRegime: 'DEFERRED_PLAIN',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { capitalGainsTax: 0.15 },
        ui: {
            sv: {
                taxAdvLabel: 'Investeringskonto (Investicinė sąskaita)',
                taxAdvDesc: 'Uppskjuten skatt — du betalar 15 % skatt först vid uttag från kontot.',
                taxAdvTip: 'Litauiskt investeringskonto: skatten skjuts upp tills uttag. Max 15 % på vinsten.',
                taxAdvSliderHint: 'Standardkonto: 15 % kapitalvinstskatt, €500 fribelopp/år. Investeringskonto: uppskjuten 15 % vid uttag.',
                simplificationNote: 'Vanligt konto: 15 % förutsätter innehav i minst 5 år eller att vinsten ryms i första inkomststeget; kortare innehav med höga vinster kan beskattas med 20–32 %.'
            },
            en: {
                taxAdvLabel: 'Investment Account (Investicinė sąskaita)',
                taxAdvDesc: 'Deferred tax — you pay 15% tax only when withdrawing from the account.',
                taxAdvTip: 'Lithuanian investment account: tax deferred until withdrawal. Max 15% on gains.',
                taxAdvSliderHint: 'Standard: 15% CGT, €500 annual exemption. Investment account: deferred 15% on withdrawal.',
                simplificationNote: 'Standard account: 15% assumes holdings of at least 5 years or gains within the first income band; shorter holdings with large gains can be taxed at 20–32%.'
            }
        }
    },

    // ==========================================================
    //  BALKAN (0 länder)
    // ==========================================================
};

// ============================================================
//  Hjälpfunktion — hämtar landskonfiguration för en landskod.
//  Returnerar Sverige som fallback om koden saknas.
// ============================================================
function getCountryConfig(code) {
    if (!COUNTRY_CONFIG[code]) {
        if (typeof console !== 'undefined') console.warn('Pengamaskinen: ok\u00E4nd landskod "' + code + '", fallback till SE');
        return COUNTRY_CONFIG.SE;
    }
    return COUNTRY_CONFIG[code];
}
