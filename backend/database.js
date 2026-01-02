import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// Creamos la conexión con Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Esto es obligatorio para que Render se conecte a Supabase
  }
});

export const initDB = async () => {
  console.log('Intentando conectar a Supabase...');
  
  // Retornamos un objeto que imite la interfaz de sql.js para no romper tu server.js
  return {
    // Para consultas tipo SELECT
    exec: async (query, params = []) => {
      try {
        // Cambiamos los "?" de SQLite por "$1, $2..." de PostgreSQL
        let i = 0;
        const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; });
        
        const res = await pool.query(pgQuery, params);
        
        // Retornamos el formato exacto que espera tu server.js
        return [{ 
          values: res.rows.map(row => Object.values(row)) 
        }];
      } catch (error) {
        console.error("Error en DB (exec):", error);
        throw error;
      }
    },
    // Para INSERT, UPDATE, DELETE
    run: async (query, params = []) => {
      try {
        let i = 0;
        const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; });
        return await pool.query(pgQuery, params);
      } catch (error) {
        console.error("Error en DB (run):", error);
        throw error;
      }
    }
  };
};

// En PostgreSQL no hace falta guardar un archivo, los cambios son instantáneos
export const saveDB = () => {
  return true;
};

export default { initDB, saveDB };