import * as XLSX from 'xlsx'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bouwArchiefWerkboek, exporteerArchiefNaarJson } from './archiefExport'
import type { ArchiefItem } from './types'

function maakItem(overrides: Partial<ArchiefItem> = {}): ArchiefItem {
  return {
    id: '1',
    type: 'pand',
    naam: 'Molenweg 7, Gemert',
    klantId: 'k1',
    klantNaam: 'Malcon B.V.',
    gearchiveerdOp: new Date('2026-07-03').getTime(),
    gearchiveerdDoor: 'Seth',
    gearchiveerdReden: 'verkocht',
    ...overrides,
  }
}

describe('bouwArchiefWerkboek', () => {
  it('bevat een rij per item met klant, pand en archiveer-gegevens', () => {
    const werkboek = bouwArchiefWerkboek(
      [maakItem(), maakItem({ type: 'onderhoud', naam: 'Deurautomaat', pandNaam: 'Hoofdstraat 12' })],
      XLSX,
    )
    const blad = werkboek.Sheets['Archief']
    const rijen = XLSX.utils.sheet_to_json<Record<string, string>>(blad)

    expect(rijen).toHaveLength(2)
    expect(rijen[0]).toMatchObject({
      Type: 'pand',
      Naam: 'Molenweg 7, Gemert',
      Klant: 'Malcon B.V.',
      'Gearchiveerd door': 'Seth',
      Reden: 'verkocht',
    })
    expect(rijen[1]).toMatchObject({
      Type: 'onderhoud',
      Naam: 'Deurautomaat',
      Pand: 'Hoofdstraat 12',
    })
  })

  it('laat ontbrekende velden leeg i.p.v. undefined', () => {
    const werkboek = bouwArchiefWerkboek(
      [maakItem({ gearchiveerdDoor: undefined, gearchiveerdReden: undefined })],
      XLSX,
    )
    const blad = werkboek.Sheets['Archief']
    const rijen = XLSX.utils.sheet_to_json<Record<string, string>>(blad)
    expect(rijen[0]['Gearchiveerd door']).toBe('')
    expect(rijen[0]['Reden']).toBe('')
  })
})

describe('exporteerArchiefNaarJson', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('bouwt een downloadbare JSON-blob van de items', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_v: string) {},
      set download(_v: string) {},
      click,
    } as unknown as HTMLAnchorElement)

    exporteerArchiefNaarJson([maakItem()])

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })
})
