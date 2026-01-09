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
      className={`@container flex h-full flex-col gap-3 p-3 text-white/90 ${!IN_EAGLE ? "mx-auto max-w-md" : ""}`}
    >
      {state === "ready" && coordinates ? (
        <>
          <div className="@[350px]:hidden">
            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-black/40">
              <div className="min-h-45x flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
                <p className="text-sm font-medium text-white/70">
                  Expand the window to view location details.
                </p>
              </div>
            </section>
          </div>
          <div className="hidden @[350px]:block">
            <LocationDetails
              coordinates={coordinates}
              openMapUrl={openMapUrl}
            />
          </div>
        </>
      ) : (
        <StatusPanel state={state} errorMessage={errorMessage} />
      )}
    </div>
  );
}

export default App;
