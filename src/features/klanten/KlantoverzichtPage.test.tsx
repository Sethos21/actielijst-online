import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KlantoverzichtPage } from './KlantoverzichtPage'

const addKlant = vi.fn()
const onSelectKlant = vi.fn()
const onImporteren = vi.fn()

vi.mock('./useKlanten', () => ({
  useKlanten: () => ({
    klanten: [
      { id: '1', naam: 'Malcon', aangemaaktOp: 1 },
      { id: '2', naam: 'Basisweg BV', aangemaaktOp: 2 },
    ],
    loading: false,
    addKlant,
  }),
}))

vi.mock('../acties/useActieStats', () => ({
  useActieStats: () => ({
    '1': { open: 3, due: 1 },
  }),
}))

describe('KlantoverzichtPage', () => {
  it('toont klanten met hun open/due-badges en filtert op zoekterm', async () => {
    const user = userEvent.setup()
    render(
      <KlantoverzichtPage
        onSelectKlant={onSelectKlant}
        onImporteren={onImporteren}
      />,
    )

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.getByText('Basisweg BV')).toBeInTheDocument()
    expect(screen.getByText('3 open')).toBeInTheDocument()
    expect(screen.getByText('1 due')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Zoek klant'), 'malcon')

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.queryByText('Basisweg BV')).not.toBeInTheDocument()
  })

  it('selecteert een klant bij klikken', async () => {
    const user = userEvent.setup()
    render(
      <KlantoverzichtPage
        onSelectKlant={onSelectKlant}
        onImporteren={onImporteren}
      />,
    )

    await user.click(screen.getByText('Malcon'))

    expect(onSelectKlant).toHaveBeenCalledWith({
      id: '1',
      naam: 'Malcon',
      aangemaaktOp: 1,
    })
  })
})
