import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MjopStandaardlijstBeheer } from './MjopStandaardlijstBeheer'
import type { MjopStandaardType } from './useMjopStandaardlijst'

const voegTypeToe = vi.fn()
const verwijderType = vi.fn()
const addPost = vi.fn()
const archiveer = vi.fn()

let mockTypes: MjopStandaardType[] = []
let mockPosten: { id: string; naam: string; gearchiveerdOp?: number }[] = []

vi.mock('./useMjopStandaardlijst', () => ({
  useMjopStandaardlijst: () => ({
    types: mockTypes,
    loading: false,
    voegTypeToe,
    verwijderType,
  }),
  MJOP_CATEGORIE_LABELS: {
    onderhoud: 'Onderhoud',
    'verbouwing-renovatie': 'Verbouwing/renovatie',
    vervanging: 'Vervanging',
  },
}))

vi.mock('./useMjop', () => ({
  useMjop: () => ({
    posten: mockPosten,
    addPost,
    archiveer,
  }),
}))

function renderBeheer() {
  return render(
    <MjopStandaardlijstBeheer pandId="p1" klantId="klant-1" onSluiten={vi.fn()} />,
  )
}

describe('MjopStandaardlijstBeheer', () => {
  afterEach(() => {
    mockTypes = []
    mockPosten = []
    voegTypeToe.mockClear()
    verwijderType.mockClear()
    addPost.mockClear()
    archiveer.mockClear()
  })

  it('toont een lege staat als er nog geen standaardtypen zijn', () => {
    renderBeheer()
    expect(screen.getByText('Nog geen standaardtypen.')).toBeInTheDocument()
  })

  it('voegt een eigen type toe via het formulier, met categorie', async () => {
    const user = userEvent.setup()
    renderBeheer()

    await user.type(screen.getByLabelText('Nieuw standaardtype'), 'Kozijnen vervangen')
    await user.selectOptions(screen.getByLabelText('Categorie'), 'vervanging')
    await user.click(screen.getByRole('button', { name: '+ Toevoegen' }))

    expect(voegTypeToe).toHaveBeenCalledWith('Kozijnen vervangen', 'vervanging', '🏗️')
  })

  it('verwijdert een standaardtype', async () => {
    mockTypes = [
      { id: 't1', naam: 'Dakbedekking vervangen', categorie: 'vervanging', icoon: '🏗️', aangemaaktOp: 1 },
    ]
    const user = userEvent.setup()
    renderBeheer()

    await user.click(screen.getByLabelText('Verwijderen: Dakbedekking vervangen'))

    expect(verwijderType).toHaveBeenCalledWith('t1')
  })

  it('voegt bij aanvinken een post toe aan dit pand met jaar, bedrag en categorie', async () => {
    mockTypes = [
      { id: 't1', naam: 'Dakbedekking vervangen', categorie: 'vervanging', icoon: '🏗️', aangemaaktOp: 1 },
    ]
    const user = userEvent.setup()
    renderBeheer()

    const checkbox = screen.getByLabelText('Dakbedekking vervangen toevoegen aan dit pand')
    expect(checkbox).not.toBeChecked()

    await user.clear(screen.getByLabelText('Jaar voor "Dakbedekking vervangen"'))
    await user.type(screen.getByLabelText('Jaar voor "Dakbedekking vervangen"'), '2030')
    await user.type(
      screen.getByLabelText('Geschat bedrag voor "Dakbedekking vervangen"'),
      '35000',
    )
    await user.click(checkbox)

    expect(addPost).toHaveBeenCalledWith({
      klantId: 'klant-1',
      naam: 'Dakbedekking vervangen',
      categorie: 'vervanging',
      jaar: 2030,
      geschatBedrag: 35000,
      status: 'gepland',
      toegevoegdDoor: 'Ton',
      aangemaaktOp: expect.any(Number),
    })
  })

  it('archiveert de gekoppelde post bij uitvinken', async () => {
    mockTypes = [
      { id: 't1', naam: 'Dakbedekking vervangen', categorie: 'vervanging', icoon: '🏗️', aangemaaktOp: 1 },
    ]
    mockPosten = [{ id: 'post-1', naam: 'Dakbedekking vervangen' }]
    const user = userEvent.setup()
    renderBeheer()

    const checkbox = screen.getByLabelText('Dakbedekking vervangen toevoegen aan dit pand')
    expect(checkbox).toBeChecked()

    await user.click(checkbox)

    expect(archiveer).toHaveBeenCalledWith('post-1')
  })
})
