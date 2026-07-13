import { useEffect, useState } from "react";
import { eagle } from "../eagle";
import { loadSelectionLocation } from "../lib/selection-location-loader";
import type { Coordinates, LoadState, SelectionLocationState } from "../types";
import { useEagleSelectionRefresh } from "./use-eagle-selection-refresh";

export function useEagleSelection() {
  const refreshVersion = useEagleSelectionRefresh();
  const [selectionState, setSelectionState] = useState<SelectionLocationState>({
    status: "loading",
  });

  useEffect(() => {
    if (refreshVersion === null) {
      return;
    }

    const controller = new AbortController();

    async function loadSelection(): Promise<void> {
      setSelectionState({ status: "loading" });

      try {
        const selection = await eagle.item.getSelected();

        const result = await loadSelectionLocation(selection, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setSelectionState(result);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load Eagle selection", error);
        setSelectionState({
          status: "error",
          message: error instanceof Error ? error.message : "Unexpected error",
        });
      }
    }

    void loadSelection();

    return () => {
      controller.abort();
    };
  }, [refreshVersion]);

  const state: LoadState = selectionState.status;
  const coordinates: Coordinates | null =
    selectionState.status === "ready" ? selectionState.coordinates : null;
  const errorMessage =
    selectionState.status === "error" ? selectionState.message : "";

  return { state, coordinates, errorMessage };
}
