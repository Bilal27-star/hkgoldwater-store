import { Router } from "express";
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  loginAdmin,
  syncAdminCredentials
} from "../controllers/adminController.js";

const router = Router();

/** Register explicit paths before `/` so `/login` is never ambiguous. */
router.post("/login", loginAdmin);
router.post("/sync-credentials", syncAdminCredentials);
router.get("/", listAdmins);
router.post("/", createAdmin);
router.delete("/:id", deleteAdmin);

export default router;
