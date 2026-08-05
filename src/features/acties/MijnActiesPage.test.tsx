import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MijnActiesPage } from './MijnActiesPage'
import type { ActieItem } from './types'

const ACTIES: ActieItem[] = [
  {
    id: '1',
    klantId: 'klant-1',
    ref: '1',
    onderwerp: 'Onderhoud',
    bedrijf: '',
    vestiging: 'Hoofdkantoor',
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
    verantw: ['Ton'],
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
  {
    id: '4',
    klantId: 'klant-2',
    ref: '4',
    onderwerp: 'Vergunning',
    bedrijf: '',
    vestiging: '',
    actie: 'Bezwaar indienen',
    verantw: ['Seth'],
    aangemaaktOp: '2999-01-01',
    doorlooptijd: '1w',
    status: 'open',
    opmerking: '',
  },
]

vi.mock('./useAlleActies', () => ({
  useAlleActies: () => ({ acties: ACTIES, loading: false }),
}))

vi.mock('../klanten/useKlanten', () => ({
  useKlanten: () => ({
    klanten: [
      { id: 'klant-1', naam: 'Malcon', aangemaaktOp: 1 },
      { id: 'klant-2', naam: 'Bowog', aangemaaktOp: 2 },
    ],
    loading: false,
  }),
}))

describe('MijnActiesPage', () => {
  it('toont voor elk teamlid een open- en due-telling', () => {
    render(<MijnActiesPage />)

    const tonKnop = screen.getByRole('button', { name: /Ton/ })
    // Ton: 1 open-niet-due (Schilderwerk, 2999) + 1 due (Onderhoud, 2020) — Dak telt niet mee (done).
    expect(tonKnop).toHaveTextContent('1 open')
    expect(tonKnop).toHaveTextContent('1 due')

    const sethKnop = screen.getByRole('button', { name: /Seth/ })
    expect(sethKnop).toHaveTextContent('1 open')
  })

  it('toont bij het kiezen van een teamlid diens openstaande acties, gegroepeerd per klant', async () => {
    const user = userEvent.setup()
    render(<MijnActiesPage />)

    await user.click(screen.getByRole('button', { name: /Ton/ }))

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.getByText('Lift laten keuren')).toBeInTheDocument()
    expect(screen.getByText('Offerte opvragen')).toBeInTheDocument()
    // Dak-actie is done, hoort niet bij "openstaand" en dus niet bij klant Bowog hier.
    expect(screen.queryByText('Bowog')).not.toBeInTheDocument()
    expect(screen.queryByText('Lekkage verhelpen')).not.toBeInTheDocument()
  })

  it('markeert een verlopen open actie als Due', async () => {
    const user = userEvent.setup()
    render(<MijnActiesPage />)

    await user.click(screen.getByRole('button', { name: /Ton/ }))

    const kaart = screen.getByText('Lift laten keuren').closest('.mijn-acties-kaart') as HTMLElement
    expect(within(kaart).getByText('Due')).toBeInTheDocument()
  })

  it('toont een lege staat als het teamlid geen openstaande acties heeft', async () => {
    const user = userEvent.setup()
    render(<MijnActiesPage />)

    await user.click(screen.getByRole('button', { name: /Marjan/ }))

    expect(screen.getByText('Geen openstaande acties voor Marjan.')).toBeInTheDocument()
  })
})
