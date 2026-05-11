import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function supabaseProjectHost() {
  try {
    return new URL(process.env.SUPABASE_URL || "about:blank").hostname;
  } catch {
    return "(invalid SUPABASE_URL)";
  }
}

/** Structured logs for Render/production (no plaintext password, no full bcrypt hash). */
function adminLoginLog(reqId, step, payload) {
  console.log(
    JSON.stringify({
      component: "admin.login",
      reqId,
      step,
      ts: new Date().toISOString(),
      ...payload
    })
  );
}

function describeStoredPasswordHash(hash) {
  if (hash == null || hash === "") {
    return { present: false, kind: "empty", length: 0, prefix: null };
  }
  const s = String(hash).trim();
  const looksBcrypt = /^\$2[aby]\$\d{2}\$/.test(s) && s.length >= 59;
  return {
    present: true,
    kind: looksBcrypt ? "bcrypt" : "non_bcrypt_or_truncated",
    length: s.length,
    prefix: looksBcrypt ? `${s.slice(0, 7)}…` : "(not bcrypt shape)"
  };
}

function bcryptRoundsSafe(hash) {
  if (!hash || typeof hash !== "string") return null;
  try {
    return bcrypt.getRounds(hash.trim());
  } catch {
    return null;
  }
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
 * POST /api/admin/login — custom auth only:
 * - Reads `public.admins` via Supabase **service role** (PostgREST). **Supabase Auth (GoTrue) is not used.**
 * - Verifies password with **bcrypt.compare** against `password_hash`.
 * - Emits structured JSON logs (see `adminLoginLog`) — never logs plaintext password or full hash.
 */
export async function loginAdmin(req, res) {
  const reqId = crypto.randomUUID ? crypto.randomUUID() : `login-${Date.now()}`;
  const email = asText(req.body?.email).toLowerCase();
  const password = asText(req.body?.password);

  adminLoginLog(reqId, "request_received", {
    authMode: "custom_public_admins_table",
    supabaseAuthGoTrue: "not_invoked_admin_uses_service_role_postgrest_only",
    supabaseProjectHost: supabaseProjectHost(),
    incomingEmail: email || "(empty)",
    providedPasswordLength: password.length,
    productionEnvHints: {
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  });

  if (!email || !password) {
    adminLoginLog(reqId, "validation_failed", { reason: "missing_email_or_password" });
    return res.status(400).json({ error: "email and password are required" });
  }

  const SECRET = process.env.JWT_SECRET;
  if (!SECRET) {
    adminLoginLog(reqId, "config_error", { reason: "JWT_SECRET_missing" });
    console.error("[admin.login] JWT_SECRET is not set");
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  try {
    const supabase = req.app.locals.supabase;
    const { user, error: lookupError } = await fetchUserForAdminLogin(supabase, email);

    if (lookupError) {
      adminLoginLog(reqId, "admin_lookup_error", {
        incomingEmail: email,
        postgrestError: {
          message: lookupError.message || String(lookupError),
          code: lookupError.code ?? null,
          details: lookupError.details ?? null,
          hint: lookupError.hint ?? null
        }
      });
      console.error("[admin.login] Supabase lookup error:", lookupError.message || lookupError);
      throw lookupError;
    }

    adminLoginLog(reqId, "admin_lookup_result", {
      incomingEmail: email,
      rowFound: Boolean(user),
      adminId: user?.id ?? null,
      rowEmail: user?.email ?? null,
      role: user?.role ?? null,
      storedPasswordHash: describeStoredPasswordHash(user?.password_hash)
    });

    if (!user) {
      adminLoginLog(reqId, "auth_failed", { reason: "no_admin_row_for_email", httpStatus: 401 });
      return res.status(401).json(UNAUTHORIZED);
    }

    const storedHash = user.password_hash != null ? String(user.password_hash).trim() : "";
    if (!storedHash) {
      adminLoginLog(reqId, "auth_blocked", { reason: "password_hash_empty_on_row", adminId: user.id, httpStatus: 403 });
      return res.status(403).json({
        error:
          "This admin row has no password_hash. Set it in Table Editor → public.admins, or run API seed (ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD on the host), or POST /api/admin/sync-credentials."
      });
    }

    let isValid = false;
    let compareThrown = null;
    try {
      isValid = await bcrypt.compare(password, storedHash);
    } catch (compareErr) {
      compareThrown = compareErr instanceof Error ? compareErr.message : String(compareErr);
    }

    adminLoginLog(reqId, "password_compare_result", {
      incomingEmail: email,
      adminId: user.id,
      bcryptCompareResult: isValid,
      compareThrew: compareThrown != null,
      compareError: compareThrown,
      storedHashKind: describeStoredPasswordHash(storedHash).kind,
      storedHashLength: storedHash.length,
      bcryptRounds: bcryptRoundsSafe(storedHash)
    });

    if (!isValid) {
      adminLoginLog(reqId, "auth_failed", { reason: "bcrypt_mismatch_or_invalid_hash", httpStatus: 401 });
      return res.status(401).json(UNAUTHORIZED);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "7d" });
    adminLoginLog(reqId, "auth_success", { adminId: user.id, role: user.role, httpStatus: 200 });
    return res.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to login admin";
    adminLoginLog(reqId, "server_error", { message });
    console.error("[admin.login]", message);
    return res.status(500).json({ error: message });
  }
}
