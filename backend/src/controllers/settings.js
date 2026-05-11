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

function mergeSocialMedia(raw) {
  const base = cloneSocialDefaults();
  if (!raw || typeof raw !== "object") return base;
  for (const id of PLATFORM_IDS) {
    const entry = raw[id];
    if (entry && typeof entry === "object") {
      base[id] = {
        enabled: Boolean(entry.enabled),
        value: typeof entry.value === "string" ? entry.value.trim() : ""
      };
    }
  }
  return base;
}

function normalizeSocialBody(body) {
  const merged = mergeSocialMedia(body);
  return merged;
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
    return res.status(500).json({ error: "Server error" });
  }
}

export async function patchSocialMedia(req, res) {
  try {
    const normalized = normalizeSocialBody(req.body ?? {});
    const supabase = req.app.locals.supabase;

    const { data: existing, error: lookupErr } = await supabase
      .from("site_settings")
      .select("id")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (lookupErr) throw lookupErr;

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
      const inserted = await supabase.from("site_settings").insert(insertPayload).select("social_media").single();
      if (inserted.error) throw inserted.error;
      return res.json(mergeSocialMedia(inserted.data?.social_media));
    }

    const updated = await supabase
      .from("site_settings")
      .update({ social_media: normalized })
      .eq("id", SETTINGS_ID)
      .select("social_media")
      .single();

    if (updated.error) throw updated.error;
    return res.json(mergeSocialMedia(updated.data?.social_media));
  } catch (error) {
    console.error("[settings.social.patch] error", error);
    return res.status(500).json({ error: "Server error" });
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
