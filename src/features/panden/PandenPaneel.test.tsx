import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PandenPaneel } from './PandenPaneel'

const addPand = vi.fn()
const updatePand = vi.fn()
const archiveer = vi.fn()
const onSluiten = vi.fn()
const onSelectPand = vi.fn()

let mockFoutmelding: string | null = null

vi.mock('./usePanden', () => ({
  usePanden: () => ({
    panden: [
      { id: 'p1', klantId: 'klant-1', naam: 'Hoofdstraat 12', aangemaaktOp: 1 },
      { id: 'p2', klantId: 'klant-1', naam: 'Kerkstraat 4', aangemaaktOp: 2 },
      {
        id: 'p3',
        klantId: 'klant-1',
        naam: 'Molenweg 7',
        aangemaaktOp: 3,
        gearchiveerdOp: Date.now(),
      },
    ],
    loading: false,
    foutmelding: mockFoutmelding,
    addPand,
    updatePand,
    archiveer,
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
  afterEach(() => {
    vi.clearAllMocks()
    mockFoutmelding = null
  })

  it('toont een foutmelding in plaats van de lijst als het laden mislukt', () => {
    mockFoutmelding = 'Panden konden niet geladen worden. Probeer de pagina te verversen.'
    renderPaneel()

    expect(
      screen.getByText('Panden konden niet geladen worden. Probeer de pagina te verversen.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Hoofdstraat 12')).not.toBeInTheDocument()
  })

  it('toont de klantnaam en de lijst met actieve panden', () => {
    renderPaneel()

    expect(screen.getByText('Panden — Malcon')).toBeInTheDocument()
    expect(screen.getByText('Hoofdstraat 12')).toBeInTheDocument()
    expect(screen.getByText('Kerkstraat 4')).toBeInTheDocument()
  })

  it('toont gearchiveerde panden niet', () => {
    renderPaneel()
    expect(screen.queryByText('Molenweg 7')).not.toBeInTheDocument()
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

  it('bewerkt de naam van een pand inline', async () => {
    const user = userEvent.setup()
    renderPaneel()

    await user.click(screen.getByLabelText('Bewerken: Hoofdstraat 12'))
    const input = screen.getByLabelText('Naam bewerken voor Hoofdstraat 12')
    await user.clear(input)
    await user.type(input, 'Hoofdstraat 12a')
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(updatePand).toHaveBeenCalledWith('p1', { naam: 'Hoofdstraat 12a' })
    expect(onSelectPand).not.toHaveBeenCalled()
  })

  it('archiveert een pand met opgegeven teamlid en reden', async () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Ton').mockReturnValueOnce('verkocht')
    const user = userEvent.setup()
    renderPaneel()

    await user.click(screen.getByLabelText('Archiveren: Hoofdstraat 12'))

    expect(archiveer).toHaveBeenCalledWith('p1', 'Ton', 'verkocht')
  })
})
