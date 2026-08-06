import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OnderhoudTab } from './OnderhoudTab'

const addOnderhoud = vi.fn()
const vinkAf = vi.fn()

let mockOnderhoud: {
  id: string
  naam: string
  verantw: string
  herhaling: string
  laatstUitgevoerdOp?: number
  volgendeDatum: number
}[] = []

vi.mock('./useOnderhoud', () => ({
  useOnderhoud: () => ({
    onderhoud: mockOnderhoud,
    loading: false,
    addOnderhoud,
    vinkAf,
    onderhoudDueCount: 0,
  }),
}))

function renderTab() {
  return render(<OnderhoudTab pandId="p1" klantId="klant-1" />)
}

describe('OnderhoudTab', () => {
  afterEach(() => {
    mockOnderhoud = []
    addOnderhoud.mockClear()
    vinkAf.mockClear()
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
    expect(screen.getByText('Laatst uitgevoerd: 14 jan 2025 · Verantwoordelijke: Ton')).toBeInTheDocument()

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

  it('opent het formulier en voegt een nieuw onderhoudsitem toe', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Item toevoegen' }))
    await user.type(
      screen.getByLabelText('Naam onderhoudsitem'),
      'Rookmelders controle',
    )
    await user.selectOptions(
      screen.getByLabelText('Verantwoordelijke voor onderhoudsitem'),
      'Seth',
    )
    await user.click(screen.getByRole('button', { name: 'Toevoegen' }))

    expect(addOnderhoud).toHaveBeenCalledWith({
      naam: 'Rookmelders controle',
      verantw: 'Seth',
      klantId: 'klant-1',
    })
  })
})
