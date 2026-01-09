import type { Coordinates } from "../types";
import { MiniMap } from "./mini-map";

interface LocationDetailsProps {
  coordinates: Coordinates;
  openMapUrl: string | null;
}

export function LocationDetails({
  coordinates,
  openMapUrl,
}: LocationDetailsProps) {
  const formattedLat = coordinates.latitude.toFixed(3);
  const formattedLng = coordinates.longitude.toFixed(3);
  const formattedAlt =
    coordinates.altitude != null
      ? `${coordinates.altitude.toFixed(0)} m`
      : "Unknown";

  return (
    <section className="@container rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-xl shadow-black/10 transition-colors dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40">
      <div className="space-y-4">
        <MiniMap
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
          altitude={coordinates.altitude}
        />

        <dl className="hidden grid-cols-3 gap-3 text-xs text-slate-600 transition-colors dark:text-white/70 @[350px]:grid">
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

        {openMapUrl && (
          <a
            href={openMapUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 text-xs font-semibold text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200 @[350px]:inline-flex"
          >
            View on OpenStreetMap
            <span aria-hidden>&rarr;</span>
          </a>
        )}
      </div>
    </section>
  );
}
