import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Huurdersmutaties } from './Huurdersmutaties'
import type { Mutatie } from './types'

const toon = vi.fn()
vi.mock('../../components/useToast', () => ({
  useToast: () => toon,
}))

const exporteerNaarExcel = vi.fn()
vi.mock('./mutatieExcelExport', () => ({
  exporteerNaarExcel: (...args: unknown[]) => exporteerNaarExcel(...args),
}))

const BASIS_MUTATIES: Mutatie[] = [
  {
    id: '1',
    richting: 'in',
    jaar: 2026,
    maand: 1,
    datum: '2026-01-10',
    naam: 'Jansen',
    locatie: 'Vlijmen',
    administratie: 'Malcon Beheer B.V.',
    opmerking: '',
  },
  {
    id: '2',
    richting: 'uit',
    jaar: 2026,
    maand: 1,
    datum: '2026-01-15',
    naam: 'Pietersen',
    locatie: 'Uden',
    administratie: 'Bowog Beheer B.V.',
    opmerking: 'Vertrekt per einde huurtermijn',
  },
]

const deleteMutatie = vi.fn()
const updateMutatie = vi.fn()

vi.mock('./useMutaties', () => ({
  useMutaties: () => {
    const [mutaties, setMutaties] = useState(BASIS_MUTATIES)
    return {
      mutaties,
      loading: false,
      addMutatie: vi.fn(async (nieuw: Omit<Mutatie, 'id'>) => {
        setMutaties((huidig) => [...huidig, { ...nieuw, id: `nieuw-${huidig.length + 1}` }])
      }),
      updateMutatie,
      deleteMutatie,
    }
  },
}))

vi.mock('./useMutatiesJaren', () => ({
  useMutatiesJaren: () => ({
    jaren: [2025, 2026, 2027],
    loading: false,
    voegJaarToe: vi.fn(async () => 2028),
  }),
}))

describe('Huurdersmutaties', () => {
  afterEach(() => {
    deleteMutatie.mockClear()
    updateMutatie.mockClear()
    toon.mockClear()
    exporteerNaarExcel.mockClear()
  })

  it('groepeert mutaties per maand en toont ingaand/vertrekkend naast elkaar', () => {
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    expect(screen.getByText('januari 2026')).toBeInTheDocument()
    expect(screen.getByText('Jansen')).toBeInTheDocument()
    expect(screen.getByText('Pietersen')).toBeInTheDocument()
  })

  it('toont de stats (ingaand, vertrekkend, netto, totaal)', () => {
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    expect(screen.getByText('Ingaand').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Vertrekkend').nextSibling).toHaveTextContent('1')
    expect(screen.getByText('Netto').nextSibling).toHaveTextContent('+0')
    expect(screen.getByText('Totaal').nextSibling).toHaveTextContent('2')
  })

  it('filtert op zoekterm (naam, locatie, administratie)', async () => {
    const user = userEvent.setup()
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    await user.type(
      screen.getByLabelText('Zoek huurder of locatie'),
      'Uden',
    )

    expect(screen.getByText('Pietersen')).toBeInTheDocument()
    expect(screen.queryByText('Jansen')).not.toBeInTheDocument()
  })

  it('voegt een nieuwe ingaande mutatie toe via "+ Ingaand toevoegen"', async () => {
    const user = userEvent.setup()
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    // Elke maand van het geselecteerde jaar heeft nu een eigen "+ toevoegen"
    // (ook lege maanden, zie vulJaarAan) — scope daarom op januari 2026.
    const januari = screen.getByText('januari 2026').closest('.hm-maand') as HTMLElement
    await user.click(within(januari).getByRole('button', { name: '+ Ingaand toevoegen' }))
    await user.type(screen.getByLabelText('Naam huurder'), 'De Vries')
    await user.type(screen.getByLabelText('Locatie'), 'Haarlem')
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(await screen.findByText('De Vries')).toBeInTheDocument()
  })

  it('kan een mutatie aanmaken in een maand die nog helemaal leeg is', async () => {
    const user = userEvent.setup()
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    const maart = screen.getByText('maart 2026').closest('.hm-maand') as HTMLElement
    await user.click(within(maart).getByRole('button', { name: '+ Vertrekkend toevoegen' }))
    await user.type(screen.getByLabelText('Naam huurder'), 'Eerste in maart')
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(await screen.findByText('Eerste in maart')).toBeInTheDocument()
  })

  it('bewerkt een bestaande mutatie na klikken op de kaart', async () => {
    const user = userEvent.setup()
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    await user.click(screen.getByText('Jansen'))
    const naamVeld = screen.getByLabelText('Naam huurder')
    await user.clear(naamVeld)
    await user.type(naamVeld, 'Jansen-Bakker')
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(updateMutatie).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ naam: 'Jansen-Bakker' }),
    )
  })

  it('vraagt bevestiging voordat een mutatie verwijderd wordt', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    await user.click(screen.getByText('Jansen'))
    await user.click(screen.getByLabelText('Verwijderen: Jansen'))

    expect(confirmSpy).toHaveBeenCalled()
    expect(deleteMutatie).toHaveBeenCalledWith('1')
    confirmSpy.mockRestore()
  })

  it('roept voegJaarToe aan via de "+ Jaar"-knop en toont een bevestiging', async () => {
    const user = userEvent.setup()
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '+ Jaar' }))

    expect(toon).toHaveBeenCalledWith('Jaar 2028 toegevoegd')
  })

  it('roept onTerug aan bij klikken op "Terug naar start"', async () => {
    const user = userEvent.setup()
    const onTerug = vi.fn()
    render(<Huurdersmutaties onTerug={onTerug} />)

    await user.click(screen.getByRole('button', { name: '← Terug naar start' }))
    expect(onTerug).toHaveBeenCalledOnce()
  })

  it('roept window.print() aan via de Print-knop', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Print' }))

    expect(printSpy).toHaveBeenCalledOnce()
    printSpy.mockRestore()
  })

  it('exporteert de actuele (gefilterde) lijst via de Excel-knop', async () => {
    const user = userEvent.setup()
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    await user.type(screen.getByLabelText('Zoek huurder of locatie'), 'Uden')
    await user.click(screen.getByRole('button', { name: 'Excel' }))

    expect(exporteerNaarExcel).toHaveBeenCalledOnce()
    const [geexporteerdeMutaties, jaarLabel] = exporteerNaarExcel.mock.calls[0]
    expect(geexporteerdeMutaties).toHaveLength(1)
    expect(geexporteerdeMutaties[0].naam).toBe('Pietersen')
    expect(jaarLabel).toBe('2026')
  })

  it('gebruikt "Alle jaren" als bestandslabel wanneer geen specifiek jaar geselecteerd is', async () => {
    const user = userEvent.setup()
    render(<Huurdersmutaties onTerug={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText('Filter op jaar'), 'alle')
    await user.click(screen.getByRole('button', { name: 'Excel' }))

    const [, jaarLabel] = exporteerNaarExcel.mock.calls[0]
    expect(jaarLabel).toBe('Alle jaren')
  })
})
