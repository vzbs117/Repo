import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from '../styles/Home.module.css'

import { API_BASE_URL as API } from '../config/api'

const SECCIONES = [
  {
    to:    '/ingredientes',
    icon:  '🥚',
    title: 'Mis ingredientes',
    desc:  'Guarda lo que compras y calcula cuánto te cuesta cada gramo, mililitro o pieza.',
    color: styles.cardAmber,
  },
  {
    to:    '/recetas',
    icon:  '📋',
    title: 'Mis recetas',
    desc:  'Crea tus recetas, agrégales ingredientes y ve cuánto cuesta hacerlas.',
    color: styles.cardTeal,
  },
  {
    to:    '/equipo',
    icon:  '👩‍🍳',
    title: 'Mi equipo',
    desc:  'Registra a quienes te ayudan para incluir su pago dentro del costo de tus productos.',
    color: styles.cardBlue,
  },
  {
    to:    '/negocio',
    icon:  '💰',
    title: '¿Cuánto gano?',
    desc:  'Calcula el precio ideal de venta y mira cuánto ganas por pieza o por lote.',
    color: styles.cardGreen,
  },
]

function getTip(ni, nr, ne) {
  if (ni === 0)
    return '👋 ¡Bienvenido! Empieza por guardar tus ingredientes para calcular costos reales desde el inicio.'
  if (nr === 0)
    return 'Ya tienes ingredientes guardados. El siguiente paso es crear tu primera receta.'
  if (ne === 0)
    return 'Si alguien te ayuda en la cocina, agrégalo en "Mi equipo" para incluir su pago en tus costos.'
  return '¡Todo listo! Ve a "¿Cuánto gano?" para calcular tu precio de venta y tu ganancia.'
}

export default function Home() {
  const [stats, setStats] = useState({ ingredientes: '—', recetas: '—', equipo: '—' })
  const [tip,   setTip]   = useState('Conectando con tu información...')

  useEffect(() => {
    async function cargar() {
      try {
        const [ings, recs, emps] = await Promise.all([
          fetch(`${API}/ingredientes`).then(r => r.json()).catch(() => []),
          fetch(`${API}/recetas`).then(r => r.json()).catch(() => []),
          fetch(`${API}/empleados`).then(r => r.json()).catch(() => []),
        ])
        const ni = Array.isArray(ings) ? ings.length : 0
        const nr = Array.isArray(recs) ? recs.length : 0
        const ne = Array.isArray(emps) ? emps.length : 0
        setStats({ ingredientes: ni, recetas: nr, equipo: ne })
        setTip(getTip(ni, nr, ne))
      } catch {
        setStats({ ingredientes: '—', recetas: '—', equipo: '—' })
        setTip('⚠️ No se pudo cargar la información. Verifica que el backend esté encendido e inténtalo de nuevo.')
      }
    }
    cargar()
  }, [])

  return (
    <main className={styles.page}>

      <div className={styles.greeting}>
        <span className={styles.emoji}>👋</span>
        <h1 className={styles.title}>¡Hola! ¿Qué vas a hacer hoy?</h1>
        <p className={styles.subtitle}>
          Elige una sección para empezar. La idea es que todo sea claro, rápido y fácil de usar.
        </p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{stats.ingredientes}</div>
          <div className={styles.statLabel}>ingredientes guardados</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{stats.recetas}</div>
          <div className={styles.statLabel}>recetas creadas</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{stats.equipo}</div>
          <div className={styles.statLabel}>personas en el equipo</div>
        </div>
      </div>

      <div className={styles.cards}>
        {SECCIONES.map((s, i) => (
          <Link
            key={s.to}
            to={s.to}
            className={`${styles.card} ${s.color}`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className={styles.cardIcon}>{s.icon}</span>
            <p className={styles.cardTitle}>{s.title}</p>
            <p className={styles.cardDesc}>{s.desc}</p>
            <span className={styles.cardAction}>Entrar →</span>
          </Link>
        ))}
      </div>

      <div className={styles.tip}>
        <span className={styles.tipIcon}>💡</span>
        <span>{tip}</span>
      </div>

    </main>
  )
}
