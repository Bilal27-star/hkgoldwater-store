import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";

const router = Router();

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function signUserToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || "customer"
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  const body = req.body ?? {};
  const name = asText(body.name);
  const email = asText(body.email).toLowerCase();
  const password = asText(body.password);
  const phone = asText(body.phone) || null;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const supabase = req.app.locals.supabase;
    const existing = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from("users")
      .insert({ name, email, password_hash: passwordHash, phone, role: "customer" })
      .select("id,name,email,role,phone,wilaya,commune,address,created_at")
      .single();
    if (error) throw error;

    return res.status(201).json({
      success: true,
      user: {
        id: data.id,
        name: data.name ?? null,
        email: data.email,
        role: data.role ?? "customer",
        phone: data.phone ?? null,
        wilaya: data.wilaya ?? null,
        commune: data.commune ?? null,
        address: data.address ?? null,
        createdAt: data.created_at ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return res.status(500).json({ error: message });
  }
});

router.post("/login", async (req, res) => {
  const email = asText(req.body?.email).toLowerCase();
  const password = asText(req.body?.password);
  console.log("LOGIN REQUEST:", email);
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,role,password,password_hash,phone,wilaya,commune,address,created_at")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    const legacyPlainPassword =
      typeof data?.password === "string" && data.password.length > 0 ? data.password : null;
    const passwordHash =
      typeof data?.password_hash === "string" && data.password_hash.length > 0 ? data.password_hash : null;
    if (!passwordHash && !legacyPlainPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = passwordHash
      ? await bcrypt.compare(password, passwordHash)
      : legacyPlainPassword === password;
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signUserToken(data);
    return res.json({
      token,
      user: {
        id: data.id,
        name: data.name ?? null,
        email: data.email,
        role: data.role ?? "customer",
        phone: data.phone ?? null,
        wilaya: data.wilaya ?? null,
        commune: data.commune ?? null,
        address: data.address ?? null,
        createdAt: data.created_at ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(500).json({ error: message });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,role,phone,wilaya,commune,address,created_at")
      .eq("id", req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "User not found" });
    return res.json({
      user: {
        id: data.id,
        name: data.name ?? null,
        email: data.email,
        role: data.role ?? "customer",
        phone: data.phone ?? null,
        wilaya: data.wilaya ?? null,
        commune: data.commune ?? null,
        address: data.address ?? null,
        createdAt: data.created_at ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch session";
    return res.status(500).json({ error: message });
  }
});

router.post("/logout", (_req, res) => {
  return res.json({ success: true });
});

export default router;
