import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadAlleDocumentenAlsZip } from './zipDownload'
import type { Document } from './types'

const file = vi.fn()
const generateAsync = vi.fn().mockResolvedValue(new Blob(['zip-inhoud']))

vi.mock('jszip', () => ({
  default: class {
    file = file
    generateAsync = generateAsync
  },
}))

function maakDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: '1',
    pandId: 'p1',
    klantId: 'k1',
    naam: 'Contract.pdf',
    tag: 'contract',
    storageUrl: 'https://storage.example/contract.pdf',
    storagePath: 'panden/p1/contract.pdf',
    geuploadDoor: 'Ton',
    geuploadOp: 1,
    ...overrides,
  }
}

describe('downloadAlleDocumentenAlsZip', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    file.mockClear()
    generateAsync.mockClear()
  })

  it('haalt elk document op en voegt het toe aan het zip-bestand', async () => {
    const blob1 = new Blob(['a'])
    const blob2 = new Blob(['b'])
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ blob: () => Promise.resolve(blob1) })
        .mockResolvedValueOnce({ blob: () => Promise.resolve(blob2) }),
    )
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:mock'), revokeObjectURL: vi.fn() })
    const click = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_v: string) {},
      set download(_v: string) {},
      click,
    } as unknown as HTMLAnchorElement)

    await downloadAlleDocumentenAlsZip(
      [maakDocument({ naam: 'Contract.pdf' }), maakDocument({ id: '2', naam: 'Label.pdf' })],
      'Hoofdstraat 12',
    )

    expect(file).toHaveBeenCalledWith('Contract.pdf', blob1)
    expect(file).toHaveBeenCalledWith('Label.pdf', blob2)
    expect(generateAsync).toHaveBeenCalledWith({ type: 'blob' })
    expect(click).toHaveBeenCalledOnce()
  })

  it('maakt een veilige bestandsnaam op basis van de pandnaam', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) }))
    vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:mock'), revokeObjectURL: vi.fn() })
    let downloadNaam = ''
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_v: string) {},
      set download(v: string) {
        downloadNaam = v
      },
      click: vi.fn(),
    } as unknown as HTMLAnchorElement)

    await downloadAlleDocumentenAlsZip([maakDocument()], 'Hoofdstraat 12, Vlijmen')

    expect(downloadNaam).toBe('Documenten_Hoofdstraat_12__Vlijmen.zip')
  })
})
