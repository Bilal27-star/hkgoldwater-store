import { Router } from "express";
import auth from "../middleware/auth.js";
import { findOrCreateCart, normalizeProductId } from "../lib/cartUtils.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  try {
    console.log("[route-hit] POST /api/cart");
    const supabase = req.app.locals.supabase;
    const productId = normalizeProductId(req.body.productId);
    const quantity = Number(req.body.quantity);

    if (!productId) {
      return res.status(400).json({ error: "Invalid productId" });
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: "quantity must be a positive integer" });
    }

    const cart = await findOrCreateCart(supabase, req.user.id);
    const { data: existing, error: existingErr } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .eq("product_id", productId)
      .limit(1);
    if (existingErr) throw existingErr;

    if (existing?.[0]) {
      const prevQty = Number(existing[0].quantity);
      const nextQty =
        (Number.isFinite(prevQty) ? prevQty : 0) + quantity;
      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity: nextQty })
        .eq("id", existing[0].id)
        .select("*")
        .single();
      if (error) throw error;
      return res.json(data);
    }

    const { data, error } = await supabase
      .from("cart_items")
      .insert({ cart_id: cart.id, product_id: productId, quantity })
      .select("*")
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    console.log("[route-hit] GET /api/cart");
    const supabase = req.app.locals.supabase;
    const cart = await findOrCreateCart(supabase, req.user.id);
    const { data, error } = await supabase
      .from("cart_items")
      .select("id,cart_id,product_id,quantity,products(*)")
      .eq("cart_id", cart.id);
    if (error) throw error;
    res.json({ cartId: cart.id, items: data || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/items/:itemId", auth, async (req, res) => {
  try {
    console.log("[route-hit] DELETE /api/cart/items/:itemId");
    const supabase = req.app.locals.supabase;
    const itemId = String(req.params.itemId ?? "").trim();
    if (!itemId) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    const cart = await findOrCreateCart(supabase, req.user.id);
    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("cart_id", cart.id)
      .select("id");
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: "Item not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/product/:productId", auth, async (req, res) => {
  try {
    console.log("[route-hit] DELETE /api/cart/product/:productId");
    const supabase = req.app.locals.supabase;
    const productId = normalizeProductId(req.params.productId);
    if (!productId) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const cart = await findOrCreateCart(supabase, req.user.id);
    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("product_id", productId)
      .select("id");
    if (error) throw error;

    console.log("[DELETE /api/cart/product/:productId] remove action result:", {
      cartId: cart.id,
      productId,
      deletedRows: data?.length ?? 0
    });

    if (!data?.length) return res.status(404).json({ error: "Item not found" });
    return res.json({ success: true, removed: data.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/clear", auth, async (req, res) => {
  try {
    console.log("[route-hit] DELETE /api/cart/clear");
    const supabase = req.app.locals.supabase;
    const cart = await findOrCreateCart(supabase, req.user.id);
    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .select("id");
    if (error) throw error;
    console.log("[DELETE /api/cart/clear] remove action result:", {
      cartId: cart.id,
      deletedRows: data?.length ?? 0
    });
    return res.json({ success: true, removed: data?.length ?? 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
