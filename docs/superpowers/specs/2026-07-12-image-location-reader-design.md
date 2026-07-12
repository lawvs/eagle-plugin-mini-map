# Image Location Reader Refactor Design

Date: 2026-07-12
Branch: refactor/image-location-reader
Status: ready for written-spec review

## Context

The current selection flow mixes three concerns in `useEagleSelection`:

- Eagle selection access.
- Binary file fetching from `item.fileURL`.
- EXIF GPS parsing and UI load state updates.

The current EXIF parser in `src/lib/location.ts` also uses a shallow chain:

- `ArrayBuffer` to binary string.
- `piexif-ts` load/dump.
- `Buffer` conversion.
- `exif-reader` parsing.
- local GPS conversion helpers.

That makes the reader harder to test, keeps Node-oriented details in browser code, and spreads state and race handling into the React hook.

## Goals

- Make "read location from a file URL" an independent module.
- Keep the UI text, interactions, loading behavior, and map behavior unchanged.
- Replace the current parser chain with `exifr`, which has been verified in this repo with Vite dev, Chrome headless, and a Vite production build.
- Give React a single discriminated state value instead of parallel `state`, `coordinates`, and `errorMessage` state.
- Make stale async results harmless when selection changes, React StrictMode re-runs effects, or the hook unmounts.
- Add focused tests at the module interfaces.

## Non-Goals

- No visual redesign.
- No new coordinate formatting or validation policy.
- No Eagle API feature expansion beyond current selected-item loading.
- No map rendering changes.
- No persistence, caching, or background indexing.

## Module Design

### `src/lib/image-location-reader.ts`

This is the deep module for reading GPS coordinates from an image resource URL.

Primary interface:

```ts
export interface ReadImageLocationOptions {
  signal?: AbortSignal;
}

export async function readImageLocation(
  sourceUrl: string,
  options?: ReadImageLocationOptions,
): Promise<Coordinates | null>;
```

Behavior:

- Fetches the resource with `cache: "no-store"`.
- Throws on non-OK HTTP responses and fetch/read failures.
- Parses GPS metadata from the fetched `ArrayBuffer`.
- Returns `Coordinates` when latitude and longitude are present.
- Returns `null` for a valid image that has no complete GPS location.
- Preserves altitude when present, including negative altitude if the metadata marks it below sea level.
- Honors `AbortSignal` during the fetch/read stage.

`exifr` usage:

Use `exifr.parse`, not `exifr.gps`, because this app needs altitude. The tested option shape is:

```ts
pick: [
  "GPSLatitude",
  "GPSLatitudeRef",
  "GPSLongitude",
  "GPSLongitudeRef",
  "GPSAltitude",
  "GPSAltitudeRef",
]
```

Do not pick `latitude` and `longitude` directly. They are derived fields in `exifr`; selecting only those fields did not trigger the source GPS fields in the browser verification.

Internal test interface:

The production path exposes `readImageLocation(sourceUrl, options)`. Tests that simulate read failure or abort behavior without global fetch patching use a small module-local factory:

```ts
type BinaryReader = (
  sourceUrl: string,
  options?: ReadImageLocationOptions,
) => Promise<ArrayBuffer>;

export function createImageLocationReader(
  readBinary: BinaryReader,
): typeof readImageLocation;
```

The app imports only `readImageLocation`.

### `src/lib/selection-location-loader.ts`

This module translates "current Eagle selection" into a domain result. It should know about the minimal selected item shape, not the full Eagle `Item`.

Primary app interface:

```ts
export type SelectedImage = Pick<Item, "fileURL">;

export type SelectionLocationResult =
  | { status: "no-selection" }
  | { status: "no-gps" }
  | { status: "ready"; coordinates: Coordinates };

export async function loadSelectionLocation(
  selection: readonly SelectedImage[],
  options?: { signal?: AbortSignal },
): Promise<SelectionLocationResult>;
```

Internal test interface:

```ts
type ReadImageLocation = (
  sourceUrl: string,
  options?: ReadImageLocationOptions,
) => Promise<Coordinates | null>;

export function createSelectionLocationLoader(
  readLocation: ReadImageLocation,
): typeof loadSelectionLocation;
```

The app imports only `loadSelectionLocation`. Tests use `createSelectionLocationLoader` to avoid coupling loader behavior to fetch or EXIF parsing.

Behavior:

