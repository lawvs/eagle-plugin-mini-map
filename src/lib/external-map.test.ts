import { describe, expect, it } from "vitest";
import { getExternalMap, type ExternalMapProvider } from "./external-map";
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
  {
    provider: "amap",
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    expected: {
      label: "AMap",
      url: "https://uri.amap.com/marker?position=151.2093%2C-33.8688&name=Location&src=eagle-plugin-mini-map&coordinate=wgs84&callnative=0",
    },
  },
  {
    provider: "baidu",
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    expected: {
      label: "Baidu Maps",
      url: "https://api.map.baidu.com/marker?location=-33.8688%2C151.2093&title=Location&content=Location&output=html&coord_type=wgs84&src=webapp.eagle.mini-map",
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
