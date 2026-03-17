# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError

from .db import Base, engine, SessionLocal          # ✅ engine corregido
from .schemas import (
    IngredienteCreate, IngredienteOut, IngredienteUpdate,
    RecetasCreate, RecetaOut,
    RecetaItemCreate, RecetaItemOut, RecetaDetalleOut,
    RecetaConfigUpdate, RecetaItemUpdate,
    EmpleadoCreate, EmpleadoOut
)
from .models import Ingrediente, Receta, RecetaItem, Empleado
from .seed import seed_unidades
from . import crud


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


# ─────────────────────────────────────────
# CORS — corregido para producción
# ─────────────────────────────────────────

ALLOWED_ORIGINS = [
    "http://localhost:3000",    # desarrollo frontend
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5501",   # para pruebas con Swagger UI
    # "https://tu-dominio.com", # ← agrega tu dominio de producción aquí
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,   # ✅ ya no es "*"
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
# DB DEPENDENCY
# ─────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"ok": True, "message": "API de Repostería funcionando"}


# ─────────────────────────────────────────
# INGREDIENTES
# ─────────────────────────────────────────

@app.post("/ingredientes", response_model=IngredienteOut, tags=["Ingredientes"])
def crear_ingrediente(data: IngredienteCreate, db: Session = Depends(get_db)):
    if db.query(Ingrediente).filter(Ingrediente.nombre == data.nombre).first():
        raise HTTPException(status_code=409, detail="El ingrediente ya existe")

    ing = crud.crear_ingrediente(
        db=db,
        nombre=data.nombre,
        costo_compra=data.costo_compra,
        cantidad_compra=data.cantidad_compra,
        unidad=data.unidad   # ✅ ya viene en lower() desde el schema validator
    )
    return {**ing.__dict__, "costo_unitario": round(crud.calcular_costo_unitario(ing), 6)}


@app.get("/ingredientes", response_model=list[IngredienteOut], tags=["Ingredientes"])
def listar_ingredientes(db: Session = Depends(get_db)):
    ingredientes = db.query(Ingrediente).order_by(Ingrediente.id.desc()).all()
    return [
        {**ing.__dict__, "costo_unitario": round(crud.calcular_costo_unitario(ing), 6)}
        for ing in ingredientes
    ]


@app.put("/ingredientes/{ingrediente_id}", response_model=IngredienteOut, tags=["Ingredientes"])
def editar_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    db: Session = Depends(get_db)
):
    ing = crud.actualizar_ingrediente(
        db=db,
        ingrediente_id=ingrediente_id,
        nombre=data.nombre,
        costo_compra=data.costo_compra,
        cantidad_compra=data.cantidad_compra,
        unidad=data.unidad   # ✅ ya viene en lower() desde el schema validator
    )
    return {**ing.__dict__, "costo_unitario": round(crud.calcular_costo_unitario(ing), 6)}


# ─────────────────────────────────────────
# RECETAS
# ─────────────────────────────────────────

@app.post("/recetas", response_model=RecetaOut, tags=["Recetas"])
def crear_receta(data: RecetasCreate, db: Session = Depends(get_db)):
    return crud.crear_receta(db, data.nombre, data.porciones)


@app.get("/recetas", response_model=list[RecetaOut], tags=["Recetas"])
def listar_recetas(db: Session = Depends(get_db)):
    return db.query(Receta).order_by(Receta.id.desc()).all()


@app.get("/recetas/{receta_id}", response_model=RecetaDetalleOut, tags=["Recetas"])
def obtener_receta(receta_id: int, db: Session = Depends(get_db)):
    receta = (
        db.query(Receta)
        .options(joinedload(Receta.items).joinedload(RecetaItem.ingrediente))
        .filter(Receta.id == receta_id)
        .first()
    )
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return receta


@app.put("/recetas/{receta_id}", response_model=RecetaOut, tags=["Recetas"])
def editar_receta(
    receta_id: int,
    data: RecetasCreate,      # puedes crear RecetaUpdate con campos opcionales después
    db: Session = Depends(get_db)
):
    return crud.actualizar_receta(db, receta_id, data.nombre, data.porciones)


@app.put("/recetas/{receta_id}/config", tags=["Recetas"])
def actualizar_config_receta(
    receta_id: int,
    data: RecetaConfigUpdate,
    db: Session = Depends(get_db)
):
    r = db.query(Receta).filter(Receta.id == receta_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

    r.nombre = data.nombre
    r.porciones = data.porciones
    r.unidades_producidas = data.unidades_producidas
    r.tiempo_trabajo_min = data.tiempo_trabajo_min
    r.empaque_por_unidad = data.empaque_por_unidad
    r.transporte_por_lote = data.transporte_por_lote
    r.margen_markup = data.margen_markup
    r.empleado_id = data.empleado_id

    db.commit()
    db.refresh(r)
    return {"ok": True}


@app.delete("/recetas/{receta_id}", tags=["Recetas"])
def borrar_receta(receta_id: int, db: Session = Depends(get_db)):
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    db.delete(receta)
    db.commit()
    return {"ok": True}


# ─────────────────────────────────────────
# ITEMS DE RECETA
# ─────────────────────────────────────────

@app.post("/recetas/{receta_id}/items", response_model=RecetaItemOut, tags=["Items"])
def agregar_item(receta_id: int, data: RecetaItemCreate, db: Session = Depends(get_db)):
    return crud.agregar_items_receta(
        db, receta_id, data.ingrediente_id, data.cantidad, data.unidad
    )


@app.put("/recetas/{receta_id}/items/{item_id}", response_model=RecetaItemOut, tags=["Items"])
def editar_item(
    receta_id: int,
    item_id: int,
    data: RecetaItemUpdate,
    db: Session = Depends(get_db)
):
    return crud.actualizar_item_receta(db, receta_id, item_id, data.cantidad, data.unidad)


@app.delete("/recetas/{receta_id}/items/{item_id}", tags=["Items"])
def borrar_item(receta_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.query(RecetaItem).filter(
        RecetaItem.id == item_id,
        RecetaItem.receta_id == receta_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}


# ─────────────────────────────────────────
# COSTOS Y RESUMEN
# ─────────────────────────────────────────

@app.get("/recetas/{receta_id}/costo", tags=["Costos"])
def obtener_costo(receta_id: int, db: Session = Depends(get_db)):
    return crud.costo_receta(db, receta_id)


@app.get("/recetas/{receta_id}/resumen", tags=["Costos"])
def resumen_negocio(receta_id: int, db: Session = Depends(get_db)):
    return crud.resumen_negocio_receta(db, receta_id)


# ─────────────────────────────────────────
# EMPLEADOS
# ─────────────────────────────────────────

@app.post("/empleados", response_model=EmpleadoOut, tags=["Empleados"])
def crear_empleado(data: EmpleadoCreate, db: Session = Depends(get_db)):
    emp = Empleado(
        nombre=data.nombre,
        pago_diario=data.pago_diario,
        horas_dia=data.horas_dia,
        activo=data.activo,
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return {**emp.__dict__, "salario_hora": emp.salario_hora}


@app.get("/empleados", response_model=list[EmpleadoOut], tags=["Empleados"])
def listar_empleados(db: Session = Depends(get_db)):
    emps = db.query(Empleado).order_by(Empleado.id.desc()).all()
    return [
        {**e.__dict__, "salario_hora": e.salario_hora}
        for e in emps
    ]