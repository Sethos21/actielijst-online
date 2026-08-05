import type { Mutatie, Richting } from './types'

export interface MaandGroep {
  jaar: number
  maand: number
  in: Mutatie[]
  uit: Mutatie[]
}

/** Groepeert mutaties per jaar-maand, nieuwste maand bovenaan. */
export function groepeerPerMaand(mutaties: Mutatie[]): MaandGroep[] {
  const groepen = new Map<string, MaandGroep>()
  for (const mutatie of mutaties) {
    const sleutel = `${mutatie.jaar}-${String(mutatie.maand).padStart(2, '0')}`
    let groep = groepen.get(sleutel)
    if (!groep) {
      groep = { jaar: mutatie.jaar, maand: mutatie.maand, in: [], uit: [] }
      groepen.set(sleutel, groep)
    }
    groep[mutatie.richting].push(mutatie)
  }
  return Array.from(groepen.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, groep]) => groep)
}

/**
 * Vult alle 12 maanden van een jaar aan (nieuwste boven), ook de maanden
 * zonder mutaties — anders is er nergens een "+ toevoegen"-knop om de
 * eérste mutatie van een (nog lege) maand of jaar aan te maken.
 */
export function vulJaarAan(groepen: MaandGroep[], jaar: number): MaandGroep[] {
  const bestaand = new Map(groepen.map((g) => [g.maand, g]))
  const resultaat: MaandGroep[] = []
  for (let maand = 12; maand >= 1; maand--) {
    resultaat.push(bestaand.get(maand) ?? { jaar, maand, in: [], uit: [] })
  }
  return resultaat
}

/** Zoekbalk matcht op naam, locatie en administratie — case-insensitief. */
export function filterMutaties(
  mutaties: Mutatie[],
  jaarFilter: number | 'alle',
  zoekterm: string,
): Mutatie[] {
  let resultaat = mutaties
  if (jaarFilter !== 'alle') {
    resultaat = resultaat.filter((m) => m.jaar === jaarFilter)
  }
  const term = zoekterm.trim().toLowerCase()
  if (term) {
    resultaat = resultaat.filter(
      (m) =>
        m.naam.toLowerCase().includes(term) ||
        m.locatie.toLowerCase().includes(term) ||
        m.administratie.toLowerCase().includes(term),
    )
  }
  return resultaat
}

/** Distincte, alfabetisch gesorteerde waarden voor autocomplete op locatie/administratie. */
export function getAutocompleteWaarden(
  mutaties: Mutatie[],
  veld: 'locatie' | 'administratie',
): string[] {
  const set = new Set<string>()
  for (const mutatie of mutaties) {
    if (mutatie[veld]) set.add(mutatie[veld])
  }
  return Array.from(set).sort()
}

export interface MutatieStats {
  in: number
  uit: number
  netto: number
  totaal: number
}

export function berekenStats(mutaties: Mutatie[]): MutatieStats {
  const telling = (richting: Richting) =>
    mutaties.filter((m) => m.richting === richting).length
  const inAantal = telling('in')
  const uitAantal = telling('uit')
  return {
    in: inAantal,
    uit: uitAantal,
    netto: inAantal - uitAantal,
    totaal: mutaties.length,
  }
}
