function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pickLocalizedText(value, lang = "en") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value;
    const candidate =
      asText(obj[lang]) || asText(obj.en) || asText(obj.fr) || asText(obj.ar);
    return candidate;
  }
  return asText(value);
}

function toLocalizedObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value;
    const fr = asText(obj.fr) || asText(obj.en) || asText(obj.ar);
    const en = asText(obj.en) || fr || asText(obj.ar);
    const ar = asText(obj.ar) || fr || en;
    return { fr, en, ar };
  }
  const text = asText(value);
  // Placeholder fallback: duplicate source text until real translation service is wired.
  return { fr: text, en: text, ar: text };
}

function asNumber(value) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function asNullableText(value) {
  const text = asText(value);
  return text || null;
}

function asCategoryId(body) {
  const fromSnake = asText(body.category_id);
  if (fromSnake) return fromSnake;
  return asText(body.categoryId);
}

function asImageUrl(body) {
  const fromImageUrl = asText(body.image_url);
  if (fromImageUrl) return fromImageUrl;
  return asText(body.image);
}

function asBrandId(body) {
  const fromSnake = asText(body.brand_id);
  if (fromSnake) return fromSnake;
  return asText(body.brandId);
}

function mapRowToApiProduct(row) {
  const rawCategory =
    row.category && typeof row.category === "object" && !Array.isArray(row.category)
      ? row.category
      : Array.isArray(row.category) && row.category[0]
        ? row.category[0]
        : null;
  const rawBrand =
    row.brand_relation && typeof row.brand_relation === "object" && !Array.isArray(row.brand_relation)
      ? row.brand_relation
      : Array.isArray(row.brand_relation) && row.brand_relation[0]
        ? row.brand_relation[0]
        : null;
  return {
    id: row.id,
    name: toLocalizedObject(row.name),
    description: toLocalizedObject(row.description),
    price: row.price ?? null,
    stock: row.stock ?? 0,
    category_id: row.category_id ?? null,
    category: rawCategory
      ? {
          id: rawCategory.id ?? row.category_id ?? null,
          name: rawCategory.name ?? ""
        }
      : null,
    brand_id: row.brand_id ?? rawBrand?.id ?? null,
    brand: rawBrand
      ? {
          id: rawBrand.id ?? row.brand_id ?? null,
          name: rawBrand.name ?? "",
          category_id: rawBrand.category_id ?? null
        }
      : null,
    brand_name: rawBrand?.name ?? null,
    image: row.image ?? row.image_url ?? null,
    image_url: row.image_url ?? row.image ?? null
  };
}

