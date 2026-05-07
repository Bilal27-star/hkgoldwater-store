import { Router } from "express";

const router = Router();
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get("/", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const categoryId =
      typeof req.query.category_id === "string" ? req.query.category_id.trim() : "";

    console.log("[GET /api/brands] category_id:", categoryId || "(missing)");

    if (!categoryId) {
      return res.status(400).json({ error: "category_id query parameter is required" });
    }

    if (!UUID_V4_REGEX.test(categoryId)) {
      return res.status(400).json({ error: "Invalid category_id format" });
    }

    const query = supabase
      .from("brands")
      .select("id,name,category_id")
      .eq("category_id", categoryId)
      .order("name", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    console.log("[GET /api/brands] returned brands:", data);

    return res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch brands";
    return res.status(500).json({ error: message });
  }
});

export default router;
