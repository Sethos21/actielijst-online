import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActielijstPage } from './ActielijstPage'

vi.mock('../../components/useToast', () => ({
  useToast: () => vi.fn(),
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
})
