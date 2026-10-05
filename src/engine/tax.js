// Skatt på en vinst enligt ett lands parametrar.
//
//   rate              platt skattesats (decimal)
//   brackets          [{ upTo, rate }, …, { rate }] — progressiva steg/fribelopp.
//                     Sista steget saknar upTo. Ett steg med rate 0 är ett fribelopp.
//   partialExemption  andel av vinsten som är skattefri innan stegen tillämpas
//                     (tysk Teilfreistellung: 0,30)
//
// Förluster ger ingen skatt (och ingen skatteåterbäring).
export function gainTax(gain, p) {
  if (!(gain > 0)) return 0;
  const taxable = gain * (1 - (p.partialExemption || 0));
  if (!p.brackets) return taxable * (p.rate || 0);

  let tax = 0;
  let lower = 0;
  for (const { upTo = Infinity, rate } of p.brackets) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, upTo) - lower) * rate;
    lower = upTo;
  }
  return tax;
}
