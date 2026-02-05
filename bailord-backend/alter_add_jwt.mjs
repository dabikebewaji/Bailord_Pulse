import 'dotenv/config';
const { pool } = await import('./src/config/db.js');
try {
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS current_jwt VARCHAR(512) DEFAULT NULL");
  console.log('ALTER applied');
  const [u] = await pool.query("SHOW CREATE TABLE users");
  console.log('\n--- users CREATE TABLE ---\n' + u[0]['Create Table']);
} catch (e) {
  console.error('Error', e.message);
} finally {
  process.exit(0);
}
