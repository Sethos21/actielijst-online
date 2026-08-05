import { createPortal } from 'react-dom'
import { useDropdownPositie } from './useDropdownPositie'

export interface UitstelOptie {
  label: string
  eenheid: 'w' | 'm'
  aantal: number
}

interface Props {
  actieOmschrijving: string
  opties: UitstelOptie[]
  onKies: (optie: UitstelOptie) => void
}

/** Klok-icoon dat een uitklapmenu met uitstel-opties toont (1 week, 2 weken, ...). */
export function UitstelKnop({ actieOmschrijving, opties, onKies }: Props) {
  const { open, positie, triggerRef, menuRef, toggleOpen, setOpen } = useDropdownPositie()

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="icoon-knop"
        aria-label={`Uitstellen voor ${actieOmschrijving}`}
        aria-expanded={open}
        onClick={toggleOpen}
      >
        🕐
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu"
            role="menu"
            style={{ top: positie.top, bottom: positie.bottom, left: positie.left }}
          >
            {opties.map((optie) => (
              <button
                key={optie.label}
                type="button"
                className="dropdown-optie dropdown-optie-knop"
                onClick={() => {
                  onKies(optie)
                  setOpen(false)
                }}
              >
                {optie.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
