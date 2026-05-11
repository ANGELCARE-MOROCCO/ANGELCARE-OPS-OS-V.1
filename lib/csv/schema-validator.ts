import { getDatasetSchema } from "./dataset-registry"

export type SchemaValidationIssue = {
  severity: "error" | "warning"
  field: string
  message: string
}

export function validateAgainstDatasetSchema(datasetId: string, rows: Record<string, string>[]) {
  const schema = getDatasetSchema(datasetId)
  const issues: SchemaValidationIssue[] = []

  if (!schema) {
    return [{ severity: "error" as const, field: "dataset", message: "Unknown dataset schema." }]
  }

  const headers = rows[0] ? Object.keys(rows[0]) : []

  schema.columns.forEach((column) => {
    if (column.required && !headers.includes(column.key)) {
      issues.push({
        severity: "error",
        field: column.key,
        message: `Missing required column: ${column.key}`,
      })
    }
  })

  headers.forEach((header) => {
    if (!schema.columns.some((column) => column.key === header)) {
      issues.push({
        severity: "warning",
        field: header,
        message: `Unexpected column: ${header}`,
      })
    }
  })

  rows.forEach((row, index) => {
    schema.columns.forEach((column) => {
      const value = row[column.key]

      if (column.required && !value) {
        issues.push({
          severity: "error",
          field: column.key,
          message: `Row ${index + 1}: required value missing.`,
        })
      }

      if (column.type === "date" && value && Number.isNaN(Date.parse(value))) {
        issues.push({
          severity: "warning",
          field: column.key,
          message: `Row ${index + 1}: date may be invalid.`,
        })
      }
    })
  })

  return issues
}