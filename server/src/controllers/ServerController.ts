import { Router } from "express";
import { Server, User } from "../sequelize";
import ServerManager from "../ServerManager";
import { Server as McServer } from "ionmc";
import { ConsoleInfo } from "ionmc/dist/lib/Server";
import AppSystem from "../AppSystem";
import ServerProperties from "ionmc/shared/ServerProperties";

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

    const onData = (msg: ConsoleInfo) => {
      const txt = msg.toString();
      console.log(txt);
      server.log(txt);
    }

    mcserver.on("data", onData);
    mcserver.once("stopped", () => {
      mcserver.off("data", onData);
      console.log("Stopped listening to data on server", server.id);
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

    const mcserver = await ServerManager.getMCServer(server);

    await ServerManager.stop(mcserver);

    return res.json({ message: "Server stopped" });
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
}

export default ServerController;