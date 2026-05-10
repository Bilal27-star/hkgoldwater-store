const fromEnv = String(import.meta.env.VITE_API_URL || "").trim();
const defaultApiBaseUrl = import.meta.env.DEV
  ? "http://localhost:5001"
  : "https://hkgoldwater-store.onrender.com";

export const API_BASE_URL = (fromEnv || defaultApiBaseUrl).replace(/\/+$/, "");
