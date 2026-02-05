import { pool } from './config/db.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updateSchema() {
    try {
        // Read the SQL file
        const sqlPath = join(__dirname, 'config', 'update_projects.sql');
        const sql = await readFile(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sql);
        console.log('✅ Successfully updated projects table schema');
        
        // Verify the columns exist
        const [columns] = await pool.query('DESCRIBE projects');
        console.log('\nProjects table columns:');
        columns.forEach(col => console.log(`- ${col.Field}`));
        
    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        // Close the connection
        await pool.end();
    }
}

updateSchema();