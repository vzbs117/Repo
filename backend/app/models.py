# models.py
from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from .db import Base


class Unidad(Base):
    __tablename__ = "unidades"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)
    tipo = Column(String, nullable=False)
    factor_a_base = Column(Float, nullable=False)
    base = Column(String, nullable=False)

    def __repr__(self):
        return f"<Unidad codigo={self.codigo} base={self.base}>"


class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    unidad_base = Column(String, nullable=False)
    costo_compra = Column(Float, nullable=False)
    cantidad_compra_base = Column(Float, nullable=False)

    items = relationship("RecetaItem", back_populates="ingrediente")

    def __repr__(self):
        return f"<Ingrediente id={self.id} nombre={self.nombre}>"


class Receta(Base):
    __tablename__ = "recetas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)

    # ✅ Se elimina "porciones" como campo separado;
    # unidades_producidas cumple ese rol de forma más clara
    porciones = Column(Integer, nullable=False, default=1)  # mantener por compatibilidad V1
    unidades_producidas = Column(Integer, nullable=False, default=1)

    empleado_id = Column(Integer, ForeignKey("empleados.id"), nullable=True)
    tiempo_trabajo_min = Column(Float, nullable=False, default=0.0)
    empaque_por_unidad = Column(Float, nullable=False, default=0.0)
    transporte_por_lote = Column(Float, nullable=False, default=0.0)
    margen_markup = Column(Float, nullable=False, default=0.30)

    items = relationship(
        "RecetaItem",
        back_populates="receta",
        cascade="all, delete-orphan"
    )
    empleado = relationship("Empleado", back_populates="recetas")

    def __repr__(self):
        return f"<Receta id={self.id} nombre={self.nombre}>"


class RecetaItem(Base):
    __tablename__ = "receta_items"

    id = Column(Integer, primary_key=True, index=True)
    receta_id = Column(Integer, ForeignKey("recetas.id"), nullable=False, index=True)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id"), nullable=False, index=True)

    cantidad_usada_base = Column(Float, nullable=False)
    unidad_original = Column(String, nullable=False, default="")
    cantidad_original = Column(Float, nullable=False, default=0.0)

    receta = relationship("Receta", back_populates="items")
    ingrediente = relationship("Ingrediente", back_populates="items")

    __table_args__ = (
        UniqueConstraint("receta_id", "ingrediente_id", name="uq_receta_ingrediente"),
        Index("ix_receta_items_receta_id", "receta_id"),
    )

    def __repr__(self):
        return f"<RecetaItem receta={self.receta_id} ingrediente={self.ingrediente_id}>"


class Empleado(Base):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    pago_diario = Column(Float, nullable=False, default=0.0)
    horas_dia = Column(Float, nullable=False, default=8.0)
    activo = Column(Boolean, nullable=False, default=True)

    recetas = relationship("Receta", back_populates="empleado")

    @property
    def salario_hora(self) -> float:
        if not self.horas_dia:
            return 0.0
        return round(self.pago_diario / self.horas_dia, 4)

    def __repr__(self):
        return f"<Empleado id={self.id} nombre={self.nombre}>"