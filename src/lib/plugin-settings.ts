export type ThemePreference = "eagle" | "light" | "dark";
export type MapStylePreference = "auto" | "light" | "dark";
export type ExternalMapProvider = "openstreetmap" | "google" | "apple";

export interface PluginSettings {
  theme: ThemePreference;
  mapStyle: MapStylePreference;
  externalMapProvider: ExternalMapProvider;
}

export const DEFAULT_PLUGIN_SETTINGS: Readonly<PluginSettings> = Object.freeze({
  theme: "eagle",
  mapStyle: "auto",
  externalMapProvider: "openstreetmap",
});

export const PLUGIN_SETTINGS_STORAGE_KEY = "eagle-plugin-mini-map:settings:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "eagle" || value === "light" || value === "dark";
}

function isMapStylePreference(value: unknown): value is MapStylePreference {
  return value === "auto" || value === "light" || value === "dark";
}

function isExternalMapProvider(value: unknown): value is ExternalMapProvider {
  return value === "openstreetmap" || value === "google" || value === "apple";
}

export function readPluginSettings(
  storage: Pick<Storage, "getItem"> = localStorage,
): PluginSettings {
  try {
    const serialized = storage.getItem(PLUGIN_SETTINGS_STORAGE_KEY);
    if (serialized === null) return { ...DEFAULT_PLUGIN_SETTINGS };

    const stored: unknown = JSON.parse(serialized);
    if (!isRecord(stored)) return { ...DEFAULT_PLUGIN_SETTINGS };

    return {
      theme: isThemePreference(stored.theme)
        ? stored.theme
        : DEFAULT_PLUGIN_SETTINGS.theme,
      mapStyle: isMapStylePreference(stored.mapStyle)
        ? stored.mapStyle
        : DEFAULT_PLUGIN_SETTINGS.mapStyle,
      externalMapProvider: isExternalMapProvider(stored.externalMapProvider)
        ? stored.externalMapProvider
        : DEFAULT_PLUGIN_SETTINGS.externalMapProvider,
    };
  } catch {
    return { ...DEFAULT_PLUGIN_SETTINGS };
  }
}

export function writePluginSettings(
  settings: Readonly<PluginSettings>,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  try {
    storage.setItem(PLUGIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error: unknown) {
    console.warn("Failed to persist plugin settings", error);
  }
}
