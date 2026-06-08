from sqlalchemy.orm import Session

from .crud import calcular_costo_unitario
from .db import SessionLocal
from .models import Empleado, Ingrediente


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ingrediente_out(ing: Ingrediente) -> dict:
    return {**ing.__dict__, "costo_unitario": round(calcular_costo_unitario(ing), 6)}


def empleado_out(emp: Empleado) -> dict:
    return {**emp.__dict__, "salario_hora": emp.salario_hora}
