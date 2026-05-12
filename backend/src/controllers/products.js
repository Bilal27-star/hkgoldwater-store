import {
  extractProductsBucketPath,
  normalizeImageRefForDb,
  removeProductPathsFromStorage,
  uploadProductFilesToStorage
} from "../utils/productStorage.js";

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

function mapRowToApiProduct(row, extraImageUrls) {
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
  const fallbackSingle =
    row.image_url || row.image ? [String(row.image_url ?? row.image)] : [];
  const images =
    Array.isArray(extraImageUrls) && extraImageUrls.length > 0 ? extraImageUrls : fallbackSingle;
  const primary = images[0] ?? row.image ?? row.image_url ?? null;
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
    image: primary,
    image_url: primary,
    images
  };
}

async function fetchProductImageUrls(supabase, productId) {
  const res = await supabase
    .from("product_images")
    .select("url, image_url, sort_order")
    .eq("product_id", productId);
  if (res.error || !Array.isArray(res.data)) return [];
  return [...res.data]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r) => r.url || r.image_url)
    .filter(Boolean);
}

async function persistProductImages(supabase, productId, urls) {
  for (let i = 0; i < urls.length; i++) {
    const row = { product_id: productId, url: urls[i], sort_order: i };
    let ins = await supabase.from("product_images").insert(row);
    if (ins.error) {
      ins = await supabase.from("product_images").insert({
        product_id: productId,
        image_url: urls[i],
        sort_order: i
      });
      if (ins.error) console.error("[products] product_images insert failed", ins.error);
    }
  }
}

