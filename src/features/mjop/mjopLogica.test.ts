import { describe, expect, it } from 'vitest'
import { berekenMjopSamenvatting, groepeerPerJaar } from './mjopLogica'
import type { MjopPost } from './types'

function maakPost(overrides: Partial<MjopPost> = {}): MjopPost {
  return {
    id: '1',
    pandId: 'p1',
    klantId: 'klant-1',
    naam: 'Post',
    jaar: 2026,
    geschatBedrag: 1000,
    status: 'gepland',
    toegevoegdDoor: 'Ton',
    aangemaaktOp: 1,
    ...overrides,
  }
}

describe('berekenMjopSamenvatting', () => {
  it('telt het totaal, dit-jaar-bedrag en aantal posten correct op', () => {
    const posten = [
      maakPost({ id: '1', jaar: 2026, geschatBedrag: 12000 }),
      maakPost({ id: '2', jaar: 2028, geschatBedrag: 35000 }),
      maakPost({ id: '3', jaar: 2031, geschatBedrag: 18500 }),
      maakPost({ id: '4', jaar: 2031, geschatBedrag: 22000 }),
    ]

    const samenvatting = berekenMjopSamenvatting(posten, 2026)

    expect(samenvatting).toEqual({
      totaalGepland: 87500,
      ditJaarBedrag: 12000,
      aantalPosten: 4,
    })
  })

  it('geeft nullen terug bij een lege lijst', () => {
    expect(berekenMjopSamenvatting([], 2026)).toEqual({
      totaalGepland: 0,
      ditJaarBedrag: 0,
      aantalPosten: 0,
    })
  })
})

describe('groepeerPerJaar', () => {
  it('groepeert posten per jaar en sorteert oplopend', () => {
    const posten = [
      maakPost({ id: '1', jaar: 2031 }),
      maakPost({ id: '2', jaar: 2026 }),
      maakPost({ id: '3', jaar: 2031 }),
      maakPost({ id: '4', jaar: 2028 }),
    ]

    const groepen = groepeerPerJaar(posten)

    expect(groepen.map(([jaar]) => jaar)).toEqual([2026, 2028, 2031])
    expect(groepen.find(([jaar]) => jaar === 2031)?.[1]).toHaveLength(2)
  })
})
