# 🍰 Repostería Costos — Calculadora de Recetas

Aplicación web para calcular el **costo real de recetas de repostería** por unidad y por lote, usando ingredientes, unidades de medida y reglas de conversión.  
Incluye backend en FastAPI + SQLite y frontend en HTML/CSS/JS.

---

## 🚀 Funciones actuales (V1)

- ✅ Registro de ingredientes con:
  - costo de compra
  - cantidad comprada
  - unidad (g, kg, ml, L, pz, tsp, tbsp)
- ✅ Conversión automática a unidad base
- ✅ Cálculo de costo unitario por ingrediente
- ✅ Creación de recetas
- ✅ Agregar ingredientes a recetas con diferentes unidades
- ✅ Cálculo de costo total de receta
- ✅ Cálculo de costo por unidad/pieza
- ✅ UI web para ingredientes y recetas
- ✅ Visualización de costo por ingrediente dentro de la receta

---

## 🧮 Ejemplo de uso

Si compras:

- 1 kg harina = $120

El sistema calcula:

- $0.12 por gramo

Si la receta usa:

- 200 g harina → costo = $24

---

## 🛠️ Tecnologías

**Backend**
- FastAPI
- SQLAlchemy
- SQLite
- Uvicorn

**Frontend**
- HTML5
- CSS3 (tema glass / estilo moderno)
- JavaScript vanilla

---

## 📂 Estructura del proyecto
# 🍰 Repostería Costos — Calculadora de Recetas

Aplicación web para calcular el **costo real de recetas de repostería** por unidad y por lote, usando ingredientes, unidades de medida y reglas de conversión.  
Incluye backend en FastAPI + SQLite y frontend en HTML/CSS/JS.

---

## 🚀 Funciones actuales (V1)

- ✅ Registro de ingredientes con:
  - costo de compra
  - cantidad comprada
  - unidad (g, kg, ml, L, pz, tsp, tbsp)
- ✅ Conversión automática a unidad base
- ✅ Cálculo de costo unitario por ingrediente
- ✅ Creación de recetas
- ✅ Agregar ingredientes a recetas con diferentes unidades
- ✅ Cálculo de costo total de receta
- ✅ Cálculo de costo por unidad/pieza
- ✅ UI web para ingredientes y recetas
- ✅ Visualización de costo por ingrediente dentro de la receta

---

## 🧮 Ejemplo de uso

Si compras:

- 1 kg harina = $120

El sistema calcula:

- $0.12 por gramo

Si la receta usa:

- 200 g harina → costo = $24

---

## 🛠️ Tecnologías

**Backend**
- FastAPI
- SQLAlchemy
- SQLite
- Uvicorn

**Frontend**
- HTML5
- CSS3 (tema glass / estilo moderno)
- JavaScript vanilla

---

## 📂 Estructura del proyecto

reposteria/
backend/
app/
main.py
models.py
schemas.py
crud.py
db.py
run.py
frontend/
index.html
recetas.html
style.css
app.js
recetas.js
## ▶️ Cómo ejecutar el proyecto

### 1️⃣ Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
.venv\Scripts\activate      # Windows

pip install -r requirements.txt
python run.py