export async function listProducts(req, res) {
  try {
    console.log("[route-hit] GET /api/products");

    const supabase = req.app.locals.supabase;
    const result = await supabase
      .from("products")
      .select("*, category:categories(id,name), brand_relation:brands(id,name,category_id)")
      .order("created_at", { ascending: false });
    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);
    const products = Array.isArray(result.data) ? result.data.map(mapRowToApiProduct) : [];
    console.log("DB PRODUCTS:", products);
    console.log("Fetched products:", products);
    res.json(products);
  } catch (err) {
    console.error("[products.list] error", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function getProductById(req, res) {
  try {
    const supabase = req.app.locals.supabase;
    const id = String(req.params.id);

    const result = await supabase
      .from("products")
      .select("*, category:categories(id,name), brand_relation:brands(id,name,category_id)")
      .eq("id", id)
      .maybeSingle();

    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);
    if (!result.data) return res.status(404).json({ error: "Product not found" });

    res.json(mapRowToApiProduct(result.data));
  } catch (err) {
    console.error("[products.getById] error", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createProduct(req, res) {
  const body = req.body ?? {};
  console.log("Incoming product:", req.body);
  console.log("Creating product:", req.body);
  const { name: rawName, description: rawDescription, price: rawPrice } = body;
  const name = toLocalizedObject(rawName);
  const description = toLocalizedObject(rawDescription);
  const price = asNumber(rawPrice);
  const categoryId = asCategoryId(body);
  const brandId = asBrandId(body);
  const imageUrl = asImageUrl(body);
  const stockRaw = body.stock;
  const stockParsed = asNumber(stockRaw);
  const stock = Number.isFinite(stockParsed) ? Math.max(0, Math.trunc(stockParsed)) : 0;

  if (!asText(name.en) && !asText(name.fr) && !asText(name.ar)) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!Number.isFinite(price)) {
    return res.status(400).json({ error: "price is required and must be numeric" });
  }
  if (!categoryId) {
    return res.status(400).json({ error: "category_id is required" });
  }

  try {
    const supabase = req.app.locals.supabase;
    const categoryCheck = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();
    if (categoryCheck.error) throw categoryCheck.error;
    if (!categoryCheck.data) {
      return res.status(400).json({ error: "Invalid category_id" });
    }

    let resolvedBrandId = null;
    if (brandId) {
      const brandCheck = await supabase
        .from("brands")
        .select("id,name,category_id")
        .eq("id", brandId)
        .maybeSingle();
      if (brandCheck.error) throw brandCheck.error;
      if (!brandCheck.data) {
        return res.status(400).json({ error: "Invalid brand_id" });
      }
      if (brandCheck.data.category_id !== categoryId) {
        return res.status(400).json({ error: "brand_id does not belong to selected category" });
      }
      resolvedBrandId = brandCheck.data.id;
    }

    const basePayload = {
      name,
      description,
      price,
      stock,
      category_id: categoryId,
      brand_id: resolvedBrandId,
      // Do not store brand display text in products table.
      brand: null
    };

    // Try API-contract columns first, then fallback to legacy schema keys.
    let insertPayload = {
      ...basePayload,
      image_url: imageUrl || null
    };
    let attempt = await supabase.from("products").insert(insertPayload).select("*").single();

    if (attempt.error) {
      console.error("[products.create] insert attempt #1 failed", attempt.error);
      insertPayload = {
        ...basePayload,
        image: imageUrl || null
      };
      attempt = await supabase.from("products").insert(insertPayload).select("*").single();
    }

    if (attempt.error) {
      console.error("[products.create] insert failed", attempt.error);
      return res.status(500).json({ error: attempt.error.message || "Failed to create product" });
    }

    const createdProduct = await supabase
      .from("products")
      .select("*, category:categories(id,name), brand_relation:brands(id,name,category_id)")
      .eq("id", attempt.data.id)
      .maybeSingle();
    if (createdProduct.error) {
      console.error("[products.create] failed to load created product relations", createdProduct.error);
      return res
        .status(500)
        .json({ error: createdProduct.error.message || "Failed to fetch created product" });
    }

    console.log("DB RESPONSE:", createdProduct.data);
    const product = mapRowToApiProduct(createdProduct.data);
    console.log("Created product:", product);
    return res.status(201).json(product);
  } catch (error) {
    console.error("[products.create] unexpected error", error);
    const message = error instanceof Error ? error.message : "Failed to create product";
    return res.status(400).json({ error: message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const supabase = req.app.locals.supabase;
    const id = String(req.params.id || "").trim();
    console.log("Deleting product ID:", id);
    if (!id) return res.status(400).json({ error: "Product id is required" });

    // Remove FK dependencies first so product delete cannot fail on references.
    const clearOrderItems = await supabase
      .from("order_items")
      .update({ product_id: null })
      .eq("product_id", id);
    if (clearOrderItems.error) throw clearOrderItems.error;
    console.log("DB RESPONSE:", clearOrderItems.data);

    const deleteCartItems = await supabase
      .from("cart_items")
      .delete()
      .eq("product_id", id);
    if (deleteCartItems.error) throw deleteCartItems.error;
    console.log("DB RESPONSE:", deleteCartItems.data);

    const deleteImages = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);
    if (deleteImages.error) throw deleteImages.error;
    console.log("DB RESPONSE:", deleteImages.data);

    const result = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);

    if (!result.data) return res.status(404).json({ error: "Product not found" });
    return res.json({ id: result.data.id, deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    console.error("[products.delete] error", message);
    return res.status(500).json({ error: message });
  }
}
