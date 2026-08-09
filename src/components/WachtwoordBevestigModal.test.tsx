import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WachtwoordBevestigModal } from './WachtwoordBevestigModal'

const bevestigMetWachtwoord = vi.fn()
vi.mock('../features/auth/useReauthenticatie', () => ({
  bevestigMetWachtwoord: (wachtwoord: string) => bevestigMetWachtwoord(wachtwoord),
}))

describe('WachtwoordBevestigModal', () => {
  it('roept onBevestigd aan na een correct wachtwoord', async () => {
    bevestigMetWachtwoord.mockResolvedValueOnce(undefined)
    const onBevestigd = vi.fn()
    const user = userEvent.setup()
    render(
      <WachtwoordBevestigModal
        itemNaam="Deurautomaat onderhoud"
        onBevestigd={onBevestigd}
        onAnnuleren={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Bevestig met je inlogwachtwoord'), 'geheim123')
    await user.click(screen.getByRole('button', { name: 'Definitief verwijderen' }))

    expect(bevestigMetWachtwoord).toHaveBeenCalledWith('geheim123')
    expect(onBevestigd).toHaveBeenCalledOnce()
  })

  it('toont een foutmelding bij een onjuist wachtwoord en roept onBevestigd niet aan', async () => {
    bevestigMetWachtwoord.mockRejectedValueOnce(new Error('fout'))
    const onBevestigd = vi.fn()
    const user = userEvent.setup()
    render(
      <WachtwoordBevestigModal
        itemNaam="Deurautomaat onderhoud"
        onBevestigd={onBevestigd}
        onAnnuleren={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Bevestig met je inlogwachtwoord'), 'verkeerd')
    await user.click(screen.getByRole('button', { name: 'Definitief verwijderen' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Wachtwoord onjuist.')
    expect(onBevestigd).not.toHaveBeenCalled()
  })

  it('roept onAnnuleren aan bij klikken op Annuleren', async () => {
    const onAnnuleren = vi.fn()
    const user = userEvent.setup()
    render(
      <WachtwoordBevestigModal
        itemNaam="Deurautomaat onderhoud"
        onBevestigd={vi.fn()}
        onAnnuleren={onAnnuleren}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Annuleren' }))

    expect(onAnnuleren).toHaveBeenCalledOnce()
  })

  it('toont de naam van het item dat verwijderd wordt', () => {
    render(
      <WachtwoordBevestigModal
        itemNaam="Deurautomaat onderhoud"
        onBevestigd={vi.fn()}
        onAnnuleren={vi.fn()}
      />,
    )

    expect(screen.getByText(/Deurautomaat onderhoud/)).toBeInTheDocument()
  })
})
