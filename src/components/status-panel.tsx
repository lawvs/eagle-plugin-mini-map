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

  const tone =
    state === "error"
      ? "text-rose-600 dark:text-rose-200"
      : "text-slate-600 dark:text-white/70";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-xl shadow-black/10 transition-colors dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/40">
      <div className="min-h-45x flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition-colors dark:border-white/10 dark:bg-white/5">
        <p className={`text-sm font-medium transition-colors ${tone}`}>
          {copy}
        </p>
      </div>
    </section>
  );
}
