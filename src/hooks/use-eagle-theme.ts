import { useSyncExternalStore } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
import type { EagleTheme } from "../eagle/types";

export type ThemeName =
  "light" | "lightgray" | "gray" | "dark" | "blue" | "purple";

const DEFAULT_LIGHT_THEME: ThemeName = "light";
const DEFAULT_DARK_THEME: ThemeName = "gray";

type NormalizedEagleTheme = Uppercase<EagleTheme>;

const THEME_SUPPORT = {
  AUTO: "auto",
  LIGHT: DEFAULT_LIGHT_THEME,
  LIGHTGRAY: "lightgray",
  GRAY: DEFAULT_DARK_THEME,
  DARK: "dark",
  BLUE: "blue",
  PURPLE: "purple",
} satisfies Record<NormalizedEagleTheme, ThemeName | "auto">;

function isSupportedTheme(theme: string): theme is NormalizedEagleTheme {
  return theme in THEME_SUPPORT;
}

/**
 * Eagle's official example normalizes `app.theme` with `toUpperCase()` and
 * resolves `AUTO` with `isDarkColors()`.
 *
 * @see https://github.com/eagle-app/eagle-plugin-examples/blob/939d2b731463a501fc9a459b1317cdea22173e2a/i18n%2Btheme/src/app.js#L1-L13
 */
function resolveTheme(theme: EagleTheme): ThemeName {
  const colorModeTheme = eagle.app.isDarkColors()
    ? DEFAULT_DARK_THEME
    : DEFAULT_LIGHT_THEME;
  const normalizedTheme = theme.toUpperCase();
  const themeName = isSupportedTheme(normalizedTheme)
    ? THEME_SUPPORT[normalizedTheme]
    : "auto";

  return themeName === "auto" ? colorModeTheme : themeName;
}

let currentTheme: ThemeName | null = null;
const listeners = new Set<() => void>();

function refreshTheme() {
  currentTheme = resolveTheme(eagle.app.theme);

  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return currentTheme;
}

/**
 * Initialize when Eagle creates the plugin, then keep the snapshot current as
 * Eagle's theme changes.
 *
 * @see https://developer.eagle.cool/plugin-api/api/event#onplugincreate-callback
 * @see https://developer.eagle.cool/plugin-api/api/event#onthemechanged-callback
 */
if (IN_EAGLE) {
  eagle.onPluginCreate(refreshTheme);
  eagle.onThemeChanged(refreshTheme);
} else {
  refreshTheme();
}

export function useEagleTheme(): ThemeName | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
