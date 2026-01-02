-- Script para crear todas las tablas en Supabase (PostgreSQL)
-- Ejecutar este script en el SQL Editor de Supabase

-- Tabla de stock
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  dueno TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de nacimientos
CREATE TABLE IF NOT EXISTS nacimientos (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  dueno TEXT NOT NULL,
  machos INTEGER NOT NULL DEFAULT 0,
  hembras INTEGER NOT NULL DEFAULT 0,
  notas TEXT
);

-- Tabla de muertes
CREATE TABLE IF NOT EXISTS muertes (
  id SERIAL PRIMARY KEY,
  tipo_animal TEXT NOT NULL,
  sexo TEXT NOT NULL,
  dueno TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  causa TEXT,
  es_recien_nacido INTEGER DEFAULT 0,
  fecha DATE NOT NULL
);

-- Tabla de ventas de terneros
CREATE TABLE IF NOT EXISTS ventas_terneros (
  id SERIAL PRIMARY KEY,
  tipo TEXT DEFAULT 'Terneros',
  fecha_venta DATE NOT NULL,
  dueno TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  kilos_por_animal REAL,
  kilos_totales REAL,
  precio_por_kg REAL,
  precio_total REAL,
  fecha_cobro DATE,
  notas TEXT
);

-- Tabla de compras de terneros
CREATE TABLE IF NOT EXISTS compras_terneros (
  id SERIAL PRIMARY KEY,
  fecha_compra DATE NOT NULL,
  dueno TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  kilos_por_animal REAL,
  kilos_totales REAL,
  precio_por_kg REAL,
  precio_total REAL,
  fecha_pago DATE,
  notas TEXT
);

-- Tabla de ventas de vacas/toros
CREATE TABLE IF NOT EXISTS ventas_vacas_toros (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  fecha_venta DATE NOT NULL,
  dueno TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  kilos_por_animal REAL,
  kilos_totales REAL,
  precio_por_kg REAL,
  precio_total REAL,
  fecha_cobro DATE,
  notas TEXT
);

-- Tabla de compras de vacas/toros
CREATE TABLE IF NOT EXISTS compras_vacas_toros (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  fecha_compra DATE NOT NULL,
  dueno TEXT NOT NULL,
  proveedor TEXT,
  cantidad INTEGER NOT NULL,
  kilos_por_animal REAL,
  kilos_totales REAL,
  precio_por_kg REAL,
  precio_total REAL,
  fecha_pago DATE,
  notas TEXT
);

-- Tabla de lotes
CREATE TABLE IF NOT EXISTS lotes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  superficie TEXT,
  notas TEXT,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de animales a lotes
CREATE TABLE IF NOT EXISTS lote_asignaciones (
  id SERIAL PRIMARY KEY,
  lote_id INTEGER NOT NULL,
  tipo_animal TEXT NOT NULL,
  dueno TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lote_id) REFERENCES lotes(id)
);

-- Tabla de stock de cereales por año
CREATE TABLE IF NOT EXISTS stock_cereales (
  id SERIAL PRIMARY KEY,
  año INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Blanco', 'Negro')),
  kg_disponibles INTEGER NOT NULL,
  kg_vendidos INTEGER DEFAULT 0,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(año, tipo)
);

-- Tabla de ventas de cereales
CREATE TABLE IF NOT EXISTS ventas_cereales (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  año INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Blanco', 'Negro')),
  kg_vendidos INTEGER NOT NULL,
  precio_por_kg REAL NOT NULL,
  total_vendido REAL NOT NULL,
  retencion REAL NOT NULL DEFAULT 0,
  valor_final REAL NOT NULL,
  fecha_cobro DATE,
  notas TEXT
);

-- Insertar datos iniciales de stock
INSERT INTO stock (tipo, dueno, cantidad) VALUES 
('Toro', 'Perla', 0),
('Toro', 'Salgado', 0),
('Toro', 'Ramon', 0),
('Vacas', 'Perla', 0),
('Vacas', 'Salgado', 0),
('Vacas', 'Ramon', 0),
('Vacas viejas', 'Perla', 0),
('Vacas viejas', 'Salgado', 0),
('Vacas viejas', 'Ramon', 0),
('Terneros', 'Perla', 0),
('Terneros', 'Salgado', 0),
('Terneros', 'Ramon', 0),
('Terneras', 'Perla', 0),
('Terneras', 'Salgado', 0),
('Terneras', 'Ramon', 0),
('Vaquillonas', 'Perla', 0),
('Vaquillonas', 'Salgado', 0),
('Vaquillonas', 'Ramon', 0),
('Novillo', 'Perla', 0),
('Novillo', 'Salgado', 0),
('Novillo', 'Ramon', 0)
ON CONFLICT DO NOTHING;

-- Insertar lotes iniciales
INSERT INTO lotes (nombre, superficie) VALUES 
('Lote 1A', '24Ha 43A'),
('Lote 1B', '8Ha 99A'),
('Lote 1C', '8Ha 82A'),
('Lote 2', '59Ha 11A'),
('Lote 3', '71Ha 23A'),
('Lote 4', '60Ha 10A'),
('Lote 5', '28Ha 41A + 35Ha 36A'),
('Lote 6', '29Ha 52A'),
('Lote 7A', '35Ha 71A + 49Ha 44A + 42Ha 90A'),
('Lote 7B', 'Con laguna'),
('Lote 8', '94Ha 14A'),
('Lote 9', '35Ha 48A')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar stock de cereales para el año actual
INSERT INTO stock_cereales (año, tipo, kg_disponibles, kg_vendidos) VALUES 
(EXTRACT(YEAR FROM CURRENT_DATE), 'Blanco', 223600, 0),
(EXTRACT(YEAR FROM CURRENT_DATE), 'Negro', 51600, 0)
ON CONFLICT (año, tipo) DO NOTHING;