const API = "http://127.0.0.1:8000";

const selReceta = document.getElementById("selReceta");
const selEmpleado = document.getElementById("selEmpleado");

const msg = document.getElementById("msg");
const out = document.getElementById("out");

async function j(url, opt) {
  const r = await fetch(url, opt);
  const d = await r.json();
  if (!r.ok) throw new Error(d.detail || "error");
  return d;
}

async function cargarRecetas() {
  const data = await j(`${API}/recetas`);
  selReceta.innerHTML = data.map(r =>
    `<option value="${r.id}">${r.nombre}</option>`
  ).join("");
}

async function cargarEmpleados() {
  const data = await j(`${API}/empleados`);
  selEmpleado.innerHTML = `<option value="">(sin empleado)</option>` +
    data.map(e =>
      `<option value="${e.id}">${e.nombre} — $${e.salario_hora}/h</option>`
    ).join("");
}

document.getElementById("btnGuardar").onclick = async () => {
  try {
    const id = selReceta.value;

    const body = {
      nombre: selReceta.options[selReceta.selectedIndex].text,
      porciones: Number(document.getElementById("unidades").value),

      unidades_producidas: Number(document.getElementById("unidades").value),
      tiempo_trabajo_min: Number(document.getElementById("tiempo").value),
      empaque_por_unidad: Number(document.getElementById("empaque").value),
      transporte_por_lote: Number(document.getElementById("transporte").value),
      margen_markup: Number(document.getElementById("margen").value) / 100,
      empleado_id: selEmpleado.value || null
    };

    await j(`${API}/recetas/${id}/config`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(body)
    });

    msg.textContent = "Config guardada ✅";

  } catch (e) {
    msg.textContent = e.message;
  }
};

document.getElementById("btnResumen").onclick = async () => {
  try {
    const id = selReceta.value;
    const r = await j(`${API}/recetas/${id}/resumen`);
    out.textContent = JSON.stringify(r, null, 2);
  } catch (e) {
    out.textContent = e.message;
  }
};

(async function init(){
  await cargarRecetas();
  await cargarEmpleados();
})();
