// Kapitalvinstskatt som beror på hur länge du ägt det du säljer.
//
//   perLot: true  — varje köp har sin egen klocka (Tjeckien 3 år, italiensk PIR 5 år).
//                   Insättningar nära försäljningen är alltså inte skattefria.
//   perLot: false — klockan räknas från kontots öppnande (fransk PEA).
//
//   freeAfterYears  — skattefritt efter X år, annars `rate`/`brackets`.
//   graded          — [{ years, rate }, …, { rate }]: satsen för innehav < years.
import type { TimeTestParams } from '../../rules/types';
import { gainTax } from '../tax';
import type { Regime } from '../types';

type Graded = NonNullable<TimeTestParams['graded']>;

const gradedRate = (graded: Graded, heldYears: number) =>
  graded.find((b) => b.years === undefined || heldYears < b.years)!.rate;

const timeTest: Regime<TimeTestParams> = {
  id: 'TIME_TEST',
  taxIfSold(s, _st, p) {
    if (!p.perLot) {
      const gain = s.balance - s.invested;
      if (p.graded) return Math.max(0, gain) * gradedRate(p.graded, s.year);
      return s.year >= p.freeAfterYears! ? 0 : gainTax(gain, p);
    }
    let taxable = 0;
    let gradedTax = 0;
    for (const lot of s.lots) {
      const held = s.month - lot.month;
      const gain = lot.amount * (s.price / lot.price - 1);
      if (p.graded) gradedTax += gain * gradedRate(p.graded, held / 12);
      else if (held < p.freeAfterYears! * 12) taxable += gain;
    }
    return p.graded ? Math.max(0, gradedTax) : gainTax(taxable, p);
  },
};
export default timeTest;
