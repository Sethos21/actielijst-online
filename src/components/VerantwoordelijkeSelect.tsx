import { createPortal } from 'react-dom'
import { initialen, teamlidKleurKlasse } from '../features/team/teamlidKleur'
import { useDropdownPositie } from './useDropdownPositie'

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
  const { open, positie, triggerRef, menuRef, toggleOpen } = useDropdownPositie()

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
            className="dropdown-menu"
            role="menu"
            style={{ top: positie.top, bottom: positie.bottom, left: positie.left }}
          >
            {alleNamen.map((naam) => (
              <label key={naam} className="dropdown-optie">
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