export async function listProducts(req, res) {
  try {
    console.log("[route-hit] GET /api/products");

    const supabase = req.app.locals.supabase;
    const result = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (result.error) throw result.error;
    console.log("DB RESPONSE:", result.data);
    const products = Array.isArray(result.data) ? result.data : [];
    console.log("Fetched products:", products);
    const ids = products.map((p) => p.id).filter(Boolean);
    const imagesByProduct = {};
    if (ids.length) {
      const imgRes = await supabase
        .from("product_images")
        .select("product_id, url, image_url, sort_order")
        .in("product_id", ids);
      if (!imgRes.error && Array.isArray(imgRes.data)) {
        const sorted = [...imgRes.data].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        for (const row of sorted) {
          const u = row.url || row.image_url;
          if (!u) continue;
          const pid = row.product_id;
          if (!imagesByProduct[pid]) imagesByProduct[pid] = [];
          imagesByProduct[pid].push(u);
        }
      }
    }
    res.json(products.map((p) => mapRowToApiProduct(p, imagesByProduct[p.id])));
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

    const extraUrls = await fetchProductImageUrls(supabase, id);
    res.json(mapRowToApiProduct(result.data, extraUrls));
  } catch (err) {
    console.error("[products.getById] error", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function createProduct(req, res) {
  const body = req.body ?? {};
  console.log("Incoming product:", req.body);
  console.log("Creating product:", req.body);
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  const supabaseBase = process.env.SUPABASE_URL || "";
  const { name: rawName, description: rawDescription, price: rawPrice } = body;
  const name = toLocalizedObject(rawName);
  const description = toLocalizedObject(rawDescription);
  const price = asNumber(rawPrice);
  const categoryId = asCategoryId(body);
  const brandId = asBrandId(body);
  const imageUrlRaw = asImageUrl(body);
  const normalizedBodyImage = normalizeImageRefForDb(imageUrlRaw, supabaseBase);
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

    let storagePaths = [];
    if (uploadedFiles.length) {
      try {
        storagePaths = await uploadProductFilesToStorage(supabase, uploadedFiles);
      } catch (uploadErr) {
        console.error("[products.create] storage upload failed", uploadErr);
        const message =
          uploadErr instanceof Error ? uploadErr.message : "Product image upload failed";
        return res.status(500).json({ error: message });
      }
    }

    const resolvedPrimaryImage = storagePaths[0] ?? normalizedBodyImage ?? null;

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
      image_url: resolvedPrimaryImage || null
    };
    let attempt = await supabase.from("products").insert(insertPayload).select("*").single();

    if (attempt.error) {
      console.error("[products.create] insert attempt #1 failed", attempt.error);
      insertPayload = {
        ...basePayload,
        image: resolvedPrimaryImage || null
      };
      attempt = await supabase.from("products").insert(insertPayload).select("*").single();
    }

    if (attempt.error) {
      console.error("[products.create] insert failed", attempt.error);
      return res.status(500).json({ error: attempt.error.message || "Failed to create product" });
    }

    if (storagePaths.length) {
      await persistProductImages(supabase, attempt.data.id, storagePaths);
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
    let mergedUrls = storagePaths.length > 0 ? [...storagePaths] : [];
    if (!mergedUrls.length && resolvedPrimaryImage) mergedUrls = [resolvedPrimaryImage];
    const product = mapRowToApiProduct(createdProduct.data, mergedUrls);
    console.log("Created product:", product);
    return res.status(201).json(product);
  } catch (error) {
    console.error("[products.create] unexpected error", error);
    const message = error instanceof Error ? error.message : "Failed to create product";
    return res.status(400).json({ error: message });
  }
}

export async function updateProduct(req, res) {
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ error: "Product id is required" });

  const body = req.body ?? {};
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  const supabaseBase = process.env.SUPABASE_URL || "";
  const { name: rawName, description: rawDescription, price: rawPrice } = body;
  const name = toLocalizedObject(rawName);
  const description = toLocalizedObject(rawDescription ?? "");
  const price = asNumber(rawPrice);
  const categoryId = asCategoryId(body);
  const brandId = asBrandId(body);
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

    const existing = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return res.status(404).json({ error: "Product not found" });

    const currentPrimary =
      existing.data.image_url != null && String(existing.data.image_url).trim() !== ""
        ? String(existing.data.image_url).trim()
        : existing.data.image != null && String(existing.data.image).trim() !== ""
          ? String(existing.data.image).trim()
          : null;

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

    let storagePaths = [];
    if (uploadedFiles.length) {
      try {
        storagePaths = await uploadProductFilesToStorage(supabase, uploadedFiles);
      } catch (uploadErr) {
        console.error("[products.update] storage upload failed", uploadErr);
        const message =
          uploadErr instanceof Error ? uploadErr.message : "Product image upload failed";
        return res.status(500).json({ error: message });
      }
    }

    const imageUrlRaw = asImageUrl(body);
    const normalizedBodyImage = normalizeImageRefForDb(imageUrlRaw, supabaseBase);
    let resolvedPrimaryImage = currentPrimary;
    if (storagePaths.length > 0) {
      resolvedPrimaryImage = storagePaths[0];
    } else if (normalizedBodyImage) {
      resolvedPrimaryImage = normalizedBodyImage;
    }

    const basePayload = {
      name,
      description,
      price,
      stock,
      category_id: categoryId,
      brand_id: resolvedBrandId,
      brand: null
    };

    const relationSelect =
      "*, category:categories(id,name), brand_relation:brands(id,name,category_id)";

    let updatePayload = {
      ...basePayload,
      image_url: resolvedPrimaryImage || null
    };
    let attempt = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select(relationSelect)
      .maybeSingle();

    if (attempt.error) {
      console.error("[products.update] update attempt #1 failed", attempt.error);
      updatePayload = {
        ...basePayload,
        image: resolvedPrimaryImage || null
      };
      attempt = await supabase
        .from("products")
        .update(updatePayload)
        .eq("id", id)
        .select(relationSelect)
        .maybeSingle();
    }

    if (attempt.error) {
      console.error("[products.update] update failed", attempt.error);
      return res.status(500).json({ error: attempt.error.message || "Failed to update product" });
    }
    if (!attempt.data) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (storagePaths.length) {
      const delImg = await supabase.from("product_images").delete().eq("product_id", id);
      if (delImg.error) throw delImg.error;
      await persistProductImages(supabase, id, storagePaths);
    }

    const extraUrls = await fetchProductImageUrls(supabase, id);
    const product = mapRowToApiProduct(attempt.data, extraUrls);
    return res.json(product);
  } catch (error) {
    console.error("[products.update] unexpected error", error);
    const message = error instanceof Error ? error.message : "Failed to update product";
    return res.status(400).json({ error: message });
  }
}

