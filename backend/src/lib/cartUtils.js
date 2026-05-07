/**
 * Product IDs in DB are UUID strings — never parseInt.
 */
export function normalizeProductId(raw) {
  if (raw === undefined || raw === null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  ) {
    return "";
  }
  return s;
}

export async function findOrCreateCart(supabase, userId) {
  const normalizedUserId =
    typeof userId === "string" && /^\d+$/.test(userId.trim())
      ? parseInt(userId.trim(), 10)
      : userId;
  const { data: existing, error: getErr } = await supabase
    .from("cart")
    .select("*")
    .eq("user_id", normalizedUserId)
    .limit(1);
  if (getErr) throw getErr;
  if (existing?.[0]) return existing[0];

  const { data: created, error: createErr } = await supabase
    .from("cart")
    .insert({ user_id: normalizedUserId })
    .select("*")
    .single();
  if (createErr) throw createErr;
  return created;
}

export function sumCartLineTotal(price, quantity) {
  const p = Number(price);
  const q = Number(quantity);
  if (!Number.isFinite(p) || p < 0) return 0;
  if (!Number.isFinite(q) || q < 1) return 0;
  return p * q;
}
