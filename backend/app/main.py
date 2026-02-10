from fastapi import FastAPI , Depends, HTTPException
from sqlalchemy.orm import Session,joinedload
# from . import models, schemas
from .db import Base, engien,SessionLocal
from .schemas import IngredienteCreate,IngredienteOut, RecetasCreate,RecetaOut, RecetaItemCreate,RecetaItemOut, RecetaDetalleOut,IngredienteUpdate,RecetasUpdate,RecetasItemUpdate
from .models import Ingrediente,Receta,RecetaItem
from .seed import seed_unidades
from . import crud

# from . import models, schemas, crud
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engien)

app = FastAPI(title="Api de Repostreria")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db= SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup():
    db=SessionLocal()
    try:
        seed_unidades(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {"ok":True,"Message":"Api de Reposteria"}
# Ingredientes endpoints
@app.post("/ingredientes",response_model=IngredienteOut)
def crear_ingrediente(data:IngredienteCreate, db:Session=Depends(get_db)):
    if db.query(Ingrediente).filter(Ingrediente.nombre==data.nombre).first():
        raise HTTPException(status_code=400 , detail="El ingrediente ya existe")
    
    ing = crud.cear_ingrediente(db=db, nombre=data.nombre,costo_compra=data.costo_compra,cantidad_compra=data.cantidad_compra,unidad=data.unidad.lower())
    return{
        **ing.__dict__,
        "costo_unitario": round(crud.costo_unitario(ing),6)
    }

@app.get("/ingredientes",response_model=list[IngredienteOut])
def listar_ingredientes(db:Session=Depends(get_db)):
    Ingredientes=db.query(Ingrediente).order_by(Ingrediente.id.desc()).all()
    res=[]
    for ing in Ingredientes:
        res.append({
            **ing.__dict__,
            "costo_unitario": round(crud.costo_unitario(ing),6)
        })
    return res
# Recetas endpoints
@app.post("/recetas",response_model=RecetaOut)
def crear_receta(data:RecetasCreate, db:Session=Depends(get_db)):
    r = crud.crear_receta(db, data.nombre, data.porciones)
    return r

@app.post("/recetas/{receta_id}/items",response_model=RecetaItemOut)
def agregar_item(receta_id:int, data:RecetaItemCreate, db:Session=Depends(get_db)):
    item= crud.agregar_items_receta(db,receta_id,data.ingrediente_id,data.cantidad,data.unidad.lower())
    return item

@app.get("/recetas/{receta_id}/costo")
def obtener_costo(receta_id:int, db:Session=Depends(get_db)):
    return crud.costo_receta(db, receta_id  )

@app.get("/recetas",response_model=list[RecetaOut])
def lista_recetas(db:Session=Depends(get_db)):
    return db.query(Receta).order_by(Receta.id.desc()).all()

@app.get("/recetas/{receta_id}", response_model=RecetaDetalleOut)
def obtener_receta(receta_id:int, db:Session=Depends(get_db)):
    receta=(
        db.query(Receta)
        .options(joinedload(Receta.items).joinedload(RecetaItem.ingrediente))
        .filter(Receta.id==receta_id)
        .first()
    )
    if not receta:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return receta

@app.delete("/recetas/{receta_id}/items/{item_id}")
def borrar_item(receta_id:int, item_id:int,db:Session=Depends(get_db)):
    item= db.query(RecetaItem).filter(
        RecetaItem.id==item_id,
        RecetaItem.receta_id==receta_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="item no encontrado")
    db.delete(item)
    db.commit()
    return{"ok":True}

@app.delete("/recetas/{receta_id}")
def  borrar_receta(receta_id:int,db:Session=Depends(get_db)):
    receta=db.query(Receta).filter(Receta.id == receta_id).first()
    if not receta:
        raise HTTPException(status_code=404,detail="Receta no encontrada")
    db.delete(receta)
    db.commit()
    return{"ok":True}

#actualizar 
@app.put("/ingredientes/{ingrediente_id}",response_model=IngredienteOut)
def editar_ingrediente(ingrediente_id:int,data:IngredienteUpdate,db:Session=Depends(get_db)):
    ing=crud.actualizar_ingrediente(
        db=db,
        ingrediente_id=ingrediente_id,
        nombre=data.nombre,
        costo_compra=data.costo_compra,
        cantidad_compra=data.cantidad_compra,
        unidad = data.unidad.lower()
    )
    return {**ing.__dict__, "costo_unitario":round(crud.costo_unitario(ing),6)}

@app.put("/recetas/{receta_id}",response_model=RecetaOut)
def editar_receta(receta_id:int,data: RecetasUpdate, db:Session=Depends(get_db)):
    return crud.actualizar_receta(db,receta_id,data.nombre,data.porciones)

@app.put("/recetas/{receta_id}/items/{item_id}", response_model=RecetaItemOut)
def editar_item(receta_id:int,item_id:int,data:RecetasItemUpdate,db:Session=Depends(get_db)):
    return crud.actualizar_item_receta(db, receta_id,item_id,data.cantidad,data.unidad.lower())