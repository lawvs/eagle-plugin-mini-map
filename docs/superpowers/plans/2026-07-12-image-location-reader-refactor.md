# Image Location Reader Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move image location reading into independent modules, replace the old EXIF parser chain with `exifr`, and make React selection state race-safe without changing user-facing UI behavior.

**Architecture:** `image-location-reader` owns resource reading and GPS parsing behind `readImageLocation(sourceUrl, options)`. `selection-location-loader` converts selected `{ fileURL }` values into domain results. `use-eagle-selection` stays as the Eagle/React bridge and exposes the current app contract while storing a discriminated internal state.

**Tech Stack:** React 19, TypeScript strict mode, Vite 8, Vitest 4, exifr 7.1.3, jsdom + React Testing Library for hook tests.

## Global Constraints

- Keep UI text, interactions, loading behavior, and map behavior unchanged.
- New file and directory names use kebab-case.
- Do not use `any`; prefer precise types or `unknown` narrowing.
- Use `exifr.parse`, not `exifr.gps`, because altitude is required.
- Use raw GPS tags in `exifr.parse`: `GPSLatitude`, `GPSLatitudeRef`, `GPSLongitude`, `GPSLongitudeRef`, `GPSAltitude`, `GPSAltitudeRef`.
- Keep generic browser `file:` behavior unchanged: production still reads `item.fileURL` through fetch.
- The app imports production functions only; tests may use factory functions for local dependency injection.
- Follow TDD: write the failing test, verify red, implement, verify green.

---

## File Structure

- Create `src/lib/image-location-reader.ts`: deep module for URL/binary reading and EXIF GPS parsing.
- Create `src/lib/image-location-reader.test.ts`: reader tests using fixtures and injected binary readers.
- Create `src/lib/selection-location-loader.ts`: selected-image-to-location-result module.
- Create `src/lib/selection-location-loader.test.ts`: loader tests with injected reader.
- Modify `src/hooks/use-eagle-selection.ts`: remove binary/EXIF work, add abort and generation guards.
- Create `src/hooks/use-eagle-selection.test.tsx`: jsdom hook tests for loading, stale results, aborts, and unmount.
- Modify `src/types.ts`: add discriminated `SelectionLocationState` while preserving `LoadState` and `Coordinates`.
- Delete `src/lib/location.ts`, `src/lib/location.test.ts`, and `src/lib/__snapshots__/location.test.ts.snap` after migration.
- Modify `package.json` and `pnpm-lock.yaml`: add hook test dependencies, remove old parser dependencies when unused.

---

### Task 1: Image Location Reader

**Files:**
- Create: `src/lib/image-location-reader.ts`
- Create: `src/lib/image-location-reader.test.ts`
- Keep for now: `src/lib/location.ts`

**Interfaces:**
- Produces:

```ts
export interface ReadImageLocationOptions {
  signal?: AbortSignal;
}

export type BinaryReader = (
  sourceUrl: string,
  options?: ReadImageLocationOptions,
) => Promise<ArrayBuffer>;

export function createImageLocationReader(
  readBinary: BinaryReader,
): (sourceUrl: string, options?: ReadImageLocationOptions) => Promise<Coordinates | null>;

export async function readImageLocation(
  sourceUrl: string,
  options?: ReadImageLocationOptions,
): Promise<Coordinates | null>;
```

- Consumes: `Coordinates` from `src/types.ts`.

- [ ] **Step 1: Write the failing reader tests**

Create `src/lib/image-location-reader.test.ts` with tests for GPS extraction, no GPS, read failure, abort propagation, and non-OK fetch:

```ts
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
    const reader = createImageLocationReader(async () => imageData);

    await expect(reader("fixture.jpg")).resolves.toEqual({
      latitude: 35.702755186666664,
      longitude: 139.77182481666668,
      altitude: 57.75,
    });
  });

  it("returns null when an image has no readable GPS metadata", async () => {
    const imageData = await readArrayBuffer(thumbnailFixture);
    const reader = createImageLocationReader(async () => imageData);

    await expect(reader("thumbnail.png")).resolves.toBeNull();
  });

  it("rejects read failures", async () => {
    const error = new Error("cannot read source");
    const reader = createImageLocationReader(async () => {
      throw error;
    });

    await expect(reader("broken.jpg")).rejects.toBe(error);
  });

  it("passes the abort signal to the binary reader", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("Aborted", "AbortError");
    const reader = createImageLocationReader(async (_sourceUrl, options) => {
      expect(options?.signal).toBe(controller.signal);
      throw abortError;
    });

    controller.abort();

    await expect(
      reader("slow.jpg", { signal: controller.signal }),
    ).rejects.toBe(abortError);
  });

  it("rejects non-OK fetch responses in the production reader", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 404 }));

    try {
      await expect(readImageLocation("/missing.jpg")).rejects.toThrow(
        "Failed to fetch source (404)",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
```

