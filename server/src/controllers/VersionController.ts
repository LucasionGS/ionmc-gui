import { Router } from "express";
import { Api } from "ionmc";
namespace VersionController {
  export const router = Router();


  router.get("/", async (req, res) => {
    return res.json((await Api.getVersions()).versions.map(v => v.id));
  });
}

export default VersionController;