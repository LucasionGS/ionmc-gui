import { Router } from "express";
import { Server, User } from "../sequelize";
import ServerManager from "../ServerManager";
import { Server as McServer } from "ionmc";
import { ConsoleInfo } from "ionmc/dist/lib/Server";
import AppSystem from "../AppSystem";

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
        try {
          res.write(Buffer.from((receivedBytes / totalBytes).toString()));
        } catch (error) {
          // In case the response is ended before the download is finished for whatever reason
          console.error("Error while sending progress");
          console.error(error);
        }
      },
      onDone: () => {
        res.end();
      }
    }).then(s => s).catch(error => {
      console.error(error);
      res.status(500).json({ error: error.message });
    });
    // return res.json(server);
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
}

export default ServerController;