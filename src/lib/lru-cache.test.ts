import { describe, expect, it } from "vitest";
import { createLruCache } from "./lru-cache";

describe("createLruCache", () => {
  it("returns cached values", () => {
    const cache = createLruCache<string, number>(2);

    cache.set("first", 1);

    expect(cache.get("first")).toBe(1);
  });

  it("evicts the oldest entry when capacity is exceeded", () => {
    const cache = createLruCache<string, number>(2);

    cache.set("first", 1);
    cache.set("second", 2);
    cache.set("third", 3);

    expect(cache.get("first")).toBeUndefined();
    expect(cache.get("second")).toBe(2);
    expect(cache.get("third")).toBe(3);
  });

  it("refreshes an entry when it is read", () => {
    const cache = createLruCache<string, number>(2);

    cache.set("first", 1);
    cache.set("second", 2);
    cache.get("first");
    cache.set("third", 3);

    expect(cache.get("first")).toBe(1);
    expect(cache.get("second")).toBeUndefined();
    expect(cache.get("third")).toBe(3);
  });

  it("caches null values", () => {
    const cache = createLruCache<string, null>(1);

    cache.set("empty", null);

    expect(cache.get("empty")).toBeNull();
  });
});
