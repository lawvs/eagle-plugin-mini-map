import { useSyncExternalStore } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
import type { EagleTheme } from "../eagle/types";

type ThemeName = "light" | "lightgray" | "gray" | "dark" | "blue" | "purple";

const THEME_SUPPORT: Record<EagleTheme, ThemeName | "auto"> = {
  AUTO: "auto",
  LIGHT: "light",
  LIGHTGRAY: "lightgray",
  GRAY: "gray",
  DARK: "dark",
  BLUE: "blue",
  PURPLE: "purple",
};

function resolveTheme(theme: EagleTheme): ThemeName {
  const themeName = THEME_SUPPORT[theme];
  if (themeName === "auto") {
    return eagle.app.isDarkColors() ? "gray" : "light";
  }
  return themeName;
}

let currentTheme: ThemeName = "light";
const listeners = new Set<() => void>();

function updateTheme(eagleTheme: EagleTheme) {
  const htmlEl = document.querySelector("html");
  if (!htmlEl) return;

  const themeName = resolveTheme(eagleTheme);
  currentTheme = themeName;

  htmlEl.classList.add("no-transition");
  htmlEl.setAttribute("theme", themeName);
  htmlEl.setAttribute("platform", eagle.app.platform);
  htmlEl.classList.remove("no-transition");

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
