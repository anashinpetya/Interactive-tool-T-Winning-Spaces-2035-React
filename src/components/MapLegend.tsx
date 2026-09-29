import { legendGradient, legendTicks } from "../lib/colorScale";

interface MapLegendProps {
  title: string;
  /** what is being compared, e.g. "47.3 % remote workers vs today (24 %)" */
  subtitle: string;
  /** end of the colour scale (values beyond it get the end colours) */
  limit: number;
  formatTick: (value: number) => string;
  /** show the "no data" note */
  hasMissing: boolean;
  /** how opaque the colours are drawn on the map (the bar is shown the same way over the land colour) */
  barOpacity: number;
}

const GRADIENT = legendGradient();

/** Continuous diverging colour bar, drawn over the map's top-left corner. */
export function MapLegend({ title, subtitle, limit, formatTick, hasMissing, barOpacity }: MapLegendProps) {
  const ticks = legendTicks(limit);
  return (
    <div className="map-legend">
      <div className="map-legend-title">{title}</div>
      <div className="map-legend-subtitle">{subtitle}</div>
      <div className="map-legend-bar">
        <div style={{ background: GRADIENT, opacity: barOpacity }} />
      </div>
      <div className="map-legend-ticks">
        {ticks.map((t, i) => (
          <span
            key={t.value}
            style={{ left: `${t.position * 100}%` }}
            className={i === 0 ? "first" : i === ticks.length - 1 ? "last" : i === 2 ? undefined : "minor"}
          >
            {i === 0 ? "≤ " : i === ticks.length - 1 ? "≥ " : ""}
            {formatTick(t.value)}
          </span>
        ))}
      </div>
      <div className="map-legend-ends">
        <span>Less than today</span>
        <span>More than today</span>
      </div>
      {hasMissing && <div className="map-legend-note">Areas without data for this scenario are not shown.</div>}
    </div>
  );
}
