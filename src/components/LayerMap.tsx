import { useMemo, useRef, useState, type ReactNode } from "react";
import { PathLayer, PolygonLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import { MapboxOverlay, type MapboxOverlayProps } from "@deck.gl/mapbox";
import { Map, useControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Rgb } from "../lib/colorScale";
import type { LayerData, Part } from "../lib/data";

const BASEMAP = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const TRANSPARENT: [number, number, number, number] = [0, 0, 0, 0];
// Hover outline: white line on a dark halo, visible on light and dark colours alike
const HIGHLIGHT: [number, number, number, number] = [255, 255, 255, 255];
const HALO: [number, number, number, number] = [10, 13, 19, 230];
// Flat 2D layers drawn inside the basemap: ignore its depth buffer
const FLAT = { depthCompare: "always", depthWriteEnabled: false } as const;

interface Hover {
  row: number;
  x: number;
  y: number;
}

interface LayerMapProps {
  data: LayerData;
  /** colour per feature; null = no data (not drawn, not hoverable) */
  colors: (Rgb | null)[];
  /** layer opacity 0..1 */
  opacity: number;
  /** hover card contents for a feature */
  renderTooltip: (row: number) => ReactNode;
  /** drawn over the top-left corner of the map */
  legend: ReactNode;
}

/**
 * deck.gl layers rendered inside the MapLibre map, between the basemap's
 * land/water/roads and its place-name labels, so the labels stay readable on
 * top of the data. (One WebGL context per map, released when the map closes.)
 */
function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

const fitPadding = (el: HTMLElement | null) =>
  el ? Math.max(16, Math.min(48, Math.round(Math.min(el.clientWidth, el.clientHeight) * 0.06))) : 32;

export function LayerMap({ data, colors, opacity, renderTooltip, legend }: LayerMapProps) {
  const frame = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const [labelLayer, setLabelLayer] = useState<string | undefined | null>(null); // null = style not loaded yet
  const [hover, setHover] = useState<Hover | null>(null);

  const [w, s, e, n] = data.bounds;
  const bounds: [[number, number], [number, number]] = [
    [w, s],
    [e, n],
  ];

  const recentre = () => mapRef.current?.fitBounds(bounds, { padding: fitPadding(frame.current), duration: 600 });

  const onHover = (info: PickingInfo<Part>) =>
    setHover(info.object && colors[info.object.row] ? { row: info.object.row, x: info.x, y: info.y } : null);

  const hovered = useMemo(
    () => (hover ? data.parts.filter((p) => p.row === hover.row) : []),
    [hover, data],
  );

  // insert the layers just below the first label layer (deck.gl's interleaved "beforeId" prop,
  // not part of the layer typings)
  const below = { beforeId: labelLayer ?? undefined } as Record<string, unknown>;
  const layers =
    labelLayer === null
      ? []
      : data.geometryType === "line"
        ? [
            new PathLayer<Part>({
              id: "change-lines",
              data: data.parts,
              getPath: (d) => d.path!,
              getColor: (d) => colors[d.row] ?? TRANSPARENT,
              widthUnits: "pixels",
              getWidth: 1.6,
              widthMinPixels: 1,
              capRounded: true,
              jointRounded: true,
              opacity,
              pickable: true,
              onHover,
              ...below,
              parameters: FLAT,
              updateTriggers: { getColor: colors },
            }),
            ...[
              { id: "hover-halo", color: HALO, width: 6 },
              { id: "hover-line", color: HIGHLIGHT, width: 3 },
            ].map(
              (h) =>
                new PathLayer<Part>({
                  id: h.id,
                  data: hovered,
                  getPath: (d) => d.path!,
                  getColor: h.color,
                  widthUnits: "pixels",
                  getWidth: h.width,
                  capRounded: true,
                  jointRounded: true,
                  ...below,
                  parameters: FLAT,
                }),
            ),
          ]
        : [
            new PolygonLayer<Part>({
              id: "change-cells",
              data: data.parts,
              getPolygon: (d) => d.polygon!,
              getFillColor: (d) => colors[d.row] ?? TRANSPARENT,
              filled: true,
              stroked: false,
              opacity,
              pickable: true,
              onHover,
              ...below,
              parameters: FLAT,
              updateTriggers: { getFillColor: colors },
            }),
            ...[
              { id: "hover-halo", color: HALO, width: 4 },
              { id: "hover-line", color: HIGHLIGHT, width: 2 },
            ].map(
              (h) =>
                new PolygonLayer<Part>({
                  id: h.id,
                  data: hovered,
                  getPolygon: (d) => d.polygon!,
                  filled: false,
                  stroked: true,
                  getLineColor: h.color,
                  lineWidthUnits: "pixels",
                  getLineWidth: h.width,
                  ...below,
                  parameters: FLAT,
                }),
            ),
          ];

  // Hover card next to the cursor, flipped away from the frame edges
  const width = frame.current?.clientWidth ?? 0;
  const height = frame.current?.clientHeight ?? 0;
  const card = hover && (
    <div
      className="map-tooltip"
      style={{
        left: hover.x,
        top: hover.y,
        transform: `translate(${hover.x > width / 2 ? "calc(-100% - 14px)" : "14px"}, ${
          hover.y > height / 2 ? "calc(-100% - 14px)" : "14px"
        })`,
      }}
    >
      {renderTooltip(hover.row)}
    </div>
  );

  return (
    <div className="map-frame" ref={frame} onMouseLeave={() => setHover(null)}>
      <Map
        ref={mapRef}
        initialViewState={{ bounds, fitBoundsOptions: { padding: fitPadding(frame.current) } }}
        mapStyle={BASEMAP}
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
        attributionControl={{ compact: true }}
        cursor={hover ? "pointer" : "grab"}
        onLoad={(e) => setLabelLayer(e.target.getStyle().layers.find((l) => l.type === "symbol")?.id)}
      >
        <DeckOverlay interleaved layers={layers} pickingRadius={4} />
      </Map>
      <button type="button" className="map-button" onClick={recentre} title="Recentre map" aria-label="Recentre map">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
        </svg>
      </button>
      <div className="map-legend-slot">{legend}</div>
      {card}
    </div>
  );
}
