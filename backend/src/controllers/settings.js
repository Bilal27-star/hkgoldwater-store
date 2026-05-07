const SETTINGS_ID = 1;

const DEFAULT_SETTINGS = {
  storeName: "",
  email: "",
  phone: "",
  address: "",
  logo: "",
  footerText: ""
};

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
