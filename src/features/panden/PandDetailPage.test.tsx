import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PandDetailPage } from './PandDetailPage'
import type { Pand } from './types'

let mockOnderhoudDueCount = 0
vi.mock('../onderhoud/useOnderhoud', () => ({
  useOnderhoud: () => ({
    onderhoud: [],
    loading: false,
    addOnderhoud: vi.fn(),
    vinkAf: vi.fn(),
    onderhoudDueCount: mockOnderhoudDueCount,
  }),
}))

const PAND: Pand = {
  id: 'p1',
  klantId: 'klant-1',
  naam: 'Hoofdstraat 12',
  aangemaaktOp: 1,
}

function renderPagina(onTerug = vi.fn()) {
  return render(
    <PandDetailPage pand={PAND} klantNaam="Malcon" onTerug={onTerug} />,
  )
}

describe('PandDetailPage', () => {
  it('toont de kruimel en de pandnaam', () => {
    renderPagina()

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.getByText('🏠 Hoofdstraat 12')).toBeInTheDocument()
  })

  it('toont standaard het Overzicht-tabblad', () => {
    renderPagina()

    expect(
      screen.getByText('Dit is het startpunt van de pand-pagina'),
    ).toBeInTheDocument()
  })

  it('wisselt van tabblad bij klikken', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(screen.getByRole('button', { name: 'Documenten' }))
    expect(
      screen.getByText('Documenten — nog niet gebouwd, volgende stap.'),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Jaarlijks onderhoud/ }),
    )
    expect(screen.getByText('Nog geen onderhoudsitems.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'MJOP' }))
    expect(
      screen.getByText('MJOP — nog niet gebouwd, aparte vervolgstap.'),
    ).toBeInTheDocument()
  })

  it('roept onTerug aan bij klikken op de terug-knop', async () => {
    const onTerug = vi.fn()
    const user = userEvent.setup()
    renderPagina(onTerug)

    await user.click(screen.getByRole('button', { name: '← Terug naar panden' }))
    expect(onTerug).toHaveBeenCalledOnce()
  })

  it('toont een badge met het aantal due/geplande onderhoudsitems op de tab', () => {
    mockOnderhoudDueCount = 2
    renderPagina()

    expect(
      screen.getByRole('button', { name: /Jaarlijks onderhoud/ }),
    ).toHaveTextContent('2')
    mockOnderhoudDueCount = 0
  })
})
