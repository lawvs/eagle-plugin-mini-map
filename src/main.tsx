import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import { PluginSettingsProvider } from "./hooks/use-plugin-settings";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Failed to find the root element");

createRoot(root).render(
  <StrictMode>
    <PluginSettingsProvider>
      <App />
    </PluginSettingsProvider>
  </StrictMode>,
);
