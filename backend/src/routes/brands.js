import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const categoryId = typeof req.query.category_id === "string" ? req.query.category_id.trim() : "";
    console.log("CATEGORY ID RECEIVED:", categoryId);
    let query = supabase.from("brands").select("id,name,category_id");
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    console.log("BRANDS:", data);
    if (error) {
      console.error(error);
      return res.status(500).json({ error });
    }
    return res.json(data || []);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
