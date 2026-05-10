/** Requires a verified JWT whose role is an admin role (set after auth middleware). */
export default function requireAdmin(req, res, next) {
  const role = req.user?.role;
  if (role === "admin" || role === "main_admin" || role === "superadmin") {
    return next();
  }
  return res.status(403).json({ error: "Admin access required" });
}
