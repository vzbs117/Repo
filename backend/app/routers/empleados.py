from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..deps import empleado_out, get_db
from ..models import Empleado
from ..schemas import EmpleadoCreate, EmpleadoOut

router = APIRouter(tags=["Empleados"])


@router.post("/empleados", response_model=EmpleadoOut)
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
    return empleado_out(emp)


@router.get("/empleados", response_model=list[EmpleadoOut])
def listar_empleados(db: Session = Depends(get_db)):
    emps = db.query(Empleado).order_by(Empleado.id.desc()).all()
    return [empleado_out(emp) for emp in emps]
