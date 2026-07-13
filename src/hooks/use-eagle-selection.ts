import { useState } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
import { loadSelectionLocation } from "../lib/selection-location-loader";
import type { Coordinates, LoadState, SelectionLocationState } from "../types";
import {
  createEventHook,
  type CancellableEventHandler,
} from "./create-event-hook";

const selectionRefresh = createEventHook();

if (IN_EAGLE) {
  eagle.onPluginCreate(selectionRefresh.emit);
  eagle.onPluginRun(selectionRefresh.emit);
} else {
  selectionRefresh.emit();
}

function useEagleSelectionRefresh(handler: CancellableEventHandler): void {
  selectionRefresh.useEvent(handler);
}

export function useEagleSelection() {
  const [selectionState, setSelectionState] = useState<SelectionLocationState>({
    status: "loading",
  });

  useEagleSelectionRefresh(async (signal) => {
    setSelectionState({ status: "loading" });

    try {
      const selection = await eagle.item.getSelected();

      const result = await loadSelectionLocation(selection, { signal });

      if (signal.aborted) {
        return;
      }

      setSelectionState(result);
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      console.error("Failed to load Eagle selection", error);
      setSelectionState({
        status: "error",
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  });

  const state: LoadState = selectionState.status;
  const coordinates: Coordinates | null =
    selectionState.status === "ready" ? selectionState.coordinates : null;
  const errorMessage =
    selectionState.status === "error" ? selectionState.message : "";

  return { state, coordinates, errorMessage };
}
