import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB, saveDB } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

let db;

// Inicializar base de datos
await initDB().then(database => {
  db = database;
  console.log('Base de datos inicializada');
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', message: 'Don José API funcionando' });
});

// DASHBOARD STATS
app.get('/api/dashboard', async (req, res) => {
  // Total de animales
  const stockResult = await db.exec('SELECT SUM(cantidad) as total FROM stock');
  const totalAnimales = stockResult[0]?.values[0]?.[0] || 0;

  // Stock por dueño
  const stockPorDuenoResult = await db.exec('SELECT dueno, SUM(cantidad) as total FROM stock GROUP BY dueno');
  const stockPorDueno = stockPorDuenoResult[0] ? stockPorDuenoResult[0].values.map(row => ({
    dueno: row[0],
    total: row[1]
  })) : [];

  // Futuros cobros (ventas pendientes de cobro)
  const cobrosResult = await  db.exec(`
    SELECT 'terneros' as tipo, fecha_cobro, dueno, precio_total, notas 
    FROM ventas_terneros 
    WHERE fecha_cobro IS NOT NULL AND fecha_cobro != '' AND fecha_cobro::date >= CURRENT_DATE
    UNION ALL
    SELECT 'vacas_toros' as tipo, fecha_cobro, dueno, precio_total, notas 
    FROM ventas_vacas_toros 
    WHERE fecha_cobro IS NOT NULL AND fecha_cobro != '' AND fecha_cobro::date >= CURRENT_DATE
    UNION ALL
    SELECT 'cereales' as tipo, fecha_cobro, 'Perla' as dueno, valor_final as precio_total, notas 
    FROM ventas_cereales 
    WHERE fecha_cobro IS NOT NULL AND fecha_cobro != '' AND fecha_cobro::date >= CURRENT_DATE
    ORDER BY fecha_cobro ASC
  `);
  const futurosCobros = cobrosResult[0] ? cobrosResult[0].values.map(row => ({
    tipo: row[0],
    fecha_cobro: row[1],
    dueno: row[2],
    precio_total: row[3],
    notas: row[4]
  })) : [];

  // Futuros pagos (compras pendientes de pago)
  const pagosResult = await db.exec(`
    SELECT 'terneros' as tipo, fecha_pago, dueno, precio_total, notas 
    FROM compras_terneros 
    WHERE fecha_pago IS NOT NULL AND fecha_pago != '' AND fecha_pago::date >= CURRENT_DATE
    UNION ALL
    SELECT 'vacas_toros' as tipo, fecha_pago, dueno, precio_total, proveedor as notas 
    FROM compras_vacas_toros 
    WHERE fecha_pago IS NOT NULL AND fecha_pago != '' AND fecha_pago::date >= CURRENT_DATE
    ORDER BY fecha_pago ASC
  `);
  const futurosPagos = pagosResult[0] ? pagosResult[0].values.map(row => ({
    tipo: row[0],
    fecha_pago: row[1],
    dueno: row[2],
    precio_total: row[3],
    notas: row[4]
  })) : [];

  res.json({
    totalAnimales,
    stockPorDueno,
    futurosCobros,
    futurosPagos
  });
});

// STOCK
app.get('/api/stock', async (req, res) => {
  const result = await db.exec('SELECT * FROM stock ORDER BY dueno, tipo');
  const stock = result[0] ? result[0].values.map(row => ({
    id: row[0],
    tipo: row[1],
    dueno: row[2],
    cantidad: row[3],
    fecha_actualizacion: row[4]
  })) : [];
  res.json(stock);
});

app.post('/api/stock', async (req, res) => {
  const { tipo, dueno, cantidad } = req.body;
  const cantidadNum = parseInt(cantidad);
  await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?', [cantidadNum, tipo, dueno]);
  saveDB();
  res.json({ success: true });
});

app.put('/api/stock/ajustar', async (req, res) => {
  const { tipo, dueno, cantidad } = req.body;
  const cantidadNum = parseInt(cantidad);
  await db.run('UPDATE stock SET cantidad = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?', [cantidadNum, tipo, dueno]);
  saveDB();
  res.json({ success: true });
});

