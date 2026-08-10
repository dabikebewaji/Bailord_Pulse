import 'dotenv/config';
import { pool } from './src/config/db.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

(async ()=>{
  try{
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255) DEFAULT NULL");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('admin','staff','retailer') DEFAULT 'staff'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active','pending','suspended') DEFAULT 'active'");
    console.log('ALTERs applied');
  }catch(e){
    console.error('Alter error', e.message);
  }

  const token = jwt.sign({id:1}, process.env.JWT_SECRET || 'secret', {expiresIn:'7d'});

  try{
    const r = await axios.get('http://localhost:5001/api/messages/available-users', { headers: { Authorization: 'Bearer '+token }});
    console.log('--- available-users ---');
    console.log('status:', r.status);
    console.log(JSON.stringify(r.data, null, 2));
  }catch(e){
    console.error('--- available-users error ---');
    if(e.response){ console.error('status:', e.response.status); console.error('data:', JSON.stringify(e.response.data, null, 2)); } else { console.error(e.message); }
  }

  try{
    const r2 = await axios.get('http://localhost:5001/api/messages/conversations', { headers: { Authorization: 'Bearer '+token }});
    console.log('--- conversations ---');
    console.log('status:', r2.status);
    console.log(JSON.stringify(r2.data, null, 2));
  }catch(e){
    console.error('--- conversations error ---');
    if(e.response){ console.error('status:', e.response.status); console.error('data:', JSON.stringify(e.response.data, null, 2)); } else { console.error(e.message); }
  }

  process.exit(0);
})();
