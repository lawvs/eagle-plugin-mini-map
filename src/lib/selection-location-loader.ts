import type { Coordinates } from "../types";
import { readBinaryFromUrl } from "./binary-reader";
import { parseImageLocation } from "./image-location-reader";

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

export async function loadSelectionLocation(
  selection: readonly SelectedImage[],
  options?: LoadSelectionLocationOptions,
): Promise<SelectionLocationResult> {
  if (selection.length === 0) {
    return { status: "no-selection" };
  }

  const binary = await readBinaryFromUrl(selection[0].fileURL, {
    signal: options?.signal,
  });
  const coordinates = await parseImageLocation(binary);

  if (!coordinates) {
    return { status: "no-gps" };
  }

  return { status: "ready", coordinates };
}
