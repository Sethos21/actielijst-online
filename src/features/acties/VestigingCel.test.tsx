import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VestigingCel } from './VestigingCel'

let mockPanden: { id: string; naam: string }[] = [
  { id: 'p1', naam: 'Hoofdstraat 12, Vlijmen' },
  { id: 'p2', naam: 'Kerkstraat 4b, Tilburg' },
]

vi.mock('../panden/usePanden', () => ({
  usePanden: () => ({ panden: mockPanden, loading: false, addPand: vi.fn() }),
}))

describe('VestigingCel', () => {
  it('toont de pandnaam met huis-icoon als er een pand gekoppeld is', () => {
    render(
      <VestigingCel
        klantId="klant-1"
        klantNaam="Malcon"
        actieOmschrijving="Dakinspectie"
        pandId="p1"
        vestigingTekst="Hoofdstraat 12, Vlijmen"
        onKiesPand={vi.fn()}
        onVrijeTekst={vi.fn()}
      />,
    )

    expect(screen.getByText(/Hoofdstraat 12, Vlijmen/)).toBeInTheDocument()
  })

  it('toont "vrije tekst"-badge als er geen pand gekoppeld is maar wel vestigingstekst', () => {
    render(
      <VestigingCel
        klantId="klant-1"
        klantNaam="Malcon"
        actieOmschrijving="Nieuwe huisstijl"
        vestigingTekst="Hoofdkantoor"
        onKiesPand={vi.fn()}
        onVrijeTekst={vi.fn()}
      />,
    )

    expect(screen.getByText('Hoofdkantoor')).toBeInTheDocument()
    expect(screen.getByText('vrije tekst')).toBeInTheDocument()
  })

  it('toont een uitnodiging om te koppelen als er niets is ingevuld', () => {
    render(
      <VestigingCel
        klantId="klant-1"
        klantNaam="Malcon"
        actieOmschrijving="BTW-aangifte Q2"
        vestigingTekst=""
        onKiesPand={vi.fn()}
        onVrijeTekst={vi.fn()}
      />,
    )

    expect(
      screen.getByText('— klik om een pand te koppelen —'),
    ).toBeInTheDocument()
  })

  it('opent de pandenlijst en roept onKiesPand aan bij het kiezen van een pand', async () => {
    const onKiesPand = vi.fn()
    const user = userEvent.setup()
    render(
      <VestigingCel
        klantId="klant-1"
        klantNaam="Malcon"
        actieOmschrijving="Dakinspectie"
        vestigingTekst=""
        onKiesPand={onKiesPand}
        onVrijeTekst={vi.fn()}
      />,
    )

    await user.click(
      screen.getByLabelText('Vestiging voor Dakinspectie'),
    )
    expect(screen.getByText('Panden — Malcon')).toBeInTheDocument()

    await user.click(screen.getByText(/Kerkstraat 4b, Tilburg/))
    expect(onKiesPand).toHaveBeenCalledWith({
      id: 'p2',
      naam: 'Kerkstraat 4b, Tilburg',
    })
  })

  it('roept onVrijeTekst aan als er vrije tekst wordt ingevuld', async () => {
    const onVrijeTekst = vi.fn()
    const user = userEvent.setup()
    render(
      <VestigingCel
        klantId="klant-1"
        klantNaam="Malcon"
        actieOmschrijving="Nieuwe huisstijl"
        vestigingTekst=""
        onKiesPand={vi.fn()}
        onVrijeTekst={onVrijeTekst}
      />,
    )

    await user.click(
      screen.getByLabelText('Vestiging voor Nieuwe huisstijl'),
    )
    await user.type(
      screen.getByLabelText('Vrije tekst voor vestiging'),
      'Hoofdkantoor',
    )
    await user.tab()

    expect(onVrijeTekst).toHaveBeenCalledWith('Hoofdkantoor')
  })
})
