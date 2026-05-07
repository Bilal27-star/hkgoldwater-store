import { Router } from "express";
import { createAdmin, deleteAdmin, listAdmins, loginAdmin } from "../controllers/adminController.js";

const router = Router();

router.get("/", listAdmins);
router.post("/login", loginAdmin);
router.post("/", createAdmin);
router.delete("/:id", deleteAdmin);

export default router;
