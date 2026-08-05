import { describe, expect, it } from 'vitest'
import {
  berekenStats,
  filterMutaties,
  getAutocompleteWaarden,
  groepeerPerMaand,
} from './mutatieLogica'
import type { Mutatie } from './types'

function maakMutatie(overrides: Partial<Mutatie>): Mutatie {
  return {
    id: 'x',
    richting: 'in',
    jaar: 2026,
    maand: 1,
    datum: '2026-01-15',
    naam: 'Jansen',
    locatie: 'Vlijmen',
    administratie: 'Malcon Beheer B.V.',
    opmerking: '',
    ...overrides,
  }
}

describe('groepeerPerMaand', () => {
  it('groepeert per jaar-maand met nieuwste maand bovenaan', () => {
    const mutaties = [
      maakMutatie({ id: '1', jaar: 2025, maand: 3 }),
      maakMutatie({ id: '2', jaar: 2026, maand: 1 }),
      maakMutatie({ id: '3', jaar: 2025, maand: 12 }),
    ]
    const groepen = groepeerPerMaand(mutaties)
    expect(groepen.map((g) => `${g.jaar}-${g.maand}`)).toEqual([
      '2026-1',
      '2025-12',
      '2025-3',
    ])
  })

  it('splitst ingaand en vertrekkend binnen dezelfde maand', () => {
    const mutaties = [
      maakMutatie({ id: '1', richting: 'in' }),
      maakMutatie({ id: '2', richting: 'uit' }),
    ]
    const [groep] = groepeerPerMaand(mutaties)
    expect(groep.in).toHaveLength(1)
    expect(groep.uit).toHaveLength(1)
  })
})

describe('filterMutaties', () => {
  const mutaties = [
    maakMutatie({ id: '1', jaar: 2025, naam: 'Jansen', locatie: 'Vlijmen' }),
    maakMutatie({ id: '2', jaar: 2026, naam: 'Pietersen', locatie: 'Uden' }),
  ]

  it('filtert op jaar', () => {
    expect(filterMutaties(mutaties, 2026, '')).toHaveLength(1)
    expect(filterMutaties(mutaties, 'alle', '')).toHaveLength(2)
  })

  it('filtert op zoekterm in naam, locatie of administratie, case-insensitief', () => {
    expect(filterMutaties(mutaties, 'alle', 'jansen')).toHaveLength(1)
    expect(filterMutaties(mutaties, 'alle', 'UDEN')).toHaveLength(1)
    expect(filterMutaties(mutaties, 'alle', 'onbekend')).toHaveLength(0)
  })
})

describe('getAutocompleteWaarden', () => {
  it('geeft distincte, alfabetisch gesorteerde waarden terug', () => {
    const mutaties = [
      maakMutatie({ locatie: 'Vlijmen' }),
      maakMutatie({ locatie: 'Uden' }),
      maakMutatie({ locatie: 'Vlijmen' }),
    ]
    expect(getAutocompleteWaarden(mutaties, 'locatie')).toEqual(['Uden', 'Vlijmen'])
  })

  it('negeert lege waarden', () => {
    const mutaties = [maakMutatie({ administratie: '' })]
    expect(getAutocompleteWaarden(mutaties, 'administratie')).toEqual([])
  })
})

describe('berekenStats', () => {
  it('telt ingaand, vertrekkend, netto en totaal', () => {
    const mutaties = [
      maakMutatie({ richting: 'in' }),
      maakMutatie({ richting: 'in' }),
      maakMutatie({ richting: 'uit' }),
    ]
    expect(berekenStats(mutaties)).toEqual({ in: 2, uit: 1, netto: 1, totaal: 3 })
  })
})
