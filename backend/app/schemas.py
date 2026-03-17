# schemas.py
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Literal

# Unidades válidas del sistema
UNIDADES_VALIDAS = {"g", "kg", "ml", "l", "tsp", "tbsp", "pz"}


# ─────────────────────────────────────────
# INGREDIENTES
# ─────────────────────────────────────────

class IngredienteCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    costo_compra: float = Field(gt=0, description="Costo total pagado, debe ser mayor a 0")
    cantidad_compra: float = Field(gt=0, description="Cantidad comprada, debe ser mayor a 0")
    unidad: str

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v: str) -> str:
        return v.strip()

    @field_validator("unidad")
    @classmethod
    def unidad_valida(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in UNIDADES_VALIDAS:
            raise ValueError(f"Unidad '{v}' no válida. Usa: {sorted(UNIDADES_VALIDAS)}")
        return v


class IngredienteUpdate(IngredienteCreate):
    # Hereda todas las validaciones de IngredienteCreate
    pass


class IngredienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    unidad_base: str
    costo_compra: float
    cantidad_compra_base: float
    costo_unitario: float


# ─────────────────────────────────────────
# RECETAS
# ─────────────────────────────────────────

class RecetasCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    porciones: int = Field(default=1, ge=1)

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v: str) -> str:
        return v.strip()


class RecetaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    porciones: int
    unidades_producidas: int = 1
    tiempo_trabajo_min: float = 0.0
    empaque_por_unidad: float = 0.0
    transporte_por_lote: float = 0.0
    margen_markup: float = 0.30
    empleado_id: int | None = None


# ─────────────────────────────────────────
# ITEMS DE RECETA
# ─────────────────────────────────────────

class RecetaItemCreate(BaseModel):
    ingrediente_id: int = Field(gt=0)
    cantidad: float = Field(gt=0)
    unidad: str

    @field_validator("unidad")
    @classmethod
    def unidad_valida(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in UNIDADES_VALIDAS:
            raise ValueError(f"Unidad '{v}' no válida. Usa: {sorted(UNIDADES_VALIDAS)}")
        return v


class RecetaItemUpdate(BaseModel):
    cantidad: float = Field(gt=0)
    unidad: str

    @field_validator("unidad")
    @classmethod
    def unidad_valida(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in UNIDADES_VALIDAS:
            raise ValueError(f"Unidad '{v}' no válida. Usa: {sorted(UNIDADES_VALIDAS)}")
        return v


class RecetaItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ingrediente_id: int
    cantidad_usada_base: float
    unidad_original: str
    cantidad_original: float


class IngredienteMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    unidad_base: str


class RecetaItemDetalleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cantidad_usada_base: float
    unidad_original: str
    cantidad_original: float
    ingrediente: IngredienteMini


class RecetaDetalleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    porciones: int
    items: list[RecetaItemDetalleOut] = []


# ─────────────────────────────────────────
# CONFIG RECETA V2
# ─────────────────────────────────────────

class RecetaConfigUpdate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    porciones: int = Field(default=1, ge=1)
    unidades_producidas: int = Field(default=1, ge=1)
    tiempo_trabajo_min: float = Field(default=0.0, ge=0)
    empaque_por_unidad: float = Field(default=0.0, ge=0)
    transporte_por_lote: float = Field(default=0.0, ge=0)
    margen_markup: float = Field(default=0.30, ge=0, le=10)
    empleado_id: int | None = None

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v: str) -> str:
        return v.strip()


# ─────────────────────────────────────────
# EMPLEADOS
# ─────────────────────────────────────────

class EmpleadoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    pago_diario: float = Field(ge=0)
    horas_dia: float = Field(default=8.0, gt=0, le=24)
    activo: bool = True

    @field_validator("nombre")
    @classmethod
    def nombre_no_vacio(cls, v: str) -> str:
        return v.strip()


class EmpleadoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    pago_diario: float
    horas_dia: float
    activo: bool
    salario_hora: float