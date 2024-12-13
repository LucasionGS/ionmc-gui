import { Router } from "express";
// import { Api } from "ionmc";
import { MinecraftApi } from "ionmc-core";
namespace VersionController {
  export const router = Router();


  router.get("/", async (req, res) => {
    return res.json((await MinecraftApi.getServerVersions()).versions.map(v => v.id));
  });
}

export default VersionController;