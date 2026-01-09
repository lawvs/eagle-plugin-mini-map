export type LoadState =
  | "loading"
  | "ready"
  | "no-selection"
  | "no-gps"
  | "error"
  | "window-too-small";

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}
