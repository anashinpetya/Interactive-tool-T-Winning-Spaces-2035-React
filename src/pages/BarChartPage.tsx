import { useState } from "react";
import type { BarChartPageConfig } from "../config/barCharts";
import { S2_PERCENT } from "../config/scenarios";
import { ScenarioBarChart } from "../components/ScenarioBarChart";
import { ScenarioSlider } from "../components/ScenarioSlider";
import { selectedValue } from "../lib/barValues";

/** "Emission changes" and "Health impact assessment". */
export function BarChartPage({ config }: { config: BarChartPageConfig }) {
  const [percent, setPercent] = useState(S2_PERCENT);
  const selected = selectedValue(config, percent);

  return (
    <article className="page">
      <header className="page-header">
        <p className="eyebrow">Bar plots</p>
        <h1>{config.title}</h1>
        <p className="lede">{config.description}</p>
      </header>

      <section className="panel controls" aria-label="Chart controls">
        <ScenarioSlider value={percent} onChange={setPercent} />
      </section>

      <section className="panel chart-panel" aria-label={`${config.title} chart`}>
        <ScenarioBarChart
          config={config}
          values={[config.s1, selected, config.s3]}
          selectedLabel={`Selected · ${percent.toFixed(1)} %`}
        />
      </section>
    </article>
  );
}
