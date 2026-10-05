// Kapitalvinstskatt när du säljer. Vanligaste regeln för vanliga konton,
// och för konton där skatten skjuts upp till uttag (finsk OSK, baltiska
// investeringskonton) — matematiken är densamma vid köp-och-behåll.
//
// Valfritt: fundLevy — årlig schablonskatt på fondinnehav vid årets början
// (svenskt AF-konto: 0,4 % av värdet beskattas med 30 % = 0,12 %/år).
import { gainTax } from '../tax.js';

export default {
  id: 'CGT',
  yearStart(s, _st, p) {
    if (p.fundLevy) s.payOutside(Math.max(0, s.balance) * p.fundLevy);
  },
  taxIfSold: (s, _st, p) => gainTax(s.balance - s.invested, p),
};
