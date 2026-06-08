const API = 'http://127.0.0.1:8000'

async function fetchJson(url, options = {}) {
  const res  = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map(d => d.msg).join(' | ')
      : data?.detail ?? 'Error desconocido'
    throw new Error(detail)
  }
  return data
}

export async function getIngredientes() {
  return fetchJson(`${API}/ingredientes`)
}

export async function createIngrediente(body) {
  return fetchJson(`${API}/ingredientes`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

export async function updateIngrediente(id, body) {
  return fetchJson(`${API}/ingredientes/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

export async function deleteIngrediente(id) {
  return fetchJson(`${API}/ingredientes/${id}`, { method: 'DELETE' })
}
