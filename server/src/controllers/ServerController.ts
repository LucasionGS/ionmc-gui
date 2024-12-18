import { Router } from "express";
import { Server, User } from "../sequelize";
import ServerManager from "../ServerManager";
// import { ConsoleInfo } from "ionmc/dist/lib/Server";
import AppSystem from "../AppSystem";
// import ServerProperties from "ionmc/shared/ServerProperties";
import { io } from "../express";
import fsp from "fs/promises";
import { ServerAttributesExtra } from "@shared/models";
import { Server as McServer } from "ionmc-core";

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
    const { name, version, ram,
      client = "vanilla",
      forgeVersion = undefined,
     } = req.body as { name: string, version: string, ram: number, client?: "vanilla" | "forge", forgeVersion?: string };
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
      client,
      forgeVersion,
      
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

  router.delete("/:id", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.DELETE")) {
      return res.status(403).json({ error: "You don't have permission to delete this server" });
    }

    await ServerManager.deleteServer(server);
    return res.json({ message: "Server deleted" });
  });

  router.get("/:id", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return res.status(403).json({ error: "You don't have permission to view this server" });
    }

    const extra: ServerAttributesExtra = {
      ...server.toJSON(),
      address: await AppSystem.getExternalIp(),
    };
    return res.json(extra);
  });

  router.post("/:id/version", User.$middleware(), async (req, res) => {
    const { version } = req.body as { version: string };
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });

    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to update this server" });
    }

    // await ServerManager.updateServerConfig(server, { version });
    ServerManager.updateServer(server, version, {
      onProgress: (_, receivedBytes, totalBytes) => {
        console.log("Progress:", receivedBytes, totalBytes);
      },
      onDone: () => {
        res.json({ message: "Server updated" });
      }
    }).catch((error: any) => {
      res.status(500).json({ error: error.message });
    });
  });

  router.get("/:id/start", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.START")) {
      return res.status(403).json({ error: "You don't have permission to start this server" });
    }

    // await ServerManager.updateServerConfig(server, {
    //   java: process.env.JAVA_PATH || (AppSystem.isWindows ? "java.exe" : "java"),
    //   useStderr: false,
    //   version: server.version,
    //   xms: `${server.ram}M`,
    //   xmx: `${server.ram}M`,
    // });
    const mcserver = await ServerManager.getMCServer(server);

    const isStarted = ServerManager.isRunning(mcserver);
    if (isStarted) return res.status(400).json({ error: "Server is already started" });
    await ServerManager.start(mcserver);

    const chn = `server/${server.id}`;
    const channel = io.to(chn);
    const onData = (msg: McServer.ParsedData) => {
      const txt = mcserver._static.toFormattedString(msg, McServer.ColorMode.None);
      server.log(txt);

      channel.emit(chn, txt);
    }

    const sendStatus = async () => channel.emit(chn, null, await ServerManager.getStatus(server));
    sendStatus();
    mcserver.on("data", onData);
    mcserver.on("join", async (user) => {
      console.log("Server connected:", user);
      sendStatus();
    });

    mcserver.on("leave", async (user) => {
      console.log("Server disconnected:", user);
      sendStatus();
    });

    mcserver.on("ready", async () => {
      console.log("Server ready");
      sendStatus();
    });

    mcserver.on("exit", async () => {
      console.log("Stopped listening to data on server", server.id);
      setTimeout(() => {
        mcserver.removeAllListeners();
      }, 5000); // Wait 5 seconds before removing listeners to prevent any data from being missed
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
      await mcServer.loadProperties();
      return res.json(mcServer.properties);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.put("/:id/properties", User.$middleware(), async (req, res) => {
    const newSettings = req.body as Record<string, string>;
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
      await mcServer.loadProperties();
      Object.assign(mcServer.properties, newSettings);
      await mcServer.saveProperties();

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
    }).catch((error: any) => {
      fsp.rm(file.path);
      res.status(500).json({ error: error.message });
    });
  });

  /**
   * Reset the server's world and regenerate it.
   * @param id The ID of the server to reset.
   */
  router.post("/:id/world/reset", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to reset this server's world" });
    }

    ServerManager.resetWorld(server.id).then(() => {
      return res.json({ message: "World reset" });
    }).catch((error: any) => {
      return res.status(500).json({ error: error.message });
    });
  });

  /**
   * Get the server's current world datapacks.
   */
  router.get("/:id/datapacks", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return res.status(403).json({ error: "You don't have permission to view this server's datapacks" });
    }

    const datapacks = await ServerManager.getDataPacks(server).catch(() => []);
    return res.json(datapacks);
  });
  
  /**
   * Upload a zip file containing a datapack.
   */
  router.post("/:id/datapacks", User.$middleware(), AppSystem.uploader.single("file") as any, async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const file = req.file;
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to upload to this server's datapacks" });
    }
    if (!file) return res.status(400).json({ error: "Missing file" });

    ServerManager.uploadDatapack(server.id, file).then(() => {
      res.json({ message: "Datapack uploaded" });
    }).catch((error: any) => {
      fsp.rm(file.path);
      res.status(500).json({ error: error.message });
    });
  });

  /**
   * Delete a datapack.
   */
  router.delete("/:id/datapacks/:datapack", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const datapack = req.params.datapack;
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!datapack) return res.status(400).json({ error: "Missing datapack name" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to delete this server's datapacks" });
    }

    ServerManager.deleteDatapack(server.id, datapack).then(() => {
      res.json({ message: "Datapack deleted" });
    }).catch((error: any) => {
      res.status(500).json({ error: error.message });
    });
  });

  /**
   * Get a datapacks icon.
   */
  router.get("/:id/datapacks/:datapack/pack.png", async (req, res) => {
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });

    const worldPath = await ServerManager.getWorldPath(server);
    const datapackPath = `${worldPath}/datapacks/${req.params.datapack}`;
    return res.sendFile(datapackPath + "/pack.png");
  });

  /**
   * Get a list of all mods that the current server has.
   */
  router.get("/:id/mods", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.VIEW")) {
      return res.status(403).json({ error: "You don't have permission to view this server's mods" });
    }

    const mods = await ServerManager.getMods(server).catch(() => []);
    return res.json(mods);
  });

  /**
   * Upload a mod file.
   */
  router.post("/:id/mods", User.$middleware(), AppSystem.uploader.fields(
    [{ name: "file", maxCount: 1 }, { name: "manifest", maxCount: 1 }]
  ) as any, async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const files: { [fieldname: string]: Express.Multer.File[]; } = req.files as any;
    const file = files?.file?.[0];
    const manifest = files?.manifest?.[0];

    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to upload to this server's mods" });
    }
    if (!file && !manifest && req.body.modId) {
      let modId = req.body.modId as number | number[];
      if (!modId) return res.status(400).json({ error: "Missing mod ID" });
      if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
        return res.status(403).json({ error: "You don't have permission to install mods on this server" });
      }

      if (!Array.isArray(modId)) {
        modId = [modId];
      }
      
      return await ServerManager.installMod(server.id, ...modId).then(() => {
        res.json({ message: "Mod installed" });
      }).catch((error: any) => {
        res.status(500).json({ error: error.message });
      });
    }

    if (file) {
      return await ServerManager.uploadMod(server.id, file).then(() => {
        res.json({ message: "Mod uploaded" });
      }).catch((error: any) => {
        fsp.rm(file.path);
        res.status(500).json({ error: error.message });
      });
    }

    if (manifest) {
      return await ServerManager.installModManifest(server.id, manifest).then(() => {
        res.json({ message: "Mod manifest uploaded" });
      }).catch((error: any) => {
        fsp.rm(manifest.path);
        res.status(500).json({ error: error.message });
      });
    }
    
    return res.status(400).json({ error: "Missing file, manifest.json, or CurseForge ModID(s)" });
  });

  /**
   * Delete a mod.
   */
  router.delete("/:id/mods/:mod", User.$middleware(), async (req, res) => {
    const user = User.getAuthenticatedUser(req);
    const mod = req.params.mod;
    const server = await Server.findByPk(req.params.id);
    if (!server) return res.status(404).json({ error: "Server not found" });
    if (!mod) return res.status(400).json({ error: "Missing mod name" });
    if (server.userId !== user.id && !await user.hasPermission("SERVER.EDIT")) {
      return res.status(403).json({ error: "You don't have permission to delete this server's mods" });
    }

    ServerManager.deleteMod(server.id, mod).then(() => {
      res.json({ message: "Mod deleted" });
    }).catch((error: any) => {
      res.status(500).json({ error: error.message });
    });
  });
}

export default ServerController;