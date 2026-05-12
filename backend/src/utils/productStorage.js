import fs from "fs/promises";
import path from "path";

export const PRODUCTS_BUCKET = "products";
/** Object key prefix inside the bucket: `products/<filename>`. */
export const PRODUCTS_OBJECT_PREFIX = "products";

/**
 * @param {string} filename
 * @returns {string}
 */
export function productObjectPath(filename) {
  const base = path.basename(String(filename || "").trim()) || `upload-${Date.now()}.jpg`;
  return `${PRODUCTS_OBJECT_PREFIX}/${base}`;
}

/**
 * Reduce a pasted/public Supabase URL or legacy value to the storage object path
 * we persist (e.g. `products/1699-abc.jpg`). Returns null if nothing to store.
 * @param {string | null | undefined} raw
 * @param {string | null | undefined} supabaseUrl
 * @returns {string | null}
 */
export function normalizeImageRefForDb(raw, supabaseUrl) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (s.startsWith("blob:") || s.startsWith("data:")) return null;

  const publicMarker = "/storage/v1/object/public/products/";
  const idx = s.indexOf(publicMarker);
  if (idx !== -1) {
    const rest = s.slice(idx + publicMarker.length).split("?")[0];
    return decodeURIComponent(rest) || null;
  }

  try {
    if (supabaseUrl && s.startsWith("http")) {
      const base = new URL(supabaseUrl).origin;
      if (s.startsWith(base)) {
        const u = new URL(s);
        const m = u.pathname.match(/\/storage\/v1\/object\/public\/products\/(.+)$/);
        if (m?.[1]) return decodeURIComponent(m[1]);
      }
    }
  } catch {
    /* ignore */
  }

  if (/^https?:\/\//i.test(s)) {
    return null;
  }

  let ref = s.replace(/^\/+/, "");
  if (!ref.startsWith(`${PRODUCTS_OBJECT_PREFIX}/`)) {
    ref = `${PRODUCTS_OBJECT_PREFIX}/${path.basename(ref)}`;
  }
  return ref;
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export function extractProductsBucketPath(value) {
  const ref = normalizeImageRefForDb(value, null);
  if (!ref || !ref.startsWith(`${PRODUCTS_OBJECT_PREFIX}/`)) return null;
  return ref;
}

/** DB mistakes may store a bare UUID in image fields — do not treat as a storage key. */
const UUID_ONLY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Turn a persisted storage ref (e.g. `products/file.jpg`) into a public object URL.
 * Full `http(s)` values are returned unchanged.
 * @param {string | null | undefined} raw
 * @param {string | null | undefined} supabaseUrl
 * @returns {string | null}
 */
export function expandStoragePathToPublicUrl(raw, supabaseUrl) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (UUID_ONLY.test(s)) return null;
  if (s.startsWith("blob:") || s.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const base = String(supabaseUrl ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  const ref = normalizeImageRefForDb(s, supabaseUrl);
  if (!ref) return null;
  return `${base}/storage/v1/object/public/${PRODUCTS_BUCKET}/${ref}`;
}

/**
 * Upload multer-saved files to Storage; returns object paths for DB.
 * Local temp files are removed after successful upload.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {import("multer").File[]} files
 * @returns {Promise<string[]>}
 */
export async function uploadProductFilesToStorage(supabase, files) {
  const out = [];
  for (const f of files) {
    const diskPath = f.path;
    const objectPath = productObjectPath(f.filename);
    const buf = await fs.readFile(diskPath);
    const contentType = f.mimetype || "application/octet-stream";
    const { error } = await supabase.storage.from(PRODUCTS_BUCKET).upload(objectPath, buf, {
      contentType,
      upsert: true
    });
    if (error) {
      console.error("[productStorage] upload failed", objectPath, error);
      throw error;
    }
    out.push(objectPath);
    try {
      await fs.unlink(diskPath);
    } catch (e) {
      console.warn("[productStorage] temp unlink", diskPath, e);
    }
  }
  return out;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string[]} objectPaths
 */
export async function removeProductPathsFromStorage(supabase, objectPaths) {
  const unique = [...new Set(objectPaths.filter(Boolean))];
  if (!unique.length) return;
  const { error } = await supabase.storage.from(PRODUCTS_BUCKET).remove(unique);
  if (error) {
    console.warn("[productStorage] remove failed", error);
  }
}
