import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { getErrorMessage, loginApi } from "../../api";
import { ADMIN_SESSION_STORAGE_KEY } from "../constants";
import type { AdminUser } from "../types";

type AdminAuthContextValue = {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  canManageAdmins: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function readSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

function writeSession(user: AdminUser | null) {
  if (!user) localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  else localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(readSession());
    setIsReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password
      };
      const data = await loginApi(payload);
      const user = data && typeof data === "object" && "user" in data ? (data as any).user : null;
      if (!user || (user.role !== "admin" && user.role !== "main_admin" && user.role !== "superadmin")) {
        return { ok: false as const, error: "Admin access required." };
      }
      const next: AdminUser = {
        email: String(user.email || payload.email),
        name: String(user.name || "Admin"),
        role: user.role
      };
      writeSession(next);
      setUser(next);
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, error: getErrorMessage(error, "Invalid email or password.") };
    }
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setUser(null);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isReady,
      login,
      logout,
      canManageAdmins: user?.role === "main_admin" || user?.role === "superadmin"
    }),
    [user, isReady, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
