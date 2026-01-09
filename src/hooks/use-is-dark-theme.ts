import { useEagleTheme } from "./use-eagle-theme";

/**
 * Returns true if the current Eagle theme is a dark variant.
 * Light themes: "light", "lightgray"
 * Dark themes: "gray", "dark", "blue", "purple"
 */
export function useIsDarkTheme(): boolean {
  const theme = useEagleTheme();
  return theme !== "light" && theme !== "lightgray";
}
