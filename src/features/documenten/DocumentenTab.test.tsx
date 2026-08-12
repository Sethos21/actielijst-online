import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentenTab } from './DocumentenTab'

const uploadDocument = vi.fn()
const updateOpmerking = vi.fn()
const updateTag = vi.fn()
const archiveer = vi.fn()

let mockDocumenten: {
  id: string
  naam: string
  tag: string
  storageUrl: string
  geuploadDoor: string
  geuploadOp: number
  opmerking?: string
  gearchiveerdOp?: number
}[] = []

vi.mock('./useDocumenten', () => ({
  useDocumenten: () => ({
    documenten: mockDocumenten,
    loading: false,
    uploadDocument,
    updateOpmerking,
    updateTag,
    archiveer,
  }),
}))

const downloadAlleDocumentenAlsZip = vi.fn()
vi.mock('./zipDownload', () => ({
  downloadAlleDocumentenAlsZip: (...args: unknown[]) => downloadAlleDocumentenAlsZip(...args),
}))

const addActie = vi.fn(async (_nieuw: Record<string, unknown>) => 'nieuwe-actie-1')
vi.mock('../acties/useActies', () => ({
  useActies: () => ({ addActie }),
}))

const onNavigeerNaarActie = vi.fn()

function renderTab() {
  return render(
    <DocumentenTab
      pandId="p1"
      klantId="klant-1"
      pandNaam="Hoofdstraat 12"
      onNavigeerNaarActie={onNavigeerNaarActie}
    />,
  )
}

