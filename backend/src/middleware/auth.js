import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token) return res.status(401).json({ error: "Missing token" });
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: "Server misconfiguration" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, role: payload.role || "customer" };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
