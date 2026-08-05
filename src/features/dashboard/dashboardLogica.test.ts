import { describe, expect, it } from 'vitest'
import type { ActieItem } from '../acties/types'
import {
  berekenStatsPerKlant,
  berekenStatsPerTeamlid,
  berekenTotaalStats,
} from './dashboardLogica'

function maakActie(overrides: Partial<ActieItem> = {}): ActieItem {
  return {
    id: '1',
    klantId: 'klant-1',
    ref: '',
    onderwerp: 'Onderwerp',
    bedrijf: '',
    vestiging: '',
    actie: 'Actie',
    verantw: ['Ton'],
    aangemaaktOp: '2020-01-01',
    doorlooptijd: '1w',
    status: 'open',
    opmerking: '',
    ...overrides,
  }
}

describe('berekenTotaalStats', () => {
  it('telt open (incl. due), due en done over alle klanten heen', () => {
    const acties = [
      maakActie({ id: '1', status: 'open', aangemaaktOp: '2020-01-01' }), // due
      maakActie({ id: '2', status: 'open', aangemaaktOp: '2999-01-01' }), // niet due
      maakActie({ id: '3', status: 'done' }),
      maakActie({ id: '4', status: 'hold', aangemaaktOp: '2020-01-01' }), // hold telt niet mee als open of due
    ]
    expect(berekenTotaalStats(acties)).toEqual({ open: 2, due: 1, done: 1 })
  })

  it('on-hold-acties zijn nooit due, ongeacht de datum', () => {
    const acties = [maakActie({ status: 'hold', aangemaaktOp: '2000-01-01' })]
    expect(berekenTotaalStats(acties).due).toBe(0)
  })
})

describe('berekenStatsPerKlant', () => {
  it('groepeert de tellingen per klantId', () => {
    const acties = [
      maakActie({ id: '1', klantId: 'klant-1', status: 'open', aangemaaktOp: '2020-01-01' }),
      maakActie({ id: '2', klantId: 'klant-1', status: 'done' }),
      maakActie({ id: '3', klantId: 'klant-2', status: 'open', aangemaaktOp: '2999-01-01' }),
    ]
    const stats = berekenStatsPerKlant(acties)
    expect(stats['klant-1']).toEqual({ open: 1, due: 1, done: 1 })
    expect(stats['klant-2']).toEqual({ open: 1, due: 0, done: 0 })
  })
})

describe('berekenStatsPerTeamlid', () => {
  it('telt open en due-acties per teamlid, ook bij meerdere verantwoordelijken', () => {
    const acties = [
      maakActie({ id: '1', verantw: ['Ton', 'Seth'], status: 'open', aangemaaktOp: '2020-01-01' }),
      maakActie({ id: '2', verantw: ['Ton'], status: 'open', aangemaaktOp: '2999-01-01' }),
      maakActie({ id: '3', verantw: ['Seth'], status: 'done', aangemaaktOp: '2020-01-01' }),
    ]
    const stats = berekenStatsPerTeamlid(acties, ['Ton', 'Seth', 'Marjan'])
    expect(stats.Ton).toEqual({ open: 2, due: 1 })
    expect(stats.Seth).toEqual({ open: 1, due: 1 })
    expect(stats.Marjan).toEqual({ open: 0, due: 0 })
  })

  it('geeft 0/0 voor teamleden zonder acties', () => {
    const stats = berekenStatsPerTeamlid([], ['Ton'])
    expect(stats.Ton).toEqual({ open: 0, due: 0 })
  })
})
