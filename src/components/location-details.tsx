import type { Coordinates } from "../types";
import { CoordinatesGrid } from "./coordinates-grid";
import { MiniMap } from "./mini-map";

interface LocationDetailsProps {
  coordinates: Coordinates;
  openMapUrl: string | null;
}

export function LocationDetails({
  coordinates,
  openMapUrl,
}: LocationDetailsProps) {
  return (
    <section className="@container rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-xl shadow-black/10 transition-colors dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40">
      <div className="flex flex-col gap-4">
        <MiniMap
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
          altitude={coordinates.altitude}
        />

        <CoordinatesGrid coordinates={coordinates} />

        {openMapUrl && (
          <a
            href={openMapUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 text-xs font-semibold text-sky-600 transition-colors hover:text-sky-700 @[350px]:inline-flex dark:text-sky-300 dark:hover:text-sky-200"
          >
            View on OpenStreetMap
            <span aria-hidden>&rarr;</span>
          </a>
        )}
      </div>
    </section>
  );
}
