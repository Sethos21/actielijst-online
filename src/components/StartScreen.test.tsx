import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StartScreen } from './StartScreen'

describe('StartScreen', () => {
  it('toont beide keuzetegels met titel en omschrijving', () => {
    render(
      <StartScreen
        onKiesActielijsten={vi.fn()}
        onKiesHuurdersmutaties={vi.fn()}
      />,
    )

    expect(screen.getByText('Actielijsten')).toBeInTheDocument()
    expect(
      screen.getByText('Acties per klant bijhouden, dashboard en versiebeheer'),
    ).toBeInTheDocument()
    expect(screen.getByText('Huurdersmutaties')).toBeInTheDocument()
    expect(
      screen.getByText('Ingaande en vertrekkende huurders per maand'),
    ).toBeInTheDocument()
  })

  it('roept onKiesActielijsten aan bij klikken op de Actielijsten-tegel', async () => {
    const user = userEvent.setup()
    const onKiesActielijsten = vi.fn()
    render(
      <StartScreen
        onKiesActielijsten={onKiesActielijsten}
        onKiesHuurdersmutaties={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Actielijsten/ }))
    expect(onKiesActielijsten).toHaveBeenCalledOnce()
  })

  it('roept onKiesHuurdersmutaties aan bij klikken op de Huurdersmutaties-tegel', async () => {
    const user = userEvent.setup()
    const onKiesHuurdersmutaties = vi.fn()
    render(
      <StartScreen
        onKiesActielijsten={vi.fn()}
        onKiesHuurdersmutaties={onKiesHuurdersmutaties}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Huurdersmutaties/ }))
    expect(onKiesHuurdersmutaties).toHaveBeenCalledOnce()
  })
})
