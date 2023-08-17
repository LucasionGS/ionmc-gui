import { IonMC, Api, Config, Server as McServer } from "ionmc";
import AppSystem from "./AppSystem";
import Path from "path";
import { Server } from "./sequelize";
import fsp from "fs/promises";

namespace ServerManager {
  const serverFolder = Path.resolve(AppSystem.getUserDataDirectory(), "servers");
  AppSystem.createDir(serverFolder);

  /**
   * Create a new server
   */
  export async function create(data: {
    name: string,
    version: string,
    /**
     * RAM in MB
     */
    ram: number,
    userId: string
  }, events?: {
    onProgress?: (buffer: Buffer, receivedBytes: number, totalBytes: number) => void,
    onDone?: () => void
  }) {
    return new Promise<Server>(async (resolve, reject) => {
      const { name, version, ram, userId } = data;
      const { onProgress, onDone } = events || {};
      console.log("Getting version data...");
      const versionData = await Api.getVersions().then(({ versions, latest }) => {
        let lookFor = version;
        if (version === "latest") lookFor = latest.release;
        return versions.find(
          (v) => v.id === lookFor
        );
      });
      if (!versionData) return reject(new Error("Version not found"));
      const release = await Api.getRelease(versionData);

      console.log("Creating server...");
      const server = await Server.create({
        name,
        version: versionData.id,
        port: await findFirstAvailablePort(),
        ram,
        userId
      });
      console.log("Downloading server...");
      console.log("Server folder:", serverFolder);
      const dist = Path.resolve(serverFolder, server.id);
      const dl = await Api.downloadServer(release, dist);

      onProgress && dl.on("data", onProgress);
      const onDoneEvent = () => {
        onDone && onDone();
        // Remove listeners
        onProgress && dl.off("data", onProgress);
        resolve(server);
      }
      dl.once("finish", onDoneEvent);

      // Timeout in case of the download taking too long - Assuming it's stuck or something went wrong
      setTimeout(() => {
        reject(new Error("Download timed out"));
      }, 1000 * 60 * 5); // 5 minutes
    });
  }

  /**
   * Find the first available port.
   */
  export async function findFirstAvailablePort(): Promise<number> {
    const min = 25000;
    const max = 35000;
    const total = max - min;
    const servers = await Server.findAll({ attributes: ["port"], order: [["port", "ASC"]] });
    for (let i = 0; i < total; i++) {
      const port = min + i;
      if (servers[i]?.port !== port) return port;
    }
    throw new Error("No available ports");
  }

  /**
   * Get the server data entry from the database based on the Minecraft server object.
   * @param server Minecraft server object
   */
  export async function getServerEntry(server: McServer) {
    const serverEntry = await Server.findOne({ where: { id: server.name } });
    if (!serverEntry) throw new Error("Server not found");
    return serverEntry;
  }

  export function getRunningServerById(id: string) {
    return runningServers.find(s => s.name === id);
  }

  /**
   * Start a server. Always call this method instead of calling the start method directly on the Minecraft server object.
   */
  export async function start(mcserver: McServer) {
    const serverEntry = await getServerEntry(mcserver);
    const eulaPath = Path.resolve(mcserver.directoryPath, "eula.txt");
    if (await fsp.stat(eulaPath).then(() => false).catch(() => true)) { // Accept the EULA automatically
      await fsp.writeFile(eulaPath, "eula=true");
    }
    try {
      const serverPort = mcserver.getProperty("server-port");

      // Ensure the server port is correct and consistent with the database
      if (serverPort !== serverEntry.port) {
        mcserver.setProperty("server-port", serverEntry.port);
      }
    } catch (error) {
      // This will happen if the server.properties file doesn't exist yet
      const serverProperties = Path.resolve(mcserver.directoryPath, "server.properties");
      if (await fsp.stat(serverProperties).then(() => false).catch(() => true)) {
        await fsp.writeFile(serverProperties, "server-port=" + serverEntry.port);
      }
      else {
        // In case of any other error
        console.log("Error while getting server port");
        throw error;
      }
    }

    // Start the server
    mcserver.start();
    runningServers.push(mcserver);
  }

  /**
   * Stop a server.
   */
  export async function stop(mcserver: McServer) {
    try {
      mcserver.stop();
    } catch (error) {
      // IonMC has a bug where it throws an error because it tries to write to the server console after it's already stopped
      // This still stops the server, so we can just ignore the error
    }
    let index: number;
    while ((index = runningServers.indexOf(mcserver)) !== -1) {
      runningServers.splice(index, 1);
    }
    console.log("Server has been stopped");
  }

  /**
   * Is the server running?
   */
  export function isRunning(mcserver: McServer | Server) {
    if (mcserver instanceof Server) {
      return !!runningServers.find(s => s.name === mcserver.id);
    }
    return !!runningServers.find(s => s.name === mcserver.name);
  }

  /**
   * Get the Minecraft server object from the database entry.
   */
  export async function getMCServer(server: Server) {
    const serverPath = Path.resolve(serverFolder, server.id, "server.jar");
    const mcserver = new McServer(serverPath, {
      preventStart: true
    });

    return mcserver;
  }

  /**
   * Updates the server config file. Should be called BEFORE constructing the server object.
   * @param server Server entry
   * @param config New configuration
   */
  export async function updateServerConfig(server: Server, config: Config.IonConfig["config"]) {
    const serverPath = Path.resolve(serverFolder, server.id);
    const serverConfigPath = Path.resolve(serverPath, ".ion", "serverConfig.json");
    await fsp.mkdir(Path.dirname(serverConfigPath), { recursive: true });
    const serverConfig = Config.load(serverPath);
    serverConfig.serverConfig = config;
    await fsp.writeFile(serverConfigPath, JSON.stringify(serverConfig.serverConfig, null, 2));
  }

  const runningServers: McServer[] = [];
}

export default ServerManager;