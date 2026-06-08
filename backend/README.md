# Backend Reposteria

API en FastAPI para administrar ingredientes, recetas, empleados y costos de produccion.

## Requisitos

- Python 3.11 o superior
- `venv` habilitado

## Instalacion limpia

La forma recomendada es con el instalador.

En macOS o Linux:

```bash
bash install_backend.sh
```

En Windows con PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1
```

O con el wrapper `.bat`:

```bat
install_backend.bat
```

Ese comando:

- verifica que exista `python3`
- valida que la version sea compatible
- crea `.venv` si hace falta
- instala dependencias
- crea `.env` desde `.env.example` si no existe
- ejecuta las pruebas del backend

Opciones utiles:

```bash
bash install_backend.sh --check-only
bash install_backend.sh --skip-tests
bash install_backend.sh --run
```

Equivalentes en Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -CheckOnly
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -SkipTests
powershell -ExecutionPolicy Bypass -File .\install_backend.ps1 -Run
```

Si prefieres hacerlo manualmente:
1. Crear entorno virtual:

```bash
python3 -m venv .venv
```

2. Activar el entorno virtual:

```bash
source .venv/bin/activate
```

3. Instalar dependencias:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

4. Crear archivo de entorno:

```bash
cp .env.example .env
```

## Ejecutar el backend

Con el entorno virtual activo:

```bash
python run.py
```

La API queda disponible por defecto en:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`

## Ejecutar pruebas

```bash
python -m unittest discover -s tests -v
```

## Variables de entorno

- `DATABASE_URL`: cadena de conexion de la base de datos.
- `HOST`: host donde corre Uvicorn.
- `PORT`: puerto donde corre Uvicorn.
- `UVICORN_RELOAD`: `true` o `false` para recarga automatica.
- `BACKEND_CORS_ORIGINS`: origenes permitidos por CORS, separados por comas.

Toda la configuracion del backend se centraliza en [app/settings.py](/Users/saul/Desktop/portafolio/repostreria/backend/app/settings.py).

## Notas

- Si no defines `DATABASE_URL`, el proyecto usa SQLite local con `repostreria.db`.
- Al arrancar, la app crea las tablas faltantes y siembra el catalogo base de unidades.
