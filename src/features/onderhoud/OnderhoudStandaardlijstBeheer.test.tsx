import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OnderhoudStandaardlijstBeheer } from './OnderhoudStandaardlijstBeheer'
import type { StandaardType } from './useOnderhoudStandaardlijst'

const voegTypeToe = vi.fn()
const verwijderType = vi.fn()
const vulMetVoorbeelden = vi.fn()

let mockTypes: StandaardType[] = []

vi.mock('./useOnderhoudStandaardlijst', () => ({
  useOnderhoudStandaardlijst: () => ({
    types: mockTypes,
    loading: false,
    voegTypeToe,
    verwijderType,
    vulMetVoorbeelden,
  }),
}))

function renderBeheer() {
  return render(<OnderhoudStandaardlijstBeheer onSluiten={vi.fn()} />)
}

describe('OnderhoudStandaardlijstBeheer', () => {
  afterEach(() => {
    mockTypes = []
    voegTypeToe.mockClear()
    verwijderType.mockClear()
    vulMetVoorbeelden.mockClear()
  })

  it('toont een knop om de standaardlijst te vullen met voorbeelden als die leeg is', async () => {
    const user = userEvent.setup()
    renderBeheer()

    expect(screen.getByText('Nog geen standaardtypen.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vul met veelgebruikte types' }))

    expect(vulMetVoorbeelden).toHaveBeenCalledOnce()
  })

  it('toont die knop niet meer zodra er al standaardtypen zijn', () => {
    mockTypes = [
      { id: 't1', naam: 'CV-ketel onderhoud', icoon: '🔧', herhaling: 'jaarlijks', aangemaaktOp: 1 },
    ]
    renderBeheer()

    expect(
      screen.queryByRole('button', { name: 'Vul met veelgebruikte types' }),
    ).not.toBeInTheDocument()
  })

  it('voegt een eigen type toe via het formulier', async () => {
    const user = userEvent.setup()
    renderBeheer()

    await user.type(screen.getByLabelText('Nieuw standaardtype'), 'Gevelreiniging')
    await user.click(screen.getByRole('button', { name: '+ Toevoegen' }))

    expect(voegTypeToe).toHaveBeenCalledWith('Gevelreiniging', '🔧')
  })

  it('verwijdert een standaardtype', async () => {
    mockTypes = [
      { id: 't1', naam: 'CV-ketel onderhoud', icoon: '🔧', herhaling: 'jaarlijks', aangemaaktOp: 1 },
    ]
    const user = userEvent.setup()
    renderBeheer()

    await user.click(screen.getByLabelText('Verwijderen: CV-ketel onderhoud'))

    expect(verwijderType).toHaveBeenCalledWith('t1')
  })
})
