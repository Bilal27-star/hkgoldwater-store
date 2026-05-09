const fromEnv = String(import.meta.env.VITE_API_URL || "").trim();
const defaultApiBaseUrl = "https://hkgoldwater-store.onrender.com";

export const API_BASE_URL = (fromEnv || defaultApiBaseUrl).replace(/\/+$/, "");
