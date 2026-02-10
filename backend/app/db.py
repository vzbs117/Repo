from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Database="sqlite:///./repostreria.db"

engien = create_engine(Database, connect_args={"check_same_thread": False})

SessionLocal= sessionmaker(autocommit=False, autoflush=False, bind=engien)
Base=declarative_base()