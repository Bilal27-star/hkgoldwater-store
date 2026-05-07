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
  API_URL,
  getToken,
  patchUserProfile,
  setToken as persistToken,
  AUTH_CHANGED_EVENT,
  TOKEN_KEY
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

type SessionState = { token: string | null; user: AuthUser | null };

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
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user?: AuthUser | null) => void;
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

function parseJwtPayload(token: string): Partial<AuthUser> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as Record<string, unknown>;
    const id = payload.sub ?? payload.id;
    if (id === undefined || id === null) return null;
    return {
      id: String(id),
      email: payload.email != null ? String(payload.email) : undefined,
      role: payload.role != null ? String(payload.role) : undefined
    };
  } catch {
    return null;
  }
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

function readSession(): SessionState {
  if (typeof localStorage === "undefined") return { token: null, user: null };
  const t = localStorage.getItem(TOKEN_KEY);
  if (!t) return { token: null, user: null };

  let nextUser = readStoredUser();
  if (!nextUser) {
    const fromJwt = parseJwtPayload(t);
    if (fromJwt?.id) {
      nextUser = {
        id: fromJwt.id,
        email: fromJwt.email ?? null,
        role: fromJwt.role ?? null
      };
    }
  }

  return { token: t, user: nextUser };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(() => readSession());
  const [loading] = useState(false);

  const { token, user } = session;

  const refreshSession = useCallback(() => {
    const t = getToken();
    if (!t) {
      setSession({ token: null, user: null });
      return;
    }
    const next = readSession();
    setSession(next);
  }, []);

  const refreshProfile = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    const res = await fetch(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${t}` }
    });
    if (!res.ok) return;
    const raw = (await res.json()) as Record<string, unknown>;
    const nextUser = normalizeServerUser(profileResponseToFlatRecord(raw));
    writeStoredUser(nextUser);
    setSession(readSession());
  }, []);

  const patchProfile = useCallback(async (body: PatchProfileBody) => {
    const payload = await patchUserProfile(body as Record<string, unknown>);
    console.log("[AuthContext patchProfile] normalized API user payload id:", payload.id);
    const nextUser = normalizeServerUser(profileResponseToFlatRecord(payload));
    writeStoredUser(nextUser);
    setSession(readSession());
    return nextUser;
  }, []);

  useEffect(() => {
    function onAuthChanged() {
      refreshSession();
    }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refreshSession]);

  const login = useCallback((newToken: string, nextUser?: AuthUser | null) => {
    if (nextUser?.id) {
      writeStoredUser(
        normalizeServerUser({
          id: nextUser.id,
          name: nextUser.name,
          email: nextUser.email,
          phone: nextUser.phone,
          role: nextUser.role,
          wilaya: nextUser.wilaya,
          commune: nextUser.commune,
          address: nextUser.address,
          createdAt: nextUser.createdAt
        })
      );
    }
    persistToken(newToken);
    setSession(readSession());
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    writeStoredUser(null);
    setSession({ token: null, user: null });
  }, []);

  const isAuthenticated = !!token;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
      refreshSession,
      refreshProfile,
      patchProfile
    }),
    [user, token, loading, isAuthenticated, login, logout, refreshSession, refreshProfile, patchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
