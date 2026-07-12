import { describe, expect, it } from "vitest";
import type { Coordinates } from "../types";
import { createSelectionLocationLoader } from "./selection-location-loader";

const coordinates: Coordinates = {
  latitude: 35.702755186666664,
  longitude: 139.77182481666668,
  altitude: 57.75,
};

describe("loadSelectionLocation", () => {
  it("returns no-selection for an empty selection", async () => {
    const loader = createSelectionLocationLoader(() =>
      Promise.reject(new Error("reader should not be called")),
    );

    await expect(loader([])).resolves.toEqual({ status: "no-selection" });
  });

  it("loads the first selected file URL", async () => {
    const controller = new AbortController();
    const calls: Array<{ sourceUrl: string; signal?: AbortSignal }> = [];
    const loader = createSelectionLocationLoader((sourceUrl, options) => {
      calls.push({ sourceUrl, signal: options?.signal });
      return Promise.resolve(coordinates);
    });

    await expect(
      loader([{ fileURL: "first.jpg" }, { fileURL: "second.jpg" }], {
        signal: controller.signal,
      }),
    ).resolves.toEqual({ status: "ready", coordinates });
    expect(calls).toEqual([
      { sourceUrl: "first.jpg", signal: controller.signal },
    ]);
  });

  it("returns no-gps when the reader returns null", async () => {
    const loader = createSelectionLocationLoader(() => Promise.resolve(null));

    await expect(loader([{ fileURL: "image.jpg" }])).resolves.toEqual({
      status: "no-gps",
    });
  });

  it("propagates reader errors", async () => {
    const error = new Error("reader failed");
    const loader = createSelectionLocationLoader(() => Promise.reject(error));

    await expect(loader([{ fileURL: "image.jpg" }])).rejects.toBe(error);
  });
});
