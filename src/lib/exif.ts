import exifr from "exifr";
import { IN_EAGLE } from "../eagle/env";
import type { Item } from "../eagle/types";

interface MetadataPayload {
  exif?: Record<string, unknown>;
  metadata?: {
    exif?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface LocationResult {
  location?: Coordinates;
  exif?: Record<string, unknown>;
}

type GpsTags = Record<string, unknown> & {
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
};

const HTTP_PATTERN = /^https?:\/\//i;
const FILE_URL_PATTERN = /^file:\/\//i;
const WINDOWS_DRIVE_PATTERN = /^[a-z]:/i;

export async function resolveItemLocation(item: Item): Promise<LocationResult> {
  const source = pickImageSource(item);

  if (source) {
    const imageResult = await readLocationFromImage(source);
    if (imageResult?.location || imageResult?.exif) {
      return imageResult;
    }
  }

  if (item.metadataFilePath) {
    const metadataResult = await readLocationFromMetadata(
      item.metadataFilePath,
    );
    if (metadataResult.location || metadataResult.exif) {
      return metadataResult;
    }
  }

  return {};
}

function pickImageSource(item: Item): string | null {
  if (item.fileURL) {
    return normalizeSource(item.fileURL);
  }

  if (item.filePath) {
    return buildFileUrl(item.filePath);
  }

  if (item.url) {
    return item.url;
  }

  if (item.thumbnailURL) {
    return item.thumbnailURL;
  }

  return null;
}

function normalizeSource(value: string): string {
  if (HTTP_PATTERN.test(value) || FILE_URL_PATTERN.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return `file://${encodeURI(value)}`;
  }

  return value;
}

async function readLocationFromImage(
  source: string,
): Promise<LocationResult | null> {
  try {
    const buffer = await fetchBinary(source);
    const gps = (await exifr.gps(buffer)) as GpsTags | null;

    if (!gps) {
      return null;
    }

    const location = extractCoordinatesFromGps(gps);
    return {
      location: location ?? undefined,
      exif: gps,
    };
  } catch (error) {
    console.error("Unable to parse EXIF from image", error);
    return null;
  }
}

async function readLocationFromMetadata(path: string): Promise<LocationResult> {
  const metadata = await readMetadata(path);
  if (!metadata) {
    return {};
  }

  const exifBlock = extractExif(metadata);
  if (!exifBlock) {
    return {};
  }

  const location = extractCoordinates(exifBlock);
  return {
    location: location ?? undefined,
    exif: exifBlock,
  };
}

async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch source (${response.status})`);
  }

  return response.arrayBuffer();
}

function extractCoordinatesFromGps(tags: GpsTags): Coordinates | null {
  const latitude = toNumber(tags.latitude);
  const longitude = toNumber(tags.longitude);

  if (latitude == null || longitude == null) {
    return null;
  }

  const altitude = toNumber(tags.altitude);

  return {
    latitude,
    longitude,
    altitude: altitude ?? undefined,
  };
}

async function readMetadata(path: string): Promise<MetadataPayload | null> {
  const url = buildMetadataUrl(path);

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load metadata (${response.status})`);
    }

    const data = (await response.json()) as MetadataPayload;
    return data;
  } catch (error) {
    console.error("Unable to read metadata", error);
    return null;
  }
}

function buildFileUrl(path: string): string {
  const normalizedPath = path.replace(/\\/g, "/");

  if (FILE_URL_PATTERN.test(normalizedPath)) {
    return normalizedPath;
  }

  if (WINDOWS_DRIVE_PATTERN.test(normalizedPath)) {
    return `file:///${encodeURI(normalizedPath)}`;
  }

  if (normalizedPath.startsWith("/")) {
    return `file://${encodeURI(normalizedPath)}`;
  }

  return `file://${encodeURI(`/${normalizedPath}`)}`;
}

function buildMetadataUrl(path: string): string {
  if (!path) {
    throw new Error("Missing metadataFilePath");
  }

  const normalizedPath = path.replace(/\\/g, "/");

  if (
    HTTP_PATTERN.test(normalizedPath) ||
    FILE_URL_PATTERN.test(normalizedPath)
  ) {
    return normalizedPath;
  }

  if (!IN_EAGLE) {
    return normalizedPath;
  }

  return buildFileUrl(normalizedPath);
}

