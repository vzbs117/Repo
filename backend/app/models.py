from sqlalchemy import Column, Integer, String,Float, ForeignKey,UniqueConstraint
from sqlalchemy.orm import relationship
from .db import Base

class Unidad(Base):
    __tablename__="unidades"
    id= Column(Integer, primary_key= True, index=True)
    codigo= Column(String, unique=True, index=True) # g, kg, ml, l, tsp, tbsp, pz
    tipo= Column(String, nullable=False)            # mass, volume, count
    factor_a_base= Column(Float, nullable=False)    # a g, ml o pz
    base=Column(String,nullable=False)              # g, ml o pz

class Ingrediente(Base):
    __tablename__="ingredientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)

    unidad_base = Column(String, nullable=False)      # g, ml o pz
    costo_compra = Column(Float, nullable=False)      # costo total pagado
    cantidad_compra_base = Column(Float, nullable=False)  # cantidad en unidad_base
    
    items = relationship('RecetaItem', back_populates="ingrediente")


class Receta(Base):
    __tablename__="recetas"
    id=Column(Integer, primary_key=True, index=True)
    nombre=Column(String,unique=True, index=True, nullable=False)
    porciones=Column(Integer, default=1)

    items=relationship('RecetaItem', back_populates="receta", cascade="all, delete-orphan")

class RecetaItem(Base):
    __tablename__="receta_items"
    id=Column(Integer,primary_key=True, index=True)
    receta_id=Column(Integer,ForeignKey("recetas.id"), nullable=False)
    ingrediente_id=Column(Integer,ForeignKey("ingredientes.id"), nullable=False)
    cantidad_usada_base=Column(Float,nullable=False) # cantidad en unidad_base
    unidad_original=Column(String, default="") #opcional tsp, tbsp, kg, ml, etc
    cantidad_original=Column(Float,default=0)

    receta=relationship("Receta", back_populates="items")
    ingrediente=relationship("Ingrediente", back_populates="items")

    __table_args__=(UniqueConstraint("receta_id","ingrediente_id", name="uq_receta_ingrediente"),)