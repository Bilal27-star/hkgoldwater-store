import { API_BASE_URL } from "./config";

export const API_URL = API_BASE_URL;
const API_BASE = `${API_URL}/api`;
/** Single canonical localStorage key for JWT (read/write everywhere). */
export const DZ_API_JWT_KEY = "dz_api_jwt";
/** Same string as {@link DZ_API_JWT_KEY}; kept for older imports. */
export const TOKEN_KEY = DZ_API_JWT_KEY;
export const AUTH_CHANGED_EVENT = "gold-water-auth-changed";

/** Deprecated keys — removed from storage whenever we read/write JWT (never read these for auth). */
const LEGACY_JWT_KEYS = ["token", "access_token", "auth_token", "jwt"] as const;

function removeLegacyJwtKeys(): void {
  if (typeof localStorage === "undefined") return;
  for (const k of LEGACY_JWT_KEYS) {
    localStorage.removeItem(k);
  }
}

/** Extract JWT from typical auth JSON bodies (`token` | `access_token` | `jwt`). */
function extractJwtFromResponseBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const tryExtract = (obj: any): string | null => {
    if (!obj || typeof obj !== "object") return null;
    const raw = obj.token ?? obj.access_token ?? obj.jwt;
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  };

  // direct
  let token = tryExtract(body);
  if (token) return token;

  // nested common patterns
  const b = body as any;
  if (b.data) {
    token = tryExtract(b.data);
    if (token) return token;
  }

  if (b.user) {
    token = tryExtract(b.user);
    if (token) return token;
  }

  if (b.result) {
    token = tryExtract(b.result);
    if (token) return token;
  }

  return null;
}

