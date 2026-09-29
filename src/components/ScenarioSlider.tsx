import type { CSSProperties } from "react";
import { S2_PERCENT, SCENARIOS, SLIDER } from "../config/scenarios";

interface ScenarioSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const position = (v: number) => ((v - SLIDER.min) / (SLIDER.max - SLIDER.min)) * 100;

/**
 * Share of remote workers, 0 % (S1) to 47.3 % (S3). The highlighted part of
 * the track runs from today's level (S2) to the selected value; the scenario
 * marks under the track jump straight to S1, S2 or S3.
 */
export function ScenarioSlider({ value, onChange }: ScenarioSliderProps) {
  const today = position(S2_PERCENT);
  const current = position(value);
  const style = {
    "--from": `${Math.min(today, current)}%`,
    "--to": `${Math.max(today, current)}%`,
    "--pos": `${current}%`,
  } as CSSProperties;

  return (
    <div className="scenario-slider">
      <div className="control-label-row">
        <label className="control-label" htmlFor="remote-share">
          Share of remote workers
        </label>
        <output className="value-pill" htmlFor="remote-share">
          {value.toFixed(1)} %
        </output>
      </div>

      <div className="scenario-track" style={style}>
        <div className="scenario-track-rail" />
        <div className="scenario-track-fill" />
        {SCENARIOS.map((s) => (
          <div key={s.id} className="scenario-tick" style={{ left: `${position(s.percent)}%` }} />
        ))}
        <input
          id="remote-share"
          type="range"
          min={SLIDER.min}
          max={SLIDER.max}
          step={SLIDER.step}
          value={value}
          onChange={(e) => onChange(Number(Number(e.target.value).toFixed(1)))}
          aria-valuetext={`${value.toFixed(1)} percent remote workers`}
        />
      </div>

      <div className="scenario-marks">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`scenario-mark align-${i === 0 ? "start" : i === SCENARIOS.length - 1 ? "end" : "center"}`}
            style={{ left: `${position(s.percent)}%` }}
            aria-pressed={value === s.percent}
            onClick={() => onChange(s.percent)}
          >
            <span className="scenario-mark-id">
              {s.id} · {s.percent} %
            </span>
            <span className="scenario-mark-name">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
