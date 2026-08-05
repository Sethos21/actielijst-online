import type { Mutatie } from './types'

interface Props {
  mutatie: Mutatie
  onBewerken: () => void
}

/** Klik om te bewerken — vervangt zichzelf dan door MutatieForm. */
export function MutatieKaart({ mutatie, onBewerken }: Props) {
  return (
    <button
      type="button"
      className={`hm-card hm-card-klik ${mutatie.richting}`}
      onClick={onBewerken}
    >
      <span className="hm-name">{mutatie.naam}</span>
      {mutatie.locatie && <span className="hm-loc">{mutatie.locatie}</span>}
      {mutatie.administratie && <span className="hm-admin">{mutatie.administratie}</span>}
      {mutatie.opmerking && <span className="hm-opmerking">{mutatie.opmerking}</span>}
    </button>
  )
}
