export const API_URL = "http://localhost:5001/api";
export const TOKEN_KEY = "token";
/** Dispatched on same tab whenever `setToken` runs (including logout). */
export const AUTH_CHANGED_EVENT = "gold-water-auth-changed";

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

async function request(path: string, options: RequestInit & { headers?: Record<string, string> } = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      cache: "no-store",
      headers
    });
  } catch {
    throw new Error("Network error. Please check your connection.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errMsg =
      payload && typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error?: string }).error)
        : "Request failed";
    throw new Error(errMsg || "Request failed");
  }

  return payload;
}

export async function loginApi(credentials: {
  email?: string;
  phone?: string;
  password: string;
}): Promise<{ token?: string; user?: unknown }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  }) as Promise<{ token?: string; user?: unknown }>;
}

export async function registerApi(body: {
  name: string;
  email: string;
  password: string;
}): Promise<{ token?: string } & Record<string, unknown>> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(body)
  }) as Promise<{ token?: string } & Record<string, unknown>>;
}

export async function getProducts(params: Record<string, string | number | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  const data = await request(`/products${qs ? `?${qs}` : ""}`);
  console.log("API PRODUCTS:", data);
  return data;
}

export async function getProductByIdApi(productId: string) {
  const id = String(productId || "").trim();
  if (!id) throw new Error("Product id is required");
  return request(`/products/${encodeURIComponent(id)}`);
}

export async function getCategories() {
  return request("/categories");
}

export async function getBrands(categoryId: string) {
  const normalizedCategoryId = String(categoryId || "").trim();
  if (!normalizedCategoryId) {
    throw new Error("category_id is required to fetch brands");
  }
  return request(`/brands?category_id=${encodeURIComponent(normalizedCategoryId)}`);
}

export async function getSettings() {
  const data = await request("/settings");
  console.log("DATA SOURCE:", data);
  return data;
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
  const data = await request("/pages");
  console.log("DATA SOURCE:", data);
  return data;
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
  const data = await request("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  console.log("DATA SOURCE:", data);
  return data;
}

export async function deleteProductApi(productId: string) {
  const data = await request(`/products/${encodeURIComponent(productId)}`, {
    method: "DELETE"
  });
  console.log("DATA SOURCE:", data);
  return data;
}

export async function addToCartApi(payload: { productId: string; quantity: number }) {
  return request("/cart", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getCartApi() {
  return request("/cart");
}

export async function removeCartItemApi(productId: string) {
  return request(`/cart/product/${encodeURIComponent(productId)}`, {
    method: "DELETE"
  });
}

export async function clearCartApi() {
  return request("/cart/clear", {
    method: "DELETE"
  });
}

export async function createOrderApi(payload: Record<string, unknown> = {}) {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify(payload)
  });
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

/** PATCH /users/profile — authenticated; returns updated user JSON. */
export async function patchUserProfile(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = getToken();
  if (!token) throw new Error("Not signed in");

  const sanitized = buildProfilePatchPayload(body);
  console.log("[patchUserProfile] outgoing payload", sanitized);

  const res = await fetch(`${API_URL}/users/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(sanitized)
  });

  const text = await res.text();
  console.log("[patchUserProfile] response status", res.status, "body", text.slice(0, 800));

  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { error: text?.slice(0, 200) || "Invalid JSON response" };
  }

  if (!res.ok) {
    const msg =
      parsed && typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error?: string }).error)
        : `Request failed (${res.status})`;
    throw new Error(msg || "Update failed");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid profile response");
  }

  return parsed as Record<string, unknown>;
}
