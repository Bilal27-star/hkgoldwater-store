import type { SyntheticEvent } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { API_BASE_URL } from "../api/config";

export const PRODUCTS_STORAGE_BUCKET = "products";
export const PRODUCT_IMAGE_FALLBACK_SRC = "/logo.png";

let browserClient: SupabaseClient | null | undefined;

function getBrowserSupabase(): SupabaseClient | null {
  if (browserClient === null) return null;
  if (browserClient) return browserClient;
  const url =
    String(import.meta.env.VITE_SUPABASE_URL || "").trim() || getResolvedSupabaseProjectBase();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !String(key || "").trim()) {
    browserClient = null;
    return null;
  }
  browserClient = createClient(String(url), String(key), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return browserClient;
}

function supabaseProjectBaseFromEnv(): string {
  return String(import.meta.env.VITE_SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
}

/** Populated from GET /api/health `supabaseUrl` when the SPA build has no VITE_SUPABASE_URL. */
let runtimeSupabaseBase = "";

export function getResolvedSupabaseProjectBase(): string {
  return supabaseProjectBaseFromEnv() || runtimeSupabaseBase.trim().replace(/\/+$/, "");
}

/**
 * Bootstrap: fetch public Supabase project origin from the API (same SUPABASE_URL as backend).
 * Await before first paint so image URLs work when Vercel omits VITE_SUPABASE_URL.
 */
export async function primeSupabaseBaseFromApi(): Promise<void> {
  if (supabaseProjectBaseFromEnv()) return;
  if (runtimeSupabaseBase) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { credentials: "omit" });
    if (!res.ok) return;
    const body = (await res.json()) as { supabaseUrl?: string };
    const u = String(body?.supabaseUrl || "").trim().replace(/\/+$/, "");
    if (u) runtimeSupabaseBase = u;
  } catch {
    /* ignore */
  }
}

/** Same path Supabase uses for public objects; no network or anon key required. */
function buildPublicStorageUrl(objectPath: string): string {
  const base = getResolvedSupabaseProjectBase();
  if (!base) return "";
  const raw = String(objectPath || "").trim().replace(/^\/+/, "");
  if (!raw) return "";
  const encoded = raw
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base}/storage/v1/object/public/${PRODUCTS_STORAGE_BUCKET}/${encoded}`;
}

/** Strip leading bucket segment if path is `products/products/...` (double-prefix bug). */
function dedupeBucketPrefixInPath(path: string): string {
  const p = path.replace(/^\/+/, "");
  const dup = `${PRODUCTS_STORAGE_BUCKET}/${PRODUCTS_STORAGE_BUCKET}/`;
  if (p.startsWith(dup)) return p.slice(PRODUCTS_STORAGE_BUCKET.length + 1);
  return p;
}

function normalizeObjectPath(ref: string): string {
  let p = ref.replace(/^\/+/, "");
  if (!p) return p;
  if (!p.includes("/") && /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tif|tiff)$/i.test(p)) {
    p = `${PRODUCTS_STORAGE_BUCKET}/${p}`;
  }
  return dedupeBucketPrefixInPath(p);
}

/** Extract `products/...` object path from any Supabase public object URL. */
function objectPathFromSupabasePublicUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    const m = u.pathname.match(/\/storage\/v1\/object\/public\/products\/(.+)$/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Build a public URL for a stored object path, or pass through absolute / blob / data URLs.
 * Uses VITE_SUPABASE_URL, or runtime base from GET /api/health, plus public Storage path (no anon key).
 */
export function productImageRefToDisplayUrl(ref: string): string {
  const t = String(ref || "").trim();
  if (!t) return "";
  if (t.startsWith("blob:") || t.startsWith("data:")) return t;

  if (/^https?:\/\//i.test(t)) {
    const fromSupabase = objectPathFromSupabasePublicUrl(t);
    if (fromSupabase) {
      const rebuilt = buildPublicStorageUrl(fromSupabase);
      if (rebuilt) return rebuilt;
    }
    const legacy = t.match(/\/uploads\/products\/([^/?#]+)$/i);
    if (legacy?.[1]) {
      const reb = buildPublicStorageUrl(`${PRODUCTS_STORAGE_BUCKET}/${legacy[1]}`);
      if (reb) return reb;
    }
    return t;
  }

  const objectPath = normalizeObjectPath(t);
  const fromBase = buildPublicStorageUrl(objectPath);
  if (fromBase) return fromBase;

  const client = getBrowserSupabase();
  if (!client) return "";
  const { data } = client.storage.from(PRODUCTS_STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

/** Display URL for product thumbnails; uses {@link PRODUCT_IMAGE_FALLBACK_SRC} when unset or unresolved. */
export function productImageSrcWithFallback(ref: string): string {
  const resolved = productImageRefToDisplayUrl(ref);
  if (resolved) return resolved;
  return PRODUCT_IMAGE_FALLBACK_SRC;
}

export function onProductImageError(ev: SyntheticEvent<HTMLImageElement>): void {
  const el = ev.currentTarget;
  if (el.dataset.imgFallback === "1") return;
  el.dataset.imgFallback = "1";
  el.src = PRODUCT_IMAGE_FALLBACK_SRC;
}
