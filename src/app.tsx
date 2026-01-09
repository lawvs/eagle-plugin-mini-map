import { useMemo } from "react";
import { LocationDetails } from "./components/location-details";
import { StatusPanel } from "./components/status-panel";
import { IN_EAGLE } from "./eagle/env";
import { useEagleSelection } from "./hooks/use-eagle-selection";
import { useWindowSize } from "./hooks/use-window-size";

const MIN_WIDTH_FOR_DETAILS = 350;

function App() {
  const { state, coordinates, errorMessage } = useEagleSelection();
  const { width } = useWindowSize();

  const openMapUrl = useMemo(() => {
    if (!coordinates) {
      return null;
    }

    const { latitude, longitude } = coordinates;
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
  }, [coordinates]);

  return (
    <div
      className={`flex h-full flex-col gap-3 p-3 text-white/90 ${!IN_EAGLE ? "mx-auto max-w-md" : ""}`}
    >
      {state === "ready" && coordinates && width >= MIN_WIDTH_FOR_DETAILS ? (
        <LocationDetails coordinates={coordinates} openMapUrl={openMapUrl} />
      ) : state === "ready" && coordinates && width < MIN_WIDTH_FOR_DETAILS ? (
        <StatusPanel state="window-too-small" errorMessage="" />
      ) : (
        <StatusPanel state={state} errorMessage={errorMessage} />
      )}
    </div>
  );
}

export default App;
