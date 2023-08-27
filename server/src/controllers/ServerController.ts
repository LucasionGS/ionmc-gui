import { Router } from "express";
import { Server, User } from "../sequelize";
import ServerManager from "../ServerManager";
import { Server as McServer } from "ionmc";
import { ConsoleInfo } from "ionmc/dist/lib/Server";
import AppSystem from "../AppSystem";
import ServerProperties from "ionmc/shared/ServerProperties";
import { io } from "../express";

namespace ServerController {
  export const router = Router();


  router.get("/", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    if (req.query.all !== undefined && await user.hasPermission("SERVER.LIST")) {
      return res.json(await Server.findAll());
    } else {
      return res.json(await user.getServers());
    }
  });

  router.post("/", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const { name, version, ram } = req.body as { name: string, version: string, ram: number };
    if (!name || !version || !ram) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!await user.hasPermission("SERVER.RAM")) {
      const min = 512, max = 1024;
      if (ram < min || ram > max) {
        return res.status(400).json({ error: `RAM must be between ${min} and ${max}` });
      }
    }
    const server = await ServerManager.create({
      name,
      version,
      ram,
      userId: user.id
    }, {
      onProgress: (_, receivedBytes, totalBytes) => {
        // TODO: Send progress to client
        console.log("Progress:", receivedBytes, totalBytes);
      }
    }).catch(error => {
      res.status(500).json({ error: error.message });
      return null;
    });

    if (!server) return res.status(500).json({ error: "Failed to create server" });
    return res.json(server);
  });

  router.get("/:id", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return res.status(403).json({ error: "You don't have permission to view this server" });
    }

    return res.json(server);
  });

  router.get("/:id/start", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.START")) {
      return res.status(403).json({ error: "You don't have permission to start this server" });
    }

    await ServerManager.updateServerConfig(server, {
      java: process.env.JAVA_PATH || (AppSystem.isWindows ? "java.exe" : "java"),
      useStderr: false,
      version: server.version,
      xms: `${server.ram}M`,
      xmx: `${server.ram}M`,
    });
    const mcserver = await ServerManager.getMCServer(server);

    const isStarted = ServerManager.isRunning(mcserver);
    if (isStarted) return res.status(400).json({ error: "Server is already started" });
    await ServerManager.start(mcserver);

    const chn = `server/${server.id}`;
    const channel = io.to(chn);
    const onData = (msg: ConsoleInfo) => {
      const txt = msg.toString();
      server.log(txt);

      channel.emit(chn, txt);
    }

    const sendStatus = async () => channel.emit(chn, null, await ServerManager.getStatus(server));
    sendStatus();
    mcserver.on("data", onData);
    mcserver.on("connect", async (user) => {
      console.log("Server connected:", user);
      sendStatus();
    });

    mcserver.on("disconnect", async (user) => {
      console.log("Server disconnected:", user);
      sendStatus();
    });

    mcserver.on("ready", async () => {
      console.log("Server ready");
      sendStatus();
    });
    
    mcserver.on("stopped", async () => {
      console.log("Stopped listening to data on server", server.id);
      mcserver.removeAllListeners();
      ServerManager.removeFromRunning(mcserver);
      sendStatus();
    });
    return res.json({ message: "Server started" });
  });

  router.get("/:id/stop", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.STOP")) {
      return res.status(403).json({ error: "You don't have permission to stop this server" });
    }

    const mcserver = ServerManager.getRunningServerById(server.id);
    if (!mcserver) return res.status(400).json({ error: "Server is not running" });
    await ServerManager.stop(mcserver);

    return res.json({ message: "Server stopped" });
  });

  router.get("/:id/logs", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return res.status(403).json({ error: "You don't have permission to view this server's logs" });
    }

    const logs = await server.getLogs({ limit: -50 });
    return res.json(logs.map(l => l.data));
  });

  router.get("/:id/properties", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return res.status(403).json({ error: "You don't have permission to view this server's properties" });
    }

    const mcServer = await ServerManager.getMCServer(server);
    try {
      const settings = mcServer.parseProperties();
      return res.json(settings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.put("/:id/properties", User.$middleware(), async (req, res) => {
    const newSettings = req.body as Partial<ServerProperties>;
    if (typeof newSettings !== "object") return res.status(400).json({ error: "Invalid settings" });
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to edit this server's properties" });
    }

    let error: string | null = null;

    if (typeof newSettings["server-port"] === "number" && newSettings["server-port"] !== server.port) {
      if (newSettings["server-port"] < ServerManager.minServerPort || newSettings["server-port"] > ServerManager.maxServerPort) {
        error = `Port must be between ${ServerManager.minServerPort} and ${ServerManager.maxServerPort}. Port is unchanged.`;
        delete newSettings["server-port"];
      }
      else if (await Server.findOne({ where: { port: newSettings["server-port"] } })) {
        error = "Port is already in use and couldn't be changed.";
        delete newSettings["server-port"];
      }
      else {
        server.port = newSettings["server-port"];
        await server.save();
      }
    }

    const mcServer = await ServerManager.getMCServer(server);
    try {
      mcServer.setProperties(newSettings);

      if (error) {
        return res.json({ message: error + "\nOther settings are saved." });
      }
      return res.json({ message: "Server properties updated." });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get the full server status to display on the server page.
   */
  router.get("/:id/status", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return res.status(403).json({ error: "You don't have permission to view this server's properties" });
    }

    res.json(await ServerManager.getStatus(server));
  });

  /**
   * Download a zip file containing the server's world.
   */
  router.get("/:id/world/download", async (req, res) => {
    // const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    // if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
    //   return res.status(403).json({ error: "You don't have permission to view this server's world" });
    // }

    const worldZip = await ServerManager.zipWorld(server).catch(() => null);
    if (!worldZip) return res.status(500).json({ error: "Failed to zip world" });
    
    worldZip.on("progress", p => {
      console.log(`${((p.entries.processed / p.entries.total) * 100).toFixed(2)}% | ${p.entries.processed}/${p.entries.total}`);
    });
    
    res.writeHead(200, {
      "Content-Disposition": `attachment; world.zip`,
      "Content-Type": "octet/stream",
    });
    worldZip.pipe(res);
    await worldZip.finalize();
    worldZip.removeAllListeners();
    worldZip.destroy();
    console.log("Destroyed Stream");
    
    // res.send(worldZip);
  });

  /**
   * Upload a zip file containing the server's world. This will overwrite the current world.
   * @param id The ID of the server to upload the world to.
   */
  router.post("/:id/world/upload", User.$middleware(), AppSystem.uploader.single("file") as any, async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const file = req.file;
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to upload to this server's world" });
    }
    if (!file) return res.status(400).json({ error: "Missing file" });

    ServerManager.uploadWorld(server.id, file).then(() => {
      res.json({ message: "World uploaded" });
    });
  });
}

export default ServerController;