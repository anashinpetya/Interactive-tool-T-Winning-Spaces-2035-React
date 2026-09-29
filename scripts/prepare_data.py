"""
Build the map layers the web app loads, one per topic, by spatially joining
the S1-vs-S2 and S2-vs-S3 GeoPackages into a single layer.

Run this whenever a .gpkg file in ../Datasets changes:

    pip install -r scripts/requirements.txt
    python scripts/prepare_data.py

Both source files of a pair describe change relative to TODAY (S2, 24 % remote
working): in every file the "_1" columns hold the S2 value and
absolute_change = (other scenario) - S2, percentage_change = absolute_change / S2.
So one merged layer can show any remote-working level from 0 % to 47.3 %:

    s1_s2 file  ->  "s1": change at S1 (0 %)     relative to S2
    s2_s3 file  ->  "s3": change at S3 (47.3 %)  relative to S2

How the union is done
  * Grid maps: geopandas overlay(how="union") of the two grids. The 250 m cells
    coincide, so every output feature is one grid cell; a cell present in only
    one file gets no value (null) for the other scenario.
  * Traffic maps: the two road networks are cut into different pieces, so both
    are noded together (shapely union_all), every resulting piece takes the
    values of the segment of each file it lies on, and pieces with the same
    pair of source segments are merged back into one feature.

Output: public/data/<layer>.json

    {
      "layer": "emissions",
      "geometry_type": "polygon" | "line",
      "unit": "kg",
      "bounds": [west, south, east, north],
      "base":  [S2 value | null, ...] | null,           # one value per feature (null: not available)
      "s1":    {"abs": [...], "pct": [...]},            # S1 - S2, (S1 - S2) / S2
      "s3":    {"abs": [...], "pct": [...]},            # S3 - S2, (S3 - S2) / S2
      "scale": {"abs": number, "pct": number},          # suggested colour-scale limits
      "geometry": [[part, ...], ...]
    }

null means "no data" (feature missing from that file, or a percentage whose
S2 value is 0). A line "part" is a flat [lon, lat, lon, lat, ...] array; a
polygon part is a list of such rings. Coordinates are WGS84, 6 decimals.
"""

import json
import math
import sys
import warnings
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import shapely

warnings.filterwarnings("ignore", category=RuntimeWarning)

ROOT = Path(__file__).resolve().parent.parent
DATASETS_DIR = ROOT / "Datasets"
OUTPUT_DIR = ROOT / "public" / "data"

METRIC_CRS = 3067  # ETRS-TM35FIN, metres
COORD_DECIMALS = 6
MIN_PIECE_M = 0.5  # traffic union: drop noding slivers shorter than this
SCALE_QUANTILE = 0.95  # absolute colour scale ends at the 95th percentile of |change|
PCT_SCALE = 1.0  # percentage colour scale ends at +-100 %

LAYERS = {
    "emissions": {
        "s1": "Grid maps/s1_s2_emissions_diff.gpkg",
        "s3": "Grid maps/s2_s3_emissions_diff.gpkg",
        "base": "CO2 emissions, gramms_1",
        "divisor": 1000,  # grams -> kg
        "unit": "kg",
    },
    "remote_workers": {
        "s1": "Grid maps/s1_s2_remote_workers_diff.gpkg",
        "s3": "Grid maps/s2_s3_remote_workers_diff.gpkg",
        "base": "Remote workers_1",
        "unit": "workers",
    },
    "on_site_workers": {
        "s1": "Grid maps/s1_s2_on_site_workers_diff.gpkg",
        "s3": "Grid maps/s2_s3_on_site_workers_diff.gpkg",
        "base": "On-site workers_1",
        "unit": "workers",
    },
    "car_passengers": {
        "s1": "Traffic changes/cars_s1_s2.gpkg",
        "s3": "Traffic changes/cars_s2_s3.gpkg",
        "base": "total_trips_1",
        "unit": "passengers",
    },
    "transit_passengers": {
        "s1": "Traffic changes/transit_s1_s2.gpkg",
        "s3": "Traffic changes/transit_s2_s3.gpkg",
        "base": "total_trips_1",
        "unit": "passengers",
    },
}


# ------------------------------------------------------------------ helpers

def read(rel_path: str) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(DATASETS_DIR / rel_path)
    if gdf.crs is None:
        raise ValueError(f"{rel_path} has no CRS")
    return gdf.to_crs(METRIC_CRS)


def prepare_side(gdf: gpd.GeoDataFrame, cfg: dict) -> pd.DataFrame:
    """abs / pct / base columns of one source file, in display units."""
    divisor = cfg.get("divisor", 1)
    base = gdf[cfg["base"]].astype(float) / divisor
    absolute = gdf["absolute_change"].astype(float) / divisor
    # percentage relative to S2; undefined where the S2 value is 0
    pct = gdf["percentage_change"].astype(float)
    pct = pct.where(base != 0, np.where(absolute == 0, 0.0, np.nan))
    pct = pct.where(np.isfinite(pct))
    return pd.DataFrame({"abs": absolute.values, "pct": pct.values, "base": base.values})


