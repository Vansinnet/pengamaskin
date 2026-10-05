// ============================================================
//  Den enda simuleringsloopen.
//
//  Kapitalet växer månad för månad. Insättningar sker i slutet
//  av varje månad; deposits[0] är startkapitalet (1 januari år 1).
//  Skatteregimen (se regimes/) får reagera vid årets början,
//  varje månad och vid årets slut, och avgör vad det skulle
//  kosta i skatt att sälja allt "nu".
//
//  Resultatet är en huvudbok: en rad per år (år 0 = efter
//  startkapitalet). Sammanfattning, tidslinje och sparmål läser
//  alla från samma huvudbok.
// ============================================================

/**
 * @param {object}   o
 * @param {number[]} o.deposits  insättningsschema, längd years*12 + 1
 * @param {number}   o.growth    månadsfaktor, t.ex. 1.0057
 * @param {number}   o.years
 * @param {object}   o.regime    regimmodul
 * @param {object}   o.params    regimens parametrar
 * @param {object}   [o.cap]     insättningstak (caps.js) — det som inte ryms hamnar i overflow
 */
export function simulate({ deposits, growth, years, regime, params, cap }) {
  const s = {
    month: 0, year: 0,
    balance: 0,            // kontots värde
    invested: 0,           // summa insättningar (anskaffningsvärde)
    price: 1,              // index för en andel köpt vid start
    lots: [],              // varje insättning: { month, amount, price }
    yearStartBalance: 0, yearDeposits: 0, quarterValues: [],
    paidOutside: 0,        // skatt betald via deklarationen (ISK, Box 3, fondschablon)
    paidFromAccount: 0,    // skatt dragen från kontot (dansk ASK, irländsk deemed disposal)
    payOutside(t) { this.paidOutside += t; },
    payFromAccount(t) { this.paidFromAccount += t; this.balance -= t; },
  };
  const state = regime.init ? regime.init(params) : {};
  const overflow = new Array(deposits.length).fill(0);
  const rows = [];

  const deposit = (m) => {
    const amount = deposits[m] || 0;
    const accepted = cap ? cap.accept(amount) : amount;
    overflow[m] = amount - accepted;
    if (accepted <= 0) return;
    s.balance += accepted;
    s.invested += accepted;
    s.yearDeposits += accepted;
    s.lots.push({ month: m, amount: accepted, price: s.price });
  };

  const record = (detail) => {
    const taxIfSold = regime.taxIfSold ? regime.taxIfSold(s, state, params) : 0;
    rows.push({
      year: s.year,
      invested: s.invested,
      balance: s.balance,
      paidOutside: s.paidOutside,
      paidFromAccount: s.paidFromAccount,
      taxIfSold,
      totalTax: s.paidOutside + s.paidFromAccount + taxIfSold,
      net: s.balance - taxIfSold - s.paidOutside,
      detail,
    });
  };

  if (cap) cap.startYear(s);
  deposit(0);
  record(null);

  for (let y = 1; y <= years; y++) {
    s.year = y;
    if (cap && y > 1) cap.startYear(s);
    s.yearStartBalance = s.balance;
    s.yearDeposits = 0;
    s.quarterValues = [];
    if (regime.yearStart) regime.yearStart(s, state, params);

    for (let k = 0; k < 12; k++) {
      if (k % 3 === 0) s.quarterValues.push(s.balance);
      s.month++;
      s.balance *= growth;
      s.price *= growth;
      deposit(s.month);
      if (regime.month) regime.month(s, state, params);
    }
    record(regime.yearEnd ? regime.yearEnd(s, state, params) : null);
  }
  return { rows, overflow };
}

/** Insättningsschema: startkapital + fast månadsbelopp. */
export function schedule(initial, monthly, years) {
  const d = new Array(years * 12 + 1).fill(monthly);
  d[0] = initial;
  return d;
}
