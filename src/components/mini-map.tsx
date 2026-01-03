import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useState } from "react";
import Map from "react-map-gl/maplibre";
import type { Coordinates } from "../types";

interface MiniMapProps extends Coordinates {
  label?: string;
}

const MAP_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;
const DEFAULT_ZOOM = 13;

export function MiniMap({ latitude, longitude, label }: MiniMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom: DEFAULT_ZOOM,
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    setViewState((prev) => ({ ...prev, latitude, longitude }));
  }, [latitude, longitude]);

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const handleZoomChange = useCallback(
    (delta: number) => {
      setViewState((prev) => ({ ...prev, zoom: clampZoom(prev.zoom + delta) }));
    },
    [clampZoom],
  );

  const canZoomIn = viewState.zoom < MAX_ZOOM;
  const canZoomOut = viewState.zoom > MIN_ZOOM;

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/10">
      <Map
        key={`${latitude}-${longitude}`}
        mapLib={import("maplibre-gl")}
        reuseMaps
        initialViewState={{
          latitude: viewState.latitude,
          longitude: viewState.longitude,
          zoom: viewState.zoom,
          bearing: 0,
          pitch: 0,
        }}
        latitude={viewState.latitude}
        longitude={viewState.longitude}
        zoom={viewState.zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE_URL}
        attributionControl={false}
        interactive={false}
        onLoad={handleLoad}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <span className="absolute top-1/2 left-1/2 block h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-sky-400/60 blur-xl" />
          <span className="absolute top-1/2 left-1/2 block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 bg-sky-500" />
          <span className="block h-2 w-2 rounded-full bg-white" />
        </div>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-xs text-white/80 backdrop-blur">
          Loading map...
        </div>
      )}

      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => handleZoomChange(1)}
          disabled={!canZoomIn}
          className="rounded-xl border border-white/20 bg-slate-900/70 px-2 py-1 text-sm font-semibold text-white/90 shadow disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => handleZoomChange(-1)}
          disabled={!canZoomOut}
          className="rounded-xl border border-white/20 bg-slate-900/70 px-2 py-1 text-sm font-semibold text-white/90 shadow disabled:cursor-not-allowed disabled:opacity-40"
        >
          –
        </button>
      </div>

      {label && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/80 to-transparent p-2 text-center text-[11px] tracking-wide text-white/75 uppercase">
          {label}
        </div>
      )}
    </div>
  );
}
