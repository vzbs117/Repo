# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

from .db import Base, engine, SessionLocal
from .routers.empleados import (
    crear_empleado,
    listar_empleados,
    router as empleados_router,
)
from .routers.ingredientes import (
    crear_ingrediente,
    editar_ingrediente,
    listar_ingredientes,
    router as ingredientes_router,
)
from .routers.recetas import (
    actualizar_config_receta,
    agregar_item,
    borrar_item,
    borrar_receta,
    crear_receta,
    diagnostico_receta,
    editar_item,
    editar_receta,
    listar_inconsistencias_configuracion,
    listar_recetas,
    obtener_costo,
    obtener_receta,
    resumen_negocio,
    router as recetas_router,
)
from .seed import seed_unidades
from .settings import settings


# ─────────────────────────────────────────
# LIFESPAN — reemplaza @app.on_event
# ─────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Al iniciar
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_unidades(db)
    finally:
        db.close()
    yield
    # Al apagar (aquí puedes cerrar recursos si los necesitas)


# ─────────────────────────────────────────
# APP
# ─────────────────────────────────────────

app = FastAPI(
    title="API de Repostería",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────
# MANEJO GLOBAL DE ERRORES
# ─────────────────────────────────────────

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Intenta más tarde."}
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Conflicto de datos: el registro ya existe o viola una restricción."}
    )


# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"ok": True, "message": "API de Repostería funcionando"}

app.include_router(ingredientes_router)
app.include_router(recetas_router)
app.include_router(empleados_router)
