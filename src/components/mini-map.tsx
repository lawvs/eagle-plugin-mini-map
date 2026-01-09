import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useState } from "react";
import Map from "react-map-gl/maplibre";
import { useEagleTheme } from "../hooks/use-eagle-theme";
import type { Coordinates } from "../types";
import { ZoomControls } from "./zoom-controls";

interface MiniMapProps extends Coordinates {
  label?: string;
}

const MAP_STYLE_LIGHT =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const MAP_STYLE_DARK =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const MIN_ZOOM = 2;
const MAX_ZOOM = 18;
const DEFAULT_ZOOM = 13;

export function MiniMap({ latitude, longitude, label }: MiniMapProps) {
  const theme = useEagleTheme();
  const mapStyle =
    theme === "light" || theme === "lightgray"
      ? MAP_STYLE_LIGHT
      : MAP_STYLE_DARK;
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom: DEFAULT_ZOOM,
  });

  const handleLoad = useCallback(
    (event: { target: { resize: () => void } }) => {
      setIsLoaded(true);
      // Force map to resize to fill container
      event.target.resize();
    },
    [],
  );

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
    <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-colors dark:border-white/10 dark:bg-black/10">
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
        mapStyle={mapStyle}
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
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs text-slate-600 backdrop-blur transition-colors dark:bg-slate-900/40 dark:text-white/80">
          Loading map...
        </div>
      )}

      <div className="absolute top-3 right-3">
        <ZoomControls
          onZoomIn={() => handleZoomChange(1)}
          onZoomOut={() => handleZoomChange(-1)}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
        />
      </div>

      {label && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-white/80 p-2 text-center text-[11px] tracking-wide text-slate-700 uppercase transition-colors dark:from-slate-950/80 dark:text-white/75">
          {label}
        </div>
      )}
    </div>
  );
}
