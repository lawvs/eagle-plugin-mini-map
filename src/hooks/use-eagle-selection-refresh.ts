import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
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

export function useEagleSelectionRefresh(
  handler: CancellableEventHandler,
): void {
  selectionRefresh.useEvent(handler);
}
