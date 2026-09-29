import type { CSSProperties } from "react";

interface RangeControlProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
}

/** Small labelled slider (used for map opacity). */
export function RangeControl({ id, label, min, max, step, value, onChange, format }: RangeControlProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="range-control">
      <div className="control-label-row">
        <label className="control-label" htmlFor={id}>
          {label}
        </label>
        <output className="control-value" htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        className="simple-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--fill": `${fill}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
