import * as XLSX from 'xlsx'
import { describe, expect, it, vi } from 'vitest'
import { bestandsnaamVoor, bouwMutatiesWerkboek } from './mutatieExcelExport'
import type { Mutatie } from './types'

function maakMutatie(overrides: Partial<Mutatie> = {}): Mutatie {
  return {
    id: '1',
    richting: 'in',
    jaar: 2026,
    maand: 3,
    datum: '2026-03-10',
    naam: 'Jansen',
    locatie: 'Vlijmen',
    administratie: 'Malcon Beheer B.V.',
    opmerking: 'Instroom per 1e',
    ...overrides,
  }
}

describe('bouwMutatiesWerkboek', () => {
  it('bevat een headerrij en een datarij per mutatie', () => {
    const werkboek = bouwMutatiesWerkboek([maakMutatie()])
    const blad = werkboek.Sheets['Huurdersmutaties']
    const rijen = XLSX.utils.sheet_to_json<(string | number)[]>(blad, { header: 1 })

    expect(rijen[0]).toEqual([
      'Richting',
      'Jaar',
      'Maand',
      'Datum',
      'Naam huurder',
      'Locatie',
      'Administratie',
      'Opmerking',
    ])
    expect(rijen[1]).toEqual([
      'Ingaand',
      2026,
      'Maart',
      '2026-03-10',
      'Jansen',
      'Vlijmen',
      'Malcon Beheer B.V.',
      'Instroom per 1e',
    ])
  })

  it('vertaalt de richting "uit" naar "Vertrekkend"', () => {
    const werkboek = bouwMutatiesWerkboek([maakMutatie({ richting: 'uit' })])
    const blad = werkboek.Sheets['Huurdersmutaties']
    const rijen = XLSX.utils.sheet_to_json<string[]>(blad, { header: 1 })
    expect(rijen[1][0]).toBe('Vertrekkend')
  })

  it('sorteert de rijen chronologisch, ongeacht de invoervolgorde', () => {
    const werkboek = bouwMutatiesWerkboek([
      maakMutatie({ id: '2', jaar: 2026, maand: 1, datum: '2026-01-05', naam: 'Later toegevoegd' }),
      maakMutatie({ id: '1', jaar: 2025, maand: 12, datum: '2025-12-20', naam: 'Ouder' }),
    ])
    const blad = werkboek.Sheets['Huurdersmutaties']
    const rijen = XLSX.utils.sheet_to_json<string[]>(blad, { header: 1 })
    expect(rijen[1][4]).toBe('Ouder')
    expect(rijen[2][4]).toBe('Later toegevoegd')
  })

  it('zet kolombreedtes zodat het bestand leesbaar opent in Excel', () => {
    const werkboek = bouwMutatiesWerkboek([maakMutatie()])
    const blad = werkboek.Sheets['Huurdersmutaties']
    expect(blad['!cols']).toHaveLength(8)
  })
})

describe('bestandsnaamVoor', () => {
  it('vervangt niet-alfanumerieke tekens door underscores', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15'))
    expect(bestandsnaamVoor('Alle jaren')).toBe('Huurdersmutaties_Alle_jaren_2026-03-15.xlsx')
    expect(bestandsnaamVoor('2026')).toBe('Huurdersmutaties_2026_2026-03-15.xlsx')
    vi.useRealTimers()
  })
})
