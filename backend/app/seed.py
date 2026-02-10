from .models import Unidad

def seed_unidades(db):
    defaults=[
        ("g","mass",1.0,"g"),
        ("kg","mass",1000.0,"g"),
        ("ml","volume",1.0,"ml"),
        ("l","volume",1000.0,"ml"),
        ("tsp","volume",5.0,"ml"), #cucharadita
        ("tbsp","volume",15.0,"ml"), #cucharada
        ("pz","count",1.0,"pz")
    ]

    for codigo , tipo , factor, base in defaults:
        if not db.query(Unidad).filter_by(codigo=codigo).first():
            db.add(Unidad(codigo=codigo,tipo=tipo,factor_a_base=factor,base=base))
    db.commit()