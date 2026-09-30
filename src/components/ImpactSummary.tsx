import { EMISSIONS, HEALTH } from "../config/impacts";
import { S2_PERCENT } from "../config/scenarios";
import { formatImpact, readingAt, type Reading, type Status } from "../lib/impactValues";
import { formatPercent } from "../lib/mapValues";

const ARROWS: Record<Status, string> = { good: "▼", bad: "▲", neutral: "●" };

const capitalise = (text: string) => text[0].toUpperCase() + text.slice(1);

/** Two cards with the selected share's result next to each other: the trade-off at a glance. */
export function ImpactSummary({ percent }: { percent: number }) {
  const emissions = readingAt(EMISSIONS, percent);
  const health = readingAt(HEALTH, percent);
  const heading =
    percent === S2_PERCENT
      ? `At today's share of remote workers (${S2_PERCENT} %)`
      : `At ${percent.toFixed(1)} % remote workers, compared with today (${S2_PERCENT} %)`;

  return (
    <section className="impact-summary" aria-label="Result at the selected share of remote workers">
      <p className="impact-summary-heading">{heading}</p>
      <div className="impact-tiles">
        <Tile
          label={EMISSIONS.name}
          reading={emissions}
          value={`${formatImpact(EMISSIONS, emissions.change, true)} t`}
          unit="CO₂ per day"
          status={
            emissions.status === "neutral"
              ? "Same as today"
              : `${formatPercent(Math.abs(emissions.change) / EMISSIONS.s2, false)} ${emissions.status === "bad" ? EMISSIONS.more : EMISSIONS.less}`
          }
          detail={`${formatImpact(EMISSIONS, emissions.value)} t per day in total (today ${formatImpact(EMISSIONS, EMISSIONS.s2)} t).`}
        />
        <Tile
          label={`${HEALTH.name} (2025–2035 average)`}
          reading={health}
          value={formatImpact(HEALTH, health.change, true)}
          unit="vs today"
          status={
            health.status === "neutral" ? "Same as today" : capitalise(health.status === "bad" ? HEALTH.more : HEALTH.less)
          }
          detail="Assumes the time saved by working remotely is not used for exercise."
        />
      </div>
    </section>
  );
}

interface TileProps {
  label: string;
  reading: Reading;
  value: string;
  unit: string;
  status: string;
  detail: string;
}

function Tile({ label, reading, value, unit, status, detail }: TileProps) {
  return (
    <div className={`impact-tile ${reading.status}`}>
      <div className="impact-tile-label">{label}</div>
      <div className="impact-tile-value">
        {value}{" "}
        <span className="impact-tile-unit">{unit}</span>
      </div>
      <div className="status-chip">
        <span aria-hidden="true">{ARROWS[reading.status]}</span>
        {status}
      </div>
      <p className="impact-tile-detail">{detail}</p>
    </div>
  );
}
