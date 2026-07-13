import { LocationDetails } from "./components/location-details";
import { SettingsMenu } from "./components/settings-menu";
import { StatusPanel } from "./components/status-panel";
import { IN_EAGLE } from "./eagle/env";
import { useEagleSelection } from "./hooks/use-eagle-selection";
import { usePluginTheme } from "./hooks/use-plugin-theme";

function App() {
  const { state, coordinates, errorMessage } = useEagleSelection();
  const theme = usePluginTheme();
  const isLightTheme = theme === "light" || theme === "lightgray";

  return (
    <div
      className={`relative flex h-full flex-col gap-3 p-3 transition-colors ${
        isLightTheme ? "text-slate-900" : "text-white/90"
      } ${!IN_EAGLE ? "mx-auto max-w-md" : ""}`}
    >
      <SettingsMenu />

      {state === "ready" && coordinates ? (
        <LocationDetails coordinates={coordinates} />
      ) : (
        <StatusPanel state={state} errorMessage={errorMessage} />
      )}
    </div>
  );
}

export default App;
