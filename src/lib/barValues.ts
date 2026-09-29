import type { BarChartPageConfig } from "../config/barCharts";
import { S2_PERCENT, S3_PERCENT } from "../config/scenarios";
import { pyRound } from "./numeric";

/**
 * Value at the selected percentage, interpolated linearly between S2 and
 * S3 (above 24 %) or between S1 and S2 (below 24 %), then round()-ed.
 */
export function selectedValue(config: BarChartPageConfig, percent: number): number {
  const { s1, s2, s3, decimals } = config;
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
