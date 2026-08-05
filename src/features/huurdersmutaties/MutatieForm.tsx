import { useState } from 'react'
import { AutocompleteInput } from './AutocompleteInput'
import { getAutocompleteWaarden } from './mutatieLogica'
import type { Mutatie, Richting } from './types'

export interface MutatieVelden {
  naam: string
  locatie: string
  administratie: string
  datum: string | null
  opmerking: string
}

interface Props {
  richting: Richting
  alleMutaties: Mutatie[]
  initieel?: Mutatie
  onOpslaan: (velden: MutatieVelden) => void
  onAnnuleren: () => void
  onVerwijderen?: () => void
}

/** Inline invoerformulier — zowel voor een nieuwe mutatie als voor bewerken. */
export function MutatieForm({
  richting,
  alleMutaties,
  initieel,
  onOpslaan,
  onAnnuleren,
  onVerwijderen,
}: Props) {
  const vandaag = new Date().toISOString().slice(0, 10)
  const [naam, setNaam] = useState(initieel?.naam ?? '')
  const [locatie, setLocatie] = useState(initieel?.locatie ?? '')
  const [administratie, setAdministratie] = useState(initieel?.administratie ?? '')
  const [datum, setDatum] = useState(initieel?.datum ?? vandaag)
  const [opmerking, setOpmerking] = useState(initieel?.opmerking ?? '')

  const locatieSuggesties = getAutocompleteWaarden(alleMutaties, 'locatie')
  const adminSuggesties = getAutocompleteWaarden(alleMutaties, 'administratie')

  function handleOpslaan() {
    if (!naam.trim()) return
    onOpslaan({
      naam: naam.trim(),
      locatie: locatie.trim(),
      administratie: administratie.trim(),
      datum: datum || null,
      opmerking: opmerking.trim(),
    })
  }

  return (
    <div className={`hm-card ${richting}`}>
      <input
        className="hm-field"
        aria-label="Naam huurder"
        placeholder="Naam huurder"
        autoFocus
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
      />
      <AutocompleteInput
        waarde={locatie}
        suggesties={locatieSuggesties}
        placeholder="Locatie"
        ariaLabel="Locatie"
        onChange={setLocatie}
      />
      <AutocompleteInput
        waarde={administratie}
        suggesties={adminSuggesties}
        placeholder="Administratie"
        ariaLabel="Administratie"
        onChange={setAdministratie}
      />
      <input
        className="hm-field"
        aria-label="Datum"
        type="date"
        value={datum ?? ''}
        onChange={(e) => setDatum(e.target.value)}
      />
      <input
        className="hm-field"
        aria-label="Opmerking (optioneel)"
        placeholder="Opmerking (optioneel)"
        value={opmerking}
        onChange={(e) => setOpmerking(e.target.value)}
      />
      <div className="hm-form-acties">
        <button type="button" className="primary" onClick={handleOpslaan}>
          Opslaan
        </button>
        <button type="button" onClick={onAnnuleren}>
          Annuleren
        </button>
        {onVerwijderen && (
          <button
            type="button"
            className="icoon-knop"
            aria-label={`Verwijderen: ${naam || 'deze mutatie'}`}
            onClick={onVerwijderen}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}
