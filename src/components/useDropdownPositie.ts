import { useEffect, useRef, useState } from 'react'

/**
 * Gedeelde open/sluit- en positioneringslogica voor een knop die een
 * dropdown-menu opent via een portal (VerantwoordelijkeSelect, UitstelKnop).
 * Sluit bij klik buiten trigger/menu of bij Escape.
 */
export function useDropdownPositie() {
  const [open, setOpen] = useState(false)
  const [positie, setPositie] = useState({ top: 0, left: 0 })
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
    if (rect) setPositie({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }

  return { open, positie, triggerRef, menuRef, toggleOpen, setOpen }
}
