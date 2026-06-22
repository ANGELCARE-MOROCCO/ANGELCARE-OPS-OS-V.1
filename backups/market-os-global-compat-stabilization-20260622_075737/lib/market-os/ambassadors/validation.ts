
export type AmbassadorValidationIssue = {
  field: string
  message: string
  severity?: "error" | "warning" | "info"
}

export type AmbassadorValidationResult = {
  ok: boolean
  valid: boolean
  issues: AmbassadorValidationIssue[]
  warnings: AmbassadorValidationIssue[]
  errors: AmbassadorValidationIssue[]
}

export function validateAmbassadorRecord(record: Record<string, any> = {}): AmbassadorValidationResult {
  const errors: AmbassadorValidationIssue[] = []
  const warnings: AmbassadorValidationIssue[] = []

  const name = record.name || record.fullName || record.full_name || record.title
  if (!name) {
    errors.push({ field: "name", message: "Ambassador name is required.", severity: "error" })
  }

  return {
    ok: errors.length === 0,
    valid: errors.length === 0,
    issues: [...errors, ...warnings],
    warnings,
    errors,
  }
}

export function validateAmbassadorPayload(payload: Record<string, any> = {}) {
  return validateAmbassadorRecord(payload)
}

export function validateAmbassadorImportRow(row: Record<string, any> = {}) {
  return validateAmbassadorRecord(row)
}

export function deriveAmbassadorKpis(records: Record<string, any>[] = []) {
  const total = records.length
  return {
    total,
    active: records.filter((item) => String(item.status || "").toLowerCase() === "active").length,
    pending: records.filter((item) => String(item.status || "").toLowerCase().includes("pending")).length,
    archived: records.filter((item) => String(item.status || "").toLowerCase() === "archived").length,
    readiness: total ? 100 : 0,
  }
}

export default {
  validateAmbassadorRecord,
  validateAmbassadorPayload,
  validateAmbassadorImportRow,
  deriveAmbassadorKpis,
}
