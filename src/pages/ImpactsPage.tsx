import { useState } from "react";
import { IMPACTS, IMPACTS_PAGE } from "../config/impacts";
import { S2_PERCENT, S3_PERCENT } from "../config/scenarios";
import { ImpactSummary } from "../components/ImpactSummary";
import { ScenarioBarChart } from "../components/ScenarioBarChart";
import { ScenarioSlider } from "../components/ScenarioSlider";
import { SegmentedControl } from "../components/SegmentedControl";
import { TradeoffChart } from "../components/TradeoffChart";

type View = "curves" | "bars";

const VIEWS: { value: View; label: string }[] = [
  { value: "bars", label: "Bar charts" },
  { value: "curves", label: "Trade-off curves" },
];

/** "Emissions & health": both regional results, driven by one slider. */
export function ImpactsPage() {
  const [percent, setPercent] = useState(S3_PERCENT);
  const [view, setView] = useState<View>("bars");

  return (
    <article className="page">
      <header className="page-header">
        <p className="eyebrow">{IMPACTS_PAGE.group}</p>
        <h1>{IMPACTS_PAGE.title}</h1>
        <p className="lede">{IMPACTS_PAGE.intro}</p>
      </header>

      <section className="panel controls" aria-label="Chart controls">
        <ScenarioSlider value={percent} onChange={setPercent} />
        <div className="controls-side">
          <SegmentedControl label="Chart type" options={VIEWS} value={view} onChange={setView} />
        </div>
      </section>

      <ImpactSummary percent={percent} />

      {view === "curves" ? (
        <section className="panel chart-panel impact-curves" aria-label="Trade-off curves">
          {IMPACTS.map((impact) => (
            <figure key={impact.id} className="impact-figure">
              <figcaption>
                <h2>{impact.curve.title}</h2>
                <p>{impact.curve.description}</p>
              </figcaption>
              <TradeoffChart impact={impact} percent={percent} />
            </figure>
          ))}
        </section>
      ) : (
        <section className="impact-bars" aria-label="Bar charts">
          {IMPACTS.map((impact) => (
            <figure key={impact.id} className="panel chart-panel impact-figure">
              <figcaption>
                <h2>{impact.bars.title}</h2>
                <p>{impact.bars.description}</p>
              </figcaption>
              <ScenarioBarChart impact={impact} percent={percent} />
            </figure>
          ))}
        </section>
      )}

      <section className="impact-notes" aria-label="How to read the results">
        <div className="panel note">
          <h2>How to read the numbers</h2>
          <ul>
            <li>
              The curves, the summary cards and the premature-deaths bars show the change compared with{" "}
              <strong>today</strong> (S2, {S2_PERCENT} % remote workers), so 0 means no change. The CO₂ bar chart
              shows total daily emissions; its dashed line marks today's level.
            </li>
            <li>
              <strong>Premature deaths:</strong> positive numbers (<span className="text-bad">red</span>) are extra
              premature deaths compared with today; negative numbers (<span className="text-good">green</span>) are
              premature deaths avoided.
            </li>
            <li>
              <strong>CO₂ emissions:</strong> <span className="text-bad">red</span> means more transport-related
              emissions than today, <span className="text-good">green</span> means less.
            </li>
            <li>Results between the scenarios S1, S2 and S3 are interpolated linearly.</li>
          </ul>
        </div>
        <div className="panel note note-assumption">
          <h2>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 11v6M12 7.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Assumption
          </h2>
          <p>
            The health calculations assume that people do <strong>not</strong> use the spare time they gain from not
            commuting for exercise, so any extra physical activity in that time is not included in the results.
          </p>
        </div>
      </section>
    </article>
  );
}
