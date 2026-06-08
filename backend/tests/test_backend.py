from pathlib import Path
import sys
import unittest

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import crud
from app.db import Base
from app.main import (
    actualizar_config_receta,
    diagnostico_receta,
    listar_inconsistencias_configuracion,
    root,
)
from app.models import Empleado
from app.schemas import IngredienteCreate, RecetaConfigUpdate, RecetaItemCreate, RecetasCreate
from app.seed import seed_unidades


class BackendTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
        )
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        seed_unidades(self.db)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_root_endpoint_returns_ok_message(self):
        self.assertEqual(
            root(),
            {"ok": True, "message": "API de Repostería funcionando"},
        )

    def test_crear_ingrediente_convierte_compra_a_unidad_base(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Harina",
            costo_compra=48.0,
            cantidad_compra=2.0,
            unidad="kg",
        )

        self.assertEqual(ingrediente.unidad_base, "g")
        self.assertEqual(ingrediente.cantidad_compra_base, 2000.0)
        self.assertAlmostEqual(crud.calcular_costo_unitario(ingrediente), 0.024)

    def test_actualizar_ingrediente_recalcula_unidad_base_y_costo(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Miel",
            costo_compra=60.0,
            cantidad_compra=2.0,
            unidad="l",
        )

        actualizado = crud.actualizar_ingrediente(
            self.db,
            ingrediente_id=ingrediente.id,
            nombre="Miel organica",
            costo_compra=45.0,
            cantidad_compra=500.0,
            unidad="ml",
        )

        self.assertEqual(actualizado.nombre, "Miel organica")
        self.assertEqual(actualizado.unidad_base, "ml")
        self.assertEqual(actualizado.cantidad_compra_base, 500.0)
        self.assertAlmostEqual(crud.calcular_costo_unitario(actualizado), 0.09)

    def test_no_permite_cambiar_familia_unidad_si_ingrediente_ya_se_usa(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Mermelada",
            costo_compra=50.0,
            cantidad_compra=1.0,
            unidad="kg",
        )
        receta = crud.crear_receta(self.db, "Pay", 6)
        crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 150.0, "g")

        with self.assertRaises(HTTPException) as ctx:
            crud.actualizar_ingrediente(
                self.db,
                ingrediente_id=ingrediente.id,
                nombre="Mermelada",
                costo_compra=50.0,
                cantidad_compra=1.0,
                unidad="l",
            )

        self.assertEqual(ctx.exception.status_code, 409)

    def test_convertir_a_base_rechaza_unidad_incompatible(self):
        with self.assertRaises(HTTPException) as ctx:
            crud.convertir_a_base(
                self.db,
                cantidad=1.0,
                unidad="ml",
                unidad_base_esperada="g",
            )

        self.assertEqual(ctx.exception.status_code, 400)

    def test_convertir_a_base_acepta_royal_en_cucharadita(self):
        royal = crud.crear_ingrediente(
            self.db,
            nombre="royal",
            costo_compra=45.5,
            cantidad_compra=250.0,
            unidad="g",
        )

        gramos = crud.convertir_a_base(
            self.db,
            cantidad=1.0,
            unidad="tsp",
            unidad_base_esperada="g",
            ingrediente=royal,
        )

        self.assertEqual(gramos, 4.0)

    def test_convertir_a_base_acepta_sal_en_pizca(self):
        sal = crud.crear_ingrediente(
            self.db,
            nombre="Sal",
            costo_compra=28.0,
            cantidad_compra=1000.0,
            unidad="g",
        )

        gramos = crud.convertir_a_base(
            self.db,
            cantidad=2.0,
            unidad="pizca",
            unidad_base_esperada="g",
            ingrediente=sal,
        )

        self.assertEqual(gramos, 0.72)

    def test_agregar_item_receta_convierte_cantidad_usada_a_base(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Leche",
            costo_compra=30.0,
            cantidad_compra=1.0,
            unidad="l",
        )
        receta = crud.crear_receta(self.db, "Pastel", 8)

        item = crud.agregar_items_receta(
            self.db,
            receta_id=receta.id,
            ingrediente_id=ingrediente.id,
            cantidad=250.0,
            unidad="ml",
        )

        self.assertEqual(item.cantidad_usada_base, 250.0)
        self.assertEqual(item.unidad_original, "ml")
        self.assertEqual(item.cantidad_original, 250.0)

    def test_no_permite_duplicar_un_ingrediente_en_la_misma_receta(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Azucar",
            costo_compra=20.0,
            cantidad_compra=1.0,
            unidad="kg",
        )
        receta = crud.crear_receta(self.db, "Galletas", 12)
        crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 100.0, "g")

        with self.assertRaises(HTTPException) as ctx:
            crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 50.0, "g")

        self.assertEqual(ctx.exception.status_code, 409)

    def test_rechaza_unidad_incompatible_al_actualizar_item(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Mantequilla",
            costo_compra=45.0,
            cantidad_compra=500.0,
            unidad="g",
        )
        receta = crud.crear_receta(self.db, "Pan", 10)
        item = crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 125.0, "g")

        with self.assertRaises(HTTPException) as ctx:
            crud.actualizar_item_receta(
                self.db,
                receta_id=receta.id,
                item_id=item.id,
                cantidad=10.0,
                unidad="ml",
            )

        self.assertEqual(ctx.exception.status_code, 400)

    def test_actualizar_item_receta_modifica_cantidad_original_y_base(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Crema",
            costo_compra=80.0,
            cantidad_compra=2.0,
            unidad="l",
        )
        receta = crud.crear_receta(self.db, "Flan", 6)
        item = crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 100.0, "ml")

        actualizado = crud.actualizar_item_receta(
            self.db,
            receta_id=receta.id,
            item_id=item.id,
            cantidad=1.0,
            unidad="l",
        )

        self.assertEqual(actualizado.cantidad_original, 1.0)
        self.assertEqual(actualizado.unidad_original, "l")
        self.assertEqual(actualizado.cantidad_usada_base, 1000.0)

    def test_actualizar_item_inexistente_regresa_404(self):
        with self.assertRaises(HTTPException) as ctx:
            crud.actualizar_item_receta(
                self.db,
                receta_id=999,
                item_id=999,
                cantidad=1.0,
                unidad="g",
            )

        self.assertEqual(ctx.exception.status_code, 404)

    def test_crear_y_actualizar_receta(self):
        receta = crud.crear_receta(self.db, "Brownie", 9)
        actualizada = crud.actualizar_receta(self.db, receta.id, "Brownie especial", 12)

        self.assertEqual(actualizada.nombre, "Brownie especial")
        self.assertEqual(actualizada.porciones, 12)
        self.assertEqual(actualizada.unidades_producidas, 12)

    def test_crear_receta_duplicada_regresa_conflicto_controlado(self):
        crud.crear_receta(self.db, "Carlota", 8)

        with self.assertRaises(HTTPException) as ctx:
            crud.crear_receta(self.db, "Carlota", 10)

        self.assertEqual(ctx.exception.status_code, 409)

    def test_costo_receta_calcula_total_y_por_porcion(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Chocolate",
            costo_compra=100.0,
            cantidad_compra=1.0,
            unidad="kg",
        )
        receta = crud.crear_receta(self.db, "Trufas", 20)
        crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 200.0, "g")

        costo = crud.costo_receta(self.db, receta.id)

        self.assertEqual(costo["total"], 20.0)
        self.assertEqual(costo["por_porcion"], 1.0)

    def test_resumen_negocio_incluye_mano_de_obra_y_empaque(self):
        empleado = Empleado(nombre="Ana", pago_diario=400.0, horas_dia=8.0, activo=True)
        self.db.add(empleado)
        self.db.commit()
        self.db.refresh(empleado)

        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Harina premium",
            costo_compra=30.0,
            cantidad_compra=1.0,
            unidad="kg",
        )
        receta = crud.crear_receta(self.db, "Cupcakes", 10)
        receta.unidades_producidas = 20
        receta.tiempo_trabajo_min = 120
        receta.empaque_por_unidad = 1.5
        receta.transporte_por_lote = 20.0
        receta.margen_markup = 0.30
        receta.empleado_id = empleado.id
        self.db.commit()

        crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 250.0, "g")
        resumen = crud.resumen_negocio_receta(self.db, receta.id)

        self.assertEqual(resumen["costo_ingredientes"], 7.5)
        self.assertEqual(resumen["costo_mano_obra"], 100.0)
        self.assertEqual(resumen["costo_empaque"], 30.0)
        self.assertEqual(resumen["costo_transporte"], 20.0)
        self.assertEqual(resumen["precio_lote"], 204.75)

    def test_resumen_negocio_sin_empleado_usa_costo_mano_obra_cero(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Azucar glass",
            costo_compra=40.0,
            cantidad_compra=1.0,
            unidad="kg",
        )
        receta = crud.crear_receta(self.db, "Donas", 8)
        receta.unidades_producidas = 8
        receta.tiempo_trabajo_min = 90
        receta.empaque_por_unidad = 0.5
        receta.transporte_por_lote = 10.0
        self.db.commit()

        crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 250.0, "g")
        resumen = crud.resumen_negocio_receta(self.db, receta.id)

        self.assertEqual(resumen["costo_mano_obra"], 0.0)
        self.assertEqual(resumen["costo_transporte"], 10.0)

    def test_diagnostico_receta_detecta_diferencia_entre_porciones_y_unidades(self):
        ingrediente = crud.crear_ingrediente(
            self.db,
            nombre="Queso crema",
            costo_compra=90.0,
            cantidad_compra=1.0,
            unidad="kg",
        )
        receta = crud.crear_receta(self.db, "Cheesecake", 12)
        receta.unidades_producidas = 1
        self.db.commit()
        crud.agregar_items_receta(self.db, receta.id, ingrediente.id, 300.0, "g")

        diagnostico = diagnostico_receta(receta.id, self.db)

        self.assertFalse(diagnostico["configuracion_consistente"])
        self.assertTrue(diagnostico["requiere_revision"])
        self.assertEqual(diagnostico["costo_ingredientes_total"], 27.0)
        self.assertEqual(diagnostico["costo_ingredientes_por_porcion"], 2.25)
        self.assertEqual(diagnostico["costo_ingredientes_por_unidad_producida"], 27.0)

    def test_listado_inconsistencias_solo_devuelve_recetas_con_datos_desalineados(self):
        consistente = crud.crear_receta(self.db, "Gelatina", 8)
        inconsistente = crud.crear_receta(self.db, "Pastel individual", 10)
        inconsistente.unidades_producidas = 2
        self.db.commit()

        resultados = listar_inconsistencias_configuracion(self.db)

        self.assertEqual(len(resultados), 1)
        self.assertEqual(resultados[0]["receta_id"], inconsistente.id)
        self.assertNotEqual(resultados[0]["receta_id"], consistente.id)

    def test_actualizar_config_receta_valida_empleado_existente(self):
        receta = crud.crear_receta(self.db, "Rosca", 10)

        with self.assertRaises(HTTPException) as ctx:
            actualizar_config_receta(
                receta.id,
                RecetaConfigUpdate(
                    nombre="Rosca",
                    porciones=10,
                    unidades_producidas=10,
                    tiempo_trabajo_min=60.0,
                    empaque_por_unidad=1.0,
                    transporte_por_lote=10.0,
                    margen_markup=0.3,
                    empleado_id=999,
                ),
                self.db,
            )

        self.assertEqual(ctx.exception.status_code, 404)

    def test_schema_normaliza_unidad_y_rechaza_unidad_invalida(self):
        data = IngredienteCreate(
            nombre="Vainilla",
            costo_compra=10.0,
            cantidad_compra=1.0,
            unidad=" KG ",
        )
        self.assertEqual(data.unidad, "kg")

        data_cup = IngredienteCreate(
            nombre="Leche evaporada",
            costo_compra=25.0,
            cantidad_compra=1.0,
            unidad=" cup ",
        )
        self.assertEqual(data_cup.unidad, "cup")

        receta_item_cucharadita = RecetaItemCreate(
            ingrediente_id=1,
            cantidad=1.0,
            unidad="cucharadita",
        )
        self.assertEqual(receta_item_cucharadita.unidad, "tsp")

        receta_item_pizca = RecetaItemCreate(
            ingrediente_id=1,
            cantidad=1.0,
            unidad="pizcas",
        )
        self.assertEqual(receta_item_pizca.unidad, "pizca")

        with self.assertRaises(ValidationError):
            RecetaItemCreate(
                ingrediente_id=1,
                cantidad=2.0,
                unidad="metros",
            )

    def test_schema_rechaza_nombres_vacios_tras_strip(self):
        with self.assertRaises(ValidationError):
            IngredienteCreate(
                nombre="   ",
                costo_compra=10.0,
                cantidad_compra=1.0,
                unidad="kg",
            )

        with self.assertRaises(ValidationError):
            RecetasCreate(nombre="   ", porciones=4)

    def test_seed_unidades_inserta_catalogo_esperado(self):
        self.assertEqual(self.db.query(crud.Unidad).count(), 11)


if __name__ == "__main__":
    unittest.main()
