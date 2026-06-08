import styles from '../styles/Toast.module.css'

export default function Toast({ msg, type = 'ok', visible }) {
  return (
    <div className={`${styles.toast} ${visible ? styles.show : ''} ${styles[type] ?? ''}`}>
      {msg}
    </div>
  )
}
