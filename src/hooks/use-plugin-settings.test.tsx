// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_STORAGE_KEY,
} from "../lib/plugin-settings";
import {
  PluginSettingsProvider,
  usePluginSettings,
} from "./use-plugin-settings";

function SettingsWrapper({ children }: PropsWithChildren) {
  return <PluginSettingsProvider>{children}</PluginSettingsProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("PluginSettingsProvider", () => {
  it("lazily initializes settings from storage", () => {
    localStorage.setItem(
      PLUGIN_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        theme: "dark",
        mapStyle: "light",
        externalMapProvider: "apple",
      }),
    );
    const getItem = vi.spyOn(Storage.prototype, "getItem");

    expect(getItem).not.toHaveBeenCalled();

    const { result } = renderHook(() => usePluginSettings(), {
      wrapper: SettingsWrapper,
    });

    expect(getItem).toHaveBeenCalledTimes(1);
    expect(result.current.settings).toEqual({
      theme: "dark",
      mapStyle: "light",
      externalMapProvider: "apple",
    });
  });

  it("patches only the requested settings fields", () => {
    const { result } = renderHook(() => usePluginSettings(), {
      wrapper: SettingsWrapper,
    });

    act(() => {
      result.current.updateSettings({ theme: "light" });
    });

    expect(result.current.settings).toEqual({
      ...DEFAULT_PLUGIN_SETTINGS,
      theme: "light",
    });
  });

  it("persists settings updates", () => {
    const { result } = renderHook(() => usePluginSettings(), {
      wrapper: SettingsWrapper,
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    act(() => {
      result.current.updateSettings({
        mapStyle: "dark",
        externalMapProvider: "google",
      });
    });

    expect(setItem).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledWith(
      PLUGIN_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        theme: "eagle",
        mapStyle: "dark",
        externalMapProvider: "google",
      }),
    );
  });

  it("keeps current-session updates when persistence fails", () => {
    const error = new DOMException("Storage full", "QuotaExceededError");
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw error;
      });
    const { result } = renderHook(() => usePluginSettings(), {
      wrapper: SettingsWrapper,
    });
    setItem.mockClear();
    consoleWarn.mockClear();

    act(() => {
      result.current.updateSettings({ externalMapProvider: "apple" });
    });

    expect(result.current.settings).toEqual({
      ...DEFAULT_PLUGIN_SETTINGS,
      externalMapProvider: "apple",
    });
    expect(setItem).toHaveBeenCalledOnce();
    expect(consoleWarn).toHaveBeenCalledWith(
      "Failed to persist plugin settings",
      error,
    );
  });
});
