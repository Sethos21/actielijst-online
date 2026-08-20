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
 * bovenaan het blad; de echte kolomkoppen staan op de rij die ergens de tekst
 * "Ref" bevat (niet per se op een vaste kolompositie — zie vindKolomIndex).
 * Alles daarvoor is niet relevant voor de import.
 */
export function vindHeaderRij(rijen: unknown[][]): number {
  return rijen.findIndex((rij) => rij.some((cel) => String(cel).trim() === 'Ref'))
}

/**
 * Zoekt een kolom op basis van de headertekst in plaats van een vaste index
 * — bestanden met een net iets andere kolomvolgorde dan het oorspronkelijke
 * testbestand worden zo nog steeds correct gelezen, zolang de headernamen
 * herkenbaar blijven.
 */
function vindKolomIndex(headerRij: unknown[], mogelijkeNamen: string[]): number {
  return headerRij.findIndex((cel) =>
    mogelijkeNamen.some((naam) => String(cel).trim().toLowerCase() === naam.toLowerCase()),
  )
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
 * datamodel. Kolommen worden herkend op headertekst (zie vindKolomIndex),
 * niet op een vaste positie — bestanden met een afwijkende kolomvolgorde
 * worden zo nog steeds correct gelezen.
 */
export function parseerActies(
  rijen: unknown[][],
  teamleden: readonly string[],
): GeimporteerdeActie[] {
  const headerIndex = vindHeaderRij(rijen)
  if (headerIndex === -1) return []

  const headerRij = rijen[headerIndex]
  const kolomRef = vindKolomIndex(headerRij, ['ref'])
  const kolomDatum = vindKolomIndex(headerRij, ['datum'])
  const kolomOnderwerp = vindKolomIndex(headerRij, ['onderwerp'])
  const kolomBedrijf = vindKolomIndex(headerRij, ['bedrijf'])
  const kolomVestiging = vindKolomIndex(headerRij, ['vestiging'])
  const kolomActiepunt = vindKolomIndex(headerRij, ['actiepunt'])
  const kolomVerantw = vindKolomIndex(headerRij, ['verantw.', 'verantw'])
  const kolomGereedOp = vindKolomIndex(headerRij, ['gereed op'])
  const kolomStatus = vindKolomIndex(headerRij, ['status'])
  const kolomInformant = vindKolomIndex(headerRij, ['informant'])
  const kolomOpmerking = vindKolomIndex(headerRij, ['opmerking'])

  const resultaat: GeimporteerdeActie[] = []

  for (let r = headerIndex + 1; r < rijen.length; r++) {
    const rij = rijen[r] ?? []
    const ref = rij[kolomRef]
    // De echte datatabel is aaneengesloten; zodra de Ref-kolom leeg is, is
    // dat het einde van de data (de rest van het blad is lege opmaak-rommel).
    if (ref === undefined || ref === null || ref === '') break

    const informant = String(rij[kolomInformant] ?? '').trim()
    const opmerking = String(rij[kolomOpmerking] ?? '').trim()

    resultaat.push({
      ref: String(ref),
      aangemaaktOp: naarIsoDatum(rij[kolomDatum]) ?? new Date().toISOString().slice(0, 10),
      onderwerp: String(rij[kolomOnderwerp] ?? ''),
      bedrijf: String(rij[kolomBedrijf] ?? ''),
      vestiging: String(rij[kolomVestiging] ?? ''),
      actie: String(rij[kolomActiepunt] ?? ''),
      verantw: parseVerantw(rij[kolomVerantw], teamleden),
      dueDateOverride: naarIsoDatum(rij[kolomGereedOp]),
      status: parseStatus(rij[kolomStatus]),
      opmerking: informant ? `Informant: ${informant} — ${opmerking}` : opmerking,
    })
  }

  return resultaat
}

/**
 * Historische afgeronde acties (status "done") voegen niets toe aan een
 * actieve actielijst — alleen open acties worden daadwerkelijk geïmporteerd.
 * Het aantal overgeslagen acties wordt teruggegeven zodat de gebruiker kan
 * zien dat er bewust iets is weggelaten, niet dat de import onvolledig is.
 */
export function filterOpenActies(acties: GeimporteerdeActie[]): {
  open: GeimporteerdeActie[]
  overgeslagen: number
} {
  const open = acties.filter((actie) => actie.status === 'open')
  return { open, overgeslagen: acties.length - open.length }
}
