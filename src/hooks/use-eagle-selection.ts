import { useCallback, useEffect, useRef, useState } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
import { loadSelectionLocation } from "../lib/selection-location-loader";
import type { Coordinates, LoadState, SelectionLocationState } from "../types";

export function useEagleSelection() {
  const [selectionState, setSelectionState] = useState<SelectionLocationState>({
    status: "loading",
  });
  const currentRequest = useRef<{
    id: number;
    controller: AbortController;
  } | null>(null);
  const isMounted = useRef(false);

  const loadSelection = useCallback(async (): Promise<void> => {
    if (!isMounted.current) {
      return;
    }

    currentRequest.current?.controller.abort();

    const requestId = (currentRequest.current?.id ?? 0) + 1;
    const controller = new AbortController();
    currentRequest.current = { id: requestId, controller };

    const isActiveRequest = () =>
      isMounted.current &&
      currentRequest.current?.id === requestId &&
      !controller.signal.aborted;

    setSelectionState({ status: "loading" });

    try {
      const selection = await eagle.item.getSelected();

      if (!isActiveRequest()) {
        return;
      }

      const result = await loadSelectionLocation(selection, {
        signal: controller.signal,
      });

      if (!isActiveRequest()) {
        return;
      }

      setSelectionState(result);
    } catch (error) {
      if (!isActiveRequest()) {
        return;
      }

      console.error("Failed to load Eagle selection", error);
      setSelectionState({
        status: "error",
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const initialize = () => {
      void loadSelection();
    };

    if (IN_EAGLE) {
      eagle.onPluginCreate(initialize);
      eagle.onPluginRun(() => {
        void loadSelection();
      });
    } else {
      initialize();
    }

    return () => {
      isMounted.current = false;
      currentRequest.current?.controller.abort();
      currentRequest.current = null;
    };
  }, [loadSelection]);

  const state: LoadState = selectionState.status;
  const coordinates: Coordinates | null =
    selectionState.status === "ready" ? selectionState.coordinates : null;
  const errorMessage =
    selectionState.status === "error" ? selectionState.message : "";

  return { state, coordinates, errorMessage };
}
