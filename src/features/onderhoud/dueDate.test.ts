import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bepaalEffectieveStatus,
  bepaalOnderhoudStatus,
  formatKorteDatum,
  formatOnderhoudStatusLabel,
  moetAutomatischResetten,
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

describe('moetAutomatischResetten', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is false als er nog nooit is uitgevoerd', () => {
    expect(
      moetAutomatischResetten({ laatstUitgevoerdOp: undefined, herhaling: 'jaarlijks' }),
    ).toBe(false)
  })

  it('jaarlijks: is true als laatst uitgevoerd vóór 1 januari van dit jaar ligt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    expect(
      moetAutomatischResetten({ laatstUitgevoerdOp: '2025-12-15', herhaling: 'jaarlijks' }),
    ).toBe(true)
    expect(
      moetAutomatischResetten({ laatstUitgevoerdOp: '2026-01-15', herhaling: 'jaarlijks' }),
    ).toBe(false)
  })

  it('maandelijks: is true als laatst uitgevoerd vóór de 1e van deze maand ligt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15'))
    expect(
      moetAutomatischResetten({ laatstUitgevoerdOp: '2026-05-20', herhaling: 'maandelijks' }),
    ).toBe(true)
    expect(
      moetAutomatischResetten({ laatstUitgevoerdOp: '2026-06-02', herhaling: 'maandelijks' }),
    ).toBe(false)
  })
})

describe('bepaalEffectieveStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('geeft "open" en "due" ongewijzigd terug', () => {
    expect(
      bepaalEffectieveStatus({ status: 'open', laatstUitgevoerdOp: undefined, herhaling: 'jaarlijks' }),
    ).toBe('open')
    expect(
      bepaalEffectieveStatus({ status: 'due', laatstUitgevoerdOp: undefined, herhaling: 'jaarlijks' }),
    ).toBe('due')
  })

  it('reset "voltooid" naar "open" als de herhalingsperiode verstreken is', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    expect(
      bepaalEffectieveStatus({
        status: 'voltooid',
        laatstUitgevoerdOp: '2025-03-01',
        herhaling: 'jaarlijks',
      }),
    ).toBe('open')
  })

  it('houdt "voltooid" aan zolang de herhalingsperiode nog niet verstreken is', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))
    expect(
      bepaalEffectieveStatus({
        status: 'voltooid',
        laatstUitgevoerdOp: '2026-03-01',
        herhaling: 'jaarlijks',
      }),
    ).toBe('voltooid')
  })
})
