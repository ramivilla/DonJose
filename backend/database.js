import initSqlJs from 'sql.js';
import fs from 'fs';

let db;

// Ruta de la base de datos (usa /data en producción si existe, sino local)
const DB_PATH = process.env.NODE_ENV === 'production' && fs.existsSync('/data') 
  ? '/data/don-jose.db' 
  : 'don-jose.db';

const initDB = async () => {
  const SQL = await initSqlJs();
  
  // Intentar cargar la base de datos existente
  try {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log(`Base de datos cargada desde: ${DB_PATH}`);
  } catch {
    // Si no existe, crear una nueva
    db = new SQL.Database();
    console.log(`Nueva base de datos creada en: ${DB_PATH}`);
  }

  // Crear tablas
  db.run(`
    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      dueno TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      fecha_actualizacion TEXT DEFAULT (date('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nacimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      dueno TEXT NOT NULL,
      machos INTEGER NOT NULL DEFAULT 0,
      hembras INTEGER NOT NULL DEFAULT 0,
      notas TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS muertes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_animal TEXT NOT NULL,
      sexo TEXT NOT NULL,
      dueno TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      causa TEXT,
      es_recien_nacido INTEGER DEFAULT 0,
      fecha TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ventas_terneros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT DEFAULT 'Terneros',
      fecha_venta TEXT NOT NULL,
      dueno TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      kilos_por_animal REAL,
      kilos_totales REAL,
      precio_por_kg REAL,
      precio_total REAL,
      fecha_cobro TEXT,
      notas TEXT
    );
  `);

  // Agregar columna 'tipo' si no existe (para bases de datos existentes)
  try {
    db.run(`ALTER TABLE ventas_terneros ADD COLUMN tipo TEXT DEFAULT 'Terneros'`);
  } catch (e) {
    // La columna ya existe, ignorar error
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS compras_terneros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_compra TEXT NOT NULL,
      dueno TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      kilos_por_animal REAL,
      kilos_totales REAL,
      precio_por_kg REAL,
      precio_total REAL,
      fecha_pago TEXT,
      notas TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ventas_vacas_toros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      fecha_venta TEXT NOT NULL,
      dueno TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      kilos_por_animal REAL,
      kilos_totales REAL,
      precio_por_kg REAL,
      precio_total REAL,
      fecha_cobro TEXT,
      notas TEXT
    );
  `);

  // Agregar columna 'precio_por_kg' si no existe
  try {
    db.run(`ALTER TABLE ventas_vacas_toros ADD COLUMN precio_por_kg REAL`);
  } catch (e) {
    // La columna ya existe, ignorar error
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS compras_vacas_toros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      fecha_compra TEXT NOT NULL,
      dueno TEXT NOT NULL,
      proveedor TEXT,
      cantidad INTEGER NOT NULL,
      kilos_por_animal REAL,
      kilos_totales REAL,
      precio_por_kg REAL,
      precio_total REAL,
      fecha_pago TEXT,
      notas TEXT
    );
  `);

  // Agregar columna 'precio_por_kg' si no existe
  try {
    db.run(`ALTER TABLE compras_vacas_toros ADD COLUMN precio_por_kg REAL`);
  } catch (e) {
    // La columna ya existe, ignorar error
  }

  // Tabla de lotes
  db.run(`
    CREATE TABLE IF NOT EXISTS lotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      superficie TEXT,
      notas TEXT,
      fecha_actualizacion TEXT DEFAULT (date('now'))
    );
  `);

  // Tabla de asignaciones de animales a lotes
  db.run(`
    CREATE TABLE IF NOT EXISTS lote_asignaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lote_id INTEGER NOT NULL,
      tipo_animal TEXT NOT NULL,
      dueno TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      fecha_asignacion TEXT DEFAULT (date('now')),
      FOREIGN KEY (lote_id) REFERENCES lotes(id)
    );
  `);

  // Tabla de stock de cereales por año
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_cereales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      año INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('Blanco', 'Negro')),
      kg_disponibles INTEGER NOT NULL,
      kg_vendidos INTEGER DEFAULT 0,
      fecha_actualizacion TEXT DEFAULT (date('now')),
      UNIQUE(año, tipo)
    );
  `);

  // Tabla de ventas de cereales
  db.run(`
    CREATE TABLE IF NOT EXISTS ventas_cereales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      año INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('Blanco', 'Negro')),
      kg_vendidos INTEGER NOT NULL,
      precio_por_kg REAL NOT NULL,
      total_vendido REAL NOT NULL,
      retencion REAL NOT NULL DEFAULT 0,
      valor_final REAL NOT NULL,
      fecha_cobro TEXT,
      notas TEXT
    );
  `);

  // Agregar columna fecha_cobro si no existe (para bases de datos existentes)
  try {
    db.run(`ALTER TABLE ventas_cereales ADD COLUMN fecha_cobro TEXT`);
  } catch (e) {
    // La columna ya existe, ignorar error
  }

  // Inicializar stock de cereales para el año actual si no existe
  const añoActual = new Date().getFullYear();
  const stockCerealesCheck = db.exec('SELECT COUNT(*) as count FROM stock_cereales WHERE año = ?', [añoActual]);
  const stockCerealesCount = stockCerealesCheck[0]?.values[0]?.[0] || 0;
  
  if (stockCerealesCount === 0) {
    // Stock fijo anual: 223600 kg Blanco, 51600 kg Negro
    db.run('INSERT INTO stock_cereales (año, tipo, kg_disponibles, kg_vendidos) VALUES (?, ?, ?, ?)', 
           [añoActual, 'Blanco', 223600, 0]);
    db.run('INSERT INTO stock_cereales (año, tipo, kg_disponibles, kg_vendidos) VALUES (?, ?, ?, ?)', 
           [añoActual, 'Negro', 51600, 0]);
  }

  // Inicializar lotes si está vacío
  const lotesCheck = db.exec('SELECT COUNT(*) as count FROM lotes');
  const lotesCount = lotesCheck[0]?.values[0]?.[0] || 0;
  
  if (lotesCount === 0) {
    const lotes = [
      { nombre: 'Lote 1A', superficie: '24Ha 43A' },
      { nombre: 'Lote 1B', superficie: '8Ha 99A' },
      { nombre: 'Lote 1C', superficie: '8Ha 82A' },
      { nombre: 'Lote 2', superficie: '59Ha 11A' },
      { nombre: 'Lote 3', superficie: '71Ha 23A' },
      { nombre: 'Lote 4', superficie: '60Ha 10A' },
      { nombre: 'Lote 5', superficie: '28Ha 41A + 35Ha 36A' },
      { nombre: 'Lote 6', superficie: '29Ha 52A' },
      { nombre: 'Lote 7A', superficie: '35Ha 71A + 49Ha 44A + 42Ha 90A' },
      { nombre: 'Lote 7B', superficie: 'Con laguna' },
      { nombre: 'Lote 8', superficie: '94Ha 14A' },
      { nombre: 'Lote 9', superficie: '35Ha 48A' }
    ];
    
    lotes.forEach(lote => {
      db.run('INSERT INTO lotes (nombre, superficie) VALUES (?, ?)', [lote.nombre, lote.superficie]);
    });
  }

  // Inicializar stock si está vacío
  const stockCheck = db.exec('SELECT COUNT(*) as count FROM stock');
  const stockCount = stockCheck[0]?.values[0]?.[0] || 0;
  
  if (stockCount === 0) {
    const tipos = ['Toro', 'Vacas', 'Vacas viejas', 'Terneros', 'Terneras', 'Vaquillonas', 'Novillo'];
    const duenos = ['Perla', 'Salgado', 'Ramon'];
    tipos.forEach(tipo => {
      duenos.forEach(dueno => {
        db.run('INSERT INTO stock (tipo, dueno, cantidad) VALUES (?, ?, ?)', [tipo, dueno, 0]);
      });
    });
  }

  return db;
};

// Función para guardar la base de datos
export const saveDB = () => {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);
    console.log(`Base de datos guardada en: ${DB_PATH}`);
  }
};

export { initDB };
export default { initDB, saveDB };
