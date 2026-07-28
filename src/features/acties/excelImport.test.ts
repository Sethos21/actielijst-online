import { describe, expect, it } from 'vitest'
import { parseerActies, vindHeaderRij } from './excelImport'

const TEAMLEDEN = ['Ton', 'Seth', 'Gertjan', 'Marjan', 'Eigenaar'] as const

// Vereenvoudigde weergave van het echte BVC-exportformaat: metadata-blok
// bovenaan, dan de kolomkoppen, dan de datarijen, dan lege opmaak-rommel.
const RUWE_RIJEN: unknown[][] = [
  [],
  [],
  [],
  ['', 'Bedrijf', '', '', '', '', '', 'Kleur', 'Status', 'Aantal', '', ''],
  ['', 'Vergadering:', '', '', 'Werkoverleg Malcon - BVC', '', '', '', 'Due', 0, '', ''],
  [],
  ['', 'Aanwezigen:', '', '', 'Margriet, Gert-Jan, Seth, Ton', '', '', '', 'Done', 226, '', ''],
  ['', '', '', '', '', '', '', 'Datum:', new Date(2026, 4, 6), '', '', ''],
  [],
  ['', 'Ref', 'Datum', 'Onderwerp', 'Bedrijf', 'Vestiging', 'Actiepunt', 'Verantw.', 'Gereed op', 'Status', 'Informant', 'Opmerking'],
  ['', 1, new Date(2020, 0, 1), 'Renovatie', 'Bowog Beheer B.V', 'Valkenswaard', 'Gevels renoveren', 'Ton/Seth', new Date(2020, 5, 1), 'Done', '', 'Opgeleverd'],
  ['', 2, new Date(2020, 0, 2), 'Onderhoud', 'Malcon B.V', 'Vlijmen', 'Kas vervangen', 'Gert-Jan', '', 'Open', '', ''],
  ['', 3, new Date(2020, 0, 3), 'Vergunning', 'Tiemessen', 'Haarlem', 'Bezwaar indienen', 'Gerie/Barend', '', 'open', 'AGB', 'Loopt nog'],
  ['', '', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', '', ''],
]

describe('vindHeaderRij', () => {
  it('vindt de rij met de echte kolomkoppen, na het metadata-blok', () => {
    expect(vindHeaderRij(RUWE_RIJEN)).toBe(9)
  })

  it('geeft -1 als er geen headerrij is', () => {
    expect(vindHeaderRij([[], ['', 'iets anders']])).toBe(-1)
  })
})

describe('parseerActies', () => {
  const acties = parseerActies(RUWE_RIJEN, TEAMLEDEN)

  it('stopt met lezen bij het einde van de datatabel, niet bij het einde van het blad', () => {
    expect(acties).toHaveLength(3)
  })

  it('mapt de basisvelden correct, inclusief het nieuwe Bedrijf-veld', () => {
    expect(acties[0]).toMatchObject({
      ref: '1',
      aangemaaktOp: '2020-01-01',
      onderwerp: 'Renovatie',
      bedrijf: 'Bowog Beheer B.V',
      vestiging: 'Valkenswaard',
      actie: 'Gevels renoveren',
      status: 'done',
      dueDateOverride: '2020-06-01',
    })
  })

  it('splitst samengestelde Verantw.-waarden en matcht ze tegen de vaste teamledenlijst', () => {
    expect(acties[0].verantw).toEqual(['Ton', 'Seth'])
  })

  it('normaliseert "Gert-Jan" naar teamlid Gertjan', () => {
    expect(acties[1].verantw).toEqual(['Gertjan'])
  })

  it('negeert namen die niet in de vaste teamledenlijst staan (Gerie, Barend)', () => {
    expect(acties[2].verantw).toEqual([])
  })

  it('normaliseert status-schrijfwijze ("open" → open)', () => {
    expect(acties[2].status).toBe('open')
  })

  it('zet een niet-lege Informant als prefix in de opmerking, zonder data te verliezen', () => {
    expect(acties[2].opmerking).toBe('Informant: AGB — Loopt nog')
  })

  it('laat dueDateOverride leeg als er geen Gereed-op-datum is', () => {
    expect(acties[1].dueDateOverride).toBeUndefined()
  })
})
