# Don José - Sistema de Gestión Ganadera

Sistema web para gestión de ganadería del campo Don José.

## Estructura del Proyecto

```
don-jose/
├── backend/          # API Node.js + Express + PostgreSQL
├── frontend/         # Aplicación React + Vite
└── README.md
```

## Tecnologías

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL)
- **Hosting**: Render (frontend + backend)

## Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/ramivilla/DonJose.git
cd DonJose
```

### 2. Configurar variables de entorno del backend

```bash
cp backend/.env.example backend/.env
```

Editá `backend/.env` con tus credenciales reales de Supabase:

```env
PORT=3000
NODE_ENV=development
SUPABASE_HOST=tu_host.pooler.supabase.com
SUPABASE_USER=postgres.tu_project_ref
SUPABASE_PASSWORD=tu_password
SUPABASE_DATABASE=postgres
SUPABASE_PORT=6543
```

> Los valores reales los encontrás en: **Supabase Dashboard → Project Settings → Database → Connection Pooling**

### 3. Instalar dependencias y correr localmente

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## Deploy en Render

Las variables de entorno deben configurarse en el dashboard de Render:
**Render Dashboard → donjose-backend → Environment → Add Environment Variable**

Agregar todas las variables del `.env.example`.

## Módulos

- Dashboard con futuros cobros y pagos
- Stock de animales por dueño
- Nacimientos y muertes con estadísticas anuales
- Ventas y compras (terneros, vacas/toros, cereales)
- Mapa de lotes con asignaciones
- Historial de movimientos (auditoría de stock)
- Estadísticas anuales
