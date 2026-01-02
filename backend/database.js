import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

// ESTA LÍNEA ES LA CLAVE: Fuerza a Node a usar IPv4 primero
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, 
});

export const initDB = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión con Supabase establecida');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }

  return {
    exec: async (query, params = []) => {
      // Traducir '?' de SQLite a '$1, $2...' de Postgres
      let i = 0;
      const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; })
                           .replace(/date\('now'\)/gi, 'CURRENT_DATE'); // Traducción de fecha
      
      const res = await pool.query(pgQuery, params);
      return [{ 
        values: res.rows.map(row => Object.values(row)) 
      }];
    },
    run: async (query, params = []) => {
      let i = 0;
      const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; })
                           .replace(/date\('now'\)/gi, 'CURRENT_DATE');
      return await pool.query(pgQuery, params);
    }
  };
};

export const saveDB = () => true; 
export default { initDB, saveDB };