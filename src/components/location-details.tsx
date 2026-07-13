import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
import type { Coordinates } from "../types";
import { CoordinatesGrid } from "./coordinates-grid";
import { ExternalMapLink } from "./external-map-link";
import { MiniMap } from "./mini-map";

interface LocationDetailsProps {
  coordinates: Coordinates;
}

export function LocationDetails({ coordinates }: LocationDetailsProps) {
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

        <ExternalMapLink coordinates={coordinates} />
      </div>
    </section>
  );
}
