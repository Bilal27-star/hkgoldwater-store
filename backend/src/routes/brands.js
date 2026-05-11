import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const categoryId = typeof req.query.category_id === "string" ? req.query.category_id.trim() : "";
    console.log("CATEGORY ID RECEIVED:", categoryId);

    if (!categoryId) {
      const { data, error } = await supabase.from("brands").select("id,name,category_id");
      console.log("BRANDS:", data);
      if (error) {
        console.error(error);
        return res.status(500).json({ error });
      }
      return res.json(data || []);
    }

    const { data: forCategory, error: e1 } = await supabase
      .from("brands")
      .select("id,name,category_id")
      .eq("category_id", categoryId);
    if (e1) {
      console.error(e1);
      return res.status(500).json({ error: e1 });
    }

    const { data: globalBrands, error: e2 } = await supabase
      .from("brands")
      .select("id,name,category_id")
      .is("category_id", null);
    if (e2) {
      console.error(e2);
      return res.status(500).json({ error: e2 });
    }

    const seen = new Set();
    const merged = [];
    for (const row of [...(forCategory || []), ...(globalBrands || [])]) {
      if (!row?.id || seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }
    console.log("BRANDS (category + global):", merged.length);
    return res.json(merged);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
