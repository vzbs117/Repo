# Backend Repostreria

API en FastAPI para administrar ingredientes, recetas, empleados y costos de produccion.

## Requisitos

- Python 3.11 o superior
- soporte para `venv`

## Instalacion recomendada

### macOS o Linux
```bash
bash install_backend.sh
```

### Windows PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1
```

### Windows con wrapper
```bat
install_backend.bat
```

Los instaladores hacen lo siguiente:
- validan Python y version minima
- crean `.venv` si hace falta
- instalan dependencias
- crean `.env` desde `.env.example` si no existe
- ejecutan las pruebas del backend

## Opciones utiles del instalador

### macOS o Linux
```bash
bash install_backend.sh --check-only
bash install_backend.sh --skip-tests
bash install_backend.sh --run
```

### Windows
```powershell
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -CheckOnly
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -SkipTests
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -Run
```

## Instalacion manual

1. Crear entorno virtual:
```bash
python3 -m venv .venv
```

2. Activarlo:
```bash
source .venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

4. Crear `.env`:
```bash
cp .env.example .env
```

## Ejecucion

Con el entorno virtual activo:
```bash
python run.py
```

## URLs esperadas

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

## Pruebas

```bash
python -m unittest discover -s tests -v
```

## Variables de entorno

- `DATABASE_URL`: cadena de conexion de la base de datos
- `HOST`: host del servidor
- `PORT`: puerto del servidor
- `UVICORN_RELOAD`: activa o desactiva recarga automatica
- `BACKEND_CORS_ORIGINS`: origenes permitidos por CORS, separados por comas

La configuracion se centraliza en `app/settings.py`.

## Notas

- Si no defines `DATABASE_URL`, se usa SQLite local con `repostreria.db`.
- Al arrancar, la app crea las tablas faltantes y siembra el catalogo base de unidades.
- El backend incluye pruebas de logica y pruebas de endpoints.
