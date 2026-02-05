import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { TokenService } from "../services/tokenService.js";

// ✅ Helper functions to generate tokens
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

// ✅ Register new user
export const registerUser = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password,
      type,
      businessName,
      phone,
      address,
      description 
    } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Check if user exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine user role and status
    const role = type === 'retailer' ? 'retailer' : 'staff';
    const status = type === 'retailer' ? 'pending' : 'active';

    // Insert user with retailer fields if applicable
    const userFields = ['name', 'email', 'password', 'role', 'status'];
    const userValues = [name, email, hashedPassword, role, status];
    const placeholders = '?, ?, ?, ?, ?';

    if (type === 'retailer') {
      userFields.push('company', 'phone', 'address', 'description');
      userValues.push(businessName, phone, address, description);
      placeholders += ', ?, ?, ?, ?';
    }

    await pool.query(
      `INSERT INTO users (${userFields.join(', ')}) VALUES (${placeholders})`,
      userValues
    );

    const [userRows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = userRows[0];

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await TokenService.updateRefreshToken(user.id, refreshToken);

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
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

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await TokenService.updateRefreshToken(user.id, refreshToken);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get user profile (protected route)
export const getUserProfile = async (req, res) => {
  try {
    res.json(req.user);
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

    const { name, email, role, phone, company, address, description } = req.body;

    // Build dynamic update statement
    const fields = [];
    const values = [];
    if (typeof name !== 'undefined') { fields.push('name = ?'); values.push(name); }
    if (typeof email !== 'undefined') { fields.push('email = ?'); values.push(email); }
    if (typeof role !== 'undefined') { fields.push('role = ?'); values.push(role); }
    if (typeof phone !== 'undefined') { fields.push('phone = ?'); values.push(phone); }
    if (typeof company !== 'undefined') { fields.push('company = ?'); values.push(company); }
    if (typeof address !== 'undefined') { fields.push('address = ?'); values.push(address); }
    if (typeof description !== 'undefined') { fields.push('description = ?'); values.push(description); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No profile fields provided to update' });
    }

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await pool.query(sql, values);

    const [rows] = await pool.query('SELECT id, name, email, role, company, phone, address, description FROM users WHERE id = ?', [userId]);
    const updated = rows[0];

    res.json(updated);
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
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
