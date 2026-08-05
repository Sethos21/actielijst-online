import { describe, expect, it } from 'vitest'
import {
  berekenSamenvattingPerTeamlid,
  filterActiesVoorTeamlid,
  groepeerPerKlant,
} from './mijnActiesLogica'
import type { ActieItem } from './types'

function maakActie(overrides: Partial<ActieItem>): ActieItem {
  return {
    id: 'x',
    klantId: 'klant-1',
    ref: '1',
    onderwerp: 'Onderhoud',
    bedrijf: '',
    vestiging: '',
    actie: 'Iets doen',
    verantw: ['Ton'],
    aangemaaktOp: '2020-01-01',
    doorlooptijd: '1w',
    status: 'open',
    opmerking: '',
    ...overrides,
  }
}

describe('berekenSamenvattingPerTeamlid', () => {
  it('telt open (niet-due) en due apart, per teamlid', () => {
    const acties = [
      maakActie({ id: '1', verantw: ['Ton'], status: 'open', aangemaaktOp: '2999-01-01' }), // open, niet due
      maakActie({ id: '2', verantw: ['Ton'], status: 'open', aangemaaktOp: '2000-01-01' }), // due
      maakActie({ id: '3', verantw: ['Seth'], status: 'open', aangemaaktOp: '2999-01-01' }),
    ]
    const samenvatting = berekenSamenvattingPerTeamlid(acties, ['Ton', 'Seth'])
    expect(samenvatting.Ton).toEqual({ open: 1, due: 1 })
    expect(samenvatting.Seth).toEqual({ open: 1, due: 0 })
  })

  it('geeft 0/0 voor een teamlid zonder acties', () => {
    const samenvatting = berekenSamenvattingPerTeamlid([], ['Marjan'])
    expect(samenvatting.Marjan).toEqual({ open: 0, due: 0 })
  })

  it('on-hold acties tellen nooit mee als due (bedrijfsregel)', () => {
    const acties = [
      maakActie({ verantw: ['Ton'], status: 'hold', aangemaaktOp: '2000-01-01' }),
    ]
    const samenvatting = berekenSamenvattingPerTeamlid(acties, ['Ton'])
    expect(samenvatting.Ton).toEqual({ open: 0, due: 0 })
  })
})

describe('filterActiesVoorTeamlid', () => {
  it('laat afgeronde acties weg, maar houdt open en on-hold', () => {
    const acties = [
      maakActie({ id: '1', verantw: ['Ton'], status: 'open' }),
      maakActie({ id: '2', verantw: ['Ton'], status: 'hold' }),
      maakActie({ id: '3', verantw: ['Ton'], status: 'done' }),
    ]
    const resultaat = filterActiesVoorTeamlid(acties, 'Ton')
    expect(resultaat.map((a) => a.id)).toEqual(['1', '2'])
  })

  it('geeft alleen acties waar het teamlid verantwoordelijk voor is', () => {
    const acties = [
      maakActie({ id: '1', verantw: ['Ton', 'Seth'] }),
      maakActie({ id: '2', verantw: ['Seth'] }),
    ]
    expect(filterActiesVoorTeamlid(acties, 'Ton').map((a) => a.id)).toEqual(['1'])
  })
})

describe('groepeerPerKlant', () => {
  it('groepeert acties per klant', () => {
    const acties = [
      maakActie({ id: '1', klantId: 'a' }),
      maakActie({ id: '2', klantId: 'b' }),
      maakActie({ id: '3', klantId: 'a' }),
    ]
    const groepen = groepeerPerKlant(acties)
    expect(groepen).toHaveLength(2)
    expect(groepen.find((g) => g.klantId === 'a')?.acties).toHaveLength(2)
    expect(groepen.find((g) => g.klantId === 'b')?.acties).toHaveLength(1)
  })
})
