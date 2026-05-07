export const API_URL: string;

export function getToken(): string | null;
export function setToken(token: string | null | undefined): void;

export const TOKEN_KEY: string;
export const AUTH_CHANGED_EVENT: string;
export function getErrorMessage(error: unknown, fallback?: string): string;

export function loginApi(credentials: {
  email?: string;
  phone?: string;
  password: string;
}): Promise<any>;

export function registerApi(body: {
  name: string;
  email: string;
  password: string;
}): Promise<any>;

export function getProducts(params?: Record<string, string | number | undefined>): Promise<any>;
export function getProductByIdApi(productId: string): Promise<any>;
export function getCategories(): Promise<any>;
export function getBrands(categoryId: string): Promise<any>;
export function getSettings(): Promise<any>;
export function patchSettings(payload: {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  footerText: string;
}): Promise<any>;
export function getPages(): Promise<any>;
export function patchPages(payload: {
  pages: Array<{ key: string; title: string; contentHtml: string }>;
}): Promise<any>;
export function createProductApi(payload: {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category_id?: string;
  brand_id?: string;
  brand?: string;
  image_url?: string;
}): Promise<any>;
export function deleteProductApi(productId: string): Promise<any>;

export function addToCartApi(payload: {
  productId: string;
  quantity: number;
}): Promise<any>;

export function getCartApi(): Promise<any>;

export function createOrderApi(payload?: any): Promise<any>;
export function getAdminsApi(): Promise<any>;
export function createAdminApi(payload: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "main_admin";
}): Promise<any>;
export function deleteAdminApi(adminId: string): Promise<any>;
