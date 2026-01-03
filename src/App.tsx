import { useMemo } from "react";
import { LocationDetails } from "./components/location-details";
import { StatusPanel } from "./components/status-panel";
import { IN_EAGLE } from "./eagle/env";
import { useEagleSelection } from "./hooks/use-eagle-selection";

function App() {
  const { state, coordinates, errorMessage } = useEagleSelection();

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
      {state === "ready" && coordinates ? (
        <LocationDetails coordinates={coordinates} openMapUrl={openMapUrl} />
      ) : (
        <StatusPanel state={state} errorMessage={errorMessage} />
      )}
    </div>
  );
}

export default App;
