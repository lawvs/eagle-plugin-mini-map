import manifest from "../../public/manifest.json";
import type { Eagle, EagleTheme, Item } from "./types";

const mockItem: Item = {
  id: "mock-item",
  name: "Test Image",
  ext: "jpg",
  width: 3681,
  height: 5522,
  url: "https://afilmory.waterwater.moe/originals/MJPOVV1T1VUP5.jpg",
  isDeleted: false,
  annotation: "Sky tree",
  tags: ["travel"],
  folders: [],
  palettes: [],
  size: 2_400_000,
  star: 4,
  importedAt: Date.now(),
  modifiedAt: Date.now(),
  noThumbnail: false,
  noPreview: false,
  filePath: "/originals/MJPOVV1T1VUP5.jpg",
  fileURL: "https://afilmory.waterwater.moe/originals/MJPOVV1T1VUP5.jpg",
  thumbnailPath: "/originals/MJPOVV1T1VUP5.jpg",
  thumbnailURL: "https://afilmory.waterwater.moe/originals/MJPOVV1T1VUP5.jpg",
  metadataFilePath: "",
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
