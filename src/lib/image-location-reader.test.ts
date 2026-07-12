import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseImageLocation } from "./image-location-reader";

const fixturesDirectory = path.resolve(process.cwd(), "tests/fixtures");
const infoDirectory = path.join(fixturesDirectory, "MJXX6FDDBW3FZ.info");
const imageFixture = path.join(infoDirectory, "DSC02497.jpg");
const thumbnailFixture = path.join(infoDirectory, "DSC02497_thumbnail.png");

async function readArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  const data = await readFile(filePath);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

describe("parseImageLocation", () => {
  it("reads decimal coordinates and altitude from a JPEG", async () => {
    const imageData = await readArrayBuffer(imageFixture);

    await expect(parseImageLocation(imageData)).resolves.toEqual({
      latitude: 35.702755186666664,
      longitude: 139.77182481666668,
      altitude: 57.75,
    });
  });

  it("returns null when an image has no readable GPS metadata", async () => {
    const imageData = await readArrayBuffer(thumbnailFixture);

    await expect(parseImageLocation(imageData)).resolves.toBeNull();
  });
});
