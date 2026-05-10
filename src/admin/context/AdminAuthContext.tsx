import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  adminLoginApi,
  getErrorMessage,
  getJwtPayloadEmail,
  getJwtPayloadRole,
  isAdminJwtToken,
  setToken
} from "../../api";
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
      const normalizedEmail = email.trim().toLowerCase();
      const payload = (await adminLoginApi({
        email: normalizedEmail,
        password
      })) as {
        token?: string;
        user?: { email?: string; name?: string; role?: string };
      };
      if (!payload?.token) {
        return { ok: false as const, error: "Invalid admin login response." };
      }
      setToken(payload.token);

      if (!isAdminJwtToken(payload.token)) {
        return { ok: false as const, error: "Admin access required." };
      }

      const jwtRole = getJwtPayloadRole(payload.token) || "admin";
      const roleForUi: AdminUser["role"] =
        jwtRole === "superadmin" ? "superadmin" : "admin";

      const next: AdminUser = {
        email:
          (payload.user?.email && String(payload.user.email)) ||
          getJwtPayloadEmail(payload.token) ||
          normalizedEmail,
        name: payload.user?.name ? String(payload.user.name) : "Admin",
        role: roleForUi
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
    setToken(null);
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
