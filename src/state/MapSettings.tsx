import { createContext, useContext, useState, type ReactNode } from "react";
import { S3_PERCENT } from "../config/scenarios";
import type { Measure } from "../lib/mapValues";

// The remote-working share and absolute/percentage choice are shared by all
// map pages, so topics can be compared at the same scenario.
interface MapSettings {
  percent: number;
  setPercent: (value: number) => void;
  measure: Measure;
  setMeasure: (value: Measure) => void;
  opacity: number;
  setOpacity: (value: number) => void;
}

const MapSettingsContext = createContext<MapSettings | null>(null);

export function MapSettingsProvider({ children }: { children: ReactNode }) {
  const [percent, setPercent] = useState<number>(S3_PERCENT);
  const [measure, setMeasure] = useState<Measure>("abs");
  const [opacity, setOpacity] = useState(0.85);
  return (
    <MapSettingsContext.Provider value={{ percent, setPercent, measure, setMeasure, opacity, setOpacity }}>
      {children}
    </MapSettingsContext.Provider>
  );
}

export function useMapSettings() {
  const ctx = useContext(MapSettingsContext);
  if (!ctx) throw new Error("useMapSettings must be used inside <MapSettingsProvider>");
  return ctx;
}
