const API = 'http://127.0.0.1:8000'

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map(d => d.msg).join(' | ')
      : data?.detail ?? 'Error desconocido'
    throw new Error(detail)
  }
  return data
}

export const getRecetas = () => fetchJson(`${API}/recetas`)
export const getRecetaDetalle = (id) => fetchJson(`${API}/recetas/${id}`)
export const getRecetaCosto = (id) => fetchJson(`${API}/recetas/${id}/costo`)
export const getRecetaDiagnostico = (id) => fetchJson(`${API}/recetas/${id}/diagnostico`)
export const getRecetasInconsistentes = () => fetchJson(`${API}/recetas/inconsistencias/configuracion`)

export const createReceta = (body) =>
  fetchJson(`${API}/recetas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const deleteReceta = (id) =>
  fetchJson(`${API}/recetas/${id}`, { method: 'DELETE' })

export const addItem = (recetaId, body) =>
  fetchJson(`${API}/recetas/${recetaId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export const deleteItem = (recetaId, itemId) =>
  fetchJson(`${API}/recetas/${recetaId}/items/${itemId}`, { method: 'DELETE' })

export const getIngredientes = () => fetchJson(`${API}/ingredientes`)
