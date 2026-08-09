import { describe, expect, it, vi } from 'vitest'
import { bouwActieVanuitBron } from './bouwActieVanuitBron'

describe('bouwActieVanuitBron', () => {
  it('vult onderwerp en vestiging voor op basis van de bron, met pandId en herkomst gezet', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15'))

    const actie = bouwActieVanuitBron({
      type: 'onderhoud',
      bronId: 'o1',
      label: 'CV-ketel onderhoud',
      klantId: 'klant-1',
      pandId: 'p1',
      pandNaam: 'Hoofdstraat 12, Vlijmen',
    })

    expect(actie).toEqual({
      klantId: 'klant-1',
      ref: '',
      onderwerp: 'CV-ketel onderhoud',
      bedrijf: '',
      vestiging: 'Hoofdstraat 12, Vlijmen',
      pandId: 'p1',
      actie: '',
      verantw: [],
      aangemaaktOp: '2026-03-15',
      doorlooptijd: '2w',
      status: 'open',
      opmerking: '',
      herkomst: { type: 'onderhoud', bronId: 'o1', label: 'CV-ketel onderhoud' },
    })

    vi.useRealTimers()
  })

  it('zet het juiste herkomst-type door voor mjop en document', () => {
    const mjopActie = bouwActieVanuitBron({
      type: 'mjop',
      bronId: 'm1',
      label: 'Dakbedekking vervangen',
      klantId: 'klant-1',
      pandId: 'p1',
      pandNaam: 'Hoofdstraat 12',
    })
    expect(mjopActie.herkomst).toEqual({
      type: 'mjop',
      bronId: 'm1',
      label: 'Dakbedekking vervangen',
    })

    const documentActie = bouwActieVanuitBron({
      type: 'document',
      bronId: 'd1',
      label: 'Huurcontract_Tiemessen.pdf',
      klantId: 'klant-1',
      pandId: 'p1',
      pandNaam: 'Hoofdstraat 12',
    })
    expect(documentActie.herkomst).toEqual({
      type: 'document',
      bronId: 'd1',
      label: 'Huurcontract_Tiemessen.pdf',
    })
  })
})
