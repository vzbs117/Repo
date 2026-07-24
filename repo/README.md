# Frontend Repostreria

Aplicacion frontend en React + Vite para administrar ingredientes, recetas, equipo y calculos de negocio.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- backend disponible por HTTP

## Instalacion

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo de entorno:
```bash
cp .env.example .env
```

3. Ajustar la URL del backend:
```env
VITE_API_URL=http://127.0.0.1:8000
```

## Desarrollo

```bash
npm run dev
```

## Build de produccion

```bash
npm run build
```

## Vista previa del build

```bash
npm run preview
```

## Configuracion

La configuracion principal del frontend depende de:
- `VITE_API_URL`: URL base del backend FastAPI

## Notas

- El frontend espera que el backend este activo y accesible.
- La eliminacion de ingredientes desde la UI esta desactivada mientras el backend no exponga ese endpoint.
- La interfaz vigente del proyecto es esta carpeta `repo`.
