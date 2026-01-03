import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveImageLocation } from "./location";

const fixturesDirectory = path.resolve(process.cwd(), "tests/fixtures");
const infoDirectory = path.join(fixturesDirectory, "MJXX6FDDBW3FZ.info");
const imageFixture = path.join(infoDirectory, "DSC02497.jpg");

describe("resolveImageLocation", () => {
  it("converts EXIF GPS metadata to decimal coordinates", async () => {
    const imageData = await readFile(imageFixture);
    const location = resolveImageLocation(imageData.buffer);
    expect(location).matchSnapshot();
  });
});
