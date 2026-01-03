import { useMemo } from "react";
import type { LoadState } from "../types";

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
        return "No GPS data found.";
      case "error":
        return errorMessage || "Unable to read metadata.";
      default:
        return "";
    }
  }, [state, errorMessage]);

  const tone = state === "error" ? "text-rose-200" : "text-white/70";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-black/40">
      <div className="min-h-45x flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
        <p className={`text-sm font-medium ${tone}`}>{copy}</p>
      </div>
    </section>
  );
}
