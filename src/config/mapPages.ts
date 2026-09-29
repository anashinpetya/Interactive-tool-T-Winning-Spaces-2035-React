// Everything that differs between the five map pages lives here.

export interface MapPageConfig {
  path: string;
  navLabel: string;
  group: "Grid maps" | "Traffic changes";
  /** File name in public/data (without .json), built by scripts/prepare_data.py */
  dataset: string;
  title: string;
  description: string;
  /** What is measured, as written inside a sentence ("Change in CO₂ emissions") */
  quantityInSentence: string;
  /** Unit of the absolute change */
  unit: string;
  /** Unit shown in the legend title, when the title does not already name it */
  legendUnit?: string;
  /** Decimals shown for absolute values */
  decimals: number;
  /** What one map feature is (tooltip heading) */
  featureName: string;
  /** Show the fill-opacity control (grid maps) */
  opacityControl: boolean;
  /**
   * Optional fixed ends of the colour scale (absolute: in `unit`, percentage:
   * as a fraction, 1 = 100 %). By default prepare_data.py picks them from the data.
   */
  scale?: { abs?: number; pct?: number };
}

export const MAP_PAGES: MapPageConfig[] = [
  {
    path: "/emissions",
    navLabel: "CO₂ emissions",
    group: "Grid maps",
    dataset: "emissions",
    title: "CO₂ emissions",
    description:
      "Change in daily CO₂ emissions in each 250 m grid cell at the selected share of remote workers, compared with today.",
    quantityInSentence: "CO₂ emissions",
    unit: "kg",
    legendUnit: "kg",
    decimals: 1,
    featureName: "Grid cell · 250 m",
    opacityControl: true,
  },
  {
    path: "/remote-workers",
    navLabel: "Remote workers",
    group: "Grid maps",
    dataset: "remote_workers",
    title: "Remote workers",
    description:
      "Change in the number of people working remotely in each 250 m grid cell (by home location) at the selected share of remote workers, compared with today.",
    quantityInSentence: "remote workers",
    unit: "workers",
    decimals: 1,
    featureName: "Grid cell · 250 m",
    opacityControl: true,
  },
  {
    path: "/on-site-workers",
    navLabel: "On-site workers",
    group: "Grid maps",
    dataset: "on_site_workers",
    title: "On-site workers",
    description:
      "Change in the number of people working on site in each 250 m grid cell (by workplace) at the selected share of remote workers, compared with today.",
    quantityInSentence: "on-site workers",
    unit: "workers",
    decimals: 1,
    featureName: "Grid cell · 250 m",
    opacityControl: true,
  },
  {
    path: "/car-passengers",
    navLabel: "Car passengers",
    group: "Traffic changes",
    dataset: "car_passengers",
    title: "Car passengers",
    description:
      "Change in the number of car passengers on each road segment at the selected share of remote workers, compared with today.",
    quantityInSentence: "car passengers",
    unit: "passengers",
    decimals: 1,
    featureName: "Road segment",
    opacityControl: false,
  },
  {
    path: "/transit-passengers",
    navLabel: "Transit passengers",
    group: "Traffic changes",
    dataset: "transit_passengers",
    title: "Transit passengers",
    description:
      "Change in the number of public-transport passengers on each route segment at the selected share of remote workers, compared with today.",
    quantityInSentence: "transit passengers",
    unit: "passengers",
    decimals: 1,
    featureName: "Route segment",
    opacityControl: false,
  },
];
