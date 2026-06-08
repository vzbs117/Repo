# crud.py
import unicodedata

from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from .models import Unidad, Ingrediente, Receta, RecetaItem, Empleado


# ─────────────────────────────────────────
# UTILIDADES
# ─────────────────────────────────────────

EQUIVALENCIAS_CULINARIAS_GRAMOS = {
    "royal": {
        "tsp": 4.0,
    },
    "sal": {
        "pizca": 0.36,
        "tsp": 6.0,
    },
}


def _normalizar_clave_ingrediente(nombre: str) -> str:
    nombre = unicodedata.normalize("NFKD", nombre.strip().lower())
    return "".join(ch for ch in nombre if not unicodedata.combining(ch))


def _convertir_unidad_culinaria_a_base(
    ingrediente: Ingrediente | None,
    cantidad: float,
    unidad: str,
    unidad_base_esperada: str,
) -> float | None:
    if not ingrediente or unidad_base_esperada != "g":
        return None

    equivalencias = EQUIVALENCIAS_CULINARIAS_GRAMOS.get(
        _normalizar_clave_ingrediente(ingrediente.nombre),
    )
    if not equivalencias:
        return None

    gramos_por_unidad = equivalencias.get(unidad)
    if gramos_por_unidad is None:
        return None

    return cantidad * gramos_por_unidad


def _guardar_y_refrescar(db: Session, obj) -> None:
    db.commit()
    db.refresh(obj)


def obtener_unidad_o_400(db: Session, unidad: str) -> Unidad:
    u = db.query(Unidad).filter(Unidad.codigo == unidad).first()
    if not u:
        raise HTTPException(status_code=400, detail=f"Unidad no soportada: {unidad}")
    return u


def obtener_ingrediente_o_404(db: Session, ingrediente_id: int) -> Ingrediente:
    ing = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    return ing


def obtener_receta_o_404(db: Session, receta_id: int) -> Receta:
    receta = db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return receta


def obtener_receta_detalle_o_404(db: Session, receta_id: int) -> Receta:
    receta = (
        db.query(Receta)
        .options(joinedload(Receta.items).joinedload(RecetaItem.ingrediente))
        .filter(Receta.id == receta_id)
        .first()
    )
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return receta


