import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildTokenPayload(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role || "customer"
  };
}

function buildSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role || "customer",
    wilaya: user.wilaya ?? null,
    commune: user.commune ?? null,
    address: user.address ?? null
  };
}

/** REGISTER */
router.post("/register", async (req, res) => {
  try {
    console.log("[route-hit] POST /api/auth/register");

    const supabase = req.app.locals.supabase;

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = req.body.phone ? String(req.body.phone).trim() : null;
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // check if user exists
    const { data: existing, error: existingErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // insert user
    const { data: user, error: createErr } = await supabase
      .from("users")
      .insert({
        name,
        email,
        phone,
        password_hash: hash,
        role: "customer",
      })
      .select("id,name,email,phone,role,created_at")
      .single();

    if (createErr) throw createErr;

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** LOGIN */
router.post("/login", async (req, res) => {
  try {
    console.log("[route-hit] POST /api/auth/login");

    const supabase = req.app.locals.supabase;

    const email = req.body.email
      ? String(req.body.email).trim().toLowerCase()
      : "";

    const phone = req.body.phone
      ? String(req.body.phone).trim()
      : "";

    const password = String(req.body.password || "");

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        error: "email/phone and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // Authenticate from users table first.
    let query = supabase.from("users").select("*");
    query = email ? query.eq("email", email) : query.eq("phone", phone);
    let { data: user, error } = await query.maybeSingle();
    if (error) throw error;

    // If no user found and login is email-based, try admins table.
    if (!user && email) {
      const adminLookup = await supabase.from("admins").select("*").eq("email", email).maybeSingle();
      if (adminLookup.error) throw adminLookup.error;
      user = adminLookup.data;
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password_hash) {
      return res.status(500).json({ error: "User has no password hash" });
    }

    // compare password
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      buildTokenPayload(user),
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const safeUser = buildSafeUser(user);

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;