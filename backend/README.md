# Backend Reposteria

API en FastAPI para administrar ingredientes, recetas, empleados y costos de produccion.

## Requisitos

- Python 3.11 o superior
- `venv` habilitado

## Instalacion limpia

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

## Notas

- Si no defines `DATABASE_URL`, el proyecto usa SQLite local con `repostreria.db`.
- Al arrancar, la app crea las tablas faltantes y siembra el catalogo base de unidades.
