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
  getProfileApi,
  getToken,
  loginApi,
  logoutApi,
  patchUserProfile,
  setToken as persistToken,
  AUTH_CHANGED_EVENT,
  getErrorMessage
} from "../api";

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  wilaya?: string | null;
  commune?: string | null;
  address?: string | null;
  createdAt?: string | null;
};

type PatchProfileBody = Partial<{
  name: string;
  phone: string | null;
  wilaya: string | null;
  commune: string | null;
  address: string | null;
}>;

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  session: null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  refreshSession: () => void;
  refreshProfile: () => Promise<void>;
  patchProfile: (body: PatchProfileBody) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_USER_KEY = "gold_water_auth_user";

/** Flatten { user, ...spread } profile API responses before reading fields. */
function profileResponseToFlatRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = raw.user;
  if (nested && typeof nested === "object" && nested !== null) {
    return { ...(nested as Record<string, unknown>), ...raw };
  }
  return raw;
}

function normalizeServerUser(data: Record<string, unknown>): AuthUser {
  const row = profileResponseToFlatRecord(data);
  return {
    id: String(row.id ?? ""),
    name: row.name != null ? String(row.name) : null,
    email: row.email != null ? String(row.email) : null,
    phone: row.phone != null ? String(row.phone) : null,
    role: row.role != null ? String(row.role) : null,
    wilaya: row.wilaya != null ? String(row.wilaya) : null,
    commune: row.commune != null ? String(row.commune) : null,
    address: row.address != null ? String(row.address) : null,
    createdAt: row.createdAt != null ? String(row.createdAt) : null
  };
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    if (u && typeof u === "object" && u.id) return u;
    return null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (!user) localStorage.removeItem(AUTH_USER_KEY);
  else localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  const refreshSession = useCallback(async () => {
    if (!getToken()) {
      writeStoredUser(null);
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = (await getProfileApi()) as Record<string, unknown>;
      const row = profileResponseToFlatRecord(payload);
      const nextUser = normalizeServerUser(row);
      writeStoredUser(nextUser);
      setUser(nextUser);
    } catch (error) {
      console.error("[AuthContext] failed to refresh session", error);
      setError(getErrorMessage(error, "Failed to load profile"));
      persistToken(null);
      writeStoredUser(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) return;
    try {
      const raw = (await getProfileApi()) as Record<string, unknown>;
      const nextUser = normalizeServerUser(profileResponseToFlatRecord(raw));
      writeStoredUser(nextUser);
      setUser(nextUser);
      setError(null);
    } catch (error) {
      console.error("[AuthContext] failed to refresh profile", error);
      setError(getErrorMessage(error, "Failed to load profile"));
    }
  }, []);

  const patchProfile = useCallback(async (body: PatchProfileBody) => {
    const payload = await patchUserProfile(body as Record<string, unknown>);
    console.log("[AuthContext patchProfile] normalized API user payload id:", payload.id);
    const nextUser = normalizeServerUser(profileResponseToFlatRecord(payload));
    writeStoredUser(nextUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    refreshSession().catch((error) => {
      console.error("[AuthContext] initial refresh failed", error);
    });

    function onAuthChanged() {
      refreshSession().catch((error) => {
        console.error("[AuthContext] refreshSession failed", error);
      });
    }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = (await loginApi({
        email: email.trim().toLowerCase(),
        password
      })) as { token?: string; user?: Record<string, unknown> };
      if (!payload?.token) {
        return { ok: false as const, error: "Login failed: missing token." };
      }
      persistToken(payload.token);
      if (payload.user && typeof payload.user === "object") {
        const nextUser = normalizeServerUser(payload.user);
        writeStoredUser(nextUser);
        setUser(nextUser);
      }
      return { ok: true as const };
    } catch (error) {
      const message = getErrorMessage(error, "Login failed");
      setError(message);
      return { ok: false as const, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutApi().catch((error) => {
      console.error("[AuthContext] logout API failed", error);
    });
    persistToken(null);
    writeStoredUser(null);
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = !!user;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      session: null,
      loading,
      error,
      isAuthenticated,
      login,
      logout,
      refreshSession,
      refreshProfile,
      patchProfile
    }),
    [user, token, loading, error, isAuthenticated, login, logout, refreshSession, refreshProfile, patchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
