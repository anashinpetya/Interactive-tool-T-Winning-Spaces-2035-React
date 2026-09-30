import { useMemo } from "react";
import type { VisualizationSpec } from "vega-embed";
import type { ImpactConfig } from "../config/impacts";
import { S1_PERCENT, S3_PERCENT } from "../config/scenarios";
import { DARK_THEME, FONT, INK, MUTED } from "../lib/chartTheme";
import {
  changeFromToday,
  describeChange,
  formatImpact,
  selectedValue,
  STATUS_COLORS,
  STATUSES,
  statusOf,
} from "../lib/impactValues";
import { useVegaChart } from "../lib/useVegaChart";

const S1_LABEL = `S1 · ${S1_PERCENT} %`;
const S3_LABEL = `S3 · ${S3_PERCENT} %`;

/**
 * Three bars: S1, the selected share of remote workers, S3. Green = better
 * than today, red = worse; the selected bar is drawn solid, S1 and S3 lighter.
 */
export function ScenarioBarChart({ impact, percent }: { impact: ImpactConfig; percent: number }) {
  const labels = [S1_LABEL, `Selected · ${percent.toFixed(1)} %`, S3_LABEL];
  const rows = [impact.s1, selectedValue(impact, percent), impact.s3].map((value, i) => {
    const change = changeFromToday(impact, value);
    return {
      order: i,
      Label: labels[i],
      value,
      valueText: formatImpact(impact, value, impact.bars.signed),
      totalText: `${formatImpact(impact, value)}${impact.unit}`,
      changeText: describeChange(impact, change),
      status: statusOf(change),
      emphasis: i === 1 ? "selected" : "reference",
    };
  });

  const spec = useMemo<VisualizationSpec>(() => {
    const { bars, s2 } = impact;
    const tooltip = [
      { field: "Label", type: "nominal", title: "Scenario" },
      // emissions are totals, so also show the total; health values already are the change
      ...(s2 !== 0 ? [{ field: "totalText", type: "nominal", title: impact.name }] : []),
      { field: "changeText", type: "nominal", title: "Compared with today" },
    ];
    // only on the bar and label layers: a rule layer with an x field would draw one vertical line per bar
    const x = {
      field: "Label",
      type: "nominal",
      // "min", not the default "sum": only min/max/count survive merging the bar and text layers' domains
      sort: { field: "order", op: "min" },
      // "Selected · 35.0 %" on two lines
      axis: { title: null, labelAngle: 0, labelExpr: "split(datum.label, ' · ')", labelLineHeight: 17 },
      scale: { paddingInner: 0.45, paddingOuter: 0.35 },
    };
    // the "Today's level" label goes on the side whose bar stays below today's level, so it never overlaps a bar
    const todayLabelAt = impact.s3 < s2 ? { x: "width", align: "right" } : { x: 0, align: "left" };
    return {
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      description: `${bars.title}: ${S1_LABEL} ${formatImpact(impact, impact.s1, bars.signed)}, today ${formatImpact(impact, s2, bars.signed)}, ${S3_LABEL} ${formatImpact(impact, impact.s3, bars.signed)}.`,
      width: "container",
      height: 340,
      layer: [
        {
          mark: { type: "bar", cornerRadiusTopLeft: 6, cornerRadiusTopRight: 6, cornerRadiusBottomLeft: 6, cornerRadiusBottomRight: 6 },
          encoding: {
            x,
            y: {
              field: "value",
              type: "quantitative",
              axis: {
                title: bars.yTitle,
                tickCount: 6,
                ...(bars.signed ? { labelExpr: "datum.value > 0 ? '+' + datum.label : datum.label" } : {}),
              },
              scale: { domain: bars.yDomain },
            },
            color: {
              field: "status",
              type: "nominal",
              scale: { domain: STATUSES, range: STATUSES.map((s) => STATUS_COLORS[s]) },
              legend: null,
            },
            opacity: { condition: { test: "datum.emphasis === 'selected'", value: 1 }, value: 0.5 },
            tooltip,
          },
        },
        {
          mark: {
            type: "text",
            font: FONT,
            fontSize: 15,
            fontWeight: 600,
            color: INK,
            baseline: { expr: "datum.value < 0 ? 'top' : 'bottom'" },
            dy: { expr: "datum.value < 0 ? 8 : -8" },
          },
          encoding: {
            x,
            y: { field: "value", type: "quantitative" },
            text: { field: "valueText" },
          },
        },
        {
          data: { values: [{}] },
          mark: { type: "rule", color: "rgba(255,255,255,0.35)", strokeWidth: 1 },
          encoding: { y: { datum: 0 } },
        },
        // today's level (for health it is the zero line itself)
        ...(s2 !== 0
          ? [
              {
                data: { values: [{}] },
                mark: { type: "rule", color: "rgba(255,255,255,0.5)", strokeWidth: 1, strokeDash: [4, 4] },
                encoding: { y: { datum: s2 } },
              },
            ]
          : []),
        {
          data: { values: [{}] },
          mark: { type: "text", text: "Today's level", ...todayLabelAt, baseline: "bottom", dy: -5, font: FONT, fontSize: 11, color: MUTED },
          encoding: { y: { datum: s2 } },
        },
      ],
      config: DARK_THEME,
    } as VisualizationSpec;
  }, [impact]);

  const container = useVegaChart(spec, "table", rows);
  return <div className="chart" ref={container} />;
}
