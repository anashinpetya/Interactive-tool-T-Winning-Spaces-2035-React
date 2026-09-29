// Scenario definitions shared by all pages.

export const S1_PERCENT = 0.0; // S1 - no remote working
export const S2_PERCENT = 24.0; // S2 - current remote working (today)
export const S3_PERCENT = 47.3; // S3 - full remote working potential

export const SCENARIOS = [
  { id: "S1", percent: S1_PERCENT, name: "No remote working" },
  { id: "S2", percent: S2_PERCENT, name: "Current level" },
  { id: "S3", percent: S3_PERCENT, name: "Full potential" },
] as const;

export const SLIDER = { min: S1_PERCENT, max: S3_PERCENT, step: 0.1 };

/**
 * Where a remote-working percentage sits between the scenarios.
 * Changes are relative to today (S2), so the value at `percent` is the
 * S1 (below 24 %) or S3 (above 24 %) difference scaled by `share`:
 *   share = (24 - percent) / 24          on the S1 side
 *   share = (percent - 24) / (47.3 - 24) on the S3 side
 * This is the same interpolation the Streamlit tool used on its two pages.
 */
export function scenarioPosition(percent: number): { side: "s1" | "s3"; share: number } {
  if (percent < S2_PERCENT) return { side: "s1", share: (S2_PERCENT - percent) / (S2_PERCENT - S1_PERCENT) };
  return { side: "s3", share: (percent - S2_PERCENT) / (S3_PERCENT - S2_PERCENT) };
}
