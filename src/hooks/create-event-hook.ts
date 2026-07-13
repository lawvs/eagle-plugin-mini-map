import { useEffect, useEffectEvent } from "react";

export type CancellableEventHandler = (signal: AbortSignal) => Promise<void>;

/** Replays the latest event to new subscribers and aborts superseded handlers. */
export function createEventHook() {
  let hasEmitted = false;
  const listeners = new Set<() => void>();

  function emit(): void {
    hasEmitted = true;
    listeners.forEach((listener) => listener());
  }

  function useEvent(handler: CancellableEventHandler): void {
    const handleEvent = useEffectEvent(handler);

    useEffect(() => {
      let controller: AbortController | undefined;

      const listener = () => {
        controller?.abort();
        controller = new AbortController();
        void handleEvent(controller.signal);
      };

      listeners.add(listener);

      if (hasEmitted) {
        listener();
      }

      return () => {
        listeners.delete(listener);
        controller?.abort();
      };
    }, []);
  }

  return { emit, useEvent };
}
