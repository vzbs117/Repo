import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getRecetas,
  getRecetaDetalle,
  getRecetaCosto,
  getRecetaDiagnostico,
  getRecetasInconsistentes,
  createReceta,
  deleteReceta,
  addItem,
  deleteItem,
  getIngredientes,
} from '../Services/recetaApi.js'

function normalizarNombre(nombre = '') {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getAllowedUnits(ingrediente) {
  if (!ingrediente) return ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'fl_oz', 'pz']

  const unidadesPorBase = {
    g: ['g', 'kg', 'oz', 'lb'],
    ml: ['ml', 'l', 'tsp', 'tbsp', 'cup', 'fl_oz'],
    pz: ['pz'],
  }

  const units = [...(unidadesPorBase[ingrediente.unidad_base] ?? [])]
  const nombre = normalizarNombre(ingrediente.nombre)

  if (nombre === 'royal' && !units.includes('tsp')) units.push('tsp')
  if (nombre === 'sal') {
    if (!units.includes('tsp')) units.push('tsp')
    if (!units.includes('pizca')) units.push('pizca')
  }

  return units
}

function getMeasurementHint(ingrediente) {
  if (!ingrediente) return ''

  const nombre = normalizarNombre(ingrediente.nombre)
  if (nombre === 'royal') {
    return 'Tip: para royal ya puedes usar cucharadita y el sistema la convertirá a gramos.'
  }
  if (nombre === 'sal') {
    return 'Tip: para sal ya puedes usar cucharadita o pizca; internamente se convierten a gramos.'
  }
  return ''
}

export function useRecetas() {
  const [recetas, setRecetas] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [recetaActivaId, setRecetaActivaId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [costo, setCosto] = useState(null)
  const [diagnostico, setDiagnostico] = useState(null)
  const [inconsistencias, setInconsistencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const [formReceta, setFormReceta] = useState({ nombre: '', porciones: '12' })
  const [formItem, setFormItem] = useState({ ingredienteId: '', cantidad: '', unidad: null })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [r, i, inc] = await Promise.all([
        getRecetas(),
        getIngredientes(),
        getRecetasInconsistentes().catch(() => []),
      ])
      setRecetas(Array.isArray(r) ? r : [])
      setIngredientes(Array.isArray(i) ? i : [])
      setInconsistencias(Array.isArray(inc) ? inc : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const cargarDetalle = useCallback(async (id) => {
    if (!id) return
    setLoadingDetalle(true)
    try {
      const [det, cos, diag] = await Promise.all([
        getRecetaDetalle(id),
        getRecetaCosto(id),
        getRecetaDiagnostico(id).catch(() => null),
      ])
      setDetalle(det)
      setCosto(cos)
      setDiagnostico(diag)
    } finally {
      setLoadingDetalle(false)
    }
  }, [])

  const seleccionarReceta = useCallback(async (id) => {
    setRecetaActivaId(id)
    setFormItem({ ingredienteId: '', cantidad: '', unidad: null })
    await cargarDetalle(id)
  }, [cargarDetalle])

  const crearRecetaAction = async () => {
    const nombre = formReceta.nombre.trim()
    const porciones = parseInt(formReceta.porciones, 10) || 1
    if (!nombre) return { ok: false, error: 'Escribe un nombre.' }

    setLoading(true)
    try {
      await createReceta({ nombre, porciones })
      setFormReceta({ nombre: '', porciones: '12' })
      await cargar()
      return { ok: true, nombre }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  const eliminarReceta = async (id, nombre) => {
    setLoading(true)
    try {
      await deleteReceta(id)
      if (recetaActivaId === id) {
        setRecetaActivaId(null)
        setDetalle(null)
        setCosto(null)
        setDiagnostico(null)
      }
      await cargar()
      return { ok: true, nombre }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  const agregarItem = async () => {
    if (!recetaActivaId) return { ok: false, error: 'Selecciona una receta primero.' }
    if (!formItem.ingredienteId) return { ok: false, error: 'Elige un ingrediente.' }
    if (!(parseFloat(formItem.cantidad) > 0)) return { ok: false, error: 'Escribe una cantidad válida.' }
    if (!formItem.unidad) return { ok: false, error: 'Elige una medida.' }

    setLoading(true)
    try {
      await addItem(recetaActivaId, {
        ingrediente_id: Number(formItem.ingredienteId),
        cantidad: parseFloat(formItem.cantidad),
        unidad: formItem.unidad,
      })
      setFormItem({ ingredienteId: '', cantidad: '', unidad: null })
      await cargarDetalle(recetaActivaId)
      await cargar()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  const eliminarItem = async (itemId) => {
    setLoading(true)
    try {
      await deleteItem(recetaActivaId, itemId)
      await cargarDetalle(recetaActivaId)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }

  const esItemValido =
    formItem.ingredienteId !== '' &&
    parseFloat(formItem.cantidad) > 0 &&
    formItem.unidad !== null

  const recetaActiva = recetas.find(r => r.id === recetaActivaId) ?? null
  const recetaActivaInconsistente = inconsistencias.find(r => r.receta_id === recetaActivaId) ?? null
  const ingredienteSeleccionado = useMemo(
    () => ingredientes.find(i => String(i.id) === String(formItem.ingredienteId)) ?? null,
    [ingredientes, formItem.ingredienteId],
  )
  const unidadesDisponiblesItem = useMemo(
    () => getAllowedUnits(ingredienteSeleccionado),
    [ingredienteSeleccionado],
  )
  const ayudaMedidas = useMemo(
    () => getMeasurementHint(ingredienteSeleccionado),
    [ingredienteSeleccionado],
  )

  return {
    recetas,
    ingredientes,
    loading,
    loadingDetalle,
    recetaActiva,
    recetaActivaId,
    recetaActivaInconsistente,
    detalle,
    costo,
    diagnostico,
    inconsistencias,
    formReceta,
    setFormReceta,
    formItem,
    setFormItem,
    esItemValido,
    ingredienteSeleccionado,
    unidadesDisponiblesItem,
    ayudaMedidas,
    seleccionarReceta,
    crearReceta: crearRecetaAction,
    eliminarReceta,
    agregarItem,
    eliminarItem,
    cargar,
  }
}
