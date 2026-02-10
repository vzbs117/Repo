from pydantic import BaseModel

class IngredienteCreate(BaseModel):
    nombre: str
    costo_compra: float
    cantidad_compra:float
    unidad:str              # g, ml o pz

class IngredienteOut(BaseModel):
    id:int
    nombre:str
    unidad_base:str
    costo_compra:float
    cantidad_compra_base:float
    costo_unitario:float
    
    class Config:
        from_atribute=True

class RecetasCreate(BaseModel):
    nombre:str
    porciones:int = 1

class RecetaOut(BaseModel):
    id:int
    nombre:str
    porciones:int
    class Config:
        from_atribute=True

class RecetaItemCreate(BaseModel):
    ingrediente_id:int
    cantidad:float
    unidad:str  # g, ml, pz, tsp, tbsp, kg, etc

class RecetaItemOut(BaseModel):
    id:int 
    ingrediente_id:int
    cantidad_usada_base:float
    unidad_original:str
    cantidad_original:float
    class Config:
        from_atribute=True

class IngredienteMini(BaseModel):
    id:int
    nombre:str
    unidad_base:str
    class Config:
        from_atribute= True

class RecetaItemDetalleOut(BaseModel):
    id:int
    cantidad_usada_base:float
    unidad_original:str
    cantidad_original:float
    ingrediente:IngredienteMini
    class Config:
        from_atribute=True

class RecetaDetalleOut(BaseModel):
    id:int
    nombre:str
    porciones:int
    items:list[RecetaItemDetalleOut]=[]
    class Config:
        from_atribute=True

class IngredienteUpdate(BaseModel):
    nombre:str
    costo_compra:float
    cantidad_compra:float
    unidad:str

class RecetasUpdate(BaseModel):
    nombre:str
    porciones:int = 1

class RecetasItemUpdate(BaseModel):
    cantidad:float
    unidad:str # g,kg,l,ml,etc..
