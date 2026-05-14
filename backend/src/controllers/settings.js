import {
  applySocialValueNormalization,
  formatSupabaseWriteError,
  validateSocialMediaState
} from "../utils/socialMediaNormalize.js";

const SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
  storeName: "",
  email: "",
  phone: "",
  address: "",
  logo: "",
  footerText: ""
};

/** Matches storefront admin Social Media defaults — merged with DB jsonb. */
const DEFAULT_SOCIAL_MEDIA = {
  facebook: { enabled: true, value: "" },
  instagram: { enabled: true, value: "" },
  tiktok: { enabled: false, value: "" },
  whatsapp: { enabled: true, value: "" }
};

const PLATFORM_IDS = ["facebook", "instagram", "tiktok", "whatsapp"];

function cloneSocialDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SOCIAL_MEDIA));
}

function socialEntryString(entry, keys) {
  if (!entry || typeof entry !== "object") return "";
  for (const k of keys) {
    const v = entry[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function coerceEnabled(raw) {
  if (raw === false || raw === 0) return false;
  if (raw === true || raw === 1) return true;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "false" || s === "0" || s === "") return false;
    if (s === "true" || s === "1") return true;
  }
  return Boolean(raw);
}

function mergeSocialMedia(raw) {
  const base = cloneSocialDefaults();
  if (!raw || typeof raw !== "object") return base;
  for (const id of PLATFORM_IDS) {
    const entry = raw[id];
    if (entry && typeof entry === "object") {
      base[id] = {
        enabled: coerceEnabled(entry.enabled),
        value: socialEntryString(entry, ["value", "url", "link", "href"])
      };
    }
  }
  return base;
}

function cloneJsonSafe(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return mergeSocialMedia(null);
  }
}

/**
 * Merge request body, normalize URLs / WhatsApp, validate enabled fields.
 * @returns {{ ok: true, data: object } | { ok: false, status: number, error: string, field?: string }}
 */
function normalizeSocialBody(body) {
  let merged;
  try {
    merged = mergeSocialMedia(body ?? {});
  } catch {
    return { ok: false, status: 400, error: "Invalid social media payload." };
  }

  const hadValue = {};
  for (const id of PLATFORM_IDS) {
    hadValue[id] = Boolean(String(merged[id]?.value ?? "").trim());
  }

  try {
    applySocialValueNormalization(merged);
  } catch {
    return { ok: false, status: 400, error: "Could not process social media values." };
  }

  for (const id of PLATFORM_IDS) {
    if (merged[id]?.enabled && hadValue[id] && !String(merged[id]?.value ?? "").trim()) {
      return {
        ok: false,
        status: 400,
        error: `${id}: value could not be normalized to a safe URL or number.`,
        field: id
      };
    }
  }

  const v = validateSocialMediaState(merged);
  if (!v.ok) {
    return { ok: false, status: 400, error: v.message, field: v.field };
  }

  return { ok: true, data: cloneJsonSafe(merged) };
}

function mapSettingsRow(row) {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    storeName: row.store_name || "",
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    logo: row.logo || "",
    footerText: row.footer_text || ""
  };
}

export async function getSettings(req, res) {
  try {
    const supabase = req.app.locals.supabase;
    const result = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();
    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);
    return res.json(mapSettingsRow(result.data));
  } catch (error) {
    console.error("[settings.get] error", error);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function getSocialMedia(req, res) {
  try {
    const supabase = req.app.locals.supabase;
    const result = await supabase
      .from("site_settings")
      .select("social_media")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (result.error) {
      console.warn("[settings.social.get]", result.error.message || result.error);
      return res.json(mergeSocialMedia(null));
    }

    return res.json(mergeSocialMedia(result.data?.social_media));
  } catch (error) {
    console.error("[settings.social.get] error", error);
    return res.json(mergeSocialMedia(null));
  }
}

export async function patchSocialMedia(req, res) {
  const parsed = normalizeSocialBody(req.body ?? {});
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error, field: parsed.field });
  }
  const normalized = parsed.data;

  try {
    const supabase = req.app.locals.supabase;

    const { data: existing, error: lookupErr } = await supabase
      .from("site_settings")
      .select("id")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (lookupErr) {
      console.error("[settings.social.patch] lookup", lookupErr);
      return res.status(500).json({ error: formatSupabaseWriteError(lookupErr) });
    }

    if (!existing) {
      const insertPayload = {
        id: SETTINGS_ID,
        store_name: "",
        email: "",
        phone: "",
        address: "",
        logo: "",
        footer_text: "",
        social_media: normalized
      };
      const inserted = await supabase.from("site_settings").insert(insertPayload).select("social_media").maybeSingle();
      if (inserted.error) {
        console.error("[settings.social.patch] insert", inserted.error);
        const msg = formatSupabaseWriteError(inserted.error);
        return res.status(500).json({ error: msg });
      }
      return res.json(mergeSocialMedia(inserted.data?.social_media ?? normalized));
    }

    const updated = await supabase
      .from("site_settings")
      .update({ social_media: normalized })
      .eq("id", SETTINGS_ID)
      .select("social_media")
      .maybeSingle();

    if (updated.error) {
      console.error("[settings.social.patch] update", updated.error);
      const msg = formatSupabaseWriteError(updated.error);
      return res.status(500).json({ error: msg });
    }

    return res.json(mergeSocialMedia(updated.data?.social_media ?? normalized));
  } catch (error) {
    console.error("[settings.social.patch] unexpected", error);
    const msg = error instanceof Error ? error.message : formatSupabaseWriteError(error);
    return res.status(500).json({ error: msg || "Could not save social settings." });
  }
}

export async function patchSettings(req, res) {
  try {
    const body = req.body ?? {};
    const payload = {
      id: SETTINGS_ID,
      store_name: typeof body.storeName === "string" ? body.storeName : "",
      email: typeof body.email === "string" ? body.email : "",
      phone: typeof body.phone === "string" ? body.phone : "",
      address: typeof body.address === "string" ? body.address : "",
      logo: typeof body.logo === "string" ? body.logo : "",
      footer_text: typeof body.footerText === "string" ? body.footerText : ""
    };

    const supabase = req.app.locals.supabase;
    const result = await supabase
      .from("site_settings")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);
    return res.json(mapSettingsRow(result.data));
  } catch (error) {
    console.error("[settings.patch] error", error);
    return res.status(500).json({ error: "Server error" });
  }
}
