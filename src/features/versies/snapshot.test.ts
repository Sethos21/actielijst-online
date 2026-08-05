import { describe, expect, it } from 'vitest'
import type { ActieItem } from '../acties/types'
import { naarSnapshot } from './snapshot'

function maakActie(overrides: Partial<ActieItem> = {}): ActieItem {
  return {
    id: '1',
    klantId: 'k1',
    ref: '',
    onderwerp: 'Onderwerp',
    bedrijf: 'Bedrijf B.V.',
    vestiging: 'Vestiging',
    actie: 'Actie',
    verantw: ['Ton'],
    aangemaaktOp: '2026-01-01',
    doorlooptijd: '2w',
    status: 'open',
    opmerking: '',
    ...overrides,
  }
}

describe('naarSnapshot', () => {
  it('kopieert de acties met alle velden', () => {
    const acties = [maakActie()]
    expect(naarSnapshot(acties)).toEqual(acties)
  })

  it('verwijdert undefined optionele velden i.p.v. ze mee te sturen naar Firestore', () => {
    const acties = [maakActie({ dueDateOverride: undefined, postponedTot: undefined })]
    const snapshot = naarSnapshot(acties)
    expect(snapshot[0]).not.toHaveProperty('dueDateOverride')
    expect(snapshot[0]).not.toHaveProperty('postponedTot')
  })

  it('is een echte kopie: wijzigen van de bron raakt de snapshot niet', () => {
    const acties = [maakActie()]
    const snapshot = naarSnapshot(acties)
    acties[0].status = 'done'
    expect(snapshot[0].status).toBe('open')
  })
})
