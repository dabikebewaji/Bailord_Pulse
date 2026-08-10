import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { sendOtpEmail } from "./emailService.js";

const OTP_TTL_MINUTES = 10;

const generateOtp = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

export const OtpService = {
  // Invalidates any prior unconsumed codes for this user+purpose, issues a new
  // one, and emails it.
  createAndSend: async (userId, email, purpose = "email_verification") => {
    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      "UPDATE otp_codes SET consumed_at = NOW() WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL",
      [userId, purpose]
    );
    await pool.query(
      "INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at) VALUES (?, ?, ?, ?)",
      [userId, codeHash, purpose, expiresAt]
    );

    await sendOtpEmail(email, code);
  },

  // Returns true/false; on success marks the code consumed.
  verify: async (userId, code, purpose = "email_verification") => {
    const [rows] = await pool.query(
      `SELECT id, code_hash FROM otp_codes
       WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, purpose]
    );
    const record = rows[0];
    if (!record) return false;

    const valid = await bcrypt.compare(code, record.code_hash);
    if (!valid) return false;

    await pool.query("UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?", [record.id]);
    return true;
  },
};
