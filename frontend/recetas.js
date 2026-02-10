const API = "http://127.0.0.1:8000";

let ingredientesMap = new Map();

const formReceta = document.getElementById("formReceta");
const msgReceta = document.getElementById("msgReceta");

const selectReceta = document.getElementById("selectReceta");
const btnCargar = document.getElementById("btnCargar");
const msgLoad = document.getElementById("msgLoad");

const selectIngrediente = document.getElementById("selectIngrediente");

const formItem = document.getElementById("formItem");
const msgItem = document.getElementById("msgItem");

const btnCosto = document.getElementById("btnCosto");
const costoTxt = document.getElementById("costoTxt");
const tablaItems = document.getElementById("tablaItems");

function setMsg(el, text, type) {
  el.textContent = text || "";
  el.className = "msg " + (type || "");
}

// Unitario compacto: pz = 2 decimales, g/ml = 4 decimales, sin ceros extra
function moneyByUnit(value, base) {
  const dec = base === "pz" ? 2 : 4;
  return Number(value).toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: dec,
  });
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    let detail = data?.detail ?? "Error";
    // FastAPI 422 suele venir como lista de objetos
    if (Array.isArray(detail)) detail = detail.map((d) => d.msg).join(" | ");
    if (typeof detail === "object") detail = JSON.stringify(detail);
    throw new Error(detail);
  }
  return data;
}

async function cargarRecetas() {
  const recetas = await fetchJson(`${API}/recetas`);
  selectReceta.innerHTML = "";
  if (!recetas.length) {
    selectReceta.innerHTML = `<option value="">(No hay recetas)</option>`;
    return;
  }
  recetas.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.nombre} (porciones: ${r.porciones})`;
    selectReceta.appendChild(opt);
  });
}

async function cargarIngredientes() {
  const ingredientes = await fetchJson(`${API}/ingredientes`);

  // Mapa para costo_unitario por id
  ingredientesMap = new Map(ingredientes.map((i) => [String(i.id), i]));

  // Llenar select
  selectIngrediente.innerHTML = "";
  if (!ingredientes.length) {
    selectIngrediente.innerHTML = `<option value="">(No hay ingredientes)</option>`;
    return;
  }
  ingredientes.forEach((i) => {
    const opt = document.createElement("option");
    opt.value = i.id;
    opt.textContent = `${i.nombre} [base: ${i.unidad_base}]`;
    selectIngrediente.appendChild(opt);
  });
}

async function cargarDetalleReceta() {
  const recetaId = selectReceta.value;
  if (!recetaId) return;

  const receta = await fetchJson(`${API}/recetas/${recetaId}`);

  tablaItems.innerHTML = "";
  if (!receta.items.length) {
    tablaItems.innerHTML = `<tr><td colspan="6">Sin ingredientes en la receta.</td></tr>`;
    return;
  }

  receta.items.forEach((item) => {
    const ingFull = ingredientesMap.get(String(item.ingrediente.id));
    const unit = ingFull?.costo_unitario ?? 0;

    const base = item.ingrediente.unidad_base;
    const qtyBase = Number(item.cantidad_usada_base || 0);
    const costoItem = unit * qtyBase;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.ingrediente.nombre}</td>
      <td>${item.cantidad_usada_base} ${base}</td>
      <td>$${moneyByUnit(unit, base)} / ${base}</td>
      <td><b>$${Number(costoItem).toFixed(2)}</b></td>
      <td>${item.cantidad_original} ${item.unidad_original}</td>
      <td><button data-id="${item.id}" class="btn btn--ghost">Eliminar</button></td>
    `;
    tablaItems.appendChild(tr);
  });
}

async function cargarCosto() {
  const recetaId = selectReceta.value;
  if (!recetaId) return;
  const costo = await fetchJson(`${API}/recetas/${recetaId}/costo`);
  costoTxt.textContent = `Total: $${costo.total} | Por porción: $${costo.por_porcion}`;
}

formReceta.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(msgReceta, "", "");

  const fd = new FormData(formReceta);
  const body = {
    nombre: fd.get("nombre"),
    porciones: Number(fd.get("porciones")),
  };

  try {
    await fetchJson(`${API}/recetas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMsg(msgReceta, "Receta creada ✅", "ok");
    formReceta.reset();
    await cargarRecetas();
  } catch (e2) {
    setMsg(msgReceta, e2.message, "err");
  }
});

btnCargar.addEventListener("click", async () => {
  try {
    setMsg(msgLoad, "Cargando...", "");

    // refresca ingredientes por si cambiaste precios en la otra página
    await cargarIngredientes();

    await cargarDetalleReceta();
    await cargarCosto();
    setMsg(msgLoad, "Listo ✅", "ok");
  } catch (e) {
    setMsg(msgLoad, e.message, "err");
  }
});

formItem.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(msgItem, "", "");

  const recetaId = selectReceta.value;
  if (!recetaId) {
    setMsg(msgItem, "Selecciona una receta primero", "err");
    return;
  }

  const fd = new FormData(formItem);
  const body = {
    ingrediente_id: Number(selectIngrediente.value),
    cantidad: Number(fd.get("cantidad")),
    unidad: fd.get("unidad"),
  };

  try {
    await fetchJson(`${API}/recetas/${recetaId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMsg(msgItem, "Agregado ✅", "ok");
    formItem.reset();
    await cargarDetalleReceta();
    await cargarCosto();
  } catch (e2) {
    setMsg(msgItem, e2.message, "err");
  }
});

btnCosto.addEventListener("click", async () => {
  try {
    await cargarCosto();
  } catch (e) {
    setMsg(msgLoad, e.message, "err");
  }
});

tablaItems.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;

  const recetaId = selectReceta.value;
  const itemId = btn.getAttribute("data-id");

  try {
    await fetchJson(`${API}/recetas/${recetaId}/items/${itemId}`, { method: "DELETE" });
    await cargarDetalleReceta();
    await cargarCosto();
  } catch (e2) {
    setMsg(msgLoad, e2.message, "err");
  }
});

(async function init() {
  await cargarIngredientes();
  await cargarRecetas();
})();
