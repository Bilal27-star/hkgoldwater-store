const PROFILE_SELECT = "id,name,email,phone,role,wilaya,commune,address,created_at";

/** Align JWT / route user id with Supabase column type (int vs string uuid). */
function normalizeUserId(id) {
  if (id === undefined || id === null) return id;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    const t = id.trim();
    if (/^\d+$/.test(t)) {
      const n = parseInt(t, 10);
      if (Number.isSafeInteger(n)) return n;
    }
    return t;
  }
  return id;
}

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name ?? null,
    email: row.email,
    phone: row.phone ?? null,
    role: row.role ?? "customer",
    wilaya: row.wilaya ?? null,
    commune: row.commune ?? null,
    address: row.address ?? null,
    createdAt: row.created_at ?? null
  };
}

function jsonSuccess(userRow) {
  const u = sanitizeUser(userRow);
  return { success: true, user: u, ...u };
}

function validateOptionalString(value, field, { max = 500, allowEmpty = true } = {}) {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== "string") return { ok: false, error: `${field} must be a string` };
  const t = value.trim();
  if (!t && !allowEmpty) return { ok: false, error: `${field} is required` };
  if (t.length > max) return { ok: false, error: `${field} is too long` };
  return { ok: true, value: t || null };
}

/** GET /api/users/profile */
export async function getProfile(req, res) {
  try {
    const userId = normalizeUserId(req.user.id);
    console.log("[GET /api/users/profile] hit — authenticated user id:", req.user.id, "normalized:", userId);

    const supabase = req.app.locals.supabase;
    let { data, error } = await supabase
      .from("users")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .maybeSingle();

    if (!data && req.user.email) {
      console.log("[GET /api/users/profile] no row by id, retry by email:", req.user.email);
      const r2 = await supabase
        .from("users")
        .select(PROFILE_SELECT)
        .eq("email", req.user.email)
        .maybeSingle();
      data = r2.data;
      error = r2.error;
    }

    if (error) {
      console.error("[GET /api/users/profile] Supabase error:", error.code, error.message, error.details);
      return res.status(500).json({ success: false, error: error.message || "Database error", code: error.code });
    }
    if (!data) return res.status(404).json({ success: false, error: "User not found" });

    res.json(jsonSuccess(data));
  } catch (err) {
    console.error("[GET /api/users/profile] exception:", err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Server error" });
  }
}

/** PATCH /api/users/profile */
export async function patchProfile(req, res) {
  try {
    console.log("[PATCH /api/users/profile] route hit");
    const body = req.body && typeof req.body === "object" ? req.body : {};
    console.log("[PATCH /api/users/profile] request body:", JSON.stringify(body));
    console.log("[PATCH /api/users/profile] authenticated user id:", req.user.id, "email:", req.user.email);

    const updates = {};

    const legacySnakeNameKey = ["full", "name"].join("_");
    const resolvedName =
      typeof body[legacySnakeNameKey] === "string"
        ? body[legacySnakeNameKey]
        : typeof body.fullName === "string"
          ? body.fullName
          : typeof body.name === "string"
            ? body.name
            : undefined;
    if (resolvedName !== undefined) {
      const nm = resolvedName.trim();
      if (nm.length < 2) {
        return res.status(400).json({ success: false, error: "Full name must be at least 2 characters" });
      }
      if (nm.length > 120) {
        return res.status(400).json({ success: false, error: "Full name is too long" });
      }
      updates.name = nm;
    }

    if ("phone" in body) {
      const r = validateOptionalString(body.phone, "Phone", { max: 40 });
      if (!r.ok) return res.status(400).json({ success: false, error: r.error });
      if (r.value !== undefined) updates.phone = r.value;
    }

    if ("wilaya" in body) {
      const r = validateOptionalString(body.wilaya, "Wilaya", { max: 80 });
      if (!r.ok) return res.status(400).json({ success: false, error: r.error });
      if (r.value !== undefined) updates.wilaya = r.value;
    }

    if ("commune" in body) {
      const r = validateOptionalString(body.commune, "Commune", { max: 80 });
      if (!r.ok) return res.status(400).json({ success: false, error: r.error });
      if (r.value !== undefined) updates.commune = r.value;
    }

    if ("address" in body) {
      const r = validateOptionalString(body.address, "Address", { max: 500 });
      if (!r.ok) return res.status(400).json({ success: false, error: r.error });
      if (r.value !== undefined) updates.address = r.value;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields to update" });
    }

    console.log("[PATCH /api/users/profile] applying updates:", updates);

    const supabase = req.app.locals.supabase;
    const userId = normalizeUserId(req.user.id);

    let { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (!data && !error && req.user.email) {
      console.log("[PATCH /api/users/profile] no row updated by id; retry with email:", req.user.email);
      const r2 = await supabase
        .from("users")
        .update(updates)
        .eq("email", req.user.email)
        .select(PROFILE_SELECT)
        .maybeSingle();
      data = r2.data;
      error = r2.error;
    }

    if (error) {
      console.error("[PATCH /api/users/profile] Supabase update error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({
        success: false,
        error: error.message || "Database update failed",
        code: error.code,
        details: error.details
      });
    }

    if (!data) {
      console.error("[PATCH /api/users/profile] no row returned after update; userId:", userId);
      return res.status(404).json({ success: false, error: "User not found or could not be updated" });
    }

    console.log("[PATCH /api/users/profile] Supabase update OK — row id:", data.id);
    res.json(jsonSuccess(data));
  } catch (err) {
    console.error("[PATCH /api/users/profile] exception:", err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Server error" });
  }
}

/** Mount profile handlers from server.js with app.get / app.patch for reliable routing. */
