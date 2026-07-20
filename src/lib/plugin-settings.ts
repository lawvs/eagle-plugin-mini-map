import { z } from "zod";
import { externalMapProviderSchema } from "./external-map";

export const MAP_ZOOM = {
  min: 2,
  max: 18,
  default: 13,
} as const;

export const DEFAULT_PLUGIN_SETTINGS = Object.freeze({
  theme: "eagle",
  mapStyle: "auto",
  externalMapProvider: "openstreetmap",
  zoom: MAP_ZOOM.default,
} as const);

const pluginSettingsSchema = z
  .object({
    theme: z
      .enum(["eagle", "light", "dark"])
      .catch(DEFAULT_PLUGIN_SETTINGS.theme),
    mapStyle: z
      .enum(["auto", "light", "dark"])
      .catch(DEFAULT_PLUGIN_SETTINGS.mapStyle),
    externalMapProvider: externalMapProviderSchema.catch(
      DEFAULT_PLUGIN_SETTINGS.externalMapProvider,
    ),
    zoom: z
      .number()
      .min(MAP_ZOOM.min)
      .max(MAP_ZOOM.max)
      .catch(DEFAULT_PLUGIN_SETTINGS.zoom),
  })
  .catch(DEFAULT_PLUGIN_SETTINGS);

export type PluginSettings = z.infer<typeof pluginSettingsSchema>;
export type ThemePreference = PluginSettings["theme"];
export type MapStylePreference = PluginSettings["mapStyle"];

export const PLUGIN_SETTINGS_STORAGE_KEY = "eagle-plugin-mini-map:settings:v1";

export function readPluginSettings(
  storage?: Pick<Storage, "getItem">,
): PluginSettings {
  try {
    const serialized = (storage ?? globalThis.localStorage).getItem(
      PLUGIN_SETTINGS_STORAGE_KEY,
    );
    if (serialized === null) return { ...DEFAULT_PLUGIN_SETTINGS };

    const stored: unknown = JSON.parse(serialized);
    return { ...pluginSettingsSchema.parse(stored) };
  } catch {
    return { ...DEFAULT_PLUGIN_SETTINGS };
  }
}

export function writePluginSettings(
  settings: Readonly<PluginSettings>,
  storage?: Pick<Storage, "setItem">,
): void {
  try {
    (storage ?? globalThis.localStorage).setItem(
      PLUGIN_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch (error: unknown) {
    console.warn("Failed to persist plugin settings", error);
  }
}
