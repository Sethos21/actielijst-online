import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ArchiefPage } from './ArchiefPage'
import type { ArchiefItem } from './types'

const KLANTEN = [{ id: 'k1', naam: 'Malcon B.V.', aangemaaktOp: 1 }]
const PANDEN = [{ id: 'p1', klantId: 'k1', naam: 'Hoofdstraat 12, Vlijmen', aangemaaktOp: 1 }]

let mockItems: Record<string, ArchiefItem[]> = {
  pand: [],
  onderhoud: [],
  document: [],
  mjop: [],
  klant: [],
}

function alleItems() {
  return Object.values(mockItems)
    .flat()
    .sort((a, b) => b.gearchiveerdOp - a.gearchiveerdOp)
}

vi.mock('./useArchief', () => ({
  useArchief: () => ({ items: mockItems, alleItems: alleItems(), loading: false }),
}))

const herstelKlant = vi.fn()
const verwijderKlantDefinitief = vi.fn()
vi.mock('../klanten/useKlanten', () => ({
  useKlanten: () => ({ klanten: KLANTEN, loading: false }),
  herstelKlant: (id: string) => herstelKlant(id),
  verwijderKlantDefinitief: (id: string) => verwijderKlantDefinitief(id),
}))

const herstelPand = vi.fn()
const verwijderPandDefinitief = vi.fn()
vi.mock('../panden/usePanden', () => ({
  useAllePanden: () => ({ panden: PANDEN, loading: false }),
  herstelPand: (id: string) => herstelPand(id),
  verwijderPandDefinitief: (id: string) => verwijderPandDefinitief(id),
}))

const herstelOnderhoud = vi.fn()
const verwijderOnderhoudDefinitief = vi.fn()
vi.mock('../onderhoud/useOnderhoud', () => ({
  herstelOnderhoud: (id: string) => herstelOnderhoud(id),
  verwijderOnderhoudDefinitief: (id: string) => verwijderOnderhoudDefinitief(id),
}))

const herstelDocument = vi.fn()
const verwijderDocumentDefinitief = vi.fn()
vi.mock('../documenten/useDocumenten', () => ({
  herstelDocument: (id: string) => herstelDocument(id),
  verwijderDocumentDefinitief: (id: string, storagePath: string) =>
    verwijderDocumentDefinitief(id, storagePath),
}))

const herstelMjopPost = vi.fn()
const verwijderMjopPostDefinitief = vi.fn()
vi.mock('../mjop/useMjop', () => ({
  herstelMjopPost: (id: string) => herstelMjopPost(id),
  verwijderMjopPostDefinitief: (id: string) => verwijderMjopPostDefinitief(id),
}))

const exporteerArchiefNaarExcel = vi.fn()
const exporteerArchiefNaarJson = vi.fn()
vi.mock('./archiefExport', () => ({
  exporteerArchiefNaarExcel: (items: ArchiefItem[]) => exporteerArchiefNaarExcel(items),
  exporteerArchiefNaarJson: (items: ArchiefItem[]) => exporteerArchiefNaarJson(items),
}))

const bevestigMetWachtwoord = vi.fn()
vi.mock('../auth/useReauthenticatie', () => ({
  bevestigMetWachtwoord: (wachtwoord: string) => bevestigMetWachtwoord(wachtwoord),
}))

function pandItem(overrides: Partial<ArchiefItem> = {}): ArchiefItem {
  return {
    id: 'i1',
    type: 'pand',
    naam: 'Molenweg 7, Gemert',
    klantId: 'k1',
    klantNaam: '',
    gearchiveerdOp: new Date('2026-07-03').getTime(),
    gearchiveerdDoor: 'Seth',
    gearchiveerdReden: 'verkocht',
    ...overrides,
  }
}

function onderhoudItem(overrides: Partial<ArchiefItem> = {}): ArchiefItem {
  return {
    id: 'i2',
    type: 'onderhoud',
    naam: 'Deurautomaat onderhoud',
    klantId: 'k1',
    klantNaam: '',
    pandId: 'p1',
    gearchiveerdOp: new Date('2026-06-12').getTime(),
    gearchiveerdDoor: 'Ton',
    ...overrides,
  }
}

function klantItem(overrides: Partial<ArchiefItem> = {}): ArchiefItem {
  return {
    id: 'k1',
    type: 'klant',
    naam: 'Malcon B.V.',
    klantId: 'k1',
    klantNaam: '',
    gearchiveerdOp: new Date('2026-05-01').getTime(),
    gearchiveerdDoor: 'Seth',
    ...overrides,
  }
}

