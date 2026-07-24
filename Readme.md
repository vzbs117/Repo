# Repostreria

Aplicacion para administrar ingredientes, recetas, equipo y calculos de costos de una reposteria.

Este repositorio contiene dos piezas activas:
- `backend`: API en FastAPI + SQLite
- `repo`: frontend en React + Vite

La carpeta `frontend` se conserva solo como referencia historica y no es la interfaz principal actual.

## Estructura del proyecto

- `backend/`: API, logica de negocio, instaladores y pruebas
- `repo/`: frontend actual
- `frontend/`: version anterior, no recomendada para uso actual

## Tecnologias

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy
- SQLite
- Uvicorn

### Frontend
- Node.js 20+
- npm 10+
- React
- Vite

## Instalacion rapida

### Windows

#### Backend
```powershell
cd .\backend
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1
```

#### Frontend
```powershell
cd .\repo
copy .env.example .env
npm install
npm run dev
```

### macOS o Linux

#### Backend
```bash
cd backend
bash install_backend.sh
```

#### Frontend
```bash
cd repo
cp .env.example .env
npm install
npm run dev
```

## Variables de entorno principales

### Backend
Archivo: `backend/.env`

Variables principales:
- `DATABASE_URL`
- `HOST`
- `PORT`
- `UVICORN_RELOAD`
- `BACKEND_CORS_ORIGINS`

Referencia:
- `backend/.env.example`

### Frontend
Archivo: `repo/.env`

Variable principal:
- `VITE_API_URL`

Referencia:
- `repo/.env.example`

## URLs esperadas en desarrollo

- Backend: `http://127.0.0.1:8000`
- Documentacion API: `http://127.0.0.1:8000/docs`
- Frontend: `http://127.0.0.1:5173`

## Estado actual del proyecto

### Backend
Incluye:
- configuracion centralizada
- instaladores para Windows, macOS y Linux
- pruebas de logica y de API
- endpoints para ingredientes, recetas, empleados, costos y diagnostico

### Frontend
Incluye:
- configuracion por entorno con `VITE_API_URL`
- build funcional con Vite
- interfaz para ingredientes, recetas, equipo y negocio

## Flujo recomendado para probar en otra computadora

1. Instalar y validar el backend.
2. Confirmar que `/docs` responde correctamente.
3. Configurar `repo/.env` con la URL real del backend.
4. Instalar y levantar el frontend.
5. Verificar que frontend y backend se comuniquen bien.

## Documentacion por modulo

- `backend/README.md`
- `repo/README.md`

## Notas importantes

- El backend usa SQLite por defecto con `repostreria.db`.
- La interfaz actual es la carpeta `repo`, no `frontend`.
- La eliminacion de ingredientes desde la UI esta desactivada mientras el backend no exponga ese endpoint.
