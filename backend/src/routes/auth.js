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
  console.log("REGISTER ROUTE HIT:", import.meta.url);
  console.log("REGISTER BODY:", req.body);
  console.log("REQ BODY:", req.body);
  const { name, email, phone, password } = req.body;
  const normalizedName = asText(name);
  const normalizedEmail = asText(email).toLowerCase();
  const normalizedPhone = asText(phone);
  const normalizedPassword = asText(password);

  if (!normalizedName || !normalizedPassword || (!normalizedEmail && !normalizedPhone)) {
    return res.status(400).json({ error: "name and password and (email or phone) are required" });
  }
  if (normalizedPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    console.log("REGISTER REQUEST:", {
      email: normalizedEmail,
      phone: normalizedPhone
    });
    const supabase = req.app.locals.supabase;
    let existingQuery = supabase.from("users").select("id");
    existingQuery = normalizedEmail
      ? existingQuery.eq("email", normalizedEmail)
      : existingQuery.eq("phone", normalizedPhone);
    const existing = await existingQuery.maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      return res.status(409).json({
        error: normalizedEmail
          ? "An account with this email already exists"
          : "An account with this phone already exists"
      });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: normalizedName,
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        password_hash: passwordHash,
        role: "customer"
      })
      .select("id,name,email,role,phone,wilaya,commune,address,created_at")
      .single();
    if (error) throw error;
    console.log("REGISTER SUCCESS:", data?.id);

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
  const rawInput = asText(req.body?.email || req.body?.phone || req.body?.input);
  const isEmailInput = rawInput.includes("@");
  const loginInput = isEmailInput ? rawInput.toLowerCase() : rawInput;
  const password = asText(req.body?.password);
  console.log("LOGIN INPUT:", loginInput, password);
  if (!loginInput || !password) return res.status(400).json({ error: "email/phone and password are required" });

  try {
    const supabase = req.app.locals.supabase;
    let query = supabase
      .from("users")
      .select("*");
    query = isEmailInput ? query.eq("email", loginInput) : query.eq("phone", loginInput);
    const { data: user, error } = await query.maybeSingle();
    console.log("DB USER:", user);
    console.log("ERROR:", error);
    if (error) throw error;
    if (!user) return res.status(401).json({ message: "User not found" });
    console.log("HASH:", user.password_hash);
    console.log("INPUT:", password);
    if (!user.password_hash) return res.status(401).json({ message: "Wrong password" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Wrong password" });

    const token = signUserToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name ?? null,
        email: user.email,
        role: user.role ?? "customer",
        phone: user.phone ?? null,
        wilaya: user.wilaya ?? null,
        commune: user.commune ?? null,
        address: user.address ?? null,
        createdAt: user.created_at ?? null
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