describe('ArchiefPage', () => {
  afterEach(() => {
    mockItems = { pand: [], onderhoud: [], document: [], mjop: [], klant: [] }
    vi.clearAllMocks()
  })

  it('toont een lege staat als er niets gearchiveerd is', () => {
    render(<ArchiefPage />)
    expect(screen.getByText('Niets gearchiveerd.')).toBeInTheDocument()
  })

  it('toont gearchiveerde items met klant/pand, datum, wie en reden', () => {
    mockItems = { pand: [pandItem()], onderhoud: [onderhoudItem()], document: [], mjop: [], klant: [] }
    render(<ArchiefPage />)

    expect(screen.getByText('Molenweg 7, Gemert')).toBeInTheDocument()
    expect(
      screen.getByText('Malcon B.V. · Gearchiveerd 3 juli 2026 door Seth · verkocht'),
    ).toBeInTheDocument()

    expect(screen.getByText('Deurautomaat onderhoud')).toBeInTheDocument()
    expect(
      screen.getByText('Hoofdstraat 12, Vlijmen · Gearchiveerd 12 juni 2026 door Ton'),
    ).toBeInTheDocument()
  })

  it('filtert op type via de filtertabs', async () => {
    mockItems = { pand: [pandItem()], onderhoud: [onderhoudItem()], document: [], mjop: [], klant: [] }
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.click(screen.getByRole('button', { name: /🏠 Panden/ }))

    expect(screen.getByText('Molenweg 7, Gemert')).toBeInTheDocument()
    expect(screen.queryByText('Deurautomaat onderhoud')).not.toBeInTheDocument()
  })

  it('filtert op zoekterm', async () => {
    mockItems = { pand: [pandItem()], onderhoud: [onderhoudItem()], document: [], mjop: [], klant: [] }
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.type(screen.getByLabelText('Zoek in archief'), 'deurautomaat')

    expect(screen.queryByText('Molenweg 7, Gemert')).not.toBeInTheDocument()
    expect(screen.getByText('Deurautomaat onderhoud')).toBeInTheDocument()
  })

  it('herstelt een item via de Herstellen-knop, gebruikmakend van de juiste module', async () => {
    mockItems = { pand: [], onderhoud: [onderhoudItem()], document: [], mjop: [], klant: [] }
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.click(screen.getByRole('button', { name: '↺ Herstellen' }))

    expect(herstelOnderhoud).toHaveBeenCalledWith('i2')
  })

  it('vraagt wachtwoordbevestiging voor definitief verwijderen en roept dan de juiste functie aan', async () => {
    mockItems = {
      pand: [],
      onderhoud: [],
      document: [
        {
          id: 'd1',
          type: 'document',
          naam: 'Oud_energielabel_2019.pdf',
          klantId: 'k1',
          klantNaam: '',
          pandId: 'p1',
          storagePath: 'panden/p1/oud.pdf',
          gearchiveerdOp: Date.now(),
        },
      ],
      mjop: [],
      klant: [],
    }
    bevestigMetWachtwoord.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.click(screen.getByRole('button', { name: '🗑 Definitief' }))
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText(/Oud_energielabel_2019\.pdf/)).toBeInTheDocument()

    await user.type(within(modal).getByLabelText('Bevestig met je inlogwachtwoord'), 'geheim123')
    await user.click(within(modal).getByRole('button', { name: 'Definitief verwijderen' }))

    expect(bevestigMetWachtwoord).toHaveBeenCalledWith('geheim123')
    expect(verwijderDocumentDefinitief).toHaveBeenCalledWith('d1', 'panden/p1/oud.pdf')
  })

  it('exporteert de huidige gefilterde lijst naar Excel en JSON', async () => {
    mockItems = { pand: [pandItem()], onderhoud: [onderhoudItem()], document: [], mjop: [], klant: [] }
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.click(screen.getByRole('button', { name: /🏠 Panden/ }))
    await user.click(screen.getByRole('button', { name: '⬇ Excel' }))
    await user.click(screen.getByRole('button', { name: '⬇ JSON' }))

    expect(exporteerArchiefNaarExcel).toHaveBeenCalledOnce()
    expect(exporteerArchiefNaarExcel.mock.calls[0][0]).toHaveLength(1)
    expect(exporteerArchiefNaarJson).toHaveBeenCalledOnce()
  })

  it('toont een gearchiveerde klant zonder klant-/pandprefix in de metaregel', () => {
    mockItems = { pand: [], onderhoud: [], document: [], mjop: [], klant: [klantItem()] }
    render(<ArchiefPage />)

    expect(screen.getByText('Malcon B.V.')).toBeInTheDocument()
    expect(screen.getByText('Gearchiveerd 1 mei 2026 door Seth')).toBeInTheDocument()
  })

  it('filtert op het klant-type via de filtertabs', async () => {
    mockItems = { pand: [pandItem()], onderhoud: [], document: [], mjop: [], klant: [klantItem()] }
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.click(screen.getByRole('button', { name: /👤 Klanten/ }))

    expect(screen.getAllByText('Malcon B.V.')).toHaveLength(1)
    expect(screen.queryByText('Molenweg 7, Gemert')).not.toBeInTheDocument()
  })

  it('herstelt een gearchiveerde klant via de Herstellen-knop', async () => {
    mockItems = { pand: [], onderhoud: [], document: [], mjop: [], klant: [klantItem()] }
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.click(screen.getByRole('button', { name: '↺ Herstellen' }))

    expect(herstelKlant).toHaveBeenCalledWith('k1')
  })

  it('toont de foutmelding in de modal als een klant nog gekoppelde acties/panden heeft', async () => {
    mockItems = { pand: [], onderhoud: [], document: [], mjop: [], klant: [klantItem()] }
    bevestigMetWachtwoord.mockResolvedValueOnce(undefined)
    verwijderKlantDefinitief.mockRejectedValueOnce(
      new Error('Kan niet verwijderen: er zijn nog 3 acties gekoppeld aan deze klant.'),
    )
    const user = userEvent.setup()
    render(<ArchiefPage />)

    await user.click(screen.getByRole('button', { name: '🗑 Definitief' }))
    const modal = screen.getByRole('dialog')
    await user.type(within(modal).getByLabelText('Bevestig met je inlogwachtwoord'), 'geheim123')
    await user.click(within(modal).getByRole('button', { name: 'Definitief verwijderen' }))

    expect(
      within(modal).getByText('Kan niet verwijderen: er zijn nog 3 acties gekoppeld aan deze klant.'),
    ).toBeInTheDocument()
    // De modal blijft open zodat de gebruiker de foutmelding leest — geen
    // stille onSluiten() zoals bij een geslaagde verwijdering.
    expect(screen.queryByText('Definitief verwijderen?')).toBeInTheDocument()
  })
})
