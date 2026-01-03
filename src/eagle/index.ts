import { mockEagle } from "./mock";
import type { Eagle } from "./types";

type EagleGlobal = typeof globalThis & {
  eagle?: Eagle;
};

const globalReference = globalThis as EagleGlobal;

const eagleInstance: Eagle = globalReference.eagle ?? mockEagle;

export const eagle = eagleInstance;
