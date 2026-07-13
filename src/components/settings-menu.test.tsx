// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginSettings } from "../lib/plugin-settings";
import { SettingsMenu } from "./settings-menu";

const mocks = vi.hoisted(() => {
  const settings: PluginSettings = {
    theme: "dark",
    mapStyle: "light",
    externalMapProvider: "apple",
  };

  return { settings, updateSettings: vi.fn() };
});

vi.mock("../hooks/use-is-dark-theme", () => ({
  useIsDarkTheme: () => true,
}));

vi.mock("../hooks/use-plugin-settings", () => ({
  usePluginSettings: () => ({
    settings: mocks.settings,
    updateSettings: mocks.updateSettings,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SettingsMenu", () => {
  it.each([
    ["Theme", "light", { theme: "light" }],
    ["Map style", "dark", { mapStyle: "dark" }],
    ["Open in", "google", { externalMapProvider: "google" }],
  ] as const)(
    "updates only the field controlled by %s",
    (accessibleName, value, expectedPatch) => {
      render(<SettingsMenu />);

      fireEvent.change(screen.getByRole("combobox", { name: accessibleName }), {
        target: { value },
      });

      expect(mocks.updateSettings).toHaveBeenCalledOnce();
      expect(mocks.updateSettings).toHaveBeenCalledWith(expectedPatch);
    },
  );
});
