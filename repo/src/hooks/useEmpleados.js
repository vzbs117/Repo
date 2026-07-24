import { useState, useEffect, useCallback } from 'react'
import { getEmpleados, createEmpleado, updateEmpleado } from '../Services/empleadoApi.js'

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
  const [editandoId, setEditandoId] = useState(null)

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

  const limpiarForm = () => {
    setForm(FORM_VACIO)
    setEditandoId(null)
  }

  const iniciarEdicion = empleado => {
    setEditandoId(empleado.id)
    setForm({
      nombre: empleado.nombre,
      pagoDiario: String(empleado.pago_diario ?? ''),
      horasDia: String(empleado.horas_dia ?? '8'),
      activo: Boolean(empleado.activo),
    })
  }

  const esFormValido =
    form.nombre.trim() !== '' &&
    parseFloat(form.pagoDiario) >= 0 &&
    parseFloat(form.horasDia)   >  0

  const guardar = async () => {
    if (!esFormValido) return { ok: false, error: 'Completa todos los campos.' }
    setLoading(true)
    const payload = {
      nombre: form.nombre.trim(),
      pago_diario: parseFloat(form.pagoDiario),
      horas_dia: parseFloat(form.horasDia),
      activo: form.activo,
    }
    try {
      if (editandoId) await updateEmpleado(editandoId, payload)
      else await createEmpleado(payload)
      limpiarForm()
      await cargar()
      return { ok: true, nombre: form.nombre.trim(), editando: Boolean(editandoId) }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  const cambiarActivo = async empleado => {
    setLoading(true)
    try {
      const actualizado = await updateEmpleado(empleado.id, {
        nombre: empleado.nombre,
        pago_diario: empleado.pago_diario,
        horas_dia: empleado.horas_dia,
        activo: !empleado.activo,
      })
      await cargar()
      if (editandoId === empleado.id) {
        setForm(prev => ({ ...prev, activo: actualizado.activo }))
      }
      return { ok: true, nombre: actualizado.nombre, activo: actualizado.activo }
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
    form, setField, limpiarForm, iniciarEdicion,
    editandoId,
    esFormValido, guardar,
    cambiarActivo,
    stats: {
      total:    lista.length,
      activos:  activos.length,
      avgHora:  avgHora.toFixed(2),
    },
  }
}
