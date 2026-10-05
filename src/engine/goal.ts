// Sparmål: vilket månadsbelopp ger minst `target` efter skatt?
// Nettot växer med månadsbeloppet, så intervallhalvering hittar svaret.
export function solveMonthly(
  target: number,
  netFor: (monthly: number) => number,
  { precision = 0.01, maxIter = 200 } = {},
): { monthly: number; reachable: boolean } {
  if (netFor(0) >= target) return { monthly: 0, reachable: true };
  let lo = 0;
  let hi = Math.max(1, target);
  for (let i = 0; i < 60 && netFor(hi) < target; i++) hi *= 2;
  if (netFor(hi) < target) return { monthly: hi, reachable: false };
  for (let i = 0; i < maxIter && hi - lo > precision; i++) {
    const mid = (lo + hi) / 2;
    if (netFor(mid) < target) lo = mid; else hi = mid;
  }
  return { monthly: hi, reachable: true };
}
