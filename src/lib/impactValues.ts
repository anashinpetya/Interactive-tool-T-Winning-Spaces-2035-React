import type { ImpactConfig } from "../config/impacts";
import { S2_PERCENT, S3_PERCENT } from "../config/scenarios";
import { formatValue } from "./mapValues";
import { pyRound } from "./numeric";

/** Compared with today: better (green), worse (red) or the same (grey). */
export type Status = "good" | "bad" | "neutral";

export const STATUSES: Status[] = ["good", "bad", "neutral"];

// Checked for red-green colour blindness on the panel colour (#121722); same hexes as --good / --bad in styles.css
export const STATUS_COLORS: Record<Status, string> = {
  good: "#23ad8a",
  bad: "#cf3f3a",
  neutral: "#6b7385",
};

/**
 * Value at the selected percentage, interpolated linearly between S2 and
 * S3 (above 24 %) or between S1 and S2 (below 24 %), then round()-ed.
 */
export function selectedValue(impact: ImpactConfig, percent: number): number {
  const { s1, s2, s3, decimals } = impact;
  if (percent > S2_PERCENT) {
    const factor = (S3_PERCENT - percent) / (S3_PERCENT - S2_PERCENT);
    return pyRound(s2 + (s3 - s2) * (1 - factor), decimals);
  }
  if (percent < S2_PERCENT) {
    const factor = percent / S2_PERCENT;
    return pyRound(s2 + (s1 - s2) * (1 - factor), decimals);
  }
  return s2;
}

/** Both results are "more is worse". */
export function statusOf(change: number): Status {
  return change > 0 ? "bad" : change < 0 ? "good" : "neutral";
}

export interface Reading {
  /** at the selected share (a total for emissions, already a change for health) */
  value: number;
  /** compared with today (S2) */
  change: number;
  status: Status;
}

export function readingAt(impact: ImpactConfig, percent: number): Reading {
  const value = selectedValue(impact, percent);
  const change = changeFromToday(impact, value);
  return { value, change, status: statusOf(change) };
}

export function changeFromToday(impact: ImpactConfig, value: number): number {
  return pyRound(value - impact.s2, impact.decimals);
}

/** A value with the study's number of decimals, e.g. "407.0", "+17" */
export function formatImpact(impact: ImpactConfig, value: number, signed = false): string {
  return formatValue(value, impact.decimals, signed, true);
}

/** e.g. "−34.1 t per day (less than today)", "+19 (extra premature deaths)" */
export function describeChange(impact: ImpactConfig, change: number): string {
  const status = statusOf(change);
  const text = `${formatImpact(impact, change, true)}${impact.unit}`;
  if (status === "neutral") return `${text} (same as today)`;
  return `${text} (${status === "bad" ? impact.more : impact.less})`;
}
