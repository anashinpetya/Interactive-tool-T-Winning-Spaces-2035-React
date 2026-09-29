// Loads the merged map layers written by scripts/prepare_data.py
// (cached per layer, so switching pages back and forth is instant).

type Position = [number, number];

export interface RawLayer {
  layer: string;
  geometry_type: "polygon" | "line";
  unit: string;
  bounds: [number, number, number, number];
  base: (number | null)[] | null;
  s1: { abs: (number | null)[]; pct: (number | null)[] };
  s3: { abs: (number | null)[]; pct: (number | null)[] };
  scale: { abs: number; pct: number };
  // one list of parts per feature; a line part is a flat [x, y, x, y, ...]
  // array, a polygon part is a list of such rings
  geometry: (number[] | number[][])[][];
}

/** One drawable piece of geometry. `row` points back into the value arrays. */
export interface Part {
  row: number;
  path?: Position[];
  polygon?: Position[][];
}

export interface Side {
  /** scenario - S2, in the layer's unit (NaN = no data) */
  abs: Float64Array;
  /** (scenario - S2) / S2 as a fraction (NaN = no data) */
  pct: Float64Array;
}

export interface LayerData {
  layer: string;
  geometryType: "polygon" | "line";
  unit: string;
  bounds: [number, number, number, number];
  rowCount: number;
  /** today's (S2) value per feature, when the source data provide a consistent one */
  base: Float64Array | null;
  s1: Side;
  s3: Side;
  scale: { abs: number; pct: number };
  parts: Part[];
}

const toArray = (values: (number | null)[]) => Float64Array.from(values, (v) => (v === null ? NaN : v));

function toPositions(flat: number[]): Position[] {
  const out: Position[] = new Array(flat.length / 2);
  for (let i = 0; i < flat.length; i += 2) out[i / 2] = [flat[i], flat[i + 1]];
  return out;
}

export function parseLayer(raw: RawLayer): LayerData {
  const s1 = { abs: toArray(raw.s1.abs), pct: toArray(raw.s1.pct) };
  const s3 = { abs: toArray(raw.s3.abs), pct: toArray(raw.s3.pct) };

  const parts: Part[] = [];
  raw.geometry.forEach((rowParts, row) => {
    for (const part of rowParts) {
      if (raw.geometry_type === "line") parts.push({ row, path: toPositions(part as number[]) });
      else parts.push({ row, polygon: (part as number[][]).map(toPositions) });
    }
  });

  // Draw roads with bigger changes last, so they sit on top where roads cross
  if (raw.geometry_type === "line") {
    const weight = (row: number) =>
      Math.max(Math.abs(s1.abs[row]) || 0, Math.abs(s3.abs[row]) || 0);
    parts.sort((a, b) => weight(a.row) - weight(b.row));
  }

  return {
    layer: raw.layer,
    geometryType: raw.geometry_type,
    unit: raw.unit,
    bounds: raw.bounds,
    rowCount: raw.s1.abs.length,
    base: raw.base ? toArray(raw.base) : null,
    s1,
    s3,
    scale: raw.scale,
    parts,
  };
}

const cache = new Map<string, Promise<LayerData>>();

export function loadLayer(name: string): Promise<LayerData> {
  let promise = cache.get(name);
  if (!promise) {
    promise = fetch(`${import.meta.env.BASE_URL}data/${name}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load data/${name}.json (HTTP ${res.status})`);
        return res.json() as Promise<RawLayer>;
      })
      .then(parseLayer);
    promise.catch(() => cache.delete(name));
    cache.set(name, promise);
  }
  return promise;
}
