/** Max length per platform value (jsonb safety). */
const MAX_VALUE_LEN = 2048;

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeWebUrlForStorage(raw) {
  let t = String(raw ?? "").trim().slice(0, MAX_VALUE_LEN);
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return "";
  }
  try {
    if (/^https?:\/\//i.test(t)) {
      return new URL(t).toString();
    }
    if (t.startsWith("//")) {
      return new URL(`https:${t}`).toString();
    }
    const stripped = t.replace(/^\/+/, "");
    if (!stripped) return "";
    return new URL(`https://${stripped}`).toString();
  } catch {
    return "";
  }
}

/**
 * Store WhatsApp as digits-only (wa.me) or pass through safe https links.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeWhatsappStorageValue(raw) {
  let t = String(raw ?? "").trim().slice(0, MAX_VALUE_LEN);
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return "";
  }
  if (/^https?:\/\//i.test(t)) {
    try {
      return new URL(t).toString();
    } catch {
      return "";
    }
  }
  // Spaces, +, dashes, parentheses removed; keep digits only
  let digits = t.replace(/\D/g, "");
  // Trim meaningless leading zeros only when length would still be plausible (avoid wiping "0")
  if (digits.length > 10 && digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "") || "0";
  }
  return digits.slice(0, 20);
}

/**
 * @param {string} platformId
 * @param {string} value
 * @returns {{ ok: true } | { ok: false, message: string, field: string }}
 */
export function validateSocialPlatformValue(platformId, value) {
  const v = String(value ?? "").trim();
  if (!v) return { ok: true };

  if (platformId === "whatsapp") {
    if (/^https?:\/\//i.test(v)) {
      try {
        new URL(v);
        return { ok: true };
      } catch {
        return { ok: false, message: "WhatsApp: invalid link format.", field: platformId };
      }
    }
    const digits = v.replace(/\D/g, "");
    if (digits.length < 8) {
      return {
        ok: false,
        message: "WhatsApp: use a full number with country code (at least 8 digits), or a https://wa.me/… link.",
        field: platformId
      };
    }
    return { ok: true };
  }

  try {
    const u = new URL(v);
    if (!/^https?:$/i.test(u.protocol)) {
      return { ok: false, message: `${platformId}: URL must start with http:// or https://.`, field: platformId };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: `${platformId}: enter a valid URL (e.g. https://www.facebook.com/your-page).`, field: platformId };
  }
}

/**
 * @param {Record<string, { enabled?: boolean; value?: string }>} state
 * @returns {{ ok: true } | { ok: false, message: string, field: string }}
 */
export function validateSocialMediaState(state) {
  const ids = ["facebook", "instagram", "tiktok", "whatsapp"];
  for (const id of ids) {
    const entry = state[id];
    if (!entry || !entry.enabled) continue;
    const raw = String(entry.value ?? "").trim();
    if (!raw) continue;
    const v = validateSocialPlatformValue(id, raw);
    if (!v.ok) return v;
  }
  return { ok: true };
}

/**
 * Apply URL / phone normalization per platform (mutates a plain merged object).
 * @param {Record<string, { enabled?: boolean; value?: string }>} merged
 */
export function applySocialValueNormalization(merged) {
  const ids = ["facebook", "instagram", "tiktok", "whatsapp"];
  for (const id of ids) {
    const entry = merged[id];
    if (!entry || typeof entry !== "object") continue;
    const raw = String(entry.value ?? "").trim();
    if (!raw) {
      entry.value = "";
      continue;
    }
    if (id === "whatsapp") {
      entry.value = normalizeWhatsappStorageValue(raw);
    } else {
      entry.value = normalizeWebUrlForStorage(raw);
    }
  }
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function formatSupabaseWriteError(err) {
  if (!err) return "Could not save social settings.";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "Could not save social settings.";
}
