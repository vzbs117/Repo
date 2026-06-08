import { useState, useEffect, useCallback } from 'react'
import { getEmpleados, createEmpleado } from '../Services/empleadoApi.js'

const FORM_VACIO = {
  nombre:     '',
  pagoDiario: '',
  horasDia:   '8',
  activo:     true,
}

export function useEmpleados() {
  const [lista,   setLista]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [form,    setForm]    = useState(FORM_VACIO)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEmpleados()
      setLista(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const setField = (campo, valor) =>
    setForm(prev => ({ ...prev, [campo]: valor }))

  const limpiarForm = () => setForm(FORM_VACIO)

  const esFormValido =
    form.nombre.trim() !== '' &&
    parseFloat(form.pagoDiario) >= 0 &&
    parseFloat(form.horasDia)   >  0

  const guardar = async () => {
    if (!esFormValido) return { ok: false, error: 'Completa todos los campos.' }
    setLoading(true)
    try {
      await createEmpleado({
        nombre:      form.nombre.trim(),
        pago_diario: parseFloat(form.pagoDiario),
        horas_dia:   parseFloat(form.horasDia),
        activo:      form.activo,
      })
      limpiarForm()
      await cargar()
      return { ok: true, nombre: form.nombre.trim() }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  // Stats rápidas
  const activos  = lista.filter(e => e.activo)
  const avgHora  = activos.length
    ? activos.reduce((s, e) => s + (e.salario_hora ?? 0), 0) / activos.length
    : 0

  return {
    lista, loading, error,
    form, setField, limpiarForm,
    esFormValido, guardar,
    stats: {
      total:    lista.length,
      activos:  activos.length,
      avgHora:  avgHora.toFixed(2),
    },
  }
}
