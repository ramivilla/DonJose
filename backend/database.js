import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// Validar que las variables de entorno necesarias estén definidas
const requiredEnvVars = ['SUPABASE_HOST', 'SUPABASE_USER', 'SUPABASE_PASSWORD', 'SUPABASE_DATABASE', 'SUPABASE_PORT'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ ERROR: Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
  console.error('Creá un archivo backend/.env basado en backend/.env.example');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.SUPABASE_HOST,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE,
  port: parseInt(process.env.SUPABASE_PORT),
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 20000,
});

export const initDB = async () => {
  try {
    console.log('Conectando a Supabase...');
    const client = await pool.connect();
    console.log('✅ Conectado exitosamente a Supabase');
    await pool.query('SELECT NOW()');
    client.release();
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }

  return {
    exec: async (query, params = []) => {
      try {
        let paramIndex = 0;
        const pgQuery = query
          .replace(/\?/g, () => `${++paramIndex}`)
          .replace(/date\('now'\)/gi, 'CURRENT_DATE')
          .replace(/date\("now"\)/gi, 'CURRENT_DATE')
          .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
          .replace(/datetime\("now"\)/gi, 'CURRENT_TIMESTAMP');

        const res = await pool.query(pgQuery, params);

        return [{
          values: res.rows.map(row => Object.values(row))
        }];
      } catch (e) {
        console.error('❌ Error en exec:', e.message);
        return [{ values: [] }];
      }
    },

    run: async (query, params = []) => {
      try {
        let paramIndex = 0;
        const pgQuery = query
          .replace(/\?/g, () => `${++paramIndex}`)
          .replace(/date\('now'\)/gi, 'CURRENT_DATE')
          .replace(/date\("now"\)/gi, 'CURRENT_DATE')
          .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
          .replace(/datetime\("now"\)/gi, 'CURRENT_TIMESTAMP');

        return await pool.query(pgQuery, params);
      } catch (e) {
        console.error('❌ Error en run:', e.message);
        throw e;
      }
    }
  };
};

export const saveDB = () => true;
export default { initDB, saveDB };
