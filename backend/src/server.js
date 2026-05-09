import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
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
  console.error("❌ ENV ERROR: Missing Supabase credentials");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded" : "Missing");
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

// 🔍 Test Supabase connection on boot
(async () => {
  try {
    const { data, error } = await app.locals.supabase
      .from("categories")
      .select("*");

    console.log("🧪 TEST categories:", data);
    if (error) console.error("❌ TEST ERROR:", error);
  } catch (err) {
    console.error("❌ SUPABASE INIT ERROR:", err);
  }
})();

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
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    console.log("LOGIN REQUEST:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const supabase = req.app.locals.supabase;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.password_hash) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET");
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ token, user });
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
