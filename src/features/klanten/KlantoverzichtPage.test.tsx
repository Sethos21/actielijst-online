import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KlantoverzichtPage } from './KlantoverzichtPage'

const addKlant = vi.fn()
const onSelectKlant = vi.fn()

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

describe('KlantoverzichtPage', () => {
  it('toont klanten en filtert op zoekterm', async () => {
    const user = userEvent.setup()
    render(<KlantoverzichtPage onSelectKlant={onSelectKlant} />)

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.getByText('Basisweg BV')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Zoek klant'), 'malcon')

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.queryByText('Basisweg BV')).not.toBeInTheDocument()
  })

  it('selecteert een klant bij klikken', async () => {
    const user = userEvent.setup()
    render(<KlantoverzichtPage onSelectKlant={onSelectKlant} />)

    await user.click(screen.getByText('Malcon'))

    expect(onSelectKlant).toHaveBeenCalledWith({
      id: '1',
      naam: 'Malcon',
      aangemaaktOp: 1,
    })
  })
})
