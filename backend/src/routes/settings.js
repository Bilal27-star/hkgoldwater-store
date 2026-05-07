import { Router } from "express";
import { getSettings, patchSettings } from "../controllers/settings.js";

const router = Router();

router.get("/", getSettings);
router.patch("/", patchSettings);

export default router;
