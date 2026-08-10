import { pool } from "../config/db.js";

// Validate required environment variables
const validateEnvVariables = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
  }
};

// Run validation on module load
validateEnvVariables();

export const TokenService = {
  // Check if a token is blacklisted
  isBlacklisted: async (token) => {
    const [rows] = await pool.query(
      "SELECT * FROM token_blacklist WHERE token = ? AND expires_at > NOW()",
      [token]
    );
    return rows.length > 0;
  },

  // Add a token to the blacklist
  blacklist: async (token, userId, expiresAt) => {
    await pool.query(
      "INSERT INTO token_blacklist (token, user_id, expires_at) VALUES (?, ?, ?)",
      [token, userId, expiresAt]
    );
  },

  // Update user's refresh token
  updateRefreshToken: async (userId, refreshToken) => {
    await pool.query(
      "UPDATE users SET refresh_token = ?, last_token_refresh = NOW() WHERE id = ?",
      [refreshToken, userId]
    );
  },

  // Invalidate all tokens for a user
  invalidateAllUserTokens: async (userId) => {
    // Clear refresh token
    await pool.query(
      "UPDATE users SET refresh_token = NULL, last_token_refresh = NULL WHERE id = ?",
      [userId]
    );
    
    // Get user's refresh token to blacklist it
    const [rows] = await pool.query(
      "SELECT refresh_token FROM users WHERE id = ?",
      [userId]
    );
    
    if (rows[0]?.refresh_token) {
      // Add refresh token to blacklist with 30 days expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      await pool.query(
        "INSERT INTO token_blacklist (token, user_id, expires_at) VALUES (?, ?, ?)",
        [rows[0].refresh_token, userId, expiresAt]
      );
    }
  },

  // Clean up expired blacklisted tokens
  cleanupExpiredTokens: async () => {
    await pool.query("DELETE FROM token_blacklist WHERE expires_at < NOW()");
  }
};