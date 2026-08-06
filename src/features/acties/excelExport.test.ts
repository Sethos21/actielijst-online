import * as XLSX from 'xlsx'
import { describe, expect, it, vi } from 'vitest'
import { bestandsnaamVoor, bouwActielijstWerkboek } from './excelExport'
import type { ActieItem } from './types'

function maakActie(overrides: Partial<ActieItem> = {}): ActieItem {
  return {
    id: '1',
    klantId: 'k1',
    ref: '',
    onderwerp: 'Onderwerp',
    bedrijf: 'Bedrijf B.V.',
    vestiging: 'Vestiging',
    actie: 'Actiepunt',
    verantw: ['Ton', 'Seth'],
    aangemaaktOp: '2026-01-01',
    doorlooptijd: '2w',
    status: 'open',
    opmerking: 'Opmerking',
    ...overrides,
  }
}

describe('bouwActielijstWerkboek', () => {
  it('bevat een headerrij en een datarij per actie', () => {
    const werkboek = bouwActielijstWerkboek([maakActie()], XLSX)
    const blad = werkboek.Sheets['Actielijst']
    const rijen = XLSX.utils.sheet_to_json<string[]>(blad, { header: 1 })

    expect(rijen[0]).toEqual([
      'Onderwerp',
      'Bedrijf',
      'Vestiging',
      'Actiepunt',
      'Verantw.',
      'Aangemaakt',
      'Doorlooptijd',
      'Due',
      'Status',
      'Opmerking',
    ])
    expect(rijen[1]).toEqual([
      'Onderwerp',
      'Bedrijf B.V.',
      'Vestiging',
      'Actiepunt',
      'Ton, Seth',
      '2026-01-01',
      '2w',
      '2026-01-15',
      'Open',
      'Opmerking',
    ])
  })

  it('vertaalt status naar het Nederlandse label', () => {
    const werkboek = bouwActielijstWerkboek([maakActie({ status: 'hold' })], XLSX)
    const blad = werkboek.Sheets['Actielijst']
    const rijen = XLSX.utils.sheet_to_json<string[]>(blad, { header: 1 })
    expect(rijen[1][8]).toBe('On hold')
  })

  it('zet kolombreedtes zodat het bestand leesbaar opent in Excel', () => {
    const werkboek = bouwActielijstWerkboek([maakActie()], XLSX)
    const blad = werkboek.Sheets['Actielijst']
    expect(blad['!cols']).toHaveLength(10)
  })
})

describe('bestandsnaamVoor', () => {
  it('vervangt niet-alfanumerieke tekens door underscores', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15'))
    expect(bestandsnaamVoor('Malcon B.V.')).toBe('Actielijst_Malcon_B_V_2026-03-15.xlsx')
    vi.useRealTimers()
  })
})
