import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// Forzamos la carga de variables de entorno
dotenv.config();

// Verificación de seguridad antes de intentar conectar
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR CRÍTICO: La variable DATABASE_URL no está definida en el sistema.");
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const initDB = async () => {
  console.log('Iniciando conexión con PostgreSQL...');
  try {
    // Probamos la conexión con una consulta simple
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a Supabase');
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
  }
  
  return {
    exec: async (query, params = []) => {
      let i = 0;
      const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; });
      const res = await pool.query(pgQuery, params);
      return [{ 
        values: res.rows.map(row => Object.values(row)) 
      }];
    },
    run: async (query, params = []) => {
      let i = 0;
      const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; });
      return await pool.query(pgQuery, params);
    }
  };
};

export const saveDB = () => true;

export { pool }; // Por si lo necesitas en otros archivos
export default { initDB, saveDB };