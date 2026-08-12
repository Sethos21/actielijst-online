import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ActieItem } from './types'

const addDocMock = vi.fn(async (..._args: unknown[]) => ({ id: 'nieuwe-actie-1' }))
let snapshotDocs: { id: string; data: () => Record<string, unknown> }[] = []

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    addDoc: (...args: unknown[]) => addDocMock(...args),
    onSnapshot: (_query: unknown, callback: (snapshot: { docs: typeof snapshotDocs }) => void) => {
      callback({ docs: snapshotDocs })
      return () => {}
    },
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(),
  }
})

vi.mock('../../lib/firebase', () => ({ db: {} }))

function bestaandeActie(overrides: Partial<ActieItem>): { id: string; data: () => Record<string, unknown> } {
  const { id, ...rest } = {
    id: 'a1',
    klantId: 'klant-1',
    ref: '1',
    onderwerp: '',
    bedrijf: '',
    vestiging: '',
    actie: '',
    verantw: [],
    aangemaaktOp: '2026-01-01',
    doorlooptijd: '2w',
    status: 'open',
    opmerking: '',
    ...overrides,
  }
  return { id, data: () => rest }
}

describe('useActies addActie', () => {
  it('kent automatisch het eerstvolgende ref-nummer toe als er nog geen acties zijn', async () => {
    snapshotDocs = []
    const { useActies } = await import('./useActies')
    const { result } = renderHook(() => useActies('klant-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.addActie({
      onderwerp: 'Test',
      bedrijf: '',
      vestiging: '',
      actie: '',
      verantw: [],
      aangemaaktOp: '2026-01-01',
      doorlooptijd: '2w',
      status: 'open',
      opmerking: '',
    })

    expect(addDocMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ ref: '1' }),
    )
  })

  it('telt op vanaf het hoogste bestaande ref-nummer, ook voor acties aangemaakt via bouwActieVanuitBron (ref: "")', async () => {
    snapshotDocs = [
      bestaandeActie({ ref: '3' }),
      bestaandeActie({ id: 'a2', ref: '7' }),
      bestaandeActie({ id: 'a3', ref: '2' }),
    ]
    const { useActies } = await import('./useActies')
    const { result } = renderHook(() => useActies('klant-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.addActie({
      ref: '',
      onderwerp: 'Vanuit onderhoud',
      bedrijf: '',
      vestiging: '',
      actie: '',
      verantw: [],
      aangemaaktOp: '2026-01-01',
      doorlooptijd: '2w',
      status: 'open',
      opmerking: '',
    })

    expect(addDocMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ ref: '8' }),
    )
  })

  it('gebruikt een expliciet meegegeven ref als die aanwezig is', async () => {
    snapshotDocs = [bestaandeActie({ ref: '1' })]
    const { useActies } = await import('./useActies')
    const { result } = renderHook(() => useActies('klant-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await result.current.addActie({
      ref: 'A99',
      onderwerp: 'Handmatige ref',
      bedrijf: '',
      vestiging: '',
      actie: '',
      verantw: [],
      aangemaaktOp: '2026-01-01',
      doorlooptijd: '2w',
      status: 'open',
      opmerking: '',
    })

    expect(addDocMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ ref: 'A99' }),
    )
  })
})