- [ ] **Step 2: Verify reader tests fail**

Run: `pnpm exec vitest run src/lib/image-location-reader.test.ts`

Expected: FAIL because `./image-location-reader` does not exist.

- [ ] **Step 3: Implement reader**

Create `src/lib/image-location-reader.ts` with `exifr.parse`, raw GPS tag picking, `unknown` narrowing, fetch `cache: "no-store"`, abort signal forwarding, and `"Unknown file format"` mapped to `null` for unsupported/no-metadata image inputs.

- [ ] **Step 4: Verify reader tests pass**

Run: `pnpm exec vitest run src/lib/image-location-reader.test.ts`

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit task**

Run:

```bash
git add src/lib/image-location-reader.ts src/lib/image-location-reader.test.ts
git commit -m "feat: add image location reader"
```

---

### Task 2: Selection Location Loader

**Files:**
- Create: `src/lib/selection-location-loader.ts`
- Create: `src/lib/selection-location-loader.test.ts`

**Interfaces:**
- Consumes:

```ts
readImageLocation(
  sourceUrl: string,
  options?: ReadImageLocationOptions,
): Promise<Coordinates | null>;
```

- Produces:

```ts
export interface SelectedImage {
  fileURL: string;
}

export type SelectionLocationResult =
  | { status: "no-selection" }
  | { status: "no-gps" }
  | { status: "ready"; coordinates: Coordinates };

export function createSelectionLocationLoader(
  readLocation: ReadImageLocation,
): (
  selection: readonly SelectedImage[],
  options?: LoadSelectionLocationOptions,
) => Promise<SelectionLocationResult>;

export async function loadSelectionLocation(
  selection: readonly SelectedImage[],
  options?: LoadSelectionLocationOptions,
): Promise<SelectionLocationResult>;
```

- [ ] **Step 1: Write the failing loader tests**

Create `src/lib/selection-location-loader.test.ts`:

```ts
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
    const loader = createSelectionLocationLoader(async () => {
      throw new Error("reader should not be called");
    });

    await expect(loader([])).resolves.toEqual({ status: "no-selection" });
  });

  it("loads the first selected file URL", async () => {
    const controller = new AbortController();
    const calls: Array<{ sourceUrl: string; signal?: AbortSignal }> = [];
    const loader = createSelectionLocationLoader(async (sourceUrl, options) => {
      calls.push({ sourceUrl, signal: options?.signal });
      return coordinates;
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
    const loader = createSelectionLocationLoader(async () => null);

    await expect(loader([{ fileURL: "image.jpg" }])).resolves.toEqual({
      status: "no-gps",
    });
  });

  it("propagates reader errors", async () => {
    const error = new Error("reader failed");
    const loader = createSelectionLocationLoader(async () => {
      throw error;
    });

    await expect(loader([{ fileURL: "image.jpg" }])).rejects.toBe(error);
  });
});
```

- [ ] **Step 2: Verify loader tests fail**

Run: `pnpm exec vitest run src/lib/selection-location-loader.test.ts`

Expected: FAIL because `./selection-location-loader` does not exist.

- [ ] **Step 3: Implement loader**

Create `src/lib/selection-location-loader.ts` with the interfaces above. Use only `selection[0]?.fileURL`, pass through `options?.signal`, convert `null` to `no-gps`, and let exceptions propagate.

- [ ] **Step 4: Verify loader tests pass**

Run: `pnpm exec vitest run src/lib/selection-location-loader.test.ts`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit task**

Run:

```bash
git add src/lib/selection-location-loader.ts src/lib/selection-location-loader.test.ts
git commit -m "feat: add selection location loader"
```

---

### Task 3: React Selection Hook

