import { useEffect, useMemo, useState } from "react";
import type { MapPageConfig } from "../config/mapPages";
import { S2_PERCENT } from "../config/scenarios";
import { LayerMap } from "../components/LayerMap";
import { MapLegend } from "../components/MapLegend";
import { RangeControl } from "../components/RangeControl";
import { ScenarioSlider } from "../components/ScenarioSlider";
import { SegmentedControl } from "../components/SegmentedControl";
import { Spinner } from "../components/Spinner";
import { colorFor } from "../lib/colorScale";
import { loadLayer, type LayerData } from "../lib/data";
import { changeAt, colorsFor, featureValues, formatPercent, formatValue, type Measure } from "../lib/mapValues";
import { useMapSettings } from "../state/MapSettings";

const MEASURES: { value: Measure; label: string }[] = [
  { value: "abs", label: "Absolute change" },
  { value: "pct", label: "Percentage change" },
];

/** One map page: a single map of the change relative to today (S2). */
export function MapPage({ page }: { page: MapPageConfig }) {
  const { percent, setPercent, measure, setMeasure, opacity, setOpacity } = useMapSettings();
  const [data, setData] = useState<LayerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLayer(page.dataset).then(
      (d) => !cancelled && setData(d),
      (e: Error) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [page.dataset]);

  const limit = data ? (page.scale?.[measure] ?? data.scale[measure]) : 1;
  const values = useMemo(() => (data ? changeAt(data, percent, measure) : null), [data, percent, measure]);
  const colors = useMemo(() => (values ? colorsFor(values, limit) : []), [values, limit]);
  const hasMissing = useMemo(() => (values ? values.some((v) => Number.isNaN(v)) : false), [values]);
  const layerOpacity = page.opacityControl ? opacity : 0.95;

  const comparison =
    percent === S2_PERCENT
      ? "Today's level (S2) — no change"
      : `${percent.toFixed(1)} % remote workers vs today (24 %)`;

  const unitTick = (v: number) => `${formatValue(v, 0, true)}`;
  const legendUnit = measure === "pct" ? "%" : page.legendUnit;
  const legendTitle = `Change in ${page.quantityInSentence}${legendUnit ? ` (${legendUnit})` : ""}`;

  const renderTooltip = (row: number) => {
    if (!data) return null;
    const v = featureValues(data, percent, row);
    const swatch = colorFor(measure === "abs" ? v.abs : v.pct, limit);
    const selected = Number.isFinite(v.today) && Number.isFinite(v.abs) ? v.today + v.abs : NaN;
    return (
      <>
        <div className="tooltip-heading">
          {swatch && <span className="tooltip-swatch" style={{ background: `rgb(${swatch.join(" ")})` }} />}
          <span>{page.featureName}</span>
        </div>
        <div className="tooltip-sub">{comparison}</div>
        <dl className="tooltip-rows">
          <div className={measure === "abs" ? "active" : undefined}>
            <dt>Change</dt>
            <dd>
              {formatValue(v.abs, page.decimals, true)} {page.unit}
            </dd>
          </div>
          <div className={measure === "pct" ? "active" : undefined}>
            <dt>Change (%)</dt>
            <dd>{formatPercent(v.pct)}</dd>
          </div>
          {Number.isFinite(v.today) && (
            <>
              <div>
                <dt>Today (S2)</dt>
                <dd>
                  {formatValue(v.today, page.decimals)} {page.unit}
                </dd>
              </div>
              <div>
                <dt>At {percent.toFixed(1)} %</dt>
                <dd>
                  {formatValue(selected, page.decimals)} {page.unit}
                </dd>
              </div>
            </>
          )}
        </dl>
      </>
    );
  };

  return (
    <article className="page">
      <header className="page-header">
        <p className="eyebrow">{page.group}</p>
        <h1>{page.title}</h1>
        <p className="lede">{page.description}</p>
      </header>

      <section className="panel controls" aria-label="Map controls">
        <ScenarioSlider value={percent} onChange={setPercent} />
        <div className="controls-side">
          <SegmentedControl label="Show" options={MEASURES} value={measure} onChange={setMeasure} />
          {page.opacityControl && (
            <RangeControl
              id="opacity"
              label="Opacity"
              min={0.4} // lower values let the colours fade towards the grey of the sea
              max={1}
              step={0.01}
              value={opacity}
              onChange={setOpacity}
              format={(v) => `${Math.round(v * 100)} %`}
            />
          )}
        </div>
      </section>

      <section className="panel map-panel" aria-label={`${page.title} map`}>
        {error && <div className="error-box">{error}</div>}
        {!error && !data && <Spinner text="Loading map data…" />}
        {data && (
          <LayerMap
            data={data}
            colors={colors}
            opacity={layerOpacity}
            renderTooltip={renderTooltip}
            legend={
              <MapLegend
                title={legendTitle}
                subtitle={comparison}
                limit={limit}
                formatTick={measure === "abs" ? unitTick : (v) => formatPercent(v).replace(" %", "%")}
                hasMissing={hasMissing}
                // deck.gl draws a layer with opacity^(1/2.2) coverage; show the legend the same way
                barOpacity={Math.pow(layerOpacity, 1 / 2.2)}
              />
            }
          />
        )}
      </section>
    </article>
  );
}
