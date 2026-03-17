const API = "http://127.0.0.1:8000";

const form = document.getElementById("form");
const tabla = document.getElementById("tabla");
const msg = document.getElementById("msg");
const btnReload = document.getElementById("btnReload");
const btnCancelar = document.getElementById("btnCancelar");
const editPill = document.getElementById("editPill");

let editingId = null;
let cacheIngredientes = []; // ✅ nombre consistente

const fmtMoney = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

function setMsg(text, type) {
  msg.textContent = text || "";
  msg.className = "msg " + (type || "");
}

function setEditMode(on, nombre = "") {
  if (on) {
    editPill.hidden = false;
    editPill.textContent = nombre ? `Modo edición: ${nombre}` : "Modo edición";
    btnCancelar.disabled = false;
  } else {
    editPill.hidden = true;
    editPill.textContent = "Modo edición";
    btnCancelar.disabled = true;
  }
}

function stateRow(text) {
  return `<tr class="state"><td colspan="5">${text}</td></tr>`;
}

async function cargarIngredientes() {
  setMsg("", "");
  tabla.innerHTML = stateRow("Cargando...");

  try {
    const res = await fetch(`${API}/ingredientes`);
    const data = await res.json();

    if (!res.ok) throw new Error(data?.detail || "No se pudo cargar ingredientes");

    cacheIngredientes = Array.isArray(data) ? data : [];

    if (!cacheIngredientes.length) {
      tabla.innerHTML = stateRow("Sin ingredientes todavía.");
      return;
    }

    tabla.innerHTML = "";
    cacheIngredientes.forEach((i) => {
      const tr = document.createElement("tr");

      const compra = `${fmtMoney.format(Number(i.costo_compra) || 0)} / ${i.cantidad_compra_base} ${i.unidad_base}`;
      const unitario = `${fmtMoney.format(Number(i.costo_unitario) || 0)} por ${i.unidad_base}`;

      tr.innerHTML = `
        <td>${i.nombre}</td>
        <td class="num">${compra}</td>
        <td>${i.unidad_base}</td>
        <td class="num">${unitario}</td>
        <td class="actionsCell">
          <button class="btn btn--ghost btn--sm" type="button" data-edit="${i.id}">Editar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });
  } catch (e) {
    tabla.innerHTML = stateRow("Error al cargar.");
    setMsg(e.message, "err");
  }
}

tabla.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-edit]");
  if (!btn) return;

  const id = btn.getAttribute("data-edit");
  const ing = cacheIngredientes.find((x) => String(x.id) === String(id));
  if (!ing) return;

  editingId = id;

  // llena el formulario (modo edición en unidad base)
  form.nombre.value = ing.nombre ?? "";
  form.costo_compra.value = ing.costo_compra ?? "";
  form.cantidad_compra.value = ing.cantidad_compra_base ?? "";
  form.unidad.value = ing.unidad_base ?? "g";

  setEditMode(true, ing.nombre);
  setMsg("Estás editando. Guarda para aplicar cambios ✅", "ok");
});

btnCancelar.addEventListener("click", () => {
  editingId = null;
  form.reset();
  setEditMode(false);
  setMsg("Edición cancelada", "");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("", "");

  const fd = new FormData(form);

  const body = {
    nombre: String(fd.get("nombre") || "").trim(),
    costo_compra: Number(fd.get("costo_compra")),
    cantidad_compra: Number(fd.get("cantidad_compra")),
    unidad: String(fd.get("unidad") || "").trim(),
  };

  // validación rápida UX (evita NaN silencioso)
  if (!body.nombre) return setMsg("Escribe un nombre.", "err");
  if (!Number.isFinite(body.costo_compra) || body.costo_compra < 0) return setMsg("Costo inválido.", "err");
  if (!Number.isFinite(body.cantidad_compra) || body.cantidad_compra <= 0) return setMsg("Cantidad inválida.", "err");

  const isEdit = Boolean(editingId);
  const url = isEdit ? `${API}/ingredientes/${editingId}` : `${API}/ingredientes`;
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setMsg("Error: " + (data.detail ?? "no se pudo guardar"), "err");
      return;
    }

    setMsg(isEdit ? "Ingrediente actualizado ✅" : "Ingrediente guardado ✅", "ok");
    editingId = null;
    form.reset();
    setEditMode(false);
    await cargarIngredientes();
  } catch (err) {
    setMsg(err.message, "err");
  }
});

btnReload.addEventListener("click", cargarIngredientes);

setEditMode(false);
cargarIngredientes();
