# Repostreria

Proyecto para administrar ingredientes, recetas, costos de produccion y calculos de negocio para una reposteria.

El repositorio incluye:
- un backend en FastAPI + SQLite
- un frontend actual en React + Vite dentro de `repo`
- una carpeta `frontend` antigua que no es la version principal actual

## Estructura principal

- [backend](/Users/saul/Desktop/portafolio/repostreria/backend): API, logica de negocio, pruebas e instaladores
- [repo](/Users/saul/Desktop/portafolio/repostreria/repo): frontend React + Vite
- [frontend](/Users/saul/Desktop/portafolio/repostreria/frontend): frontend anterior, mantenido solo como referencia historica

## Estado actual

La version vigente del proyecto es:
- backend en `backend`
- frontend en `repo`

El backend ya incluye:
- configuracion centralizada
- `.env.example`
- instaladores para macOS, Linux y Windows
- pruebas de logica y de API

El frontend ya incluye:
- configuracion por entorno con `VITE_API_URL`
- `.env.example`
- build funcional con Vite

## Requisitos

### Backend
- Python 3.11 o superior

### Frontend
- Node.js 20 o superior
- npm 10 o superior

## Instalacion rapida en Windows

### 1. Backend

En PowerShell, entra a la carpeta del backend y ejecuta:

```powershell
cd .\backend
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1
```

Opciones utiles:

```powershell
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -CheckOnly
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -SkipTests
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -Run
```

Documentacion detallada:
- [backend/README.md](/Users/saul/Desktop/portafolio/repostreria/backend/README.md)

### 2. Frontend

En otra terminal:

```powershell
cd .\repo
copy .env.example .env
npm install
npm run dev
```

La variable principal del frontend es:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Documentacion detallada:
- [repo/README.md](/Users/saul/Desktop/portafolio/repostreria/repo/README.md)

## Instalacion rapida en macOS o Linux

### 1. Backend

```bash
cd backend
bash install_backend.sh
```

### 2. Frontend

```bash
cd repo
cp .env.example .env
npm install
npm run dev
```

## URLs esperadas en desarrollo

- Backend: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- Frontend Vite: `http://127.0.0.1:5173`

## Flujo recomendado para probar en otra PC

1. Instalar y validar primero el backend.
2. Confirmar que el backend responde en `/docs`.
3. Configurar `repo/.env` con la URL correcta del backend.
4. Instalar y levantar el frontend.
5. Verificar que frontend y backend se comuniquen correctamente.

## Notas importantes

- El backend usa SQLite por defecto con `repostreria.db`.
- El frontend actual no usa la carpeta `frontend`; usa la carpeta `repo`.
- La eliminacion de ingredientes desde la interfaz de `repo` esta desactivada mientras el backend no exponga ese endpoint.

## Referencias utiles

- [backend/README.md](/Users/saul/Desktop/portafolio/repostreria/backend/README.md)
- [repo/README.md](/Users/saul/Desktop/portafolio/repostreria/repo/README.md)
- [backend/.env.example](/Users/saul/Desktop/portafolio/repostreria/backend/.env.example)
- [repo/.env.example](/Users/saul/Desktop/portafolio/repostreria/repo/.env.example)
