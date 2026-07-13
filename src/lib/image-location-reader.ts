import exifr from "exifr";
import type { Coordinates } from "../types";

interface ExifLocationMetadata {
  latitude?: number;
  longitude?: number;
  GPSAltitude?: number;
  GPSAltitudeRef?: Uint8Array;
}

const GPS_TAGS = [
  "GPSLatitude",
  "GPSLatitudeRef",
  "GPSLongitude",
  "GPSLongitudeRef",
  "GPSAltitude",
  "GPSAltitudeRef",
] as const;

function toCoordinates(metadata?: ExifLocationMetadata): Coordinates | null {
  if (metadata?.latitude === undefined || metadata.longitude === undefined) {
    return null;
  }

  if (metadata.GPSAltitude === undefined) {
    return {
      latitude: metadata.latitude,
      longitude: metadata.longitude,
    };
  }

  return {
    latitude: metadata.latitude,
    longitude: metadata.longitude,
    altitude:
      metadata.GPSAltitudeRef?.[0] === 1
        ? -metadata.GPSAltitude
        : metadata.GPSAltitude,
  };
}

export async function parseImageLocation(
  imageArrayBuffer: ArrayBuffer,
): Promise<Coordinates | null> {
  try {
    const metadata = (await exifr.parse(imageArrayBuffer, {
      pick: [...GPS_TAGS],
    })) as ExifLocationMetadata | undefined;

    return toCoordinates(metadata);
  } catch (error) {
    if (error instanceof Error && error.message === "Unknown file format") {
      return null;
    }

    throw error;
  }
}
