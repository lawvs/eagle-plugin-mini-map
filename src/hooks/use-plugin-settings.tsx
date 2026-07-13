import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  readPluginSettings,
  writePluginSettings,
  type PluginSettings,
} from "../lib/plugin-settings";

interface PluginSettingsContextValue {
  settings: PluginSettings;
  updateSettings: (patch: Partial<PluginSettings>) => void;
}

const PluginSettingsContext = createContext<PluginSettingsContextValue | null>(
  null,
);

export function PluginSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<PluginSettings>(() =>
    readPluginSettings(),
  );

  useEffect(() => {
    writePluginSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<PluginSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  return (
    <PluginSettingsContext.Provider value={value}>
      {children}
    </PluginSettingsContext.Provider>
  );
}

// The task's public API intentionally co-locates this hook with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function usePluginSettings(): PluginSettingsContextValue {
  const context = useContext(PluginSettingsContext);
  if (context === null) {
    throw new Error(
      "usePluginSettings must be used within a PluginSettingsProvider",
    );
  }

  return context;
}
