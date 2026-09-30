// The "Emissions & health" page: two regional results of the study, shown
// side by side at the same share of remote workers.
// Values are from the study - edit them here.

export interface ImpactConfig {
  id: "emissions" | "health";
  /** Name in the summary cards and tooltips */
  name: string;
  /**
   * Values at S1 (0 %), S2 (24 %, today) and S3 (47.3 %). For both results
   * more is worse, so a value above today's is red and one below it green.
   */
  s1: number;
  s2: number;
  s3: number;
  /** Decimals used by round() for the selected value */
  decimals: number;
  /** Unit after a value in the tooltips, e.g. " t per day" */
  unit: string;
  /** Unit after the value label on the trade-off curve, e.g. "t/day" (and for ±1, if different) */
  shortUnit: string;
  shortUnitOne?: string;
  /** What a change above / below today means */
  more: string;
  less: string;
  /** Bar charts: the values themselves */
  bars: { title: string; description: string; yTitle: string; yDomain: [number, number]; signed: boolean };
  /** Trade-off curves: the change compared with today */
  curve: { title: string; description: string; yTitle: string; yDomain: [number, number] };
}

export const EMISSIONS: ImpactConfig = {
  id: "emissions",
  name: "Transport CO₂ emissions",
  s1: 509.2,
  s2: 436.7,
  s3: 364.5,
  decimals: 1,
  unit: " t per day",
  shortUnit: "t/day",
  more: "more than today",
  less: "less than today",
  bars: {
    title: "Daily transport CO₂ emissions",
    description:
      "Total daily transport-related CO₂ emissions of the Helsinki capital region with no remote working (S1), at the selected share of remote workers, and at full remote-working potential (S3).",
    yTitle: "Daily transport CO₂ emissions (tonnes)",
    yDomain: [0, 550],
    signed: false,
  },
  curve: {
    title: "Change in daily transport CO₂ emissions",
    description:
      "Change in total daily transport-related CO₂ emissions of the Helsinki capital region compared with today, at every share of remote workers.",
    yTitle: "Tonnes of CO₂ per day vs today",
    yDomain: [-100, 100],
  },
};

export const HEALTH: ImpactConfig = {
  id: "health",
  name: "Premature deaths",
  s1: -31,
  s2: 0,
  s3: 42,
  decimals: 0,
  unit: "",
  shortUnit: "deaths",
  shortUnitOne: "death",
  more: "extra premature deaths",
  less: "premature deaths avoided",
  bars: {
    title: "Extra premature deaths",
    description:
      "Average number of extra premature deaths in 2025–2035 compared with today, with no remote working (S1), at the selected share of remote workers, and at full remote-working potential (S3). Positive values are extra premature deaths; negative values are premature deaths avoided.",
    yTitle: "Extra premature deaths vs today",
    yDomain: [-40, 50],
    signed: true,
  },
  curve: {
    title: "Extra premature deaths",
    description:
      "Average number of extra premature deaths in 2025–2035 compared with today, at every share of remote workers. Positive values are extra premature deaths; negative values are premature deaths avoided.",
    yTitle: "Extra premature deaths vs today",
    yDomain: [-60, 60],
  },
};

export const IMPACTS = [EMISSIONS, HEALTH];

export const IMPACTS_PAGE = {
  path: "/emissions-and-health",
  navLabel: "Emissions & health",
  group: "Regional totals",
  title: "Emissions and health",
  intro:
    "More remote working means less commuting. In the study, this lowers the region's transport-related CO₂ emissions but increases the number of premature deaths compared with today. One slider sets the share of remote workers for both results.",
  description:
    "One slider, two results: how the share of remote workers changes the region's transport CO₂ emissions and the number of premature deaths.",
};
