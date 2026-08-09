import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PandenOverzichtPage } from './PandenOverzichtPage'

const onTerug = vi.fn()
const onSelectPand = vi.fn()

let mockPanden: {
  id: string
  klantId: string
  naam: string
  aangemaaktOp: number
  gearchiveerdOp?: number
}[] = []
let mockOnderhoud: {
  id: string
  pandId: string
  volgendeDatum: number
  gearchiveerdOp?: number
}[] = []

vi.mock('./usePanden', () => ({
  useAllePanden: () => ({ panden: mockPanden, loading: false }),
}))

vi.mock('../klanten/useKlanten', () => ({
  useKlanten: () => ({
    klanten: [
      { id: 'klant-1', naam: 'Malcon', aangemaaktOp: 1 },
      { id: 'klant-2', naam: 'Basisweg BV', aangemaaktOp: 2 },
    ],
    loading: false,
  }),
}))

vi.mock('../onderhoud/useOnderhoud', () => ({
  useAlleOnderhoud: () => ({ onderhoud: mockOnderhoud, loading: false }),
}))

function renderScherm() {
  return render(<PandenOverzichtPage onTerug={onTerug} onSelectPand={onSelectPand} />)
}

describe('PandenOverzichtPage', () => {
  afterEach(() => {
    mockPanden = []
    mockOnderhoud = []
    onTerug.mockClear()
    onSelectPand.mockClear()
  })

  it('toont panden met hun klantnaam en filtert op zoekterm', async () => {
    mockPanden = [
      { id: 'p1', klantId: 'klant-1', naam: 'Hoofdstraat 12', aangemaaktOp: 1 },
      { id: 'p2', klantId: 'klant-2', naam: 'Kerkstraat 3', aangemaaktOp: 2 },
    ]
    const user = userEvent.setup()
    renderScherm()

    expect(screen.getByText('🏠 Hoofdstraat 12')).toBeInTheDocument()
    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.getByText('🏠 Kerkstraat 3')).toBeInTheDocument()
    expect(screen.getByText('Basisweg BV')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Zoek pand of klant'), 'hoofdstraat')

    expect(screen.getByText('🏠 Hoofdstraat 12')).toBeInTheDocument()
    expect(screen.queryByText('🏠 Kerkstraat 3')).not.toBeInTheDocument()
  })

  it('verbergt gearchiveerde panden', () => {
    mockPanden = [
      {
        id: 'p1',
        klantId: 'klant-1',
        naam: 'Hoofdstraat 12',
        aangemaaktOp: 1,
        gearchiveerdOp: Date.now(),
      },
    ]
    renderScherm()

    expect(screen.getByText('Geen panden gevonden.')).toBeInTheDocument()
  })

  it('toont een due-badge met het aantal openstaande onderhoudsitems per pand', () => {
    mockPanden = [{ id: 'p1', klantId: 'klant-1', naam: 'Hoofdstraat 12', aangemaaktOp: 1 }]
    mockOnderhoud = [
      { id: 'o1', pandId: 'p1', volgendeDatum: Date.now() - 1000 },
      { id: 'o2', pandId: 'p1', volgendeDatum: Date.now() + 1000 * 60 * 60 * 24 * 100 },
    ]
    renderScherm()

    expect(screen.getByText('1 due')).toBeInTheDocument()
  })

  it('roept onSelectPand aan met het pand en de bijbehorende klant bij klikken op een rij', async () => {
    mockPanden = [{ id: 'p1', klantId: 'klant-1', naam: 'Hoofdstraat 12', aangemaaktOp: 1 }]
    const user = userEvent.setup()
    renderScherm()

    await user.click(screen.getByText('🏠 Hoofdstraat 12'))

    expect(onSelectPand).toHaveBeenCalledWith(
      { id: 'p1', klantId: 'klant-1', naam: 'Hoofdstraat 12', aangemaaktOp: 1 },
      { id: 'klant-1', naam: 'Malcon', aangemaaktOp: 1 },
    )
  })

  it('roept onTerug aan bij klikken op de terug-knop', async () => {
    const user = userEvent.setup()
    renderScherm()

    await user.click(screen.getByRole('button', { name: '← Terug naar start' }))
    expect(onTerug).toHaveBeenCalledOnce()
  })
})
