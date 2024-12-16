import { Router } from "express";
// import { Api } from "ionmc";
import { MinecraftApi } from "ionmc-core";
namespace VersionController {
  export const router = Router();


  router.get("/", async (req, res) => {
    if (req.query["client"] === "forge" && req.query["version"]) {
      try {
        return res.json(await MinecraftApi.getForgeVersions(req.query["version"] as string));
      } catch (error) {
        return res.json([]);
      }
    }
    return res.json((await MinecraftApi.getServerVersions()).versions.map(v => v.id));
  });
}

export default VersionController;