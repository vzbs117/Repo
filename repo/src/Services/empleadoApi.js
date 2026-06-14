import { API_BASE_URL as API } from '../config/api'

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

export const getEmpleados = () => fetchJson(`${API}/empleados`)

export const createEmpleado = (body) =>
  fetchJson(`${API}/empleados`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
