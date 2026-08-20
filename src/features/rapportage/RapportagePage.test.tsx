import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ActieItem } from '../acties/types'
import type { Mutatie } from '../huurdersmutaties/types'
import type { Onderhoud } from '../onderhoud/types'
import {
  bepaalHuidigKwartaal,
  bepaalKwartaalGrenzen,
  formatPeriodeLabel,
} from './kwartaalLogica'
import { RapportagePage } from './RapportagePage'

// Alle datums worden berekend t.o.v. het huidige kwartaal (real Date, geen
// fake timers) — zie de sprintworkflow-skill-les over vastlopende tests door
// vi.useFakeTimers() in combinatie met userEvent.
const HUIDIG_KWARTAAL = bepaalHuidigKwartaal()
const GRENZEN = bepaalKwartaalGrenzen(HUIDIG_KWARTAAL.jaar, HUIDIG_KWARTAAL.kwartaal)

function addDagen(iso: string, dagen: number): string {
  const datum = new Date(iso + 'T00:00:00')
  datum.setDate(datum.getDate() + dagen)
  return datum.toISOString().slice(0, 10)
}

const KLANTEN = [
  { id: 'klant-1', naam: 'Malcon B.V.', aangemaaktOp: 1 },
  { id: 'klant-2', naam: 'Bowog', aangemaaktOp: 2 },
]

vi.mock('../klanten/useKlanten', () => ({
  useKlanten: () => ({ klanten: KLANTEN, loading: false }),
  actieveKlanten: (klanten: { gearchiveerdOp?: number }[]) =>
    klanten.filter((k) => !k.gearchiveerdOp),
}))

function actie(overrides: Partial<ActieItem>): ActieItem {
  return {
    id: 'a1',
    klantId: 'klant-1',
    ref: '',
    onderwerp: 'Onderwerp',
    bedrijf: '',
    vestiging: '',
    actie: '',
    verantw: [],
    aangemaaktOp: GRENZEN.start,
    doorlooptijd: '2w',
    status: 'open',
    opmerking: '',
    ...overrides,
  }
}

const ACTIES: ActieItem[] = [
  actie({
    id: 'op-tijd',
    doorlooptijd: '2w', // due = start + 14 dagen
    afgerondOp: addDagen(GRENZEN.start, 5),
    status: 'done',
  }),
  actie({
    id: 'te-laat',
    doorlooptijd: '1w', // due = start + 7 dagen
    afgerondOp: addDagen(GRENZEN.start, 20),
    status: 'done',
  }),
  actie({ id: 'open-due', aangemaaktOp: '2000-01-01', doorlooptijd: '1w', status: 'open' }),
  actie({ id: 'open-niet-due', aangemaaktOp: '2099-01-01', doorlooptijd: '1w', status: 'open' }),
]

vi.mock('../acties/useAlleActies', () => ({
  useAlleActies: () => ({ acties: ACTIES, loading: false }),
}))

function mutatie(overrides: Partial<Mutatie>): Mutatie {
  return {
    id: 'm1',
    richting: 'in',
    jaar: HUIDIG_KWARTAAL.jaar,
    maand: 1,
    datum: addDagen(GRENZEN.start, 10),
    naam: 'Huurder',
    locatie: 'Malcon B.V.',
    administratie: '',
    opmerking: '',
    ...overrides,
  }
}

const MUTATIES: Mutatie[] = [
  mutatie({ id: 'in-1', richting: 'in' }),
  mutatie({ id: 'uit-1', richting: 'uit', datum: addDagen(GRENZEN.start, 15) }),
]

vi.mock('../huurdersmutaties/useMutaties', () => ({
  useMutaties: () => ({ mutaties: MUTATIES, loading: false }),
}))

vi.mock('../panden/usePanden', () => ({
  usePanden: () => ({ panden: [], loading: false, addPand: vi.fn() }),
}))

let mockOnderhoud: Onderhoud[] = []
vi.mock('../onderhoud/useOnderhoud', () => ({
  useOnderhoudVoorKlant: () => ({ onderhoud: mockOnderhoud, loading: false }),
}))

const exporteerRapportageNaarExcel = vi.fn()
vi.mock('./rapportageExcelExport', () => ({
  exporteerRapportageNaarExcel: (...args: unknown[]) => exporteerRapportageNaarExcel(...args),
}))