/** Decode JWT payload JSON (no signature verification — client-side hints only). */
function decodeJwtPayloadJson(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Decode JWT `role` claim only (no signature verification — UI routing). */
export function getJwtPayloadRole(token: string): string | null {
  try {
    const payload = decodeJwtPayloadJson(token);
    if (!payload || payload.role == null) return null;
    return String(payload.role).trim() || null;
  } catch {
    return null;
  }
}

/** Decode JWT `email` claim (admin login returns `{ token }` only). */
export function getJwtPayloadEmail(token: string): string | null {
  const payload = decodeJwtPayloadJson(token);
  if (!payload || payload.email == null) return null;
  const s = String(payload.email).trim();
  return s || null;
}

export function isAdminJwtToken(token: string): boolean {
  const role = getJwtPayloadRole(token);
  return role === "admin" || role === "main_admin" || role === "superadmin";
}

type ApiRequestOptions = RequestInit & {
  headers?: HeadersInit;
  requireAuth?: boolean;
  /** Omit Authorization — use for public catalog GETs so a stale customer JWT cannot break reads. */
  skipAuth?: boolean;
};

function headersInitToRecord(h: HeadersInit | undefined): Record<string, string> {
  if (!h) return {};
  if (typeof Headers !== "undefined" && h instanceof Headers) {
    const out: Record<string, string> = {};
    h.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(h)) return Object.fromEntries(h);
  return { ...(h as Record<string, string>) };
}

function isJsonResponse(response: Response) {
  return response.headers.get("content-type")?.includes("application/json");
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (!isJsonResponse(response)) {
    const text = await response.text();
    return text || null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Coerce list endpoints to a plain array (`[]`, `{ data: [] }`, `{ items: [] }`, etc.). */
export function unwrapEntityArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["data", "items", "categories", "brands", "results"] as const) {
      const v = o[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function resolveApiError(response: Response, payload: unknown): Error {
  const errorFromPayload =
    payload && typeof payload === "object" && payload !== null
      ? "error" in payload && payload.error
        ? String(payload.error)
        : "message" in payload && payload.message
          ? String(payload.message)
          : ""
      : "";
  const fallback = response.statusText || `Request failed (${response.status})`;
  return new Error(errorFromPayload || fallback);
}

/** Read JWT only from `dz_api_jwt`. Legacy keys are purged, not read. */
export function getBearerJwt(options?: { silent?: boolean }): string | null {
  if (typeof localStorage === "undefined") return null;
  removeLegacyJwtKeys();
  const jwt = localStorage.getItem(DZ_API_JWT_KEY);
  if (!options?.silent) {
    console.log("[auth] reading token", {
      key: DZ_API_JWT_KEY,
      found: Boolean(jwt && jwt.length > 0),
      length: jwt?.length ?? 0
    });
  }
  return jwt;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getBearerJwt({ silent: true });
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAuthorizationHeader(): Record<string, string> {
  return getAuthHeaders();
}

export function getToken(): string | null {
  return getBearerJwt({ silent: true });
}

/** Persist JWT only under `dz_api_jwt`; strip deprecated keys. */
export function setToken(token: string | null | undefined): void {
  if (typeof localStorage === "undefined") return;
  removeLegacyJwtKeys();
  if (!token) {
    localStorage.removeItem(DZ_API_JWT_KEY);
    localStorage.removeItem("gold_water_auth_user");
    console.log("[auth] saving token", { key: DZ_API_JWT_KEY, action: "cleared" });
  } else {
    localStorage.setItem(DZ_API_JWT_KEY, token);
    console.log("[auth] saving token", {
      key: DZ_API_JWT_KEY,
      length: token.length,
      action: "stored"
    });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function request(path: string, options: ApiRequestOptions = {}) {
  const { requireAuth, skipAuth, ...fetchInit } = options;
  const token = skipAuth ? null : getBearerJwt();

  const isFormData =
    typeof FormData !== "undefined" && fetchInit.body instanceof FormData;

  console.log("[api.request]", {
    path,
    method: fetchInit.method || "GET",
    requireAuth,
    hasJwt: !!token,
    isFormData
  });
  if (requireAuth && !token) {
    console.warn(
      "[api.request] requireAuth=true but no JWT in localStorage — request will not send Authorization",
      { path, key: DZ_API_JWT_KEY }
    );
  }

  const customHeaders = headersInitToRecord(fetchInit.headers);
  const authHeaders = skipAuth ? {} : getAuthHeaders();

  const headers: Record<string, string> = {
    ...customHeaders,
    ...authHeaders
  };

  if (isFormData) {
    // Do not set Content-Type — browser adds multipart/form-data + boundary.
    delete headers["Content-Type"];
    delete headers["content-type"];
  } else {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  console.log("FINAL HEADERS", headers);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchInit,
      headers
    });
  } catch (err) {
    console.error("[api.request] network error", path, err);
    throw new Error("Network error. Please check your connection.");
  }

  console.log("[api.request] response", { path, status: response.status });
  const payload = await parseResponseBody(response);
  if (!response.ok) {
    console.error("[api.request] error body", { path, status: response.status, payload });
    throw resolveApiError(response, payload);
  }
  return payload;
}

export async function getProducts(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return request(`/products${qs ? `?${qs}` : ""}`, { skipAuth: true });
}

export async function getProductByIdApi(productId: string) {
  const id = String(productId || "").trim();
  if (!id) throw new Error("Product id is required");
  return request(`/products/${encodeURIComponent(id)}`, { skipAuth: true });
}

export async function getCategories(): Promise<any[]> {
  const data = await request("/categories", { skipAuth: true });
  return unwrapEntityArray(data);
}

export async function getBrands(categoryId?: string): Promise<any[]> {
  const normalizedCategoryId = String(categoryId || "").trim();
  const path = normalizedCategoryId
    ? `/brands?category_id=${encodeURIComponent(normalizedCategoryId)}`
    : "/brands";
  const data = await request(path, { skipAuth: true });
  return unwrapEntityArray(data);
}

export async function getSettings() {
  return request("/settings");
}

/** Public: social links for footer (from admin Social Media page). */
export async function getSocialMedia() {
  return request("/settings/social");
}

/** Admin-only: persist social links to site_settings.social_media */
export async function patchSocialMedia(payload: Record<string, { enabled: boolean; value: string }>) {
  return request("/settings/social", {
    method: "PATCH",
    body: JSON.stringify(payload),
    requireAuth: true
  });
}

export async function patchSettings(payload: {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  footerText: string;
}) {
  return request("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getPages() {
  return request("/pages");
}

export async function patchPages(payload: {
  pages: Array<{ key: string; title: string; contentHtml: string }>;
}) {
  return request("/pages", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function createProductApi(
  payload:
    | FormData
    | {
        name: string;
        description?: string;
        price: number;
        stock?: number;
        category_id?: string;
        brand_id?: string;
        brand?: string;
        image_url?: string;
      }
) {
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    let imageCount = 0;
    payload.forEach((_v, k) => {
      if (k === "images") imageCount++;
    });
    console.log("[createProductApi] POST /products FormData", {
      imageFields: imageCount,
      hasJwt: !!getBearerJwt(),
      authHeader: "Authorization: Bearer <dz_api_jwt> via request()"
    });
    return request("/products", {
      method: "POST",
      body: payload,
      requireAuth: true
    });
  }
  console.log("[createProductApi] JSON body", { hasJwt: !!getBearerJwt() });
  return request("/products", {
    method: "POST",
    body: JSON.stringify(payload),
    requireAuth: true
  });
}

export async function deleteProductApi(productId: string) {
  return request(`/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    requireAuth: true
  });
}

export async function updateProductApi(
  productId: string,
  payload:
    | FormData
    | {
        name: string;
        description?: string;
        price: number;
        stock?: number;
        category_id?: string;
        brand_id?: string;
        image_url?: string;
      }
) {
  const path = `/products/${encodeURIComponent(String(productId || "").trim())}`;
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    return request(path, {
      method: "PATCH",
      body: payload,
      requireAuth: true
    });
  }
  return request(path, {
    method: "PATCH",
    body: JSON.stringify(payload),
    requireAuth: true
  });
}

export async function addToCartApi(payload: { productId: string; quantity: number }) {
  return request("/cart", {
    method: "POST",
    body: JSON.stringify(payload),
    requireAuth: true
  });
}

export async function getCartApi() {
  return request("/cart", { requireAuth: true });
}

export async function removeCartItemApi(productId: string) {
  return request(`/cart/product/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    requireAuth: true
  });
}

export async function clearCartApi() {
  return request("/cart/clear", {
    method: "DELETE",
    requireAuth: true
  });
}

export async function createOrderApi(payload: Record<string, unknown> = {}) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    requireAuth: true
  });
}

export async function getOrdersApi() {
  return request("/orders", { requireAuth: true });
}

export async function getAdminsApi() {
  return request("/admin");
}

export async function createAdminApi(payload: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "main_admin";
}) {
  return request("/admin", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function deleteAdminApi(adminId: string) {
  return request(`/admin/${encodeURIComponent(adminId)}`, {
    method: "DELETE"
  });
}

export async function loginApi(payload: { email: string; password: string }) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password
      })
    });
  } catch {
    throw new Error("Network error. Please check your connection.");
  }

  const body = await parseResponseBody(response);
  if (!response.ok) throw resolveApiError(response, body);

  const jwt = extractJwtFromResponseBody(body);
  if (jwt) {
    setToken(jwt);
  } else {
    console.warn("[loginApi] success response missing token / access_token / jwt", body);
  }
  return body;
}

