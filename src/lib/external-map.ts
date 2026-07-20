import { z } from "zod";
import type { Coordinates } from "../types";

interface ExternalMap {
  label: string;
  url: string;
}

interface ExternalMapProviderDefinition {
  label: string;
  buildUrl: (coordinates: Coordinates) => string;
}

const EXTERNAL_MAP_PROVIDERS = {
  openstreetmap: {
    label: "OpenStreetMap",
    buildUrl: ({ latitude, longitude }) => {
      const url = new URL("https://www.openstreetmap.org/");
      url.searchParams.set("mlat", String(latitude));
      url.searchParams.set("mlon", String(longitude));
      url.searchParams.set("zoom", "16");
      return url.toString();
    },
  },
  google: {
    label: "Google Maps",
    buildUrl: ({ latitude, longitude }) => {
      const url = new URL("https://www.google.com/maps/search/");
      url.searchParams.set("api", "1");
      url.searchParams.set("query", `${latitude},${longitude}`);
      return url.toString();
    },
  },
  apple: {
    label: "Apple Maps",
    buildUrl: ({ latitude, longitude }) => {
      const url = new URL("https://maps.apple.com/");
      url.searchParams.set("ll", `${latitude},${longitude}`);
      url.searchParams.set("z", "16");
      url.searchParams.set("q", "Location");
      return url.toString();
    },
  },
  amap: {
    label: "AMap",
    buildUrl: ({ latitude, longitude }) => {
      const url = new URL("https://uri.amap.com/marker");
      url.searchParams.set("position", `${longitude},${latitude}`);
      url.searchParams.set("name", "Location");
      url.searchParams.set("src", "eagle-plugin-mini-map");
      // Treat the plugin's EXIF GPS coordinates as WGS-84; AMap otherwise
      // defaults to GCJ-02.
      // See: https://developer.amap.com/api/uri-api/gettingstarted
      url.searchParams.set("coordinate", "wgs84");
      url.searchParams.set("callnative", "0");
      return url.toString();
    },
  },
  baidu: {
    label: "Baidu Maps",
    buildUrl: ({ latitude, longitude }) => {
      const url = new URL("https://api.map.baidu.com/marker");
      url.searchParams.set("location", `${latitude},${longitude}`);
      url.searchParams.set("title", "Location");
      url.searchParams.set("content", "Location");
      url.searchParams.set("output", "html");
      // Treat the plugin's EXIF GPS coordinates as WGS-84; Baidu otherwise
      // defaults to BD-09.
      // See: https://lbsyun.baidu.com/faq/api?title=webapi%2Furi%2Fweb
      url.searchParams.set("coord_type", "wgs84");
      url.searchParams.set("src", "webapp.eagle.mini-map");
      return url.toString();
    },
  },
} satisfies Record<string, ExternalMapProviderDefinition>;

export type ExternalMapProvider = keyof typeof EXTERNAL_MAP_PROVIDERS;

interface ExternalMapProviderOption {
  readonly value: ExternalMapProvider;
  readonly label: string;
}

export const EXTERNAL_MAP_PROVIDER_OPTIONS: readonly ExternalMapProviderOption[] =
  Object.entries(EXTERNAL_MAP_PROVIDERS).map(([value, { label }]) => ({
    value: value as ExternalMapProvider,
    label,
  }));

export const externalMapProviderSchema = z.enum(
  EXTERNAL_MAP_PROVIDER_OPTIONS.map(({ value }) => value),
);

export function getExternalMap(
  provider: ExternalMapProvider,
  coordinates: Coordinates,
): ExternalMap {
  const definition = EXTERNAL_MAP_PROVIDERS[provider];

  return {
    label: definition.label,
    url: definition.buildUrl(coordinates),
  };
}