/**
 * Clear FKs from order_items so products can be deleted.
 * Tries SET NULL first; if that fails (e.g. NOT NULL column), deletes matching rows.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} productId
 */
async function detachOrderItemsFromProduct(supabase, productId) {
  const upd = await supabase
    .from("order_items")
    .update({ product_id: null })
    .eq("product_id", productId);
  if (!upd.error) return;

  const msg = String(upd.error.message || "");
  if (/42P01|does not exist|relation .* does not exist/i.test(msg)) {
    console.warn("[products.delete] order_items not available, skip:", msg);
    return;
  }

  console.warn("[products.delete] order_items update null failed, trying delete lines:", msg);
  const del = await supabase.from("order_items").delete().eq("product_id", productId);
  if (del.error) {
    console.error("[products.delete] order_items delete failed:", del.error.message);
    throw del.error;
  }
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} productId
 */
async function deleteCartItemsForProduct(supabase, productId) {
  const del = await supabase.from("cart_items").delete().eq("product_id", productId);
  if (!del.error) return;
  const msg = String(del.error.message || "");
  if (/42P01|does not exist|relation .* does not exist/i.test(msg)) {
    console.warn("[products.delete] cart_items not available, skip:", msg);
    return;
  }
  throw del.error;
}

export async function deleteProduct(req, res) {
  try {
    const supabase = req.app.locals.supabase;
    const id = String(req.params.id || "").trim();
    console.log("Deleting product ID:", id);
    if (!id) return res.status(400).json({ error: "Product id is required" });

    const [imgRes, prodRes] = await Promise.all([
      supabase.from("product_images").select("*").eq("product_id", id),
      supabase.from("products").select("*").eq("id", id).maybeSingle()
    ]);

    if (imgRes.error) {
      const im = String(imgRes.error.message || "");
      if (!/42P01|does not exist|relation .* does not exist/i.test(im)) {
        throw imgRes.error;
      }
      console.warn("[products.delete] product_images prefetch skipped:", im);
    }
    if (prodRes.error) throw prodRes.error;
    if (!prodRes.data) return res.status(404).json({ error: "Product not found" });

    const imgRows = Array.isArray(imgRes.data) ? imgRes.data : [];
    const pathsToRemove = [];
    for (const row of imgRows) {
      const p = extractProductsBucketPath(row.url || row.image_url);
      if (p) pathsToRemove.push(p);
    }
    for (const col of [prodRes.data.image_url, prodRes.data.image]) {
      const p = extractProductsBucketPath(col);
      if (p) pathsToRemove.push(p);
    }

    await detachOrderItemsFromProduct(supabase, id);
    await deleteCartItemsForProduct(supabase, id);

    const deleteImages = await supabase.from("product_images").delete().eq("product_id", id);
    if (deleteImages.error) {
      const dm = String(deleteImages.error.message || "");
      if (!/42P01|does not exist|relation .* does not exist/i.test(dm)) {
        throw deleteImages.error;
      }
      console.warn("[products.delete] product_images delete skipped:", dm);
    } else {
      console.log("DB RESPONSE:", deleteImages.data);
    }

    const { data: deletedRows, error: deleteErr } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .select("id");
    if (deleteErr) throw deleteErr;
    console.log("DB RESPONSE:", deletedRows);

    if (!Array.isArray(deletedRows) || deletedRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    await removeProductPathsFromStorage(supabase, pathsToRemove);
    return res.json({ id: deletedRows[0].id, deleted: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : error &&
            typeof error === "object" &&
            "message" in error &&
            typeof /** @type {{ message?: unknown }} */ (error).message === "string"
          ? String(/** @type {{ message?: unknown }} */ (error).message)
          : "Server error";
    console.error("[products.delete] error", message, error);
    return res.status(500).json({ error: message });
  }
}
