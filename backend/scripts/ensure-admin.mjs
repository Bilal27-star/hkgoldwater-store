/**
 * Seed/repair the admin row used by POST /api/admin/login.
 *
 * The login controller reads from the `admins` table (see adminController.js
 * fetchUserForAdminLogin). This script writes there first; if the project
 * doesn't have an `admins` table it falls back to `users`. Either way the
 * password is bcrypt-hashed with cost 10.
 *
 * Usage (from backend/):
 *   npm run seed:admin
 *
 * Env (defaults match the credentials the user wants to log in with):
 *   SUPABASE_URL                  (required)
 *   SUPABASE_SERVICE_ROLE_KEY     (required)
 *   ADMIN_SEED_EMAIL              (default admin@new.com)
 *   ADMIN_SEED_PASSWORD           (default admin123!)
 *   ADMIN_SEED_NAME               (default Admin)
 *   ADMIN_SEED_ROLE               (default admin)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import ws from "ws";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_SEED_EMAIL || "admin@new.com").trim().toLowerCase();
const plain = process.env.ADMIN_SEED_PASSWORD || "admin123!";
const name = process.env.ADMIN_SEED_NAME || "Admin";
const role = (process.env.ADMIN_SEED_ROLE || "admin").trim().toLowerCase();

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws }
});

const hash = await bcrypt.hash(plain, 10);

/** Postgrest "table not found" → PGRST205. We treat those as "try next table". */
function isMissingTableError(err) {
  if (!err) return false;
  const code = err.code || err.statusCode || "";
  const msg = String(err.message || "").toLowerCase();
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("could not find the table") ||
    msg.includes("relation") && msg.includes("does not exist")
  );
}

async function upsertAdmin(table) {
  const lookup = await supabase.from(table).select("id").eq("email", email).maybeSingle();
  if (lookup.error) {
    if (isMissingTableError(lookup.error)) return { skipped: true };
    throw lookup.error;
  }

  if (lookup.data?.id) {
    const upd = await supabase
      .from(table)
      .update({ password_hash: hash, role })
      .eq("id", lookup.data.id);
    if (upd.error) throw upd.error;
    return { table, action: "updated", id: lookup.data.id };
  }

  const ins = await supabase.from(table).insert({
    name,
    email,
    role,
    password_hash: hash
  });
  if (ins.error) {
    if (isMissingTableError(ins.error)) return { skipped: true };
    throw ins.error;
  }
  return { table, action: "inserted" };
}

let result;
try {
  result = await upsertAdmin("admins");
  if (result.skipped) {
    console.log("Table `admins` not found — falling back to `users`.");
    result = await upsertAdmin("users");
  }
} catch (err) {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
}

if (!result || result.skipped) {
  console.error("Could not find an `admins` or `users` table to write to.");
  process.exit(1);
}

console.log(`✓ ${result.action} admin in \`${result.table}\``);
console.log(`  email:    ${email}`);
console.log(`  password: ${plain}`);
console.log(`  role:     ${role}`);
console.log("\nNow open the admin panel and sign in with those credentials.");

process.exit(0);
