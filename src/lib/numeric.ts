/**
 * Python `round(x, ndigits)`: correctly rounded, exact ties go to even.
 * (Number.prototype.toFixed is also correctly rounded but sends ties away
 * from zero.) Used for the bar charts, as in the original Streamlit tool.
 */
export function pyRound(x: number, ndigits: number): number {
  if (!Number.isFinite(x)) return x;
  const exact = Math.abs(x).toFixed(100);
  const [intPart, frac = ""] = exact.split(".");
  const rest = frac.slice(ndigits);
  const isTie = rest[0] === "5" && /^0*$/.test(rest.slice(1));
  if (isTie) {
    const kept = intPart + frac.slice(0, ndigits);
    const lastDigit = Number(kept[kept.length - 1]);
    if (lastDigit % 2 === 0) {
      // round down (towards zero) to keep the even digit
      return Number(`${x < 0 ? "-" : ""}${intPart}.${frac.slice(0, ndigits) || "0"}`);
    }
  }
  const rounded = Number(x.toFixed(ndigits));
  return rounded === 0 && (x < 0 || Object.is(x, -0)) ? -0 : rounded;
}
