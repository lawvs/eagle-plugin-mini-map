import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PLUGIN_SETTINGS,
  PLUGIN_SETTINGS_STORAGE_KEY,
  readPluginSettings,
  writePluginSettings,
  type PluginSettings,
} from "./plugin-settings";

function readableStorage(value: string | null): Pick<Storage, "getItem"> {
  return {
    getItem: vi.fn(() => value),
  };
}

describe("readPluginSettings", () => {
  it("returns immutable defaults when settings are missing", () => {
    const storage = readableStorage(null);

    expect(readPluginSettings(storage)).toEqual(DEFAULT_PLUGIN_SETTINGS);
    expect(Object.isFrozen(DEFAULT_PLUGIN_SETTINGS)).toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith(
      "eagle-plugin-mini-map:settings:v1",
    );
  });

  it("reads valid settings and ignores unknown fields", () => {
    const storage = readableStorage(
      JSON.stringify({
        theme: "dark",
        mapStyle: "light",
        externalMapProvider: "apple",
        unknown: "ignored",
      }),
    );

    expect(readPluginSettings(storage)).toEqual({
      theme: "dark",
      mapStyle: "light",
      externalMapProvider: "apple",
    });
  });

  it("keeps valid fields when other fields are missing or invalid", () => {
    const storage = readableStorage(
      JSON.stringify({
        theme: "light",
        mapStyle: "satellite",
      }),
    );

    expect(readPluginSettings(storage)).toEqual({
      theme: "light",
      mapStyle: "auto",
      externalMapProvider: "openstreetmap",
    });
  });

  it("returns defaults when stored JSON is corrupt", () => {
    const storage = readableStorage("not json");

    expect(readPluginSettings(storage)).toEqual(DEFAULT_PLUGIN_SETTINGS);
  });

  it("returns defaults when reading storage throws", () => {
    const storage: Pick<Storage, "getItem"> = {
      getItem: vi.fn(() => {
        throw new DOMException("Storage unavailable", "SecurityError");
      }),
    };

    expect(readPluginSettings(storage)).toEqual(DEFAULT_PLUGIN_SETTINGS);
  });
});

describe("writePluginSettings", () => {
  it("serializes all settings under the versioned key", () => {
    const storage: Pick<Storage, "setItem"> = {
      setItem: vi.fn(),
    };
    const settings: PluginSettings = {
      theme: "dark",
      mapStyle: "dark",
      externalMapProvider: "google",
    };

    writePluginSettings(settings, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      PLUGIN_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  });

  it("warns instead of throwing when writing storage fails", () => {
    const error = new DOMException("Storage full", "QuotaExceededError");
    const storage: Pick<Storage, "setItem"> = {
      setItem: vi.fn(() => {
        throw error;
      }),
    };
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() =>
      writePluginSettings(DEFAULT_PLUGIN_SETTINGS, storage),
    ).not.toThrow();
    expect(consoleWarn).toHaveBeenCalledWith(
      "Failed to persist plugin settings",
      error,
    );

    consoleWarn.mockRestore();
  });
});
