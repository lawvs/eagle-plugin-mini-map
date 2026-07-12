import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseImageLocation } from "./image-location-reader";

const mocks = vi.hoisted(() => {
  type ExifrParse = (
    input: ArrayBuffer,
    options: { pick: string[] },
  ) => Promise<unknown>;

  return {
    parse: vi.fn<ExifrParse>(),
  };
});

vi.mock("exifr", () => ({
  default: {
    parse: mocks.parse,
  },
}));

beforeEach(() => {
  mocks.parse.mockReset();
});

describe("parseImageLocation EXIF metadata mapping", () => {
  it("maps exifr coordinates and below-sea-level altitude", async () => {
    mocks.parse.mockResolvedValue({
      latitude: -35.5,
      longitude: -139.25,
      GPSAltitude: 12,
      GPSAltitudeRef: Uint8Array.from([1]),
    });

    await expect(parseImageLocation(new ArrayBuffer(0))).resolves.toEqual({
      latitude: -35.5,
      longitude: -139.25,
      altitude: -12,
    });
  });
});
