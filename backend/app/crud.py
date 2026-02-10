from sqlalchemy.orm import Session
from fastapi import HTTPException
from .models import Unidad,Ingrediente,Receta,RecetaItem

def convertir_a_base(db:Session,cantidad:float, unidad:str,unidad_base_esperada:str):
    u = db.query(Unidad).filter(Unidad.codigo == unidad).first()
    if not u:
        raise HTTPException(status_code=400, detail=f"Unidad no soportada: {unidad}")
    
    cantidad_base = cantidad * u.factor_a_base

    if u.base != unidad_base_esperada:
        raise HTTPException(status_code=400, detail=f"Unidad: {unidad} no es compatible con la unidad base esperada: {unidad_base_esperada}")
    return cantidad_base

def cear_ingrediente(db:Session,nombre:str,costo_compra:float,cantidad_compra:float,unidad:str):
    u= db.query(Unidad).filter(Unidad.codigo == unidad).first()
    if not u: 
        raise HTTPException(status_code=400, detail=f"Unidad no soportada:{unidad}")
    cantidad_base= cantidad_compra * u.factor_a_base

    ing= Ingrediente(
        nombre=nombre,
        unidad_base=u.base,
        costo_compra=costo_compra,
        cantidad_compra_base=cantidad_base
    )
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return ing 

def costo_unitario(ing:Ingrediente)->float:
    if ing.cantidad_compra_base <= 0:
        return 0.0
    return ing.costo_compra / ing.cantidad_compra_base

def crear_receta(db:Session,nombre:str, porciones:int):
    r= Receta( nombre=nombre,porciones=porciones)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

def agregar_items_receta(db:Session, receta_id:int, ingrediente_id:int, cantidad:float, unidad:str):
    receta=db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail=f"receta no encontrada: {receta_id}")
    
    ing=db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail=f"Ingrediente no encontrado: {ingrediente_id}")
    
    cantidad_base= convertir_a_base(db, cantidad, unidad, ing.unidad_base)

    item=RecetaItem(
        receta_id=receta_id,
        ingrediente_id=ingrediente_id,
        cantidad_usada_base=cantidad_base,
        unidad_original=unidad,
        cantidad_original=cantidad
    )
    db.add(item)
    db.commit() 
    db.refresh(item)
    return item

def costo_receta(db:Session, receta_id:int)->float:
    receta=db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail=f"Receta no encontrada: {receta_id}")
    
    total=0.0
    for item in receta.items:
        total += costo_unitario(item.ingrediente) * item.cantidad_usada_base

    porciones= receta.porciones or 1
    return {"receta_id": receta_id, "nombre":receta.nombre, "total": round(total,2),"por_porcion": round(total/porciones,2)}

#Actualizar
def actualizar_ingrediente(db:Session,ingrediente_id:int,nombre:str,costo_compra:float,cantidad_compra:float,unidad:str):
    ing=db.query(Ingrediente).filter(Ingrediente.id==ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=404,detail="Ingrediente no encontrado")
    
    #validar si cambia el nombre
    if nombre != ing.nombre:
        if db.query(Ingrediente).filter(Ingrediente.nombre== nombre).first():
            raise HTTPException(status_code=409, detail="Ya existe otro ingrediente con ese nombre")
    
    u= db.query(Unidad).filter(Unidad.codigo==unidad).first()
    if not u:
        raise HTTPException(status_code=400, detail=f"Unidad no soportada {unidad}")
    
    cantidad_base=cantidad_compra * u.factor_a_base

    ing.nombre=nombre
    ing.unidad_base=u.base
    ing.costo_compra=costo_compra
    ing.cantidad_compra_base=cantidad_base

    db.commit()
    db.refresh(ing)
    return ing 

def actualizar_receta(db:Session,receta_id:int,nombre:str,porciones:int):
    r=db.query(Receta).filter(Receta.id== receta_id).first()
    if not r:
        raise HTTPException(status_code=404,detail="Rceta no encontrada")
    
    #validar nombre unico por si hay cambio
    if nombre != r.nombre:
        if db.query(Receta).filter(Receta.nombre==nombre).first():
            raise HTTPException(status_code=409,detail="Ya existe otra receta con ese nombre")
        
    r.nombre= nombre
    r.porciones=porciones
    db.commit()
    db.refresh(r)
    return r

def actualizar_item_receta(db: Session, receta_id: int, item_id: int, cantidad: float, unidad: str):
    item = db.query(RecetaItem).filter(
        RecetaItem.id == item_id,
        RecetaItem.receta_id == receta_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    ing = item.ingrediente  # ya relacionado

    cantidad_base = convertir_a_base(db, cantidad, unidad, ing.unidad_base)

    item.cantidad_usada_base = cantidad_base
    item.unidad_original = unidad
    item.cantidad_original = cantidad

    db.commit()
    db.refresh(item)
    return item

