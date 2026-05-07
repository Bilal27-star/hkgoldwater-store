import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts
} from "../controllers/productController.js";

const router = Router();

router.get("/", listProducts);
router.post("/", createProduct);
router.delete("/:id", deleteProduct);
router.get("/:id", getProductById);

export default router;