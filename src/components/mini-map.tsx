import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useState } from "react";
import Map from "react-map-gl/maplibre";
import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
import { usePluginSettings } from "../hooks/use-plugin-settings";
import type { MapStylePreference } from "../lib/plugin-settings";
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

function resolveMapStyle(
  preference: MapStylePreference,
  isDark: boolean,
): string {
  if (preference === "light") return MAP_STYLE_LIGHT;
  if (preference === "dark") return MAP_STYLE_DARK;
  return isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
}

export function MiniMap({ latitude, longitude, label }: MiniMapProps) {
  const isDark = useIsDarkTheme();
  const { settings } = usePluginSettings();
  const mapStyle = resolveMapStyle(settings.mapStyle, isDark);
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const handleLoad = useCallback(
    (event: { target: { resize: () => void } }) => {
      setIsLoaded(true);
      // Force map to resize to fill container
      event.target.resize();
    },
    [],
  );

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const handleZoomChange = useCallback(
    (delta: number) => {
      setZoom((prev) => clampZoom(prev + delta));
    },
    [clampZoom],
  );

  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  return (
    <div
      className={`relative h-48 w-full overflow-hidden rounded-xl border transition-colors ${
        isDark ? "border-white/10 bg-black/10" : "border-slate-200 bg-slate-100"
      }`}
    >
      <Map
        key={`${latitude}-${longitude}`}
        mapLib={import("maplibre-gl")}
        reuseMaps
        initialViewState={{
          latitude,
          longitude,
          zoom,
          bearing: 0,
          pitch: 0,
        }}
        latitude={latitude}
        longitude={longitude}
        zoom={zoom}
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
        <div
          className={`absolute inset-0 flex items-center justify-center text-xs backdrop-blur transition-colors ${
            isDark
              ? "bg-slate-900/40 text-white/80"
              : "bg-white/80 text-slate-600"
          }`}
        >
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
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t p-2 text-center text-[11px] tracking-wide uppercase transition-colors ${
            isDark
              ? "from-slate-950/80 text-white/75"
              : "from-white/80 text-slate-700"
          }`}
        >
          {label}
        </div>
      )}
    </div>
  );
}
