// Svenskt ISK: ingen skatt på vinsten, i stället en årlig schablonskatt.
//
//   kapitalunderlag = (värdet 1/1 + 1/4 + 1/7 + 1/10 + årets insättningar) / 4
//   schablonintäkt  = (kapitalunderlag − fribelopp) × max(schablonränta, golv)
//   skatt           = schablonintäkt × 30 %
//
// Skatten betalas via deklarationen — kontot växer oavkortat.
export default {
  id: 'ISK',
  yearEnd(s, _st, p) {
    const base = (s.quarterValues.reduce((a, b) => a + b, 0) + s.yearDeposits) / 4;
    const rate = Math.max(p.schablonRate, p.floor) / 100;
    const income = Math.max(0, base - p.exemption) * rate;
    const tax = income * p.tax;
    s.payOutside(tax);
    return { base, rate, income, tax };
  },
};
