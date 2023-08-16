import { IonMC, Api, Config, Server } from "ionmc";
import AppSystem from "./AppSystem";
import Path from "path";

namespace ServerManager {
  const serverFolder = Path.resolve(AppSystem.getUserDataDirectory(), "servers");
  AppSystem.createDir(serverFolder);

  /**
   * @TODO Implement create server
   */
  export async function create(name: string, version: string, port: number, memory: number) {
    const versionData = await Api.getVersions().then(({ versions }) => versions.find((v) => v.id === version)
    );
    const release = await Api.getRelease(versionData!);
    console.log(release);
  }
}

export default ServerManager;