import { pool } from "../config/db.js"; // Import the MySQL connection pool

// 🔹 Create a new user
export const createUser = async (name, email, hashedPassword) => {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword]
  );
  return result.insertId; // Return the new user’s ID
};

// 🔹 Find a user by email (for login)
export const findUserByEmail = async (email) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0]; // Return first match
};

// 🔹 Find a user by ID (for token verification)
export const findUserById = async (id) => {
  const [rows] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [id]);
  return rows[0];
};

// 🔹 Get all users (optional)
export const getAllUsers = async () => {
  const [rows] = await pool.query("SELECT id, name, email, created_at FROM users");
  return rows;
};
