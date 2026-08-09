import { afterEach, describe, expect, it, vi } from 'vitest'
import { vraagArchiveerGegevens } from './archiveerPrompt'

describe('vraagArchiveerGegevens', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('geeft door en reden terug als beide prompts worden ingevuld', () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Ton').mockReturnValueOnce('verkocht')
    expect(vraagArchiveerGegevens()).toEqual({ door: 'Ton', reden: 'verkocht' })
  })

  it('geeft null terug als de eerste prompt geannuleerd wordt', () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce(null)
    expect(vraagArchiveerGegevens()).toBeNull()
  })

  it('laat reden leeg als die prompt geannuleerd of leeg is', () => {
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Seth').mockReturnValueOnce(null)
    expect(vraagArchiveerGegevens()).toEqual({ door: 'Seth', reden: undefined })
  })
})