function extractExif(
  metadata: MetadataPayload,
): Record<string, unknown> | null {
  if (metadata.exif && typeof metadata.exif === "object") {
    return metadata.exif;
  }

  if (metadata.metadata && typeof metadata.metadata === "object") {
    const nested = metadata.metadata.exif;
    if (nested && typeof nested === "object") {
      return nested;
    }
  }

  const candidates = Object.values(metadata).find(
    (value) =>
      value &&
      typeof value === "object" &&
      "exif" in (value as Record<string, unknown>),
  ) as { exif?: Record<string, unknown> } | undefined;

  return candidates?.exif ?? null;
}

function extractCoordinates(exif: Record<string, unknown>): Coordinates | null {
  const fromPair = parseCoordinatesPair(exif.GPSCoordinates);
  if (fromPair) {
    return fromPair;
  }

  const latitude = parseCoordinate(exif.GPSLatitude, exif.GPSLatitudeRef);
  const longitude = parseCoordinate(exif.GPSLongitude, exif.GPSLongitudeRef);

  if (latitude == null || longitude == null) {
    return null;
  }

  const rawAltitude = toNumber(exif.GPSAltitude);
  const altitude =
    rawAltitude == null
      ? undefined
      : applyAltitudeRef(rawAltitude, exif.GPSAltitudeRef);

  return { latitude, longitude, altitude };
}

function parseCoordinatesPair(value: unknown): Coordinates | null {
  if (typeof value === "string") {
    const tokens = value.split(/[.,\s]+/).filter(Boolean);
    if (tokens.length >= 2) {
      const latitude = Number(tokens[0]);
      const longitude = Number(tokens[1]);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
  }

  if (Array.isArray(value) && value.length >= 2) {
    const latitude = Number(value[0]);
    const longitude = Number(value[1]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}

function parseCoordinate(value: unknown, reference: unknown): number | null {
  const decimal = toDecimalDegrees(value);
  if (decimal == null) {
    return null;
  }

  return applyCoordinateRef(decimal, reference);
}

function toDecimalDegrees(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.trim();
    const direct = Number(cleaned);
    if (Number.isFinite(direct)) {
      return direct;
    }

    const matches = cleaned.match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length === 0) {
      return null;
    }

    const degRaw = Number(matches[0]);
    const minRaw = matches.length > 1 ? Number(matches[1]) : undefined;
    const secRaw = matches.length > 2 ? Number(matches[2]) : undefined;
    if (!Number.isFinite(degRaw)) {
      return null;
    }

    const minutes =
      typeof minRaw === "number" && Number.isFinite(minRaw) ? minRaw : 0;
    const seconds =
      typeof secRaw === "number" && Number.isFinite(secRaw) ? secRaw : 0;
    return degRaw + minutes / 60 + seconds / 3600;
  }

  if (Array.isArray(value) && value.length > 0) {
    const degRaw = Number(value[0]);
    const minRaw = value.length > 1 ? Number(value[1]) : undefined;
    const secRaw = value.length > 2 ? Number(value[2]) : undefined;
    if (!Number.isFinite(degRaw)) {
      return null;
    }

    const minutes =
      typeof minRaw === "number" && Number.isFinite(minRaw) ? minRaw : 0;
    const seconds =
      typeof secRaw === "number" && Number.isFinite(secRaw) ? secRaw : 0;
    return degRaw + minutes / 60 + seconds / 3600;
  }

  if (value && typeof value === "object") {
    const maybeObject = value as Record<string, unknown>;
    if ("degrees" in maybeObject) {
      const deg = toNumber(maybeObject.degrees);
      const min = toNumber(maybeObject.minutes) ?? 0;
      const sec = toNumber(maybeObject.seconds) ?? 0;
      if (typeof deg === "number") {
        return deg + min / 60 + sec / 3600;
      }
    }
  }

  return null;
}

function applyCoordinateRef(value: number, reference: unknown): number {
  if (typeof reference === "string") {
    const code = reference.toUpperCase();
    if (code === "S" || code === "W") {
      return -Math.abs(value);
    }
  }

  return value;
}

function applyAltitudeRef(value: number, reference: unknown): number {
  if (
    typeof reference === "string" &&
    ["1", "BELOW", "-"].includes(reference.toUpperCase())
  ) {
    return -Math.abs(value);
  }

  return value;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export type { Coordinates, LocationResult };
