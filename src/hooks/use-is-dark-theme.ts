import { usePluginTheme } from "./use-plugin-theme";

/**
 * Returns true if the effective plugin theme is a dark variant.
 * Light themes: "light", "lightgray"
 * Dark themes: "gray", "dark", "blue", "purple"
 */
export function useIsDarkTheme(): boolean {
  const theme = usePluginTheme();
  return theme !== "light" && theme !== "lightgray";
}
