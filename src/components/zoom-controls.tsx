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
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-white/20 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900/70 [&>button:not(:last-child)]:border-b [&>button:not(:last-child)]:border-white/20">
      <button
        aria-label="Zoom in"
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="flex size-6 items-center justify-center text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/90 dark:hover:bg-white/10"
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
        className="flex size-6 items-center justify-center text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/90 dark:hover:bg-white/10"
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
