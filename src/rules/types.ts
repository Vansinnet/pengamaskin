// ============================================================
//  Typer för skattereglerna i countries.ts.
//
//  Varje konto är en diskriminerad union av regim + parametrar:
//  fel eller saknade parametrar för en regim blir kompileringsfel.
// ============================================================

export type Lang = 'sv' | 'en';
export type Localized = Record<Lang, string>;

export type CountryCode =
  | 'SE' | 'NO' | 'DK' | 'FI' | 'DE' | 'FR' | 'GB' | 'IE' | 'NL' | 'BE'
  | 'AT' | 'PL' | 'CZ' | 'IT' | 'ES' | 'GR' | 'EE' | 'LV' | 'LT';

export type RegionId = 'nordic' | 'western' | 'british' | 'benelux' | 'central' | 'southern' | 'baltics' | 'eastern';

export interface Region {
  id: RegionId;
  name: Localized;
}

/** Progressivt steg: satsen gäller vinst upp till `upTo`. Sista steget saknar `upTo`. rate 0 = fribelopp. */
export interface Bracket {
  upTo?: number;
  rate: number;
}

/** Skatt på en vinst (engine/tax.ts). */
export interface GainTaxParams {
  rate?: number;
  brackets?: Bracket[];
  /** Andel av vinsten som är skattefri innan stegen tillämpas (tysk Teilfreistellung: 0,30). */
  partialExemption?: number;
}

export interface CgtParams extends GainTaxParams {
  /** Årlig schablonskatt på fondinnehav vid årets början (svenskt AF-konto). */
  fundLevy?: number;
}

export interface IskParams {
  schablonRate: number;
  floor: number;
  exemption: number;
  tax: number;
}

export interface LagerParams {
  rate: number;
}

export interface SkjermingParams {
  rate: number;
  shieldRate: number;
  basis: 'lowest' | 'yearEnd';
}

export type TaxFreeParams = Record<string, never>;

export interface Box3Params {
  deemedReturn: number;
  rate: number;
  exemption: number;
}

export interface TimeTestParams extends GainTaxParams {
  perLot: boolean;
  freeAfterYears?: number;
  /** [{ years, rate }, …, { rate }]: satsen för innehav kortare än `years`. */
  graded?: { years?: number; rate: number }[];
}

export interface ExitTaxParams {
  rate: number;
  deemedDisposalYears: number;
}

export interface ParamsByRegime {
  CGT: CgtParams;
  ISK: IskParams;
  LAGER: LagerParams;
  SKJERMING: SkjermingParams;
  TAX_FREE: TaxFreeParams;
  BOX3: Box3Params;
  TIME_TEST: TimeTestParams;
  EXIT_TAX: ExitTaxParams;
}

export type RegimeId = keyof ParamsByRegime;

/** Regim + dess parametrar. */
export type AccountRule = { [K in RegimeId]: { regime: K; params: ParamsByRegime[K] } }[RegimeId];

/** Insättningstak för skattegynnade konton (engine/caps.ts). */
export interface Cap {
  annual?: number;
  lifetime?: number;
  yearStartValue?: number;
}

/** En parameter som användaren kan justera (t.ex. ISK-schablonräntan). */
export interface Adjustable {
  key: string;
  min: number;
  max: number;
  step: number;
  label: Localized;
  hint: Localized;
}

export type StandardAccount = AccountRule & { label?: Localized; summary: Localized };
export type AdvantagedAccount = AccountRule & { label: Localized; summary: Localized; cap?: Cap; adjustable?: Adjustable };
export type AccountDef = StandardAccount | AdvantagedAccount;

export interface Country {
  name: Localized;
  currency: string;
  locale: string;
  region: RegionId;
  standard: StandardAccount;
  advantaged: AdvantagedAccount | null;
  notes: Localized;
  sources: string[];
}
