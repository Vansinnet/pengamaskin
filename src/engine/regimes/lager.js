// Dansk aktiesparekonto: 17 % på årets avkastning (även orealiserad).
// Skatten dras från kontot. Ett förlustår förs fram och kvittas mot
// kommande års avkastning, utan tidsgräns.
export default {
  id: 'LAGER',
  init: () => ({ carry: 0 }),
  yearEnd(s, st, p) {
    let gain = s.balance - s.yearStartBalance - s.yearDeposits;
    const used = gain > 0 ? Math.min(gain, st.carry) : 0;
    gain -= used;
    st.carry -= used;
    if (gain < 0) st.carry -= gain;
    const tax = Math.max(0, gain) * p.rate;
    s.payFromAccount(tax);
    return { gain: gain + used, carryUsed: used, carry: st.carry, tax };
  },
};
