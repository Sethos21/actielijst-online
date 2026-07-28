import type { ActieStatus } from './types'

export interface GeimporteerdeActie {
  ref: string
  aangemaaktOp: string
  onderwerp: string
  bedrijf: string
  vestiging: string
  actie: string
  verantw: string[]
  dueDateOverride?: string
  status: ActieStatus
  opmerking: string
}

/**
 * De bron-Excel heeft een metadata-blok (Vergadering/Aanwezigen/Datum/stats)
 * bovenaan het blad; de echte kolomkoppen staan op de rij waar kolom-index 1
 * de tekst "Ref" bevat. Alles daarvoor is niet relevant voor de import.
 */
export function vindHeaderRij(rijen: unknown[][]): number {
  return rijen.findIndex((rij) => rij[1] === 'Ref')
}

function normaliseerNaam(naam: string): string {
  return naam.toLowerCase().replace(/[-\s]/g, '')
}

/** Matcht een naam uit de Excel tegen de vaste teamledenlijst, ongeacht
 * hoofdletters/spaties/streepjes (bv. "Gert-Jan" → "Gertjan"). Namen die
 * niet voorkomen in de vaste lijst (Gerie, Richard, Thomas, ...) matchen
 * bewust niet — dat is een expliciete keuze, geen omissie. */
function matchTeamlid(naam: string, teamleden: readonly string[]): string | null {
  const genormaliseerd = normaliseerNaam(naam)
  return teamleden.find((lid) => normaliseerNaam(lid) === genormaliseerd) ?? null
}

function parseVerantw(ruweWaarde: unknown, teamleden: readonly string[]): string[] {
  const tekst = String(ruweWaarde ?? '').replace(/\n/g, ' ')
  return tekst
    .split('/')
    .map((naam) => naam.trim())
    .filter((naam) => naam !== '')
    .map((naam) => matchTeamlid(naam, teamleden))
    .filter((naam): naam is string => naam !== null)
}

function naarIsoDatum(waarde: unknown): string | undefined {
  if (waarde instanceof Date && !isNaN(waarde.getTime())) {
    return waarde.toISOString().slice(0, 10)
  }
  if (typeof waarde === 'string' && waarde.trim() !== '') {
    const geparsed = new Date(waarde)
    if (!isNaN(geparsed.getTime())) return geparsed.toISOString().slice(0, 10)
  }
  return undefined
}

function parseStatus(ruweWaarde: unknown): ActieStatus {
  const tekst = String(ruweWaarde ?? '').trim().toLowerCase()
  return tekst === 'done' ? 'done' : 'open'
}

/**
 * Zet de ruwe 2D-grid van een geëxporteerd werkblad (bv. via
 * XLSX.utils.sheet_to_json(sheet, { header: 1 })) om naar acties in ons
 * datamodel. Kolomvolgorde is die van de BVC-actielijst-export: Ref, Datum,
 * Onderwerp, Bedrijf, Vestiging, Actiepunt, Verantw., Gereed op, Status,
 * Informant, Opmerking (kolom 0 is in de bron altijd leeg).
 */
export function parseerActies(
  rijen: unknown[][],
  teamleden: readonly string[],
): GeimporteerdeActie[] {
  const headerIndex = vindHeaderRij(rijen)
  if (headerIndex === -1) return []

  const resultaat: GeimporteerdeActie[] = []

  for (let r = headerIndex + 1; r < rijen.length; r++) {
    const rij = rijen[r] ?? []
    const ref = rij[1]
    // De echte datatabel is aaneengesloten; zodra de Ref-kolom leeg is, is
    // dat het einde van de data (de rest van het blad is lege opmaak-rommel).
    if (ref === undefined || ref === null || ref === '') break

    const informant = String(rij[10] ?? '').trim()
    const opmerking = String(rij[11] ?? '').trim()

    resultaat.push({
      ref: String(ref),
      aangemaaktOp: naarIsoDatum(rij[2]) ?? new Date().toISOString().slice(0, 10),
      onderwerp: String(rij[3] ?? ''),
      bedrijf: String(rij[4] ?? ''),
      vestiging: String(rij[5] ?? ''),
      actie: String(rij[6] ?? ''),
      verantw: parseVerantw(rij[7], teamleden),
      dueDateOverride: naarIsoDatum(rij[8]),
      status: parseStatus(rij[9]),
      opmerking: informant ? `Informant: ${informant} — ${opmerking}` : opmerking,
    })
  }

  return resultaat
}
