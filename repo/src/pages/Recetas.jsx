import { useEffect, useState } from 'react'
import { useRecetas } from '../hooks/useRecetas'
import MedidaChips from '../components/MedidaChips'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import styles from '../styles/Recetas.module.css'

const MEDIDA_LABEL = {
  g: 'gramos', kg: 'kilogramos', oz: 'onzas', lb: 'libras',
  ml: 'mililitros', l: 'litros', tsp: 'cucharadita',
  tbsp: 'cucharada', cup: 'taza', fl_oz: 'onza fluida',
  pz: 'piezas', pizca: 'pizca',
}

const normalizarTexto = valor =>
  valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const compararPorNombre = (a, b) =>
  a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })

export default function Recetas() {
  const {
    recetas, ingredientes, loading, loadingDetalle,
    recetaActiva, recetaActivaId, recetaActivaInconsistente,
    detalle, costo, diagnostico,
    formReceta, setFormReceta,
    formItem, setFormItem,
    esItemValido,
    ingredienteSeleccionado,
    unidadesDisponiblesItem,
    ayudaMedidas,
    seleccionarReceta,
    crearReceta, eliminarReceta,
    agregarItem, eliminarItem,
  } = useRecetas()

  const { toast, show: showToast } = useToast()
  const [busquedaIngrediente, setBusquedaIngrediente] = useState('')

  useEffect(() => {
    setBusquedaIngrediente(ingredienteSeleccionado?.nombre ?? '')
  }, [ingredienteSeleccionado])

  const terminoIngrediente = normalizarTexto(busquedaIngrediente.trim())
  const ingredientesOrdenados = [...ingredientes].sort(compararPorNombre)
  const ingredientesFiltrados = ingredientesOrdenados.filter(i =>
    normalizarTexto(i.nombre).includes(terminoIngrediente)
  )
  const ingredientesSugeridos = terminoIngrediente
    ? ingredientesFiltrados
    : ingredientesOrdenados.slice(0, 8)

  function handleBusquedaIngrediente(valor) {
    setBusquedaIngrediente(valor)
    if (!ingredienteSeleccionado) return
    if (normalizarTexto(valor.trim()) === normalizarTexto(ingredienteSeleccionado.nombre)) return
    setFormItem(p => ({ ...p, ingredienteId: '', unidad: null }))
  }

  function handleSeleccionarIngrediente(ingrediente) {
    setBusquedaIngrediente(ingrediente.nombre)
    setFormItem(p => ({ ...p, ingredienteId: ingrediente.id, unidad: null }))
  }

  async function handleCrearReceta() {
    const res = await crearReceta()
    if (res?.ok) showToast(`✓ "${res.nombre}" creada`)
    else showToast(res?.error, 'error')
  }

  async function handleEliminarReceta() {
    if (!recetaActiva) return
    if (!confirm(`¿Eliminar "${recetaActiva.nombre}"?\nTambién se borrarán todos sus ingredientes.`)) return
    const res = await eliminarReceta(recetaActiva.id, recetaActiva.nombre)
    if (res?.ok) showToast(`🗑️ "${res.nombre}" eliminada`)
    else showToast(res?.error, 'error')
  }

  async function handleAgregarItem() {
    const res = await agregarItem()
    if (res?.ok) showToast('✓ Ingrediente agregado')
    else showToast(res?.error, 'error')
  }

  async function handleEliminarItem(itemId) {
    if (!confirm('¿Quitar este ingrediente de la receta?')) return
    const res = await eliminarItem(itemId)
    if (!res?.ok) showToast(res?.error, 'error')
  }

  function costoItem(item) {
    const ing = ingredientes.find(i => i.id === item.ingrediente.id)
    return ((ing?.costo_unitario ?? 0) * item.cantidad_usada_base).toFixed(2)
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>📋 Mis recetas</h1>
        <p className={styles.subtitle}>
          Crea tus recetas, agrega ingredientes y calcula cuánto cuesta prepararlas.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.panelLeft}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Nueva receta</div>
            <div className={styles.cardSub}>Ponle un nombre y define cuántas porciones rinde este lote.</div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Cómo se llama esta receta?</div>
              <input
                className={styles.input}
                value={formReceta.nombre}
                onChange={e => setFormReceta(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Cupcakes de chocolate"
                autoComplete="off"
              />
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Cuántas porciones rinde este lote?</div>
              <div className={styles.fieldHint}>Después podrás definir por separado cuántas unidades vendibles produces.</div>
              <input
                className={styles.input}
                type="number"
                min="1"
                inputMode="numeric"
                value={formReceta.porciones}
                onChange={e => setFormReceta(p => ({ ...p, porciones: e.target.value }))}
              />
            </div>

            <button
              className={styles.btnPrimary}
              onClick={handleCrearReceta}
              disabled={!formReceta.nombre.trim() || loading}
            >
              {loading ? 'Creando...' : 'Crear receta'}
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <div className={styles.cardTitle}>Mis recetas</div>
                <div style={{ fontSize: 12, color: 'var(--hint)', marginTop: 2 }}>
                  Elige una para ver su detalle
                </div>
              </div>
            </div>

            <div className={styles.recetaList}>
              {loading && recetas.length === 0 ? (
                <div className={styles.stateRow}>Cargando recetas...</div>
              ) : recetas.length === 0 ? (
                <div className={styles.stateRow}>
                  Todavía no has creado recetas.<br />Empieza con la primera arriba.
                </div>
              ) : (
                recetas.map(r => {
                  const inconsistente = r.id === recetaActivaInconsistente?.receta_id
                  return (
                    <div
                      key={r.id}
                      className={`${styles.recetaItem} ${r.id === recetaActivaId ? styles.active : ''}`}
                      onClick={() => seleccionarReceta(r.id)}
                    >
                      <div>
                        <div className={styles.recetaItemName}>{r.nombre}</div>
                        <div className={styles.recetaItemSub}>
                          {r.porciones} porciones{inconsistente ? ' · requiere revisión' : ''}
                        </div>
                      </div>
                      <span className={styles.recetaItemArrow}>▶</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {recetaActivaId && (
            <div className={`${styles.card} ${styles.accentBorder}`}>
              <div className={styles.cardTitle}>Agregar ingrediente</div>
              <div className={styles.cardSub}>Selecciona los ingredientes que usas en esta receta.</div>

              <div className={styles.recetaBanner}>
                <div className={styles.recetaBannerLabel}>Agregando a</div>
                <div className={styles.recetaBannerNombre}>{recetaActiva?.nombre}</div>
                <div className={styles.recetaBannerSub}>{recetaActiva?.porciones} porciones</div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldQuestion}>¿Qué ingrediente vas a usar?</div>
                <input
                  className={styles.input}
                  value={busquedaIngrediente}
                  onChange={e => handleBusquedaIngrediente(e.target.value)}
                  placeholder="Busca por nombre"
                  autoComplete="off"
                  aria-label="Buscar ingrediente por nombre"
                />
                <div className={styles.searchHint}>
                  {busquedaIngrediente.trim()
                    ? 'Selecciona una opción de la lista filtrada.'
                    : 'Escribe el nombre para encontrarlo más rápido.'}
                </div>
                <div className={styles.searchList}>
                  {ingredientesSugeridos.length > 0 ? (
                    ingredientesSugeridos.map(i => {
                      const activo = String(i.id) === String(formItem.ingredienteId)
                      return (
                        <button
                          key={i.id}
                          type="button"
                          className={`${styles.searchItem} ${activo ? styles.searchItemActive : ''}`}
                          onClick={() => handleSeleccionarIngrediente(i)}
                        >
                          <span>{i.nombre}</span>
                          <span className={styles.searchItemMeta}>{MEDIDA_LABEL[i.unidad_base] ?? i.unidad_base}</span>
                        </button>
                      )
                    })
                  ) : (
                    <div className={styles.searchEmpty}>No encontramos ingredientes con ese nombre.</div>
                  )}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldQuestion}>¿Cuánto vas a usar?</div>
                <div className={styles.fieldHint}>Escribe la cantidad y elige la medida.</div>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.001"
                  inputMode="decimal"
                  value={formItem.cantidad}
                  onChange={e => setFormItem(p => ({ ...p, cantidad: e.target.value }))}
                  placeholder="Ej: 200"
                  style={{ marginBottom: 10 }}
                />
                <MedidaChips
                  value={formItem.unidad}
                  onChange={val => setFormItem(p => ({ ...p, unidad: val }))}
                  variant="receta"
                  allowedUnits={unidadesDisponiblesItem}
                />
                {ingredienteSeleccionado && (
                  <div className={styles.tip} style={{ marginTop: 12 }}>
                    Este ingrediente está configurado en <strong>{ingredienteSeleccionado.unidad_base}</strong>.
                    {ayudaMedidas ? ` ${ayudaMedidas}` : ''}
                  </div>
                )}
              </div>

              <button
                className={styles.btnPrimary}
                onClick={handleAgregarItem}
                disabled={!esItemValido || loading}
              >
                {loading ? 'Agregando...' : 'Agregar a la receta'}
              </button>

              <div className={styles.tip}>
                💡 Puedes usar cucharadita con ingredientes compatibles y pizca para la sal.
              </div>
            </div>
          )}
        </div>

        <div className={styles.panelRight}>
          {!recetaActivaId ? (
            <div className={styles.detalleVacio}>
              <span className={styles.detalleVacioIcon}>👈</span>
              <div className={styles.detalleVacioTitle}>Elige una receta</div>
              <div className={styles.detalleVacioSub}>
                Elige una receta de la lista para ver<br />
                sus ingredientes y su costo total.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.detalleHeader}>
                <div className={styles.detalleHeaderTop}>
                  <div>
                    <div className={styles.detalleNombre}>{recetaActiva?.nombre}</div>
                    <div className={styles.detalleSub}>
                      Rinde {recetaActiva?.porciones} porciones
                    </div>
                  </div>
                  <button className={styles.btnDanger} onClick={handleEliminarReceta}>
                    Eliminar receta
                  </button>
                </div>

                {diagnostico?.requiere_revision && (
                  <div className={styles.tip} style={{ marginBottom: 14 }}>
                    ⚠️ Esta receta requiere revisión: {diagnostico.motivo}. Hoy el lote rinde
                    <strong> {diagnostico.porciones} porciones</strong> pero está configurado para
                    <strong> {diagnostico.unidades_producidas} unidades producidas</strong>.
                  </div>
                )}

                <div className={styles.kpis}>
                  <div className={`${styles.kpi} ${styles.accent}`}>
                    <div className={styles.kpiLabel}>Costo total</div>
                    <div className={styles.kpiVal}>
                      {costo ? `$${Number(costo.total).toFixed(2)}` : '—'}
                    </div>
                  </div>
                  <div className={styles.kpi}>
                    <div className={styles.kpiLabel}>Costo por porción</div>
                    <div className={styles.kpiVal}>
                      {costo ? `$${Number(costo.por_porcion).toFixed(2)}` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.ingListHeader}>
                <span className={styles.ingListLabel}>Ingredientes en esta receta</span>
              </div>

              <div className={styles.ingRecetaList}>
                {loadingDetalle ? (
                  <div className={styles.stateRow}>Cargando detalle de la receta...</div>
                ) : !detalle?.items?.length ? (
                  <div className={styles.stateRow}>
                    Esta receta no tiene ingredientes aún.<br />
                    Agrégalos desde el panel izquierdo.
                  </div>
                ) : (
                  detalle.items.map((item, idx) => {
                    const ini = item.ingrediente.nombre.substring(0, 2).toUpperCase()
                    const medida = MEDIDA_LABEL[item.unidad_original] || item.unidad_original

                    return (
                      <div
                        key={item.id}
                        className={styles.ingRecetaCard}
                        style={{ animationDelay: `${idx * 0.04}s` }}
                      >
                        <div className={styles.ingRecetaAvatar}>{ini}</div>
                        <div className={styles.ingRecetaInfo}>
                          <div className={styles.ingRecetaNombre}>{item.ingrediente.nombre}</div>
                          <div className={styles.ingRecetaUsado}>
                            {item.cantidad_original} {medida}
                          </div>
                        </div>
                        <span className={styles.ingRecetaCosto}>${costoItem(item)}</span>
                        <button
                          className={styles.btnIconSm}
                          title="Quitar ingrediente"
                          aria-label={`Quitar ${item.ingrediente.nombre} de la receta`}
                          onClick={() => handleEliminarItem(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </main>
  )
}
