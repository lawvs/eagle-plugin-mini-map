import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createImageLocationReader,
  readImageLocation,
} from "./image-location-reader";

const fixturesDirectory = path.resolve(process.cwd(), "tests/fixtures");
const infoDirectory = path.join(fixturesDirectory, "MJXX6FDDBW3FZ.info");
const imageFixture = path.join(infoDirectory, "DSC02497.jpg");
const thumbnailFixture = path.join(infoDirectory, "DSC02497_thumbnail.png");

async function readArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  const data = await readFile(filePath);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

describe("readImageLocation", () => {
  it("reads decimal coordinates and altitude from a JPEG", async () => {
    const imageData = await readArrayBuffer(imageFixture);
    const reader = createImageLocationReader(() => Promise.resolve(imageData));

    await expect(reader("fixture.jpg")).resolves.toEqual({
      latitude: 35.702755186666664,
      longitude: 139.77182481666668,
      altitude: 57.75,
    });
  });

  it("returns null when an image has no readable GPS metadata", async () => {
    const imageData = await readArrayBuffer(thumbnailFixture);
    const reader = createImageLocationReader(() => Promise.resolve(imageData));

    await expect(reader("thumbnail.png")).resolves.toBeNull();
  });

  it("rejects read failures", async () => {
    const error = new Error("cannot read source");
    const reader = createImageLocationReader(() => Promise.reject(error));

    await expect(reader("broken.jpg")).rejects.toBe(error);
  });

  it("passes the abort signal to the binary reader", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("Aborted", "AbortError");
    const reader = createImageLocationReader((_sourceUrl, options) => {
      expect(options?.signal).toBe(controller.signal);
      return Promise.reject(abortError);
    });

    controller.abort();

    await expect(
      reader("slow.jpg", { signal: controller.signal }),
    ).rejects.toBe(abortError);
  });

  it("rejects non-OK fetch responses in the production reader", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 404 })),
    );

    try {
      await expect(readImageLocation("/missing.jpg")).rejects.toThrow(
        "Failed to fetch source (404)",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