describe('DocumentenTab', () => {
  afterEach(() => {
    mockDocumenten = []
    uploadDocument.mockClear()
    updateOpmerking.mockClear()
    updateTag.mockClear()
    archiveer.mockClear()
    downloadAlleDocumentenAlsZip.mockClear()
    addActie.mockClear()
    onNavigeerNaarActie.mockClear()
    vi.restoreAllMocks()
  })

  it('toont een lege staat als er nog geen documenten zijn', () => {
    renderTab()
    expect(screen.getByText('Nog geen documenten.')).toBeInTheDocument()
  })

  it('toont documenten met tag, meta-info en een opmerking indien aanwezig', () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Energielabel_Hoofdstraat12.pdf',
        tag: 'energielabel',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Seth',
        geuploadOp: new Date('2026-05-03').getTime(),
        opmerking: 'Label loopt af per 1 mei 2036.',
      },
      {
        id: 'd2',
        naam: 'Keuringsrapport_CV_2026.pdf',
        tag: 'keuring',
        storageUrl: 'https://storage.example/d2',
        geuploadDoor: 'Ton',
        geuploadOp: new Date('2026-01-14').getTime(),
      },
    ]
    renderTab()

    expect(
      screen.getByText('Energielabel_Hoofdstraat12.pdf'),
    ).toBeInTheDocument()
    expect(screen.getByText('Geüpload 3 mei 2026 · Seth')).toBeInTheDocument()
    expect(screen.getByLabelText('Type voor Energielabel_Hoofdstraat12.pdf')).toHaveValue(
      'energielabel',
    )
    expect(screen.getByText('Label loopt af per 1 mei 2036.')).toBeInTheDocument()

    expect(screen.getByText('Keuringsrapport_CV_2026.pdf')).toBeInTheDocument()
    expect(screen.getByText('+ opmerking toevoegen')).toBeInTheDocument()
  })

  it('toont gearchiveerde documenten niet en telt alleen actieve documenten', () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Oud_energielabel.pdf',
        tag: 'energielabel',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Seth',
        geuploadOp: Date.now(),
        gearchiveerdOp: Date.now(),
      },
    ]
    renderTab()
    expect(screen.getByText('Nog geen documenten.')).toBeInTheDocument()
    expect(screen.getByText('0 documenten')).toBeInTheDocument()
  })

  it('opent het uploadformulier en roept uploadDocument aan met de gekozen velden', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Document uploaden' }))

    const bestand = new File(['inhoud'], 'contract.pdf', {
      type: 'application/pdf',
    })
    await user.upload(screen.getByLabelText('Bestand'), bestand)
    await user.selectOptions(screen.getByLabelText('Type document'), 'contract')
    await user.selectOptions(screen.getByLabelText('Geüpload door'), 'Marjan')
    await user.type(
      screen.getByLabelText('Opmerking bij document'),
      'Opzegtermijn 3 maanden',
    )
    await user.click(screen.getByRole('button', { name: 'Uploaden' }))

    expect(uploadDocument).toHaveBeenCalledWith(
      'klant-1',
      bestand,
      'contract',
      'Marjan',
      'Opzegtermijn 3 maanden',
    )
  })

  it('biedt de uitgebreide documenttypen aan in het uploadformulier', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Document uploaden' }))

    const select = screen.getByLabelText('Type document')
    for (const type of ['certificaat', 'offerte', 'factuur', 'tekeningen']) {
      await user.selectOptions(select, type)
      expect(select).toHaveValue(type)
    }
  })

  it('slaat een toegevoegde opmerking op via updateOpmerking', async () => {
    mockDocumenten = [
      {
        id: 'd2',
        naam: 'Keuringsrapport_CV_2026.pdf',
        tag: 'keuring',
        storageUrl: 'https://storage.example/d2',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByText('+ opmerking toevoegen'))
    await user.type(
      screen.getByLabelText('Opmerking voor Keuringsrapport_CV_2026.pdf'),
      'Volgende keuring in 2027',
    )
    await user.tab()

    expect(updateOpmerking).toHaveBeenCalledWith('d2', 'Volgende keuring in 2027')
  })

  it('kopieert een bestaande opmerking naar het klembord', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Bouwtekening.dwg',
        tag: 'overig',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
        opmerking: '\\\\server\\documenten\\pand12',
      },
    ]
    const user = userEvent.setup()
    // user-event installeert zelf een Clipboard-stub op navigator.clipboard
    // zodra setup() draait — pas daarna spy'en, anders wordt de spy overschreven.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    renderTab()

    await user.click(screen.getByRole('button', { name: '📋 Kopieer' }))

    expect(writeText).toHaveBeenCalledWith('\\\\server\\documenten\\pand12')
  })

  it('wijzigt het type van een document via de select', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Contract.pdf',
        tag: 'contract',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.selectOptions(screen.getByLabelText('Type voor Contract.pdf'), 'overig')

    expect(updateTag).toHaveBeenCalledWith('d1', 'overig')
  })

  it('archiveert een document met opgegeven teamlid en reden', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Oud_energielabel.pdf',
        tag: 'energielabel',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Seth',
        geuploadOp: Date.now(),
      },
    ]
    vi.spyOn(window, 'prompt').mockReturnValueOnce('Seth').mockReturnValueOnce('vervangen')
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByLabelText('Archiveren: Oud_energielabel.pdf'))

    expect(archiveer).toHaveBeenCalledWith('d1', 'Seth', 'vervangen')
  })

  it('downloadt alle actieve documenten als ZIP', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Contract.pdf',
        tag: 'contract',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '⬇ Alles als ZIP' }))

    expect(downloadAlleDocumentenAlsZip).toHaveBeenCalledWith(mockDocumenten, 'Hoofdstraat 12')
  })

  it('opent het document in een nieuw tabblad bij dubbelklikken op de rij', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Contract.pdf',
        tag: 'contract',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
      },
    ]
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
    const user = userEvent.setup()
    renderTab()

    await user.dblClick(screen.getByText('Contract.pdf'))

    expect(windowOpen).toHaveBeenCalledWith(
      'https://storage.example/d1',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('toont een preview-paneel met ingebedde PDF-viewer bij klikken op + Bekijken', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Contract.pdf',
        tag: 'contract',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Bekijken' }))

    expect(screen.getByTitle('Contract.pdf')).toBeInTheDocument()
    expect(screen.getByTitle('Contract.pdf').tagName).toBe('IFRAME')
    expect(
      screen.getByRole('link', { name: 'Bekijk volledig document ⬈' }),
    ).toHaveAttribute('href', 'https://storage.example/d1')
    // Het upload-formulier blijft ernaast beschikbaar.
    expect(screen.getByLabelText('Bestand')).toBeInTheDocument()
  })

  it('toont een fallback-melding bij een bestandstype zonder preview', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Bouwtekening.dwg',
        tag: 'overig',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Bekijken' }))

    expect(
      screen.getByText('Geen preview beschikbaar voor dit bestandstype.'),
    ).toBeInTheDocument()
  })

  it('sluit het preview-paneel via de sluitknop', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Contract.pdf',
        tag: 'contract',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Ton',
        geuploadOp: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Bekijken' }))
    expect(screen.getByTitle('Contract.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sluiten' }))
    expect(screen.queryByTitle('Contract.pdf')).not.toBeInTheDocument()
  })

  it('maakt een actie aan vanuit een document, met pand en herkomst gevuld', async () => {
    mockDocumenten = [
      {
        id: 'd1',
        naam: 'Huurcontract_Tiemessen.pdf',
        tag: 'contract',
        storageUrl: 'https://storage.example/d1',
        geuploadDoor: 'Margriet',
        geuploadOp: Date.now(),
      },
    ]
    const user = userEvent.setup()
    renderTab()

    await user.click(screen.getByRole('button', { name: '+ Actie aanmaken' }))

    expect(addActie).toHaveBeenCalledOnce()
    const nieuweActie = addActie.mock.calls[0][0]
    expect(nieuweActie.onderwerp).toBe('Huurcontract_Tiemessen.pdf')
    expect(nieuweActie.pandId).toBe('p1')
    expect(nieuweActie.vestiging).toBe('Hoofdstraat 12')
    expect(nieuweActie.herkomst).toEqual({
      type: 'document',
      bronId: 'd1',
      label: 'Huurcontract_Tiemessen.pdf',
    })
    expect(onNavigeerNaarActie).toHaveBeenCalledWith('nieuwe-actie-1')
  })
})
