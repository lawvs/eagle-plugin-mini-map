import type { Coordinates } from "../types";
import {
  readImageLocation,
  type ReadImageLocationOptions,
} from "./image-location-reader";

export interface SelectedImage {
  fileURL: string;
}

export interface LoadSelectionLocationOptions {
  signal?: AbortSignal;
}

export type SelectionLocationResult =
  | { status: "no-selection" }
  | { status: "no-gps" }
  | { status: "ready"; coordinates: Coordinates };

type ReadImageLocation = (
  sourceUrl: string,
  options?: ReadImageLocationOptions,
) => Promise<Coordinates | null>;

export function createSelectionLocationLoader(readLocation: ReadImageLocation) {
  return async (
    selection: readonly SelectedImage[],
    options?: LoadSelectionLocationOptions,
  ): Promise<SelectionLocationResult> => {
    if (selection.length === 0) {
      return { status: "no-selection" };
    }

    const selectedImage = selection[0];
    const coordinates = await readLocation(selectedImage.fileURL, {
      signal: options?.signal,
    });

    if (!coordinates) {
      return { status: "no-gps" };
    }

    return { status: "ready", coordinates };
  };
}

export const loadSelectionLocation =
  createSelectionLocationLoader(readImageLocation);
