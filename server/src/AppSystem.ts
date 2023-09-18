import os from "os";
import fs from "fs";
import Path from "path";
import multer from "multer";
import fetch from "cross-fetch";

namespace AppSystem {
  export const friendlyAppName = "IonMC GUI";
  export const appName = "ionmc_gui";
  export const debug = process.env.NODE_ENV === "development";
  let externalIp: Promise<string> | null = null;

  /**
   * Get the external IP of the server.
   */
  export async function getExternalIp() {
    if (externalIp) return (await externalIp).trim();
    // externalIp = fetch("https://myip.wtf/text").then(r => r.text());
    externalIp = fetch("https://api.ipify.org").then(r => r.text());
    console.log("Fetching external IP");
    return (await externalIp).trim();
  }

  setInterval(() => {
    externalIp = null;
  }, 1000 * 60 * 60 * 6); // Hours

  export const platform = os.platform();
  export const isWindows = platform === "win32";
  export const isMac = platform === "darwin";
  export const isLinux = platform === "linux";

  export function createDir(path: string): boolean {
    try {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  export function getHomeDirectory(): string {
    return os.homedir();
  }

  export function getUserDataDirectory(): string {
    const home = getHomeDirectory();
    if (isWindows) {
      return Path.join(home, "AppData", "Roaming", appName);
    } else {
      return Path.join(home, ".icconfig", "userdata", appName);
    }
  }

  /**
   * Gets `main.db` path
   */
  export function getSqliteDatabasePath(): string;
  /**
   * Gets `{dbname}.db` path
   */
  export function getSqliteDatabasePath(dbname: string): string;
  export function getSqliteDatabasePath(dbname?: string): string {
    const main = getUserDataDirectory();
    return Path.join(main, dbname ?? "main.db");
  }

  export function getApplicationDirectory(): string {
    const home = getHomeDirectory();
    if (isWindows) {
      return Path.join(home, "AppData", "Local", appName);
    } else {
      return Path.join(home, ".icconfig", "appdata", appName);
    }
  }

  const appDir = AppSystem.getUserDataDirectory();
  export const folders = {
    uploadFolder: Path.resolve(appDir, "_temp"),
    avatarFolder: Path.resolve(appDir, "avatars"),
    assetFolder: Path.resolve(appDir, "assets"),
  }

  /**
   * Create folders if not exists
   */
  for (const key in folders) {
    if (folders.hasOwnProperty(key)) {
      const folder = folders[key as keyof typeof folders];
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`Created folder: ${folder}`);
      }
    }
  }

  /**
   * Max file size for upload
   */
  export const maxFileSize = (1024 * 1024) * 512; // MB

  /**
   * Multer uploader for express
   */
  export const uploader = multer({
    dest: AppSystem.folders.uploadFolder,
    limits: {
      fileSize: maxFileSize
    },
  });
}

export default AppSystem;