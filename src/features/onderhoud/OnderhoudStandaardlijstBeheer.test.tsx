import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OnderhoudStandaardlijstBeheer } from './OnderhoudStandaardlijstBeheer'
import type { StandaardType } from './useOnderhoudStandaardlijst'

const voegTypeToe = vi.fn()
const verwijderType = vi.fn()
const vulMetVoorbeelden = vi.fn()
const addOnderhoud = vi.fn()
const archiveer = vi.fn()

let mockTypes: StandaardType[] = []
let mockOnderhoud: { id: string; naam: string; gearchiveerdOp?: number }[] = []

vi.mock('./useOnderhoudStandaardlijst', () => ({
  useOnderhoudStandaardlijst: () => ({
    types: mockTypes,
    loading: false,
    voegTypeToe,
    verwijderType,
    vulMetVoorbeelden,
  }),
}))

vi.mock('./useOnderhoud', () => ({
  useOnderhoud: () => ({
    onderhoud: mockOnderhoud,
    addOnderhoud,
    archiveer,
  }),
}))

function renderBeheer() {
  return render(
    <OnderhoudStandaardlijstBeheer pandId="p1" klantId="klant-1" onSluiten={vi.fn()} />,
  )
}

describe('OnderhoudStandaardlijstBeheer', () => {
  afterEach(() => {
    mockTypes = []
    mockOnderhoud = []
    voegTypeToe.mockClear()
    verwijderType.mockClear()
    vulMetVoorbeelden.mockClear()
    addOnderhoud.mockClear()
    archiveer.mockClear()
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

  it('voegt een eigen type toe via het formulier, met herhaling', async () => {
    const user = userEvent.setup()
    renderBeheer()

    await user.type(screen.getByLabelText('Nieuw standaardtype'), 'Gevelreiniging')
    await user.selectOptions(
      screen.getByLabelText('Herhaling voor nieuw standaardtype'),
      'kwartaal',
    )
    await user.click(screen.getByRole('button', { name: '+ Toevoegen' }))

    expect(voegTypeToe).toHaveBeenCalledWith('Gevelreiniging', 'kwartaal', '🔧')
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

  it('koppelt een standaardtype aan dit pand bij aanvinken', async () => {
    mockTypes = [
      { id: 't1', naam: 'Dakinspectie', icoon: '🏠', herhaling: 'jaarlijks', aangemaaktOp: 1 },
    ]
    const user = userEvent.setup()
    renderBeheer()

    const checkbox = screen.getByLabelText('Dakinspectie toevoegen aan dit pand')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    expect(addOnderhoud).toHaveBeenCalledWith({
      naam: 'Dakinspectie',
      verantw: 'Ton',
      klantId: 'klant-1',
      herhaling: 'jaarlijks',
    })
  })

  it('archiveert het gekoppelde item bij uitvinken', async () => {
    mockTypes = [
      { id: 't1', naam: 'Dakinspectie', icoon: '🏠', herhaling: 'jaarlijks', aangemaaktOp: 1 },
    ]
    mockOnderhoud = [{ id: 'o1', naam: 'Dakinspectie' }]
    const user = userEvent.setup()
    renderBeheer()

    const checkbox = screen.getByLabelText('Dakinspectie toevoegen aan dit pand')
    expect(checkbox).toBeChecked()

    await user.click(checkbox)

    expect(archiveer).toHaveBeenCalledWith('o1')
  })
})
