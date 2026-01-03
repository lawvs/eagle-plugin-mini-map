import manifest from "../../public/manifest.json";
import type { Eagle, EagleTheme, Item } from "./types";

const mockItem: Item = {
  id: "mock-item",
  name: "Golden Gate Bridge.jpg",
  ext: "jpg",
  width: 4000,
  height: 3000,
  url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
  isDeleted: false,
  annotation: "San Francisco skyline",
  tags: ["travel", "bridge"],
  folders: [],
  palettes: [],
  size: 2_400_000,
  star: 4,
  importedAt: Date.now(),
  modifiedAt: Date.now(),
  noThumbnail: false,
  noPreview: false,
  filePath: "/mock/GoldenGate.jpg",
  fileURL: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
  thumbnailPath: "/mock/GoldenGate.jpg",
  thumbnailURL:
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800",
  metadataFilePath: "/mock/metadata.json",
  save: async () => Promise.resolve(true),
  moveToTrash: async () => Promise.resolve(true),
  replaceFile: async () => Promise.resolve(true),
  refreshThumbnail: async () => Promise.resolve(true),
  setCustomThumbnail: async () => Promise.resolve(true),
  open: async () => Promise.resolve(undefined),
  select: async () => Promise.resolve(true),
};

const themeListeners = new Set<(theme: EagleTheme) => void>();

const emitTheme = (theme: EagleTheme) => {
  themeListeners.forEach((listener) => listener(theme));
};

export const mockEagle: Eagle = {
  app: {
    theme: "LIGHT",
  },
  item: {
    getSelected: async () => Promise.resolve([mockItem]),
  },
  notification: {
    show: async ({ title, body }) => {
      console.info(`[Mock notification] ${title}: ${body}`);
      return Promise.resolve();
    },
  },
  onPluginCreate: (callback) => {
    queueMicrotask(() => {
      callback({ manifest, path: "/mock" });
    });
  },
  onPluginRun: (callback) => {
    queueMicrotask(() => {
      callback();
    });
  },
  onThemeChanged: (callback) => {
    themeListeners.add(callback);
    queueMicrotask(() => callback("LIGHT"));
  },
};

emitTheme("LIGHT");
