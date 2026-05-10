import { Router } from "express";
import {
  createAdmin,
  deleteAdmin,
  listAdmins,
  loginAdmin,
  syncAdminCredentials
} from "../controllers/adminController.js";

const router = Router();

router.get("/", listAdmins);
router.post("/sync-credentials", syncAdminCredentials);
router.post("/login", loginAdmin);
router.post("/", createAdmin);
router.delete("/:id", deleteAdmin);

export default router;
