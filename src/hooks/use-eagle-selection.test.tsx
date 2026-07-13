// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type PropsWithChildren } from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { SelectionLocationResult } from "../lib/selection-location-loader";
import type { Coordinates } from "../types";
import { useEagleSelection } from "./use-eagle-selection";

const mocks = vi.hoisted(() => {
  type MinimalItem = { fileURL: string };
  type MinimalCoordinates = {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  type MinimalResult =
    | { status: "no-selection" }
    | { status: "no-gps" }
    | { status: "ready"; coordinates: MinimalCoordinates };

  const callbacks = {
    create: [] as Array<() => void>,
    run: [] as Array<() => void>,
  };

  return {
    callbacks,
    getSelected: vi.fn<() => Promise<MinimalItem[]>>(),
    loadSelectionLocation:
      vi.fn<
        (
          selection: readonly MinimalItem[],
          options?: { signal?: AbortSignal },
        ) => Promise<MinimalResult>
      >(),
    onPluginCreate: vi.fn<(callback: () => void) => void>((callback) => {
      callbacks.create.push(callback);
    }),
    onPluginRun: vi.fn<(callback: () => void) => void>((callback) => {
      callbacks.run.push(callback);
    }),
  };
});

vi.mock("../eagle/env", () => ({ IN_EAGLE: true }));

vi.mock("../eagle", () => ({
  eagle: {
    item: {
      getSelected: mocks.getSelected,
    },
    onPluginCreate: mocks.onPluginCreate,
    onPluginRun: mocks.onPluginRun,
  },
}));

vi.mock("../lib/selection-location-loader", () => ({
  loadSelectionLocation: mocks.loadSelectionLocation,
}));

const coordinates: Coordinates = {
  latitude: 35.702755186666664,
  longitude: 139.77182481666668,
  altitude: 57.75,
};

const newerCoordinates: Coordinates = {
  latitude: 35.7,
  longitude: 139.77,
  altitude: 42,
};

function selected(fileURL: string) {
  return { fileURL };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function StrictModeWrapper({ children }: PropsWithChildren) {
  return <StrictMode>{children}</StrictMode>;
}

function triggerPluginCreate(): void {
  expect(mocks.callbacks.create.length).toBeGreaterThan(0);
  act(() => {
    mocks.callbacks.create.forEach((callback) => callback());
  });
}

function triggerPluginRun(): void {
  expect(mocks.callbacks.run.length).toBeGreaterThan(0);
  act(() => {
    mocks.callbacks.run.forEach((callback) => callback());
  });
}

beforeEach(() => {
  mocks.getSelected.mockReset();
  mocks.loadSelectionLocation.mockReset();
});

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  triggerPluginCreate();
});