app.post('/api/sistema/reset-total', async (req, res) => {
  try {
    // Resetear stock a 0
    await db.run('UPDATE stock SET cantidad = 0, fecha_actualizacion = CURRENT_TIMESTAMP');
    
    // Borrar todos los registros históricos
    await db.run('DELETE FROM nacimientos');
    await db.run('DELETE FROM muertes');
    await db.run('DELETE FROM ventas_terneros');
    await db.run('DELETE FROM ventas_vacas_toros');
    await db.run('DELETE FROM compras_terneros');
    await db.run('DELETE FROM compras_vacas_toros');
    
    // Borrar registros de cereales
    await db.run('DELETE FROM ventas_cereales');
    await db.run('DELETE FROM stock_cereales');
    
    // Borrar asignaciones de lotes
    await db.run('DELETE FROM lote_asignaciones');
    
    // Resetear las secuencias de IDs en PostgreSQL
    try {
      await db.run('ALTER SEQUENCE nacimientos_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE muertes_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE ventas_terneros_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE ventas_vacas_toros_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE compras_terneros_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE compras_vacas_toros_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE ventas_cereales_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE stock_cereales_id_seq RESTART WITH 1');
      await db.run('ALTER SEQUENCE lote_asignaciones_id_seq RESTART WITH 1');
    } catch (seqError) {
      console.log('Nota: Algunas secuencias pueden no existir aún:', seqError.message);
    }
    
    // Reinicializar stock de cereales para el año actual
    const añoActual = new Date().getFullYear();
    await db.run('INSERT INTO stock_cereales (año, tipo, kg_disponibles, kg_vendidos) VALUES (?, ?, ?, ?)', 
           [añoActual, 'Blanco', 223600, 0]);
    await db.run('INSERT INTO stock_cereales (año, tipo, kg_disponibles, kg_vendidos) VALUES (?, ?, ?, ?)', 
           [añoActual, 'Negro', 51600, 0]);
    
    saveDB();
    console.log('Sistema reseteado completamente');
    res.json({ success: true, message: 'Sistema reseteado exitosamente' });
  } catch (error) {
    console.error('Error al resetear sistema:', error);
    res.status(500).json({ success: false, error: 'Error al resetear el sistema' });
  }
});

// DELETE endpoints
app.delete('/api/nacimientos/:id', async (req, res) => {
  const { id } = req.params;
  
  // Obtener datos del nacimiento antes de eliminar
  const result = await db.exec('SELECT dueno, machos, hembras FROM nacimientos WHERE id = ?', [id]);
  if (result[0] && result[0].values.length > 0) {
    const dueno = result[0].values[0][0];
    const machos = result[0].values[0][1];
    const hembras = result[0].values[0][2];
    
    // Verificar stock de terneros
    if (machos > 0) {
      const stockResult = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', ['Terneros', dueno]);
      const stockActual = stockResult[0]?.values[0]?.[0] || 0;
      
      if (stockActual < machos) {
        return res.status(400).json({ 
          success: false, 
          error: `No se puede eliminar. Stock de Terneros (${stockActual}) es menor que los machos del nacimiento (${machos}).` 
        });
      }
    }
    
    // Verificar stock de terneras
    if (hembras > 0) {
      const stockResult = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', ['Terneras', dueno]);
      const stockActual = stockResult[0]?.values[0]?.[0] || 0;
      
      if (stockActual < hembras) {
        return res.status(400).json({ 
          success: false, 
          error: `No se puede eliminar. Stock de Terneras (${stockActual}) es menor que las hembras del nacimiento (${hembras}).` 
        });
      }
    }
    
    // Restar del stock
    if (machos > 0) {
      await db.run('UPDATE stock SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
        [machos, 'Terneros', dueno]);
    }
    if (hembras > 0) {
      await db.run('UPDATE stock SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
        [hembras, 'Terneras', dueno]);
    }
    
    // Eliminar registro
    await db.run('DELETE FROM nacimientos WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Registro no encontrado' });
  }
});

app.delete('/api/muertes/:id', async (req, res) => {
  const { id } = req.params;
  
  // Obtener datos de la muerte antes de eliminar
  const result = await db.exec('SELECT tipo_animal, dueno, cantidad FROM muertes WHERE id = ?', [id]);
  if (result[0] && result[0].values.length > 0) {
    const tipo_animal = result[0].values[0][0];
    const dueno = result[0].values[0][1];
    const cantidad = result[0].values[0][2];
    
    // Devolver al stock
    await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
      [cantidad, tipo_animal, dueno]);
    
    // Eliminar registro
    await db.run('DELETE FROM muertes WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Registro no encontrado' });
  }
});

app.delete('/api/ventas-terneros/:id', async (req, res) => {
  const { id } = req.params;
  
  // Obtener datos de la venta antes de eliminar
  const result = await db.exec('SELECT dueno, cantidad FROM ventas_terneros WHERE id = ?', [id]);
  if (result[0] && result[0].values.length > 0) {
    const dueno = result[0].values[0][0];
    const cantidad = result[0].values[0][1];
    
    // Devolver al stock
    await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
      [cantidad, 'Terneros', dueno]);
    
    // Eliminar registro
    await db.run('DELETE FROM ventas_terneros WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Registro no encontrado' });
  }
});

