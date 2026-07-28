import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ActielijstPage } from './ActielijstPage'

vi.mock('./useActies', () => ({
  useActies: () => ({
    acties: [
      {
        id: '1',
        klantId: 'klant-1',
        ref: 'A1',
        onderwerp: 'Onderhoud',
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
    expect(screen.getByText('Due')).toBeInTheDocument()
  })

  it('markeert een on-hold actie nooit als Due, ondanks verlopen datum', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    // Er is precies 1 "Due"-badge: de on-hold actie (zelfde verlopen datum) telt niet mee.
    expect(screen.getAllByText('Due')).toHaveLength(1)
  })
})
