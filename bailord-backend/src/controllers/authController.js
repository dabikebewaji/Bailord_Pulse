import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { TokenService } from "../services/tokenService.js";
import { OtpService } from "../services/otpService.js";
import { INSERT_RETAILER_FOR_USER, GET_RETAILER_BY_EMAIL } from "../models/retailerQueries.js";

// ✅ Helper functions to generate tokens
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

// ✅ Register a new retailer (public self-registration).
// Staff/admin accounts can no longer be self-registered here — only a
// superadmin can create those, via createStaffOrAdmin below.
export const registerUser = async (req, res) => {
  try {
    const {
      name, email, password, description,
      businessName, businessType, phone,
      street, city, state, zipCode, country,
    } = req.body;

    if (!name || !email || !password || !businessName || !businessType || !phone || !street || !city || !state || !zipCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const [existingRetailer] = await pool.query(GET_RETAILER_BY_EMAIL, [email]);
    if (existingRetailer.length > 0) {
      return res.status(400).json({ message: "A business with this email is already registered — contact support" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Combined into a single string for the user's own contact-info field —
    // the structured street/city/state/zip below are what the retailers
    // (business record) table actually needs.
    const combinedAddress = `${street}, ${city}, ${state} ${zipCode}`;

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, status, company, phone, address, description)
       VALUES (?, ?, ?, 'retailer', 'pending', ?, ?, ?, ?)`,
      [name, email, hashedPassword, businessName, phone, combinedAddress, description]
    );
    const userId = result.insertId;

    // Also create the linked business record (retailers table) — previously
    // signup only created the login, so a retailer's dashboard had no
    // business data, project assignments, etc. to show. Starts 'inactive'
    // until the OTP below is verified (see verifyOtp). Registration number
    // and bank details are left for an admin to fill in later.
    await pool.query(INSERT_RETAILER_FOR_USER, [
      userId, name, email, phone, street, city, state, zipCode,
      country || 'Nigeria', businessName, businessType,
    ]);

    await OtpService.createAndSend(userId, email);

    res.status(201).json({
      message: "Registered successfully. Check your email for a verification code before logging in.",
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Verify a retailer's signup OTP — this is what activates the account
// (no separate manual-approval step exists to hook into today).
export const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await OtpService.verify(user.id, code);
    if (!valid) {
      return res.status(400).json({ message: "That code is invalid or has expired" });
    }

    // Mirror the activation onto the linked business record, if any.
    await pool.query("UPDATE retailers SET status = 'active' WHERE user_id = ?", [user.id]);

    await pool.query(
      "UPDATE users SET status = 'active', email_verified_at = NOW() WHERE id = ?",
      [user.id]
    );

    res.json({ message: "Email verified. You can now log in." });
  } catch (error) {
    console.error("❌ OTP verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Re-issue a signup OTP for a not-yet-verified user.
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.email_verified_at) {
      return res.status(400).json({ message: "This account is already verified" });
    }

    await OtpService.createAndSend(user.id, email);
    res.json({ message: "A new verification code has been sent" });
  } catch (error) {
    console.error("❌ OTP resend error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Superadmin-only: create an admin or staff account directly. Trusted
// creation — no self-verification needed, active immediately.
export const createStaffOrAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !["admin", "staff"].includes(role)) {
      return res.status(400).json({ message: "name, email, password and role ('admin' or 'staff') are required" });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, status, email_verified_at)
       VALUES (?, ?, ?, ?, 'active', NOW())`,
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: `${role} account created`,
      user: { id: result.insertId, name, email, role },
    });
  } catch (error) {
    console.error("❌ Create staff/admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (user.status !== "active") {
      return res.status(403).json({ message: "This account is not active yet" });
    }
    if (!user.email_verified_at) {
      return res.status(403).json({ message: "Please verify your email before logging in", code: "EMAIL_NOT_VERIFIED" });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await TokenService.updateRefreshToken(user.id, refreshToken);

    // Full profile shape (matches getUserProfile) — previously trimmed to
    // just {id,name,email,role}, so notifications/preferences were always
    // undefined right after login and Settings.tsx fell back to hardcoded
    // defaults instead of what was actually saved, until the next full
    // page reload triggered AuthContext's separate profile refetch.
    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: formatUserProfile(user),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const PROFILE_FIELDS = `id, name, email, role, status, company, phone, address, description,
  notify_email, notify_project_updates, notify_messages, notify_weekly_reports,
  pref_compact_view, pref_auto_save`;

// notifications/preferences were previously local-only React state in
// Settings.tsx (toggled visually, never sent anywhere) — nested here so the
// existing flat fields other callers (AuthContext) already rely on stay
// unchanged.
const formatUserProfile = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  company: u.company,
  phone: u.phone,
  address: u.address,
  description: u.description,
  notifications: {
    email: !!u.notify_email,
    projectUpdates: !!u.notify_project_updates,
    messages: !!u.notify_messages,
    weeklyReports: !!u.notify_weekly_reports,
  },
  preferences: {
    compactView: !!u.pref_compact_view,
    autoSave: !!u.pref_auto_save,
  },
});

// ✅ Get user profile (protected route)
export const getUserProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(formatUserProfile(rows[0]));
  } catch (error) {
    console.error("❌ Profile error:", error);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// ✅ Update user profile (protected route)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Note: `role` is intentionally not user-editable here — self-service role
    // changes would be a privilege-escalation hole. Roles are only set at
    // account creation (registerUser / createStaffOrAdmin).
    const { name, email, phone, company, address, description, notifications, preferences } = req.body;

    // Build dynamic update statement
    const fields = [];
    const values = [];
    if (typeof name !== 'undefined') { fields.push('name = ?'); values.push(name); }
    if (typeof email !== 'undefined') { fields.push('email = ?'); values.push(email); }
    if (typeof phone !== 'undefined') { fields.push('phone = ?'); values.push(phone); }
    if (typeof company !== 'undefined') { fields.push('company = ?'); values.push(company); }
    if (typeof address !== 'undefined') { fields.push('address = ?'); values.push(address); }
    if (typeof description !== 'undefined') { fields.push('description = ?'); values.push(description); }

    if (notifications && typeof notifications === 'object') {
      if (typeof notifications.email !== 'undefined') { fields.push('notify_email = ?'); values.push(notifications.email ? 1 : 0); }
      if (typeof notifications.projectUpdates !== 'undefined') { fields.push('notify_project_updates = ?'); values.push(notifications.projectUpdates ? 1 : 0); }
      if (typeof notifications.messages !== 'undefined') { fields.push('notify_messages = ?'); values.push(notifications.messages ? 1 : 0); }
      if (typeof notifications.weeklyReports !== 'undefined') { fields.push('notify_weekly_reports = ?'); values.push(notifications.weeklyReports ? 1 : 0); }
    }
    if (preferences && typeof preferences === 'object') {
      if (typeof preferences.compactView !== 'undefined') { fields.push('pref_compact_view = ?'); values.push(preferences.compactView ? 1 : 0); }
      if (typeof preferences.autoSave !== 'undefined') { fields.push('pref_auto_save = ?'); values.push(preferences.autoSave ? 1 : 0); }
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No profile fields provided to update' });
    }

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(sql, values);

    const [rows] = await pool.query(`SELECT ${PROFILE_FIELDS} FROM users WHERE id = ?`, [userId]);
    res.json(formatUserProfile(rows[0]));
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// ✅ Change password (protected route) — the Settings page has always
// called this endpoint, but it never existed on the backend, so every
// attempt 404'd and surfaced as "Failed to change password".
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

// ✅ Invalidate user's tokens
export const invalidateToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.headers.authorization?.split(" ")[1];

    if (!currentToken) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Get token expiry by decoding (without verification)
    const decodedToken = jwt.decode(currentToken);
    if (!decodedToken?.exp) {
      return res.status(400).json({ message: "Invalid token format" });
    }

    // Add current token to blacklist
    await TokenService.blacklist(
      currentToken,
      userId,
      new Date(decodedToken.exp * 1000)
    );

    // Invalidate all user tokens (including refresh tokens)
    await TokenService.invalidateAllUserTokens(userId);

    res.json({ message: "Tokens invalidated successfully" });
  } catch (error) {
    console.error("❌ Token invalidation error:", error);
    res.status(500).json({ message: "Failed to invalidate tokens" });
  }
};

// ✅ Refresh access token using refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if refresh token exists in database
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.id, refreshToken]
    );
    
    if (!rows[0]) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.id);
    
    res.json({
      accessToken,
      message: "Token refreshed successfully"
    });
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};