app.delete('/api/ventas-vacas-toros/:id', async (req, res) => {
  const { id } = req.params;
  
  // Obtener datos de la venta antes de eliminar
  const result = await db.exec('SELECT tipo, dueno, cantidad FROM ventas_vacas_toros WHERE id = ?', [id]);
  if (result[0] && result[0].values.length > 0) {
    const tipo = result[0].values[0][0];
    const dueno = result[0].values[0][1];
    const cantidad = result[0].values[0][2];
    
    // Devolver al stock
    await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
      [cantidad, tipo, dueno]);
    
    // Eliminar registro
    await db.run('DELETE FROM ventas_vacas_toros WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Registro no encontrado' });
  }
});

app.delete('/api/compras-terneros/:id', async (req, res) => {
  const { id } = req.params;
  
  // Obtener datos de la compra antes de eliminar
  const result = await db.exec('SELECT dueno, cantidad FROM compras_terneros WHERE id = ?', [id]);
  if (result[0] && result[0].values.length > 0) {
    const dueno = result[0].values[0][0];
    const cantidad = result[0].values[0][1];
    
    // Verificar stock actual
    const stockResult = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', ['Terneros', dueno]);
    const stockActual = stockResult[0]?.values[0]?.[0] || 0;
    
    if (stockActual < cantidad) {
      return res.status(400).json({ 
        success: false, 
        error: `No se puede eliminar. Stock actual (${stockActual}) es menor que la cantidad de la compra (${cantidad}). Probablemente esta compra no impactó en el stock o ya vendiste estos animales.` 
      });
    }
    
    // Restar del stock
    await db.run('UPDATE stock SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
      [cantidad, 'Terneros', dueno]);
    
    // Eliminar registro
    await db.run('DELETE FROM compras_terneros WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Registro no encontrado' });
  }
});

app.delete('/api/compras-vacas-toros/:id', async (req, res) => {
  const { id } = req.params;
  
  // Obtener datos de la compra antes de eliminar
  const result = await db.exec('SELECT tipo, dueno, cantidad FROM compras_vacas_toros WHERE id = ?', [id]);
  if (result[0] && result[0].values.length > 0) {
    const tipo = result[0].values[0][0];
    const dueno = result[0].values[0][1];
    const cantidad = result[0].values[0][2];
    
    // Verificar stock actual
    const stockResult = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', [tipo, dueno]);
    const stockActual = stockResult[0]?.values[0]?.[0] || 0;
    
    if (stockActual < cantidad) {
      return res.status(400).json({ 
        success: false, 
        error: `No se puede eliminar. Stock actual (${stockActual}) es menor que la cantidad de la compra (${cantidad}). Probablemente esta compra no impactó en el stock o ya vendiste estos animales.` 
      });
    }
    
    // Restar del stock
    await db.run('UPDATE stock SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
      [cantidad, tipo, dueno]);
    
    // Eliminar registro
    await db.run('DELETE FROM compras_vacas_toros WHERE id = ?', [id]);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Registro no encontrado' });
  }
});

// NACIMIENTOS
app.get('/api/nacimientos', async (req, res) => {
  const result = await db.exec('SELECT * FROM nacimientos ORDER BY fecha DESC');
  const nacimientos = result[0] ? result[0].values.map(row => ({
    id: row[0],
    fecha: row[1],
    dueno: row[2],
    machos: row[3],
    hembras: row[4],
    notas: row[5]
  })) : [];
  res.json(nacimientos);
});

app.post('/api/nacimientos', async (req, res) => {
  const { fecha, dueno, machos, hembras, notas } = req.body;
  
  // Validar que la fecha no sea anterior a hoy
  const fechaHoy = new Date().toISOString().split('T')[0];
  if (fecha < fechaHoy) {
    return res.status(400).json({ 
      success: false, 
      error: 'No se pueden registrar nacimientos en fechas pasadas. Solo desde hoy en adelante.' 
    });
  }
  
  const machosNum = parseInt(machos) || 0;
  const hembrasNum = parseInt(hembras) || 0;
  
  // Insertar nacimiento
  await db.run('INSERT INTO nacimientos (fecha, dueno, machos, hembras, notas) VALUES (?, ?, ?, ?, ?)',
    [fecha, dueno, machosNum, hembrasNum, notas]);
  
  // Actualizar stock automáticamente
  if (machosNum > 0) {
    await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
      [machosNum, 'Terneros', dueno]);
  }
  if (hembrasNum > 0) {
    await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
      [hembrasNum, 'Terneras', dueno]);
  }
  
  saveDB();
  res.json({ success: true });
});

