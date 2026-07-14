// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExternalMapLink } from "../components/external-map-link";
import { SettingsMenu } from "../components/settings-menu";
import {
  DEFAULT_PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_STORAGE_KEY,
} from "../lib/plugin-settings";
import {
  PluginSettingsProvider,
  usePluginSettings,
} from "./use-plugin-settings";

vi.mock("./use-is-dark-theme", () => ({
  useIsDarkTheme: () => false,
}));

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

  it("replaces the external map link when its provider changes", () => {
    render(
      <SettingsWrapper>
        <SettingsMenu />
        <ExternalMapLink
          coordinates={{ latitude: 1.3521, longitude: 103.8198 }}
        />
      </SettingsWrapper>,
    );
    const openStreetMapLink = screen.getByRole<HTMLAnchorElement>("link", {
      name: "View on OpenStreetMap",
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Open in" }), {
      target: { value: "google" },
    });

    const googleMapsLink = screen.getByRole<HTMLAnchorElement>("link", {
      name: "View on Google Maps",
    });
    expect(googleMapsLink.href).toContain("google.com/maps");
    expect(googleMapsLink).not.toBe(openStreetMapLink);
  });
});
