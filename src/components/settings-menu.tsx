import { Settings } from "lucide-react";
import type { ChangeEvent } from "react";
import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
import { usePluginSettings } from "../hooks/use-plugin-settings";
import type {
  ExternalMapProvider,
  MapStylePreference,
  ThemePreference,
} from "../lib/plugin-settings";

interface SettingOption<Value extends string> {
  label: string;
  value: Value;
}

interface SettingSelectProps<Value extends string> {
  isDark: boolean;
  label: string;
  onValueChange: (value: Value) => void;
  options: readonly SettingOption<Value>[];
  value: Value;
}

const THEME_OPTIONS = [
  { value: "eagle", label: "Follow Eagle" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const satisfies readonly SettingOption<ThemePreference>[];

const MAP_STYLE_OPTIONS = [
  { value: "auto", label: "Match theme" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const satisfies readonly SettingOption<MapStylePreference>[];

const EXTERNAL_MAP_PROVIDER_OPTIONS = [
  { value: "openstreetmap", label: "OpenStreetMap" },
  { value: "google", label: "Google Maps" },
  { value: "apple", label: "Apple Maps" },
] as const satisfies readonly SettingOption<ExternalMapProvider>[];

function SettingSelect<Value extends string>({
  isDark,
  label,
  onValueChange,
  options,
  value,
}: SettingSelectProps<Value>) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onValueChange(event.currentTarget.value as Value);
  };

  const selectClassName = `w-full rounded-md border px-2 py-1 text-xs outline-none transition-colors focus:ring-2 focus:ring-sky-400/60 ${
    isDark
      ? "border-white/10 bg-slate-800 text-white"
      : "border-slate-200 bg-white text-slate-800"
  }`;

  return (
    <label className="grid gap-1 text-xs font-medium">
      <span>{label}</span>
      <select value={value} onChange={handleChange} className={selectClassName}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsMenu() {
  const isDark = useIsDarkTheme();
  const { settings, updateSettings } = usePluginSettings();

  const handleThemeChange = (theme: ThemePreference) => {
    updateSettings({ theme });
  };

  const handleMapStyleChange = (mapStyle: MapStylePreference) => {
    updateSettings({ mapStyle });
  };

  const handleExternalMapProviderChange = (
    externalMapProvider: ExternalMapProvider,
  ) => {
    updateSettings({ externalMapProvider });
  };

  return (
    <details className="absolute top-3 right-3 z-50 opacity-0 transition-opacity duration-150 group-hover:opacity-100 open:opacity-100 focus-within:opacity-100">
      <summary
        aria-label="Settings"
        title="Settings"
        className={`flex size-7 cursor-pointer list-none items-center justify-center rounded-md border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:outline-none [&::-webkit-details-marker]:hidden ${
          isDark
            ? "border-white/10 bg-slate-900/85 text-white/80 hover:bg-slate-800 hover:text-white"
            : "border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Settings aria-hidden="true" className="size-4" />
      </summary>

      <div
        className={`absolute top-full right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] space-y-3 rounded-xl border p-3 shadow-xl backdrop-blur-md transition-colors ${
          isDark
            ? "border-white/10 bg-slate-900/95 shadow-black/50"
            : "border-slate-200 bg-white/95 shadow-black/15"
        }`}
      >
        <SettingSelect
          isDark={isDark}
          label="Theme"
          onValueChange={handleThemeChange}
          options={THEME_OPTIONS}
          value={settings.theme}
        />

        <SettingSelect
          isDark={isDark}
          label="Map style"
          onValueChange={handleMapStyleChange}
          options={MAP_STYLE_OPTIONS}
          value={settings.mapStyle}
        />

        <SettingSelect
          isDark={isDark}
          label="Open in"
          onValueChange={handleExternalMapProviderChange}
          options={EXTERNAL_MAP_PROVIDER_OPTIONS}
          value={settings.externalMapProvider}
        />
      </div>
    </details>
  );
}
