export type CsvRow = Record<string, string>
export type CsvParseResult = CsvRow[]

export function parseCsv(text: string): CsvParseResult {
  const lines = String(text || "").split(/\r?\n/).filter(Boolean)
  const headers = (lines.shift() || "").split(",").map((item) => item.trim()).filter(Boolean)

  if (!headers.length) return []

  return lines.map((line) => {
    const values = line.split(",")
    return headers.reduce<CsvRow>((acc, header, index) => {
      acc[header] = values[index] || ""
      return acc
    }, {})
  })
}

export function parseCsvDetailed(text: string) {
  const rows = parseCsv(text)
  const headers = rows.length ? Object.keys(rows[0] || {}) : []
  return { headers, rows, errors: [] as string[] }
}

export default parseCsv
