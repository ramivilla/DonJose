import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// CONFIGURACIÓN MANUAL (Más robusta)
const pool = new Pool({
  user: 'postgres',
  host: 'db.rgaibdgnjaimsszmizor.supabase.co',
  database: 'postgres',
  password: '$4tHWd##V2hkTQ_', // ACÁ PONEMOS LA CLAVE REAL CON LOS #
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000, // 30 segundos
});

export const initDB = async () => {
  try {
    console.log('Intentando conectar a Supabase...');
    const client = await pool.connect();
    console.log('✅ Conexión con Supabase establecida correctamente');
    client.release(); // Devolvemos la conexión al pool
  } catch (err) {
    console.error('❌ Error crítico de conexión:', err.message);
  }

  return {
    exec: async (query, params = []) => {
      let i = 0;
      const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; })
                           .replace(/date\('now'\)/gi, 'CURRENT_DATE');
      const res = await pool.query(pgQuery, params);
      return [{ values: res.rows.map(row => Object.values(row)) }];
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