export async function registerApi(payload: {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getAuthMeApi() {
  return request("/auth/me", { requireAuth: true });
}

export async function getProfileApi() {
  return request("/user/profile", { requireAuth: true });
}

export async function updateProfileApi(body: Record<string, unknown>) {
  const sanitized = buildProfilePatchPayload(body);
  return request("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(sanitized),
    requireAuth: true
  }) as Promise<Record<string, unknown>>;
}

export async function logoutApi() {
  return request("/auth/logout", {
    method: "POST",
    requireAuth: true
  });
}

export async function adminLoginApi(payload: { email: string; password: string }) {
  const body = await request("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
    /** Never send a stale shop/customer Bearer token — it confuses debugging and some proxies. */
    skipAuth: true
  });

  console.log("[adminLoginApi] FULL RESPONSE", body);

  const jwt = extractJwtFromResponseBody(body);
  if (jwt) {
    setToken(jwt);
  } else if (body && typeof body === "object") {
    console.warn("[adminLoginApi] response missing token / access_token / jwt", body);
  }
  return body;
}

/** Whitelist PATCH body keys; map legacy display-name keys to `name` only (never sends snake-case alias). */
function buildProfilePatchPayload(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const legacySnakeDisplay = ["full", "name"].join("_");

  if (typeof input.name === "string") out.name = input.name;
  else if (typeof input[legacySnakeDisplay] === "string") out.name = input[legacySnakeDisplay];
  else if (typeof input.fullName === "string") out.name = input.fullName;

  if ("phone" in input) out.phone = input.phone;
  if ("wilaya" in input) out.wilaya = input.wilaya;
  if ("commune" in input) out.commune = input.commune;
  if ("address" in input) out.address = input.address;

  return out;
}

/** PATCH /user/profile — authenticated; returns updated user JSON. */
export async function patchUserProfile(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return updateProfileApi(body);
}

export const getUserProfileApi = getProfileApi;
export const getProductsApi = getProducts;
