import {
  createContext,
  useContext,
  useLayoutEffect,
  type PropsWithChildren,
} from "react";
import { eagle } from "../eagle";
import { useEagleTheme, type ThemeName } from "./use-eagle-theme";
import { usePluginSettings } from "./use-plugin-settings";

const PluginThemeContext = createContext<ThemeName | null>(null);

export function PluginThemeProvider({ children }: PropsWithChildren) {
  const eagleTheme = useEagleTheme();
  const { settings } = usePluginSettings();
  const theme = settings.theme === "eagle" ? eagleTheme : settings.theme;

  useLayoutEffect(() => {
    if (theme === null) return;

    const htmlElement = document.documentElement;
    htmlElement.classList.add("no-transition");
    htmlElement.setAttribute("theme", theme);
    htmlElement.setAttribute("platform", eagle.app.platform);
    htmlElement.classList.remove("no-transition");
  }, [theme]);

  // `null` means Eagle has not initialized yet. Rendering now would flash the
  // fallback light theme before the real theme is available.
  if (theme === null) return null;

  return (
    <PluginThemeContext.Provider value={theme}>
      {children}
    </PluginThemeContext.Provider>
  );
}

// The task's public API intentionally co-locates this hook with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function usePluginTheme(): ThemeName {
  const theme = useContext(PluginThemeContext);
  if (theme === null) {
    throw new Error("usePluginTheme must be used within a PluginThemeProvider");
  }

  return theme;
}
