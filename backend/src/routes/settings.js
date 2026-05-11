import { Router } from "express";
import { getSettings, patchSettings, getSocialMedia, patchSocialMedia } from "../controllers/settings.js";
import adminJwtAuth from "../middleware/adminJwtAuth.js";

const router = Router();

router.get("/social", getSocialMedia);
router.patch("/social", adminJwtAuth, patchSocialMedia);
router.get("/", getSettings);
router.patch("/", patchSettings);

export default router;
