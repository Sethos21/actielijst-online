import { useEffect, useRef, useState } from 'react'
import { formatteerDatumKort } from '../lib/datum'

interface Props {
  actieOmschrijving: string
  waarde: string
  onWijzig: (iso: string) => void
}

/**
 * Toont de invoerdatum in het compacte dd-mm-jj-formaat. Een native
 * <input type="date"> dwingt altijd zijn eigen (langere) datumnotatie af —
 * CSS-trucs om dat te verkorten (transparante tekst + overlay) bleken
 * onbetrouwbaar, dus de input verschijnt nu pas bij het bewerken zelf,
 * niet als permanente weergave.
 */
export function InvoerdatumVeld({ actieOmschrijving, waarde, onWijzig }: Props) {
  const [bewerken, setBewerken] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (bewerken) inputRef.current?.showPicker?.()
  }, [bewerken])

  if (bewerken) {
    return (
      <input
        ref={inputRef}
        aria-label={`Invoerdatum voor ${actieOmschrijving}`}
        type="date"
        autoFocus
        value={waarde}
        onChange={(e) => onWijzig(e.target.value)}
        onBlur={() => setBewerken(false)}
      />
    )
  }

  return (
    <button
      type="button"
      className="invoerdatum-weergave-knop"
      aria-label={`Invoerdatum voor ${actieOmschrijving}`}
      onClick={() => setBewerken(true)}
    >
      {formatteerDatumKort(waarde)}
    </button>
  )
}
