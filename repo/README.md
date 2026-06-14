# Frontend Repostreria

Aplicacion frontend en React + Vite para administrar ingredientes, recetas, equipo y calculos de negocio.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Backend disponible y accesible por HTTP

## Instalacion

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

3. Ajusta la URL del backend si hace falta:

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

## Notas

- El frontend espera que el backend exponga la API de FastAPI.
- La configuracion principal del frontend depende de `VITE_API_URL`.
- La eliminacion de ingredientes no esta habilitada desde la UI mientras el backend no exponga ese endpoint.
