import { useMemo } from "react";
import type { VisualizationSpec } from "vega-embed";
import type { ImpactConfig } from "../config/impacts";
import { S1_PERCENT, S2_PERCENT, S3_PERCENT, SLIDER } from "../config/scenarios";
import { ACCENT, DARK_THEME, FONT, INK, MUTED, PANEL } from "../lib/chartTheme";
import {
  changeFromToday,
  describeChange,
  formatImpact,
  readingAt,
  STATUS_COLORS,
  STATUSES,
  statusOf,
} from "../lib/impactValues";
import { useVegaChart } from "../lib/useVegaChart";

const CURVE = "#cdd3de";

/**
 * The change compared with today (S2) over the whole slider range. The part
 * between today and the selected share is filled in: green = better than
 * today, red = worse. Hovering shows the value at any share.
 */
export function TradeoffChart({ impact, percent }: { impact: ImpactConfig; percent: number }) {
  const spec = useMemo(() => buildSpec(impact), [impact]);
  const { change, status } = readingAt(impact, percent);
  const unit = Math.abs(change) === 1 && impact.shortUnitOne ? impact.shortUnitOne : impact.shortUnit;
  const rows = [
    { kind: "area", x: S2_PERCENT, y: 0, status },
    { kind: "area", x: percent, y: change, status },
    { kind: "point", x: percent, y: change, status, text: `${formatImpact(impact, change, true)} ${unit}` },
  ];
  const container = useVegaChart(spec, "selected", rows);
  return <div className="chart wide" ref={container} />;
}

/** One row per slider step, for the hover tooltip. */
function hoverRows(impact: ImpactConfig) {
  const steps = Math.round((SLIDER.max - SLIDER.min) / SLIDER.step);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = Number((SLIDER.min + i * SLIDER.step).toFixed(1));
    const { value, change } = readingAt(impact, x);
    return {
      x,
      y: change,
      share: `${x.toFixed(1)} %`,
      change: describeChange(impact, change),
      total: `${formatImpact(impact, value)}${impact.unit}`,
    };
  });
}

