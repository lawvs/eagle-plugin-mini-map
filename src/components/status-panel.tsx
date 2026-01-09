import { useMemo } from "react";
import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
import type { LoadState } from "../types";

interface StatusPanelProps {
  state: LoadState;
  errorMessage: string;
}

export function StatusPanel({ state, errorMessage }: StatusPanelProps) {
  const isDark = useIsDarkTheme();
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
      ? isDark
        ? "text-rose-200"
        : "text-rose-600"
      : isDark
        ? "text-white/70"
        : "text-slate-600";

  return (
    <section
      className={`rounded-xl border p-4 shadow-xl transition-colors ${
        isDark
          ? "border-white/10 bg-slate-900/60 shadow-black/40"
          : "border-slate-200 bg-white/60 shadow-black/10"
      }`}
    >
      <div
        className={`min-h-45x flex flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-colors ${
          isDark ? "border-white/10 bg-white/5" : "border-slate-300 bg-slate-50"
        }`}
      >
        <p className={`text-sm font-medium transition-colors ${tone}`}>
          {copy}
        </p>
      </div>
    </section>
  );
}
