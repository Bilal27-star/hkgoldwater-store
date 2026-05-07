import { Router } from "express";
import { getPages, patchPages } from "../controllers/pages.js";

const router = Router();

router.get("/", getPages);
router.patch("/", patchPages);

export default router;
