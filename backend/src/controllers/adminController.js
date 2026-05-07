import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
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

export async function loginAdmin(req, res) {
  const email = asText(req.body?.email).toLowerCase();
  const password = asText(req.body?.password);
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "JWT_SECRET is not configured" });
  }

  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("admins")
      .select("id,name,email,role,password_hash")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    if (!data?.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, data.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role || "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: data.id,
        email: data.email,
        name: data.name ?? "Admin",
        role: data.role ?? "admin"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to login admin";
    console.error("[admin.login] error", message);
    return res.status(500).json({ error: message });
  }
}
