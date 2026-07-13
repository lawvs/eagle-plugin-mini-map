import { useSyncExternalStore } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";

type RefreshVersion = number | null;

const initialRefreshVersion: RefreshVersion = IN_EAGLE ? null : 0;

let refreshVersion = initialRefreshVersion;
// Eagle has no matching unsubscribe API, so lifecycle events are registered once.
let isRegistered = false;

const listeners = new Set<() => void>();

function emitRefresh(): void {
  refreshVersion = (refreshVersion ?? 0) + 1;
  listeners.forEach((listener) => listener());
}

function registerEagleEvents(): void {
  if (!IN_EAGLE || isRegistered) {
    return;
  }

  isRegistered = true;
  eagle.onPluginCreate(emitRefresh);
  eagle.onPluginRun(emitRefresh);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  registerEagleEvents();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): RefreshVersion {
  return refreshVersion;
}

export function useEagleSelectionRefresh(): RefreshVersion {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function resetEagleSelectionRefreshForTest(): void {
  refreshVersion = initialRefreshVersion;
  isRegistered = false;
  listeners.clear();
}
