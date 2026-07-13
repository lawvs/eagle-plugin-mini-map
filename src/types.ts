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

export type SelectionLocationState =
  | { status: "loading" }
  | { status: "ready"; coordinates: Coordinates }
  | { status: "no-selection" }
  | { status: "no-gps" }
  | { status: "error"; message: string };
