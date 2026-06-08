import { useState, useRef, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState({ msg: '', type: '', visible: false })
  const timerRef = useRef(null)

  const show = useCallback((msg, type = 'ok') => {
    clearTimeout(timerRef.current)
    setToast({ msg, type, visible: true })
    timerRef.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      2800
    )
  }, [])

  return { toast, show }
}
