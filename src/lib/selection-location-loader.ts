import type { Coordinates } from "../types";
import { readBinaryFromUrl } from "./binary-reader";
import { parseImageLocation } from "./image-location-reader";
import { createLruCache } from "./lru-cache";

export interface SelectedImage {
  id: string;
  modifiedAt: number;
  size: number;
  fileURL: string;
}

export interface LoadSelectionLocationOptions {
  signal?: AbortSignal;
}

export type SelectionLocationResult =
  | { status: "no-selection" }
  | { status: "no-gps" }
  | { status: "ready"; coordinates: Coordinates };

const LOCATION_CACHE_SIZE = 256;
const locationCache = createLruCache<string, Coordinates | null>(
  LOCATION_CACHE_SIZE,
);

function getImageRevisionKey(image: SelectedImage): string {
  return JSON.stringify([
    image.id,
    image.modifiedAt,
    image.size,
    image.fileURL,
  ]);
}

export async function loadSelectionLocation(
  selection: readonly SelectedImage[],
  options?: LoadSelectionLocationOptions,
): Promise<SelectionLocationResult> {
  if (selection.length === 0) {
    return { status: "no-selection" };
  }

  const image = selection[0];
  const cacheKey = getImageRevisionKey(image);
  let coordinates = locationCache.get(cacheKey);

  if (coordinates === undefined) {
    const binary = await readBinaryFromUrl(image.fileURL, {
      signal: options?.signal,
    });
    coordinates = await parseImageLocation(binary);

    if (!options?.signal?.aborted) {
      locationCache.set(cacheKey, coordinates);
    }
  }

  if (coordinates === null) {
    return { status: "no-gps" };
  }

  return { status: "ready", coordinates };
}
