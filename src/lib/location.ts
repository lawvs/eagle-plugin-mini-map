import { Buffer } from "buffer";
import type { Coordinates } from "../types";
// https://github.com/devongovett/exif-reader
import exifReader from "exif-reader";
// https://github.com/holwech/piexif-ts
import type * as Piexif from "piexif-ts";
// @ts-expect-error - piexif-ts has incorrect package.json exports, importing dist directly
import * as piexifJs from "piexif-ts/dist/piexif.js";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const piexif: typeof Piexif = piexifJs;

// Convert GPS coordinates from EXIF format to decimal degrees
const convertGpsCoordinate = (
  coordinate: number[],
  ref: string,
): number | null => {
  if (coordinate.length < 3) return null;

  const degrees = coordinate[0];
  const minutes = coordinate[1];
  const seconds = coordinate[2];

  let decimal = degrees + minutes / 60 + seconds / 3600;

  // Apply reference direction (S and W are negative)
  if (ref === "S" || ref === "W") {
    decimal = -decimal;
  }

  return decimal;
};

// Convert decimal degrees to EXIF GPS format
export const convertDecimalToGps = (
  decimal: number,
  type: "lat" | "lng",
): { coordinate: number[]; ref: string } => {
  const ref =
    type === "lat" ? (decimal >= 0 ? "N" : "S") : decimal >= 0 ? "E" : "W";
  const absDecimal = Math.abs(decimal);

  const degrees = Math.floor(absDecimal);
  const minutes = Math.floor((absDecimal - degrees) * 60);
  const seconds = ((absDecimal - degrees) * 60 - minutes) * 3600;

  return { coordinate: [degrees, minutes, seconds], ref };
};

// Format GPS time from array to readable string
export const formatGpsTime = (timeArray: number[]): string => {
  if (timeArray.length < 3) return "";

  const hours = Math.floor(timeArray[0]).toString().padStart(2, "0");
  const minutes = Math.floor(timeArray[1]).toString().padStart(2, "0");
  const seconds = Math.floor(timeArray[2]).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

// Format GPS coordinate for display
export const formatGpsCoordinate = (
  coordinate: number[],
  ref: string,
  type: "lat" | "lng",
): string => {
  if (coordinate.length < 3) return "N/A";

  const degrees = Math.floor(coordinate[0]);
  const minutes = Math.floor(coordinate[1]);
  const seconds = coordinate[2].toFixed(2);

  const direction =
    type === "lat" ? (ref === "N" ? "N" : "S") : ref === "E" ? "E" : "W";

  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

const extractExif = (arrayBuffer: ArrayBuffer) => {
  // Convert ArrayBuffer to binary string for piexif.load()
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (const byte of uint8Array) {
    binaryString += String.fromCodePoint(byte);
  }

  const exifObj = piexif.load(binaryString);
  const exifSegmentStr = piexif.dump(exifObj);
  return Buffer.from(exifSegmentStr, "binary");
};

export const resolveImageLocation = (
  imageArrayBuffer: ArrayBuffer,
): Coordinates | null => {
  const exifSegmentBuffer = extractExif(imageArrayBuffer);

  const metadata = exifReader(exifSegmentBuffer);
  const gpsData = metadata.GPSInfo;

  if (!gpsData) {
    return null;
  }

  // Convert coordinates to decimal degrees
  const latitude =
    gpsData.GPSLatitude && gpsData.GPSLatitudeRef
      ? convertGpsCoordinate(gpsData.GPSLatitude, gpsData.GPSLatitudeRef)
      : null;

  const longitude =
    gpsData.GPSLongitude && gpsData.GPSLongitudeRef
      ? convertGpsCoordinate(gpsData.GPSLongitude, gpsData.GPSLongitudeRef)
      : null;
  if (latitude == null || longitude == null) {
    return null;
  }

  const altitude = gpsData.GPSAltitude
    ? gpsData.GPSAltitudeRef === 1
      ? -gpsData.GPSAltitude
      : gpsData.GPSAltitude
    : undefined;

  return {
    latitude,
    longitude,
    altitude,
  };
};
