import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  // Datos exactos de tu Connection String del Pooler
  host: 'aws-0-us-west-2.pooler.supabase.com', 
  user: 'postgres.rgaibdgnjaimsszmizor', 
  password: '$4tHWd##V2hkTQ_', 
  database: 'postgres',
  port: 6543, 
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 20000,
});

export const initDB = async () => {
  try {
    console.log('Conectando al Pooler de Supabase (us-west-2)...');
    const client = await pool.connect();
    console.log('✅ ¡CONECTADO EXITOSAMENTE!');
    
    // Verificamos que responda
    const res = await pool.query('SELECT NOW()');
    console.log('Respuesta de la DB:', res.rows[0].now);
    
    client.release();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
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