**Files:**
- Modify: `src/types.ts`
- Modify: `src/hooks/use-eagle-selection.ts`
- Create: `src/hooks/use-eagle-selection.test.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes:

```ts
loadSelectionLocation(
  selection: readonly SelectedImage[],
  options?: LoadSelectionLocationOptions,
): Promise<SelectionLocationResult>;
```

- Produces: existing hook return shape remains:

```ts
{
  state: LoadState;
  coordinates: Coordinates | null;
  errorMessage: string;
}
```

- [ ] **Step 1: Install hook test dependencies**

Run:

```bash
pnpm add -D @testing-library/react jsdom
```

Expected: `package.json` and `pnpm-lock.yaml` update.

- [ ] **Step 2: Write the failing hook tests**

Create `src/hooks/use-eagle-selection.test.tsx` using `// @vitest-environment jsdom`. Mock `../eagle`, `../eagle/env`, and `../lib/selection-location-loader`. Cover initial ready state, stale result ignoring, abort-error silence, and unmount abort.

- [ ] **Step 3: Verify hook tests fail**

Run: `pnpm exec vitest run src/hooks/use-eagle-selection.test.tsx`

Expected: FAIL because the current hook still imports `resolveImageLocation` and does not use `loadSelectionLocation`.

- [ ] **Step 4: Add discriminated state type**

Modify `src/types.ts`:

```ts
export type LoadState =
  | "loading"
  | "ready"
  | "no-selection"
  | "no-gps"
  | "error";

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export type SelectionLocationState =
  | { status: "loading" }
  | { status: "ready"; coordinates: Coordinates }
  | { status: "no-selection" }
  | { status: "no-gps" }
  | { status: "error"; message: string };
```

- [ ] **Step 5: Implement hook**

Modify `src/hooks/use-eagle-selection.ts` to remove `fetchBinary`, `resolveItemLocation`, and `resolveImageLocation`. Use `loadSelectionLocation`, one `SelectionLocationState`, `AbortController`, request generation guards, unmount cleanup, silent obsolete `AbortError`, and the existing returned shape.

- [ ] **Step 6: Verify hook tests pass**

Run: `pnpm exec vitest run src/hooks/use-eagle-selection.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit task**

Run:

```bash
git add package.json pnpm-lock.yaml src/types.ts src/hooks/use-eagle-selection.ts src/hooks/use-eagle-selection.test.tsx
git commit -m "feat: make Eagle selection loading race-safe"
```

---

### Task 4: Remove Old Parser Path and Verify

**Files:**
- Delete: `src/lib/location.ts`
- Delete: `src/lib/location.test.ts`
- Delete: `src/lib/__snapshots__/location.test.ts.snap`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- No consumers may import `src/lib/location.ts`.
- `image-location-reader` is the only EXIF parsing module.

- [ ] **Step 1: Confirm old parser has no call sites**

Run:

```bash
rg -n "resolveImageLocation|convertDecimalToGps|formatGpsTime|formatGpsCoordinate|src/lib/location|\\.\\/location|\\.\\.\\/lib/location" src
```

Expected: no production call sites after Task 3.

- [ ] **Step 2: Delete old parser files**

Remove `src/lib/location.ts`, `src/lib/location.test.ts`, and `src/lib/__snapshots__/location.test.ts.snap`. Remove `src/lib/__snapshots__` if it becomes empty.

- [ ] **Step 3: Remove unused parser dependencies**

Run:

```bash
pnpm remove buffer exif-reader piexif-ts
```

Expected: `package.json` keeps `exifr` and removes `buffer`, `exif-reader`, and `piexif-ts`.

- [ ] **Step 4: Run full verification**

Run:

```bash
pnpm test
pnpm run type-check
pnpm run lint:check
pnpm run build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit task**

Run:

```bash
git add package.json pnpm-lock.yaml src/lib src/hooks src/types.ts
git commit -m "refactor: remove legacy EXIF parser"
```

---

## Plan Self-Review

- Spec coverage: reader module, loader module, hook race handling, dependency removal, and verification commands are covered by Tasks 1-4.
- Placeholder scan: no `TBD`, `TODO`, or "implement later" markers are present.
- Type consistency: `ReadImageLocationOptions`, `SelectionLocationResult`, and `SelectionLocationState` names match across tasks.
