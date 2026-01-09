import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
import type { Coordinates } from "../types";

interface CoordinatesGridProps {
  coordinates: Coordinates;
}

export function CoordinatesGrid({ coordinates }: CoordinatesGridProps) {
  const isDark = useIsDarkTheme();
  const formattedLat = coordinates.latitude.toFixed(3);
  const formattedLng = coordinates.longitude.toFixed(3);
  const formattedAlt =
    coordinates.altitude != null
      ? `${coordinates.altitude.toFixed(0)} m`
      : "Unknown";

  return (
    <dl
      className={`hidden grid-cols-3 gap-3 text-xs transition-colors @[350px]:grid ${
        isDark ? "text-white/70" : "text-slate-600"
      }`}
    >
      <div
        className={`rounded-xl border p-3 transition-colors ${
          isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"
        }`}
      >
        <dt
          className={`text-[11px] tracking-wide uppercase transition-colors ${
            isDark ? "text-white/50" : "text-slate-500"
          }`}
        >
          Latitude
        </dt>
        <dd
          className={`text-base font-semibold transition-colors ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {formattedLat}°
        </dd>
      </div>
      <div
        className={`rounded-xl border p-3 transition-colors ${
          isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"
        }`}
      >
        <dt
          className={`text-[11px] tracking-wide uppercase transition-colors ${
            isDark ? "text-white/50" : "text-slate-500"
          }`}
        >
          Longitude
        </dt>
        <dd
          className={`text-base font-semibold transition-colors ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {formattedLng}°
        </dd>
      </div>
      <div
        className={`rounded-xl border p-3 transition-colors ${
          isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50"
        }`}
      >
        <dt
          className={`text-[11px] tracking-wide uppercase transition-colors ${
            isDark ? "text-white/50" : "text-slate-500"
          }`}
        >
          Altitude
        </dt>
        <dd
          className={`text-base font-semibold transition-colors ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {formattedAlt}
        </dd>
      </div>
    </dl>
  );
}
