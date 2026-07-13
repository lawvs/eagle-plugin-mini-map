import { ArrowRight } from "lucide-react";
import type { MouseEvent } from "react";
import { eagle } from "../eagle";
import { IN_EAGLE } from "../eagle/env";
import { useIsDarkTheme } from "../hooks/use-is-dark-theme";
import { usePluginSettings } from "../hooks/use-plugin-settings";
import { getExternalMap } from "../lib/external-map";
import type { Coordinates } from "../types";

interface ExternalMapLinkProps {
  coordinates: Coordinates;
}

export function ExternalMapLink({ coordinates }: ExternalMapLinkProps) {
  const isDark = useIsDarkTheme();
  const { settings } = usePluginSettings();
  const externalMap = getExternalMap(settings.externalMapProvider, coordinates);

  const openInEagle = async () => {
    try {
      await eagle.shell.openExternal(externalMap.url);
    } catch (error: unknown) {
      console.error("Failed to open external map", error);
    }
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!IN_EAGLE) return;

    event.preventDefault();
    void openInEagle();
  };

  return (
    <a
      href={externalMap.url}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className={`hidden items-center gap-2 text-xs font-semibold transition-colors @[350px]:inline-flex ${
        isDark
          ? "text-sky-300 hover:text-sky-200"
          : "text-sky-600 hover:text-sky-700"
      }`}
    >
      View on {externalMap.label}
      <ArrowRight aria-hidden="true" className="size-3" />
    </a>
  );
}
