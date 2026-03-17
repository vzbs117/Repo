# crud.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from .models import Unidad, Ingrediente, Receta, RecetaItem, Empleado


# ─────────────────────────────────────────
# UTILIDADES
# ─────────────────────────────────────────

def convertir_a_base(
    db: Session,
    cantidad: float,
    unidad: str,
    unidad_base_esperada: str
) -> float:
    u = db.query(Unidad).filter(Unidad.codigo == unidad).first()
    if not u:
        raise HTTPException(status_code=400, detail=f"Unidad no soportada: {unidad}")
    if u.base != unidad_base_esperada:
        raise HTTPException(
            status_code=400,
            detail=f"Unidad '{unidad}' no es compatible con la unidad base esperada: '{unidad_base_esperada}'"
        )
    return cantidad * u.factor_a_base


def calcular_costo_unitario(ing: Ingrediente) -> float:
    """Costo por unidad base del ingrediente ($/g, $/ml, $/pz)"""
    if ing.cantidad_compra_base <= 0:
        return 0.0
    return ing.costo_compra / ing.cantidad_compra_base


# ─────────────────────────────────────────
# INGREDIENTES
# ─────────────────────────────────────────

def crear_ingrediente(
    db: Session,
    nombre: str,
    costo_compra: float,
    cantidad_compra: float,
    unidad: str
) -> Ingrediente:
    u = db.query(Unidad).filter(Unidad.codigo == unidad).first()
    if not u:
        raise HTTPException(status_code=400, detail=f"Unidad no soportada: {unidad}")

    ing = Ingrediente(
        nombre=nombre,
        unidad_base=u.base,
        costo_compra=costo_compra,
        cantidad_compra_base=cantidad_compra * u.factor_a_base
    )
    db.add(ing)
    db.commit()
    db.refresh(ing)
    return ing


def actualizar_ingrediente(
    db: Session,
    ingrediente_id: int,
    nombre: str,
    costo_compra: float,
    cantidad_compra: float,
    unidad: str
) -> Ingrediente:
    ing = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    if nombre != ing.nombre:
        if db.query(Ingrediente).filter(Ingrediente.nombre == nombre).first():
            raise HTTPException(status_code=409, detail="Ya existe otro ingrediente con ese nombre")

    u = db.query(Unidad).filter(Unidad.codigo == unidad).first()
    if not u:
        raise HTTPException(status_code=400, detail=f"Unidad no soportada: {unidad}")

    ing.nombre = nombre
    ing.unidad_base = u.base
    ing.costo_compra = costo_compra
    ing.cantidad_compra_base = cantidad_compra * u.factor_a_base

    db.commit()
    db.refresh(ing)
    return ing


# ─────────────────────────────────────────
# RECETAS
# ─────────────────────────────────────────

def crear_receta(db: Session, nombre: str, porciones: int) -> Receta:
    r = Receta(nombre=nombre, porciones=porciones)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def actualizar_receta(db: Session, receta_id: int, nombre: str, porciones: int) -> Receta:
    r = db.query(Receta).filter(Receta.id == receta_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Receta no encontrada")  # ✅ typo corregido

    if nombre != r.nombre:
        if db.query(Receta).filter(Receta.nombre == nombre).first():
            raise HTTPException(status_code=409, detail="Ya existe otra receta con ese nombre")

    r.nombre = nombre
    r.porciones = porciones
    db.commit()
    db.refresh(r)
    return r


# ─────────────────────────────────────────
# ITEMS DE RECETA
# ─────────────────────────────────────────

def agregar_items_receta(
    db: Session,
    receta_id: int,
    ingrediente_id: int,
    cantidad: float,
    unidad: str
) -> RecetaItem:
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail=f"Receta no encontrada: {receta_id}")

    ing = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail=f"Ingrediente no encontrado: {ingrediente_id}")

    cantidad_base = convertir_a_base(db, cantidad, unidad, ing.unidad_base)

    item = RecetaItem(
        receta_id=receta_id,
        ingrediente_id=ingrediente_id,
        cantidad_usada_base=cantidad_base,
        unidad_original=unidad,
        cantidad_original=cantidad
    )
    db.add(item)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"El ingrediente {ingrediente_id} ya existe en la receta {receta_id}"
        )

    db.refresh(item)
    return item