app.get('/api/nacimientos/stats', async (req, res) => {
  const result = await db.exec(`
    SELECT 
      strftime('%Y', fecha) as anio,
      SUM(machos) as machos,
      SUM(hembras) as hembras,
      SUM(machos + hembras) as total
    FROM nacimientos
    GROUP BY strftime('%Y', fecha)
    ORDER BY anio DESC
  `);
  
  // Obtener total de vacas actual (suma de todos los dueños)
  const stockResult = await db.exec('SELECT SUM(cantidad) as total FROM stock WHERE tipo = "Vacas"');
  const vacasTotales = stockResult[0]?.values[0]?.[0] || 1;
  
  const stats = result[0] ? result[0].values.map(row => ({
    anio: row[0],
    machos: row[1],
    hembras: row[2],
    total: row[3],
    vacas_totales: vacasTotales,
    porcentaje_paricion: ((row[3] / vacasTotales) * 100).toFixed(1)
  })) : [];
  
  res.json(stats);
});

// MUERTES
app.get('/api/muertes', async (req, res) => {
  const result = await db.exec('SELECT * FROM muertes ORDER BY fecha DESC');
  const muertes = result[0] ? result[0].values.map(row => ({
    id: row[0],
    tipo_animal: row[1],
    sexo: row[2],
    dueno: row[3],
    cantidad: row[4],
    causa: row[5],
    es_recien_nacido: row[6],
    fecha: row[7]
  })) : [];
  res.json(muertes);
});

