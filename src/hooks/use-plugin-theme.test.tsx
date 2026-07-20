// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EagleTheme } from "../eagle/types";
import {
  PLUGIN_SETTINGS_STORAGE_KEY,
  type ThemePreference,
} from "../lib/plugin-settings";
import {
  PluginSettingsProvider,
  usePluginSettings,
} from "./use-plugin-settings";
import { PluginThemeProvider, usePluginTheme } from "./use-plugin-theme";

type EagleThemeFixture = EagleTheme | "Light";

const mocks = vi.hoisted(() => {
  const eagleState = {
    theme: "LIGHT" as EagleThemeFixture,
  };
  const getTheme = vi.fn(() => eagleState.theme);
  const app = {
    get theme() {
      return getTheme();
    },
    platform: "win32",
    isDarkColors: vi.fn(() => false),
  };
  const callbacks = {
    create: [] as Array<() => void>,
    theme: [] as Array<(theme: EagleThemeFixture) => void>,
  };

  return {
    app,
    getTheme,
    setTheme(theme: EagleThemeFixture) {
      eagleState.theme = theme;
    },
    emitPluginCreate() {
      callbacks.create.forEach((callback) => callback());
    },
    emitTheme(theme: EagleThemeFixture) {
      eagleState.theme = theme;
      callbacks.theme.forEach((callback) => callback(theme));
    },
    onPluginCreate: vi.fn<(callback: () => void) => void>((callback) => {
      callbacks.create.push(callback);
    }),
    onThemeChanged: vi.fn<
      (callback: (theme: EagleThemeFixture) => void) => void
    >((callback) => {
      callbacks.theme.push(callback);
    }),
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
      zoom: 13,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  mocks.app.isDarkColors.mockReturnValue(false);
  act(() => mocks.emitTheme("LIGHT"));
  mocks.getTheme.mockClear();
  document.documentElement.removeAttribute("theme");
  document.documentElement.removeAttribute("platform");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("PluginThemeProvider", () => {
  it("loads the initial Eagle theme when the plugin is created", () => {
    const { result } = renderHook(() => usePluginTheme(), {
      wrapper: ThemeWrapper,
    });

    mocks.setTheme("LIGHTGRAY");
    act(() => mocks.emitPluginCreate());

    expect(result.current).toBe("lightgray");
    expect(mocks.getTheme).toHaveBeenCalledOnce();
  });

  it("follows later Eagle theme events", () => {
    const { result } = renderHook(() => usePluginTheme(), {
      wrapper: ThemeWrapper,
    });
    mocks.getTheme.mockClear();

    act(() => mocks.emitTheme("PURPLE"));

    expect(result.current).toBe("purple");
    expect(mocks.getTheme).toHaveBeenCalledOnce();
  });

  it("resolves Eagle AUTO from the current color mode", () => {
    mocks.app.isDarkColors.mockReturnValue(true);
    const { result } = renderHook(() => usePluginTheme(), {
      wrapper: ThemeWrapper,
    });

    mocks.setTheme("Auto");
    act(() => mocks.emitPluginCreate());

    expect(result.current).toBe("gray");
  });

  it("does not read Eagle state when React subscribes", () => {
    mocks.setTheme("LIGHTGRAY");
    act(() => mocks.emitPluginCreate());
    mocks.getTheme.mockClear();

    renderHook(() => usePluginTheme(), {
      wrapper: ThemeWrapper,
    });

    expect(mocks.getTheme).not.toHaveBeenCalled();
  });

  it("normalizes Eagle theme casing from the startup theme value", () => {
    const { result } = renderHook(() => usePluginTheme(), {
      wrapper: ThemeWrapper,
    });

    mocks.setTheme("Light");
    act(() => mocks.emitPluginCreate());

    expect(result.current).toBe("light");
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
