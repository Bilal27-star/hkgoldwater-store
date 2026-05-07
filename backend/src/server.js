import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import categoryRoutes from "./routes/categories.js";
import brandRoutes from "./routes/brands.js";
import settingsRoutes from "./routes/settings.js";
import pagesRoutes from "./routes/pages.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import { getProfile, patchProfile } from "./routes/users.js";
import auth from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ENV ERROR");
  process.exit(1);
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
app.use(express.json());
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

app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN:", email, password);

    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(401).json({ message: "User not found" });
    }

    console.log("DB USER:", data);

    if (data.password !== password) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: data.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, user: data });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/** Explicit app-level routes so PATCH is always registered (Express “Cannot PATCH” = no matching handler). */
app.get("/api/users/profile", auth, getProfile);
app.patch("/api/users/profile", auth, patchProfile);
app.get("/api/user/profile", auth, getProfile);
app.patch("/api/user/profile", auth, patchProfile);
console.log("[boot] Registered GET + PATCH /api/users/profile and /api/user/profile");

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
