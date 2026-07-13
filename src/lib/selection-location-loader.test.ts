import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Coordinates } from "../types";
import {
  loadSelectionLocation,
  type SelectedImage,
} from "./selection-location-loader";

const mocks = vi.hoisted(() => {
  type ParseImageLocation =
    typeof import("./image-location-reader").parseImageLocation;
  type ReadBinaryFromUrl = typeof import("./binary-reader").readBinaryFromUrl;

  return {
    parseImageLocation: vi.fn<ParseImageLocation>(),
    readBinaryFromUrl: vi.fn<ReadBinaryFromUrl>(),
  };
});

vi.mock("./binary-reader", () => ({
  readBinaryFromUrl: mocks.readBinaryFromUrl,
}));

vi.mock("./image-location-reader", () => ({
  parseImageLocation: mocks.parseImageLocation,
}));

const coordinates: Coordinates = {
  latitude: 35.702755186666664,
  longitude: 139.77182481666668,
  altitude: 57.75,
};

const newerCoordinates: Coordinates = {
  latitude: 35.7,
  longitude: 139.77,
  altitude: 42,
};

function selected(
  id: string,
  overrides?: Partial<SelectedImage>,
): SelectedImage {
  return {
    id,
    modifiedAt: 1,
    size: 1_000,
    fileURL: `${id}.jpg`,
    ...overrides,
  };
}

beforeEach(() => {
  mocks.parseImageLocation.mockReset();
  mocks.readBinaryFromUrl.mockReset();
});

describe("loadSelectionLocation", () => {
  it("returns no-selection without reading a file", async () => {
    await expect(loadSelectionLocation([])).resolves.toEqual({
      status: "no-selection",
    });
    expect(mocks.readBinaryFromUrl).not.toHaveBeenCalled();
  });

  it("reads and parses the first selected file", async () => {
    const binary = new ArrayBuffer(4);
    const controller = new AbortController();
    mocks.readBinaryFromUrl.mockResolvedValue(binary);
    mocks.parseImageLocation.mockResolvedValue(coordinates);

    await expect(
      loadSelectionLocation([selected("first"), selected("second")], {
        signal: controller.signal,
      }),
    ).resolves.toEqual({ status: "ready", coordinates });
    expect(mocks.readBinaryFromUrl).toHaveBeenCalledWith("first.jpg", {
      signal: controller.signal,
    });
    expect(mocks.parseImageLocation).toHaveBeenCalledWith(binary);
  });

  it("returns no-gps when the parser returns null", async () => {
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation.mockResolvedValue(null);

    await expect(loadSelectionLocation([selected("no-gps")])).resolves.toEqual({
      status: "no-gps",
    });
  });

  it("returns cached coordinates for the same image revision", async () => {
    const image = selected("cached-ready");
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation.mockResolvedValue(coordinates);

    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "ready",
      coordinates,
    });

    mocks.readBinaryFromUrl.mockClear();
    mocks.parseImageLocation.mockClear();

    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "ready",
      coordinates,
    });
    expect(mocks.readBinaryFromUrl).not.toHaveBeenCalled();
    expect(mocks.parseImageLocation).not.toHaveBeenCalled();
  });

  it("returns cached no-gps results for the same image revision", async () => {
    const image = selected("cached-no-gps");
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation.mockResolvedValue(null);

    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "no-gps",
    });

    mocks.readBinaryFromUrl.mockClear();
    mocks.parseImageLocation.mockClear();

    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "no-gps",
    });
    expect(mocks.readBinaryFromUrl).not.toHaveBeenCalled();
    expect(mocks.parseImageLocation).not.toHaveBeenCalled();
  });

  it.each([
    ["id", (image: SelectedImage) => ({ ...image, id: `${image.id}-next` })],
    ["modifiedAt", (image: SelectedImage) => ({ ...image, modifiedAt: 2 })],
    ["size", (image: SelectedImage) => ({ ...image, size: 2_000 })],
    [
      "fileURL",
      (image: SelectedImage) => ({ ...image, fileURL: "changed.jpg" }),
    ],
  ])("rereads when %s changes", async (_field, changeImage) => {
    const image = selected(`changed-${_field}`);
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation
      .mockResolvedValueOnce(coordinates)
      .mockResolvedValueOnce(newerCoordinates);

    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "ready",
      coordinates,
    });
    await expect(loadSelectionLocation([changeImage(image)])).resolves.toEqual({
      status: "ready",
      coordinates: newerCoordinates,
    });

    expect(mocks.readBinaryFromUrl).toHaveBeenCalledTimes(2);
    expect(mocks.parseImageLocation).toHaveBeenCalledTimes(2);
  });

  it("propagates binary read errors", async () => {
    const error = new Error("reader failed");
    mocks.readBinaryFromUrl.mockRejectedValue(error);

    await expect(loadSelectionLocation([selected("read-error")])).rejects.toBe(
      error,
    );
  });

  it("does not cache binary read errors", async () => {
    const image = selected("retry-read-error");
    const error = new Error("reader failed");
    mocks.readBinaryFromUrl
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(new ArrayBuffer(0));
    mocks.parseImageLocation.mockResolvedValue(coordinates);

    await expect(loadSelectionLocation([image])).rejects.toBe(error);
    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "ready",
      coordinates,
    });

    expect(mocks.readBinaryFromUrl).toHaveBeenCalledTimes(2);
    expect(mocks.parseImageLocation).toHaveBeenCalledTimes(1);
  });

  it("propagates location parse errors", async () => {
    const error = new Error("parser failed");
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation.mockRejectedValue(error);

    await expect(loadSelectionLocation([selected("parse-error")])).rejects.toBe(
      error,
    );
  });

  it("does not cache location parse errors", async () => {
    const image = selected("retry-parse-error");
    const error = new Error("parser failed");
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(coordinates);

    await expect(loadSelectionLocation([image])).rejects.toBe(error);
    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "ready",
      coordinates,
    });

    expect(mocks.readBinaryFromUrl).toHaveBeenCalledTimes(2);
    expect(mocks.parseImageLocation).toHaveBeenCalledTimes(2);
  });

  it("does not cache results when the request signal has been aborted", async () => {
    const image = selected("aborted-result");
    const controller = new AbortController();
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation
      .mockResolvedValueOnce(coordinates)
      .mockResolvedValueOnce(newerCoordinates);

    controller.abort();

    await expect(
      loadSelectionLocation([image], { signal: controller.signal }),
    ).resolves.toEqual({ status: "ready", coordinates });
    await expect(loadSelectionLocation([image])).resolves.toEqual({
      status: "ready",
      coordinates: newerCoordinates,
    });

    expect(mocks.readBinaryFromUrl).toHaveBeenCalledTimes(2);
    expect(mocks.parseImageLocation).toHaveBeenCalledTimes(2);
  });

  it("evicts the oldest cached location after 256 entries", async () => {
    const firstImage = selected("evicted-0");
    const lastImage = selected("evicted-256");
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation.mockResolvedValue(coordinates);

    for (let index = 0; index <= 256; index += 1) {
      await loadSelectionLocation([selected(`evicted-${index}`)]);
    }

    mocks.readBinaryFromUrl.mockClear();
    mocks.parseImageLocation.mockClear();

    await loadSelectionLocation([firstImage]);
    await loadSelectionLocation([lastImage]);

    expect(mocks.readBinaryFromUrl).toHaveBeenCalledTimes(1);
    expect(mocks.parseImageLocation).toHaveBeenCalledTimes(1);
  });
});
