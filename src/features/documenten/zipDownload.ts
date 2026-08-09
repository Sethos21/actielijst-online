import type { Document } from './types'

/** Laadt jszip pas bij daadwerkelijk downloaden, zodat de library niet in de
 * hoofdbundel zit — zelfde patroon als xlsx, zie src/features/acties/excelExport.ts.
 * Haalt elk bestand opnieuw op via fetch — bij veel/grote documenten trager,
 * maar voor de huidige schaal (enkele documenten per pand) geen probleem. */
export async function downloadAlleDocumentenAlsZip(documenten: Document[], pandNaam: string) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  await Promise.all(
    documenten.map(async (doc) => {
      const response = await fetch(doc.storageUrl)
      const blob = await response.blob()
      zip.file(doc.naam, blob)
    }),
  )

  const inhoud = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(inhoud)
  const a = document.createElement('a')
  a.href = url
  a.download = `Documenten_${pandNaam.replace(/[^a-z0-9]/gi, '_')}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
