import auth from "./auth.js";
import requireAdmin from "./requireAdmin.js";

/**
 * Verified JWT (`Authorization: Bearer`) + admin role.
 * Sets `req.user` via {@link auth}: `{ id, email, role }`.
 */
export default function adminJwtAuth(req, res, next) {
  auth(req, res, () => requireAdmin(req, res, next));
}
