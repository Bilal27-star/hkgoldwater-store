import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    console.log("[route-hit] GET /api/categories");
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase.from("categories").select("id,name");
    console.log("CATEGORIES RAW:", data);
    console.log("ERROR:", error);
    if (error) {
      console.error(error);
      return res.status(500).json({ error });
    }
    return res.json(data || []);
  } catch (error) {
    console.error("[categories.list] unexpected error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
