/** Formatteert een ISO-datum (YYYY-MM-DD) als dd-mm-jjjj. */
export function formatteerDatum(iso: string): string {
  const [jaar, maand, dag] = iso.split('-')
  return `${dag}-${maand}-${jaar}`
}
