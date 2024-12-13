import { IonMC, Config } from "ionmc";
import { MinecraftApi as Api, Server as McServer } from "ionmc-core";
import AppSystem from "./AppSystem";
import Path from "path";
import { Server, User } from "./sequelize";
import fsp from "fs/promises";
import { createReadStream } from "fs";
import { io } from "./express";
import archiver from "archiver";
import extractZip from "extract-zip";
import { Express } from "express";

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
    onProgress?: (buffer: any, receivedBytes: number, totalBytes: number) => void,
    onDone?: () => void
  }) {
    return new Promise<Server>(async (resolve, reject) => {
      const { name, version, ram, userId } = data;
      const { onProgress, onDone } = events || {};
      console.log("Getting version data...");
      const versionData = await Api.getServerVersions().then(({ versions, latest }) => {
        let lookFor = version;
        if (version === "latest") lookFor = latest.release;
        return versions.find(
          (v) => v.id === lookFor
        );
      });
      if (!versionData) return reject(new Error("Version not found"));

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
      // const dl = await Api.downloadServer(release, dist);
      const serverDl = new McServer(dist);
      const strm = new McServer.ProgressStream();
      const _oP = onProgress ? ((data: string) => {
        const d = data.match(/Progress: (\d+)\/(\d+)/);
        if (d) {
          const receivedBytes = +d[1];
          const totalBytes = +d[2];
          onProgress(null, receivedBytes, totalBytes);
        }
      }) : undefined;
      
      _oP && strm.on("data", _oP);
      const onDoneEvent = () => {
        onDone && onDone();
        // Remove listeners
        _oP && strm.off("data", _oP);
        resolve(server);
      }
      await serverDl.installServer({
        progressStream: strm
      });

      onDoneEvent();

      // Timeout in case of the download taking too long - Assuming it's stuck or something went wrong
      setTimeout(() => {
        reject(new Error("Download timed out"));
      }, 1000 * 60 * 5); // 5 minutes
    });
  }

  export async function updateServer(_server: Server | string, version: string, events?: {
    onProgress?: (buffer: any, receivedBytes: number, totalBytes: number) => void,
    onDone?: () => void
  }) {
    const server = _server instanceof Server ? _server : await Server.findByPk(_server);
    if (!server) throw new Error("Server not found");
    
    return new Promise<Server>(async (resolve, reject) => {
      const { onProgress, onDone } = events || {};
      console.log("Getting version data...");
      const versionData = await Api.getServerVersions().then(({ versions, latest }) => {
        let lookFor = version;
        if (version === "latest") lookFor = latest.release;
        return versions.find(
          (v) => v.id === lookFor
        );
      });
      if (!versionData) return reject(new Error("Version not found"));

      const dist = Path.resolve(serverFolder, server.id);
      const serverDl = new McServer(dist);
      const strm = new McServer.ProgressStream();

      const _oP = onProgress ? ((data: string) => {
        const d = data.match(/Progress: (\d+)\/(\d+)/);
        if (d) {
          const receivedBytes = +d[1];
          const totalBytes = +d[2];
          onProgress(null, receivedBytes, totalBytes);
        }
      }) : undefined;

      _oP && strm.on("data", _oP);
      const onDoneEvent = () => {
        onDone && onDone();
        // Remove listeners
        _oP && strm.off("data", _oP);
        resolve(server);
      }

      await serverDl.installServer({
        progressStream: strm
      });

      onDoneEvent();

      // Timeout in case of the download taking too long - Assuming it's stuck or something went wrong
      setTimeout(() => {
        reject(new Error("Download timed out"));
      }, 1000 * 60 * 5); // 5 minutes
    });
  }

  export const minServerPort = 25000;
  export const maxServerPort = 35000;

  /**
   * Find the first available port.
   */
  export async function findFirstAvailablePort(): Promise<number> {
    const min = minServerPort;
    const max = maxServerPort;
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
    await mcserver.acceptEula();
    try {
      const serverPort = +mcserver.getProperty("server-port")!;

      // Ensure the server port is correct and consistent with the database
      if (serverPort !== serverEntry.port) {
        mcserver.setProperty("server-port", serverEntry.port.toString());
      }
    } catch (error) {
      // This will happen if the server.properties file doesn't exist yet
      const serverProperties = Path.resolve(mcserver.path, "server.properties");
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
  export async function stop(mcserver: McServer, force: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      try {
        if (force) {
          mcserver.kill();
        }
        else {
          mcserver.stop();
        }
      } catch (error) {
        console.error(error);
        // IonMC has a bug where it throws an error because it tries to write to the server console after it's already stopped
        // This still stops the server, so we can just ignore the error
      }
      removeFromRunning(mcserver);
      mcserver.once("exit", () => {
        resolve();
      });
    });
  }

  /**
   * Remove a server from the running servers list.
   */
  export async function removeFromRunning(mcserver: McServer) {
    let index: number;
    while ((index = runningServers.indexOf(mcserver)) !== -1) {
      runningServers.splice(index, 1);
    }
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
    const serverPath = Path.resolve(serverFolder, server.id);
    const mcserver = new McServer(serverPath);

    return mcserver;
  }

  /**
   * Updates the server config file. Should be called BEFORE constructing the server object.
   * @param server Server entry
   * @param config New configuration
   */
  export async function updateServerConfig(server: Server, config: Partial<Config.IonConfig["config"]>) {
    const serverPath = Path.resolve(serverFolder, server.id);
    const serverConfigPath = Path.resolve(serverPath, ".ion", "serverConfig.json");
    await fsp.mkdir(Path.dirname(serverConfigPath), { recursive: true });
    const serverConfig = Config.load(serverPath);
    if (serverConfig.serverConfig) {
      serverConfig.serverConfig = { ...serverConfig.serverConfig, ...config };
    }
    else {
      // Opposite of Partial
      serverConfig.serverConfig = config as Required<typeof config>;
    }
    await fsp.writeFile(serverConfigPath, JSON.stringify(serverConfig.serverConfig, null, 2));
  }

  const runningServers: McServer[] = [];

  /**
   * Get the status of a server.
   * @param id The ID of the server to get the status of.
   */
  export async function getStatus(id: string): Promise<ServerStatus>;
  /**
   * Get the status of a server.
   * @param server The server to get the status of.
  */
  export async function getStatus(server: Server): Promise<ServerStatus>;
  export async function getStatus(id: string | Server): Promise<ServerStatus> {
    const server = id instanceof Server ? id : await Server.findByPk(id);
    if (!server) throw new Error("Server not found");
    let mcServer = ServerManager.getRunningServerById(server.id);
    if (!mcServer) {
      mcServer = await ServerManager.getMCServer(server);
    }

    const status = mcServer.getStatus();
    const admins = ((await mcServer.getOperators().catch(() => [])).map(o => o.name)).filter(n => n);
    const players = Array.from(mcServer.players);

    const result = {
      status,
      players,
      admins
    };

    return result;
  }

  export async function getWorldPath(id: string | Server) {
    const server = id instanceof Server ? id : await Server.findByPk(id);
    if (!server) throw new Error("Server not found");
    let mcServer = ServerManager.getRunningServerById(server.id);
    if (!mcServer) {
      mcServer = await ServerManager.getMCServer(server);
    }

    try {
      const worldName = mcServer.getProperty("level-name") ?? "world";
      return Path.resolve(mcServer.path, worldName);
    } catch (error) {
      return null;
    }
  }

  export async function zipWorld(id: string | Server) {
    try {
      const worldPath = await getWorldPath(id);
      if (!worldPath) throw new Error("World not found");
      if (await fsp.stat(worldPath).then(() => false).catch(() => true)) throw new Error("World not found");

      const archive = archiver("zip");

      await archiveWorld(worldPath);

      archive.on("error", (err) => {
        console.error(err);
      });

      return archive;

      async function archiveWorld(dirPath: string, originalPath: string = dirPath) {
        const files = await fsp.readdir(dirPath);
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const absolutePath = Path.resolve(dirPath, file);
            const fileStream = createReadStream(absolutePath);
            const localPath = Path.relative(originalPath, absolutePath);
            const stat = await fsp.stat(absolutePath).catch(() => null);
            if (!stat) continue;
            if (stat.isDirectory()) {
              await archiveWorld(absolutePath, originalPath);
              continue;
            }
            archive.append(fileStream, { name: localPath });
          } catch (error) {
            console.error(error);
          }
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  export async function uploadWorld(id: string, zipFile: Express.Multer.File) {
    try {
      const worldPath = await getWorldPath(id);
      if (!worldPath) throw new Error("World not found");
      if (await fsp.stat(worldPath).then(() => true).catch(() => false)) {
        await fsp.rm(worldPath, { recursive: true });
      }
      await fsp.mkdir(worldPath, { recursive: true });
      const randomName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      // await fsp.writeFile(`${worldPath}/${randomName}.zip`, zipFile.buffer);
      await extractZip(zipFile.path, { dir: worldPath });
      await fsp.rm(zipFile.path);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  export async function resetWorld(id: string) {
    try {
      const worldPath = await getWorldPath(id);
      if (!worldPath) throw new Error("World not found");
      if (await fsp.stat(worldPath).then(() => true).catch(() => false)) {
        await fsp.rm(worldPath, { recursive: true });
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  export async function deleteServer(_server: string | Server) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const server = _server instanceof Server ? _server : await Server.findByPk(_server);
        if (!server) return reject(new Error("Server not found"));
        const mcServer = ServerManager.getRunningServerById(server.id);
        if (mcServer) {
          await ServerManager.stop(mcServer, true);
        }
        const path = Path.resolve(serverFolder, server.id);
        while (
          await fsp.stat(path).then(() => true).catch(() => false)
          && await fsp.rm(path, { recursive: true }).then(() => false).catch(() => true)
        ) {
          // Keep trying until it works, in case the server is still running
        }
        await server.destroy();
        resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  export async function getDataPacks(_server: string | Server) {
    const server = _server instanceof Server ? _server : await Server.findByPk(_server);
    if (!server) throw new Error("Server not found");
    let mcServer = ServerManager.getRunningServerById(server.id);
    if (!mcServer) {
      mcServer = await ServerManager.getMCServer(server);
    }
    const worldPath = await getWorldPath(server);
    if (!worldPath) throw new Error("World not found");
    const datapacksPath = Path.resolve(worldPath, "datapacks");

    const datapackFolders = await fsp.readdir(datapacksPath).catch(() => []);
    const datapacks: Datapack[] = (await Promise.all(datapackFolders.map(async (folder) => {
      const datapackJsonPath = Path.resolve(datapacksPath, folder, "pack.mcmeta");
      const exists = await fsp.stat(datapackJsonPath).then(() => true).catch(() => false);
      if (!exists) return null;
      const datapackJson: DatapackJson = await fsp.readFile(datapackJsonPath, "utf-8").then(JSON.parse);

      const name = folder;
      const description = typeof datapackJson.pack.description === "string" ? datapackJson.pack.description : datapackJson.pack.description.map((line) => line.text).join("");
      return {
        name,
        description,
        format: datapackJson?.pack.pack_format || 0
      }
    }))).filter(Boolean) as Datapack[]; // Remove nulls

    return datapacks;
  }

  export async function uploadDatapack(_server: string | Server, zipFile: Express.Multer.File) {
    const server = _server instanceof Server ? _server : await Server.findByPk(_server);
    if (!server) throw new Error("Server not found");
    let mcServer = ServerManager.getRunningServerById(server.id);
    if (!mcServer) {
      mcServer = await ServerManager.getMCServer(server);
    }
    const worldPath = await getWorldPath(server);
    if (!worldPath) throw new Error("World not found");
    let datapacksPath = Path.resolve(worldPath, "datapacks", zipFile.originalname.replace(/.zip$/, ""));
    let i = 1;
    while (
      await fsp.stat(datapacksPath).then(() => true).catch(() => false)
    ) {
      if (i > 1) {
        datapacksPath = datapacksPath.replace(/-[0-9]+$/, "");
      }
      datapacksPath += "-" + i;
      i++;
    }
    await fsp.mkdir(datapacksPath, { recursive: true });
    await extractZip(zipFile.path, { dir: datapacksPath });
    await fsp.rm(zipFile.path);
  }

  export async function deleteDatapack(_server: string | Server, name: string) {
    const server = _server instanceof Server ? _server : await Server.findByPk(_server);
    if (!server) throw new Error("Server not found");
    let mcServer = ServerManager.getRunningServerById(server.id);
    if (!mcServer) {
      mcServer = await ServerManager.getMCServer(server);
    }
    const worldPath = await getWorldPath(server);
    if (!worldPath) throw new Error("World not found");
    const datapacksPath = Path.resolve(worldPath, "datapacks", name);
    await fsp.rm(datapacksPath, { recursive: true });
  }
}

export interface ServerStatus {
  status: "running" | "starting" | "offline";
  players: string[];
  admins: string[];
}

export interface DatapackJson {
  pack: {
    pack_format: number,
    description: string | {
      text: string,
      [key: string]: any
    }[]
  }
}

export interface Datapack {
  name: string;
  description: string;
  format: number;
}

export default ServerManager;