function buildSpec(impact: ImpactConfig): VisualizationSpec {
  const c1 = changeFromToday(impact, impact.s1);
  const c3 = changeFromToday(impact, impact.s3);
  const [lo, hi] = impact.curve.yDomain;

  const scenarios = [
    { x: S1_PERCENT, y: c1 },
    { x: S2_PERCENT, y: 0 },
    { x: S3_PERCENT, y: c3 },
  ];
  // the curve crosses today's level at S2, so each side is wholly better or worse
  const sides = [
    { side: "s1", x: S1_PERCENT, y: c1, status: statusOf(c1) },
    { side: "s1", x: S2_PERCENT, y: 0, status: statusOf(c1) },
    { side: "s3", x: S2_PERCENT, y: 0, status: statusOf(c3) },
    { side: "s3", x: S3_PERCENT, y: c3, status: statusOf(c3) },
  ];

  const x = {
    field: "x",
    type: "quantitative",
    scale: { domain: [SLIDER.min, SLIDER.max], nice: false, zero: false },
    axis: {
      title: "Share of remote workers",
      values: [S1_PERCENT, S2_PERCENT, S3_PERCENT],
      // scenario names only when there is room for them (phones get "0 %", "24 %", "47.3 %")
      labelExpr: `(width < 320 ? '' : datum.value === ${S1_PERCENT} ? 'S1 · ' : datum.value === ${S2_PERCENT} ? 'S2 · ' : 'S3 · ') + datum.value + ' %'`,
      labelFontSize: 12,
      labelFlush: true,
      labelOverlap: false,
      grid: true,
    },
  };
  const y = {
    field: "y",
    type: "quantitative",
    scale: { domain: [lo, hi], nice: false },
    axis: {
      title: impact.curve.yTitle,
      values: [lo, lo / 2, 0, hi / 2, hi],
      labelExpr: "datum.value > 0 ? '+' + datum.label : datum.label",
      // the same width in both charts, so their plots line up
      minExtent: 44,
      maxExtent: 44,
    },
  };
  const color = {
    field: "status",
    type: "nominal",
    scale: { domain: STATUSES, range: STATUSES.map((s) => STATUS_COLORS[s]) },
    legend: null,
  };
  const tooltip = [
    { field: "share", type: "nominal", title: "Share of remote workers" },
    { field: "change", type: "nominal", title: "Compared with today" },
    ...(impact.s2 !== 0 ? [{ field: "total", type: "nominal", title: impact.name }] : []),
  ];
  const selectedPoint = [{ filter: "datum.kind === 'point'" }];

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v6.json",
    description: `${impact.curve.title} compared with today, from ${S1_PERCENT} % to ${S3_PERCENT} % remote workers: ${describeChange(impact, c1)} at ${S1_PERCENT} %, ${describeChange(impact, c3)} at ${S3_PERCENT} %.`,
    width: "container",
    height: 240,
    layer: [
      // faint fill between the whole curve and today's level
      {
        data: { values: sides },
        mark: { type: "area", opacity: 0.14 },
        encoding: { x, y, y2: { datum: 0 }, color, detail: { field: "side" } },
      },
      // strong fill from today to the selected share
      {
        transform: [{ filter: "datum.kind === 'area'" }],
        mark: { type: "area", opacity: 0.55 },
        encoding: { x, y, y2: { datum: 0 }, color },
      },
      // today's level
      {
        data: { values: [{}] },
        mark: { type: "rule", color: "rgba(255,255,255,0.4)", strokeWidth: 1 },
        encoding: { y: { datum: 0 } },
      },
      {
        data: { values: [{}] },
        mark: { type: "text", text: "Today's level", x: 0, align: "left", baseline: "bottom", dx: 6, dy: -5, font: FONT, fontSize: 11, color: MUTED },
        encoding: { y: { datum: 0 } },
      },
      // the curve through S1, S2 and S3 (the results in between are interpolated)
      {
        data: { values: scenarios },
        mark: { type: "line", color: CURVE, strokeWidth: 2 },
        encoding: { x, y },
      },
      {
        data: { values: scenarios },
        mark: { type: "point", filled: true, size: 36, color: CURVE, opacity: 1 },
        encoding: { x, y },
      },
      // hover: a guide line and a tooltip at the nearest share (one invisible rule per slider step,
      // so they are hidden from screen readers)
      {
        data: { values: hoverRows(impact) },
        mark: { type: "rule", color: MUTED, strokeWidth: 1, aria: false },
        params: [
          {
            name: "hover",
            select: { type: "point", fields: ["x"], nearest: true, on: "pointerover", clear: "pointerout" },
          },
        ],
        encoding: {
          x,
          opacity: { condition: { param: "hover", empty: false, value: 0.7 }, value: 0 },
          tooltip,
        },
      },
      {
        data: { values: hoverRows(impact) },
        transform: [{ filter: { param: "hover", empty: false } }],
        mark: { type: "point", filled: true, size: 50, color: INK, opacity: 1, aria: false },
        encoding: { x, y },
      },
      // the selected share
      {
        transform: selectedPoint,
        mark: { type: "rule", color: ACCENT, strokeWidth: 1.5, opacity: 0.85 },
        encoding: { x },
      },
      {
        transform: selectedPoint,
        mark: { type: "point", filled: true, size: 160, stroke: PANEL, strokeWidth: 2.5, opacity: 1 },
        encoding: { x, y, color },
      },
      {
        transform: selectedPoint,
        mark: {
          type: "text",
          font: FONT,
          fontSize: 14,
          fontWeight: 650,
          color: INK,
          // keep the label inside the plot near its left and right edges
          align: { expr: `datum.x < ${SLIDER.min + 5} ? 'left' : datum.x > ${SLIDER.max - 5} ? 'right' : 'center'` },
          dx: { expr: `datum.x < ${SLIDER.min + 5} ? 8 : datum.x > ${SLIDER.max - 5} ? -8 : 0` },
          baseline: { expr: "datum.y < 0 ? 'top' : 'bottom'" },
          dy: { expr: "datum.y < 0 ? 14 : -14" },
        },
        encoding: { x, y, text: { field: "text" } },
      },
    ],
    config: DARK_THEME,
  } as VisualizationSpec;
}
