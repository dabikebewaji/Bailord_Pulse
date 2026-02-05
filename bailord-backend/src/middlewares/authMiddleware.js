import jwt from "jsonwebtoken";

import { TokenService } from "../services/tokenService.js";

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

      req.user = decoded;
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
