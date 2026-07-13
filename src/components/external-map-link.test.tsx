// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExternalMapLink } from "./external-map-link";

const mocks = vi.hoisted(() => ({
  inEagle: true,
  openExternal: vi.fn<(url: string) => Promise<void>>(),
  settings: {
    theme: "eagle",
    mapStyle: "auto",
    externalMapProvider: "openstreetmap",
  },
}));

vi.mock("../eagle", () => ({
  eagle: {
    shell: {
      openExternal: mocks.openExternal,
    },
  },
}));

vi.mock("../eagle/env", () => ({
  get IN_EAGLE() {
    return mocks.inEagle;
  },
}));

vi.mock("../hooks/use-is-dark-theme", () => ({
  useIsDarkTheme: () => false,
}));

vi.mock("../hooks/use-plugin-settings", () => ({
  usePluginSettings: () => ({
    settings: mocks.settings,
    updateSettings: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  mocks.inEagle = true;
  mocks.openExternal.mockReset();
  mocks.settings.externalMapProvider = "openstreetmap";
  vi.restoreAllMocks();
});

describe("ExternalMapLink", () => {
  it("opens the real href with the Eagle shell and prevents browser navigation", () => {
    mocks.settings.externalMapProvider = "google";
    mocks.openExternal.mockResolvedValue(undefined);
    render(
      <ExternalMapLink
        coordinates={{ latitude: 51.5072, longitude: -0.1276 }}
      />,
    );
    const link = screen.getByRole<HTMLAnchorElement>("link", {
      name: "View on Google Maps",
    });

    expect(fireEvent.click(link)).toBe(false);
    expect(mocks.openExternal).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledWith(link.href);
  });

  it("logs an Eagle shell rejection without removing the link", async () => {
    const error = new Error("Shell unavailable");
    mocks.openExternal.mockRejectedValueOnce(error);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(
      <ExternalMapLink
        coordinates={{ latitude: 51.5072, longitude: -0.1276 }}
      />,
    );

    fireEvent.click(
      screen.getByRole("link", { name: "View on OpenStreetMap" }),
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to open external map",
        error,
      );
    });
    expect(
      screen.getByRole("link", { name: "View on OpenStreetMap" }),
    ).toBeTruthy();
  });

  it("keeps ordinary new-tab link behavior outside Eagle", () => {
    mocks.inEagle = false;
    render(
      <ExternalMapLink
        coordinates={{ latitude: 51.5072, longitude: -0.1276 }}
      />,
    );
    const link = screen.getByRole<HTMLAnchorElement>("link", {
      name: "View on OpenStreetMap",
    });

    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noreferrer");
    expect(fireEvent.click(link)).toBe(true);
    expect(mocks.openExternal).not.toHaveBeenCalled();
  });
});
