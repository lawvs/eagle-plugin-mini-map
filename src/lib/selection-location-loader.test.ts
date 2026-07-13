import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Coordinates } from "../types";
import { loadSelectionLocation } from "./selection-location-loader";

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
      loadSelectionLocation(
        [{ fileURL: "first.jpg" }, { fileURL: "second.jpg" }],
        { signal: controller.signal },
      ),
    ).resolves.toEqual({ status: "ready", coordinates });
    expect(mocks.readBinaryFromUrl).toHaveBeenCalledWith("first.jpg", {
      signal: controller.signal,
    });
    expect(mocks.parseImageLocation).toHaveBeenCalledWith(binary);
  });

  it("returns no-gps when the parser returns null", async () => {
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation.mockResolvedValue(null);

    await expect(
      loadSelectionLocation([{ fileURL: "image.jpg" }]),
    ).resolves.toEqual({ status: "no-gps" });
  });

  it("propagates binary read errors", async () => {
    const error = new Error("reader failed");
    mocks.readBinaryFromUrl.mockRejectedValue(error);

    await expect(
      loadSelectionLocation([{ fileURL: "image.jpg" }]),
    ).rejects.toBe(error);
  });

  it("propagates location parse errors", async () => {
    const error = new Error("parser failed");
    mocks.readBinaryFromUrl.mockResolvedValue(new ArrayBuffer(0));
    mocks.parseImageLocation.mockRejectedValue(error);

    await expect(
      loadSelectionLocation([{ fileURL: "image.jpg" }]),
    ).rejects.toBe(error);
  });
});
