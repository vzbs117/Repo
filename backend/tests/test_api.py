from pathlib import Path
import sys
import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import main as main_module
from app.db import Base
from app.deps import get_db
from app.main import app
from app.models import Empleado
from app.seed import seed_unidades


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.TestSessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
        )
        Base.metadata.create_all(bind=self.engine)

        db = self.TestSessionLocal()
        try:
            seed_unidades(db)
        finally:
            db.close()

        self.original_engine = main_module.engine
        self.original_session_local = main_module.SessionLocal
        main_module.engine = self.engine
        main_module.SessionLocal = self.TestSessionLocal

        def override_get_db():
            db = self.TestSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        main_module.engine = self.original_engine
        main_module.SessionLocal = self.original_session_local
        self.client.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_root_endpoint_responde_ok(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True, "message": "API de Repostería funcionando"})

    def test_crear_y_listar_ingredientes_desde_api(self):
        create_response = self.client.post(
            "/ingredientes",
            json={
                "nombre": "Harina pastelera",
                "costo_compra": 38.5,
                "cantidad_compra": 1.0,
                "unidad": "kg",
            },
        )
        list_response = self.client.get("/ingredientes")

        self.assertEqual(create_response.status_code, 200)
        body = create_response.json()
        self.assertEqual(body["nombre"], "Harina pastelera")
        self.assertEqual(body["unidad_base"], "g")
        self.assertEqual(body["cantidad_compra_base"], 1000.0)
        self.assertGreater(body["costo_unitario"], 0)
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)

    def test_actualizar_empleado_desde_api(self):
        create_response = self.client.post(
            "/empleados",
            json={
                "nombre": "Ana",
                "pago_diario": 300.0,
                "horas_dia": 8.0,
                "activo": True,
            },
        )
        empleado_id = create_response.json()["id"]

        update_response = self.client.put(
            f"/empleados/{empleado_id}",
            json={
                "nombre": "Ana Maria",
                "pago_diario": 360.0,
                "horas_dia": 6.0,
                "activo": False,
            },
        )

        self.assertEqual(update_response.status_code, 200)
        body = update_response.json()
        self.assertEqual(body["nombre"], "Ana Maria")
        self.assertEqual(body["pago_diario"], 360.0)
        self.assertEqual(body["horas_dia"], 6.0)
        self.assertFalse(body["activo"])
        self.assertEqual(body["salario_hora"], 60.0)

    def test_actualizar_empleado_inexistente_regresa_404(self):
        response = self.client.put(
            "/empleados/999",
            json={
                "nombre": "Ana",
                "pago_diario": 300.0,
                "horas_dia": 8.0,
                "activo": True,
            },
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Empleado no encontrado")

    def test_crear_ingrediente_duplicado_regresa_409(self):
        payload = {
            "nombre": "Azucar refinada",
            "costo_compra": 29.0,
            "cantidad_compra": 1.0,
            "unidad": "kg",
        }
        self.client.post("/ingredientes", json=payload)

        duplicate_response = self.client.post("/ingredientes", json=payload)

        self.assertEqual(duplicate_response.status_code, 409)
        self.assertEqual(duplicate_response.json()["detail"], "El ingrediente ya existe")

    def test_receta_con_item_y_diagnostico_desde_api(self):
        ingrediente_response = self.client.post(
            "/ingredientes",
            json={
                "nombre": "Royal",
                "costo_compra": 45.0,
                "cantidad_compra": 250.0,
                "unidad": "g",
            },
        )
        receta_response = self.client.post(
            "/recetas",
            json={"nombre": "Panque de vainilla", "porciones": 8},
        )
        receta_id = receta_response.json()["id"]
        ingrediente_id = ingrediente_response.json()["id"]

        item_response = self.client.post(
            f"/recetas/{receta_id}/items",
            json={
                "ingrediente_id": ingrediente_id,
                "cantidad": 1.0,
                "unidad": "cucharadita",
            },
        )
        diagnostico_response = self.client.get(f"/recetas/{receta_id}/diagnostico")

        self.assertEqual(item_response.status_code, 200)
        self.assertEqual(item_response.json()["unidad_original"], "tsp")
        self.assertEqual(item_response.json()["cantidad_usada_base"], 4.0)
        self.assertEqual(diagnostico_response.status_code, 200)
        diagnostico = diagnostico_response.json()
        self.assertTrue(diagnostico["configuracion_consistente"])
        self.assertFalse(diagnostico["requiere_revision"])

    def test_config_receta_con_empleado_actualiza_resumen(self):
        receta_response = self.client.post(
            "/recetas",
            json={"nombre": "Galleta integral", "porciones": 12},
        )
        receta_id = receta_response.json()["id"]

        db = self.TestSessionLocal()
        try:
            empleado = Empleado(nombre="Ana", pago_diario=320.0, horas_dia=8.0, activo=True)
            db.add(empleado)
            db.commit()
            db.refresh(empleado)
            empleado_id = empleado.id
        finally:
            db.close()

        config_response = self.client.put(
            f"/recetas/{receta_id}/config",
            json={
                "nombre": "Galleta integral",
                "porciones": 12,
                "unidades_producidas": 12,
                "tiempo_trabajo_min": 120,
                "empaque_por_unidad": 0.5,
                "transporte_por_lote": 15,
                "margen_markup": 0.35,
                "empleado_id": empleado_id,
            },
        )
        resumen_response = self.client.get(f"/recetas/{receta_id}/resumen")

        self.assertEqual(config_response.status_code, 200)
        self.assertEqual(config_response.json(), {"ok": True})
        self.assertEqual(resumen_response.status_code, 200)
        resumen = resumen_response.json()
        self.assertEqual(resumen["unidades"], 12)
        self.assertGreater(resumen["costo_mano_obra"], 0)
        self.assertEqual(resumen["costo_transporte"], 15.0)

    def test_config_receta_rechaza_empleado_inexistente(self):
        receta_response = self.client.post(
            "/recetas",
            json={"nombre": "Pastel mini", "porciones": 6},
        )
        receta_id = receta_response.json()["id"]

        response = self.client.put(
            f"/recetas/{receta_id}/config",
            json={
                "nombre": "Pastel mini",
                "porciones": 6,
                "unidades_producidas": 6,
                "tiempo_trabajo_min": 30,
                "empaque_por_unidad": 0,
                "transporte_por_lote": 0,
                "margen_markup": 0.3,
                "empleado_id": 999,
            },
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Empleado no encontrado")

    def test_inconsistencias_configuracion_solo_devuelve_recetas_desalineadas(self):
        receta_ok = self.client.post(
            "/recetas",
            json={"nombre": "Carlota", "porciones": 10},
        )
        receta_bad = self.client.post(
            "/recetas",
            json={"nombre": "Pay frio", "porciones": 8},
        )
        receta_bad_id = receta_bad.json()["id"]

        self.client.put(
            f"/recetas/{receta_bad_id}/config",
            json={
                "nombre": "Pay frio",
                "porciones": 8,
                "unidades_producidas": 2,
                "tiempo_trabajo_min": 0,
                "empaque_por_unidad": 0,
                "transporte_por_lote": 0,
                "margen_markup": 0.3,
                "empleado_id": None,
            },
        )

        response = self.client.get("/recetas/inconsistencias/configuracion")

        self.assertEqual(receta_ok.status_code, 200)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]["nombre"], "Pay frio")
        self.assertTrue(body[0]["requiere_revision"])
