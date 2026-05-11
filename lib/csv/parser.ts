export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter(Boolean)

  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((header) => header.trim())

  return lines.slice(1).map((line) => {
    const values = line.split(",")

    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? ""
    })

    return row
  })
}