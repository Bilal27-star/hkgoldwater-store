import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
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
import { authDebug } from "./utils/authDebug.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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

try {
  const host = new URL(process.env.SUPABASE_URL).hostname;
  console.log(`[startup] Supabase: ${host}`);
} catch {
  /* ignore */
}

console.log("[startup] admin-login env (booleans only, no secrets)", {
  JWT_SECRET: Boolean(process.env.JWT_SECRET),
  SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  ADMIN_SEED_EMAIL: Boolean(String(process.env.ADMIN_SEED_EMAIL || "").trim()),
  ADMIN_SEED_PASSWORD: Boolean(String(process.env.ADMIN_SEED_PASSWORD || "").trim()),
  ADMIN_SYNC_TOKEN: Boolean(String(process.env.ADMIN_SYNC_TOKEN || "").trim()),
  NODE_ENV: process.env.NODE_ENV || "(unset)"
});

/**
 * Optional: set ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD in the API environment.
 * On each boot, upserts bcrypt `password_hash` for that email in `admins` (same DB as SUPABASE_URL).
 * Use this on production hosts (e.g. Render) whenever the deploy uses a different Supabase project than
 * your laptop, or keep the vars set so redeploys repair the admin password.
 */
(async () => {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const plain = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !plain) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[admin-seed] skipped (ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not both set). " +
          "Admin login only works if `admins` already has a valid row for that Supabase project. " +
          "Set both on your host and redeploy to create or fix the password hash."
      );
    }
    return;
  }

  try {
    const supabase = app.locals.supabase;
    const hash = await bcrypt.hash(String(plain), 10);
    const { data: existing, error: e1 } = await supabase.from("admins").select("id").eq("email", email).maybeSingle();
    if (e1) {
      console.error("[admin-seed] lookup error:", e1.message);
      return;
    }
    if (existing?.id) {
      const { error: e2 } = await supabase.from("admins").update({ password_hash: hash }).eq("id", existing.id);
      if (e2) console.error("[admin-seed] update error:", e2.message);
      else console.log("[admin-seed] password hash synced for", email);
      return;
    }
    const { error: e3 } = await supabase.from("admins").insert({
      name: "Admin",
      email,
      role: "admin",
      password_hash: hash
    });
    if (e3) console.error("[admin-seed] insert error:", e3.message);
    else console.log("[admin-seed] admin row created for", email);
  } catch (err) {
    console.error("[admin-seed] failed:", err);
  }
})();

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
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options("*", cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => {
  console.log("[route-hit] GET /api/health");
  let supabaseHost = null;
  try {
    supabaseHost = new URL(process.env.SUPABASE_URL).hostname;
  } catch {
    /* ignore */
  }
  res.json({
    status: "ok",
    ...(supabaseHost ? { supabaseHost } : {}),
    /** Matches POST /api/admin/login: `public.admins` + bcrypt, not Supabase Auth. */
    adminAuthMode: "public_admins_bcrypt"
  });
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
    authDebug("server-auth-login.request", { incomingEmail: email, passwordLength: password.length });

    if (!email || !password) {
      const body = { message: "Email and password are required" };
      authDebug("server-auth-login.response", { status: 400, body });
      return res.status(400).json(body);
    }

    const supabase = req.app.locals.supabase;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    authDebug("server-auth-login.lookup", {
      incomingEmail: email,
      userFound: Boolean(user && !error),
      supabaseError: error?.message ?? null,
      userId: user?.id ?? null,
      hasPasswordHash: Boolean(user?.password_hash),
      storedPasswordHash: user?.password_hash ?? null
    });

    if (error || !user) {
      const body = { message: "User not found" };
      authDebug("server-auth-login.response", { status: 401, body, reason: "user_not_found_or_db_error" });
      return res.status(401).json(body);
    }

    if (!user.password_hash) {
      const body = { message: "Wrong password" };
      authDebug("server-auth-login.response", { status: 401, body, reason: "missing_password_hash" });
      return res.status(401).json(body);
    }

    let isMatch = false;
    let compareError = null;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (e) {
      compareError = e instanceof Error ? e.message : String(e);
      isMatch = false;
    }
    authDebug("server-auth-login.bcrypt", {
      bcryptCompareResult: isMatch,
      compareThrew: compareError != null,
      compareError
    });

    if (!isMatch) {
      const body = { message: "Wrong password" };
      authDebug("server-auth-login.response", { status: 401, body, reason: "password_mismatch" });
      return res.status(401).json(body);
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET");
      const body = { message: "JWT_SECRET is not configured" };
      authDebug("server-auth-login.response", { status: 500, body });
      return res.status(500).json(body);
    }

    const jwtPayload = { id: user.id };
    authDebug("server-auth-login.jwt", { payload: jwtPayload });

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

    authDebug("server-auth-login.jwt", { token });

    const responseBody = { token, user };
    authDebug("server-auth-login.response", { status: 200, body: responseBody });

    return res.json(responseBody);
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    const body = { message: "Server error" };
    authDebug("server-auth-login.response", { status: 500, body });
    return res.status(500).json(body);
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
