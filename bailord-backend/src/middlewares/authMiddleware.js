import jwt from "jsonwebtoken";

import { TokenService } from "../services/tokenService.js";
import { pool } from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenService.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        message: "Token has been revoked",
        code: "TOKEN_REVOKED"
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check token expiration with buffer time (1 minute)
      const bufferTime = 60; // 1 minute in seconds
      const currentTime = Math.floor(Date.now() / 1000);

      // Only check expiration for non-refresh-token requests
      if (!req.originalUrl.includes('/auth/refresh')) {
        if (decoded.exp - currentTime < bufferTime) {
          return res.status(401).json({
            message: "Token near expiration",
            code: "TOKEN_EXPIRING"
          });
        }
      }

      // Look up the user fresh from the DB rather than trusting the JWT payload
      // (which only carries `id`) — this is also what makes role-based checks
      // (authorize, below) reliable, and immediately locks out deactivated users.
      const [rows] = await pool.query(
        "SELECT id, name, email, role, status, email_verified_at FROM users WHERE id = ?",
        [decoded.id]
      );
      const user = rows[0];
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }
      if (user.status !== "active") {
        return res.status(401).json({ message: "Account is not active" });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: "Token expired",
          code: "TOKEN_EXPIRED"
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Usage: router.delete('/:id', protect, authorize('admin', 'superadmin'), handler)
export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to perform this action" });
  }
  next();
};
