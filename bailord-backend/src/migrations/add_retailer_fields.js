import { pool } from '../config/db.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addRetailerFields() {
    try {
        // Read the SQL file
        const sqlPath = join(__dirname, '..', 'config', 'migrations', 'add_retailer_fields.sql');
        const sql = await readFile(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        console.log('✅ Successfully added retailer fields to users table');
        
        // Verify the columns exist
        const [columns] = await pool.query('DESCRIBE users');
        console.log('\nUsers table columns:');
        columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
        
    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        await pool.end();
    }
}

addRetailerFields();