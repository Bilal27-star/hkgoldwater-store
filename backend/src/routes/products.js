import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct
} from "../controllers/productController.js";
import adminJwtAuth from "../middleware/adminJwtAuth.js";
import { multipartProductImages } from "../middleware/productUpload.js";

const router = Router();

router.get("/", listProducts);
router.post("/", adminJwtAuth, multipartProductImages, createProduct);
router.patch("/:id", adminJwtAuth, multipartProductImages, updateProduct);
router.delete("/:id", adminJwtAuth, deleteProduct);
router.get("/:id", getProductById);

export default router;