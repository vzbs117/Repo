// Cambia esto si tu backend corre en otro host/puerto
const API = "http://127.0.0.1:8000";

const form = document.getElementById("form");
const tabla = document.getElementById("tabla");
const msg = document.getElementById("msg");
const btnReload = document.getElementById("btnReload");

let editingId=null;
let cacheIngredintes=[];

function setMsg(text, type) {
  msg.textContent = text || "";
  msg.className = "msg " + (type || "");
}

function money(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return n;
  return x.toFixed(2);
}

async function cargarIngredientes() {
  setMsg("", "");
  tabla.innerHTML = `<tr><td colspan="5">Cargando...</td></tr>`;

  try {
    const res = await fetch(`${API}/ingredientes`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.detail || "No se pudo cargar ingredientes");
    }

    cacheIngredientes = data;

    if (!data.length) {
      tabla.innerHTML = `<tr><td colspan="5">Sin ingredientes todavía.</td></tr>`;
      return;
    }

    tabla.innerHTML = "";
    data.forEach((i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i.nombre}</td>
        <td>$${money(i.costo_compra)} / ${i.cantidad_compra_base} ${i.unidad_base}</td>
        <td>${i.unidad_base}</td>
        <td>$${i.costo_unitario} por ${i.unidad_base}</td>
        <td>
          <button class="secondary" data-edit="${i.id}">Editar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });
  } catch (e) {
    tabla.innerHTML = `<tr><td colspan="5">Error al cargar</td></tr>`;
    setMsg(e.message, "err");
  }
}

const btnCancelar = document.getElementById("btnCancelar");

tabla.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-edit]");
  if (!btn) return;

  const id = btn.getAttribute("data-edit");
  const ing = cacheIngredientes.find(x => String(x.id) === String(id));
  if (!ing) return;

  editingId = id;

  // llena el formulario (modo edición en unidad base)
  form.nombre.value = ing.nombre;
  form.costo_compra.value = ing.costo_compra;
  form.cantidad_compra.value = ing.cantidad_compra_base;
  form.unidad.value = ing.unidad_base;

  setMsg("Modo edición: al guardar se actualizará el ingrediente ✅", "ok");
});

btnCancelar.addEventListener("click", () => {
  editingId = null;
  form.reset();
  setMsg("Edición cancelada", "");
});


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("", "");

  const fd = new FormData(form);
  const body = {
    nombre: fd.get("nombre"),
    costo_compra: Number(fd.get("costo_compra")),
    cantidad_compra: Number(fd.get("cantidad_compra")),
    unidad: fd.get("unidad"),
  };

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
      alert("Error: " + (data.detail ?? "no se pudo guardar"));
      return;
    }

    setMsg(isEdit ? "Ingrediente actualizado ✅" : "Ingrediente guardado ✅", "ok");
    editingId = null;
    form.reset();
    await cargarIngredientes();
  } catch (e2) {
    setMsg(e2.message, "err");
  }
});


btnReload.addEventListener("click", cargarIngredientes);

cargarIngredientes();
