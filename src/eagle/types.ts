import manifest from "../../public/manifest.json";

interface Item {
  // Instance methods
  /** Save all modifications */
  save: () => Promise<boolean>;
  /** Move the file to the trash */
  moveToTrash: () => Promise<boolean>;
  /** Replace the original file with the specified file, automatically refreshing the thumbnail */
  replaceFile: (filePath: string) => Promise<boolean>;
  /** Refreshes the file thumbnail, and updates properties like file size, color analysis, dimensions, etc. */
  refreshThumbnail: () => Promise<boolean>;
  /** Set a custom thumbnail for the file */
  setCustomThumbnail: (thumbnailPath: string) => Promise<boolean>;
  /** Display this file in the full list */
  open: (options?: { window?: boolean }) => Promise<void>;
  /** Select this file (clears current selection and selects only this file) */
  select: () => Promise<boolean>;

  // Instance properties
  /** File ID */
  readonly id: string;
  /** File name */
  name: string;
  /** File extension */
  readonly ext: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Source link */
  url: string;
  /** Is the file in the trash */
  readonly isDeleted: boolean;
  /** File annotation */
  annotation: string;
  /** File tags */
  tags: string[];
  /** Belonging folder IDs */
  folders: string[];
  /** Color palette information */
  readonly palettes: object[];
  /** File size in bytes */
  readonly size: number;
  /** Rating information, 0 ~ 5 */
  star: number;
  /** Time the file was added (timestamp) */
  readonly importedAt: number;
  /** Last modified time (timestamp) */
  readonly modifiedAt: number;
  /** The file doesn't have a thumbnail */
  readonly noThumbnail: boolean;
  /** The file is not supported for double-click preview */
  readonly noPreview: boolean;
  /** File path */
  readonly filePath: string;
  /** File URL (file:///) */
  readonly fileURL: string;
  /** Thumbnail path */
  readonly thumbnailPath: string;
  /** Thumbnail URL (file:///) - use this property if you want to display the file in HTML */
  readonly thumbnailURL: string;
  /** Location of the metadata.json file for this file */
  readonly metadataFilePath: string;
}

type EagleTheme =
  | "AUTO"
  | "LIGHT"
  | "LIGHTGRAY"
  | "GRAY"
  | "DARK"
  | "BLUE"
  | "PURPLE";

type Manifest = typeof manifest;

interface EagleEvent {
  onPluginCreate: (
    callback: (plugin: {
      /**
       * The complete configuration of the plugin's manifest.json.
       */
      manifest: Manifest;
      /**
       * The path where the plugin is located
       */
      path: string;
    }) => void,
  ) => void;
  onPluginRun: (callback: () => void) => void;
  onThemeChanged: (callback: (theme: EagleTheme) => void) => void;
}

interface Eagle extends EagleEvent {
  app: {
    theme: EagleTheme;
    platform: string;
    isDarkColors: () => boolean;
  };
  item: {
    getSelected: () => Promise<Item[]>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  /**
   * Display a pop-up window in the corner of the screen to inform users about operation status.
   */
  notification: {
    show: (options: {
      title: string;
      body: string;
      icon?: string;
      mute?: boolean;
      duration?: number;
    }) => Promise<void>;
  };
}

export type { Eagle, EagleTheme, Item };
