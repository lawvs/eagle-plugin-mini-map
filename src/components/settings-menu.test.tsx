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
    zoom: 13,
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
  it("opens and dismisses the settings panel without native popover support", () => {
    render(<SettingsMenu />);

    const trigger = screen.getByRole("button", { name: "Settings" });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy();

    fireEvent.pointerDown(document.body);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();
  });

  it.each([
    ["Theme", "light", { theme: "light" }],
    ["Map style", "dark", { mapStyle: "dark" }],
    ["Open in", "google", { externalMapProvider: "google" }],
  ] as const)(
    "updates only the field controlled by %s",
    (accessibleName, value, expectedPatch) => {
      render(<SettingsMenu />);

      fireEvent.click(screen.getByRole("button", { name: "Settings" }));

      fireEvent.change(
        screen.getByRole("combobox", {
          name: accessibleName,
        }),
        { target: { value } },
      );

      expect(mocks.updateSettings).toHaveBeenCalledOnce();
      expect(mocks.updateSettings).toHaveBeenCalledWith(expectedPatch);
    },
  );
});
