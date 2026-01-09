import type { Coordinates } from "../types";

interface CoordinatesGridProps {
  coordinates: Coordinates;
}

export function CoordinatesGrid({ coordinates }: CoordinatesGridProps) {
  const formattedLat = coordinates.latitude.toFixed(3);
  const formattedLng = coordinates.longitude.toFixed(3);
  const formattedAlt =
    coordinates.altitude != null
      ? `${coordinates.altitude.toFixed(0)} m`
      : "Unknown";

  return (
    <dl className="hidden grid-cols-3 gap-3 text-xs text-slate-600 transition-colors @[350px]:grid dark:text-white/70">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-white/5 dark:bg-white/5">
        <dt className="text-[11px] tracking-wide text-slate-500 uppercase transition-colors dark:text-white/50">
          Latitude
        </dt>
        <dd className="text-base font-semibold text-slate-900 transition-colors dark:text-white">
          {formattedLat}°
        </dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-white/5 dark:bg-white/5">
        <dt className="text-[11px] tracking-wide text-slate-500 uppercase transition-colors dark:text-white/50">
          Longitude
        </dt>
        <dd className="text-base font-semibold text-slate-900 transition-colors dark:text-white">
          {formattedLng}°
        </dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors dark:border-white/5 dark:bg-white/5">
        <dt className="text-[11px] tracking-wide text-slate-500 uppercase transition-colors dark:text-white/50">
          Altitude
        </dt>
        <dd className="text-base font-semibold text-slate-900 transition-colors dark:text-white">
          {formattedAlt}
        </dd>
      </div>
    </dl>
  );
}
