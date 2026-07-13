import { useSyncExternalStore } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
import type { EagleTheme } from "../eagle/types";

export type ThemeName =
  | "light"
  | "lightgray"
  | "gray"
  | "dark"
  | "blue"
  | "purple";

const DEFAULT_LIGHT_THEME: ThemeName = "light";
const DEFAULT_DARK_THEME: ThemeName = "gray";

const THEME_SUPPORT: Record<EagleTheme, ThemeName | "auto"> = {
  AUTO: "auto",
  LIGHT: DEFAULT_LIGHT_THEME,
  LIGHTGRAY: "lightgray",
  GRAY: DEFAULT_DARK_THEME,
  DARK: "dark",
  BLUE: "blue",
  PURPLE: "purple",
};

function resolveTheme(theme: EagleTheme): ThemeName {
  const themeName = THEME_SUPPORT[theme];
  if (themeName === "auto") {
    return eagle.app.isDarkColors() ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  }
  return themeName;
}

// Initialize with actual theme if available, otherwise use default
let currentTheme: ThemeName = IN_EAGLE
  ? resolveTheme(eagle.app.theme)
  : DEFAULT_LIGHT_THEME;
const listeners = new Set<() => void>();

function updateTheme(eagleTheme: EagleTheme) {
  currentTheme = resolveTheme(eagleTheme);

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

// Initialize theme on module load
if (IN_EAGLE) {
  eagle.onPluginCreate(() => {
    updateTheme(eagle.app.theme);
  });
  eagle.onThemeChanged(updateTheme);
} else {
  updateTheme(eagle.app.theme);
}

export function useEagleTheme(): ThemeName {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
