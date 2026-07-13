// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createEventHook } from "./create-event-hook";

afterEach(() => {
  cleanup();
});

describe("createEventHook", () => {
  it("replays an earlier event and aborts it on unmount", () => {
    const event = createEventHook();
    const signals: AbortSignal[] = [];
    event.emit();

    const { unmount } = renderHook(() =>
      event.useEvent((signal) => {
        signals.push(signal);
        return Promise.resolve();
      }),
    );

    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);

    unmount();

    expect(signals[0].aborted).toBe(true);
  });

  it("aborts the previous handler before running the next event", () => {
    const event = createEventHook();
    const signals: AbortSignal[] = [];

    renderHook(() =>
      event.useEvent((signal) => {
        signals.push(signal);
        return Promise.resolve();
      }),
    );

    act(() => event.emit());
    act(() => event.emit());

    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it("cleans up an earlier mount before replaying the event", () => {
    const event = createEventHook();
    const signals: AbortSignal[] = [];
    event.emit();

    const useEvent = () =>
      event.useEvent((signal) => {
        signals.push(signal);
        return Promise.resolve();
      });

    const firstRender = renderHook(useEvent);
    firstRender.unmount();
    renderHook(useEvent);

    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });
});
