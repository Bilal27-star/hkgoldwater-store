import type { SyntheticEvent } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PRODUCTS_STORAGE_BUCKET = "products";
export const PRODUCT_IMAGE_FALLBACK_SRC = "/logo.png";

let browserClient: SupabaseClient | null | undefined;

function getBrowserSupabase(): SupabaseClient | null {
  if (browserClient === null) return null;
  if (browserClient) return browserClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!String(url || "").trim() || !String(key || "").trim()) {
    browserClient = null;
    return null;
  }
  browserClient = createClient(String(url), String(key), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return browserClient;
}

/**
 * Build a public URL for a stored object path, or pass through absolute / blob / data URLs.
 * Empty string if ref is a storage path but Supabase env is not configured.
 */
export function productImageRefToDisplayUrl(ref: string): string {
  const t = String(ref || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t) || t.startsWith("blob:") || t.startsWith("data:")) return t;
  const client = getBrowserSupabase();
  if (!client) return "";
  const { data } = client.storage.from(PRODUCTS_STORAGE_BUCKET).getPublicUrl(t);
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
