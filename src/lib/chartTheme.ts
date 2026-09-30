import type { Config } from "vega-lite";

// Dark chart theme matching the site (see styles.css tokens)
export const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
export const INK = "#e8ebf1";
export const MUTED = "#8b93a3";
export const GRID = "rgba(255,255,255,0.07)";
export const ACCENT = "#9085e9"; // the slider colour
export const PANEL = "#121722"; // chart background, used for the ring around markers

export const DARK_THEME: Config = {
  font: FONT,
  background: "transparent",
  autosize: { type: "fit", contains: "padding" },
  axis: {
    labelFont: FONT,
    titleFont: FONT,
    labelFontSize: 12,
    labelColor: MUTED,
    titleFontSize: 12,
    titleFontWeight: 500,
    titleColor: MUTED,
    titlePadding: 14,
    labelPadding: 10,
    ticks: false,
    domain: false,
    gridColor: GRID,
  },
  axisX: { grid: false, labelFontSize: 13, labelColor: INK, labelFontWeight: 500 },
  view: { stroke: "transparent" },
};
