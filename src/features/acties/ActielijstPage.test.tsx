import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('./useActies', () => ({
  useActies: () => ({
    acties: [
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
    ],
    loading: false,
    addActie: vi.fn(),
    updateActie: vi.fn(),
    deleteActie: vi.fn(),
    uitstellen: vi.fn(),
  }),
}))

describe('ActielijstPage', () => {
  afterEach(() => {
    exporteerNaarExcel.mockClear()
  })

  it('toont acties en markeert een verlopen open actie als Due in de statuskolom', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    expect(screen.getByDisplayValue('Lift laten keuren')).toBeInTheDocument()
    expect(document.querySelectorAll('.status-select-due')).toHaveLength(1)
    expect(screen.getByLabelText('Status voor Lift laten keuren')).toHaveDisplayValue(
      'Due',
    )
  })

  it('markeert een on-hold actie nooit als Due, ondanks verlopen datum', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    // Er is precies 1 due statusveld: de on-hold actie (zelfde verlopen datum) telt niet mee.
    expect(document.querySelectorAll('.status-select-due')).toHaveLength(1)
    expect(
      screen.getByLabelText('Status voor Op hold gezette actie'),
    ).toHaveDisplayValue('On hold')
  })

  it('toont de geselecteerde verantwoordelijke als compacte chip, "—" als niemand is toegewezen', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
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
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    await user.click(
      screen.getByLabelText('Verantwoordelijke voor Lift laten keuren'),
    )

    expect(screen.getByRole('checkbox', { name: 'Ton' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Seth' })).not.toBeChecked()
  })

  it('toont stat-cards met de juiste tellingen (open/due/afgerond/on hold)', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    const waarden = Array.from(document.querySelectorAll('.stat-waarde')).map(
      (el) => el.textContent,
    )
    expect(waarden).toEqual(['2', '1', '0', '1'])
  })

  it('filtert op zoekterm', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
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
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
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
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
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
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    await user.click(screen.getByLabelText('Filter op Ton'))
    expect(
      screen.queryByDisplayValue('Op hold gezette actie'),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alle' }))
    expect(screen.getByDisplayValue('Op hold gezette actie')).toBeInTheDocument()
  })

  it('nummert de rijen oplopend, ongeacht sortering', () => {
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    const rijnummers = Array.from(
      document.querySelectorAll('table.actielijst tbody tr'),
    ).map((rij) => rij.querySelector('td')?.textContent)
    expect(rijnummers).toEqual(['1', '2', '3'])
  })

  it('roept window.print() aan via de Print-knop', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: 'Print' }))

    expect(printSpy).toHaveBeenCalledOnce()
    printSpy.mockRestore()
  })

  it('exporteert de actuele (gefilterde) lijst via de Excel-knop', async () => {
    const user = userEvent.setup()
    render(
      <ActielijstPage klantId="klant-1" klantNaam="Malcon" onTerug={vi.fn()} />,
    )

    await user.click(screen.getByLabelText('Filter op Ton'))
    await user.click(screen.getByRole('button', { name: 'Excel' }))

    expect(exporteerNaarExcel).toHaveBeenCalledOnce()
    const [geexporteerdeActies, klantNaam] = exporteerNaarExcel.mock.calls[0]
    expect(geexporteerdeActies).toHaveLength(1)
    expect(geexporteerdeActies[0].actie).toBe('Lift laten keuren')
    expect(klantNaam).toBe('Malcon')
  })
})
