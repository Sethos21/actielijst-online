import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OnderhoudTab } from './OnderhoudTab'

const addOnderhoud = vi.fn()
const vinkAf = vi.fn()
const voegTypeToe = vi.fn()
const verwijderType = vi.fn()

let mockOnderhoud: {
  id: string
  naam: string
  verantw: string
  leverancier?: string
  herhaling: string
  laatstUitgevoerdOp?: number
  volgendeDatum: number
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
    vinkAf,
    onderhoudDueCount: 0,
  }),
}))

vi.mock('./useOnderhoudStandaardlijst', () => ({
  useOnderhoudStandaardlijst: () => ({
    types: mockStandaardTypes,
    loading: false,
    voegTypeToe,
    verwijderType,
  }),
}))

const addActie = vi.fn()
vi.mock('../acties/useActies', () => ({
  useActies: () => ({ addActie }),
}))

function renderTab() {
  return render(
    <OnderhoudTab pandId="p1" klantId="klant-1" pandNaam="Hoofdstraat 12" />,
  )
}

describe('OnderhoudTab', () => {
  afterEach(() => {
    mockOnderhoud = []
    addOnderhoud.mockClear()
    vinkAf.mockClear()
    voegTypeToe.mockClear()
    verwijderType.mockClear()
    addActie.mockClear()
  })

  it('toont een lege staat als er nog geen onderhoudsitems zijn', () => {
    renderTab()
    expect(screen.getByText('Nog geen onderhoudsitems.')).toBeInTheDocument()
  })

  it('toont due/gepland/ok-status met de juiste labels en kleurklassen', () => {
    const nu = Date.now()
    const dag = 24 * 60 * 60 * 1000
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        leverancier: 'Bakker Installatietechniek',
        herhaling: 'jaarlijks',
        laatstUitgevoerdOp: new Date('2025-01-14').getTime(),
        volgendeDatum: nu - dag,
      },
      {
        id: '2',
        naam: 'Dakinspectie',
        verantw: 'Gertjan',
        herhaling: 'jaarlijks',
        volgendeDatum: nu + 20 * dag,
      },
      {
        id: '3',
        naam: 'Brandblusser controle',
        verantw: 'Seth',
        herhaling: 'jaarlijks',
        volgendeDatum: nu + 100 * dag,
      },
    ]
    renderTab()

    expect(screen.getByText('Due')).toBeInTheDocument()
    expect(screen.getByText('Over 3 weken')).toBeInTheDocument()
    expect(screen.getByText('Op schema')).toBeInTheDocument()
    expect(
      screen.getByText('Leverancier: Bakker Installatietechniek · Laatst uitgevoerd: 14 jan 2025'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Nog niet uitgevoerd')).toHaveLength(2)

    // Alleen het "op schema"-item toont als afgevinkt/doorgestreept.
    expect(screen.getByText('Brandblusser controle')).toHaveClass('gedaan')
    expect(screen.getByText('CV-ketel onderhoud')).not.toHaveClass('gedaan')
  })

  it('vinkt een item af bij klikken op het vinkje', async () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        volgendeDatum: Date.now() - 1000,
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByLabelText('Afvinken: CV-ketel onderhoud'))
    expect(vinkAf).toHaveBeenCalledWith('1')
  })

  it('opent het toevoegen-paneel en toont de standaardlijst, met al-gekoppelde items uitgegrijsd', async () => {
    mockOnderhoud = [
      {
        id: '1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        volgendeDatum: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Item toevoegen' }))

    expect(screen.getByText('al gekoppeld aan dit pand')).toBeInTheDocument()
    const cvKetelCheckbox = screen.getByRole('checkbox', { name: /CV-ketel onderhoud/ })
    expect(cvKetelCheckbox).toBeDisabled()

    const dakinspectieCheckbox = screen.getByRole('checkbox', { name: /Dakinspectie/ })
    expect(dakinspectieCheckbox).not.toBeDisabled()
  })

  it('voegt een geselecteerd standaardtype toe met leverancier en verantwoordelijke', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Item toevoegen' }))
    await user.click(screen.getByRole('checkbox', { name: /Dakinspectie/ }))
    await user.type(
      screen.getByLabelText('Leverancier voor Dakinspectie'),
      'Dakdekkersbedrijf Van Els',
    )
    await user.selectOptions(
      screen.getByLabelText('Verantwoordelijke voor onderhoudsitem'),
      'Gertjan',
    )
    await user.click(
      screen.getByRole('button', { name: '1 item toevoegen aan dit pand' }),
    )

    expect(addOnderhoud).toHaveBeenCalledWith({
      naam: 'Dakinspectie',
      verantw: 'Gertjan',
      klantId: 'klant-1',
      leverancier: 'Dakdekkersbedrijf Van Els',
    })
  })

  it('maakt een actie aan vanuit een onderhoudsitem, met pand en herkomst gevuld', async () => {
    mockOnderhoud = [
      {
        id: 'o1',
        naam: 'CV-ketel onderhoud',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        volgendeDatum: Date.now() - 1000,
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
})
