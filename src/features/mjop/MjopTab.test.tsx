import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MjopTab } from './MjopTab'
import type { MjopPost } from './types'

const addPost = vi.fn()
const updatePost = vi.fn()
const archiveer = vi.fn()
const addActie = vi.fn(async (_nieuw: Record<string, unknown>) => 'nieuwe-actie-1')

let mockPosten: MjopPost[] = []
let mockFoutmelding: string | null = null

vi.mock('./useMjop', () => ({
  useMjop: () => ({
    posten: mockPosten,
    loading: false,
    foutmelding: mockFoutmelding,
    addPost,
    updatePost,
    archiveer,
  }),
}))

vi.mock('../acties/useActies', () => ({
  useActies: () => ({ addActie }),
}))

const voegTypeToe = vi.fn()
const verwijderType = vi.fn()
let mockStandaardTypes: {
  id: string
  naam: string
  categorie: string
  icoon: string
  aangemaaktOp: number
}[] = []
vi.mock('./useMjopStandaardlijst', () => ({
  useMjopStandaardlijst: () => ({
    types: mockStandaardTypes,
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

const onNavigeerNaarActie = vi.fn()

function renderTab() {
  return render(
    <MjopTab
      pandId="p1"
      klantId="klant-1"
      pandNaam="Hoofdstraat 12"
      onNavigeerNaarActie={onNavigeerNaarActie}
    />,
  )
}

describe('MjopTab', () => {
  afterEach(() => {
    mockPosten = []
    mockFoutmelding = null
    mockStandaardTypes = []
    addPost.mockClear()
    updatePost.mockClear()
    archiveer.mockClear()
    addActie.mockClear()
    onNavigeerNaarActie.mockClear()
    voegTypeToe.mockClear()
    verwijderType.mockClear()
    vi.restoreAllMocks()
  })

  it('toont een foutmelding in plaats van de lijst als het laden mislukt', () => {
    mockFoutmelding = 'MJOP kon niet geladen worden. Probeer de pagina te verversen.'
    renderTab()

    expect(
      screen.getByText('MJOP kon niet geladen worden. Probeer de pagina te verversen.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Nog geen MJOP-posten.')).not.toBeInTheDocument()
  })

  it('toont een lege staat als er nog geen MJOP-posten zijn', () => {
    renderTab()
    expect(screen.getByText('Nog geen MJOP-posten.')).toBeInTheDocument()
  })

  it('toont de samenvattingscards en groepeert posten per jaar', () => {
    mockPosten = [
      {
        id: '1',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'Buitenschilderwerk kozijnen',
        categorie: 'onderhoud',
        jaar: 2026,
        geschatBedrag: 12000,
        status: 'dit-jaar',
        toegevoegdDoor: 'Ton',
        aangemaaktOp: 1,
      },
      {
        id: '2',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'Dakbedekking vervangen',
        categorie: 'onderhoud',
        jaar: 2028,
        geschatBedrag: 35000,
        status: 'gepland',
        toegevoegdDoor: 'Seth',
        aangemaaktOp: 2,
      },
    ]
    renderTab()

    expect(screen.getByText('€ 47.000')).toBeInTheDocument() // totaal
    expect(screen.getByText('2')).toBeInTheDocument() // aantal posten
    expect(screen.getByText('Buitenschilderwerk kozijnen')).toBeInTheDocument()
    expect(screen.getByText('Toegevoegd door Ton')).toBeInTheDocument()
    expect(screen.getByText('Dakbedekking vervangen')).toBeInTheDocument()
  })

  it('wijzigt de status van een post via de select', async () => {
    mockPosten = [
      {
        id: '1',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'Buitenschilderwerk kozijnen',
        categorie: 'onderhoud',
        jaar: 2026,
        geschatBedrag: 12000,
        status: 'gepland',
        toegevoegdDoor: 'Ton',
        aangemaaktOp: 1,
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.selectOptions(
      screen.getByLabelText('Status voor Buitenschilderwerk kozijnen'),
      'afgerond',
    )

    expect(updatePost).toHaveBeenCalledWith('1', { status: 'afgerond' })
  })

  it('opent het formulier en voegt een nieuwe post toe', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Post toevoegen' }))
    await user.type(screen.getByLabelText('Omschrijving'), 'Gevelreiniging')
    await user.clear(screen.getByLabelText('Jaar'))
    await user.type(screen.getByLabelText('Jaar'), '2030')
    await user.type(screen.getByLabelText('Geschat bedrag'), '22000')
    await user.selectOptions(screen.getByLabelText('Toegevoegd door'), 'Marjan')
    await user.click(screen.getByRole('button', { name: 'Toevoegen' }))

    expect(addPost).toHaveBeenCalledWith({
      klantId: 'klant-1',
      naam: 'Gevelreiniging',
      categorie: 'onderhoud',
      jaar: 2030,
      geschatBedrag: 22000,
      status: 'gepland',
      toegevoegdDoor: 'Marjan',
      aangemaaktOp: expect.any(Number),
    })
  })

  it('toont gearchiveerde posten niet en telt ze niet mee in de samenvatting', () => {
    mockPosten = [
      {
        id: '1',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'Oude post',
        categorie: 'onderhoud',
        jaar: 2026,
        geschatBedrag: 12000,
        status: 'gepland',
        toegevoegdDoor: 'Ton',
        aangemaaktOp: 1,
        gearchiveerdOp: Date.now(),
      },
    ]
    renderTab()
    expect(screen.getByText('Nog geen MJOP-posten.')).toBeInTheDocument()
  })

  it('archiveert een post met opgegeven teamlid en reden', async () => {
    mockPosten = [
      {
        id: '1',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'Buitenschilderwerk kozijnen',
        categorie: 'onderhoud',
        jaar: 2026,
        geschatBedrag: 12000,
        status: 'gepland',
        toegevoegdDoor: 'Ton',
        aangemaaktOp: 1,
      },
    ]
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Ton').mockReturnValueOnce('plan gewijzigd')
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByLabelText('Archiveren: Buitenschilderwerk kozijnen'))

    expect(archiveer).toHaveBeenCalledWith('1', 'Ton', 'plan gewijzigd')
  })

  it('opent het beheerscherm voor de MJOP-standaardlijst', async () => {
    mockStandaardTypes = [
      { id: 't1', naam: 'Dakbedekking vervangen', categorie: 'vervanging', icoon: '🏗️', aangemaaktOp: 1 },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '⚙ Beheren' }))

    expect(
      screen.getByRole('dialog', { name: 'MJOP-standaardlijst beheren' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Dakbedekking vervangen')).toBeInTheDocument()
  })

  it('voegt een post toe vanuit de standaardlijst met jaar, bedrag en categorie', async () => {
    mockStandaardTypes = [
      { id: 't1', naam: 'Dakbedekking vervangen', categorie: 'vervanging', icoon: '🏗️', aangemaaktOp: 1 },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Vanuit standaardlijst' }))
    await user.click(screen.getByRole('checkbox', { name: /Dakbedekking vervangen/ }))
    await user.clear(screen.getByLabelText('Jaar voor "Dakbedekking vervangen"'))
    await user.type(screen.getByLabelText('Jaar voor "Dakbedekking vervangen"'), '2030')
    await user.type(
      screen.getByLabelText('Geschat bedrag voor "Dakbedekking vervangen"'),
      '35000',
    )
    await user.click(
      screen.getByRole('button', { name: '1 item toevoegen aan dit pand' }),
    )

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

  it('maakt een actie aan vanuit een MJOP-post, met pand en herkomst gevuld', async () => {
    mockPosten = [
      {
        id: '1',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'Dakbedekking vervangen',
        categorie: 'onderhoud',
        jaar: 2028,
        geschatBedrag: 35000,
        status: 'gepland',
        toegevoegdDoor: 'Seth',
        aangemaaktOp: 1,
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Actie aanmaken' }))

    expect(addActie).toHaveBeenCalledOnce()
    const nieuweActie = addActie.mock.calls[0][0]
    expect(nieuweActie.onderwerp).toBe('Dakbedekking vervangen')
    expect(nieuweActie.pandId).toBe('p1')
    expect(nieuweActie.herkomst).toEqual({
      type: 'mjop',
      bronId: '1',
      label: 'Dakbedekking vervangen',
    })
    expect(onNavigeerNaarActie).toHaveBeenCalledWith('nieuwe-actie-1')
  })
})
