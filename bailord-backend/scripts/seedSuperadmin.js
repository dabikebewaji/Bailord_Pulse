// One-time seed: creates the first superadmin from SUPERADMIN_EMAIL /
// SUPERADMIN_PASSWORD in .env. No-ops if a superadmin already exists, so it's
// safe to run more than once. Run with: npm run seed:superadmin
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "../src/config/db.js";

dotenv.config();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "❌ SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env",
    );
    process.exit(1);
  }

  const [existing] = await pool.query(
    "SELECT id, email FROM users WHERE role = 'superadmin' LIMIT 1",
  );
  if (existing.length > 0) {
    console.log(`✅ Superadmin already exists (${existing[0].email}).`);
    process.exit(0);
  }

  const [existingEmail] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );
  if (existingEmail.length > 0) {
    console.error(
      `❌ A user with email ${email} already exists but isn't a superadmin. Aborting.`,
    );
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password, role, status, email_verified_at)
     VALUES ('Super Admin', ?, ?, 'superadmin', 'active', NOW())`,
    [email, hashedPassword],
  );

  console.log(`✅ Superadmin created: ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Failed to seed superadmin:", error);
  process.exit(1);
});
