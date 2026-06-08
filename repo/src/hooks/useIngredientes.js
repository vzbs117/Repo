import { useState, useEffect, useCallback } from 'react'
import {
  getIngredientes,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
} from '../services/ingredientesApi'

const FORM_VACIO = {
  nombre:   '',
  costo:    '',
  cantidad: '',
  unidad:   null,
}

export function useIngredientes() {
  const [lista,      setLista]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [form,       setForm]       = useState(FORM_VACIO)

  // ── CARGAR ──
  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIngredientes()
      setLista(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── FORM ──
  const setField = (campo, valor) =>
    setForm(prev => ({ ...prev, [campo]: valor }))

  const limpiarForm = () => {
    setForm(FORM_VACIO)
    setEditandoId(null)
  }

  const iniciarEdicion = (ing) => {
    setEditandoId(ing.id)
    setForm({
      nombre:   ing.nombre,
      costo:    String(ing.costo_compra),
      cantidad: String(ing.cantidad_compra_base),
      unidad:   ing.unidad_base,
    })
  }

  // ── VALIDAR ──
  const esFormValido =
    form.nombre.trim() !== '' &&
    parseFloat(form.costo)    > 0 &&
    parseFloat(form.cantidad) > 0 &&
    form.unidad !== null

  // ── GUARDAR (crear o actualizar) ──
  const guardar = async () => {
    if (!esFormValido) return

    const body = {
      nombre:          form.nombre.trim(),
      costo_compra:    parseFloat(form.costo),
      cantidad_compra: parseFloat(form.cantidad),
      unidad:          form.unidad,
    }

    setLoading(true)
    try {
      if (editandoId) {
        await updateIngrediente(editandoId, body)
      } else {
        await createIngrediente(body)
      }
      limpiarForm()
      await cargar()
      return { ok: true, nombre: body.nombre, editando: Boolean(editandoId) }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  // ── ELIMINAR ──
  const eliminar = async (id, nombre) => {
    setLoading(true)
    try {
      await deleteIngrediente(id)
      await cargar()
      return { ok: true, nombre }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  // ── PREVIEW del costo por unidad base ──
  const FACTOR = {
    g: 1, kg: 1000, oz: 28.35, lb: 453.59,
    ml: 1, l: 1000, tsp: 5, tbsp: 15, cup: 240, pz: 1,
  }
  const LABEL = {
    g: 'gramo', kg: 'kilogramo', oz: 'onza', lb: 'libra',
    ml: 'mililitro', l: 'litro', tsp: 'cucharadita',
    tbsp: 'cucharada', cup: 'taza', pz: 'pieza',
  }

  let preview = null
  const costo    = parseFloat(form.costo)
  const cantidad = parseFloat(form.cantidad)
  if (costo > 0 && cantidad > 0 && form.unidad) {
    const base  = costo / (cantidad * (FACTOR[form.unidad] || 1))
    preview = {
      costo:  base.toFixed(4),
      unidad: LABEL[form.unidad] || form.unidad,
    }
  }

  return {
    lista, loading, error,
    form, setField, limpiarForm, iniciarEdicion,
    editandoId, esFormValido,
    guardar, eliminar, cargar,
    preview,
  }
}
