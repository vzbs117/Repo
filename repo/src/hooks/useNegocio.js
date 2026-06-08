import { useState, useEffect, useCallback } from 'react'
import { getRecetas, getEmpleados, guardarConfig, getResumen, getDiagnostico } from '../services/negocioApi'

const CONFIG_INICIAL = {
  recetaId: '',
  unidades: '50',
  horas: '1',
  minutos: '30',
  empaque: '0.50',
  transporte: '0',
  hayAyudante: false,
  empleadoId: '',
  margen: '30',
}

export function useNegocio() {
  const [recetas, setRecetas] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [resumen, setResumen] = useState(null)
  const [diagnostico, setDiagnostico] = useState(null)
  const [config, setConfig] = useState(CONFIG_INICIAL)
  const [pasoActual, setPasoActual] = useState(0)
  const [pasosListo, setPasosListo] = useState([false, false, false])

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [r, e] = await Promise.all([
        getRecetas().catch(() => []),
        getEmpleados().catch(() => []),
      ])
      setRecetas(Array.isArray(r) ? r : [])
      setEmpleados((Array.isArray(e) ? e : []).filter(emp => emp.activo))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const setField = (campo, valor) =>
    setConfig(prev => ({ ...prev, [campo]: valor }))

  useEffect(() => {
    const receta = recetas.find(r => String(r.id) === String(config.recetaId))
    if (!receta) {
      setDiagnostico(null)
      return
    }

    setConfig(prev => {
      if (prev.unidades !== CONFIG_INICIAL.unidades && prev.recetaId === config.recetaId) {
        return prev
      }
      return {
        ...prev,
        unidades: String(receta.unidades_producidas || receta.porciones || 1),
      }
    })

    getDiagnostico(receta.id)
      .then(setDiagnostico)
      .catch(() => setDiagnostico(null))
  }, [config.recetaId, recetas])

  const completarPaso = (idx) => {
    setPasosListo(prev => {
      const next = [...prev]
      next[idx] = true
      return next
    })
    if (idx < 2) setPasoActual(idx + 1)
  }

  const togglePaso = (idx) =>
    setPasoActual(prev => (prev === idx ? -1 : idx))

  const calcular = async () => {
    if (!config.recetaId) return { ok: false, error: 'Selecciona una receta.' }
    setCalculando(true)
    try {
      const receta = recetas.find(r => String(r.id) === String(config.recetaId))
      const tiempoMin = (parseInt(config.horas, 10) || 0) * 60 + (parseInt(config.minutos, 10) || 0)
      const body = {
        nombre: receta?.nombre ?? '',
        porciones: receta?.porciones ?? 1,
        unidades_producidas: parseInt(config.unidades, 10) || receta?.unidades_producidas || receta?.porciones || 1,
        tiempo_trabajo_min: tiempoMin,
        empaque_por_unidad: parseFloat(config.empaque) || 0,
        transporte_por_lote: parseFloat(config.transporte) || 0,
        margen_markup: (parseFloat(config.margen) || 30) / 100,
        empleado_id: config.hayAyudante && config.empleadoId ? Number(config.empleadoId) : null,
      }
      await guardarConfig(config.recetaId, body)
      const [data, diag] = await Promise.all([
        getResumen(config.recetaId),
        getDiagnostico(config.recetaId).catch(() => null),
      ])
      setResumen(data)
      setDiagnostico(diag)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setCalculando(false)
    }
  }

  const recalcular = () => {
    setResumen(null)
    setPasoActual(0)
    setPasosListo([false, false, false])
  }

  const recetaActiva = recetas.find(r => String(r.id) === String(config.recetaId)) ?? null
  const todosListos = pasosListo.every(Boolean)

  return {
    recetas,
    empleados,
    loading,
    calculando,
    config,
    setField,
    pasoActual,
    togglePaso,
    pasosListo,
    completarPaso,
    todosListos,
    resumen,
    diagnostico,
    calcular,
    recalcular,
    recetaActiva,
  }
}
