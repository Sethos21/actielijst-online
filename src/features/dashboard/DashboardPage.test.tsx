import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import type { ActieItem } from '../acties/types'

const ACTIES: ActieItem[] = [
  {
    id: '1',
    klantId: 'klant-1',
    ref: '1',
    onderwerp: 'Onderhoud',
    bedrijf: '',
    vestiging: '',
    actie: 'Lift laten keuren',
    verantw: ['Ton'],
    aangemaaktOp: '2020-01-01',
    doorlooptijd: '1w',
    status: 'open',
    opmerking: '',
  },
  {
    id: '2',
    klantId: 'klant-1',
    ref: '2',
    onderwerp: 'Schilderwerk',
    bedrijf: '',
    vestiging: '',
    actie: 'Offerte opvragen',
    verantw: ['Seth'],
    aangemaaktOp: '2999-01-01',
    doorlooptijd: '1w',
    status: 'open',
    opmerking: '',
  },
  {
    id: '3',
    klantId: 'klant-2',
    ref: '3',
    onderwerp: 'Dak',
    bedrijf: '',
    vestiging: '',
    actie: 'Lekkage verhelpen',
    verantw: ['Ton'],
    aangemaaktOp: '2020-01-01',
    doorlooptijd: '1w',
    status: 'done',
    opmerking: '',
  },
]

vi.mock('../acties/useAlleActies', () => ({
  useAlleActies: () => ({ acties: ACTIES, loading: false }),
}))

const KLANTEN = [
  { id: 'klant-1', naam: 'Malcon', aangemaaktOp: 1 },
  { id: 'klant-2', naam: 'Bowog', aangemaaktOp: 2 },
]

vi.mock('../klanten/useKlanten', () => ({
  useKlanten: () => ({ klanten: KLANTEN, loading: false }),
}))

describe('DashboardPage', () => {
  it('toont de totalen (open, due, afgerond) over alle klanten heen', () => {
    render(<DashboardPage onSelectKlant={vi.fn()} onSelectTeamlid={vi.fn()} />)

    expect(screen.getByText('Totaal open (alle klanten)').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('Totaal due').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Totaal afgerond').nextSibling).toHaveTextContent('1')
  })

  it('toont per klant de open/due/done-tellingen', () => {
    render(<DashboardPage onSelectKlant={vi.fn()} onSelectTeamlid={vi.fn()} />)

    const malconRij = screen.getByText('Malcon').closest('.dashboard-klant-rij') as HTMLElement
    expect(within(malconRij).getByText('2 open')).toBeInTheDocument()
    expect(within(malconRij).getByText('1 due')).toBeInTheDocument()

    const bowogRij = screen.getByText('Bowog').closest('.dashboard-klant-rij') as HTMLElement
    expect(within(bowogRij).getByText('0 open')).toBeInTheDocument()
    expect(within(bowogRij).getByText('0 due')).toBeInTheDocument()
    expect(within(bowogRij).getByText('1 done')).toBeInTheDocument()
  })

  it('roept onSelectKlant aan bij klikken op een klantrij', async () => {
    const user = userEvent.setup()
    const onSelectKlant = vi.fn()
    render(<DashboardPage onSelectKlant={onSelectKlant} onSelectTeamlid={vi.fn()} />)

    await user.click(screen.getByText('Malcon'))

    expect(onSelectKlant).toHaveBeenCalledWith(KLANTEN[0])
  })

  it('toont per teamlid de open/due-tellingen', () => {
    render(<DashboardPage onSelectKlant={vi.fn()} onSelectTeamlid={vi.fn()} />)

    const tonKaart = screen.getByText('Ton').closest('.dashboard-teamlid-kaart') as HTMLElement
    expect(within(tonKaart).getByText('1')).toBeInTheDocument()
    expect(within(tonKaart).getByText('1 due')).toBeInTheDocument()

    const marjanKaart = screen.getByText('Marjan').closest('.dashboard-teamlid-kaart') as HTMLElement
    expect(within(marjanKaart).getByText('0')).toBeInTheDocument()
    expect(within(marjanKaart).queryByText(/due/)).not.toBeInTheDocument()
  })

  it('roept onSelectTeamlid aan bij klikken op een teamlid-kaart', async () => {
    const user = userEvent.setup()
    const onSelectTeamlid = vi.fn()
    render(<DashboardPage onSelectKlant={vi.fn()} onSelectTeamlid={onSelectTeamlid} />)

    await user.click(screen.getByText('Ton'))

    expect(onSelectTeamlid).toHaveBeenCalledWith('Ton')
  })

  it('toont "Open acties per teamlid" vóór "Open acties per klant"', () => {
    render(<DashboardPage onSelectKlant={vi.fn()} onSelectTeamlid={vi.fn()} />)

    const koppen = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(koppen).toEqual(['Open acties per teamlid', 'Open acties per klant'])
  })
})
