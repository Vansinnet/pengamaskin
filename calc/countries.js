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
        standardParams: { capitalGainsTax: 0.30 },
        taxAdvRegime: 'ISK',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { iskSchablonGolv: 1.25, iskFribelopp: 300000, iskSchablonRateDefault: 3.55, iskSkatt: 0.30 },
        ui: {
            sv: {
                taxAdvLabel: 'ISK (Investeringssparkonto)',
                taxAdvDesc: 'Schablonbeskattning på kapitalunderlaget varje år — ingen reavinstskatt vid uttag.',
                taxAdvTip: 'ISK beskattas med en schablonskatt varje år oavsett vinst eller förlust. Fördelaktigt vid hög avkastning.',
                taxAdvSliderHint: '2026: statslåneränta 2,55 % + 1 % = <strong>3,55 %</strong>. Effektiv skatt = schablonränta × 30 %. Golv: 1,25 %. Fribelopp: 300 000 kr.'
            },
            en: {
                taxAdvLabel: 'ISK (Investment Savings Account)',
                taxAdvDesc: 'Standard-rate taxation on the capital base each year — no capital gains tax on withdrawal.',
                taxAdvTip: 'ISK is taxed with a flat rate each year regardless of profit or loss. Advantageous when returns are high.',
                taxAdvSliderHint: '2026: govt bond rate 2.55% + 1% = <strong>3.55%</strong>. Effective tax = rate × 30%. Floor: 1.25%. Exempt: SEK 300,000.'
            }
        }
    },

    NO: {
        code: 'NO', name: { sv: 'Norge', en: 'Norway' },
        currency: 'NOK', locale: 'nb-NO', region: 'nordic',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.3784 },
        taxAdvRegime: 'DEFERRED_SKJERMING',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { capitalGainsTax: 0.3784, skjermingsrente: 3.6 },
        ui: {
            sv: {
                taxAdvLabel: 'ASK (Aksjesparekonto)',
                taxAdvDesc: 'Uppskjuten skatt med skjermingsfradrag — beskattas vid uttag (37,84 % efter avdrag).',
                taxAdvTip: 'Norsk ASK: skatten skjuts upp till uttag. Skjermingsfradrag (riskfri avkastning) dras av från vinsten.',
                taxAdvSliderHint: 'Skjermingsrente: ~3,6 %/år (Skatteetaten, 2025). Dras av från vinsten innan skatt beräknas.'
            },
            en: {
                taxAdvLabel: 'ASK (Share Savings Account)',
                taxAdvDesc: 'Deferred tax with shield deduction — taxed upon withdrawal (37.84% on gains after deduction).',
                taxAdvTip: 'Norwegian ASK: tax is deferred to withdrawal. Shield deduction (risk-free return) is subtracted from gains.',
                taxAdvSliderHint: 'Shield rate: ~3.6%/year (Tax Administration, 2025). Deducted from gains before tax.'
            }
        }
    },

    DK: {
        code: 'DK', name: { sv: 'Danmark', en: 'Denmark' },
        currency: 'DKK', locale: 'da-DK', region: 'nordic',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.27, capitalGainsTaxHigh: 0.42, capitalGainsTaxThreshold: 67500, capitalGainsTaxBrackets: [{ threshold: 67500, rate: 0.27 }, { rate: 0.42 }] },
        taxAdvRegime: 'LAGER_ANNUAL',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { askAnnualTax: 0.17 },
        ui: {
            sv: {
                taxAdvLabel: 'ASK (Aktiesparekonto)',
                taxAdvDesc: '17 % årlig lagerbeskatning — skatten dras direkt från kontot varje år.',
                taxAdvTip: 'Dansk ASK: 17 % skatt på årets avkastning (realiserad + orealiserad). Förluster kan framföras.',
                taxAdvSliderHint: 'Fast 17 % skatt på årets totala avkastning. Skatten dras direkt från kontot.'
            },
            en: {
                taxAdvLabel: 'ASK (Share Savings Account)',
                taxAdvDesc: '17% annual inventory taxation — tax deducted from the account each year.',
                taxAdvTip: 'Danish ASK: 17% tax on the year\'s total return. Losses can be carried forward.',
                taxAdvSliderHint: 'Flat 17% tax on annual total return. Tax is deducted directly from the account.'
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
        ui: {
            sv: {
                taxAdvLabel: 'OSK (Osakesäästötili)',
                taxAdvDesc: 'Uppskjuten skatt — beskattas först vid uttag (30/34 % progressivt).',
                taxAdvTip: 'Finsk OSK: skatten betalas först vid uttag. Max 100 000 € insättningar totalt.',
                taxAdvSliderHint: 'Progressiv skatt: 30 % upp till 30 000 €, 34 % över.'
            },
            en: {
                taxAdvLabel: 'OSK (Equity Savings Account)',
                taxAdvDesc: 'Deferred tax — taxed only upon withdrawal (30/34% progressive).',
                taxAdvTip: 'Finnish OSK: tax is paid only on withdrawal. Max €100,000 total deposits.',
                taxAdvSliderHint: 'Progressive tax: 30% up to €30,000, 34% above.'
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
        standardParams: { capitalGainsTax: 0.26375, capitalGainsTaxBrackets: [{ threshold: 1000, rate: 0 }, { rate: 0.26375 }] },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Abgeltungsteuer 25 % + Solidaritätszuschlag 5,5 % = 26,375 %. Sparerpauschbetrag 1 000 €/år skattefritt.'
            },
            en: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Abgeltungsteuer 25% + Solidarity surcharge 5.5% = 26.375%. Saver\'s allowance €1,000/year tax-free.'
            }
        }
    },

    FR: {
        code: 'FR', name: { sv: 'Frankrike', en: 'France' },
        currency: 'EUR', locale: 'fr-FR', region: 'western',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.30 },
        // PEA: 5-års tröskel för skattelättnad. TIME_TEST_CGT med graderade brytpunkter.
        taxAdvRegime: 'TIME_TEST_CGT',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: {
            timeTestGraded: [
                { years: 5, rate: 0.30 },
                { rate: 0.172 }
            ]
        },
        ui: {
            sv: {
                taxAdvLabel: 'PEA (Plan d\'Épargne en Actions)',
                taxAdvDesc: 'Skattegynnat aktiesparkonto — 30 % skatt under 5 år, därefter 17,2 % (CSG/CRDS). Max 150 000 €.',
                taxAdvTip: 'PEA: under 5 år betalar du 30 % (12,8 % IR + 17,2 % CSG). Efter 5 år endast 17,2 % CSG. Max 150 000 € insättningar.',
                taxAdvSliderHint: 'Standard: 30 % (12,8 % IR + 17,2 % CSG). PEA: 30 % under 5 år, därefter 17,2 % CSG.'
            },
            en: {
                taxAdvLabel: 'PEA (Equity Savings Plan)',
                taxAdvDesc: 'Tax-advantaged stock account — 30% tax under 5 years, then 17.2% (CSG/CRDS). Max €150,000.',
                taxAdvTip: 'PEA: under 5 years you pay 30% (12.8% income tax + 17.2% CSG). After 5 years only 17.2% CSG. Max €150,000 deposits.',
                taxAdvSliderHint: 'Standard: 30% (12.8% income tax + 17.2% CSG). PEA: 30% under 5 years, then 17.2% CSG.'
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
        ui: {
            sv: {
                taxAdvLabel: 'ISA (Individual Savings Account)',
                taxAdvDesc: 'Helt skattefri investeringsform — ingen skatt på avkastning eller uttag, max £20 000/år.',
                taxAdvTip: 'ISA: helt skattefritt. Ingen kapitalvinstskatt, ingen inkomstskatt på utdelningar. Max £20 000 per skatteår.',
                taxAdvSliderHint: 'Vanligt konto: 18/24 % kapitalvinstskatt (okt 2024). £3 000 skattefritt/år. 18 % inom basinkomstbandet, 24 % över.'
            },
            en: {
                taxAdvLabel: 'ISA (Individual Savings Account)',
                taxAdvDesc: 'Completely tax-free wrapper — no tax on gains or withdrawals. Max £20,000/year contributions.',
                taxAdvTip: 'ISA: completely tax-free. No capital gains tax, no income tax on dividends. Max £20,000 per tax year.',
                taxAdvSliderHint: 'Standard account: 18/24% CGT (Oct 2024). £3,000 tax-free allowance/year. 18% within basic rate band, 24% above.'
            }
        }
    },

    IE: {
        code: 'IE', name: { sv: 'Irland', en: 'Ireland' },
        currency: 'EUR', locale: 'en-IE', region: 'british',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.33, capitalGainsTaxBrackets: [{ threshold: 1270, rate: 0 }, { rate: 0.33 }] },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: {
                taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '',
                taxAdvSliderHint: 'Kapitalvinstskatt 33 %. Första €1 270 per år är skattefria.'
            },
            en: {
                taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '',
                taxAdvSliderHint: 'CGT 33%. First €1,270 per year is tax-free.'
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
        standardParams: { deemedReturn: 0.0604, taxRate: 0.36, exemption: 57000 },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Box 3: schablonavkastning ~6,04 % × 36 % skatt ≈ 2,17 %/år på förmögenhet över €57 000 (2024). Ingen kapitalvinstskatt.'
            },
            en: {
                taxAdvLabel: '',
                taxAdvDesc: '',
                taxAdvTip: '',
                taxAdvSliderHint: 'Box 3: deemed return ~6.04% × 36% tax ≈ 2.17%/year on assets above €57,000 (2024). No capital gains tax.'
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
                taxAdvSliderHint: '10 % kapitalvinstskatt fr.o.m. 2026 (historiska vinster t.o.m. 2025: 0 %). Första €10 000/år undantagna.'
            },
            en: {
                taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '',
                taxAdvSliderHint: '10% CGT from 2026 (historical gains through 2025: 0%). First €10,000/year exempt.'
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
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'KESt (Kapitalertragsteuer) 27,5 % på kapitalvinster och utdelningar.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'KESt (Kapitalertragsteuer) 27.5% on capital gains and dividends.' }
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
        // IKE (Indywidualne Konto Emerytalne): max ~24 000 PLN/år, 0 % skatt.
        // IKZE (Indywidualne Konto Zabezpieczenia Emerytalnego): max ~12 000 PLN/år,
        // insättningar avdragsgilla, uttag beskattas som inkomst (10 %).
        // Modellerar IKE (enklare, populärare).
        taxAdvRegime: 'TAX_FREE_WRAPPER',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: {},
        ui: {
            sv: {
                taxAdvLabel: 'IKE (Indywidualne Konto Emerytalne)',
                taxAdvDesc: 'Helt skattefritt pensionssparkonto — 0 % skatt på avkastning och uttag, max ~24 000 PLN/år.',
                taxAdvTip: 'IKE: helt skattefritt. Ingen kapitalvinstskatt, ingen inkomstskatt på utdelningar. Max ~24 000 PLN per år.',
                taxAdvSliderHint: 'Vanligt konto: 19 % kapitalvinstskatt (rycza\u0142t). IKE: 0 % skatt.'
            },
            en: {
                taxAdvLabel: 'IKE (Individual Retirement Account)',
                taxAdvDesc: 'Completely tax-free retirement account — 0% tax on gains and withdrawals, max ~24,000 PLN/yr.',
                taxAdvTip: 'IKE: completely tax-free. No CGT, no income tax on dividends. Max ~24,000 PLN per year.',
                taxAdvSliderHint: 'Standard account: 19% CGT (rycza\u0142t). IKE: 0% tax.'
            }
        }
    },

    CZ: {
        code: 'CZ', name: { sv: 'Tjeckien', en: 'Czechia' },
        currency: 'CZK', locale: 'cs-CZ', region: 'eastern',
        standardRegime: 'TIME_TEST_CGT',
        standardParams: { timeTestThreshold: 3, capitalGainsTax: 0.15 },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 15 %. Skattefritt efter 3 års innehav (tidstest).' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 15%. Tax-free after 3 years holding (time test).' }
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
        taxAdvParams: { timeTestThreshold: 5, capitalGainsTax: 0.26 },
        ui: {
            sv: {
                taxAdvLabel: 'PIR (Piano Individuale di Risparmio)',
                taxAdvDesc: 'Skattefri efter 5 år, 26 % CGT under 5 år — max €40 000/år, €200 000 totalt.',
                taxAdvTip: 'PIR: 26 % kapitalvinstskatt under de första 5 åren. Därefter helt skattefritt. Investerar i italienska och europeiska bolag.',
                taxAdvSliderHint: 'Standard: 26 % kapitalvinstskatt. PIR: 26 % under 5 år, därefter 0 % skatt.'
            },
            en: {
                taxAdvLabel: 'PIR (Individual Savings Plan)',
                taxAdvDesc: 'Tax-free after 5 years, 26% CGT under 5 years — max €40,000/year, €200,000 total.',
                taxAdvTip: 'PIR: 26% CGT during the first 5 years. Then completely tax-free. Invests in Italian and European companies.',
                taxAdvSliderHint: 'Standard: 26% CGT. PIR: 26% under 5 years, then 0% tax.'
            }
        }
    },

    ES: {
        code: 'ES', name: { sv: 'Spanien', en: 'Spain' },
        currency: 'EUR', locale: 'es-ES', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.19, capitalGainsTaxHigh: 0.26, capitalGainsTaxThreshold: 200000, capitalGainsTaxBrackets: [{ threshold: 6000, rate: 0.19 }, { threshold: 50000, rate: 0.21 }, { threshold: 200000, rate: 0.23 }, { rate: 0.26 }] },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Progressiv kapitalvinstskatt: 19 % upp till €6 000, 21 % €6k–€50k, 23 % €50k–€200k, 26 % över.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Progressive CGT: 19% up to €6,000, 21% €6k–€50k, 23% €50k–€200k, 26% above.' }
        }
    },

    GR: {
        code: 'GR', name: { sv: 'Grekland', en: 'Greece' },
        currency: 'EUR', locale: 'el-GR', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.15 },
        taxAdvRegime: null, taxAdvParams: null,  // Döljs i UI:t — ingen separat skattegynnad kontotyp för landet
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 15 % på noterade aktier och fonder.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 15% on listed stocks and funds.' }
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
                taxAdvSliderHint: 'Standardkonto: 22 % kapitalvinstskatt vid realisering (fr.o.m. 2025). Investeringskonto: 22 % vid uttag.'
            },
            en: {
                taxAdvLabel: 'Investment Account (Investeerimiskonto)',
                taxAdvDesc: 'Deferred tax — you pay 22% tax only when withdrawing from the account.',
                taxAdvTip: 'Estonian investment account: tax is deferred until you withdraw. All gains are reinvested tax-free.',
                taxAdvSliderHint: 'Standard: 22% CGT on realization (from 2025). Investment account: 22% on withdrawal.'
            }
        }
    },

    LV: {
        code: 'LV', name: { sv: 'Lettland', en: 'Latvia' },
        currency: 'EUR', locale: 'lv-LV', region: 'baltics',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.20 },
        taxAdvRegime: 'DEFERRED_PLAIN',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { capitalGainsTax: 0.20 },
        ui: {
            sv: {
                taxAdvLabel: 'Investeringskonto (Ieguldījumu konts)',
                taxAdvDesc: 'Uppskjuten skatt — du betalar 20 % skatt först vid uttag från kontot.',
                taxAdvTip: 'Lettiskt investeringskonto: skatten skjuts upp tills uttag. Max 20 % på vinsten.',
                taxAdvSliderHint: 'Standardkonto: 20 % kapitalvinstskatt. Investeringskonto: uppskjuten 20 % vid uttag.'
            },
            en: {
                taxAdvLabel: 'Investment Account (Ieguldījumu konts)',
                taxAdvDesc: 'Deferred tax — you pay 20% tax only when withdrawing from the account.',
                taxAdvTip: 'Latvian investment account: tax deferred until withdrawal. Max 20% on gains.',
                taxAdvSliderHint: 'Standard: 20% CGT. Investment account: deferred 20% on withdrawal.'
            }
        }
    },

    LT: {
        code: 'LT', name: { sv: 'Litauen', en: 'Lithuania' },
        currency: 'EUR', locale: 'lt-LT', region: 'baltics',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.15 },
        taxAdvRegime: 'DEFERRED_PLAIN',  // Visas i UI:t (kolumn/diagramlinje) — separat skattegynnad kontotyp
        taxAdvParams: { capitalGainsTax: 0.15 },
        ui: {
            sv: {
                taxAdvLabel: 'Investeringskonto (Investicinė sąskaita)',
                taxAdvDesc: 'Uppskjuten skatt — du betalar 15 % skatt först vid uttag från kontot.',
                taxAdvTip: 'Litauiskt investeringskonto: skatten skjuts upp tills uttag. Max 15 % på vinsten.',
                taxAdvSliderHint: 'Standardkonto: 15 % kapitalvinstskatt. Investeringskonto: uppskjuten 15 % vid uttag.'
            },
            en: {
                taxAdvLabel: 'Investment Account (Investicinė sąskaita)',
                taxAdvDesc: 'Deferred tax — you pay 15% tax only when withdrawing from the account.',
                taxAdvTip: 'Lithuanian investment account: tax deferred until withdrawal. Max 15% on gains.',
                taxAdvSliderHint: 'Standard: 15% CGT. Investment account: deferred 15% on withdrawal.'
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
