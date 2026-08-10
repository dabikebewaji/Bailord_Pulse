import 'dotenv/config';
import { writeFileSync } from 'fs';
import { pool } from './src/config/db.js';

(async ()=>{
  try{
    let out = '';
    try{
      const [u] = await pool.query("SHOW CREATE TABLE users");
      out += '--- users CREATE TABLE ---\n';
      out += u[0]['Create Table'] + '\n\n';
    }catch(e){ out += 'ERROR showing users: '+e.message+'\n\n'; }

    try{
      const [m] = await pool.query("SHOW CREATE TABLE messages");
      out += '--- messages CREATE TABLE ---\n';
      out += m[0]['Create Table'] + '\n\n';
    }catch(e){ out += 'ERROR showing messages: '+e.message+'\n\n'; }

    writeFileSync('schema_dump.txt', out, 'utf8');
    console.log('Wrote schema_dump.txt');
  }catch(e){
    console.error('Fatal error:', e.message);
    process.exit(1);
  }finally{
    process.exit(0);
  }
})();
