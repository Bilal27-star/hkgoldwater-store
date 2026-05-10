/**
 * 1) Find admin user in `public.users` (same as POST /api/admin/login).
 * 2) Verify existing `password_hash` is valid bcrypt (shape + bcrypt.getRounds).
 * 3) If invalid, explains why `bcrypt.compare(plain, stored)` fails.
 * 4) Sets `password_hash` = await bcrypt.hash(PLAIN_PASSWORD, 10) (default plain "123456").
 * 5) Verifies with bcrypt.compare(plain, newHash).
 *
 * Usage (from backend/):
 *   npm run set:admin-password
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (required)
 *   ADMIN_SEED_EMAIL  (default: admin@tets.com)
 *   PLAIN_PASSWORD    (default: 123456)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import ws from "ws";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_SEED_EMAIL || "admin@tets.com").trim().toLowerCase();
const plain = process.env.PLAIN_PASSWORD ?? "123456";

/** bcrypt modular crypt: $2a$ / $2b$ / $2y$ — 60 chars total */
function looksLikeBcryptHash(value) {
  if (value == null || typeof value !== "string") return false;
  const s = value.trim();
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(s);
}

/** Shape + Node bcrypt can read cost rounds */
function isValidBcryptHash(value) {
  if (!looksLikeBcryptHash(value)) return false;
  try {
    const r = bcrypt.getRounds(value.trim());
    return Number.isFinite(r) && r > 0;
  } catch {
    return false;
  }
}

function escapeIlikeExact(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function describeWhyNotBcrypt(stored) {
  if (stored == null || stored === "") return "empty or null — nothing for bcrypt.compare() to read";
  if (typeof stored !== "string") return `not a string (got ${typeof stored})`;
  const s = stored.trim();
  if (s.length !== 60) return `length ${s.length} (valid bcrypt is 60 chars) — often truncated or wrong column`;
  if (!s.startsWith("$2")) return "does not start with $2 — not bcrypt modular crypt";
  if (!/^\$2[aby]\$/.test(s)) return "invalid bcrypt variant prefix";
  if (!looksLikeBcryptHash(s)) return "wrong charset/structure — not a bcrypt hash string";
  return "parse failed (corrupt hash)";
}

async function findUserByEmail(supabase, emailNorm) {
  const cols = "id,email,role,password_hash";
  let { data, error } = await supabase.from("users").select(cols).eq("email", emailNorm).maybeSingle();
  if (error) return { user: null, error };
  if (data) return { user: data, error: null };

  const { data: data2, error: err2 } = await supabase
    .from("users")
    .select(cols)
    .ilike("email", escapeIlikeExact(emailNorm))
    .limit(1)
    .maybeSingle();
  return { user: data2 ?? null, error: err2 };
}

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws }
});

const { user, error: fetchErr } = await findUserByEmail(supabase, email);

if (fetchErr) {
  console.error("Lookup failed:", fetchErr.message);
  process.exit(1);
}

if (!user) {
  console.error(`No user in public.users for email (exact/ilike): ${email}`);
  process.exit(1);
}

const stored = user.password_hash;
const valid = isValidBcryptHash(typeof stored === "string" ? stored : "");

console.log("\n========== password_hash verification ==========");
console.log("user id:        ", user.id);
console.log("email (row):    ", user.email);
console.log("role:           ", user.role);
console.log("valid bcrypt:   ", valid);
if (stored != null && String(stored).length > 0) {
  console.log("stored prefix:  ", String(stored).slice(0, 22) + "…");
}

if (!valid) {
  console.log("\n--- Why login fails ---");
  console.log(describeWhyNotBcrypt(stored));
  console.log(
    "bcrypt.compare(plain, storedHash) expects `storedHash` to be a full bcrypt modular crypt string.\n" +
      "Plaintext, MD5/SHA hex, Argon2, or truncated values always fail or throw.\n"
  );
}

console.log("\n========== generating bcrypt.hash(plain, 10) ==========");
console.log("plain password:", plain === "123456" ? '123456 (default — override with PLAIN_PASSWORD)' : '(from PLAIN_PASSWORD)');

const newHash = await bcrypt.hash(plain, 10);
console.log("\n--- NEW password_hash (save this for SQL backups) ---");
console.log(newHash);
console.log("--- end hash ---\n");

const verifyCompare = await bcrypt.compare(plain, newHash);
console.log("bcrypt.compare(plain, newHash):", verifyCompare, verifyCompare ? "OK" : "FAIL");

const { error: updErr } = await supabase.from("users").update({ password_hash: newHash }).eq("id", user.id);

if (updErr) {
  console.error("Database update failed:", updErr.message);
  process.exit(1);
}

console.log("\n✓ Updated public.users.password_hash for id", user.id);
console.log("You can log in with this email and password:", plain);
console.log("\nExample SQL (same hash as above — only if you paste newHash manually):");
console.log(
  `-- update public.users set password_hash = '${newHash}' where id = '${user.id}';`
);

process.exit(0);
