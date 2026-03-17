# seed.py
import logging
from sqlalchemy.orm import Session
from .models import Unidad

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# CATÁLOGO DE UNIDADES
# Separado de la lógica para fácil mantenimiento
# ─────────────────────────────────────────

UNIDADES_DEFAULT: list[dict] = [
    # Masa
    {"codigo": "g",     "tipo": "mass",   "factor_a_base": 1.0,    "base": "g"},
    {"codigo": "kg",    "tipo": "mass",   "factor_a_base": 1000.0, "base": "g"},
    {"codigo": "oz",    "tipo": "mass",   "factor_a_base": 28.35,  "base": "g"},
    {"codigo": "lb",    "tipo": "mass",   "factor_a_base": 453.59, "base": "g"},

    # Volumen
    {"codigo": "ml",    "tipo": "volume", "factor_a_base": 1.0,    "base": "ml"},
    {"codigo": "l",     "tipo": "volume", "factor_a_base": 1000.0, "base": "ml"},
    {"codigo": "tsp",   "tipo": "volume", "factor_a_base": 5.0,    "base": "ml"},
    {"codigo": "tbsp",  "tipo": "volume", "factor_a_base": 15.0,   "base": "ml"},
    {"codigo": "cup",   "tipo": "volume", "factor_a_base": 240.0,  "base": "ml"},
    {"codigo": "fl_oz", "tipo": "volume", "factor_a_base": 29.57,  "base": "ml"},

    # Conteo
    {"codigo": "pz",    "tipo": "count",  "factor_a_base": 1.0,    "base": "pz"},
]


def seed_unidades(db: Session) -> None:
    insertadas = 0
    for u in UNIDADES_DEFAULT:
        existe = db.query(Unidad).filter_by(codigo=u["codigo"]).first()
        if not existe:
            db.add(Unidad(**u))
            insertadas += 1

    if insertadas:
        db.commit()
        logger.info(f"✅ Seed: {insertadas} unidades insertadas.")
    else:
        logger.info("✅ Seed: todas las unidades ya existían, sin cambios.")