app.post('/api/muertes', async (req, res) => {
  const { tipo_animal, dueno, cantidad, causa, es_recien_nacido, fecha } = req.body;
  
  // Validar que la fecha no sea anterior a hoy
  const fechaHoy = new Date().toISOString().split('T')[0];
  if (fecha < fechaHoy) {
    return res.status(400).json({ 
      success: false, 
      error: 'No se pueden registrar muertes en fechas pasadas. Solo desde hoy en adelante.' 
    });
  }
  
  const cantidadNum = parseInt(cantidad);
  
  // Verificar stock disponible
  const stockResult = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', [tipo_animal, dueno]);
  const stockActual = stockResult[0]?.values[0]?.[0] || 0;
  
  if (stockActual < cantidadNum) {
    return res.status(400).json({ 
      success: false, 
      error: `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidadNum}` 
    });
  }
  
  // Insertar muerte (sexo se deja como NULL o vacío ya que no se usa)
  await db.run('INSERT INTO muertes (tipo_animal, sexo, dueno, cantidad, causa, es_recien_nacido, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [tipo_animal, '', dueno, cantidadNum, causa, es_recien_nacido ? 1 : 0, fecha]);
  
  // Restar del stock
  await db.run('UPDATE stock SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
    [cantidadNum, tipo_animal, dueno]);
  
  saveDB();
  res.json({ success: true });
});

app.get('/api/muertes/stats', async (req, res) => {
  try {
    // 1. Una sola consulta que trae muertes y nacimientos juntos usando subconsultas
    const result = await db.exec(`
      SELECT 
        m.anio,
        m.total_muertes,
        m.terneros_recien_nacidos,
        COALESCE((
          SELECT SUM(machos + hembras) 
          FROM nacimientos 
          WHERE EXTRACT(YEAR FROM fecha)::text = m.anio
        ), 0) as total_nacimientos
      FROM (
        SELECT 
          EXTRACT(YEAR FROM fecha)::text as anio,
          SUM(cantidad) as total_muertes,
          SUM(CASE WHEN es_recien_nacido = 1 THEN cantidad ELSE 0 END) as terneros_recien_nacidos
        FROM muertes
        GROUP BY 1
      ) m
      ORDER BY m.anio DESC
    `);

    // 2. Ahora el .map es simple y no necesita 'await' adentro
    const stats = result[0] ? result[0].values.map(row => {
      const anio = row[0];
      const totalMuertes = row[1];
      const ternerosRecienNacidos = row[2];
      const totalNacimientos = row[3];
      
      const porcentajeMuerte = totalNacimientos > 0 
        ? ((ternerosRecienNacidos / totalNacimientos) * 100).toFixed(1)
        : '0.0';

      return {
        anio,
        total_muertes: totalMuertes,
        terneros_recien_nacidos: ternerosRecienNacidos,
        total_nacimientos: totalNacimientos,
        porcentaje_muerte_terneros: porcentajeMuerte
      };
    }) : [];

    res.json(stats);
  } catch (error) {
    console.error('Error en muertes/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// VENTAS TERNEROS
app.get('/api/ventas-terneros', async (req, res) => {
  const result = await db.exec('SELECT id, tipo, fecha_venta, dueno, cantidad, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas FROM ventas_terneros ORDER BY fecha_venta DESC');
  const ventas = result[0] ? result[0].values.map(row => ({
    id: row[0],
    tipo: row[1] || 'Terneros',
    fecha_venta: row[2],
    dueno: row[3],
    cantidad: row[4],
    kilos_totales: row[5],
    precio_por_kg: row[6],
    precio_total: row[7],
    fecha_cobro: row[8],
    notas: row[9]
  })) : [];
  res.json(ventas);
});

app.post('/api/ventas-terneros', async (req, res) => {
  const { tipo, fecha_venta, dueno, cantidad, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas } = req.body;
  
  const cantidadNum = parseInt(cantidad);
  const tipoAnimal = tipo || 'Terneros';
  
  // Verificar stock disponible
  const stockResult = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', [tipoAnimal, dueno]);
  const stockActual = stockResult[0]?.values[0]?.[0] || 0;
  
  if (stockActual < cantidadNum) {
    return res.status(400).json({ 
      success: false, 
      error: `Stock insuficiente de ${tipoAnimal}. Disponible: ${stockActual}, Solicitado: ${cantidadNum}` 
    });
  }
  
  // Insertar venta
  await db.run('INSERT INTO ventas_terneros (tipo, fecha_venta, dueno, cantidad, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tipoAnimal, fecha_venta, dueno, cantidadNum, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas]);
  
  // Restar del stock
  await db.run('UPDATE stock SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
    [cantidadNum, tipoAnimal, dueno]);
  
  saveDB();
  res.json({ success: true });
});

// COMPRAS TERNEROS
app.get('/api/compras-terneros', async (req, res) => {
  const result = await db.exec('SELECT * FROM compras_terneros ORDER BY fecha_compra DESC');
  const compras = result[0] ? result[0].values.map(row => ({
    id: row[0],
    fecha_compra: row[1],
    dueno: row[2],
    cantidad: row[3],
    kilos_por_animal: row[4],
    kilos_totales: row[5],
    precio_por_kg: row[6],
    precio_total: row[7],
    fecha_pago: row[8],
    notas: row[9]
  })) : [];
  res.json(compras);
});

app.post('/api/compras-terneros', async (req, res) => {
  const { fecha_compra, dueno, cantidad, kilos_por_animal, kilos_totales, precio_por_kg, precio_total, fecha_pago, notas } = req.body;
  
  const cantidadNum = parseInt(cantidad);
  
  // Insertar compra
  await db.run('INSERT INTO compras_terneros (fecha_compra, dueno, cantidad, kilos_por_animal, kilos_totales, precio_por_kg, precio_total, fecha_pago, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [fecha_compra, dueno, cantidadNum, kilos_por_animal, kilos_totales, precio_por_kg, precio_total, fecha_pago, notas]);
  
  // Sumar al stock de Terneros
  await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
    [cantidadNum, 'Terneros', dueno]);
  
  saveDB();
  res.json({ success: true });
});

// VENTAS VACAS/TOROS
app.get('/api/ventas-vacas-toros', async (req, res) => {
  const result = await db.exec('SELECT id, tipo, fecha_venta, dueno, cantidad, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas FROM ventas_vacas_toros ORDER BY fecha_venta DESC');
  const ventas = result[0] ? result[0].values.map(row => ({
    id: row[0],
    tipo: row[1],
    fecha_venta: row[2],
    dueno: row[3],
    cantidad: row[4],
    kilos_totales: row[5],
    precio_por_kg: row[6],
    precio_total: row[7],
    fecha_cobro: row[8],
    notas: row[9]
  })) : [];
  res.json(ventas);
});

app.post('/api/ventas-vacas-toros', async (req, res) => {
  const { tipo, fecha_venta, dueno, cantidad, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas } = req.body;
  
  const cantidadNum = parseInt(cantidad);
  
  // Verificar stock disponible
  const stockResult = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', [tipo, dueno]);
  const stockActual = stockResult[0]?.values[0]?.[0] || 0;
  
  if (stockActual < cantidadNum) {
    return res.status(400).json({ 
      success: false, 
      error: `Stock insuficiente de ${tipo}. Disponible: ${stockActual}, Solicitado: ${cantidadNum}` 
    });
  }
  
  // Insertar venta (kilos_por_animal se deja como NULL)
  await db.run('INSERT INTO ventas_vacas_toros (tipo, fecha_venta, dueno, cantidad, kilos_por_animal, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tipo, fecha_venta, dueno, cantidadNum, null, kilos_totales, precio_por_kg, precio_total, fecha_cobro, notas]);
  
  // Restar del stock
  await db.run('UPDATE stock SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
    [cantidadNum, tipo, dueno]);
  
  saveDB();
  res.json({ success: true });
});

// COMPRAS VACAS/TOROS
app.get('/api/compras-vacas-toros', async (req, res) => {
  const result = await db.exec('SELECT id, tipo, fecha_compra, dueno, proveedor, cantidad, kilos_totales, precio_por_kg, precio_total, fecha_pago, notas FROM compras_vacas_toros ORDER BY fecha_compra DESC');
  const compras = result[0] ? result[0].values.map(row => ({
    id: row[0],
    tipo: row[1],
    fecha_compra: row[2],
    dueno: row[3],
    proveedor: row[4],
    cantidad: row[5],
    kilos_totales: row[6],
    precio_por_kg: row[7],
    precio_total: row[8],
    fecha_pago: row[9],
    notas: row[10]
  })) : [];
  res.json(compras);
});

app.post('/api/compras-vacas-toros', async (req, res) => {
  const { tipo, fecha_compra, dueno, proveedor, cantidad, kilos_totales, precio_por_kg, precio_total, fecha_pago, notas } = req.body;
  
  const cantidadNum = parseInt(cantidad);
  console.log('Compra recibida:', { tipo, dueno, cantidad: cantidadNum });
  
  // Insertar compra (kilos_por_animal se deja como NULL)
  await db.run('INSERT INTO compras_vacas_toros (tipo, fecha_compra, dueno, proveedor, cantidad, kilos_por_animal, kilos_totales, precio_por_kg, precio_total, fecha_pago, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [tipo, fecha_compra, dueno, proveedor, cantidadNum, null, kilos_totales, precio_por_kg, precio_total, fecha_pago, notas]);
  
  // Verificar stock antes
  const stockAntes = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', [tipo, dueno]);
  console.log('Stock antes:', stockAntes[0]?.values[0]?.[0] || 'No encontrado', 'para tipo:', tipo, 'dueno:', dueno);
  
  // Sumar al stock
  await db.run('UPDATE stock SET cantidad = cantidad + ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE tipo = ? AND dueno = ?',
    [cantidadNum, tipo, dueno]);
  
  // Verificar stock después
  const stockDespues = await db.exec('SELECT cantidad FROM stock WHERE tipo = ? AND dueno = ?', [tipo, dueno]);
  console.log('Stock después:', stockDespues[0]?.values[0]?.[0] || 'No encontrado');
  
  saveDB();
  res.json({ success: true });
});

// LOTES
app.get('/api/lotes', async (req, res) => {
  const result = await db.exec('SELECT * FROM lotes ORDER BY nombre');
  const lotes = result[0] ? result[0].values.map(row => ({
    id: row[0],
    nombre: row[1],
    superficie: row[2],
    notas: row[3],
    fecha_actualizacion: row[4]
  })) : [];
  res.json(lotes);
});

app.put('/api/lotes/:id', async (req, res) => {
  const { id } = req.params;
  const { notas } = req.body;
  await db.run('UPDATE lotes SET notas = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?', [notas, id]);
  saveDB();
  res.json({ success: true });
});

// ASIGNACIONES DE LOTES
app.get('/api/lote-asignaciones/:loteId', async (req, res) => {
  const { loteId } = req.params;
  const result = await db.exec('SELECT * FROM lote_asignaciones WHERE lote_id = ? ORDER BY fecha_asignacion DESC', [loteId]);
  const asignaciones = result[0] ? result[0].values.map(row => ({
    id: row[0],
    lote_id: row[1],
    tipo_animal: row[2],
    dueno: row[3],
    cantidad: row[4],
    fecha_asignacion: row[5]
  })) : [];
  res.json(asignaciones);
});

app.post('/api/lote-asignaciones', async (req, res) => {
  const { lote_id, tipo_animal, dueno, cantidad } = req.body;
  
  // Verificar si ya existe una asignación para este tipo y dueño en el lote
  const existingResult = await db.exec(
    'SELECT id, cantidad FROM lote_asignaciones WHERE lote_id = ? AND tipo_animal = ? AND dueno = ?',
    [lote_id, tipo_animal, dueno]
  );
  
  if (existingResult[0] && existingResult[0].values.length > 0) {
    // Actualizar cantidad existente
    const existingId = existingResult[0].values[0][0];
    const existingCantidad = existingResult[0].values[0][1];
    const nuevaCantidad = existingCantidad + cantidad;
    
    await db.run('UPDATE lote_asignaciones SET cantidad = ?, fecha_asignacion = CURRENT_DATE WHERE id = ?',
      [nuevaCantidad, existingId]);
  } else {
    // Crear nueva asignación
    await db.run('INSERT INTO lote_asignaciones (lote_id, tipo_animal, dueno, cantidad) VALUES (?, ?, ?, ?)',
      [lote_id, tipo_animal, dueno, cantidad]);
  }
  
  saveDB();
  res.json({ success: true });
});

app.delete('/api/lote-asignaciones/:id', async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM lote_asignaciones WHERE id = ?', [id]);
  saveDB();
  res.json({ success: true });
});

// MOVER ANIMALES DE UN LOTE A OTRO
app.post('/api/lote-asignaciones/mover', async (req, res) => {
  const { lote_origen_id, lote_destino_id } = req.body;

  try {
    // 1. Obtener todas las asignaciones del lote origen
    const asignacionesResult = await db.exec(
      'SELECT tipo_animal, dueno, cantidad FROM lote_asignaciones WHERE lote_id = ?',
      [lote_origen_id]
    );

    if (asignacionesResult[0] && asignacionesResult[0].values.length > 0) {
      // 2. CAMBIO CLAVE: Usamos "for...of" en lugar de "forEach" para que funcione el await
      for (const row of asignacionesResult[0].values) {
        const tipo_animal = row[0];
        const dueno = row[1];
        const cantidad = row[2];

        // Verificar si ya existe en el lote destino
        const existingResult = await db.exec(
          'SELECT id, cantidad FROM lote_asignaciones WHERE lote_id = ? AND tipo_animal = ? AND dueno = ?',
          [lote_destino_id, tipo_animal, dueno]
        );

        if (existingResult[0] && existingResult[0].values.length > 0) {
          // Actualizar cantidad en destino
          const existingId = existingResult[0].values[0][0];
          const existingCantidad = existingResult[0].values[0][1];
          // IMPORTANTE: Agregamos await y cambiamos CURRENT_DATE por CURRENT_DATE
          await db.run('UPDATE lote_asignaciones SET cantidad = ?, fecha_asignacion = CURRENT_DATE WHERE id = ?',
            [existingCantidad + cantidad, existingId]);
        } else {
          // Crear nueva asignación en destino
          await db.run('INSERT INTO lote_asignaciones (lote_id, tipo_animal, dueno, cantidad) VALUES (?, ?, ?, ?)',
            [lote_destino_id, tipo_animal, dueno, cantidad]);
        }
      }

      // 3. Eliminar todas las asignaciones del lote origen
      await db.run('DELETE FROM lote_asignaciones WHERE lote_id = ?', [lote_origen_id]);

      res.json({ success: true, moved: asignacionesResult[0].values.length });
    } else {
      res.json({ success: true, moved: 0 });
    }
  } catch (error) {
    console.error('Error al mover lote:', error);
    res.status(500).json({ error: error.message });
  }
});
// ===== CEREALES =====

// Obtener stock de cereales por año
app.get('/api/cereales/stock/:ano', async (req, res) => {
  const año = parseInt(req.params.ano);
  
  try {
    const result = await db.exec(`
      SELECT tipo, kg_disponibles, kg_vendidos, (kg_disponibles - kg_vendidos) as kg_restantes
      FROM stock_cereales 
      WHERE año = ?
      ORDER BY tipo
    `, [año]);
    
    if (result[0]) {
      const stock = result[0].values.map(row => ({
        tipo: row[0],
        kg_disponibles: row[1],
        kg_vendidos: row[2],
        kg_restantes: row[3]
      }));
      res.json(stock);
    } else {
      // Si no existe stock para ese año, crear con valores por defecto
      await db.run('INSERT INTO stock_cereales (año, tipo, kg_disponibles, kg_vendidos) VALUES (?, ?, ?, ?)', 
             [año, 'Blanco', 223600, 0]);
      await db.run('INSERT INTO stock_cereales (año, tipo, kg_disponibles, kg_vendidos) VALUES (?, ?, ?, ?)', 
             [año, 'Negro', 51600, 0]);
      saveDB();
      
      res.json([
        { tipo: 'Blanco', kg_disponibles: 223600, kg_vendidos: 0, kg_restantes: 223600 },
        { tipo: 'Negro', kg_disponibles: 51600, kg_vendidos: 0, kg_restantes: 51600 }
      ]);
    }
  } catch (error) {
    console.error('Error al obtener stock de cereales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener ventas de cereales por año
app.get('/api/cereales/ventas/:ano', async (req, res) => {
  const año = parseInt(req.params.ano);
  
  try {
    const result = await db.exec(`
      SELECT id, fecha, tipo, kg_vendidos, precio_por_kg, total_vendido, retencion, valor_final, fecha_cobro, notas
      FROM ventas_cereales 
      WHERE año = ?
      ORDER BY fecha DESC
    `, [año]);
    
    const ventas = result[0] ? result[0].values.map(row => ({
      id: row[0],
      fecha: row[1],
      tipo: row[2],
      kg_vendidos: row[3],
      precio_por_kg: row[4],
      total_vendido: row[5],
      retencion: row[6],
      valor_final: row[7],
      fecha_cobro: row[8],
      notas: row[9]
    })) : [];
    
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas de cereales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener años disponibles de cereales
app.get('/api/cereales/anos', async (req, res) => {
  try {
    const result = await db.exec(`
      SELECT DISTINCT año 
      FROM stock_cereales 
      ORDER BY año DESC
    `);
    
    const años = result[0] ? result[0].values.map(row => row[0]) : [];
    res.json(años);
  } catch (error) {
    console.error('Error al obtener años de cereales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear venta de cereales
app.post('/api/cereales/ventas', async (req, res) => {
  const { fecha, tipo, kg_vendidos, precio_por_kg, total_vendido, retencion, valor_final, fecha_cobro, notas } = req.body;
  
  // Validaciones
  if (!fecha || !tipo || !kg_vendidos || !precio_por_kg) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  
  if (!['Blanco', 'Negro'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de cereal inválido' });
  }
  
  const kg = parseInt(kg_vendidos);
  const precio = parseFloat(precio_por_kg);
  const totalVendido = parseFloat(total_vendido);
  const retencionVal = parseFloat(retencion) || 0;
  const valorFinal = parseFloat(valor_final);
  
  if (kg <= 0 || precio <= 0) {
    return res.status(400).json({ error: 'Cantidad y precio deben ser mayores a 0' });
  }
  
  const año = new Date(fecha).getFullYear();
  
  try {
    // Verificar stock disponible
    const stockResult = await db.exec(`
      SELECT kg_disponibles, kg_vendidos 
      FROM stock_cereales 
      WHERE año = ? AND tipo = ?
    `, [año, tipo]);
    
    if (!stockResult[0] || stockResult[0].values.length === 0) {
      return res.status(400).json({ error: 'No hay stock disponible para este año y tipo' });
    }
    
    const [kg_disponibles, kg_vendidos_actual] = stockResult[0].values[0];
    const kg_restantes = kg_disponibles - kg_vendidos_actual;
    
    if (kg > kg_restantes) {
      return res.status(400).json({ 
        error: `No hay suficiente stock. Disponible: ${kg_restantes} kg` 
      });
    }
    
    // Usar valores calculados del frontend
    // Insertar venta
    await db.run(`
      INSERT INTO ventas_cereales (fecha, año, tipo, kg_vendidos, precio_por_kg, total_vendido, retencion, valor_final, fecha_cobro, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [fecha, año, tipo, kg, precio, totalVendido, retencionVal, valorFinal, fecha_cobro || null, notas || '']);
    
    // Actualizar stock
    await db.run(`
      UPDATE stock_cereales 
      SET kg_vendidos = kg_vendidos + ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE año = ? AND tipo = ?
    `, [kg, año, tipo]);
    
    saveDB();
    res.json({ success: true, message: 'Venta registrada correctamente' });
    
  } catch (error) {
    console.error('Error al crear venta de cereales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar venta de cereales
app.delete('/api/cereales/ventas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  
  try {
    // Obtener datos de la venta antes de eliminar
    const ventaResult = await db.exec('SELECT año, tipo, kg_vendidos FROM ventas_cereales WHERE id = ?', [id]);
    
    if (!ventaResult[0] || ventaResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    const [año, tipo, kg_vendidos] = ventaResult[0].values[0];
    
    // Eliminar venta
    await db.run('DELETE FROM ventas_cereales WHERE id = ?', [id]);
    
    // Restaurar stock
    await db.run(`
      UPDATE stock_cereales 
      SET kg_vendidos = kg_vendidos - ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE año = ? AND tipo = ?
    `, [kg_vendidos, año, tipo]);
    
    saveDB();
    res.json({ success: true, message: 'Venta eliminada correctamente' });
    
  } catch (error) {
    console.error('Error al eliminar venta de cereales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
