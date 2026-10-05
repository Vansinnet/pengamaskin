// ============================================================
//  Insättningstak för skattegynnade konton.
//
//    annual          max per kalenderår (ISA, IKE, PIR)
//    lifetime        max summa insättningar totalt (OSK, PEA, PIR)
//    yearStartValue  årets utrymme = tak − kontots värde vid årets
//                    början (dansk ASK)
//
//  Det som inte ryms räknas på landets vanliga konto (account.js).
// ============================================================
export function createCap(cap) {
  let annual = Infinity;
  let lifetime = cap.lifetime ?? Infinity;
  let byValue = Infinity;
  return {
    startYear(s) {
      annual = cap.annual ?? Infinity;
      byValue = cap.yearStartValue != null ? Math.max(0, cap.yearStartValue - s.balance) : Infinity;
    },
    accept(amount) {
      const ok = Math.max(0, Math.min(amount, annual, lifetime, byValue));
      annual -= ok; lifetime -= ok; byValue -= ok;
      return ok;
    },
  };
}