def union_grids(a: gpd.GeoDataFrame, b: gpd.GeoDataFrame):
    """Spatial union of two grids; returns geometries and the source row of each side (-1 = none)."""
    left = gpd.GeoDataFrame({"ia": np.arange(len(a))}, geometry=a.geometry.values, crs=a.crs)
    right = gpd.GeoDataFrame({"ib": np.arange(len(b))}, geometry=b.geometry.values, crs=b.crs)
    out = gpd.overlay(left, right, how="union", keep_geom_type=True)
    # the grids coincide, so the union must not produce slivers
    area = out.area
    cell = float(np.median(area))
    slivers = int((area < 0.01 * cell).sum())
    if slivers:
        print(f"    note: dropping {slivers} sliver pieces (< 1 % of a cell)")
        out = out[area >= 0.01 * cell]
    ia = out["ia"].fillna(-1).astype(int).values
    ib = out["ib"].fillna(-1).astype(int).values
    return list(out.geometry.values), ia, ib


def union_lines(a: gpd.GeoDataFrame, b: gpd.GeoDataFrame):
    """Node both networks together and give every piece its source segment in each file."""
    ga = shapely.set_precision(a.geometry.values, 0.01)
    gb = shapely.set_precision(b.geometry.values, 0.01)
    noded = shapely.union_all(np.concatenate([ga, gb]), grid_size=0.01)
    # slivers under 0.5 m come from road ends that almost (but not exactly) meet
    pieces = [p for p in shapely.get_parts(noded) if p.length >= MIN_PIECE_M]

    pieces = np.array(pieces, dtype=object)
    piece_len = shapely.length(pieces)

    def owner(geoms, values):
        """For each piece: the source segment that covers (>= 90 % of) it, or -1.

        A few segments overlap other segments of the same file; there the one
        covering most of the piece (then the lowest row number) is used.
        """
        tree = shapely.STRtree(geoms)
        p, g = tree.query(pieces, predicate="dwithin", distance=0.05)
        cover = shapely.length(shapely.intersection(pieces[p], shapely.buffer(geoms[g], 0.05))) / piece_len[p]
        hits = pd.DataFrame({"p": p, "g": g, "cover": cover})
        hits = hits[hits.cover >= 0.9].sort_values(["p", "cover", "g"], ascending=[True, False, True])
        best = hits.drop_duplicates("p")
        idx = np.full(len(pieces), -1)
        idx[best.p.values] = best.g.values
        # pieces with several full-cover segments that disagree
        many = hits[hits.p.duplicated(keep=False)]
        conflicts = int(many.groupby("p").g.agg(lambda s: len(set(values[s]))).gt(1).sum())
        return idx, conflicts

    ia, ca = owner(ga, a["absolute_change"].values)
    ib, cb = owner(gb, b["absolute_change"].values)
    if ca or cb:
        print(f"    note: {ca + cb} pieces lie on overlapping segments of one file with different values; the best-covering one was used")

    # merge pieces that share the same pair of source segments
    frame = pd.DataFrame({"ia": ia, "ib": ib, "geom": pieces})
    frame = frame[(frame.ia >= 0) | (frame.ib >= 0)]
    geoms, out_a, out_b = [], [], []
    for (x, y), grp in frame.groupby(["ia", "ib"], sort=False):
        merged = shapely.line_merge(shapely.MultiLineString(list(grp.geom)))
        geoms.append(merged)
        out_a.append(x)
        out_b.append(y)

    # coverage check: every source segment should be (almost) fully represented
    for name, src, idx in (("s1", ga, np.array(out_a)), ("s3", gb, np.array(out_b))):
        lengths = pd.Series([g.length for g in geoms]).groupby(idx).sum()
        lengths = lengths[lengths.index >= 0]
        src_len = pd.Series(shapely.length(src))
        # overlapping duplicates only keep one owner, so compare total network length
        print(f"    {name}: union covers {lengths.sum() / 1000:.1f} km of {src_len.sum() / 1000:.1f} km source network")
    return geoms, np.array(out_a), np.array(out_b)


def flat(coords):
    out = []
    for x, y, *_ in coords:
        out.append(round(x, COORD_DECIMALS))
        out.append(round(y, COORD_DECIMALS))
    return out


