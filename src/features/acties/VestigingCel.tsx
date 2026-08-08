import { createPortal } from 'react-dom'
import { useDropdownPositie } from '../../components/useDropdownPositie'
import { usePanden } from '../panden/usePanden'
import type { Pand } from '../panden/types'

interface Props {
  klantId: string
  klantNaam: string
  actieOmschrijving: string
  pandId?: string
  vestigingTekst: string
  onKiesPand: (pand: Pand) => void
  onVrijeTekst: (tekst: string) => void
}

export function VestigingCel({
  klantId,
  klantNaam,
  actieOmschrijving,
  pandId,
  vestigingTekst,
  onKiesPand,
  onVrijeTekst,
}: Props) {
  const { panden } = usePanden(klantId)
  const { open, positie, triggerRef, menuRef, toggleOpen, setOpen } = useDropdownPositie()
  const gekoppeldPand = panden.find((p) => p.id === pandId)

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={
          gekoppeldPand
            ? 'vestiging-select'
            : pandId
              ? 'vestiging-leeg'
              : 'vestiging-vrij'
        }
        aria-label={`Vestiging voor ${actieOmschrijving}`}
        aria-expanded={open}
        onClick={toggleOpen}
      >
        {gekoppeldPand ? (
          <>🏠 {gekoppeldPand.naam}</>
        ) : vestigingTekst ? (
          <>
            {vestigingTekst} <span className="badge-vrij">vrije tekst</span>
          </>
        ) : (
          '— klik om een pand te koppelen —'
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="vestiging-dropdown"
            role="menu"
            style={{ top: positie.top, bottom: positie.bottom, left: positie.left }}
          >
            <div className="dropdown-header">Panden — {klantNaam}</div>
            {panden.map((pand) => (
              <button
                type="button"
                key={pand.id}
                className={pand.id === pandId ? 'dropdown-item actief' : 'dropdown-item'}
                onClick={() => {
                  onKiesPand(pand)
                  setOpen(false)
                }}
              >
                🏠 {pand.naam}
              </button>
            ))}
            <div className="dropdown-vrije-tekst">
              <label className="dropdown-vrije-tekst-label">
                Geen passend pand? Vrije tekst:
              </label>
              <input
                aria-label="Vrije tekst voor vestiging"
                defaultValue={vestigingTekst}
                onBlur={(e) => {
                  onVrijeTekst(e.target.value)
                  setOpen(false)
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
