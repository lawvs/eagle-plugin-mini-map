import { Settings } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
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

const SETTINGS_DIALOG_ID = "settings-dialog";

function useDismissibleLayer(
  isOpen: boolean,
  layerRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node) || layerRef.current?.contains(target)) {
        return;
      }

      onDismiss();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, layerRef, onDismiss]);
}

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
  const [isOpen, setIsOpen] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

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

  useDismissibleLayer(isOpen, layerRef, closeMenu);

  return (
    <div ref={layerRef} className="group/settings absolute top-3 right-3 z-50">
      <button
        ref={triggerRef}
        type="button"
        aria-controls={SETTINGS_DIALOG_ID}
        aria-expanded={isOpen}
        aria-label="Settings"
        title="Settings"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex size-7 cursor-pointer items-center justify-center rounded-md border shadow-sm transition duration-150 focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:outline-none ${
          isOpen
            ? "opacity-100"
            : "opacity-0 group-focus-within/settings:opacity-100 group-hover:opacity-100"
        } ${
          isDark
            ? "border-white/10 bg-slate-900/85 text-white/80 hover:bg-slate-800 hover:text-white"
            : "border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Settings aria-hidden="true" className="size-4" />
      </button>

      {isOpen && (
        <div
          id={SETTINGS_DIALOG_ID}
          role="dialog"
          aria-label="Settings"
          className={`absolute top-full right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] space-y-3 rounded-xl border p-3 shadow-xl backdrop-blur-md transition-colors ${
            isDark
              ? "border-white/10 bg-slate-900 text-white/90 shadow-black/50"
              : "border-slate-200 bg-white/95 text-slate-900 shadow-black/15"
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
      )}
    </div>
  );
}
