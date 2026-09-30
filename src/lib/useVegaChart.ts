import { useEffect, useRef } from "react";
import embed, { type Result, type VisualizationSpec } from "vega-embed";

/**
 * Draws a Vega-Lite spec into the returned container once per spec, and
 * afterwards only swaps the rows of its data source `dataName` (so the chart
 * does not flash while a slider moves).
 */
export function useVegaChart(spec: VisualizationSpec, dataName: string, rows: object[]) {
  const container = useRef<HTMLDivElement>(null);
  const embedded = useRef<Promise<Result> | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  // Build the chart once per spec with the current rows ...
  useEffect(() => {
    if (!container.current) return;
    const el = container.current;
    const full = { ...spec, data: { name: dataName, values: rowsRef.current } } as VisualizationSpec;
    // wait for the web font so Vega measures the axis labels with it
    const result = document.fonts.ready.then(() =>
      embed(el, full, { actions: false, renderer: "svg", tooltip: { theme: "dark" } }),
    );
    embedded.current = result;
    return () => {
      embedded.current = null;
      result.then((r) => r.finalize()).catch(() => {});
    };
  }, [spec, dataName]);

  // ... and only swap the data when the rows change
  const key = JSON.stringify(rows);
  useEffect(() => {
    embedded.current
      ?.then(({ view }) => view.data(dataName, rowsRef.current).runAsync())
      .catch((e) => console.error(e));
  }, [key, dataName]);

  return container;
}
