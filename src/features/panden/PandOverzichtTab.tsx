import { useState, type FormEvent } from 'react'
import type { Pand } from './types'

interface Props {
  pand: Pand
  onOpgeslagen: (patch: { naam: string; adres: string }) => void
}

export function PandOverzichtTab({ pand, onOpgeslagen }: Props) {
  const [naam, setNaam] = useState(pand.naam)
  const [adres, setAdres] = useState(pand.adres ?? '')
  const [opgeslagen, setOpgeslagen] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!naam.trim()) return
    onOpgeslagen({ naam: naam.trim(), adres: adres.trim() })
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="pand-overzicht-form">
      <label>
        Naam
        <input
          aria-label="Pandnaam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
        />
      </label>
      <label>
        Adres
        <input
          aria-label="Adres"
          value={adres}
          onChange={(e) => setAdres(e.target.value)}
          placeholder="Straat, huisnummer en plaats"
        />
      </label>
      <button type="submit" className="btn-primary">
        Opslaan
      </button>
      {opgeslagen && <span className="pand-overzicht-opgeslagen">Opgeslagen ✓</span>}
    </form>
  )
}
