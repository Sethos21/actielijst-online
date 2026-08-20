import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ActieItem } from './types'
import { ActielijstPage } from './ActielijstPage'

vi.mock('../../components/useToast', () => ({
  useToast: () => vi.fn(),
}))

const exporteerNaarExcel = vi.fn()
vi.mock('./excelExport', () => ({
  exporteerNaarExcel: (...args: unknown[]) => exporteerNaarExcel(...args),
}))

vi.mock('../versies/useVersies', () => ({
  useVersies: () => ({
    versies: [],
    loading: false,
    sluitVergaderingAf: vi.fn(),
  }),
}))

vi.mock('../klanten/useKlanten', () => ({
  useKlanten: () => ({
    klanten: [{ id: 'klant-1', naam: 'Malcon', aangemaaktOp: 1 }],
    loading: false,
    addKlant: vi.fn(),
  }),
}))

let mockPanden: { id: string; naam: string }[] = []
vi.mock('../panden/usePanden', () => ({
  usePanden: () => ({
    panden: mockPanden,
    loading: false,
    addPand: vi.fn(),
  }),
}))

// ImportActiesModal (nu ook bereikbaar vanuit ActielijstPage) importeert via
// bulkImporteren.ts de echte Firebase-app — die initialiseert zonder geldige
// env-vars niet in deze testomgeving, dus stubben net als in App.test.tsx.
vi.mock('../../lib/firebase', () => ({
  app: {},
  auth: {},
  db: {},
}))

const BASIS_ACTIES: ActieItem[] = [
  {
    id: '1',
    klantId: 'klant-1',
    ref: 'A1',
    onderwerp: 'Onderhoud',
    bedrijf: 'Bowog Beheer B.V.',
    vestiging: 'Hoofdkantoor',
    actie: 'Lift laten keuren',
    verantw: ['Ton'],
    aangemaaktOp: '2020-01-01',
    doorlooptijd: '1w',
    status: 'open',
    opmerking: '',
  },
  {
    id: '2',
    klantId: 'klant-1',
    ref: 'A2',
    onderwerp: 'Onderhoud',
    bedrijf: 'Bowog Beheer B.V.',
    vestiging: 'Bijkantoor',
    actie: 'Op hold gezette actie',
    verantw: [],
    aangemaaktOp: '2020-01-01',
    doorlooptijd: '1w',
    status: 'hold',
    opmerking: '',
  },
  {
    id: '3',
    klantId: 'klant-1',
    ref: 'A3',
    onderwerp: 'Onderhoud',
    bedrijf: 'Bowog Beheer B.V.',
    vestiging: 'Nevenvestiging',
    actie: 'Andere open actie van Seth',
    verantw: ['Seth'],
    aangemaaktOp: '2999-01-01',
    doorlooptijd: '1w',
    status: 'open',
    opmerking: '',
  },
]

const { deleteActie, updateActie, uitstellen } = vi.hoisted(() => ({
  deleteActie: vi.fn(),
  updateActie: vi.fn(),
  uitstellen: vi.fn(),
}))

// Stateful mock (i.p.v. een vaste array): addActie voegt écht toe aan de
// lijst, nodig om te testen dat een snel-toegevoegde actie na sorteren
// onderin blijft staan. updateActie/deleteActie/uitstellen zijn module-level
// exports (ActieRij.tsx importeert ze rechtstreeks, niet via de hook).
//
// addActieVertragingMs simuleert de race tussen Firestore's onSnapshot
// (die `acties` hier via setActies bijwerkt, vergelijkbaar met hoe de
// lokale cache-update vaak eerder binnenkomt) en de belofte die addActie
// zelf teruggeeft (vergelijkbaar met addDoc()'s promise, die soms pas ná
// die cache-update resolvet) — zie de test verderop die hierop leunt.
let addActieVertragingMs = 0

vi.mock('./useActies', () => ({
  updateActie,
  deleteActie,
  uitstellen,
  useActies: () => {
    const [acties, setActies] = useState(BASIS_ACTIES)
    return {
      acties,
      loading: false,
      addActie: vi.fn(async (nieuw: Omit<ActieItem, 'id' | 'klantId' | 'ref'> & { ref?: string }) => {
        const id = `nieuw-${acties.length + 1}`
        const hoogsteRef = acties.reduce((max, actie) => {
          const nummer = Number(actie.ref)
          return Number.isNaN(nummer) ? max : Math.max(max, nummer)
        }, 0)
        const ref = nieuw.ref?.trim() || String(hoogsteRef + 1)
        setActies((huidig) => [...huidig, { ...nieuw, ref, id, klantId: 'klant-1' }])
        if (addActieVertragingMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, addActieVertragingMs))
        }
        return id
      }),
    }
  },
}))

