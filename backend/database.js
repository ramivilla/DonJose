export const initDB = async () => {
  console.log('Iniciando conexión con PostgreSQL...');
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa a Supabase');
  } catch (err) {
    console.error('❌ Error al conectar a la base de datos:', err.message);
  }
  
  return {
    // Esta es la parte que corregimos para que coincida con lo que espera tu server.js
    exec: async (query, params = []) => {
      let i = 0;
      const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; });
      const res = await pool.query(pgQuery, params);
      
      // Retornamos el formato que espera tu lógica de servidor
      return [{ 
        columns: res.fields ? res.fields.map(f => f.name) : [],
        values: res.rows.map(row => Object.values(row)) 
      }];
    },
    run: async (query, params = []) => {
      let i = 0;
      const pgQuery = query.replace(/\?/g, () => { i++; return `$${i}`; });
      return await pool.query(pgQuery, params);
    },
    // Añadimos esta para consultas directas que devuelven filas
    query: async (text, params) => {
      return await pool.query(text, params);
    }
  };
};