import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Escape `%`, `_`, `\` for ILIKE so emails match literally (case-insensitive). */
function escapeIlikeExact(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Lookup by exact lowercase email first; fallback to ILIKE for mixed-case emails in DB.
 */
async function fetchUserForAdminLogin(supabase, emailNorm) {
  const columns = "id,email,password_hash,role,name";
  const base = () => supabase.from("admins").select(columns);

  let { data, error } = await base().eq("email", emailNorm).maybeSingle();
  if (error) return { user: null, error };
  if (data) return { user: data, error: null };

  const { data: data2, error: err2 } = await base()
    .ilike("email", escapeIlikeExact(emailNorm))
    .limit(1)
    .maybeSingle();
  return { user: data2 ?? null, error: err2 };
}

export async function listAdmins(req, res) {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("admins")
      .select("id,name,email,role,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch admins";
    console.error("[admin.list] error", message);
    return res.status(500).json({ error: message });
  }
}

export async function createAdmin(req, res) {
  const body = req.body ?? {};
  const name = asText(body.name);
  const email = asText(body.email).toLowerCase();
  const password = asText(body.password);
  const role = asText(body.role) || "admin";

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password and role are required" });
  }
  if (!["admin", "main_admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const supabase = req.app.locals.supabase;
    if (role === "main_admin") {
      const mainAdminCheck = await supabase
        .from("admins")
        .select("id")
        .eq("role", "main_admin")
        .maybeSingle();
      if (mainAdminCheck.error) throw mainAdminCheck.error;
      if (mainAdminCheck.data) {
        return res.status(409).json({ error: "A main admin already exists" });
      }
    }

    const existingAdmin = await supabase.from("admins").select("id").eq("email", email).maybeSingle();
    if (existingAdmin.error) throw existingAdmin.error;
    if (existingAdmin.data) {
      return res.status(409).json({ error: "An admin with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("admins")
      .insert({ name, email, role, password_hash: passwordHash })
      .select("id,name,email,role,created_at")
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create admin";
    console.error("[admin.create] error", message);
    return res.status(500).json({ error: message });
  }
}

export async function deleteAdmin(req, res) {
  const id = asText(req.params.id);
  console.log("[admin.delete] id:", id);
  if (!id) return res.status(400).json({ error: "Admin id is required" });

  try {
    const supabase = req.app.locals.supabase;
    const target = await supabase.from("admins").select("id,role").eq("id", id).maybeSingle();
    if (target.error) throw target.error;
    if (!target.data) return res.status(404).json({ error: "Admin not found" });
    if (target.data.role === "main_admin") {
      return res.status(400).json({ error: "The main administrator cannot be deleted." });
    }

    const { data, error } = await supabase.from("admins").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Admin not found" });

    console.log("[admin.delete] success for id:", id);
    return res.json({ id: data.id, deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete admin";
    console.error("[admin.delete] error", message);
    return res.status(500).json({ error: message });
  }
}

/**
 * One-time / emergency: set bcrypt password for an admin email on the live DB.
 * Requires env ADMIN_SYNC_TOKEN (long random). Send header: X-Admin-Sync-Token
 * Body JSON: { email, password } — password min 6 chars (e.g. 123456).
 * Remove ADMIN_SYNC_TOKEN from hosting env after use.
 */
export async function syncAdminCredentials(req, res) {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  const got = String(
    req.headers["x-admin-sync-token"] || req.headers["X-Admin-Sync-Token"] || ""
  ).trim();

  if (!expected || got !== expected) {
    return res.status(404).json({ error: "Not found" });
  }

  const email = asText(req.body?.email).toLowerCase();
  const password = asText(req.body?.password);
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  try {
    const supabase = req.app.locals.supabase;
    const hash = await bcrypt.hash(password, 10);

    const { data: existing, error: e1 } = await supabase.from("admins").select("id").eq("email", email).maybeSingle();
    if (e1) throw e1;

    if (existing?.id) {
      const { error: e2 } = await supabase.from("admins").update({ password_hash: hash }).eq("id", existing.id);
      if (e2) throw e2;
      console.log("[admin.sync] password updated for", email);
      return res.json({ ok: true, updated: true });
    }

    const { error: e3 } = await supabase
      .from("admins")
      .insert({ name: "Admin", email, role: "admin", password_hash: hash });
    if (e3) throw e3;
    console.log("[admin.sync] admin created for", email);
    return res.json({ ok: true, created: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync failed";
    console.error("[admin.sync] error", message);
    return res.status(500).json({ error: message });
  }
}

const UNAUTHORIZED = { error: "Invalid email or password" };

/**
 * POST /api/admin/login → mounted as POST /api/admin/login (see routes/admin.js + server.js).
 * Uses `bcrypt` (already in package.json). Peer API matches `bcryptjs` at runtime.
 */
export async function loginAdmin(req, res) {
  const email = asText(req.body?.email).toLowerCase();
  const password = asText(req.body?.password);

  console.log("EMAIL:", email);
  console.log("INPUT PASSWORD:", password);

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) {
    console.error("[admin.login] JWT_SECRET is not set");
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  try {
    const supabase = req.app.locals.supabase;
    const { user, error: lookupError } = await fetchUserForAdminLogin(supabase, email);

    if (lookupError) {
      console.error("[admin.login] Supabase lookup error:", lookupError.message || lookupError);
      throw lookupError;
    }

    console.log("USER FROM DB:", user);
    console.log("HASH:", user?.password_hash);

    if (!user || !user.password_hash) {
      console.log("COMPARE RESULT:", "(skipped — missing user or password_hash)");
      return res.status(401).json(UNAUTHORIZED);
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log("COMPARE RESULT:", isValid);

    if (!isValid) {
      return res.status(401).json(UNAUTHORIZED);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "7d" });
    return res.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to login admin";
    console.error("[admin.login]", message);
    return res.status(500).json({ error: message });
  }
}
