import { render, screen } from '@testing-library/react'
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

vi.mock('../../components/useToast', () => ({
  useToast: () => vi.fn(),
}))

vi.mock('./useAlleActies', () => ({
  useAlleActies: () => ({ acties: ACTIES, loading: false }),
}))

// ActieRij (gerenderd door MijnActiesPage) importeert updateActie/deleteActie/
// uitstellen rechtstreeks als module-level exports van useActies.ts.
vi.mock('./useActies', () => ({
  updateActie: vi.fn(),
  deleteActie: vi.fn(),
  uitstellen: vi.fn(),
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

vi.mock('../panden/usePanden', () => ({
  useAllePanden: () => ({ panden: [], loading: false }),
  usePanden: () => ({ panden: [], loading: false }),
}))

const onSelectKlant = vi.fn()
const onNavigeerNaarBron = vi.fn()

function renderPagina(voorgeselecteerdTeamlid?: 'Ton' | 'Seth' | 'Gertjan' | 'Marjan' | 'Eigenaar') {
  return render(
    <MijnActiesPage
      voorgeselecteerdTeamlid={voorgeselecteerdTeamlid}
      onSelectKlant={onSelectKlant}
      onNavigeerNaarBron={onNavigeerNaarBron}
    />,
  )
}

describe('MijnActiesPage', () => {
  it('toont voor elk teamlid een open- en due-telling', () => {
    renderPagina()

    const tonKnop = screen.getByRole('button', { name: /Ton/ })
    // Ton: 2 open (Schilderwerk 2999 + Onderhoud 2020, due-acties tellen mee bij "open")
    // en 1 due (Onderhoud) — Dak telt niet mee (done).
    expect(tonKnop).toHaveTextContent('2 open')
    expect(tonKnop).toHaveTextContent('1 due')

    const sethKnop = screen.getByRole('button', { name: /Seth/ })
    expect(sethKnop).toHaveTextContent('1 open')
  })

  it('toont bij het kiezen van een teamlid diens openstaande acties, gegroepeerd per klant, als volledige actielijst-tabel', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(screen.getByRole('button', { name: /Ton/ }))

    expect(screen.getByRole('button', { name: 'Malcon →' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Offerte opvragen')).toBeInTheDocument()
    // Dak-actie is done, hoort niet bij "openstaand" en dus niet bij klant Bowog hier.
    expect(screen.queryByRole('button', { name: 'Bowog →' })).not.toBeInTheDocument()
    expect(screen.queryByDisplayValue('Lekkage verhelpen')).not.toBeInTheDocument()
  })

  it('toont direct het detail van het voorgeselecteerde teamlid', () => {
    renderPagina('Ton')

    expect(screen.getByText('Acties voor Ton')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
  })

  it('markeert een verlopen open actie als Due', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(screen.getByRole('button', { name: /Ton/ }))

    expect(
      screen.getByLabelText('Status voor Lift laten keuren'),
    ).toHaveDisplayValue('Due')
  })

  it('toont een lege staat als het teamlid geen openstaande acties heeft', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(screen.getByRole('button', { name: /Marjan/ }))

    expect(screen.getByText('Geen openstaande acties voor Marjan.')).toBeInTheDocument()
  })

  it('roept onSelectKlant aan bij klikken op de klantgroep-titel', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(screen.getByRole('button', { name: /Ton/ }))
    await user.click(screen.getByRole('button', { name: 'Malcon →' }))

    expect(onSelectKlant).toHaveBeenCalledWith({ id: 'klant-1', naam: 'Malcon', aangemaaktOp: 1 })
  })
})
