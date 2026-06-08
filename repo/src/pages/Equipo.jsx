import { useEmpleados } from '../hooks/useEmpleados'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import styles from '../styles/Equipo.module.css'

const money = (v) =>
  Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Equipo() {
  const {
    lista, loading, error,
    form, setField,
    esFormValido, guardar,
    stats,
  } = useEmpleados()

  const { toast, show: showToast } = useToast()

  async function handleGuardar() {
    const res = await guardar()
    if (res?.ok)    showToast(`✓ "${res.nombre}" agregado al equipo`)
    else            showToast(res?.error, 'error')
  }

  return (
    <main className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>👩‍🍳 Mi equipo</h1>
        <p className={styles.subtitle}>
          Registra a las personas que te ayudan para incluir su pago
          en el costo de tus recetas.
        </p>
      </div>

      {/* STATS */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{stats.total}</div>
          <div className={styles.statLabel}>personas registradas</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{stats.activos}</div>
          <div className={styles.statLabel}>activos ahora</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>${stats.avgHora}</div>
          <div className={styles.statLabel}>salario promedio / hora</div>
        </div>
      </div>

      <div className={styles.grid}>

        {/* ── FORMULARIO ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Agregar persona</div>
          <div className={styles.cardSub}>
            El salario por hora se calcula automáticamente.
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldQuestion}>¿Cómo se llama?</div>
            <input
              className={styles.input}
              value={form.nombre}
              onChange={e => setField('nombre', e.target.value)}
              placeholder="Ej: María López"
              autoComplete="off"
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldQuestion}>¿Cuánto le pagas?</div>
            <div className={styles.fieldHint}>
              Escribe el pago diario y cuántas horas trabaja ese día.
            </div>
            <div className={styles.inputRow}>
              <div>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pagoDiario}
                  onChange={e => setField('pagoDiario', e.target.value)}
                  placeholder="Pago diario $"
                />
              </div>
              <div>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={form.horasDia}
                  onChange={e => setField('horasDia', e.target.value)}
                  placeholder="Horas por día"
                />
              </div>
            </div>
          </div>

          {/* Preview salario por hora */}
          {parseFloat(form.pagoDiario) > 0 && parseFloat(form.horasDia) > 0 && (
            <div className={styles.tip} style={{ marginTop: 0, marginBottom: 14 }}>
              Su salario por hora sería{' '}
              <strong>
                ${money(parseFloat(form.pagoDiario) / parseFloat(form.horasDia))}
              </strong>
            </div>
          )}

          <div className={styles.fieldGroup}>
            <div className={styles.fieldQuestion}>¿Está activo ahora?</div>
            <div className={styles.fieldHint}>
              Solo los activos aparecen al calcular costos de recetas.
            </div>
            <div
              className={`${styles.toggleWrap} ${form.activo ? styles.on : ''}`}
              onClick={() => setField('activo', !form.activo)}
            >
              <div className={`${styles.toggle} ${form.activo ? styles.on : ''}`} />
              <div>
                <div className={styles.toggleLabel}>
                  {form.activo ? 'Sí, está activo' : 'No, está inactivo'}
                </div>
                <div className={styles.toggleSublabel}>
                  {form.activo ? 'Aparecerá en recetas' : 'No aparecerá en recetas'}
                </div>
              </div>
            </div>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleGuardar}
            disabled={!esFormValido || loading}
          >
            {loading ? 'Guardando...' : 'Agregar al equipo'}
          </button>
        </div>

        {/* ── LISTA ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Mi equipo</div>
          <div className={styles.cardSub}>
            El salario/hora se usa para calcular la mano de obra en tus recetas.
          </div>

          {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

          <div className={styles.empList}>
            {loading && lista.length === 0 ? (
              <div className={styles.stateRow}>
                <span className={styles.stateIcon}>⏳</span>
                Cargando tu equipo...
              </div>
            ) : lista.length === 0 ? (
              <div className={styles.stateRow}>
                <span className={styles.stateIcon}>👤</span>
                Aún no tienes nadie registrado.<br />
                ¡Agrega a la primera persona con el formulario!
              </div>
            ) : (
              lista.map((emp, idx) => {
                const ini = emp.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

                return (
                  <div
                    key={emp.id}
                    className={styles.empCard}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className={styles.empAvatar}>{ini}</div>
                    <div className={styles.empInfo}>
                      <div className={styles.empNombre}>{emp.nombre}</div>
                      <div className={styles.empDetalle}>
                        ${money(emp.pago_diario)} / día · {emp.horas_dia} horas
                      </div>
                    </div>
                    <div className={styles.empSalario}>
                      <div className={styles.empSalarioValor}>
                        ${money(emp.salario_hora)}
                      </div>
                      <div className={styles.empSalarioLabel}>por hora</div>
                    </div>
                    <span className={emp.activo ? styles.badgeActivo : styles.badgeInactivo}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {lista.length > 0 && (
            <div className={styles.tip}>
              💡 Para usar el costo de mano de obra en una receta, ve a{' '}
              <strong>¿Cuánto gano?</strong> y selecciona a esta persona.
            </div>
          )}
        </div>

      </div>

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </main>
  )
}
