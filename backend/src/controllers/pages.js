const ALLOWED_KEYS = new Set(["about", "shipping", "terms", "privacy"]);

function mapPageRow(row) {
  return {
    key: row.page_key,
    title: row.title || "",
    contentHtml: row.content_html || "",
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

export async function getPages(req, res) {
  try {
    const supabase = req.app.locals.supabase;
    const result = await supabase
      .from("site_pages")
      .select("*")
      .order("page_key", { ascending: true });
    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);
    return res.json(Array.isArray(result.data) ? result.data.map(mapPageRow) : []);
  } catch (error) {
    console.error("[pages.get] error", error);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function patchPages(req, res) {
  try {
    const body = req.body ?? {};
    const inputPages = Array.isArray(body.pages) ? body.pages : [];
    const rows = inputPages
      .filter((page) => page && typeof page === "object" && ALLOWED_KEYS.has(String(page.key)))
      .map((page) => ({
        page_key: String(page.key),
        title: typeof page.title === "string" ? page.title : "",
        content_html: typeof page.contentHtml === "string" ? page.contentHtml : "",
        updated_at: new Date().toISOString()
      }));

    if (rows.length === 0) {
      return res.status(400).json({ error: "No valid pages provided" });
    }

    const supabase = req.app.locals.supabase;
    const result = await supabase
      .from("site_pages")
      .upsert(rows, { onConflict: "page_key" })
      .select("*");
    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);

    return res.json(Array.isArray(result.data) ? result.data.map(mapPageRow) : []);
  } catch (error) {
    console.error("[pages.patch] error", error);
    return res.status(500).json({ error: "Server error" });
  }
}
