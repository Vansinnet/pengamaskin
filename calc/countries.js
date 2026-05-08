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
    //  NORDEN (5 länder)
    // ==========================================================

    SE: {
        code: 'SE', name: { sv: 'Sverige', en: 'Sweden' },
        currency: 'SEK', locale: 'sv-SE', region: 'nordic',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.30 },
        taxAdvRegime: 'ISK',
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
        taxAdvRegime: 'DEFERRED_SKJERMING',
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
        taxAdvRegime: 'LAGER_ANNUAL',
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
        taxAdvRegime: 'DEFERRED_PLAIN',
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

    IS: {
        code: 'IS', name: { sv: 'Island', en: 'Iceland' },
        currency: 'ISK', locale: 'is-IS', region: 'nordic',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.22 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '' }
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
        taxAdvRegime: null, taxAdvParams: null,
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
        // Förenkling: PEA modelleras med 17,2 % direkt (antar 5+ års innehav).
        // Innan 5 år gäller 30 % (12,8 % IR + 17,2 % CSG). En korrekt modell
        // skulle kräva TIME_TEST_CGT med 5-års tröskel + regimbyte vid tröskeln.
        taxAdvRegime: 'DEFERRED_PLAIN',
        taxAdvParams: { capitalGainsTax: 0.172 },
        ui: {
            sv: {
                taxAdvLabel: 'PEA (Plan d\'Épargne en Actions)',
                taxAdvDesc: 'Skattegynnat aktiesparkonto — endast sociala avgifter (17,2 %) efter 5 år, max 150 000 €.',
                taxAdvTip: 'PEA: efter 5 år betalar du endast CSG/CRDS (17,2 %) på vinsten vid uttag. Max 150 000 € insättningar.',
                taxAdvSliderHint: 'Standard: 30 % (12,8 % IR + 17,2 % CSG). PEA efter 5 år: endast 17,2 % CSG.',
                simplificationNote: 'Förenkling: PEA-kontot antar att du håller investeringen i 5+ år (17,2 % skatt). Innan 5 år gäller 30 %.'
            },
            en: {
                taxAdvLabel: 'PEA (Equity Savings Plan)',
                taxAdvDesc: 'Tax-advantaged stock account — only social charges (17.2%) after 5 years, max €150,000.',
                taxAdvTip: 'PEA: after 5 years, only CSG/CRDS (17.2%) applies on withdrawal gains. Max €150,000 deposits.',
                taxAdvSliderHint: 'Standard: 30% (12.8% income tax + 17.2% CSG). PEA after 5 years: only 17.2% CSG.',
                simplificationNote: 'Simplification: The PEA account assumes you hold for 5+ years (17.2% tax). Before 5 years, 30% applies.'
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
        taxAdvRegime: 'TAX_FREE_WRAPPER',
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
        taxAdvRegime: null, taxAdvParams: null,
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
        taxAdvRegime: null, taxAdvParams: null,
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
        taxAdvRegime: null, taxAdvParams: null,
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
    //  CENTRALEUROPA (4 länder)
    // ==========================================================

    AT: {
        code: 'AT', name: { sv: 'Österrike', en: 'Austria' },
        currency: 'EUR', locale: 'de-AT', region: 'central',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.275 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'KESt (Kapitalertragsteuer) 27,5 % på kapitalvinster och utdelningar.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'KESt (Kapitalertragsteuer) 27.5% on capital gains and dividends.' }
        }
    },

    CH: {
        code: 'CH', name: { sv: 'Schweiz', en: 'Switzerland' },
        currency: 'CHF', locale: 'de-CH', region: 'central',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Ingen federal kapitalvinstskatt för privata investerare. Kantonal förmögenhetsskatt tillkommer.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'No federal CGT for private investors. Cantonal wealth tax applies separately.' }
        }
    },

    LI: {
        code: 'LI', name: { sv: 'Liechtenstein', en: 'Liechtenstein' },
        currency: 'CHF', locale: 'de-LI', region: 'central',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Ingen kapitalvinstskatt för privata investerare. Förmögenhetsskatt tillkommer.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'No CGT for private investors. Wealth tax applies.' }
        }
    },

    LU: {
        code: 'LU', name: { sv: 'Luxemburg', en: 'Luxembourg' },
        currency: 'EUR', locale: 'fr-LU', region: 'central',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '0 % kapitalvinstskatt efter 6 månaders innehav. Inom 6 mån: progressiv inkomstskatt.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '0% CGT after 6 months holding period. Within 6 months: progressive income tax.' }
        }
    },

    // ==========================================================
    //  SYDEUROPA (9 länder)
    // ==========================================================

    IT: {
        code: 'IT', name: { sv: 'Italien', en: 'Italy' },
        currency: 'EUR', locale: 'it-IT', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.26 },
        // Förenkling: PIR modelleras som helt skattefri (TAX_FREE_WRAPPER).
        // I verkligheten krävs 5 års innehav + minst 70 % i italienska/EU-bolag.
        // Innan 5 år återtas skatteförmånen. Antar långsiktigt sparande.
        taxAdvRegime: 'TAX_FREE_WRAPPER',
        taxAdvParams: {},
        ui: {
            sv: {
                taxAdvLabel: 'PIR (Piano Individuale di Risparmio)',
                taxAdvDesc: 'Helt skattefri efter 5 år — max €40 000/år, €200 000 totalt i kvalificerade investeringar.',
                taxAdvTip: 'PIR: helt skattefritt på avkastning efter 5 års innehav. Investerar i italienska och europeiska bolag.',
                taxAdvSliderHint: 'Standard: 26 % kapitalvinstskatt. PIR efter 5 år: 0 % skatt.',
                simplificationNote: 'Förenkling: PIR-kontot antar 5+ års innehav och kvalificerade investeringar. Innan 5 år återtas skatteförmånen.'
            },
            en: {
                taxAdvLabel: 'PIR (Individual Savings Plan)',
                taxAdvDesc: 'Completely tax-free after 5 years — max €40,000/year, €200,000 total in qualifying investments.',
                taxAdvTip: 'PIR: completely tax-free on returns after 5 years holding. Invests in Italian and European companies.',
                taxAdvSliderHint: 'Standard: 26% CGT. PIR after 5 years: 0% tax.',
                simplificationNote: 'Simplification: The PIR account assumes 5+ years holding and qualifying investments. Before 5 years, the tax benefit is reclaimed.'
            }
        }
    },

    ES: {
        code: 'ES', name: { sv: 'Spanien', en: 'Spain' },
        currency: 'EUR', locale: 'es-ES', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.19, capitalGainsTaxHigh: 0.26, capitalGainsTaxThreshold: 200000, capitalGainsTaxBrackets: [{ threshold: 6000, rate: 0.19 }, { threshold: 50000, rate: 0.21 }, { threshold: 200000, rate: 0.23 }, { rate: 0.26 }] },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Progressiv kapitalvinstskatt: 19 % upp till €6 000, 21 % €6k–€50k, 23 % €50k–€200k, 26 % över.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Progressive CGT: 19% up to €6,000, 21% €6k–€50k, 23% €50k–€200k, 26% above.' }
        }
    },

    PT: {
        code: 'PT', name: { sv: 'Portugal', en: 'Portugal' },
        currency: 'EUR', locale: 'pt-PT', region: 'southern',
        // Förenkling: Alltid 28 % kapitalvinstskatt. I verkligheten kan innehav
        // >1 år inkluderas i IRS (inkomstdeklarationen) och beskattas med
        // progressiv inkomstskatt (14,5–48 %), vilket kan vara lägre eller högre.
        // Modellen kan inte avgöra användarens marginalskattesats.
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.28 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 28 % på aktier/fonder. Innehav >1 år kan ge lägre skatt om inkluderat i IRS.',
                   simplificationNote: 'Förenkling: Alltid 28 % kapitalvinstskatt. Innehav >1 år kan i verkligheten deklareras som inkomst (14,5–48 % progressivt), vilket kan vara lägre.'
            },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 28% on stocks/funds. Holdings >1 year may qualify for lower rate if included in IRS.',
                   simplificationNote: 'Simplification: Always 28% CGT. Holdings >1 year may in reality be declared as income (14.5–48% progressive), which may be lower.'
            }
        }
    },

    GR: {
        code: 'GR', name: { sv: 'Grekland', en: 'Greece' },
        currency: 'EUR', locale: 'el-GR', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.15 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 15 % på noterade aktier och fonder.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 15% on listed stocks and funds.' }
        }
    },

    CY: {
        code: 'CY', name: { sv: 'Cypern', en: 'Cyprus' },
        currency: 'EUR', locale: 'el-CY', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '0 % kapitalvinstskatt på aktier och värdepapper. CGT gäller endast fast egendom.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '0% CGT on shares and securities. CGT only applies to real estate.' }
        }
    },

    MT: {
        code: 'MT', name: { sv: 'Malta', en: 'Malta' },
        currency: 'EUR', locale: 'mt-MT', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '0 % kapitalvinstskatt för ej domicilerade personer. 15 % för domicilerade på vissa tillgångar.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: '0% CGT for non-domiciled individuals. 15% for domiciled on certain assets.' }
        }
    },

    MC: {
        code: 'MC', name: { sv: 'Monaco', en: 'Monaco' },
        currency: 'EUR', locale: 'fr-MC', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Ingen kapitalvinstskatt för monegaskiska medborgare och residenter.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'No CGT for Monegasque citizens and residents.' }
        }
    },

    AD: {
        code: 'AD', name: { sv: 'Andorra', en: 'Andorra' },
        currency: 'EUR', locale: 'ca-AD', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Ingen kapitalvinstskatt på aktier och värdepapper.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'No CGT on stocks and securities.' }
        }
    },

    SM: {
        code: 'SM', name: { sv: 'San Marino', en: 'San Marino' },
        currency: 'EUR', locale: 'it-SM', region: 'southern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.0 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Ingen kapitalvinstskatt för privatpersoner på finansiella tillgångar.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'No CGT for individuals on financial assets.' }
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
        taxAdvRegime: 'DEFERRED_PLAIN',
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
        taxAdvRegime: 'DEFERRED_PLAIN',
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
        taxAdvRegime: 'DEFERRED_PLAIN',
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
    //  ÖSTEUROPA (6 länder)
    // ==========================================================

    PL: {
        code: 'PL', name: { sv: 'Polen', en: 'Poland' },
        currency: 'PLN', locale: 'pl-PL', region: 'eastern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.19 },
        taxAdvRegime: 'TAX_FREE_WRAPPER',
        taxAdvParams: {},
        ui: {
            sv: {
                taxAdvLabel: 'IKE (Indywidualne Konto Emerytalne)',
                taxAdvDesc: 'Skattefritt pensionssparkonto — ingen kapitalvinstskatt vid uttag efter 60 års ålder.',
                taxAdvTip: 'IKE: helt skattefritt vid uttag efter 60 års ålder. Insättningsgräns ~20 000 PLN/år. IKZE finns också (avdragsgilla insättningar, lägre skatt vid uttag).',
                taxAdvSliderHint: 'Standard: 19 % kapitalvinstskatt (podatek Belki). IKE: 0 % skatt vid uttag.'
            },
            en: {
                taxAdvLabel: 'IKE (Individual Retirement Account)',
                taxAdvDesc: 'Tax-free retirement account — no capital gains tax on withdrawal after age 60.',
                taxAdvTip: 'IKE: completely tax-free on withdrawal after 60. Contribution limit ~20,000 PLN/year. IKZE also available (deductible contributions, lower tax at withdrawal).',
                taxAdvSliderHint: 'Standard: 19% CGT (Belka tax). IKE: 0% tax on withdrawal.'
            }
        }
    },

    CZ: {
        code: 'CZ', name: { sv: 'Tjeckien', en: 'Czechia' },
        currency: 'CZK', locale: 'cs-CZ', region: 'eastern',
        standardRegime: 'TIME_TEST_CGT',
        standardParams: { timeTestThreshold: 3, capitalGainsTax: 0.15 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 15 %. Skattefritt efter 3 års innehav (tidstest).' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 15%. Tax-free after 3 years holding (time test).' }
        }
    },

    SK: {
        code: 'SK', name: { sv: 'Slovakien', en: 'Slovakia' },
        currency: 'EUR', locale: 'sk-SK', region: 'eastern',
        standardRegime: 'TIME_TEST_CGT',
        standardParams: { timeTestThreshold: 1, capitalGainsTax: 0.19 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 19 %. Skattefritt efter 1 års innehav (börsnoterade aktier).' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 19%. Tax-free after 1 year holding (listed shares).' }
        }
    },

    HU: {
        code: 'HU', name: { sv: 'Ungern', en: 'Hungary' },
        currency: 'HUF', locale: 'hu-HU', region: 'eastern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.28 },
        // Förenkling: TBSZ modelleras som helt skattefri (TAX_FREE_WRAPPER).
        // I verkligheten: social avgift (13 % SZOCHO) minskar gradvis år 1–5,
        // därefter 0 %. Modellen antar 5+ års innehav. En korrekt modell skulle
        // kräva en ny regim med årlig nedtrappning av social avgift.
        taxAdvRegime: 'TAX_FREE_WRAPPER',
        taxAdvParams: {},
        ui: {
            sv: {
                taxAdvLabel: 'TBSZ (Tartós Befektetési Számla)',
                taxAdvDesc: 'Långsiktigt investeringskonto — helt skattefritt efter 5 år, ingen insättningsgräns.',
                taxAdvTip: 'TBSZ: efter 5 år helt skattefritt. Social avgift (13 %) minskar gradvis under de första 5 åren.',
                taxAdvSliderHint: 'Standard: 28 % (15 % SZJA + 13 % SZOCHO). TBSZ efter 5 år: 0 % skatt.',
                simplificationNote: 'Förenkling: TBSZ-kontot antar 5+ års innehav (0 % skatt). År 1–5 minskar social avgift (13 %) gradvis — detta är ej modellerat.'
            },
            en: {
                taxAdvLabel: 'TBSZ (Long-term Investment Account)',
                taxAdvDesc: 'Long-term investment account — completely tax-free after 5 years, no contribution limit.',
                taxAdvTip: 'TBSZ: after 5 years completely tax-free. Social contribution (13%) decreases gradually over first 5 years.',
                taxAdvSliderHint: 'Standard: 28% (15% SZJA + 13% SZOCHO). TBSZ after 5 years: 0% tax.',
                simplificationNote: 'Simplification: The TBSZ account assumes 5+ years holding (0% tax). Years 1–5: social contribution (13%) decreases gradually — not modeled.'
            }
        }
    },

    RO: {
        code: 'RO', name: { sv: 'Rumänien', en: 'Romania' },
        currency: 'RON', locale: 'ro-RO', region: 'eastern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.10 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 10 % på aktier och fonder.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 10% on stocks and funds.' }
        }
    },

    BG: {
        code: 'BG', name: { sv: 'Bulgarien', en: 'Bulgaria' },
        currency: 'BGN', locale: 'bg-BG', region: 'eastern',
        standardRegime: 'CGT_ONLY',
        standardParams: { capitalGainsTax: 0.10 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 10 % på börsnoterade aktier och fonder.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 10% on listed stocks and funds.' }
        }
    },

    // ==========================================================
    //  BALKAN (2 länder)
    // ==========================================================

    HR: {
        code: 'HR', name: { sv: 'Kroatien', en: 'Croatia' },
        currency: 'EUR', locale: 'hr-HR', region: 'balkans',
        standardRegime: 'TIME_TEST_CGT',
        standardParams: { timeTestThreshold: 2, capitalGainsTax: 0.12 },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 12 %. Skattefritt efter 2 års innehav.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 12%. Tax-free after 2 years holding.' }
        }
    },

    SI: {
        code: 'SI', name: { sv: 'Slovenien', en: 'Slovenia' },
        currency: 'EUR', locale: 'sl-SI', region: 'balkans',
        standardRegime: 'TIME_TEST_CGT',
        standardParams: { capitalGainsTax: 0.25, timeTestGraded: [{ years: 5, rate: 0.25 }, { years: 10, rate: 0.20 }, { years: 15, rate: 0.15 }, { rate: 0 }] },
        taxAdvRegime: null, taxAdvParams: null,
        ui: {
            sv: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'Kapitalvinstskatt 25 % (år 0–5), minskar till 0 % efter 15 års innehav.' },
            en: { taxAdvLabel: '', taxAdvDesc: '', taxAdvTip: '', taxAdvSliderHint: 'CGT 25% (year 0–5), decreases to 0% after 15 years holding.' }
        }
    }
};

// ============================================================
//  Hjälpfunktion — hämtar landskonfiguration för en landskod.
//  Returnerar Sverige som fallback om koden saknas.
// ============================================================
function getCountryConfig(code) {
    return COUNTRY_CONFIG[code] || COUNTRY_CONFIG.SE;
}
