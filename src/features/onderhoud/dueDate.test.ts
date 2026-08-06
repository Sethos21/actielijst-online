import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bepaalOnderhoudStatus,
  berekenVolgendeOnderhoudsdatum,
  formatKorteDatum,
  formatOnderhoudStatusLabel,
} from './dueDate'

const EEN_DAG_MS = 24 * 60 * 60 * 1000

describe('bepaalOnderhoudStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is "due" als de volgende datum al verstreken is', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    expect(bepaalOnderhoudStatus(new Date('2026-05-01').getTime())).toBe('due')
  })

  it('is "gepland" binnen 3 weken, "ok" daarbuiten', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    const nu = Date.now()
    expect(bepaalOnderhoudStatus(nu + 20 * EEN_DAG_MS)).toBe('gepland')
    expect(bepaalOnderhoudStatus(nu + 22 * EEN_DAG_MS)).toBe('ok')
  })
})

describe('berekenVolgendeOnderhoudsdatum', () => {
  it('telt 1 jaar op bij de uitvoerdatum, niet bij de oorspronkelijk geplande datum', () => {
    const uitgevoerdOp = new Date('2026-01-14').getTime()
    const volgende = berekenVolgendeOnderhoudsdatum(uitgevoerdOp)
    expect(new Date(volgende).getUTCFullYear()).toBe(2027)
    expect(volgende - uitgevoerdOp).toBe(365 * EEN_DAG_MS)
  })
})

describe('formatOnderhoudStatusLabel', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('toont "Due" voor verlopen items', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    expect(formatOnderhoudStatusLabel(new Date('2026-05-01').getTime())).toBe('Due')
  })

  it('toont "Op schema" ver in de toekomst', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    expect(
      formatOnderhoudStatusLabel(Date.now() + 100 * EEN_DAG_MS),
    ).toBe('Op schema')
  })

  it('toont het aantal resterende weken binnen de gepland-periode', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    expect(formatOnderhoudStatusLabel(Date.now() + 20 * EEN_DAG_MS)).toBe(
      'Over 3 weken',
    )
    expect(formatOnderhoudStatusLabel(Date.now() + 5 * EEN_DAG_MS)).toBe(
      'Over 1 week',
    )
  })
})

describe('formatKorteDatum', () => {
  it('formatteert als "14 jan 2025"', () => {
    expect(formatKorteDatum(new Date('2025-01-14').getTime())).toBe('14 jan 2025')
  })

  it('gebruikt "sept" (niet "sep") voor september', () => {
    expect(formatKorteDatum(new Date('2025-09-02').getTime())).toBe('2 sept 2025')
  })
})