describe("useEagleSelection", () => {
  it("loads the selected image into the ready state", async () => {
    mocks.getSelected.mockResolvedValue([selected("image.jpg")]);
    mocks.loadSelectionLocation.mockResolvedValue({
      status: "ready",
      coordinates,
    });

    const { result } = renderHook(() => useEagleSelection());

    expect(result.current).toEqual({
      state: "loading",
      coordinates: null,
      errorMessage: "",
    });

    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.coordinates).toEqual(coordinates);
    expect(result.current.errorMessage).toBe("");

    const firstCall = mocks.loadSelectionLocation.mock.calls[0];
    expect(firstCall[0]).toEqual([selected("image.jpg")]);
    expect(firstCall[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("registers Eagle selection callbacks once across remounts", () => {
    mocks.getSelected.mockResolvedValue([selected("image.jpg")]);
    mocks.loadSelectionLocation.mockResolvedValue({
      status: "ready",
      coordinates,
    });

    const firstRender = renderHook(() => useEagleSelection(), {
      wrapper: StrictModeWrapper,
    });
    firstRender.unmount();

    const secondRender = renderHook(() => useEagleSelection(), {
      wrapper: StrictModeWrapper,
    });

    expect(mocks.onPluginCreate).toHaveBeenCalledTimes(1);
    expect(mocks.onPluginRun).toHaveBeenCalledTimes(1);

    secondRender.unmount();
  });

  it("ignores an older result after a newer selection request finishes", async () => {
    const firstResult = deferred<SelectionLocationResult>();
    const secondResult = deferred<SelectionLocationResult>();
    mocks.getSelected.mockResolvedValue([selected("image.jpg")]);
    mocks.loadSelectionLocation
      .mockReturnValueOnce(firstResult.promise)
      .mockReturnValueOnce(secondResult.promise);

    const { result } = renderHook(() => useEagleSelection());

    await waitFor(() =>
      expect(mocks.loadSelectionLocation).toHaveBeenCalledTimes(1),
    );

    triggerPluginRun();
    await waitFor(() =>
      expect(mocks.loadSelectionLocation).toHaveBeenCalledTimes(2),
    );

    act(() => {
      secondResult.resolve({ status: "ready", coordinates: newerCoordinates });
    });

    await waitFor(() =>
      expect(result.current.coordinates).toEqual(newerCoordinates),
    );

    act(() => {
      firstResult.resolve({ status: "ready", coordinates });
    });

    expect(result.current.coordinates).toEqual(newerCoordinates);
  });

  it("does not show an error for an obsolete aborted request", async () => {
    const firstResult = deferred<SelectionLocationResult>();
    const secondResult = deferred<SelectionLocationResult>();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.getSelected.mockResolvedValue([selected("image.jpg")]);
    mocks.loadSelectionLocation
      .mockReturnValueOnce(firstResult.promise)
      .mockReturnValueOnce(secondResult.promise);

    const { result } = renderHook(() => useEagleSelection());

    await waitFor(() =>
      expect(mocks.loadSelectionLocation).toHaveBeenCalledTimes(1),
    );

    triggerPluginRun();
    await waitFor(() =>
      expect(mocks.loadSelectionLocation).toHaveBeenCalledTimes(2),
    );

    act(() => {
      firstResult.reject(new DOMException("Aborted", "AbortError"));
      secondResult.resolve({ status: "no-gps" });
    });

    await waitFor(() => expect(result.current.state).toBe("no-gps"));
    expect(result.current.errorMessage).toBe("");
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("reports an AbortError from the active request", async () => {
    const error = new Error("Parser aborted unexpectedly");
    error.name = "AbortError";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mocks.getSelected.mockResolvedValue([selected("image.jpg")]);
    mocks.loadSelectionLocation.mockRejectedValue(error);

    const { result } = renderHook(() => useEagleSelection());

    await waitFor(() => expect(result.current.state).toBe("error"));
    expect(result.current.errorMessage).toBe("Parser aborted unexpectedly");
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to load Eagle selection",
      error,
    );

    consoleError.mockRestore();
  });

  it("aborts an in-flight request on unmount", async () => {
    const pendingResult = deferred<SelectionLocationResult>();
    let requestSignal: AbortSignal | undefined;
    mocks.getSelected.mockResolvedValue([selected("image.jpg")]);
    mocks.loadSelectionLocation.mockImplementation((_selection, options) => {
      requestSignal = options?.signal;
      return pendingResult.promise;
    });

    const { unmount } = renderHook(() => useEagleSelection());

    await waitFor(() =>
      expect(mocks.loadSelectionLocation).toHaveBeenCalledTimes(1),
    );
    expect(requestSignal?.aborted).toBe(false);

    unmount();

    expect(requestSignal?.aborted).toBe(true);

    act(() => {
      pendingResult.resolve({ status: "ready", coordinates });
    });
  });

  it("ignores retained Eagle callbacks after unmount", async () => {
    mocks.getSelected.mockResolvedValue([selected("image.jpg")]);
    mocks.loadSelectionLocation.mockResolvedValue({
      status: "ready",
      coordinates,
    });

    const { unmount } = renderHook(() => useEagleSelection());

    await waitFor(() => expect(mocks.getSelected).toHaveBeenCalledTimes(1));

    unmount();
    mocks.getSelected.mockClear();
    mocks.loadSelectionLocation.mockClear();
    triggerPluginRun();

    expect(mocks.getSelected).not.toHaveBeenCalled();
    expect(mocks.loadSelectionLocation).not.toHaveBeenCalled();
  });
});
