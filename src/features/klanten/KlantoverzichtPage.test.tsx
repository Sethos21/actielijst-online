import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KlantoverzichtPage } from './KlantoverzichtPage'

const addKlant = vi.fn()
const onSelectKlant = vi.fn()
const onImporteren = vi.fn()
const onTerugNaarStart = vi.fn()

vi.mock('./useKlanten', () => ({
  useKlanten: () => ({
    klanten: [
      { id: '1', naam: 'Malcon', aangemaaktOp: 1 },
      { id: '2', naam: 'Basisweg BV', aangemaaktOp: 2 },
    ],
    loading: false,
    addKlant,
  }),
}))

vi.mock('../acties/useActieStats', () => ({
  useActieStats: () => ({
    '1': { open: 3, due: 1 },
  }),
}))

vi.mock('../versies/useLaatsteVersieDatums', () => ({
  useLaatsteVersieDatums: () => ({
    '1': '2026-01-15',
    '2': '2026-06-01',
  }),
}))

function renderScherm() {
  return render(
    <KlantoverzichtPage
      onSelectKlant={onSelectKlant}
      onImporteren={onImporteren}
      onTerugNaarStart={onTerugNaarStart}
    />,
  )
}

describe('KlantoverzichtPage', () => {
  it('toont klanten met hun open/due-badges, laatste versiedatum en filtert op zoekterm', async () => {
    const user = userEvent.setup()
    renderScherm()

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.getByText('Basisweg BV')).toBeInTheDocument()
    expect(screen.getByText('3 open')).toBeInTheDocument()
    expect(screen.getByText('1 due')).toBeInTheDocument()
    expect(screen.getByText('15-01-2026')).toBeInTheDocument()
    expect(screen.getByText('01-06-2026')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Zoek klant'), 'malcon')

    expect(screen.getByText('Malcon')).toBeInTheDocument()
    expect(screen.queryByText('Basisweg BV')).not.toBeInTheDocument()
  })

  it('selecteert een klant bij klikken op de rij', async () => {
    const user = userEvent.setup()
    renderScherm()

    await user.click(screen.getByText('Malcon'))

    expect(onSelectKlant).toHaveBeenCalledWith({
      id: '1',
      naam: 'Malcon',
      aangemaaktOp: 1,
    })
  })

  it('sorteert op laatste versie bij klikken op die kolomkop', async () => {
    const user = userEvent.setup()
    renderScherm()

    await user.click(screen.getByRole('button', { name: /Laatste versie/ }))

    const rijen = Array.from(
      document.querySelectorAll('table.klantoverzicht tbody tr'),
    ).map((rij) => rij.querySelector('td')?.textContent)
    // Ascending op datum: Malcon (15-01) vóór Basisweg BV (01-06).
    expect(rijen).toEqual(['Malcon', 'Basisweg BV'])
  })

  it('roept onTerugNaarStart aan bij klikken op de terug-knop', async () => {
    const user = userEvent.setup()
    renderScherm()

    await user.click(screen.getByRole('button', { name: '← Terug naar start' }))
    expect(onTerugNaarStart).toHaveBeenCalledOnce()
  })
})
