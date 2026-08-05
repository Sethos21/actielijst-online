import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActielijstPage } from './ActielijstPage'

vi.mock('../../components/useToast', () => ({
  useToast: () => vi.fn(),
}))

vi.mock('../versies/useVersies', () => ({
  useVersies: () => ({
    versies: [],
    loading: false,
    sluitVergaderingAf: vi.fn(),
  }),
}))

vi.mock('./useActies', () => ({
  useActies: () => ({
    acties: [
      {
        id: '1',
        klantId: 'klant-1',
        ref: 'A1',
        onderwerp: 'Onderhoud',
        bedrijf: 'Bowog Beheer B.V.',
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
        ref: 'A2',
        onderwerp: 'Onderhoud',
        bedrijf: 'Bowog Beheer B.V.',
        vestiging: 'Bijkantoor',
        actie: 'Op hold gezette actie',
        verantw: [],
        aangemaaktOp: '2020-01-01',
        doorlooptijd: '1w',
        status: 'hold',
        opmerking: '',
      },
    ],
    loading: false,
    addActie: vi.fn(),
    updateActie: vi.fn(),
    deleteActie: vi.fn(),
    uitstellen: vi.fn(),
  }),
}))

describe('ActielijstPage', () => {
  it('toont acties en markeert een verlopen open actie als Due', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(document.querySelectorAll('.badge-due')).toHaveLength(1)
  })

  it('markeert een on-hold actie nooit als Due, ondanks verlopen datum', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    // Er is precies 1 "Due"-badge: de on-hold actie (zelfde verlopen datum) telt niet mee.
    expect(document.querySelectorAll('.badge-due')).toHaveLength(1)
  })

  it('toont een avatar-chip per teamlid, actief voor de toegewezen verantwoordelijke', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    const tonChips = screen.getAllByLabelText('Ton')
    expect(tonChips[0]).toHaveClass('actief')
  })

  it('toont stat-cards met de juiste tellingen (open/due/afgerond/on hold)', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    const waarden = Array.from(document.querySelectorAll('.stat-waarde')).map(
      (el) => el.textContent,
    )
    expect(waarden).toEqual(['1', '1', '0', '1'])
  })

  it('filtert op zoekterm', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    await user.type(screen.getByLabelText('Zoeken in actielijst'), 'Hoofdkantoor')

    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()
  })

  it('filtert op een teamlid-pill', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    await user.click(screen.getByLabelText('Filter op Ton'))

    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()
  })

  it('de "Alle"-pil toont weer alle acties na filteren', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    await user.click(screen.getByLabelText('Filter op Ton'))
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alle' }))
    expect(screen.getByDisplayValue('Op hold gezette actie')).toBeInTheDocument()
  })
})
