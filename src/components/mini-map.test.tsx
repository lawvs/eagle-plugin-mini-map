// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PluginSettings } from "../lib/plugin-settings";
import { MiniMap } from "./mini-map";

interface MockMapProps {
  latitude: number;
  longitude: number;
  zoom: number;
  mapStyle: string;
}

const MAP_STYLE_LIGHT =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const MAP_STYLE_DARK =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const mocks = vi.hoisted(() => {
  const settings: PluginSettings = {
    theme: "eagle",
    mapStyle: "auto",
    externalMapProvider: "openstreetmap",
  };

  return {
    settings,
    isDark: false,
    recordMapProps: vi.fn<(props: MockMapProps) => void>(),
  };
});

vi.mock("../hooks/use-is-dark-theme", () => ({
  useIsDarkTheme: () => mocks.isDark,
}));

vi.mock("../hooks/use-plugin-settings", () => ({
  usePluginSettings: () => ({
    settings: mocks.settings,
    updateSettings: vi.fn(),
  }),
}));

vi.mock("react-map-gl/maplibre", () => ({
  default: (props: MockMapProps) => {
    mocks.recordMapProps(props);
    return <div data-testid="map" data-map-style={props.mapStyle} />;
  },
}));

beforeEach(() => {
  mocks.settings = {
    theme: "eagle",
    mapStyle: "auto",
    externalMapProvider: "openstreetmap",
  };
  mocks.isDark = false;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MiniMap map style", () => {
  it.each([
    ["auto in a light plugin theme", "auto", false, MAP_STYLE_LIGHT],
    ["auto in a dark plugin theme", "auto", true, MAP_STYLE_DARK],
    ["explicit light in a dark plugin theme", "light", true, MAP_STYLE_LIGHT],
    ["explicit dark in a light plugin theme", "dark", false, MAP_STYLE_DARK],
  ] as const)(
    "uses Carto %s",
    (_caseName, preference, isDark, expectedMapStyle) => {
      mocks.settings.mapStyle = preference;
      mocks.isDark = isDark;

      render(<MiniMap latitude={1.3521} longitude={103.8198} />);

      expect(mocks.recordMapProps).toHaveBeenCalled();
      expect(mocks.recordMapProps.mock.lastCall?.[0].mapStyle).toBe(
        expectedMapStyle,
      );
    },
  );

  it("updates style without remounting the map or resetting zoom and coordinates", () => {
    mocks.settings.mapStyle = "dark";
    const { rerender } = render(
      <MiniMap latitude={1.3521} longitude={103.8198} />,
    );
    const mapElement = screen.getByTestId("map");

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    mocks.settings.mapStyle = "light";
    rerender(<MiniMap latitude={1.3521} longitude={103.8198} />);

    expect(screen.getByTestId("map")).toBe(mapElement);
    expect(mocks.recordMapProps.mock.lastCall?.[0]).toMatchObject({
      latitude: 1.3521,
      longitude: 103.8198,
      zoom: 14,
      mapStyle: MAP_STYLE_LIGHT,
    });
  });
});
