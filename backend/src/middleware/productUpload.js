import { randomUUID } from "crypto";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const productImagesUploadDir = path.join(__dirname, "../../uploads/products");
fs.mkdirSync(productImagesUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productImagesUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    // One unique disk name per file (Date.now()+Math.random can collide in the same ms).
    cb(null, `${randomUUID()}${ext}`);
  }
});

export const productImagesUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

/** Runs multer for multipart POST/PATCH so JSON bodies keep using express.json(). */
export function multipartProductImages(req, res, next) {
  if (req.is("multipart/form-data")) {
    return productImagesUpload.array("images", 4)(req, res, next);
  }
  next();
}
