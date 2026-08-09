import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StartScreen } from './StartScreen'

function renderScherm(overrides: Partial<Parameters<typeof StartScreen>[0]> = {}) {
  return render(
    <StartScreen
      onKiesActielijsten={vi.fn()}
      onKiesHuurdersmutaties={vi.fn()}
      onKiesKlanten={vi.fn()}
      onKiesPanden={vi.fn()}
      {...overrides}
    />,
  )
}

describe('StartScreen', () => {
  it('toont alle keuzetegels met titel en omschrijving', () => {
    renderScherm()

    expect(screen.getByText('Actielijsten')).toBeInTheDocument()
    expect(
      screen.getByText('Acties per klant bijhouden, dashboard en versiebeheer'),
    ).toBeInTheDocument()
    expect(screen.getByText('Huurdersmutaties')).toBeInTheDocument()
    expect(
      screen.getByText('Ingaande en vertrekkende huurders per maand'),
    ).toBeInTheDocument()
    expect(screen.getByText('Klanten')).toBeInTheDocument()
    expect(screen.getByText('Direct naar het klantoverzicht')).toBeInTheDocument()
    expect(screen.getByText('Panden')).toBeInTheDocument()
    expect(
      screen.getByText('Alle panden van alle klanten in één overzicht'),
    ).toBeInTheDocument()
  })

  it('roept onKiesActielijsten aan bij klikken op de Actielijsten-tegel', async () => {
    const user = userEvent.setup()
    const onKiesActielijsten = vi.fn()
    renderScherm({ onKiesActielijsten })

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    expect(onKiesActielijsten).toHaveBeenCalledOnce()
  })

  it('roept onKiesHuurdersmutaties aan bij klikken op de Huurdersmutaties-tegel', async () => {
    const user = userEvent.setup()
    const onKiesHuurdersmutaties = vi.fn()
    renderScherm({ onKiesHuurdersmutaties })

    await user.click(screen.getByRole('button', { name: /Huurdersmutaties/ }))
    expect(onKiesHuurdersmutaties).toHaveBeenCalledOnce()
  })

  it('roept onKiesKlanten aan bij klikken op de Klanten-tegel', async () => {
    const user = userEvent.setup()
    const onKiesKlanten = vi.fn()
    renderScherm({ onKiesKlanten })

    await user.click(screen.getByRole('button', { name: /Klanten/ }))
    expect(onKiesKlanten).toHaveBeenCalledOnce()
  })

  it('roept onKiesPanden aan bij klikken op de Panden-tegel', async () => {
    const user = userEvent.setup()
    const onKiesPanden = vi.fn()
    renderScherm({ onKiesPanden })

    await user.click(screen.getByRole('button', { name: /Panden/ }))
    expect(onKiesPanden).toHaveBeenCalledOnce()
  })
})
