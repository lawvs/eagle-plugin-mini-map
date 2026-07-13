import type { ChangeEvent } from "react";
import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
import { usePluginSettings } from "../hooks/use-plugin-settings";
import type {
  ExternalMapProvider,
  MapStylePreference,
  ThemePreference,
} from "../lib/plugin-settings";

export function SettingsMenu() {
  const isDark = useIsDarkTheme();
  const { settings, updateSettings } = usePluginSettings();

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ theme: event.currentTarget.value as ThemePreference });
  };

  const handleMapStyleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateSettings({
      mapStyle: event.currentTarget.value as MapStylePreference,
    });
  };

  const handleExternalMapProviderChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    updateSettings({
      externalMapProvider: event.currentTarget.value as ExternalMapProvider,
    });
  };

  const selectClassName = `w-full rounded-md border px-2 py-1 text-xs outline-none transition-colors focus:ring-2 focus:ring-sky-400/60 ${
    isDark
      ? "border-white/10 bg-slate-800 text-white"
      : "border-slate-200 bg-white text-slate-800"
  }`;

  return (
    <details className="absolute top-3 right-3 z-50">
      <summary
        aria-label="Settings"
        title="Settings"
        className={`flex size-7 cursor-pointer list-none items-center justify-center rounded-md border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:outline-none [&::-webkit-details-marker]:hidden ${
          isDark
            ? "border-white/10 bg-slate-900/85 text-white/80 hover:bg-slate-800 hover:text-white"
            : "border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      </summary>

      <div
        className={`absolute top-full right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] space-y-3 rounded-xl border p-3 shadow-xl backdrop-blur-md transition-colors ${
          isDark
            ? "border-white/10 bg-slate-900/95 shadow-black/50"
            : "border-slate-200 bg-white/95 shadow-black/15"
        }`}
      >
        <label className="grid gap-1 text-xs font-medium">
          <span>Theme</span>
          <select
            value={settings.theme}
            onChange={handleThemeChange}
            className={selectClassName}
          >
            <option value="eagle">Follow Eagle</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium">
          <span>Map style</span>
          <select
            value={settings.mapStyle}
            onChange={handleMapStyleChange}
            className={selectClassName}
          >
            <option value="auto">Match theme</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium">
          <span>Open in</span>
          <select
            value={settings.externalMapProvider}
            onChange={handleExternalMapProviderChange}
            className={selectClassName}
          >
            <option value="openstreetmap">OpenStreetMap</option>
            <option value="google">Google Maps</option>
            <option value="apple">Apple Maps</option>
          </select>
        </label>
      </div>
    </details>
  );
}
