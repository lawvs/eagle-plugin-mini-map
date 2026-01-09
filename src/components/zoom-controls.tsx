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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-plus size-3"
          aria-hidden="true"
        >
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-minus size-3"
          aria-hidden="true"
        >
          <path d="M5 12h14"></path>
        </svg>
      </button>
    </div>
  );
}
