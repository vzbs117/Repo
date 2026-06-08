from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud
from ..deps import get_db
from ..models import Receta
from ..schemas import (
    RecetaConfigUpdate,
    RecetaDetalleOut,
    RecetaItemCreate,
    RecetaItemOut,
    RecetaItemUpdate,
    RecetaOut,
    RecetasCreate,
)

router = APIRouter(tags=["Recetas"])


@router.post("/recetas", response_model=RecetaOut)
def crear_receta(data: RecetasCreate, db: Session = Depends(get_db)):
    return crud.crear_receta(db, data.nombre, data.porciones)


@router.get("/recetas", response_model=list[RecetaOut])
def listar_recetas(db: Session = Depends(get_db)):
    return db.query(Receta).order_by(Receta.id.desc()).all()


@router.get("/recetas/{receta_id}", response_model=RecetaDetalleOut)
def obtener_receta(receta_id: int, db: Session = Depends(get_db)):
    return crud.obtener_receta_detalle_o_404(db, receta_id)


@router.put("/recetas/{receta_id}", response_model=RecetaOut)
def editar_receta(
    receta_id: int,
    data: RecetasCreate,
    db: Session = Depends(get_db),
):
    return crud.actualizar_receta(db, receta_id, data.nombre, data.porciones)


@router.put("/recetas/{receta_id}/config")
def actualizar_config_receta(
    receta_id: int,
    data: RecetaConfigUpdate,
    db: Session = Depends(get_db),
):
    crud.actualizar_config_receta(
        db=db,
        receta_id=receta_id,
        nombre=data.nombre,
        porciones=data.porciones,
        unidades_producidas=data.unidades_producidas,
        tiempo_trabajo_min=data.tiempo_trabajo_min,
        empaque_por_unidad=data.empaque_por_unidad,
        transporte_por_lote=data.transporte_por_lote,
        margen_markup=data.margen_markup,
        empleado_id=data.empleado_id,
    )
    return {"ok": True}


@router.delete("/recetas/{receta_id}")
def borrar_receta(receta_id: int, db: Session = Depends(get_db)):
    receta = crud.obtener_receta_o_404(db, receta_id)
    db.delete(receta)
    db.commit()
    return {"ok": True}


@router.post("/recetas/{receta_id}/items", response_model=RecetaItemOut, tags=["Items"])
def agregar_item(receta_id: int, data: RecetaItemCreate, db: Session = Depends(get_db)):
    return crud.agregar_items_receta(
        db, receta_id, data.ingrediente_id, data.cantidad, data.unidad
    )


@router.put("/recetas/{receta_id}/items/{item_id}", response_model=RecetaItemOut, tags=["Items"])
def editar_item(
    receta_id: int,
    item_id: int,
    data: RecetaItemUpdate,
    db: Session = Depends(get_db),
):
    return crud.actualizar_item_receta(db, receta_id, item_id, data.cantidad, data.unidad)


@router.delete("/recetas/{receta_id}/items/{item_id}", tags=["Items"])
def borrar_item(receta_id: int, item_id: int, db: Session = Depends(get_db)):
    crud.borrar_item_receta(db, receta_id, item_id)
    return {"ok": True}


@router.get("/recetas/{receta_id}/costo", tags=["Costos"])
def obtener_costo(receta_id: int, db: Session = Depends(get_db)):
    return crud.costo_receta(db, receta_id)


@router.get("/recetas/{receta_id}/resumen", tags=["Costos"])
def resumen_negocio(receta_id: int, db: Session = Depends(get_db)):
    return crud.resumen_negocio_receta(db, receta_id)


@router.get("/recetas/{receta_id}/diagnostico")
def diagnostico_receta(receta_id: int, db: Session = Depends(get_db)):
    return crud.diagnostico_receta(db, receta_id)


@router.get("/recetas/inconsistencias/configuracion")
def listar_inconsistencias_configuracion(db: Session = Depends(get_db)):
    return crud.listar_recetas_con_configuracion_inconsistente(db)
