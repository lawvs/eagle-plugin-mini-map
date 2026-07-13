import { afterEach, describe, expect, it, vi } from "vitest";
import { readBinaryFromUrl } from "./binary-reader";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readBinaryFromUrl", () => {
  it("returns the response body and forwards the abort signal", async () => {
    const binary = new ArrayBuffer(4);
    const controller = new AbortController();
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(binary, { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      readBinaryFromUrl("/image.jpg", { signal: controller.signal }),
    ).resolves.toEqual(binary);
    expect(fetchMock).toHaveBeenCalledWith("/image.jpg", {
      cache: "no-store",
      signal: controller.signal,
    });
  });

  it("rejects non-OK responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 404 }))),
    );

    await expect(readBinaryFromUrl("/missing.jpg")).rejects.toThrow(
      "Failed to fetch source (404)",
    );
  });
});
