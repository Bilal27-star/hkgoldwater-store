import { Router } from "express";
import auth from "../middleware/auth.js";
import { findOrCreateCart, sumCartLineTotal } from "../lib/cartUtils.js";

const router = Router();

const ORDER_SELECT =
  "id, total_amount, status, created_at, shipping_address, order_items(*)";

function normalizeUserId(id) {
  if (id === undefined || id === null) return id;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    const t = id.trim();
    if (/^\d+$/.test(t)) {
      const n = parseInt(t, 10);
      if (Number.isSafeInteger(n)) return n;
    }
    return t;
  }
  return id;
}

function validateItemsArray(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "items is required and must be a non-empty array" };
  }
  for (let i = 0; i < items.length; i += 1) {
    const line = items[i];
    const pid = line?.product_id ?? line?.productId;
    if (!pid || String(pid).trim() === "") {
      return { ok: false, error: `items[${i}].product_id is required` };
    }
    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return { ok: false, error: `items[${i}].quantity must be a positive integer` };
    }
  }
  return { ok: true };
}

function validateShippingAddress(sa) {
  if (!sa || typeof sa !== "object") {
    return { ok: false, error: "shippingAddress is required" };
  }
  if (!sa.fullName || String(sa.fullName).trim() === "") {
    return { ok: false, error: "shippingAddress.fullName is required" };
  }
  if (!sa.phone || String(sa.phone).trim() === "") {
    return { ok: false, error: "shippingAddress.phone is required" };
  }
  if (!sa.wilaya || String(sa.wilaya).trim() === "") {
    return { ok: false, error: "shippingAddress.wilaya is required" };
  }
  if (!sa.commune || String(sa.commune).trim() === "") {
    return { ok: false, error: "shippingAddress.commune is required" };
  }
  if (!sa.address || String(sa.address).trim() === "") {
    return { ok: false, error: "shippingAddress.address is required" };
  }
  return { ok: true };
}

router.post("/", auth, async (req, res) => {
  try {
    console.log("=== FULL BODY DEBUG ===");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("shipping_address:", req.body.shipping_address);
    console.log("shippingAddress:", req.body.shippingAddress);
    console.log("[route-hit] POST /api/orders");
    console.log("ORDER BODY:", req.body);

    const body = req.body;

    const items = body.items;
    const total = body.total ?? body.total_amount;

    // robust extraction (fix bug)
    const shippingAddress =
      body.shipping_address ||
      body.shippingAddress ||
      body.shipping ||
      null;

    console.log("Shipping received:", shippingAddress);

    const itemsCheck = validateItemsArray(items);
    if (!itemsCheck.ok) {
      return res.status(400).json({ error: itemsCheck.error });
    }

    const shippingCheck = validateShippingAddress(shippingAddress);
    if (!shippingCheck.ok) {
      return res.status(400).json({ error: shippingCheck.error });
    }

    const supabase = req.app.locals.supabase;
    const userId = normalizeUserId(req.user.id);
    console.log("[POST /api/orders] authenticated user id:", req.user.id, "normalized:", userId);

    const cart = await findOrCreateCart(supabase, userId);

    const { data: cartItems, error: itemsErr } = await supabase
      .from("cart_items")
      .select("product_id,quantity,products(price)")
      .eq("cart_id", cart.id);
    if (itemsErr) {
      console.error("cart_items select:", itemsErr);
      return res.status(500).json({ error: "Could not load cart" });
    }

    const rows = Array.isArray(cartItems) ? cartItems : [];

    if (!rows.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const orderItems = [];
    for (const item of rows) {
      const rawPrice =
        item.products?.price !== undefined && item.products?.price !== null
          ? item.products.price
          : item.price;
      if (rawPrice === null || rawPrice === undefined) {
        return res.status(400).json({ error: "Cart item is missing product price" });
      }
      const price = Number(rawPrice);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: "Invalid product price in cart" });
      }
      const quantity = Number(item.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({ error: "Cart contains invalid quantities" });
      }
      orderItems.push({
        product_id: String(item.product_id),
        quantity,
        price
      });
    }

    const computedSum = orderItems.reduce(
      (sum, item) => sum + sumCartLineTotal(item.price, item.quantity),
      0
    );

    const totalAmount = Number(computedSum);
    if (!Number.isFinite(totalAmount)) {
      return res.status(400).json({ error: "Order total is invalid" });
    }
    if (totalAmount <= 0) {
      return res.status(400).json({ error: "Order total must be greater than zero" });
    }

    const clientTotalRaw = total ?? req.body.total_amount;
    if (clientTotalRaw !== undefined && clientTotalRaw !== null) {
      const clientTotal = Number(clientTotalRaw);
      if (Number.isFinite(clientTotal) && Math.abs(clientTotal - totalAmount) > 0.01) {
        console.warn("ORDER: client total differs from cart total", {
          clientTotal,
          totalAmount
        });
      }
    }

    if (!shippingAddress) {
      console.error("❌ shippingAddress is NULL");
      return res.status(400).json({ error: "Shipping address missing" });
    }

    const { data: insertedRow, error: insertErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        status: "pending",

        // ✅ store full structured address (JSONB)
        shipping_address: shippingAddress,

        // ✅ ALSO store flat address for compatibility (optional but fixes admin display issues)
        address: shippingAddress.address || null
      })
      .select()
      .single();

    if (insertErr) {
      console.error("orders insert:", insertErr);
      return res.status(500).json({ error: insertErr.message || "Could not create order" });
    }

    const orderItemsPayload = orderItems.map((item) => ({
      order_id: insertedRow.id,
      product_id: String(item.product_id),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));

    const { error: itemsInsertErr } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);
    if (itemsInsertErr) {
      console.error("order_items insert:", itemsInsertErr);
      return res.status(500).json({ error: itemsInsertErr.message || "Could not save order lines" });
    }

    const { error: cartDelErr } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id);
    if (cartDelErr) {
      console.error("cart_items delete:", cartDelErr);
      return res.status(500).json({ error: cartDelErr.message || "Could not clear cart" });
    }

    const { data: createdOrder, error: fetchErr } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", insertedRow.id)
      .single();
    if (fetchErr) {
      console.error("orders fetch after insert:", fetchErr);
      return res.status(500).json({ error: fetchErr.message || "Order created but could not reload" });
    }

    res.status(201).json(createdOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Server error"
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    console.log("[route-hit] GET /api/orders");
    const userId = normalizeUserId(req.user.id);
    console.log("[GET /api/orders] authenticated user id:", req.user.id, "normalized:", userId);
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[GET /api/orders] Supabase query error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ error: error.message || "Could not load orders", code: error.code });
    }
    res.json(data || []);
  } catch (err) {
    console.error("[GET /api/orders] unhandled error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
  }
});

export default router;