def actualizar_item_receta(
    db: Session,
    receta_id: int,
    item_id: int,
    cantidad: float,
    unidad: str
) -> RecetaItem:
    item = db.query(RecetaItem).filter(
        RecetaItem.id == item_id,
        RecetaItem.receta_id == receta_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    cantidad_base = convertir_a_base(db, cantidad, unidad, item.ingrediente.unidad_base)

    item.cantidad_usada_base = cantidad_base
    item.unidad_original = unidad
    item.cantidad_original = cantidad

    db.commit()
    db.refresh(item)
    return item


# ─────────────────────────────────────────
# COSTOS
# ─────────────────────────────────────────

def costo_receta(db: Session, receta_id: int) -> dict:
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail=f"Receta no encontrada: {receta_id}")

    total = sum(
        calcular_costo_unitario(item.ingrediente) * item.cantidad_usada_base
        for item in receta.items
    )

    porciones = receta.porciones or 1
    return {
        "receta_id": receta_id,
        "nombre": receta.nombre,
        "total": round(total, 2),
        "por_porcion": round(total / porciones, 2)
    }


def resumen_negocio_receta(db: Session, receta_id: int) -> dict:
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail=f"Receta no encontrada: {receta_id}")

    # 1) Costo de ingredientes — sin doble query, calculado directo
    costo_ingredientes = sum(
        calcular_costo_unitario(item.ingrediente) * item.cantidad_usada_base
        for item in receta.items
    )

    # 2) Unidades producidas
    unidades = int(receta.unidades_producidas or receta.porciones or 1)

    # 3) Mano de obra
    costo_mano_obra = 0.0
    if receta.empleado_id and receta.empleado:
        costo_mano_obra = receta.empleado.salario_hora * (receta.tiempo_trabajo_min / 60.0)

    # 4) Empaque y transporte
    costo_empaque = receta.empaque_por_unidad * unidades
    costo_transporte = receta.transporte_por_lote

    # 5) Totales
    costo_total_lote = costo_ingredientes + costo_mano_obra + costo_empaque + costo_transporte
    costo_por_unidad = (costo_total_lote / unidades) if unidades else 0.0  # ✅ nombre distinto

    # 6) Precio con margen
    margen = receta.margen_markup or 0.30
    precio_unitario = costo_por_unidad * (1 + margen)
    precio_lote = precio_unitario * unidades

    # 7) Ganancia
    ganancia_unit = precio_unitario - costo_por_unidad
    ganancia_lote = ganancia_unit * unidades

    margen_real = (ganancia_unit / precio_unitario) if precio_unitario else 0.0
    markup_real = (ganancia_unit / costo_por_unidad) if costo_por_unidad else 0.0

    return {
        "receta_id": receta_id,
        "nombre": receta.nombre,
        "unidades": unidades,

        "costo_ingredientes": round(costo_ingredientes, 2),
        "costo_mano_obra": round(costo_mano_obra, 2),
        "costo_empaque": round(costo_empaque, 2),
        "costo_transporte": round(costo_transporte, 2),

        "costo_total_lote": round(costo_total_lote, 2),
        "costo_unitario": round(costo_por_unidad, 4),

        "margen_markup": round(margen, 4),
        "precio_unitario": round(precio_unitario, 2),
        "precio_lote": round(precio_lote, 2),

        "ganancia_unit": round(ganancia_unit, 2),
        "ganancia_lote": round(ganancia_lote, 2),

        "margen_real": round(margen_real, 4),
        "markup_real": round(markup_real, 4),
    }