def encode_geometry(geom):
    if geom is None or geom.is_empty:
        return []
    kind = geom.geom_type
    if kind == "LineString":
        return [flat(geom.coords)]
    if kind == "MultiLineString":
        return [flat(g.coords) for g in geom.geoms]
    if kind == "Polygon":
        return [[flat(geom.exterior.coords)] + [flat(r.coords) for r in geom.interiors]]
    if kind == "MultiPolygon":
        return [[flat(p.exterior.coords)] + [flat(r.coords) for r in p.interiors] for p in geom.geoms]
    if kind == "GeometryCollection":
        return [part for g in geom.geoms for part in encode_geometry(g)]
    raise ValueError(f"Unsupported geometry type: {kind}")


def num(v, digits=6):
    """JSON-safe number: NaN/inf -> None, floats rounded to `digits` significant decimals."""
    if v is None:
        return None
    v = float(v)
    if not math.isfinite(v):
        return None
    if v.is_integer() and abs(v) < 2**53:
        return int(v)
    return float(f"{v:.{digits}g}")


def pick(side: pd.DataFrame, idx: np.ndarray, column: str):
    values = side[column].values
    return [num(values[i]) if i >= 0 else None for i in idx]


def nice_ceiling(x: float) -> float:
    """Round up to 1, 2, 2.5 or 5 x 10^n for tidy legend ends."""
    if not x or not math.isfinite(x):
        return 1.0
    exp = math.floor(math.log10(x))
    for m in (1, 2, 2.5, 5, 10):
        if m * 10**exp >= x:
            return m * 10**exp
    return 10 ** (exp + 1)


def scale_limit(*arrays) -> float:
    values = np.abs(np.concatenate([np.asarray(a, dtype=float) for a in arrays]))
    values = values[np.isfinite(values) & (values > 0)]
    return nice_ceiling(float(np.quantile(values, SCALE_QUANTILE))) if len(values) else 1.0


# ------------------------------------------------------------------ main

def build(layer: str, cfg: dict) -> Path:
    a, b = read(cfg["s1"]), read(cfg["s3"])
    side_a, side_b = prepare_side(a, cfg), prepare_side(b, cfg)
    kinds = set(a.geom_type) | set(b.geom_type)
    if kinds <= {"Polygon", "MultiPolygon"}:
        geometry_type = "polygon"
        geoms, ia, ib = union_grids(a, b)
    elif kinds <= {"LineString", "MultiLineString"}:
        geometry_type = "line"
        geoms, ia, ib = union_lines(a, b)
    else:
        raise ValueError(f"{layer}: unsupported geometry types {kinds}")

    # S2 value: both files hold it; prefer the S2-vs-S3 file, fall back to S1-vs-S2.
    # It is only published when the two files agree (true for the grids; the
    # traffic files come from separate model runs whose S2 counts differ).
    base_a, base_b = pick(side_a, ia, "base"), pick(side_b, ib, "base")
    both = [(x, y) for x, y in zip(base_a, base_b) if x is not None and y is not None]
    same = np.mean([math.isclose(x, y, rel_tol=1e-6, abs_tol=1e-9) for x, y in both]) if both else 0.0
    print(f"    S2 value identical in both files for {same * 100:.1f} % of shared features")
    if same >= 0.99:
        base = [y if y is not None else x for x, y in zip(base_a, base_b)]
    else:
        print("    -> S2 values disagree between the files, so they are not published")
        base = None

    out_geoms = gpd.GeoSeries(geoms, crs=METRIC_CRS).to_crs(4326)
    payload = {
        "layer": layer,
        "geometry_type": geometry_type,
        "unit": cfg["unit"],
        "bounds": [round(v, 5) for v in out_geoms.total_bounds],
        "base": base,
        "s1": {"abs": pick(side_a, ia, "abs"), "pct": pick(side_a, ia, "pct")},
        "s3": {"abs": pick(side_b, ib, "abs"), "pct": pick(side_b, ib, "pct")},
        "scale": {"abs": scale_limit(side_a["abs"], side_b["abs"]), "pct": PCT_SCALE},
        "geometry": [encode_geometry(g) for g in out_geoms],
    }
    out = OUTPUT_DIR / f"{layer}.json"
    out.write_text(json.dumps(payload, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    only_a = int(((ia >= 0) & (ib < 0)).sum())
    only_b = int(((ia < 0) & (ib >= 0)).sum())
    print(
        f"    {len(geoms)} features (in both files: {len(geoms) - only_a - only_b}, only S1-S2: {only_a}, "
        f"only S2-S3: {only_b}); scale ±{payload['scale']['abs']} {cfg['unit']} / ±{payload['scale']['pct'] * 100:g} %"
    )
    return out


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUTPUT_DIR.glob("*.json"):
        old.unlink()
    for layer, cfg in LAYERS.items():
        print(f"{layer}:")
        out = build(layer, cfg)
        print(f"    -> {out.relative_to(ROOT)} ({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    sys.exit(main())
