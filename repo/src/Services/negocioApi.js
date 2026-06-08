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
export const getEmpleados = () => fetchJson(`${API}/empleados`)
export const getResumen = (id) => fetchJson(`${API}/recetas/${id}/resumen`)
export const getDiagnostico = (id) => fetchJson(`${API}/recetas/${id}/diagnostico`)
export const guardarConfig = (id, body) =>
  fetchJson(`${API}/recetas/${id}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
