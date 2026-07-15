export type CsvValidationResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export function validateCsvRows(rows: Record<string, any>[] = []): CsvValidationResult {
  return {
    ok: true,
    errors: [],
    warnings: rows.length ? [] : ["No rows found."],
  }
}

export function validateRequiredColumns(headers: string[] = [], required: string[] = []): CsvValidationResult {
  const missing = required.filter((item) => !headers.includes(item))
  return {
    ok: missing.length === 0,
    errors: missing.map((item) => `Missing required column: ${item}`),
    warnings: [],
  }
}

export default {
  validateCsvRows,
  validateRequiredColumns,
}
