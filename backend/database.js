import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

// 1. Esto elimina el 90% de los problemas en Render: obliga a usar IPv4
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  user: 'postgres',
  host: 'db.rgaibdgnjaimsszmizor.supabase.co', // Host oficial
  database: 'postgres',
  password: '$4tHWd##V2hkTQ_', 
  port: 5432, // Puerto directo
  ssl: {
    rejectUnauthorized: false // Permite conectar aunque el certificado sea auto-firmado
  },
  connectionTimeoutMillis: 30000, 
  idleTimeoutMillis: 30000,
});

export const initDB = async () => {
  try {
    console.log('Iniciando conexión con Supabase (Puerto 5432)...');
    
    // 2. Intentamos una consulta simple para validar
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión con Supabase establecida correctamente');
    console.log('Hora del servidor DB:', res.rows[0].now);
    
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    // Si falla el puerto 5432, podrías probar cambiar a 6543 en la línea 13
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