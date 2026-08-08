import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { bestandsnaamVoor, bouwRapportageWerkboek } from './rapportageExcelExport'
import type { KwartaalRapport } from './types'

function maakRapport(overrides: Partial<KwartaalRapport> = {}): KwartaalRapport {
  return {
    klantId: 'k1',
    klantNaam: 'Malcon B.V.',
    periodeStart: '2026-04-01',
    periodeEind: '2026-07-01',
    actiesAfgerond: 14,
    actiesAfgerondOpTijd: 12,
    actiesAfgerondTeLaat: 2,
    gemiddeldeDoorlooptijdDagen: 9,
    nogOpenstaand: 6,
    nogOpenstaandDue: 2,
    mutatiesIn: 2,
    mutatiesUit: 1,
    ...overrides,
  }
}

describe('bouwRapportageWerkboek', () => {
  it('bevat klant, periode en de belangrijkste tellingen', () => {
    const werkboek = bouwRapportageWerkboek(maakRapport(), { jaar: 2026, kwartaal: 2 }, XLSX)
    const blad = werkboek.Sheets['Rapportage']
    const rijen = XLSX.utils.sheet_to_json<(string | number)[]>(blad, { header: 1 })

    expect(rijen[0]).toEqual(['Kwartaalrapportage', 'Malcon B.V.'])
    expect(rijen[1]).toEqual(['Kwartaal', 'Q2 2026'])
    expect(rijen[2]).toEqual(['Periode', '1 april 2026 — 30 juni 2026'])
    expect(rijen).toContainEqual(['Afgerond op tijd', 12])
    expect(rijen).toContainEqual(['Afgerond te laat', 2])
    expect(rijen).toContainEqual(['Nog openstaand (due)', 2])
    expect(rijen).toContainEqual(['Ingaand', 2])
    expect(rijen).toContainEqual(['Vertrekkend', 1])
  })

  it('laat gemiddelde doorlooptijd leeg als die null is', () => {
    const werkboek = bouwRapportageWerkboek(
      maakRapport({ gemiddeldeDoorlooptijdDagen: null }),
      { jaar: 2026, kwartaal: 2 },
      XLSX,
    )
    const blad = werkboek.Sheets['Rapportage']
    const rijen = XLSX.utils.sheet_to_json<(string | number)[]>(blad, { header: 1 })
    const rij = rijen.find((r) => r[0] === 'Gemiddelde doorlooptijd (dagen)')
    expect(rij?.[1]).toBe('')
  })
})

describe('bestandsnaamVoor', () => {
  it('bouwt een veilige bestandsnaam met klant en kwartaal', () => {
    expect(bestandsnaamVoor('Malcon B.V.', { jaar: 2026, kwartaal: 2 })).toBe(
      'Rapportage_Malcon_B_V_Q2_2026.xlsx',
    )
  })
})
