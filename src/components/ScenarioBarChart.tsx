import { useEffect, useMemo, useRef } from "react";
import embed, { type Result, type VisualizationSpec } from "vega-embed";
import type { Config } from "vega-lite";
import type { BarChartPageConfig } from "../config/barCharts";

// Dark chart theme matching the site (see styles.css tokens)
const FONT = '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif';
const INK = "#e8ebf1";
const MUTED = "#8b93a3";
const GRID = "rgba(255,255,255,0.07)";
const REFERENCE_BAR = "#4f5869"; // S1 and S3
const SELECTED_BAR = "#9085e9"; // the selected share (accent)

const DARK_THEME: Config = {
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

const SCENARIOS = ["S1 · 0 %", "Selected", "S3 · 47.3 %"] as const;

interface ScenarioBarChartProps {
  config: BarChartPageConfig;
  /** Values for S1, the selected percentage and S3 */
  values: [number, number, number];
  /** Label of the middle bar, e.g. "Selected · 35.0 %" */
  selectedLabel: string;
}

/** Three bars: S1, the selected share of remote workers, S3. */
export function ScenarioBarChart({ config, values, selectedLabel }: ScenarioBarChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const embedded = useRef<Promise<Result> | null>(null);

  const rows = values.map((v, i) => ({
    Scenario: SCENARIOS[i],
    Label: i === 1 ? selectedLabel : SCENARIOS[i],
    [config.field]: v,
  }));
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const spec = useMemo<Omit<VisualizationSpec, "data">>(() => {
    const value = `datum['${config.field}']`;
    return {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      width: "container",
      height: 420,
      encoding: {
        x: {
          field: "Scenario",
          type: "nominal",
          sort: [...SCENARIOS],
          axis: { title: null, labelAngle: 0 },
          scale: { paddingInner: 0.45, paddingOuter: 0.3 },
        },
      },
      layer: [
        {
          mark: { type: "bar", cornerRadiusTopLeft: 6, cornerRadiusTopRight: 6, cornerRadiusBottomLeft: 6, cornerRadiusBottomRight: 6 },
          encoding: {
            y: {
              field: config.field,
              type: "quantitative",
              axis: { title: config.yTitle, tickCount: 6 },
              scale: { domain: config.yDomain },
            },
            color: {
              field: "Scenario",
              type: "nominal",
              scale: { domain: [...SCENARIOS], range: [REFERENCE_BAR, SELECTED_BAR, REFERENCE_BAR] },
              legend: null,
            },
            tooltip: config.tooltip.map((t) =>
              t.field === "Scenario"
                ? { field: "Label", type: "nominal" as const, title: t.title }
                : { field: config.field, type: "quantitative" as const, title: t.title, format: config.labelFormat },
            ),
          },
        },
        {
          mark: {
            type: "text",
            font: FONT,
            fontSize: 15,
            fontWeight: 600,
            color: INK,
            baseline: { expr: `${value} < 0 ? 'top' : 'bottom'` },
            dy: { expr: `${value} < 0 ? 8 : -8` },
          },
          encoding: {
            y: { field: config.field, type: "quantitative" },
            text: { field: config.field, type: "quantitative", format: config.labelFormat },
          },
        },
        {
          mark: { type: "rule", color: "rgba(255,255,255,0.35)", strokeWidth: 1 },
          encoding: { y: { datum: 0 } },
        },
      ],
      config: DARK_THEME,
    };
  }, [config]);

  // Build the chart once per page with the current values ...
  useEffect(() => {
    if (!container.current) return;
    const el = container.current;
    const full = { ...spec, data: { name: "table", values: rowsRef.current } } as VisualizationSpec;
    // wait for the web font so Vega measures the axis labels with it
    const result = document.fonts.ready.then(() =>
      embed(el, full, { actions: false, renderer: "svg", tooltip: { theme: "dark" } }),
    );
    embedded.current = result;
    return () => {
      embedded.current = null;
      result.then((r) => r.finalize()).catch(() => {});
    };
  }, [spec]);

  // ... and only swap the data when the slider moves
  const key = values.join("|") + selectedLabel;
  useEffect(() => {
    embedded.current
      ?.then(({ view }) => view.data("table", rowsRef.current).runAsync())
      .catch((e) => console.error(e));
  }, [key]);

  return <div className="chart" ref={container} />;
}
