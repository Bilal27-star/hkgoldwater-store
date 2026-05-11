/**
 * One-off: set `public.admins.password_hash` for a single email using the SAME
 * algorithm as POST /api/admin/login verification: `bcrypt` (native) cost 10.
 *
 * Does NOT touch Supabase Auth. Updates ONLY `password_hash`.
 *
 * Usage (from `backend/`, with production credentials in `.env` or exported):
 *
 *   RESET_ADMIN_CONFIRM=yes \
 *   RESET_ADMIN_EMAIL=admin@new.com \
 *   RESET_ADMIN_PASSWORD='Admin123456' \
 *   npm run reset:admin-password-once
 *
 * Safety: refuses to run unless RESET_ADMIN_CONFIRM=yes (prevents accidental execution).
 * Remove this script from the repo after production login is verified if you prefer.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import ws from "ws";

const BCRYPT_COST = 10;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.RESET_ADMIN_EMAIL || "admin@new.com").trim().toLowerCase();
const plain = process.env.RESET_ADMIN_PASSWORD;
const confirm = String(process.env.RESET_ADMIN_CONFIRM || "").trim().toLowerCase();

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!plain || typeof plain !== "string") {
  console.error("Set RESET_ADMIN_PASSWORD to the new plaintext password.");
  process.exit(1);
}
if (confirm !== "yes") {
  console.error('Refusing to run: set RESET_ADMIN_CONFIRM=yes (safety gate).');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws }
});

/** Same as adminController.createAdmin / server admin-seed / ensure-admin.mjs */
const hash = await bcrypt.hash(plain, BCRYPT_COST);

const selfCheck = await bcrypt.compare(plain, hash);
if (!selfCheck) {
  console.error("Internal error: bcrypt.compare against freshly generated hash failed.");
  process.exit(1);
}

const { data: row, error: lookupErr } = await supabase.from("admins").select("id,email").eq("email", email).maybeSingle();

if (lookupErr) {
  console.error("Lookup error:", lookupErr.message || lookupErr);
  process.exit(1);
}
if (!row?.id) {
  console.error(`No row in public.admins for email: ${email}`);
  process.exit(1);
}

const { error: updErr } = await supabase.from("admins").update({ password_hash: hash }).eq("id", row.id);

if (updErr) {
  console.error("Update error:", updErr.message || updErr);
  process.exit(1);
}

const { data: verifyRow, error: readErr } = await supabase
  .from("admins")
  .select("password_hash")
  .eq("id", row.id)
  .maybeSingle();

if (readErr || !verifyRow?.password_hash) {
  console.error("Post-update read failed:", readErr?.message || "missing password_hash");
  process.exit(1);
}

const stored = String(verifyRow.password_hash).trim();
const loginCompatible = await bcrypt.compare(plain, stored);

console.log(
  loginCompatible
    ? `✓ password_hash updated for ${email} (id ${row.id}). Login uses bcrypt.compare — verified OK.`
    : "✗ Update wrote a hash but bcrypt.compare(plain, stored) failed — investigate encoding/truncation."
);
process.exit(loginCompatible ? 0 : 1);
