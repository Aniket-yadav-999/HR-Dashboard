import { Session } from "../models/Session.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const session = await Session.findOne({ token, expiresAt: { $gt: new Date() } }).populate("user");

    if (!session || !session.user) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

export function requireHrOrAdmin(req, res, next) {
  if (!["admin", "hr"].includes(req.user?.role)) {
    return res.status(403).json({ message: "HR or admin access required" });
  }

  next();
}