describe('RapportagePage', () => {
  afterEach(() => {
    mockOnderhoud = []
    exporteerRapportageNaarExcel.mockClear()
  })

  it('selecteert automatisch de eerste klant en het huidige kwartaal', () => {
    render(<RapportagePage />)

    expect(screen.getByLabelText('Kies klant')).toHaveValue('klant-1')
    expect(screen.getByLabelText('Van kwartaal')).toHaveValue(
      `${HUIDIG_KWARTAAL.jaar}-${HUIDIG_KWARTAAL.kwartaal}`,
    )
    expect(screen.getByLabelText('Tot en met kwartaal')).toHaveValue(
      `${HUIDIG_KWARTAAL.jaar}-${HUIDIG_KWARTAAL.kwartaal}`,
    )
    expect(
      screen.getByText(new RegExp(formatPeriodeLabel(GRENZEN.start, GRENZEN.eind))),
    ).toBeInTheDocument()
  })

  it('toont de samenvattingscards op basis van de gekozen periode', () => {
    render(<RapportagePage />)

    expect(screen.getByText('Acties afgerond').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('1 op tijd · 1 te laat')).toBeInTheDocument()
    expect(screen.getByText('Nog openstaand').nextSibling).toHaveTextContent('2')
    expect(screen.getByText('waarvan 1 due')).toBeInTheDocument()
    expect(screen.getAllByText('Huurdersmutaties')[0].nextSibling).toHaveTextContent('2')
    expect(screen.getByText('1 ingaand · 1 vertrokken')).toBeInTheDocument()
  })

  it('toont de acties- en mutaties-detaillijsten', () => {
    render(<RapportagePage />)

    expect(screen.getByText('Afgerond op tijd').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Afgerond te laat').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Nog openstaand (niet due)').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Nog openstaand (due)').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Ingaand vs. vertrekkend').nextSibling).toHaveTextContent('1 in · 1 uit')
  })

  it('toont geen Onderhoud-sectie als de klant geen onderhoudsdata heeft', () => {
    render(<RapportagePage />)
    expect(screen.queryByText(/^Onderhoud/)).not.toBeInTheDocument()
  })

  it('toont de Onderhoud-sectie met lege staat als de klant wel onderhoud gebruikt', () => {
    mockOnderhoud = [
      {
        id: 'o1',
        pandId: 'p1',
        klantId: 'klant-1',
        naam: 'CV-ketel',
        verantw: 'Ton',
        herhaling: 'jaarlijks',
        status: 'open',
        volgendeDatum: Date.now(),
        aangemaaktOp: Date.now(),
      },
    ]
    render(<RapportagePage />)
    expect(
      screen.getByText('Nog geen onderhoudsdata voor deze klant in deze periode.'),
    ).toBeInTheDocument()
  })

  it('wisselt van klant via de select', async () => {
    const user = userEvent.setup()
    render(<RapportagePage />)

    await user.selectOptions(screen.getByLabelText('Kies klant'), 'klant-2')

    expect(screen.getByText('Acties afgerond').nextSibling).toHaveTextContent('0')
  })

  it('exporteert het rapport van de geselecteerde klant en het gekozen kwartaal naar Excel', async () => {
    const user = userEvent.setup()
    render(<RapportagePage />)

    await user.click(screen.getByRole('button', { name: 'Excel' }))

    expect(exporteerRapportageNaarExcel).toHaveBeenCalledOnce()
    const [rapport, vanKwartaal, totKwartaal] = exporteerRapportageNaarExcel.mock.calls[0]
    expect(rapport.klantId).toBe('klant-1')
    expect(vanKwartaal).toEqual(HUIDIG_KWARTAAL)
    expect(totKwartaal).toEqual(HUIDIG_KWARTAAL)
  })

  it('roept window.print aan bij klikken op Print', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<RapportagePage />)

    await user.click(screen.getByRole('button', { name: 'Print' }))

    expect(printSpy).toHaveBeenCalledOnce()
    printSpy.mockRestore()
  })

  it('breidt de periode uit over meerdere kwartalen als een latere "tot"-kwartaal gekozen wordt', async () => {
    const user = userEvent.setup()
    render(<RapportagePage />)

    const volgendKwartaal =
      HUIDIG_KWARTAAL.kwartaal === 4
        ? { jaar: HUIDIG_KWARTAAL.jaar + 1, kwartaal: 1 as const }
        : { jaar: HUIDIG_KWARTAAL.jaar, kwartaal: ((HUIDIG_KWARTAAL.kwartaal + 1) as 1 | 2 | 3 | 4) }

    await user.selectOptions(
      screen.getByLabelText('Tot en met kwartaal'),
      `${volgendKwartaal.jaar}-${volgendKwartaal.kwartaal}`,
    )

    expect(
      screen.getByText(
        `Q${HUIDIG_KWARTAAL.kwartaal} ${HUIDIG_KWARTAAL.jaar} t/m Q${volgendKwartaal.kwartaal} ${volgendKwartaal.jaar}`,
        { exact: false },
      ),
    ).toBeInTheDocument()
  })

  it('schuift "van" mee als een "tot"-kwartaal vóór het huidige "van" gekozen wordt', async () => {
    const user = userEvent.setup()
    render(<RapportagePage />)

    const vorigKwartaal =
      HUIDIG_KWARTAAL.kwartaal === 1
        ? { jaar: HUIDIG_KWARTAAL.jaar - 1, kwartaal: 4 as const }
        : { jaar: HUIDIG_KWARTAAL.jaar, kwartaal: ((HUIDIG_KWARTAAL.kwartaal - 1) as 1 | 2 | 3 | 4) }

    await user.selectOptions(
      screen.getByLabelText('Tot en met kwartaal'),
      `${vorigKwartaal.jaar}-${vorigKwartaal.kwartaal}`,
    )

    expect(screen.getByLabelText('Van kwartaal')).toHaveValue(
      `${vorigKwartaal.jaar}-${vorigKwartaal.kwartaal}`,
    )
  })
})
