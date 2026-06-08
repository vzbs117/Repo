import { NavLink } from 'react-router-dom'
import styles from '../styles/Topbar.module.css'

export default function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>

        <NavLink to="/" className={styles.brand}>
          <div className={styles.brandIcon}>🍰</div>
          <div>
            <div className={styles.brandName}>Mi Repostería</div>
            <div className={styles.brandTag}>Tu negocio, bajo control</div>
          </div>
        </NavLink>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/ingredientes"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            Ingredientes
          </NavLink>
          <NavLink
            to="/recetas"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            Recetas
          </NavLink>
          <NavLink
            to="/equipo"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            Mi equipo
          </NavLink>
          <NavLink
            to="/negocio"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            ¿Cuánto gano?
          </NavLink>
        </nav>

      </div>
    </header>
  )
}
