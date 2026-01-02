import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import dns from 'node:dns'; // <--- AGREGADO 1

dotenv.config();

// ESTA LÍNEA ES VITAL: Obliga a Node a usar IPv4 (la red que funciona en Render)
dns.setDefaultResultOrder('ipv4first'); // <--- AGREGADO 2
const pool = new Pool({
  user: 'postgres',
  host: '44.219.1.205', 
  database: 'postgres',
  password: '$4tHWd##V2hkTQ_', 
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000,
  keepAlive: true, // <--- AGREGAR ESTO
});

export const initDB = async () => {
  try {
    console.log('Intentando conectar a Supabase por IP (44.219.1.205)...');
    const client = await pool.connect();
    console.log('✅ Conexión con Supabase establecida correctamente');
    client.release(); 
  } catch (err) {
    console.error('❌ Error crítico de conexión:', err.message);
  }

  return {
    exec: async (query, params = []) => {
      try {
        let i = 0;
        const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; })
                             .replace(/date\('now'\)/gi, 'CURRENT_DATE');
        const res = await pool.query(pgQuery, params);
        return [{ values: res.rows.map(row => Object.values(row)) }];
      } catch (e) {
        console.error('Error en exec:', e.message);
        return [{ values: [] }];
      }
    },
    run: async (query, params = []) => {
      try {
        let i = 0;
        const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; })
                             .replace(/date\('now'\)/gi, 'CURRENT_DATE');
        return await pool.query(pgQuery, params);
      } catch (e) {
        console.error('Error en run:', e.message);
        throw e;
      }
    }
  };
};

export const saveDB = () => true;
export default { initDB, saveDB };