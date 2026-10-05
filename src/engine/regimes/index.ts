import type { ParamsByRegime, RegimeId } from '../../rules/types';
import type { Regime } from '../types';
import cgt from './cgt';
import isk from './isk';
import lager from './lager';
import skjerming from './skjerming';
import taxFree from './taxFree';
import box3 from './box3';
import timeTest from './timeTest';
import exitTax from './exitTax';

/** Alla regimer, nycklade på id. Typen kräver att varje regim tar rätt parametrar. */
export const REGIMES: { [K in RegimeId]: Regime<ParamsByRegime[K], any> } = {
  CGT: cgt,
  ISK: isk,
  LAGER: lager,
  SKJERMING: skjerming,
  TAX_FREE: taxFree,
  BOX3: box3,
  TIME_TEST: timeTest,
  EXIT_TAX: exitTax,
};
