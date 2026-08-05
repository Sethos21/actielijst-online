import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { initialen, teamlidKleurKlasse } from '../features/team/teamlidKleur'

interface Props {
  actieOmschrijving: string
  geselecteerd: string[]
  alleNamen: readonly string[]
  onToggle: (naam: string) => void
}

/**
 * Gesloten: compacte avatar-chips van de geselecteerde teamleden (of "—").
 * Open: dropdown met een checkbox per teamlid — meerdere tegelijk selecteerbaar.
 * Het menu rendert via een portal in document.body, zodat het niet wordt
 * afgesneden door de overflow van de tabelcel eromheen.
 */
export function VerantwoordelijkeSelect({
  actieOmschrijving,
  geselecteerd,
  alleNamen,
  onToggle,
}: Props) {
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

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="verantw-select-trigger"
        aria-label={`Verantwoordelijke voor ${actieOmschrijving}`}
        aria-expanded={open}
        onClick={toggleOpen}
      >
        {geselecteerd.length === 0 ? (
          <span className="verantw-select-leeg">—</span>
        ) : (
          geselecteerd.map((naam) => (
            <span
              key={naam}
              className={`avatar-chip avatar-chip-klein ${teamlidKleurKlasse(naam, alleNamen)}`}
            >
              {initialen(naam)}
            </span>
          ))
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="verantw-select-menu"
            role="menu"
            style={{ top: positie.top, left: positie.left }}
          >
            {alleNamen.map((naam) => (
              <label key={naam} className="verantw-select-optie">
                <input
                  type="checkbox"
                  checked={geselecteerd.includes(naam)}
                  onChange={() => onToggle(naam)}
                />
                <span
                  aria-hidden="true"
                  className={`avatar-chip avatar-chip-klein ${teamlidKleurKlasse(naam, alleNamen)}`}
                >
                  {initialen(naam)}
                </span>
                {naam}
              </label>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
