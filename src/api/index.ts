import { API_BASE_URL } from "./config";

export const API_URL = API_BASE_URL;
const API_BASE = `${API_URL}/api`;
export const TOKEN_KEY = "token";
export const AUTH_CHANGED_EVENT = "gold-water-auth-changed";

type ApiRequestOptions = RequestInit & { headers?: Record<string, string>; requireAuth?: boolean };

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

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null | undefined): void {
  if (typeof localStorage === "undefined") return;
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("gold_water_auth_user");
  } else {
    localStorage.setItem(TOKEN_KEY, token);
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
  const token = getToken();
  if (options.requireAuth && !token) {
    throw new Error("Authentication required. Please log in.");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error("Network error. Please check your connection.");
  }

  const payload = await parseResponseBody(response);
  if (!response.ok) throw resolveApiError(response, payload);
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
  return request(`/products${qs ? `?${qs}` : ""}`);
}

export async function getProductByIdApi(productId: string) {
  const id = String(productId || "").trim();
  if (!id) throw new Error("Product id is required");
  return request(`/products/${encodeURIComponent(id)}`);
}

export async function getCategories() {
  return request("/categories");
}

export async function getBrands(categoryId?: string) {
  const normalizedCategoryId = String(categoryId || "").trim();
  if (!normalizedCategoryId) {
    return request("/brands");
  }
  return request(`/brands?category_id=${encodeURIComponent(normalizedCategoryId)}`);
}

export async function getSettings() {
  return request("/settings");
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

export async function createProductApi(payload: {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category_id?: string;
  brand_id?: string;
  brand?: string;
  image_url?: string;
}) {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function deleteProductApi(productId: string) {
  return request(`/products/${encodeURIComponent(productId)}`, {
    method: "DELETE"
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
  return body;
}

export async function registerApi(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
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
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
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
