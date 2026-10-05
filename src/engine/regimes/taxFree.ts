// Helt skattefritt konto (brittisk ISA, polsk IKE). Taken hanteras av caps.ts.
import type { TaxFreeParams } from '../../rules/types';
import type { Regime } from '../types';

const taxFree: Regime<TaxFreeParams> = { id: 'TAX_FREE' };
export default taxFree;
