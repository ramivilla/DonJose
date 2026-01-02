# Guía de Despliegue en Render

## Pasos para desplegar:

### 1. Preparar el repositorio en GitHub

```bash
git init
git add .
git commit -m "Preparar para deploy en Render"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/don-jose.git
git push -u origin main
```

### 2. Crear cuenta en Render

1. Ir a https://render.com
2. Registrarse con GitHub
3. Autorizar acceso a tus repositorios

### 3. Crear el servicio Backend

1. Click en "New +" → "Web Service"
2. Conectar tu repositorio `don-jose`
3. Configurar:
   - **Name:** donjose-backend
   - **Root Directory:** backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

4. En "Advanced":
   - Agregar disco persistente:
     - **Mount Path:** `/data`
     - **Size:** 1 GB

5. Click "Create Web Service"

### 4. Crear el servicio Frontend

1. Click en "New +" → "Static Site"
2. Conectar el mismo repositorio
3. Configurar:
   - **Name:** donjose-frontend
   - **Root Directory:** frontend
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** dist

4. En "Environment Variables":
   - **Key:** `VITE_API_URL`
   - **Value:** URL del backend (ej: https://donjose-backend.onrender.com)

5. Click "Create Static Site"

### 5. Verificar

1. Esperar a que ambos servicios terminen de deployar (5-10 min)
2. Abrir la URL del frontend
3. Probar el login con:
   - Usuario: Administrador
   - Contraseña: ramiyfer2011

## Notas importantes:

- El backend se "duerme" después de 15 min sin uso (plan gratuito)
- La primera carga después de inactividad tarda ~30 segundos
- Los datos se guardan en el disco persistente y NO se pierden
- Para actualizar: solo hacer `git push` y Render redespliega automáticamente

## Costos:

- Backend: Gratis
- Frontend: Gratis
- Disco persistente (1GB): ~$0.25/mes

**Total: ~$0.25/mes**
