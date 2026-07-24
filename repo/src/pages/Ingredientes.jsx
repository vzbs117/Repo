import { useState } from 'react'
import { useIngredientes } from '../hooks/useIngredientes'
import MedidaChips from '../components/MedidaChips'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import styles from '../styles/Ingredientes.module.css'

const MEDIDA_LABEL = {
  g: 'gramos', kg: 'kilogramos', oz: 'onzas', lb: 'libras',
  ml: 'mililitros', l: 'litros', tsp: 'cucharaditas',
  tbsp: 'cucharadas', cup: 'tazas', fl_oz: 'onzas fluidas', pz: 'piezas',
}

export default function Ingredientes() {
  const {
    lista, loading, error,
    form, setField, limpiarForm, iniciarEdicion,
    editandoId, esFormValido,
    guardar,
    preview,
  } = useIngredientes()

  const { toast, show: showToast } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)

  const listaFiltrada = lista.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function handleGuardar() {
    setGuardando(true)
    const res = await guardar()
    setGuardando(false)
    if (res?.ok) {
      showToast(
        res.editando ? `✓ "${res.nombre}" actualizado` : `✓ "${res.nombre}" guardado`
      )
    } else if (res?.error) {
      showToast(res.error, 'error')
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.sidebar}>
          <div className={styles.header}>
            <h1 className={styles.title}>🥚 Mis ingredientes</h1>
            <p className={styles.subtitle}>
              Aquí guardas todo lo que compras para tus recetas.<br />
              Solo dinos el nombre, cuánto pagaste y cuánto compraste.
            </p>
          </div>

          <div className={`${styles.formCard} ${editandoId ? styles.editando : ''}`}>
            <div className={styles.formHead}>
              <span className={styles.formTitle}>
                {editandoId ? `Editando: ${form.nombre}` : 'Agregar ingrediente'}
              </span>
              {editandoId && (
                <button className={styles.btnGhost} onClick={limpiarForm}>
                  Cancelar
                </button>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Cómo se llama este ingrediente?</div>
              <div className={styles.fieldHint}>Ejemplo: Harina de trigo, Mantequilla, Huevos...</div>
              <input
                className={styles.input}
                value={form.nombre}
                onChange={e => setField('nombre', e.target.value)}
                placeholder="Escribe el nombre aquí"
                autoComplete="off"
              />
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿Cuánto pagaste y cuánto compraste?</div>
              <div className={styles.fieldHint}>Ejemplo: pagué $45 por 1 kilogramo de harina</div>
              <div className={styles.inputRow}>
                <div>
                  <label className={styles.inputLabel}>Pagué ($)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costo}
                    onChange={e => setField('costo', e.target.value)}
                    placeholder="45.00"
                  />
                </div>
                <div>
                  <label className={styles.inputLabel}>Cantidad</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.cantidad}
                    onChange={e => setField('cantidad', e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldQuestion}>¿En qué medida lo compraste?</div>
              <MedidaChips value={form.unidad} onChange={val => setField('unidad', val)} variant="compra" />
            </div>

            {preview && (
              <div className={styles.preview}>
                Cada <strong>{preview.unidad}</strong> de este ingrediente
                te cuesta aproximadamente <strong>${preview.costo}</strong>
              </div>
            )}

            <button
              className={styles.btnSave}
              onClick={handleGuardar}
              disabled={!esFormValido || guardando}
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar ingrediente'}
            </button>
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>Lo que tienes guardado</span>
            <span className={styles.listCount}>
              {lista.length === 0 ? 'Aún no tienes ninguno' : `${lista.length} guardados`}
            </span>
          </div>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar un ingrediente..."
            />
          </div>

          {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

          <div className={styles.ingList}>
            {loading && lista.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>⏳</span>
                Cargando tus ingredientes...
              </div>
            ) : listaFiltrada.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>
                  {lista.length === 0 ? '🛒' : '🔍'}
                </span>
                {lista.length === 0
                  ? 'Todavía no tienes ingredientes.\n¡Agrega el primero usando el formulario de arriba!'
                  : 'No encontré ningún ingrediente con ese nombre.'}
              </div>
            ) : (
              listaFiltrada.map((ing, idx) => {
                const ini = ing.nombre.substring(0, 2).toUpperCase()
                const medida = MEDIDA_LABEL[ing.unidad_base] || ing.unidad_base
                const costo = Number(ing.costo_unitario || 0)
                const dec = ing.unidad_base === 'pz' ? 2 : 4

                return (
                  <div
                    key={ing.id}
                    className={styles.ingCard}
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    <div className={styles.ingAvatar}>{ini}</div>
                    <div className={styles.ingInfo}>
                      <div className={styles.ingNombre}>{ing.nombre}</div>
                      <div className={styles.ingDetalle}>
                        Compraste {ing.cantidad_compra_base} {ing.unidad_base}
                        {' '}por ${Number(ing.costo_compra).toFixed(2)}
                      </div>
                    </div>
                    <div className={styles.ingCosto}>
                      <div className={styles.ingCostoValor}>${costo.toFixed(dec)}</div>
                      <div className={styles.ingCostoLabel}>
                        por {medida.slice(0, -1) || ing.unidad_base}
                      </div>
                    </div>
                    <div className={styles.ingActions}>
                      <button
                        className={styles.btnIcon}
                        title="Editar"
                        onClick={() => iniciarEdicion(ing)}
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className={styles.emptyState}>
            La eliminación de ingredientes desde la interfaz está desactivada mientras el backend no exponga ese endpoint.
          </div>
        </section>
      </div>

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </main>
  )
}
