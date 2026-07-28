import { describe, expect, it } from 'vitest'
import { berekenDueDate, isDue, voegPeriodeToe } from './dueDate'

describe('voegPeriodeToe', () => {
  it('telt weken op', () => {
    expect(voegPeriodeToe('2026-01-01', 'w', 2)).toBe('2026-01-15')
  })

  it('telt maanden op', () => {
    expect(voegPeriodeToe('2026-01-01', 'm', 3)).toBe('2026-04-01')
  })
})

describe('berekenDueDate', () => {
  it('gebruikt aangemaaktOp + doorlooptijd als er niets is overschreven', () => {
    const due = berekenDueDate({
      aangemaaktOp: '2026-01-01',
      doorlooptijd: '2w',
    })
    expect(due).toBe('2026-01-15')
  })

  it('dueDateOverride wint van de automatische berekening', () => {
    const due = berekenDueDate({
      aangemaaktOp: '2026-01-01',
      doorlooptijd: '2w',
      dueDateOverride: '2026-03-01',
    })
    expect(due).toBe('2026-03-01')
  })

  it('postponedTot wint van dueDateOverride', () => {
    const due = berekenDueDate({
      aangemaaktOp: '2026-01-01',
      doorlooptijd: '2w',
      dueDateOverride: '2026-03-01',
      postponedTot: '2026-05-01',
    })
    expect(due).toBe('2026-05-01')
  })
})

describe('isDue', () => {
  it('is waar voor een open actie met een due date in het verleden', () => {
    expect(
      isDue({ status: 'open', aangemaaktOp: '2020-01-01', doorlooptijd: '1w' }),
    ).toBe(true)
  })

  it('is onwaar voor een open actie met een due date in de toekomst', () => {
    expect(
      isDue({ status: 'open', aangemaaktOp: '2999-01-01', doorlooptijd: '1w' }),
    ).toBe(false)
  })

  it('is altijd onwaar voor on-hold acties, ook met een verlopen due date', () => {
    expect(
      isDue({ status: 'hold', aangemaaktOp: '2020-01-01', doorlooptijd: '1w' }),
    ).toBe(false)
  })

  it('is onwaar voor afgeronde acties', () => {
    expect(
      isDue({ status: 'done', aangemaaktOp: '2020-01-01', doorlooptijd: '1w' }),
    ).toBe(false)
  })
})
