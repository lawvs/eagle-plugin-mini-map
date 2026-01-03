import { useMemo } from "react";
import type { LoadState } from "../types/load-state";

interface StatusPanelProps {
  state: LoadState;
  errorMessage: string;
}

export function StatusPanel({ state, errorMessage }: StatusPanelProps) {
  const copy = useMemo(() => {
    switch (state) {
      case "loading":
        return "Retrieving EXIF data...";
      case "no-selection":
        return "Select an image in Eagle to view its location.";
      case "no-gps":
        return "This image is missing GPS coordinates in its EXIF metadata.";
      case "error":
        return errorMessage || "Unable to read metadata.";
      default:
        return "";
    }
  }, [state, errorMessage]);

  const tone = state === "error" ? "text-rose-200" : "text-white/70";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-black/40">
      <div className="flex min-h-45 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
        <p className={`text-sm font-medium ${tone}`}>{copy}</p>
        {state === "no-gps" && (
          <p className="mt-2 text-xs text-white/40">
            Ensure the photo has embedded GPS metadata (GPSLatitude &
            GPSLongitude).
          </p>
        )}
      </div>
    </section>
  );
}
