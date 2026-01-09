export type LoadState =
  | "loading"
  | "ready"
  | "no-selection"
  | "no-gps"
  | "error";

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}
