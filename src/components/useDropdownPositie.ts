import { useEffect, useRef, useState } from 'react'

interface DropdownPositie {
  left: number
  top?: number
  bottom?: number
}

/** Onder een knop is pas als er redelijkerwijs een menu in past — anders altijd omhoog klappen. */
const MIN_RUIMTE_ONDER = 220

/**
 * Gedeelde open/sluit- en positioneringslogica voor een knop die een
 * dropdown-menu opent via een portal (VerantwoordelijkeSelect, UitstelKnop).
 * Sluit bij klik buiten trigger/menu of bij Escape. Klapt automatisch omhoog
 * i.p.v. omlaag als de knop onderin de viewport zit — anders valt het menu
 * buiten beeld en is het (bij een `position: fixed`-menu) ook niet meer te
 * bereiken door te scrollen.
 */
export function useDropdownPositie() {
  const [open, setOpen] = useState(false)
  const [positie, setPositie] = useState<DropdownPositie>({ left: 0, top: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function toggleOpen() {
    if (open) {
      setOpen(false)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const ruimteOnder = window.innerHeight - rect.bottom
      if (ruimteOnder < MIN_RUIMTE_ONDER && rect.top > MIN_RUIMTE_ONDER) {
        setPositie({ left: rect.left, bottom: window.innerHeight - rect.top + 4 })
      } else {
        setPositie({ left: rect.left, top: rect.bottom + 4 })
      }
    }
    setOpen(true)
  }

  return { open, positie, triggerRef, menuRef, toggleOpen, setOpen }
}
