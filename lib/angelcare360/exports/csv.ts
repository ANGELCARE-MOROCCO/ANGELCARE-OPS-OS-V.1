export function cleanCsvField(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function buildAngelcare360Csv(rows: Array<Record<string, unknown>>, columns?: string[]) {
  const headers = columns && columns.length ? columns : Object.keys(rows[0] || {})
  const lines = [headers.map(cleanCsvField).join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => cleanCsvField(row[header])).join(','))
  }
  return `\ufeff${lines.join('\n')}`
}

export function buildAngelcare360CsvResponsePayload(rows: Array<Record<string, unknown>>, columns?: string[]) {
  return buildAngelcare360Csv(rows, columns)
}

