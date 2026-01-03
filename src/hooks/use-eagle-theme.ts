import { useEffect, useState } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
import type { EagleTheme } from "../eagle/types";

export function useEagleTheme() {
  const [theme, setTheme] = useState<EagleTheme>("LIGHT");

  useEffect(() => {
    let mounted = true;

    const applyTheme = (value: EagleTheme) => {
      if (!mounted) return;
      setTheme(value);
    };

    if (IN_EAGLE) {
      eagle.onPluginCreate(() => {
        applyTheme(eagle.app.theme);
      });
      eagle.onThemeChanged(applyTheme);
    } else {
      applyTheme(eagle.app.theme);
    }

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme.toLowerCase());
  }, [theme]);

  return theme;
}
