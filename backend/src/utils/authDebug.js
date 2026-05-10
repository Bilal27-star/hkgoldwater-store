/**
 * Structured auth debugging — **enabled only when NODE_ENV === "development"**.
 * Never logs when NODE_ENV is production (or anything else), so secrets are not exposed in prod.
 */
export function isAuthDebugEnabled() {
  return process.env.NODE_ENV === "development";
}

export function authDebug(scope, payload) {
  if (!isAuthDebugEnabled()) return;
  console.log(`[auth-debug:${scope}]`, payload);
}

/** True when detailed admin-login traces should print (local dev or ADMIN_LOGIN_DEBUG=true). */
export function isAdminLoginTraceEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ADMIN_LOGIN_DEBUG === "1" ||
    process.env.ADMIN_LOGIN_DEBUG === "true"
  );
}

/**
 * Admin login diagnostics (email / user found / hash preview / bcrypt result).
 * In production-style runs with ADMIN_LOGIN_DEBUG, only a short hash prefix is logged.
 */
export function adminLoginTrace(payload) {
  if (!isAdminLoginTraceEnabled()) return;
  const dev = process.env.NODE_ENV === "development";
  const safe = { ...payload };
  const hash = safe.storedPasswordHash;
  if (typeof hash === "string" && hash.length > 0) {
    if (!dev) {
      safe.storedPasswordHashPreview = `${hash.slice(0, 7)}…(len=${hash.length})`;
      delete safe.storedPasswordHash;
    }
  }
  console.log("[admin-login:trace]", safe);
}

/** Deep login-flow logs — OFF in production unless LOGIN_DEEP_DEBUG or ADMIN_LOGIN_DEBUG is set. */
export function isLoginDeepDebugEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.LOGIN_DEEP_DEBUG === "1" ||
    process.env.LOGIN_DEEP_DEBUG === "true" ||
    process.env.ADMIN_LOGIN_DEBUG === "1" ||
    process.env.ADMIN_LOGIN_DEBUG === "true"
  );
}

/**
 * Pinpoints 401 cause: request email → DB row → stored hash → bcrypt result → final outcome.
 * Full `password_hash` only when NODE_ENV=development; otherwise prefix + length.
 */
export function loginDeepDebug(step, payload) {
  if (!isLoginDeepDebugEnabled()) return;
  const dev = process.env.NODE_ENV === "development";
  const safe =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...payload }
      : { value: payload };

  const redactHash = (key) => {
    const v = safe[key];
    if (typeof v !== "string" || v.length === 0) return;
    if (!dev) {
      safe[`${key}_preview`] = `${v.slice(0, 7)}…(len=${v.length})`;
      delete safe[key];
    }
  };

  redactHash("stored_password_hash");
  redactHash("stored_password_hash_trimmed");
  redactHash("raw_password_hash_from_db");

  console.log("[admin-login:deep]", step, safe);
}
