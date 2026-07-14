// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EagleTheme } from "../eagle/types";
import { PluginSettingsProvider } from "./use-plugin-settings";
import { PluginThemeProvider } from "./use-plugin-theme";

const mocks = vi.hoisted(() => {
  const createCallbacks: Array<() => void> = [];

  return {
    app: {
      theme: "DARK",
      platform: "win32",
      isDarkColors: vi.fn(() => true),
    },
    emitPluginCreate() {
      createCallbacks.forEach((callback) => callback());
    },
    onPluginCreate: vi.fn<(callback: () => void) => void>((callback) => {
      createCallbacks.push(callback);
    }),
    onThemeChanged: vi.fn<(callback: (theme: EagleTheme) => void) => void>(),
  };
});

vi.mock("../eagle/env", () => ({ IN_EAGLE: true }));

vi.mock("../eagle", () => ({
  eagle: {
    app: mocks.app,
    onPluginCreate: mocks.onPluginCreate,
    onThemeChanged: mocks.onThemeChanged,
  },
}));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("theme");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("PluginThemeProvider initialization", () => {
  it("waits for the Eagle theme before rendering plugin content", () => {
    render(
      <PluginSettingsProvider>
        <PluginThemeProvider>
          <div>Plugin content</div>
        </PluginThemeProvider>
      </PluginSettingsProvider>,
    );

    expect(screen.queryByText("Plugin content")).toBeNull();
    expect(document.documentElement.getAttribute("theme")).toBeNull();

    act(() => mocks.emitPluginCreate());

    expect(screen.queryByText("Plugin content")).not.toBeNull();
    expect(document.documentElement.getAttribute("theme")).toBe("dark");
  });
});
