// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PLUGIN_SETTINGS_STORAGE_KEY,
  type ThemePreference,
} from "../lib/plugin-settings";
import { useEagleTheme } from "./use-eagle-theme";
import {
  PluginSettingsProvider,
  usePluginSettings,
} from "./use-plugin-settings";
import { PluginThemeProvider, usePluginTheme } from "./use-plugin-theme";

const mocks = vi.hoisted(() => {
  type Theme =
    | "AUTO"
    | "LIGHT"
    | "LIGHTGRAY"
    | "GRAY"
    | "DARK"
    | "BLUE"
    | "PURPLE";

  const app = {
    theme: "LIGHT" as Theme,
    platform: "win32",
    isDarkColors: vi.fn(() => false),
  };
  const callbacks = {
    create: [] as Array<() => void>,
    theme: [] as Array<(theme: Theme) => void>,
  };

  return {
    app,
    callbacks,
    emitTheme(theme: Theme) {
      app.theme = theme;
      callbacks.theme.forEach((callback) => callback(theme));
    },
    onPluginCreate: vi.fn<(callback: () => void) => void>((callback) => {
      callbacks.create.push(callback);
    }),
    onThemeChanged: vi.fn<(callback: (theme: Theme) => void) => void>(
      (callback) => {
        callbacks.theme.push(callback);
      },
    ),
  };
});

vi.mock("../eagle/env", () => ({ IN_EAGLE: true }));

vi.mock("../eagle", () => ({
  eagle: {
    app: mocks.app,
    onPluginCreate: mocks.onPluginCreate,
    onThemeChanged: mocks.onThemeChanged,
  },
}));

function ThemeWrapper({ children }: PropsWithChildren) {
  return (
    <PluginSettingsProvider>
      <PluginThemeProvider>{children}</PluginThemeProvider>
    </PluginSettingsProvider>
  );
}

function useThemeAndSettings() {
  const theme = usePluginTheme();
  const { settings, updateSettings } = usePluginSettings();
  return { theme, settings, updateSettings };
}

function storeTheme(theme: ThemePreference): void {
  localStorage.setItem(
    PLUGIN_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      theme,
      mapStyle: "auto",
      externalMapProvider: "openstreetmap",
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  mocks.app.isDarkColors.mockReturnValue(false);
  act(() => mocks.emitTheme("LIGHT"));
  document.documentElement.removeAttribute("theme");
  document.documentElement.removeAttribute("platform");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("PluginThemeProvider", () => {
  it("follows the initial Eagle theme and later Eagle theme events", () => {
    act(() => mocks.emitTheme("LIGHTGRAY"));

    const { result } = renderHook(() => usePluginTheme(), {
      wrapper: ThemeWrapper,
    });

    expect(result.current).toBe("lightgray");

    act(() => mocks.emitTheme("PURPLE"));

    expect(result.current).toBe("purple");
  });

  it("resolves Eagle AUTO from the current color mode", () => {
    mocks.app.isDarkColors.mockReturnValue(true);
    act(() => mocks.emitTheme("AUTO"));

    const { result } = renderHook(() => usePluginTheme(), {
      wrapper: ThemeWrapper,
    });

    expect(result.current).toBe("gray");
  });

  it.each(["light", "dark"] as const)(
    "uses the %s override instead of the Eagle theme",
    (theme) => {
      storeTheme(theme);
      act(() => mocks.emitTheme("BLUE"));

      const { result } = renderHook(() => usePluginTheme(), {
        wrapper: ThemeWrapper,
      });

      expect(result.current).toBe(theme);

      act(() => mocks.emitTheme("PURPLE"));

      expect(result.current).toBe(theme);
    },
  );

  it("changes the effective theme when the preference changes at runtime", () => {
    act(() => mocks.emitTheme("BLUE"));
    const { result } = renderHook(() => useThemeAndSettings(), {
      wrapper: ThemeWrapper,
    });

    expect(result.current.theme).toBe("blue");

    act(() => result.current.updateSettings({ theme: "light" }));
    expect(result.current.theme).toBe("light");

    act(() => result.current.updateSettings({ theme: "dark" }));
    expect(result.current.theme).toBe("dark");

    act(() => result.current.updateSettings({ theme: "eagle" }));
    expect(result.current.theme).toBe("blue");
  });

  it("synchronizes the effective theme and Eagle platform to html", () => {
    storeTheme("dark");

    renderHook(() => usePluginTheme(), { wrapper: ThemeWrapper });

    expect(document.documentElement.getAttribute("theme")).toBe("dark");
    expect(document.documentElement.getAttribute("platform")).toBe("win32");
  });
});

describe("useEagleTheme", () => {
  it("updates only its snapshot and leaves html synchronization to the provider", () => {
    document.documentElement.setAttribute("theme", "sentinel-theme");
    document.documentElement.setAttribute("platform", "sentinel-platform");
    const { result } = renderHook(() => useEagleTheme());

    act(() => mocks.emitTheme("DARK"));

    expect(result.current).toBe("dark");
    expect(document.documentElement.getAttribute("theme")).toBe(
      "sentinel-theme",
    );
    expect(document.documentElement.getAttribute("platform")).toBe(
      "sentinel-platform",
    );
  });
});
