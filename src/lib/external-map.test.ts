import { describe, expect, it } from "vitest";
import type { ExternalMapProvider } from "./plugin-settings";
import { getExternalMap } from "./external-map";
import type { Coordinates } from "../types";

interface ExternalMapTestCase {
  provider: ExternalMapProvider;
  coordinates: Coordinates;
  expected: {
    label: string;
    url: string;
  };
}

const testCases: ExternalMapTestCase[] = [
  {
    provider: "openstreetmap",
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    expected: {
      label: "OpenStreetMap",
      url: "https://www.openstreetmap.org/?mlat=-33.8688&mlon=151.2093&zoom=16",
    },
  },
  {
    provider: "google",
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    expected: {
      label: "Google Maps",
      url: "https://www.google.com/maps/search/?api=1&query=-33.8688%2C151.2093",
    },
  },
  {
    provider: "apple",
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    expected: {
      label: "Apple Maps",
      url: "https://maps.apple.com/?ll=-33.8688%2C151.2093&z=16&q=Location",
    },
  },
];

describe("getExternalMap", () => {
  it.each(testCases)(
    "builds the $provider label and URL for $coordinates.latitude, $coordinates.longitude",
    ({ provider, coordinates, expected }) => {
      expect(getExternalMap(provider, coordinates)).toEqual(expected);
    },
  );
});
