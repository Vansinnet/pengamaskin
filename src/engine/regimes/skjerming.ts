// Norsk beskattning med skjermingsfradrag: en "riskfri" avkastning på det
// insatta kapitalet är skattefri. Oanvänt avdrag sparas och läggs till
// grunden, så även avdraget växer år för år.
//
//   basis 'lowest'  (aksjesparekonto) — lägsta innskudd under året, dvs.
//                    kapitalet vid årets början: nya insättningar ger
//                    avdrag först året efter.
//   basis 'yearEnd' (vanligt konto)    — innehavet 31 december.
//
// Vid försäljning: (vinst − ackumulerat avdrag) × 37,84 %.
import type { SkjermingParams } from '../../rules/types';
import type { Regime } from '../types';

const skjerming: Regime<SkjermingParams, { unused: number; investedAtStart: number }> = {
  id: 'SKJERMING',
  init: () => ({ unused: 0, investedAtStart: 0 }),
  yearStart(s, st) { st.investedAtStart = s.invested; },
  yearEnd(s, st, p) {
    const base = (p.basis === 'yearEnd' ? s.invested : st.investedAtStart) + st.unused;
    const deduction = base * p.shieldRate;
    st.unused += deduction;
    return { base, deduction, accumulated: st.unused };
  },
  taxIfSold: (s, st, p) => Math.max(0, s.balance - s.invested - st.unused) * p.rate,
};
export default skjerming;
