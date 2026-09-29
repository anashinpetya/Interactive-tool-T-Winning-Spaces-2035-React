// The two bar-chart pages ("Bar plots" in the sidebar).
// Values are from the study - edit them here.

export interface BarChartPageConfig {
  path: string;
  navLabel: string;
  title: string;
  description: string;
  /** Column name in the chart data (also used in the tooltip) */
  field: string;
  /** Values at S1 (0 %), S2 (24 %) and S3 (47.3 %) */
  s1: number;
  s2: number;
  s3: number;
  /** Decimals used by round() for the selected value */
  decimals: number;
  /** d3 number format of the bar labels */
  labelFormat: string;
  yTitle: string;
  yDomain: [number, number];
  /** Tooltip rows */
  tooltip: { field: "Scenario" | "value"; title: string }[];
}

export const EMISSION_CHANGES: BarChartPageConfig = {
  path: "/emission-changes",
  navLabel: "Emission changes",
  title: "Daily CO₂ emissions",
  description:
    "Total daily CO₂ emissions of the Helsinki capital region with no remote working (S1), at the selected share of remote workers, and at full remote-working potential (S3).",
  field: "Emissions",
  s1: 509.2,
  s2: 436.7,
  s3: 364.5,
  decimals: 1,
  labelFormat: ".1f",
  yTitle: "Daily CO₂ emissions (tonnes)",
  yDomain: [0, 550],
  tooltip: [
    { field: "Scenario", title: "Scenario" },
    { field: "value", title: "Emissions (tonnes of CO₂)" },
  ],
};

export const HEALTH_IMPACT_ASSESSMENT: BarChartPageConfig = {
  path: "/health-impact-assessment",
  navLabel: "Health impact assessment",
  title: "Health impact assessment",
  description:
    "The average number of premature/avoided deaths in 2025–2035 with no remote working (S1), at the selected share of remote workers, and at full remote-working potential (S3), compared with today.",
  field: "Deaths",
  s1: -31,
  s2: 0,
  s3: 42,
  decimals: 0,
  labelFormat: "d",
  yTitle: "Premature / avoided deaths, 2025–2035 average",
  yDomain: [-40, 50],
  tooltip: [
    { field: "Scenario", title: "Scenario" },
    { field: "value", title: "Premature / avoided deaths (2025–2035 average)" },
  ],
};

export const BAR_PAGES = [EMISSION_CHANGES, HEALTH_IMPACT_ASSESSMENT];
