export type CsvParseResult = {
  headers: string[]
  rows: Record<string, string>[]
  errors: string[]
}

export function parseCsv(text: string): CsvParseResult {
  const lines = String(text || "").split(/\r?\n/).filter(Boolean)
  const headers = (lines.shift() || "").split(",").map((item) => item.trim())
  const rows = lines.map((line) => {
    const values = line.split(",")
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] || ""
      return acc
    }, {})
  })

  return { headers, rows, errors: [] }
}

export default parseCsv
