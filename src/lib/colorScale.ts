// Continuous diverging colour scale used by every map.
//
//   blue  = less than today (S2)  ·  ivory = no change  ·  red = more than today
//
// The "no change" colour is a light warm ivory, so unchanged grid cells and
// roads stand out clearly from the dark land (#0e0e0e) and the grey sea
// (#2c353c) of the basemap. From it, both arms step down in lightness in the
// same steps (OKLCH L 0.93 -> 0.53) while gaining colour, so equal changes up
// or down look equally strong. Colours are interpolated in OKLab, so the
// gradient changes evenly with no bands.
//
// The red arm leans slightly towards orange (OKLCH hue 38 instead of 27):
// it still reads as red, but keeps much more of its colour for people with
// red-blindness (protanopia), so increases never turn grey for them.

export type Rgb = [number, number, number];

const DECREASE = ["#016cc3", "#3386d9", "#5e9fe6", "#8ab8ec", "#b7d1ee"]; // strongest -> weakest
const NEUTRAL = "#ebe7df";
const INCREASE = ["#ecc3b7", "#e7a08b", "#dd7e61", "#cc5d3a", "#b44118"]; // weakest -> strongest

/** Stops from -1 (largest decrease) to +1 (largest increase). */
export const DIVERGING_STOPS = [...DECREASE, NEUTRAL, ...INCREASE];

/**
 * Colour intensity grows with the square root of the change, so the many
 * small and medium changes still get visibly different colours instead of
 * all looking grey next to a few very large ones.
 */
const GAMMA = 0.5;

const LUT_SIZE = 512;

// --- OKLab conversions -------------------------------------------------------

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToOklab([r8, g8, b8]: Rgb): [number, number, number] {
  const [r, g, b] = [r8, g8, b8].map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, A, B]: [number, number, number]): Rgb {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map((v) => Math.round(Math.min(1, Math.max(0, toSrgb(Math.min(1, Math.max(0, v))))) * 255)) as Rgb;
}

// --- lookup table ------------------------------------------------------------

const LAB_STOPS = DIVERGING_STOPS.map((h) => rgbToOklab(hexToRgb(h)));

/** Colour at position t in [-1, 1] (already transformed). */
function colorAtPosition(t: number): Rgb {
  const x = ((Math.max(-1, Math.min(1, t)) + 1) / 2) * (LAB_STOPS.length - 1);
  const i = Math.min(Math.floor(x), LAB_STOPS.length - 2);
  const f = x - i;
  const a = LAB_STOPS[i];
  const b = LAB_STOPS[i + 1];
  return oklabToRgb([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
}

const LUT: Rgb[] = Array.from({ length: LUT_SIZE + 1 }, (_, i) => colorAtPosition((i / LUT_SIZE) * 2 - 1));

/** Position on the colour bar in [-1, 1] for a value, given the scale limit (values beyond it are clamped). */
export function scalePosition(value: number, limit: number): number {
  const r = Math.min(Math.abs(value) / limit, 1);
  return Math.sign(value) * r ** GAMMA;
}

/** Colour of a value, or null when there is no value. */
export function colorFor(value: number, limit: number): Rgb | null {
  if (!Number.isFinite(value)) return null;
  const t = scalePosition(value, limit);
  return LUT[Math.round(((t + 1) / 2) * LUT_SIZE)];
}

/** CSS linear-gradient for the legend bar (matches the map colours). */
export function legendGradient(): string {
  const steps = 24;
  const colors = Array.from({ length: steps + 1 }, (_, i) => {
    const [r, g, b] = LUT[Math.round((i / steps) * LUT_SIZE)];
    return `rgb(${r} ${g} ${b}) ${((i / steps) * 100).toFixed(1)}%`;
  });
  return `linear-gradient(to right, ${colors.join(", ")})`;
}

/** Round to 1, 2, 2.5 or 5 x 10^n. */
function niceRound(x: number): number {
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  const nice = f < 1.5 ? 1 : f < 2.25 ? 2 : f < 3.75 ? 2.5 : f < 7.5 ? 5 : 10;
  return nice * 10 ** exp;
}

/** Legend ticks: -limit, -q, 0, q, limit (q ~ a quarter of the limit, rounded). */
export function legendTicks(limit: number): { value: number; position: number }[] {
  const q = niceRound(limit / 4);
  return [-limit, -q, 0, q, limit].map((value) => ({ value, position: (scalePosition(value, limit) + 1) / 2 }));
}
