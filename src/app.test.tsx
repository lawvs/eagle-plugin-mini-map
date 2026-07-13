// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./app";
import type { PluginSettings } from "./lib/plugin-settings";
import type { Coordinates, LoadState } from "./types";

interface SelectionSnapshot {
  state: LoadState;
  coordinates: Coordinates | null;
  errorMessage: string;
}

const mocks = vi.hoisted(() => {
  const selection: SelectionSnapshot = {
    state: "loading",
    coordinates: null,
    errorMessage: "",
  };
  const settings: PluginSettings = {
    theme: "dark",
    mapStyle: "light",
    externalMapProvider: "apple",
  };

  return {
    selection,
    settings,
    updateSettings: vi.fn(),
  };
});

vi.mock("./eagle/env", () => ({ IN_EAGLE: true }));

vi.mock("./hooks/use-eagle-selection", () => ({
  useEagleSelection: () => mocks.selection,
}));

vi.mock("./hooks/use-plugin-settings", () => ({
  usePluginSettings: () => ({
    settings: mocks.settings,
    updateSettings: mocks.updateSettings,
  }),
}));

vi.mock("./hooks/use-plugin-theme", () => ({
  usePluginTheme: () => "dark",
}));

vi.mock("./components/location-details", () => ({
  LocationDetails: () => <section>Location details</section>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("App settings access", () => {
  it.each<SelectionSnapshot>([
    { state: "loading", coordinates: null, errorMessage: "" },
    { state: "no-selection", coordinates: null, errorMessage: "" },
    { state: "no-gps", coordinates: null, errorMessage: "" },
    { state: "error", coordinates: null, errorMessage: "Failed" },
    {
      state: "ready",
      coordinates: { latitude: 1.3521, longitude: 103.8198 },
      errorMessage: "",
    },
  ])("keeps settings available in the $state state", (selection) => {
    mocks.selection = selection;

    render(<App />);

    const settingsButton = screen.getByLabelText("Settings");
    expect(settingsButton).toBeTruthy();
    fireEvent.click(settingsButton);
    expect(screen.getByRole("combobox", { name: "Theme" })).toBeTruthy();
  });

  it("shows the current settings and exact choices", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Settings"));

    const select = (name: string) =>
      screen.getByRole<HTMLSelectElement>("combobox", { name });
    const optionLabels = (name: string) =>
      Array.from(select(name).options, (option) => option.text);

    expect(select("Theme").value).toBe("dark");
    expect(select("Map style").value).toBe("light");
    expect(select("Open in").value).toBe("apple");

    expect(optionLabels("Theme")).toEqual(["Follow Eagle", "Light", "Dark"]);
    expect(optionLabels("Map style")).toEqual(["Match theme", "Light", "Dark"]);
    expect(optionLabels("Open in")).toEqual([
      "OpenStreetMap",
      "Google Maps",
      "Apple Maps",
    ]);
  });
});
