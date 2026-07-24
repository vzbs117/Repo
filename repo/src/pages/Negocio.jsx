import { useState } from 'react'
import { useNegocio } from '../hooks/useNegocio'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import styles from '../styles/Negocio.module.css'

const money = (v, d = 2) =>
  '$' + Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d })

const MARGENES = [
  { val: '20', label: '20% — mínimo' },
  { val: '30', label: '30% — recomendado' },
  { val: '50', label: '50% — premium' },
]

export default function Negocio() {
  const {
    recetas, empleados, loading, calculando,
    config, setField,
    pasoActual, togglePaso,
    pasosListo, completarPaso,
    todosListos, resumen, diagnostico,
    calcular, recalcular,
    recetaActiva,
  } = useNegocio()

  const { toast, show: showToast } = useToast()
  const [statusMsg, setStatusMsg] = useState('')
  const [margenCustom, setMargenCustom] = useState(false)

  async function handleCalcular() {
    const res = await calcular()
    if (!res?.ok) showToast(res?.error, 'error')
  }

  async function handleGuardarConfig() {
    const res = await calcular()
    if (res?.ok) {
      setStatusMsg('✓ Configuración guardada')
      setTimeout(() => setStatusMsg(''), 2500)
    } else {
      showToast(res?.error, 'error')
    }
  }

  function handleImprimir() {
    window.print()
  }

  function getTip(r) {
    const margen = Math.round(r.margen_real * 100)
    if (margen < 25)
      return `Tu margen es del ${margen}% — considera subir un poco el precio para que el negocio sea más rentable.`
    if (margen > 60)
      return `Tu margen es del ${margen}% — ¡excelente! Tu producto tiene muy buena rentabilidad.`
    return `Tu margen es del ${margen}% — un margen saludable y competitivo para repostería.`
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>💰 ¿Cuánto gano?</h1>
        <p className={styles.subtitle}>
          Responde 3 preguntas rápidas y te decimos exactamente cuánto cobrar y cuánto ganarás.
        </p>
      </div>

      <div className={styles.recetaSelector}>
        <label className={styles.recetaSelectorLabel}>
          ¿De qué receta quieres saber?
        </label>
        <select
          className={styles.select}
          value={config.recetaId}
          onChange={e => setField('recetaId', e.target.value)}
        >
          <option value="">{loading ? 'Cargando recetas...' : 'Elige una receta'}</option>
          {recetas.map(r => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </select>
      </div>

      {diagnostico && (
        <div className={styles.consejo} style={{ marginBottom: 20 }}>
          <span className={styles.consejoIcon}>{diagnostico.requiere_revision ? '⚠️' : 'ℹ️'}</span>
          <div>
            <div className={styles.consejoTitle}>
              {diagnostico.requiere_revision ? 'Esta receta requiere revisión' : 'Configuración de receta detectada'}
            </div>
            <div className={styles.consejoTexto}>
              Esta receta rinde <strong>{diagnostico.porciones} porciones</strong> y está configurada con
              <strong> {diagnostico.unidades_producidas} unidades producidas</strong>.
              {' '}En esta pantalla conservaremos las porciones actuales y solo ajustaremos las unidades vendibles.
            </div>
          </div>
        </div>
      )}

      <div className={styles.steps}>
        <div className={`${styles.step} ${pasoActual === 0 ? styles.active : ''} ${pasosListo[0] ? styles.done : ''}`}>
          <div className={styles.stepHeader} onClick={() => togglePaso(0)}>
            <div className={styles.stepNum}>{pasosListo[0] ? '✓' : '1'}</div>
            <div className={styles.stepInfo}>
              <div className={styles.stepTitle}>¿Cuánto vendes por lote?</div>
              <div className={styles.stepSummary}>
                {pasosListo[0]
                  ? `${config.unidades} unidades vendibles · ${config.horas}h ${config.minutos}min`
                  : 'Unidades vendibles y tiempo del lote'}
              </div>
            </div>
            <span className={styles.stepArrow}>▶</span>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Cuántas unidades vendibles produces por lote?</div>
              <div className={styles.fieldHint}>
                Si la receta rinde 12 porciones pero vendes 1 pastel completo, aquí pondrías 1.
              </div>
              <input
                className={styles.input}
                type="number" min="1"
                value={config.unidades}
                onChange={e => setField('unidades', e.target.value)}
                placeholder="50"
              />
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Cuánto tiempo tardas en hacerlas?</div>
              <div className={styles.fieldHint}>Desde que empiezas hasta que terminas — incluyendo hornear y decorar.</div>
              <div className={styles.inputRow}>
                <div>
                  <input
                    className={styles.input}
                    type="number" min="0"
                    value={config.horas}
                    onChange={e => setField('horas', e.target.value)}
                    placeholder="1"
                  />
                  <div className={styles.inputSubLabel}>horas</div>
                </div>
                <div>
                  <input
                    className={styles.input}
                    type="number" min="0" max="59"
                    value={config.minutos}
                    onChange={e => setField('minutos', e.target.value)}
                    placeholder="30"
                  />
                  <div className={styles.inputSubLabel}>minutos</div>
                </div>
              </div>
            </div>
            <button className={styles.btnNext} onClick={() => completarPaso(0)}>
              Siguiente →
            </button>
          </div>
        </div>

        <div className={`${styles.step} ${pasoActual === 1 ? styles.active : ''} ${pasosListo[1] ? styles.done : ''}`}>
          <div className={styles.stepHeader} onClick={() => togglePaso(1)}>
            <div className={styles.stepNum}>{pasosListo[1] ? '✓' : '2'}</div>
            <div className={styles.stepInfo}>
              <div className={styles.stepTitle}>¿Tienes costos extra?</div>
              <div className={styles.stepSummary}>
                {pasosListo[1]
                  ? `Empaque $${config.empaque} · Transporte $${config.transporte}`
                  : 'Empaque, transporte y ayudante'}
              </div>
            </div>
            <span className={styles.stepArrow}>▶</span>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Cuánto gastas en empaque por unidad vendible?</div>
              <div className={styles.fieldHint}>Caja, bolsita, etiqueta... Si no usas nada, deja en 0.</div>
              <input
                className={styles.input}
                type="number" min="0" step="0.01"
                value={config.empaque}
                onChange={e => setField('empaque', e.target.value)}
                placeholder="0.50"
              />
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Gastas en transporte por entrega?</div>
              <div className={styles.fieldHint}>Gasolina o envío por cada lote. Si no aplica, deja en 0.</div>
              <input
                className={styles.input}
                type="number" min="0" step="0.01"
                value={config.transporte}
                onChange={e => setField('transporte', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Alguien te ayuda en esta receta?</div>
              <div className={styles.fieldHint}>Si tienes ayudante, incluiremos su pago en el costo.</div>
              <div
                className={`${styles.toggleWrap} ${config.hayAyudante ? styles.on : ''}`}
                onClick={() => setField('hayAyudante', !config.hayAyudante)}
              >
                <div className={`${styles.toggle} ${config.hayAyudante ? styles.on : ''}`} />
                <div>
                  <div className={styles.toggleLabel}>
                    {config.hayAyudante ? 'Sí, tengo ayudante' : 'No, trabajo solo'}
                  </div>
                  <div className={styles.toggleSublabel}>
                    {config.hayAyudante ? 'Su pago se incluirá en el costo' : 'Toca para activar'}
                  </div>
                </div>
              </div>
              {config.hayAyudante && (
                <div className={styles.empleadoSelect}>
                  <select
                    className={styles.input}
                    value={config.empleadoId}
                    onChange={e => setField('empleadoId', e.target.value)}
                  >
                    <option value="">Selecciona a tu ayudante</option>
                    {empleados.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.nombre} — {money(e.salario_hora)}/hora
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button className={styles.btnNext} onClick={() => completarPaso(1)}>
              Siguiente →
            </button>
          </div>
        </div>

        <div className={`${styles.step} ${pasoActual === 2 ? styles.active : ''} ${pasosListo[2] ? styles.done : ''}`}>
          <div className={styles.stepHeader} onClick={() => togglePaso(2)}>
            <div className={styles.stepNum}>{pasosListo[2] ? '✓' : '3'}</div>
            <div className={styles.stepInfo}>
              <div className={styles.stepTitle}>¿Cuánto quieres ganar?</div>
              <div className={styles.stepSummary}>
                {pasosListo[2] ? `Ganancia del ${config.margen}%` : 'Tu porcentaje de ganancia'}
              </div>
            </div>
            <span className={styles.stepArrow}>▶</span>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Qué porcentaje de ganancia quieres?</div>
              <div className={styles.fieldHint}>
                <strong>20%</strong> — justo para empezar &nbsp;·&nbsp;
                <strong>30%</strong> — lo más común en repostería &nbsp;·&nbsp;
                <strong>50%</strong> — para productos premium
              </div>
              <div className={styles.margenOpts}>
                {MARGENES.map(m => (
                  <button
                    key={m.val}
                    type="button"
                    className={`${styles.margenOpt} ${config.margen === m.val && !margenCustom ? styles.active : ''}`}
                    onClick={() => { setField('margen', m.val); setMargenCustom(false) }}
                  >
                    {m.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`${styles.margenOpt} ${margenCustom ? styles.active : ''}`}
                  onClick={() => setMargenCustom(true)}
                >
                  Otro %
                </button>
              </div>
              {margenCustom && (
                <input
                  className={styles.input}
                  type="number" min="0" max="1000"
                  value={config.margen}
                  onChange={e => setField('margen', e.target.value)}
                  placeholder="Ej: 40"
                  autoFocus
                />
              )}
            </div>
            <button className={styles.btnNext} onClick={() => completarPaso(2)}>
              ¡Listo! Ver resultados →
            </button>
          </div>
        </div>
      </div>

      <button
        className={styles.btnCalcular}
        onClick={handleCalcular}
        disabled={!config.recetaId || !todosListos || calculando}
      >
        {calculando ? 'Calculando...' : 'Ver cuánto gano 💰'}
      </button>

      {statusMsg && <div className={styles.tip}>{statusMsg}</div>}

      {resumen && (
        <div className={styles.resultados}>
          <div className={styles.resultadoTitle}>
            Resultados: {recetaActiva?.nombre}
          </div>

          <div className={styles.numerosTop}>
            <div className={`${styles.numeroCard} ${styles.destacado}`}>
              <div className={styles.numeroLabel}>Véndela a</div>
              <div className={styles.numeroValor}>{money(resumen.precio_unitario)}</div>
              <div className={styles.numeroSub}>precio sugerido por unidad vendible</div>
            </div>
            <div className={`${styles.numeroCard} ${styles.ganancia}`}>
              <div className={styles.numeroLabel}>Ganas por unidad</div>
              <div className={styles.numeroValor}>{money(resumen.ganancia_unit)}</div>
              <div className={styles.numeroSub}>de ganancia por cada una que vendas</div>
            </div>
            <div className={styles.numeroCard}>
              <div className={styles.numeroLabel}>Ganas por lote</div>
              <div className={styles.numeroValor}>{money(resumen.ganancia_lote)}</div>
              <div className={styles.numeroSub}>en {resumen.unidades} unidades</div>
            </div>
            <div className={styles.numeroCard}>
              <div className={styles.numeroLabel}>Te cuesta hacer una</div>
              <div className={styles.numeroValor}>{money(resumen.costo_unitario, 4)}</div>
              <div className={styles.numeroSub}>costo real por unidad vendible</div>
            </div>
          </div>

          <div className={styles.consejo}>
            <span className={styles.consejoIcon}>💡</span>
            <div className={styles.consejoTitle}>
              Vende cada unidad a {money(resumen.precio_unitario)}
            </div>
            <div className={styles.consejoTexto}>
              Si produces <strong>{resumen.unidades} unidades</strong> y las vendes a ese precio,
              cobrarías <strong>{money(resumen.precio_lote)}</strong> en total por ese lote.
              <br /><br />
              {getTip(resumen)}
            </div>
          </div>

          <div className={styles.desglose}>
            <div className={styles.desgloseTitle}>¿De dónde sale ese costo?</div>
            <div className={styles.desgloseRow}>
              <span className={styles.desgloseLabel}>🧁 Ingredientes</span>
              <span className={styles.desgloseValor}>{money(resumen.costo_ingredientes)}</span>
            </div>
            {resumen.costo_mano_obra > 0 && (
              <div className={styles.desgloseRow}>
                <span className={styles.desgloseLabel}>👩‍🍳 Mano de obra</span>
                <span className={styles.desgloseValor}>{money(resumen.costo_mano_obra)}</span>
              </div>
            )}
            {resumen.costo_empaque > 0 && (
              <div className={styles.desgloseRow}>
                <span className={styles.desgloseLabel}>📦 Empaque</span>
                <span className={styles.desgloseValor}>{money(resumen.costo_empaque)}</span>
              </div>
            )}
            {resumen.costo_transporte > 0 && (
              <div className={styles.desgloseRow}>
                <span className={styles.desgloseLabel}>🚚 Transporte</span>
                <span className={styles.desgloseValor}>{money(resumen.costo_transporte)}</span>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={handleGuardarConfig}>
              Guardar configuración
            </button>
            <button className={styles.btnPrint} onClick={handleImprimir}>
              Imprimir cotización
            </button>
            <button className={styles.btnGhost} onClick={recalcular}>
              Recalcular
            </button>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </main>
  )
}
