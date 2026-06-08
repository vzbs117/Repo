from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud
from ..deps import get_db, ingrediente_out
from ..models import Ingrediente
from ..schemas import IngredienteCreate, IngredienteOut, IngredienteUpdate

router = APIRouter(tags=["Ingredientes"])


@router.post("/ingredientes", response_model=IngredienteOut)
def crear_ingrediente(data: IngredienteCreate, db: Session = Depends(get_db)):
    if db.query(Ingrediente).filter(Ingrediente.nombre == data.nombre).first():
        raise HTTPException(status_code=409, detail="El ingrediente ya existe")

    ing = crud.crear_ingrediente(
        db=db,
        nombre=data.nombre,
        costo_compra=data.costo_compra,
        cantidad_compra=data.cantidad_compra,
        unidad=data.unidad,
    )
    return ingrediente_out(ing)


@router.get("/ingredientes", response_model=list[IngredienteOut])
def listar_ingredientes(db: Session = Depends(get_db)):
    ingredientes = db.query(Ingrediente).order_by(Ingrediente.id.desc()).all()
    return [ingrediente_out(ing) for ing in ingredientes]


@router.put("/ingredientes/{ingrediente_id}", response_model=IngredienteOut)
def editar_ingrediente(
    ingrediente_id: int,
    data: IngredienteUpdate,
    db: Session = Depends(get_db),
):
    ing = crud.actualizar_ingrediente(
        db=db,
        ingrediente_id=ingrediente_id,
        nombre=data.nombre,
        costo_compra=data.costo_compra,
        cantidad_compra=data.cantidad_compra,
        unidad=data.unidad,
    )
    return ingrediente_out(ing)
