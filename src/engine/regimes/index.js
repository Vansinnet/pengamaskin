import cgt from './cgt.js';
import isk from './isk.js';
import lager from './lager.js';
import skjerming from './skjerming.js';
import taxFree from './taxFree.js';
import box3 from './box3.js';
import timeTest from './timeTest.js';
import exitTax from './exitTax.js';

export const REGIMES = Object.fromEntries(
  [cgt, isk, lager, skjerming, taxFree, box3, timeTest, exitTax].map((r) => [r.id, r]));
