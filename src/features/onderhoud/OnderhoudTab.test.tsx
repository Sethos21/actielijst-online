import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OnderhoudTab } from './OnderhoudTab'

const addOnderhoud = vi.fn()
const markeerUitgevoerd = vi.fn()
const updateOnderhoud = vi.fn()
const archiveer = vi.fn()
const voegTypeToe = vi.fn()
const verwijderType = vi.fn()

let mockOnderhoud: {
  id: string
  naam: string
  verantw: string
  leverancier?: string
  herhaling: string
  status: string
  laatstUitgevoerdOp?: string
  jaar?: number
  volgendeDatum: number
  gearchiveerdOp?: number
}[] = []

let mockStandaardTypes: {
  id: string
  naam: string
  icoon: string
  herhaling: string
  aangemaaktOp: number
}[] = [
  { id: 't1', naam: 'CV-ketel onderhoud', icoon: '🔧', herhaling: 'jaarlijks', aangemaaktOp: 1 },
  { id: 't2', naam: 'Dakinspectie', icoon: '🏠', herhaling: 'jaarlijks', aangemaaktOp: 2 },
]

vi.mock('./useOnderhoud', () => ({
  useOnderhoud: () => ({
    onderhoud: mockOnderhoud,
    loading: false,
    addOnderhoud,
    markeerUitgevoerd,
    updateOnderhoud,
    archiveer,
    onderhoudDueCount: 0,
  }),
}))

vi.mock('./useOnderhoudStandaardlijst', () => ({
  useOnderhoudStandaardlijst: () => ({
    types: mockStandaardTypes,
    loading: false,
    voegTypeToe,
    verwijderType,
    vulMetVoorbeelden: vi.fn(),
  }),
}))

const addActie = vi.fn(async (_nieuw: Record<string, unknown>) => 'nieuwe-actie-1')
vi.mock('../acties/useActies', () => ({
  useActies: () => ({ addActie }),
}))

const onNavigeerNaarActie = vi.fn()

function renderTab() {
  return render(
    <OnderhoudTab
      pandId="p1"
      klantId="klant-1"
      pandNaam="Hoofdstraat 12"
      onNavigeerNaarActie={onNavigeerNaarActie}
    />,
  )
}