describe('ActielijstPage', () => {
  afterEach(() => {
    exporteerNaarExcel.mockClear()
    deleteActie.mockClear()
    updateActie.mockClear()
    mockPanden = []
    addActieVertragingMs = 0
  })

  it('roept onPandenOpen aan bij klikken op de Panden-knop, zonder badge als er geen panden zijn', () => {
    const onPandenOpen = vi.fn()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={onPandenOpen}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    const knop = screen.getByRole('button', { name: /Panden/ })
    expect(knop.querySelector('.count-badge')).not.toBeInTheDocument()

    knop.click()
    expect(onPandenOpen).toHaveBeenCalledOnce()
  })

  it('toont een count-badge met het aantal panden op de Panden-knop', () => {
    mockPanden = [
      { id: 'p1', naam: 'Hoofdstraat 12' },
      { id: 'p2', naam: 'Kerkstraat 4' },
    ]
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /Panden/ })).toHaveTextContent('2')
  })

  it('toont acties en markeert een verlopen open actie als Due in de statuskolom', () => {
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(document.querySelectorAll('.status-select-due')).toHaveLength(1)
    expect(screen.getByLabelText('Status voor Lift laten keuren')).toHaveDisplayValue(
      'Due',
    )
  })

  it('zet afgerondOp op vandaag zodra een actie op Gereed wordt gezet', async () => {
    const vandaag = new Date().toISOString().slice(0, 10)
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.selectOptions(
      screen.getByLabelText('Status voor Lift laten keuren'),
      'done',
    )

    expect(updateActie).toHaveBeenCalledWith('1', {
      status: 'done',
      afgerondOp: vandaag,
    })
  })

  it('voegt geen afgerondOp toe bij een statuswijziging die niet naar Gereed gaat', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.selectOptions(
      screen.getByLabelText('Status voor Lift laten keuren'),
      'hold',
    )

    expect(updateActie).toHaveBeenCalledWith('1', { status: 'hold' })
  })

  it('markeert een on-hold actie nooit als Due, ondanks verlopen datum', () => {
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    // Er is precies 1 due statusveld: de on-hold actie (zelfde verlopen datum) telt niet mee.
    expect(document.querySelectorAll('.status-select-due')).toHaveLength(1)
    expect(
      screen.getByLabelText('Status voor Op hold gezette actie'),
    ).toHaveDisplayValue('On hold')
  })

  it('toont de geselecteerde verantwoordelijke als compacte chip, "—" als niemand is toegewezen', () => {
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    expect(
      screen.getByLabelText('Verantwoordelijke voor Lift laten keuren'),
    ).toHaveTextContent('TO')
    expect(
      screen.getByLabelText('Verantwoordelijke voor Op hold gezette actie'),
    ).toHaveTextContent('—')
  })

  it('opent de verantwoordelijke-dropdown en toont een checkbox per teamlid, aangevinkt voor de huidige selectie', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.click(
      screen.getByLabelText('Verantwoordelijke voor Lift laten keuren'),
    )

    expect(screen.getByRole('checkbox', { name: 'Ton' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Seth' })).not.toBeChecked()
  })

  it('toont stat-cards met de juiste tellingen (open/due/afgerond/on hold)', () => {
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    const waarden = Array.from(document.querySelectorAll('.stat-waarde')).map(
      (el) => el.textContent,
    )
    expect(waarden).toEqual(['2', '1', '0', '1'])
  })

  it('filtert op zoekterm', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText('Zoeken in actielijst'), 'Hoofdkantoor')

    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()
  })

  it('filtert op een teamlid-pill', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.click(screen.getByLabelText('Filter op Ton'))

    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()
  })

  it('combineert een status-pill en een teamlid-pill met AND, niet OR', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByLabelText('Filter op Ton'))

    // Beide acties zijn open, maar alleen "Lift laten keuren" is van Ton —
    // bij OR-gedrag (de oude bug) zou de open actie van Seth ook meekomen.
    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Andere open actie van Seth'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()
  })

  it('de "Alle"-pil toont weer alle acties na filteren', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.click(screen.getByLabelText('Filter op Ton'))
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alle' }))
    expect(screen.getByDisplayValue('Op hold gezette actie')).toBeInTheDocument()
  })

  it('toont het ref-nummer gekoppeld aan de rij i.p.v. een herberekende positie', () => {
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    const rijnummers = Array.from(
      document.querySelectorAll('table.actielijst tbody tr'),
    ).map((rij) => rij.querySelector('td')?.textContent)
    expect(rijnummers.sort()).toEqual(['A1', 'A2', 'A3'])
  })

  it('sorteert standaard al oplopend op # en sorteert daadwerkelijk, niet alleen visueel', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )
    const rijnummers = () =>
      Array.from(document.querySelectorAll('table.actielijst tbody tr')).map(
        (rij) => rij.querySelector('td')?.textContent,
      )

    // # is de standaard sortering (oplopend) — juist zodat nieuwe acties
    // altijd onderin verschijnen i.p.v. ergens middenin op due-datum.
    expect(rijnummers()).toEqual(['A1', 'A2', 'A3'])

    const sorteerKnop = screen.getByRole('button', { name: /^#/ })
    await user.click(sorteerKnop)
    expect(rijnummers()).toEqual(['A3', 'A2', 'A1'])

    await user.click(sorteerKnop)
    expect(rijnummers()).toEqual(['A1', 'A2', 'A3'])
  })

  it('roept window.print() aan via de Print-knop', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Print' }))

    expect(printSpy).toHaveBeenCalledOnce()
    printSpy.mockRestore()
  })

  it('exporteert de actuele (gefilterde) lijst via de Excel-knop', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.click(screen.getByLabelText('Filter op Ton'))
    await user.click(screen.getByRole('button', { name: 'Excel' }))

    expect(exporteerNaarExcel).toHaveBeenCalledOnce()
    const [geexporteerdeActies, klantNaam] = exporteerNaarExcel.mock.calls[0]
    expect(geexporteerdeActies).toHaveLength(1)
    expect(geexporteerdeActies[0].actie).toBe('Lift laten keuren')
    expect(klantNaam).toBe('Malcon')
  })

  it('een snel-toegevoegde actie blijft onderin staan, ook als er op een kolom gesorteerd is', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    // Sorteer op Vestiging (heeft voor elke rij een andere waarde) zodat de
    // standaardvolgorde daadwerkelijk omgooit.
    await user.click(screen.getByRole('button', { name: /^Vestiging[▲▼▾]/ }))

    await user.click(
      screen.getByRole('button', { name: '+ Nieuwe actie toevoegen' }),
    )

    const rijen = await screen.findAllByRole('row')
    const laatsteRij = rijen[rijen.length - 1]
    // De net toegevoegde rij heeft nog geen actiepunt ingevuld — dat bewijst
    // dat dít de nieuwe rij is, en die staat als laatste in de tabel.
    expect(within(laatsteRij).getByLabelText('Actiepunt')).toHaveValue('')
  })

  it('blijft onderin staan ook als de acties-lijst bijwerkt vóórdat addActie() zelf resolvet (race condition)', async () => {
    // Simuleert dat Firestore's onSnapshot de lijst al bijwerkt terwijl de
    // addActie()-belofte zelf pas iets later resolvet — precies het scenario
    // waarin setNieuweRijIds() ná de await te laat zou komen.
    addActieVertragingMs = 20
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^Vestiging[▲▼▾]/ }))
    await user.click(
      screen.getByRole('button', { name: '+ Nieuwe actie toevoegen' }),
    )

    const rijen = await screen.findAllByRole('row')
    const laatsteRij = rijen[rijen.length - 1]
    expect(within(laatsteRij).getByLabelText('Actiepunt')).toHaveValue('')
  })

  it('vraagt om bevestiging voordat een actie verwijderd wordt', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    confirmSpy.mockReturnValueOnce(false)
    await user.click(screen.getByLabelText('Verwijderen: Lift laten keuren'))
    expect(deleteActie).not.toHaveBeenCalled()

    confirmSpy.mockReturnValueOnce(true)
    await user.click(screen.getByLabelText('Verwijderen: Lift laten keuren'))
    expect(deleteActie).toHaveBeenCalledWith('1')

    confirmSpy.mockRestore()
  })

  it('het formulier bovenin slaat ook verantwoordelijke, doorlooptijd en opmerking op', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage
        klantId="klant-1"
        klantNaam="Malcon"
        onTerug={vi.fn()}
        onPandenOpen={vi.fn()}
        onNavigeerNaarBron={vi.fn()}
      />,
    )

    const formulier = document.querySelector('form.no-print') as HTMLElement | null
    if (!formulier) throw new Error('formulier niet gevonden')

    await user.type(within(formulier).getByLabelText('Actiepunt'), 'Test actie')
    await user.click(screen.getByLabelText('Verantwoordelijke voor nieuwe actie'))
    await user.click(screen.getByRole('checkbox', { name: 'Gertjan' }))
    await user.selectOptions(screen.getByLabelText('Doorlooptijd'), '4w')
    await user.type(screen.getByLabelText('Opmerking'), 'Even nakijken')
    await user.click(screen.getByRole('button', { name: 'Actie toevoegen' }))

    const nieuwActiepunt = await screen.findByDisplayValue('Test actie')
    const nieuweRij = nieuwActiepunt.closest('tr')
    expect(nieuweRij).not.toBeNull()
    expect(
      within(nieuweRij as HTMLElement).getByDisplayValue('Even nakijken'),
    ).toBeInTheDocument()
    expect(
      within(nieuweRij as HTMLElement).getByLabelText(/Verantwoordelijke voor/),
    ).toHaveTextContent('GE')
    expect(
      within(nieuweRij as HTMLElement).getByLabelText(/Doorlooptijd voor/),
    ).toHaveDisplayValue('4w')
  })
})
