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
    locationDetailsProps: null as Record<string, unknown> | null,
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
  LocationDetails: (props: Record<string, unknown>) => {
    mocks.locationDetailsProps = props;
    return <section>Location details</section>;
  },
}));

afterEach(() => {
  cleanup();
  mocks.locationDetailsProps = null;
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
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: "Theme" }).value,
    ).toBe("dark");
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", {
        name: "Map style",
      }).value,
    ).toBe("light");
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: "Open in" })
        .value,
    ).toBe("apple");
  });

  it("offers the exact settings choices", () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Settings"));

    const optionLabels = (name: string) =>
      Array.from(
        screen.getByRole<HTMLSelectElement>("combobox", { name }).options,
        (option) => option.text,
      );

    expect(optionLabels("Theme")).toEqual(["Follow Eagle", "Light", "Dark"]);
    expect(optionLabels("Map style")).toEqual(["Match theme", "Light", "Dark"]);
    expect(optionLabels("Open in")).toEqual([
      "OpenStreetMap",
      "Google Maps",
      "Apple Maps",
    ]);
  });

  it("delegates ready coordinates without prebuilding an external map URL", () => {
    const coordinates = { latitude: 1.3521, longitude: 103.8198 };
    mocks.selection = { state: "ready", coordinates, errorMessage: "" };

    render(<App />);

    expect(mocks.locationDetailsProps).toEqual({ coordinates });
  });
});
