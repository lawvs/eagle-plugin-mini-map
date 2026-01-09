import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
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
  const isDark = useIsDarkTheme();

  return (
    <section
      className={`@container rounded-2xl border p-4 shadow-xl transition-colors ${
        isDark
          ? "border-white/10 bg-slate-900/60 shadow-black/40"
          : "border-slate-200 bg-white/60 shadow-black/10"
      }`}
    >
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
            className={`hidden items-center gap-2 text-xs font-semibold transition-colors @[350px]:inline-flex ${
              isDark
                ? "text-sky-300 hover:text-sky-200"
                : "text-sky-600 hover:text-sky-700"
            }`}
          >
            View on OpenStreetMap
            <span aria-hidden>&rarr;</span>
          </a>
        )}
      </div>
    </section>
  );
}
