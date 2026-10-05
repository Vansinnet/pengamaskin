// Gemensamma typer för motorn.
import type { RegimeId } from '../rules/types';

/** Ett köp: månad, belopp och andelspris vid köpet. */
export interface Lot {
  month: number;
  amount: number;
  price: number;
}

/** Simuleringens tillstånd. Regimerna läser det och betalar skatt via payOutside/payFromAccount. */
export interface SimState {
  month: number;
  year: number;
  /** kontots värde */
  balance: number;
  /** summa insättningar (anskaffningsvärde) */
  invested: number;
  /** index för en andel köpt vid start */
  price: number;
  lots: Lot[];
  yearStartBalance: number;
  yearDeposits: number;
  quarterValues: number[];
  /** skatt betald via deklarationen (ISK, Box 3, fondschablon) */
  paidOutside: number;
  /** skatt dragen från kontot (dansk ASK, irländsk deemed disposal) */
  paidFromAccount: number;
  payOutside(tax: number): void;
  payFromAccount(tax: number): void;
}

/** Regimens uppgifter om ett år (visas i "Så räknade vi"). */
export type YearDetail = Record<string, number>;

/** En rad i huvudboken: läget i slutet av ett år. */
export interface Row {
  year: number;
  invested: number;
  balance: number;
  paidOutside: number;
  paidFromAccount: number;
  taxIfSold: number;
  totalTax: number;
  net: number;
  detail: YearDetail | null;
}

/**
 * En skatteregel. Den kan reagera vid årets början, varje månad och vid årets slut,
 * och anger vad det skulle kosta i skatt att sälja allt "nu".
 */
export interface Regime<P, S = unknown> {
  id: RegimeId;
  init?(params: P): S;
  yearStart?(s: SimState, state: S, params: P): void;
  month?(s: SimState, state: S, params: P): void;
  yearEnd?(s: SimState, state: S, params: P): YearDetail;
  taxIfSold?(s: SimState, state: S, params: P): number;
}

/** Regim vald vid körning (account.ts väljer den ur kontots `regime`). */
export type AnyRegime = Regime<any, any>;
