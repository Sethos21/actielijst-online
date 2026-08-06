import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PandenPaneel } from './PandenPaneel'

const addPand = vi.fn()
const onSluiten = vi.fn()
const onSelectPand = vi.fn()

vi.mock('./usePanden', () => ({
  usePanden: () => ({
    panden: [
      { id: 'p1', klantId: 'klant-1', naam: 'Hoofdstraat 12', aangemaaktOp: 1 },
      { id: 'p2', klantId: 'klant-1', naam: 'Kerkstraat 4', aangemaaktOp: 2 },
    ],
    loading: false,
    addPand,
  }),
}))

function renderPaneel() {
  return render(
    <PandenPaneel
      klantId="klant-1"
      klantNaam="Malcon"
      onSluiten={onSluiten}
      onSelectPand={onSelectPand}
    />,
  )
}

describe('PandenPaneel', () => {
  it('toont de klantnaam en de lijst met panden', () => {
    renderPaneel()

    expect(screen.getByText('Panden — Malcon')).toBeInTheDocument()
    expect(screen.getByText('Hoofdstraat 12')).toBeInTheDocument()
    expect(screen.getByText('Kerkstraat 4')).toBeInTheDocument()
  })

  it('selecteert een pand bij klikken', async () => {
    const user = userEvent.setup()
    renderPaneel()

    await user.click(screen.getByText('Hoofdstraat 12'))

    expect(onSelectPand).toHaveBeenCalledWith({
      id: 'p1',
      klantId: 'klant-1',
      naam: 'Hoofdstraat 12',
      aangemaaktOp: 1,
    })
  })

  it('sluit het paneel bij klikken op de sluitknop', async () => {
    const user = userEvent.setup()
    renderPaneel()

    await user.click(screen.getByLabelText('Sluiten'))
    expect(onSluiten).toHaveBeenCalledOnce()
  })

  it('voegt een nieuw pand toe via het formulier onderin', async () => {
    const user = userEvent.setup()
    renderPaneel()

    await user.type(screen.getByLabelText('Naam nieuw pand'), 'Dorpsstraat 9')
    await user.click(screen.getByRole('button', { name: '+ Toevoegen' }))

    expect(addPand).toHaveBeenCalledWith('Dorpsstraat 9')
  })
})
