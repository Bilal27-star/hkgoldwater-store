import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import brandRoutes from "./routes/brands.js";
import settingsRoutes from "./routes/settings.js";
import pagesRoutes from "./routes/pages.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import { getProfile, patchProfile } from "./routes/users.js";
import auth from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

app.locals.supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: {
      transport: ws
    }
  }
);

app.use(
  cors({
    origin: "*",
    credentials: false
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => {
  console.log("[route-hit] GET /api/health");
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

/** Explicit app-level routes so PATCH is always registered (Express “Cannot PATCH” = no matching handler). */
app.get("/api/users/profile", auth, getProfile);
app.patch("/api/users/profile", auth, patchProfile);
console.log("[boot] Registered GET + PATCH /api/users/profile");

app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large. Max size is 10MB." });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log("Server running...");
  console.log(`API listening on http://localhost:${port}`);
});
