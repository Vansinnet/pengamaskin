// Irländsk exit tax på fonder/ETF:er: 38 % på vinsten, inget fribelopp.
// "Deemed disposal": vart 8:e år efter varje köp beskattas orealiserad vinst
// som om du sålt. Skatten antas betalas genom att andelar säljs, och köpets
// anskaffningsvärde återställs till dagens värde.
import type { ExitTaxParams } from '../../rules/types';
import type { Regime } from '../types';

interface State {
  units: number[];
  basis: number[];
  byMonth: Map<number, number>;
}

const exitTax: Regime<ExitTaxParams, State> = {
  id: 'EXIT_TAX',
  init: () => ({ units: [], basis: [], byMonth: new Map() }),
  month(s, st, p) {
    for (let i = st.units.length; i < s.lots.length; i++) {
      st.units[i] = s.lots[i].amount / s.lots[i].price;
      st.basis[i] = s.lots[i].amount;
      st.byMonth.set(s.lots[i].month, i);
    }
    // Köp som fyller 8, 16, 24 … år just den här månaden
    const dd = p.deemedDisposalYears * 12;
    for (let m = s.month - dd; m >= 0; m -= dd) {
      const i = st.byMonth.get(m);
      if (i === undefined) continue;
      const gain = st.units[i] * s.price - st.basis[i];
      if (gain <= 0) continue;
      const tax = gain * p.rate;
      st.units[i] -= tax / s.price;
      st.basis[i] = st.units[i] * s.price;
      s.payFromAccount(tax);
    }
  },
  taxIfSold(s, st, p) {
    let tax = 0;
    s.lots.forEach((_, i) => {
      const units = st.units[i] ?? s.lots[i].amount / s.lots[i].price;
      const basis = st.basis[i] ?? s.lots[i].amount;
      tax += Math.max(0, units * s.price - basis) * p.rate;
    });
    return tax;
  },
};
export default exitTax;
