import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

#le la Url desde la cariable de entorno; si no exixste una local , Usa SQLite local
Database_URL= os.getenv("DATABASE_URL", "sqlite:///./repostreria.db")
#Database="sqlite:///./repostreria.db"

connect_args={"check_same_thread":False} if Database_URL.startswith("sqlite") else {}

engine=create_engine(
    Database_URL,
    connect_args=connect_args,
    pool_pre_ping=True #detecta conexiones caidas automaticamente 
)

SessionLocal= sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base=declarative_base()