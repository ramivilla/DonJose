import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  // Datos exactos de tu Connection String del Pooler
  host: '***REMOVED***', 
  user: 'postgres.***REMOVED***', 
  password: '***REMOVED***', 
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
        // Convertir placeholders ? a $1, $2, etc. correctamente
        let paramIndex = 0;
        const pgQuery = query
          .replace(/\?/g, () => `$${++paramIndex}`)
          .replace(/date\('now'\)/gi, 'CURRENT_DATE')
          .replace(/date\("now"\)/gi, 'CURRENT_DATE')
          .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
          .replace(/datetime\("now"\)/gi, 'CURRENT_TIMESTAMP');
        
        console.log('🔍 Ejecutando exec query:', pgQuery);
        console.log('📝 Con parámetros:', params);
        
        const res = await pool.query(pgQuery, params);
        
        // Simular formato SQLite para compatibilidad
        return [{
          values: res.rows.map(row => Object.values(row))
        }];
      } catch (e) {
        console.error('❌ Error en exec:', e.message);
        console.error('Query original:', query);
        console.error('Parámetros:', params);
        return [{ values: [] }];
      }
    },
    
    run: async (query, params = []) => {
      try {
        // Convertir placeholders ? a $1, $2, etc. correctamente
        let paramIndex = 0;
        const pgQuery = query
          .replace(/\?/g, () => `$${++paramIndex}`)
          .replace(/date\('now'\)/gi, 'CURRENT_DATE')
          .replace(/date\("now"\)/gi, 'CURRENT_DATE')
          .replace(/datetime\('now'\)/gi, 'CURRENT_TIMESTAMP')
          .replace(/datetime\("now"\)/gi, 'CURRENT_TIMESTAMP');
        
        console.log('🔍 Ejecutando run query:', pgQuery);
        console.log('📝 Con parámetros:', params);
        
        return await pool.query(pgQuery, params);
      } catch (e) {
        console.error('❌ Error en run:', e.message);
        console.error('Query original:', query);
        console.error('Parámetros:', params);
        throw e;
      }
    }
  };
};

export const saveDB = () => true;
export default { initDB, saveDB };