import exifr from "exifr";
import type { Coordinates } from "../types";

export interface ReadImageLocationOptions {
  signal?: AbortSignal;
}

export type BinaryReader = (
  sourceUrl: string,
  options?: ReadImageLocationOptions,
) => Promise<ArrayBuffer>;

const GPS_TAGS = [
  "GPSLatitude",
  "GPSLatitudeRef",
  "GPSLongitude",
  "GPSLongitudeRef",
  "GPSAltitude",
  "GPSAltitudeRef",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUnknownFileFormat(error: unknown): boolean {
  return error instanceof Error && error.message === "Unknown file format";
}

function isBelowSeaLevel(ref: unknown): boolean {
  if (typeof ref === "number") {
    return ref === 1;
  }

  if (ref instanceof Uint8Array || Array.isArray(ref)) {
    return ref[0] === 1;
  }

  return isRecord(ref) && ref["0"] === 1;
}

function gpsCoordinateToDecimal(
  coordinate: unknown,
  ref: unknown,
): number | null {
  if (!Array.isArray(coordinate) || coordinate.length < 3) {
    return null;
  }

  const coordinateParts = coordinate as readonly unknown[];
  const degrees = coordinateParts[0];
  const minutes = coordinateParts[1];
  const seconds = coordinateParts[2];

  if (
    typeof degrees !== "number" ||
    typeof minutes !== "number" ||
    typeof seconds !== "number" ||
    typeof ref !== "string"
  ) {
    return null;
  }

  const decimal = degrees + minutes / 60 + seconds / 3600;
  return ref === "S" || ref === "W" ? -decimal : decimal;
}

function toCoordinates(metadata: unknown): Coordinates | null {
  if (!isRecord(metadata)) {
    return null;
  }

  const { GPSAltitude, GPSAltitudeRef } = metadata;
  const latitude =
    typeof metadata.latitude === "number"
      ? metadata.latitude
      : gpsCoordinateToDecimal(metadata.GPSLatitude, metadata.GPSLatitudeRef);
  const longitude =
    typeof metadata.longitude === "number"
      ? metadata.longitude
      : gpsCoordinateToDecimal(metadata.GPSLongitude, metadata.GPSLongitudeRef);

  if (latitude === null || longitude === null) {
    return null;
  }

  if (typeof GPSAltitude !== "number") {
    return { latitude, longitude };
  }

  return {
    latitude,
    longitude,
    altitude: isBelowSeaLevel(GPSAltitudeRef) ? -GPSAltitude : GPSAltitude,
  };
}

async function parseImageLocation(
  imageArrayBuffer: ArrayBuffer,
): Promise<Coordinates | null> {
  try {
    const metadata = (await exifr.parse(imageArrayBuffer, {
      pick: [...GPS_TAGS],
    })) as unknown;

    return toCoordinates(metadata);
  } catch (error) {
    if (isUnknownFileFormat(error)) {
      return null;
    }

    throw error;
  }
}

async function readBinaryFromUrl(
  sourceUrl: string,
  options?: ReadImageLocationOptions,
): Promise<ArrayBuffer> {
  const response = await fetch(sourceUrl, {
    cache: "no-store",
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch source (${response.status})`);
  }

  return response.arrayBuffer();
}

export function createImageLocationReader(readBinary: BinaryReader) {
  return async (
    sourceUrl: string,
    options?: ReadImageLocationOptions,
  ): Promise<Coordinates | null> => {
    const imageArrayBuffer = await readBinary(sourceUrl, options);
    return parseImageLocation(imageArrayBuffer);
  };
}

export const readImageLocation = createImageLocationReader(readBinaryFromUrl);
