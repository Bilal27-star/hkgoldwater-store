import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    console.log("[route-hit] GET /api/categories");
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,created_at")
      .order("id", { ascending: true });

    if (error) {
      console.error("[categories.list] error", error);
      return res.status(500).json({ error: error.message || "Failed to fetch categories" });
    }

    return res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("[categories.list] unexpected error", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
