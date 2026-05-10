import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import { authDebug } from "../utils/authDebug.js";

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
  const name = asText(req.body?.name);
  const email = asText(req.body?.email).toLowerCase() || null;
  const phone = asText(req.body?.phone) || null;
  const password = asText(req.body?.password);

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const supabase = req.app.locals.supabase;

    if (email) {
      const { data: emailExists, error: emailCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (emailCheckError) {
        console.error("REGISTER ERROR:", emailCheckError);
        return res.status(500).json({ error: emailCheckError.message });
      }
      if (emailExists) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
    }

    if (phone) {
      const { data: phoneExists, error: phoneCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (phoneCheckError) {
        console.error("REGISTER ERROR:", phoneCheckError);
        return res.status(500).json({ error: phoneCheckError.message });
      }
      if (phoneExists) {
        return res.status(409).json({ error: "An account with this phone already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    console.log("REGISTER INPUT:", { name, email, phone });

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email: email || null,
          phone: phone || null,
          password_hash: passwordHash,
          role: "customer"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("REGISTER ERROR FULL:", error);
      return res.status(500).json({ error: error.message });
    }
    console.log("REGISTER SUCCESS:", data);

    return res.status(201).json({
      success: true,
      user: data
    });
  } catch (error) {
    console.error("REGISTER ERROR FULL:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const rawInput = asText(req.body?.email || req.body?.phone || req.body?.input);
  const isEmailInput = rawInput.includes("@");
  const normalizedPhone = rawInput.replace(/\s/g, "");
  const parsedInput = isEmailInput ? rawInput.toLowerCase() : normalizedPhone;
  const password = asText(req.body?.password);
  authDebug("auth-login.request", {
    isEmailInput,
    parsedInput,
    passwordLength: password.length
  });
  if (!parsedInput || !password) {
    const body = { message: "Invalid credentials" };
    authDebug("auth-login.response", { status: 400, body });
    return res.status(400).json(body);
  }

  try {
    const supabase = req.app.locals.supabase;
    let query = supabase
      .from("users")
      .select("*");
    query = isEmailInput ? query.eq("email", parsedInput) : query.eq("phone", normalizedPhone);
    const { data: user, error } = await query.maybeSingle();
    if (error) throw error;

    authDebug("auth-login.lookup", {
      parsedInput,
      userFound: !!user,
      userId: user?.id ?? null,
      hasPasswordHash: Boolean(user?.password_hash),
      storedPasswordHash: user?.password_hash ?? null,
      dbRole: user?.role ?? null
    });

    if (!user) {
      const body = { message: "Invalid credentials" };
      authDebug("auth-login.response", { status: 401, body, reason: "user_not_found" });
      return res.status(401).json(body);
    }
    if (!user.password_hash) {
      const body = { message: "Invalid credentials" };
      authDebug("auth-login.response", { status: 401, body, reason: "missing_password_hash" });
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
    authDebug("auth-login.bcrypt", {
      bcryptCompareResult: isMatch,
      compareThrew: compareError != null,
      compareError
    });

    if (!isMatch) {
      const body = { message: "Invalid credentials" };
      authDebug("auth-login.response", { status: 401, body, reason: "password_mismatch" });
      return res.status(401).json(body);
    }

    const jwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role || "customer"
    };
    authDebug("auth-login.jwt", { payload: jwtPayload });

    const token = signUserToken(user);
    authDebug("auth-login.jwt", { token });

    const responseBody = {
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
    };
    authDebug("auth-login.response", { status: 200, body: responseBody });

    return res.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    const body = { error: message };
    authDebug("auth-login.response", { status: 500, body });
    return res.status(500).json(body);
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
