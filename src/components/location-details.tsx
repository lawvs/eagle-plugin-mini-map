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
  const formattedLat = coordinates.latitude.toFixed(5);
  const formattedLng = coordinates.longitude.toFixed(5);
  const formattedAlt =
    coordinates.altitude != null
      ? `${coordinates.altitude.toFixed(0)} m`
      : "Unknown";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-black/40">
      <div className="space-y-4">
        <MiniMap
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
          altitude={coordinates.altitude}
          label="Photo Location"
        />

        <dl className="grid grid-cols-3 gap-3 text-xs text-white/70">
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <dt className="text-[11px] tracking-wide text-white/50 uppercase">
              Latitude
            </dt>
            <dd className="text-base font-semibold text-white">
              {formattedLat}°
            </dd>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <dt className="text-[11px] tracking-wide text-white/50 uppercase">
              Longitude
            </dt>
            <dd className="text-base font-semibold text-white">
              {formattedLng}°
            </dd>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <dt className="text-[11px] tracking-wide text-white/50 uppercase">
              Altitude
            </dt>
            <dd className="text-base font-semibold text-white">
              {formattedAlt}
            </dd>
          </div>
        </dl>

        {openMapUrl && (
          <a
            href={openMapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 transition hover:text-sky-200"
          >
            View on OpenStreetMap
            <span aria-hidden>&rarr;</span>
          </a>
        )}
      </div>
    </section>
  );
}
