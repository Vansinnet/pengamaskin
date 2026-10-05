// Nederländsk Box 3: en påhittad (schablon-)avkastning på förmögenheten
// den 1 januari, över ett fribelopp, beskattas varje år — oavsett vad
// du faktiskt tjänat. Skatten betalas separat.
import type { Box3Params } from '../../rules/types';
import type { Regime } from '../types';

const box3: Regime<Box3Params> = {
  id: 'BOX3',
  yearStart(s, _st, p) {
    const base = Math.max(0, s.balance - p.exemption);
    s.payOutside(base * p.deemedReturn * p.rate);
  },
};
export default box3;
