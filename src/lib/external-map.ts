import type { ExternalMapProvider } from "./plugin-settings";
import type { Coordinates } from "../types";

interface ExternalMap {
  label: string;
  url: string;
}

export function getExternalMap(
  provider: ExternalMapProvider,
  coordinates: Coordinates,
): ExternalMap {
  const { latitude, longitude } = coordinates;

  switch (provider) {
    case "openstreetmap": {
      const url = new URL("https://www.openstreetmap.org/");
      url.searchParams.set("mlat", String(latitude));
      url.searchParams.set("mlon", String(longitude));
      url.searchParams.set("zoom", "16");
      return { label: "OpenStreetMap", url: url.toString() };
    }
    case "google": {
      const url = new URL("https://www.google.com/maps/search/");
      url.searchParams.set("api", "1");
      url.searchParams.set("query", `${latitude},${longitude}`);
      return { label: "Google Maps", url: url.toString() };
    }
    case "apple": {
      const url = new URL("https://maps.apple.com/");
      url.searchParams.set("ll", `${latitude},${longitude}`);
      url.searchParams.set("z", "16");
      url.searchParams.set("q", "Location");
      return { label: "Apple Maps", url: url.toString() };
    }
  }
}