- Uses only the first selected item, matching current plugin behavior and `multiSelect: false`.
- Returns `no-selection` when the selection is empty.
- Calls `readImageLocation(item.fileURL, { signal })` for the selected image.
- Converts `null` from the reader into `no-gps`.
- Lets read/parse exceptions propagate to the hook, where they become UI error state.

### `src/hooks/use-eagle-selection.ts`

The hook remains the bridge between Eagle events and React state.

Internal state:

```ts
export type SelectionLocationState =
  | { status: "loading" }
  | { status: "no-selection" }
  | { status: "no-gps" }
  | { status: "ready"; coordinates: Coordinates }
  | { status: "error"; message: string };
```

React behavior:

- Set `loading` before each new selection load, preserving current visible behavior.
- Create an `AbortController` per request.
- Abort the previous request before starting the next one.
- Keep a request generation counter so a completed older request cannot overwrite a newer state.
- On unmount, abort the current request and block future state updates.
- Treat `AbortError` from an obsolete request as silent.
- Log the original unexpected error and expose the same safe message style through UI state.

The returned hook shape can temporarily preserve the existing app contract if that keeps the UI diff small:

```ts
return {
  state: current.status,
  coordinates: current.status === "ready" ? current.coordinates : null,
  errorMessage: current.status === "error" ? current.message : "",
};
```

If the app consumer is updated to consume the discriminated union directly, the rendered text and behavior must stay unchanged.

## Data Flow

```text
Eagle item
  fileURL
    |
    v
selection-location-loader
  selected image URL
    |
    v
image-location-reader
  fetch resource -> ArrayBuffer -> exifr GPS metadata
    |
    v
Coordinates | null
    |
    v
use-eagle-selection
  SelectionLocationState
    |
    v
React UI
```

## Web and Eagle Constraints

- `exifr@7.1.3` provides an ESM browser entry and was verified with this repo's Vite setup.
- Browser verification used `fetch` to load the existing JPG fixture, converted it to `ArrayBuffer`, and parsed it with `exifr.parse`.
- The verified browser result contained latitude, longitude, and altitude.
- Generic browser support for `file:` URLs remains inconsistent. This refactor does not broaden that surface; it preserves the current Eagle behavior of fetching `item.fileURL`.
- The Vite mock path continues to use an HTTP-served fixture URL, so local web development remains supported.

## Error Handling

- Empty selection: `no-selection`.
- Valid image without complete GPS: `no-gps`.
- Fetch non-OK, fetch rejection, malformed metadata parser failure: `error`.
- Obsolete aborted request: no UI transition.
- Latest request abort caused by unmount: no UI transition.
- Unexpected non-Error throw: convert to `"Unexpected error"` for UI.

## Dependency Changes

After migration, remove dependencies that are no longer used:

- `buffer`
- `exif-reader`
- `piexif-ts`

Keep `exifr`.

Remove obsolete exported helpers from `src/lib/location.ts` if no call sites remain:

- `convertDecimalToGps`
- `formatGpsTime`
- `formatGpsCoordinate`

## Testing Strategy

Use TDD for implementation.

Reader tests:

- Existing JPG fixture returns the same latitude, longitude, and altitude.
- GPS-less thumbnail PNG returns `null`.
- Fetch/read failure rejects.
- Abort during fetch rejects with abort behavior and does not parse.

Loader tests:

- Empty selection returns `no-selection`.
- Selected image with GPS returns `ready`.
- Selected image without GPS returns `no-gps`.
- Reader exception propagates.
- The loader needs only `{ fileURL }`, not full Eagle item data.

Hook tests:

- Initial load moves through `loading` into the resolved state.
- Newer request wins over stale older request.
- Abort errors from obsolete requests do not render `error`.
- Unmount prevents state updates after an in-flight request resolves.
- StrictMode-style double effect does not leave duplicate state writes visible to the UI.

Verification commands:

- `pnpm test`
- `pnpm run type-check`
- `pnpm run lint:check`
- `pnpm run build`

## Acceptance Criteria

- The app renders the same user-facing states as before.
- The location reader can be understood and tested without reading the React hook.
- The React hook no longer performs binary file reading or EXIF parsing directly.
- Selection changes cannot be overwritten by stale async results.
- Production build does not require Node `Buffer` polyfills for location parsing.
- The old parser dependencies are removed when unused.
