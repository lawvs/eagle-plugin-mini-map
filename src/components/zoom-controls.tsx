import { Minus, Plus } from "lucide-react";
import { useIsDarkTheme } from "../hooks/use-is-dark-theme";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,
}: ZoomControlsProps) {
  const isDark = useIsDarkTheme();
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-md border shadow-sm [&>button:not(:last-child)]:border-b [&>button:not(:last-child)]:border-white/20 ${
        isDark
          ? "border-white/10 bg-slate-900/70"
          : "border-white/20 bg-white/90"
      }`}
    >
      <button
        aria-label="Zoom in"
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={`flex size-6 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          isDark
            ? "text-white/90 hover:bg-white/10"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <Plus aria-hidden="true" className="size-3" />
      </button>
      <button
        aria-label="Zoom out"
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={`flex size-6 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          isDark
            ? "text-white/90 hover:bg-white/10"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <Minus aria-hidden="true" className="size-3" />
      </button>
    </div>
  );
}
