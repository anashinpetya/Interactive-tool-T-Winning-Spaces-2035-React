// Per-feature values and colours for a slider position.

import { scenarioPosition } from "../config/scenarios";
import { colorFor, type Rgb } from "./colorScale";
import type { LayerData } from "./data";

export type Measure = "abs" | "pct";

export interface FeatureValues {
  /** change vs today in the layer unit (NaN = no data) */
  abs: number;
  /** change vs today as a fraction (NaN = no data / today's value is 0) */
  pct: number;
  /** today's value, if known */
  today: number;
}

/**
 * Change of every feature relative to today at `percent` % remote workers.
 * At exactly today's level (24 %) every feature with data is 0.
 */
export function changeAt(data: LayerData, percent: number, measure: Measure): Float64Array {
  const { side, share } = scenarioPosition(percent);
  const source = data[side][measure];
  const other = data[side === "s1" ? "s3" : "s1"][measure];
  const out = new Float64Array(data.rowCount);
  for (let i = 0; i < out.length; i++) {
    const v = source[i];
    out[i] = share === 0 ? (Number.isNaN(v) && Number.isNaN(other[i]) ? NaN : 0) : v * share;
  }
  return out;
}

export function featureValues(data: LayerData, percent: number, row: number): FeatureValues {
  const { side, share } = scenarioPosition(percent);
  const at = (arr: Float64Array) => (share === 0 && !Number.isNaN(arr[row]) ? 0 : arr[row] * share);
  return {
    abs: at(data[side].abs),
    pct: at(data[side].pct),
    today: data.base ? data.base[row] : NaN,
  };
}

/** Colour per feature (null = no data, not drawn). */
export function colorsFor(values: Float64Array, limit: number): (Rgb | null)[] {
  return Array.from(values, (v) => colorFor(v, limit));
}

// --- formatting -----------------------------------------------------------------

const numberFormat = (decimals: number, fixed: boolean) =>
  new Intl.NumberFormat("en-GB", { minimumFractionDigits: fixed ? decimals : 0, maximumFractionDigits: decimals });

/** `fixed` keeps trailing zeros ("407.0" instead of "407"). */
export function formatValue(value: number, decimals: number, signed = false, fixed = false): string {
  if (!Number.isFinite(value)) return "n/a";
  const rounded = Number(value.toFixed(decimals));
  const text = numberFormat(decimals, fixed).format(Math.abs(rounded));
  if (rounded === 0) return text;
  return `${rounded < 0 ? "−" : signed ? "+" : ""}${text}`;
}

export function formatPercent(fraction: number, signed = true): string {
  if (!Number.isFinite(fraction)) return "n/a";
  const pct = fraction * 100;
  const decimals = Math.abs(pct) < 10 ? 1 : 0;
  return `${formatValue(pct, decimals, signed)} %`;
}