describe('OnderhoudTab', () => {
  afterEach(() => {
    mockOnderhoud = []
    addOnderhoud.mockClear()
    markeerUitgevoerd.mockClear()
    updateOnderhoud.mockClear()
    archiveer.mockClear()
    voegTypeToe.mockClear()
    verwijderType.mockClear()
    addActie.mockClear()
    onNavigeerNaarActie.mockClear()
    vi.restoreAllMocks()
  })

  it('toont een lege staat als er nog geen onderhoudsitems zijn', () => {
    renderTab()
    expect(screen.getByText('Nog geen onderhoudsitems.')).toBeInTheDocument()
  })

  it('toont status, herhaling, leverancier en jaartal per item', () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        leverancier: 'Bakker Installatietechniek',
        herhaling: 'jaarlijks',
        status: 'due',
        laatstUitgevoerdOp: '2025-01-14',
        jaar: 2026,
        volgendeDatum: Date.now(),
      },
      {
        id: '2',
        naam: 'Dakinspectie',
        verantw: 'Gertjan',
        herhaling: 'kwartaal',
        status: 'open',
        volgendeDatum: Date.now(),
      },
    ]
    renderTab()

    expect(screen.getByText('CV-ketel onderhoud (2026)')).toBeInTheDocument()
    expect(
      screen.getByText('Leverancier: Bakker Installatietechniek · Laatst uitgevoerd: 14 jan 2025'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nog niet uitgevoerd')).toBeInTheDocument()
    expect(screen.getByLabelText('Status voor CV-ketel onderhoud')).toHaveValue('due')
    expect(screen.getByLabelText('Status voor Dakinspectie')).toHaveValue('open')
    expect(screen.getByText('⟳ kwartaal')).toBeInTheDocument()
  })

  it('markeert een item als vandaag uitgevoerd bij klikken op het vinkje', async () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        status: 'due',
        volgendeDatum: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByLabelText('Vandaag uitgevoerd: CV-ketel onderhoud'))

    const vandaag = new Date().toISOString().slice(0, 10)
    expect(markeerUitgevoerd).toHaveBeenCalledWith('1', vandaag)
  })

  it('wijzigt de status via de select', async () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        status: 'open',
        volgendeDatum: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.selectOptions(
      screen.getByLabelText('Status voor CV-ketel onderhoud'),
      'due',
    )

    expect(updateOnderhoud).toHaveBeenCalledWith('1', { status: 'due' })
  })

  it('toont een automatisch-gereset-indicator voor voltooide items waarvan de periode verstreken is', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        status: 'voltooid',
        laatstUitgevoerdOp: '2025-03-01',
        volgendeDatum: Date.now(),
      },
    ]
    renderTab()

    expect(screen.getByText('🔄 automatisch gereset dit jaar')).toBeInTheDocument()
    expect(screen.getByLabelText('Status voor CV-ketel onderhoud')).toHaveValue('open')
    vi.useRealTimers()
  })

  it('opent het beheerscherm voor de standaardlijst', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '⚙ Beheren' }))

    expect(
      screen.getByRole('dialog', { name: 'Onderhoud-standaardlijst beheren' }),
    ).toBeInTheDocument()
    expect(screen.getByText('CV-ketel onderhoud')).toBeInTheDocument()
  })

  it('maakt een actie aan vanuit een onderhoudsitem, met pand en herkomst gevuld', async () => {
    mockOnderhoud = [
      {
        id: 'o1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        status: 'due',
        volgendeDatum: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Actie aanmaken' }))

    expect(addActie).toHaveBeenCalledOnce()
    const nieuweActie = addActie.mock.calls[0][0]
    expect(nieuweActie.onderwerp).toBe('CV-ketel onderhoud')
    expect(nieuweActie.pandId).toBe('p1')
    expect(nieuweActie.vestiging).toBe('Hoofdstraat 12')
    expect(nieuweActie.herkomst).toEqual({
      type: 'onderhoud',
      bronId: 'o1',
      label: 'CV-ketel onderhoud',
    })
    expect(onNavigeerNaarActie).toHaveBeenCalledWith('nieuwe-actie-1')
  })

  it('toont gearchiveerde onderhoudsitems niet', () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        status: 'open',
        volgendeDatum: Date.now(),
        gearchiveerdOp: Date.now(),
      },
    ]
    renderTab()
    expect(screen.getByText('Nog geen onderhoudsitems.')).toBeInTheDocument()
  })

  it('archiveert een item met opgegeven teamlid en reden', async () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        status: 'open',
        volgendeDatum: Date.now(),
      },
    ]
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Ton').mockReturnValueOnce('vervangen')
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByLabelText('Archiveren: CV-ketel onderhoud'))

    expect(archiveer).toHaveBeenCalledWith('1', 'Ton', 'vervangen')
  })

  it('bewerkt naam, leverancier, verantwoordelijke, herhaling, jaar en laatst uitgevoerd inline', async () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        leverancier: 'Oude leverancier',
        herhaling: 'jaarlijks',
        status: 'open',
        volgendeDatum: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByLabelText('Bewerken: CV-ketel onderhoud'))
    const naamInput = screen.getByLabelText('Naam bewerken voor CV-ketel onderhoud')
    await user.clear(naamInput)
    await user.type(naamInput, 'CV-ketel groot onderhoud')
    const leverancierInput = screen.getByLabelText(
      'Leverancier bewerken voor CV-ketel onderhoud',
    )
    await user.clear(leverancierInput)
    await user.type(leverancierInput, 'Nieuwe leverancier')
    await user.selectOptions(
      screen.getByLabelText('Verantwoordelijke bewerken voor CV-ketel onderhoud'),
      'Marjan',
    )
    await user.selectOptions(
      screen.getByLabelText('Herhaling bewerken voor CV-ketel onderhoud'),
      'halfjaarlijks',
    )
    await user.type(screen.getByLabelText('Jaar bewerken voor CV-ketel onderhoud'), '2027')
    const datumInput = screen.getByLabelText(
      'Laatst uitgevoerd bewerken voor CV-ketel onderhoud',
    )
    await user.type(datumInput, '2026-03-15')
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(updateOnderhoud).toHaveBeenCalledWith('1', {
      naam: 'CV-ketel groot onderhoud',
      verantw: 'Marjan',
      herhaling: 'halfjaarlijks',
      leverancier: 'Nieuwe leverancier',
      jaar: 2027,
      laatstUitgevoerdOp: '2026-03-15',
    })
  })
})