def obtener_item_receta_o_404(db: Session, receta_id: int, item_id: int) -> RecetaItem:
    item = db.query(RecetaItem).filter(
        RecetaItem.id == item_id,
        RecetaItem.receta_id == receta_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return item


def obtener_empleado_o_404(db: Session, empleado_id: int) -> Empleado:
    empleado = db.query(Empleado).filter(Empleado.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado


def _validar_nombre_unico(
    db: Session,
    model,
    nombre: str,
    detalle_conflicto: str,
    exclude_id: int | None = None,
) -> None:
    query = db.query(model).filter(model.nombre == nombre)
    if exclude_id is not None:
        query = query.filter(model.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=409, detail=detalle_conflicto)

def convertir_a_base(
    db: Session,
    cantidad: float,
    unidad: str,
    unidad_base_esperada: str,
    ingrediente: Ingrediente | None = None,
) -> float:
    u = db.query(Unidad).filter(Unidad.codigo == unidad).first()
    if not u:
        conversion_culinaria = _convertir_unidad_culinaria_a_base(
            ingrediente,
            cantidad,
            unidad,
            unidad_base_esperada,
        )
        if conversion_culinaria is not None:
            return conversion_culinaria
        raise HTTPException(status_code=400, detail=f"Unidad no soportada: {unidad}")
    if u.base != unidad_base_esperada:
        conversion_culinaria = _convertir_unidad_culinaria_a_base(
            ingrediente,
            cantidad,
            unidad,
            unidad_base_esperada,
        )
        if conversion_culinaria is not None:
            return conversion_culinaria
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


def calcular_costo_ingredientes_receta(receta: Receta) -> float:
    return sum(
        calcular_costo_unitario(item.ingrediente) * item.cantidad_usada_base
        for item in receta.items
    )


def diagnostico_configuracion_receta(receta: Receta) -> dict:
    costo_ingredientes = calcular_costo_ingredientes_receta(receta)
    porciones = int(receta.porciones or 1)
    unidades = int(receta.unidades_producidas or porciones or 1)
    inconsistente = porciones != unidades

    return {
        "receta_id": receta.id,
        "nombre": receta.nombre,
        "porciones": porciones,
        "unidades_producidas": unidades,
        "configuracion_consistente": not inconsistente,
        "motivo": (
            "porciones y unidades_producidas no coinciden"
            if inconsistente
            else "configuracion consistente"
        ),
        "costo_ingredientes_total": round(costo_ingredientes, 2),
        "costo_ingredientes_por_porcion": round(costo_ingredientes / porciones, 4),
        "costo_ingredientes_por_unidad_producida": round(costo_ingredientes / unidades, 4),
        "requiere_revision": inconsistente,
    }


def listar_recetas_con_configuracion_inconsistente(db: Session) -> list[dict]:
    recetas = db.query(Receta).order_by(Receta.id.asc()).all()
    return [
        diagnostico_configuracion_receta(receta)
        for receta in recetas
        if receta.porciones != receta.unidades_producidas
    ]


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
    u = obtener_unidad_o_400(db, unidad)

    ing = Ingrediente(
        nombre=nombre,
        unidad_base=u.base,
        costo_compra=costo_compra,
        cantidad_compra_base=cantidad_compra * u.factor_a_base
    )
    db.add(ing)
    _guardar_y_refrescar(db, ing)
    return ing


def actualizar_ingrediente(
    db: Session,
    ingrediente_id: int,
    nombre: str,
    costo_compra: float,
    cantidad_compra: float,
    unidad: str
) -> Ingrediente:
    ing = obtener_ingrediente_o_404(db, ingrediente_id)

    if nombre != ing.nombre:
        _validar_nombre_unico(
            db,
            Ingrediente,
            nombre,
            "Ya existe otro ingrediente con ese nombre",
            exclude_id=ingrediente_id,
        )

    u = obtener_unidad_o_400(db, unidad)

    if ing.items and u.base != ing.unidad_base:
        raise HTTPException(
            status_code=409,
            detail=(
                "No puedes cambiar la familia de unidad de un ingrediente que ya "
                "se usa en recetas. Crea un ingrediente nuevo o elimina primero sus usos."
            ),
        )

    ing.nombre = nombre
    ing.unidad_base = u.base
    ing.costo_compra = costo_compra
    ing.cantidad_compra_base = cantidad_compra * u.factor_a_base

    _guardar_y_refrescar(db, ing)
    return ing


# ─────────────────────────────────────────
# RECETAS
# ─────────────────────────────────────────

def crear_receta(db: Session, nombre: str, porciones: int) -> Receta:
    _validar_nombre_unico(db, Receta, nombre, "Ya existe otra receta con ese nombre")

    r = Receta(nombre=nombre, porciones=porciones, unidades_producidas=porciones)
    db.add(r)
    _guardar_y_refrescar(db, r)
    return r


def actualizar_receta(db: Session, receta_id: int, nombre: str, porciones: int) -> Receta:
    r = obtener_receta_o_404(db, receta_id)

    if nombre != r.nombre:
        _validar_nombre_unico(
            db,
            Receta,
            nombre,
            "Ya existe otra receta con ese nombre",
            exclude_id=receta_id,
        )

    sincronizar_unidades = r.unidades_producidas == r.porciones

    r.nombre = nombre
    r.porciones = porciones
    if sincronizar_unidades:
        r.unidades_producidas = porciones
    _guardar_y_refrescar(db, r)
    return r


def actualizar_config_receta(
    db: Session,
    receta_id: int,
    nombre: str,
    porciones: int,
    unidades_producidas: int,
    tiempo_trabajo_min: float,
    empaque_por_unidad: float,
    transporte_por_lote: float,
    margen_markup: float,
    empleado_id: int | None,
) -> Receta:
    receta = obtener_receta_o_404(db, receta_id)

    if nombre != receta.nombre:
        _validar_nombre_unico(
            db,
            Receta,
            nombre,
            "Ya existe otra receta con ese nombre",
            exclude_id=receta_id,
        )

    if empleado_id is not None:
        obtener_empleado_o_404(db, empleado_id)

    receta.nombre = nombre
    receta.porciones = porciones
    receta.unidades_producidas = unidades_producidas
    receta.tiempo_trabajo_min = tiempo_trabajo_min
    receta.empaque_por_unidad = empaque_por_unidad
    receta.transporte_por_lote = transporte_por_lote
    receta.margen_markup = margen_markup
    receta.empleado_id = empleado_id

    _guardar_y_refrescar(db, receta)
    return receta


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
    obtener_receta_o_404(db, receta_id)
    ing = obtener_ingrediente_o_404(db, ingrediente_id)

    cantidad_base = convertir_a_base(db, cantidad, unidad, ing.unidad_base, ingrediente=ing)

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
    item = obtener_item_receta_o_404(db, receta_id, item_id)

    cantidad_base = convertir_a_base(
        db,
        cantidad,
        unidad,
        item.ingrediente.unidad_base,
        ingrediente=item.ingrediente,
    )

    item.cantidad_usada_base = cantidad_base
    item.unidad_original = unidad
    item.cantidad_original = cantidad

    _guardar_y_refrescar(db, item)
    return item


def borrar_item_receta(db: Session, receta_id: int, item_id: int) -> None:
    item = obtener_item_receta_o_404(db, receta_id, item_id)
    db.delete(item)
    db.commit()


# ─────────────────────────────────────────
# COSTOS
# ─────────────────────────────────────────

def costo_receta(db: Session, receta_id: int) -> dict:
    receta = obtener_receta_o_404(db, receta_id)

    total = calcular_costo_ingredientes_receta(receta)

    porciones = receta.porciones or 1
    return {
        "receta_id": receta_id,
        "nombre": receta.nombre,
        "total": round(total, 2),
        "por_porcion": round(total / porciones, 2)
    }


def resumen_negocio_receta(db: Session, receta_id: int) -> dict:
    receta = obtener_receta_o_404(db, receta_id)

    # 1) Costo de ingredientes — sin doble query, calculado directo
    costo_ingredientes = calcular_costo_ingredientes_receta(receta)

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


def diagnostico_receta(db: Session, receta_id: int) -> dict:
    receta = obtener_receta_o_404(db, receta_id)
    return diagnostico_configuracion_receta(receta)
