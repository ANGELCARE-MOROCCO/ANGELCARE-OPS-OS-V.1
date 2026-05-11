export const REQUIRED_COLUMNS = ["id", "title", "status", "owner"]

export const ALLOWED_STATUS = [
  // Content statuses
  "draft",
  "review",
  "approved",
  "scheduled",
  "published",
  "blocked",

  // Task statuses
  "todo",
  "doing",
  "done",
  "cancelled",

  // Lead / partnership statuses
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
  "meeting",
  "negotiation",

  // General operational statuses
  "active",
  "inactive",
  "pending",
  "paused",
  "suspended",
  "completed",
  "enrolled",
]

export type CsvValidationError = {
  row: number
  field: string
  message: string
}

export type CsvValidationResult = {
  valid: boolean
  errors: CsvValidationError[]
}

export function validateCsvRows(rows: Record<string, string>[]): CsvValidationResult {
  const errors: CsvValidationError[] = []

  rows.forEach((row, index) => {
    REQUIRED_COLUMNS.forEach((column) => {
      if (!row[column] || row[column].trim() === "") {
        errors.push({
          row: index + 1,
          field: column,
          message: "Missing required value",
        })
      }
    })

    const status = row.status?.trim().toLowerCase()

    if (status && !ALLOWED_STATUS.includes(status)) {
      errors.push({
        row: index + 1,
        field: "status",
        message: `Invalid status: ${row.status}`,
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}