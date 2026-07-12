import { beforeEach, describe, expect, it, vi } from "vitest";
import { createImageLocationReader } from "./image-location-reader";

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

describe("readImageLocation EXIF metadata mapping", () => {
  it("converts raw GPS tags when derived coordinates are absent", async () => {
    mocks.parse.mockResolvedValue({
      GPSLatitude: [35, 30, 0],
      GPSLatitudeRef: "S",
      GPSLongitude: [139, 15, 0],
      GPSLongitudeRef: "W",
      GPSAltitude: 12,
      GPSAltitudeRef: Uint8Array.from([1]),
    });
    const reader = createImageLocationReader(() =>
      Promise.resolve(new ArrayBuffer(0)),
    );

    await expect(reader("raw-gps.jpg")).resolves.toEqual({
      latitude: -35.5,
      longitude: -139.25,
      altitude: -12,
    });
  });
});
