import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MjopTab } from './MjopTab'
import type { MjopPost } from './types'

const addPost = vi.fn()
const updatePost = vi.fn()
const archiveer = vi.fn()
const addActie = vi.fn()

let mockPosten: MjopPost[] = []

vi.mock('./useMjop', () => ({
  useMjop: () => ({
    posten: mockPosten,
    loading: false,
    addPost,
    updatePost,
    archiveer,
  }),
}))

vi.mock('../acties/useActies', () => ({
  useActies: () => ({ addActie }),
}))

function renderTab() {
  return render(<MjopTab pandId="p1" klantId="klant-1" pandNaam="Hoofdstraat 12" />)
}

describe('MjopTab', () => {
  afterEach(() => {
    mockPosten = []
    addPost.mockClear()
    updatePost.mockClear()
    archiveer.mockClear()
    addActie.mockClear()
    vi.restoreAllMocks()
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

  it('maakt een actie aan vanuit een MJOP-post, met pand en herkomst gevuld', async () => {
    mockPosten = [
      {
        id: '1',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'Dakbedekking vervangen',
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
  })
})
