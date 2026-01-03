import { useCallback, useEffect, useMemo, useState } from "react";
import { LocationDetails } from "./components/location-details";
import { StatusPanel } from "./components/status-panel";
import { eagle } from "./eagle";
import { IN_EAGLE } from "./eagle/env";
import type { Item } from "./eagle/types";
import { useEagleTheme } from "./hooks/use-eagle-theme";
import { resolveImageLocation } from "./lib/location";
import type { Coordinates, LoadState } from "./types";

async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch source (${response.status})`);
  }

  return response.arrayBuffer();
}

const resolveItemLocation = async (item: Item): Promise<Coordinates | null> => {
  const filePath = item.fileURL;
  const buffer = await fetchBinary(filePath);
  return resolveImageLocation(buffer);
};

function App() {
  const theme = useEagleTheme();
  const [state, setState] = useState<LoadState>("loading");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSelection = useCallback(async (): Promise<void> => {
    setState("loading");
    setErrorMessage("");

    try {
      const selection = await eagle.item.getSelected();
      const item = selection.length > 0 ? selection[0] : undefined;

      if (!item) {
        setCoordinates(null);
        setState("no-selection");
        return;
      }

      const location = await resolveItemLocation(item);

      if (!location) {
        setCoordinates(null);
        setState("no-gps");
        return;
      }

      setCoordinates(location);
      setState("ready");
    } catch (error) {
      console.error("Failed to load Eagle selection", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Unexpected error",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
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
  }, [loadSelection]);

  const openMapUrl = useMemo(() => {
    if (!coordinates) {
      return null;
    }

    const { latitude, longitude } = coordinates;
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
  }, [coordinates]);

  return (
    <div className="flex h-full flex-col gap-3 p-3 text-white/90">
      {state === "ready" && coordinates ? (
        <LocationDetails coordinates={coordinates} openMapUrl={openMapUrl} />
      ) : (
        <StatusPanel state={state} errorMessage={errorMessage} />
      )}
    </div>
  );
}

export default App;
