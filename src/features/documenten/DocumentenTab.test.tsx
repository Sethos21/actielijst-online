import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentenTab } from './DocumentenTab'

const uploadDocument = vi.fn()
const updateOpmerking = vi.fn()

let mockDocumenten: {
  id: string
  naam: string
  tag: string
  storageUrl: string
  geuploadDoor: string
  geuploadOp: number
  opmerking?: string
}[] = []

vi.mock('./useDocumenten', () => ({
  useDocumenten: () => ({
    documenten: mockDocumenten,
    loading: false,
    uploadDocument,
    updateOpmerking,
  }),
}))

const addActie = vi.fn()
vi.mock('../acties/useActies', () => ({
  useActies: () => ({ addActie }),
}))

function renderTab() {
  return render(
    <DocumentenTab pandId="p1" klantId="klant-1" pandNaam="Hoofdstraat 12" />,
  )
}

describe('DocumentenTab', () => {
  afterEach(() => {
    mockDocumenten = []
    uploadDocument.mockClear()
    updateOpmerking.mockClear()
    addActie.mockClear()
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
    expect(screen.getByText('Energielabel')).toBeInTheDocument()
    expect(screen.getByText('Label loopt af per 1 mei 2036.')).toBeInTheDocument()

    expect(screen.getByText('Keuringsrapport_CV_2026.pdf')).toBeInTheDocument()
    expect(screen.getByText('+ opmerking toevoegen')).toBeInTheDocument()
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
  })
})
