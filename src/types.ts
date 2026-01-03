type LoadState = "loading" | "ready" | "no-selection" | "no-gps" | "error";

export type { LoadState };

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}
