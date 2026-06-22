
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
  return { ok: errors.length === 0, valid: errors.length === 0, issues: errors, warnings: [], errors }
}

export function validateAmbassadorPayload(payload: Record<string, any> = {}) {
  return validateAmbassadorRecord(payload)
}

export function validateAmbassadorImportRow(row: Record<string, any> = {}) {
  return validateAmbassadorRecord(row)
}

export function deriveAmbassadorKpis(input: any = []) {
  const records = Array.isArray(input) ? input : Array.isArray(input?.ambassadors) ? input.ambassadors : []
  const totalAmbassadors = records.length
  const activeAmbassadors = records.filter((item: any) => String(item.status || "").toLowerCase() === "active").length

  return {
    total: totalAmbassadors,
    active: activeAmbassadors,
    pending: 0,
    archived: 0,
    readiness: totalAmbassadors ? Math.round((activeAmbassadors / totalAmbassadors) * 100) : 0,
    totalAmbassadors,
    activeAmbassadors,
    suspendedAmbassadors: 0,
    territoryCoverage: 0,
    assignedTerritories: 0,
    missionsAssigned: 0,
    missionsCompleted: 0,
    onboardingCompletion: 0,
    recruitmentPipeline: 0,
    trainingCompletion: 0,
    certificationValidity: 0,
    kpiCompletion: 0,
    incentivesPaid: 0,
    incentivesPending: 0,
  }
}

export function buildCsv(rows: Record<string, any>[] = []) {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0] || {})
  const esc = (value: any) => `"${String(value ?? "").replace(/"/g, '""')}"`
  return [headers.map(esc).join(","), ...rows.map((row) => headers.map((h) => esc(row[h])).join(","))].join("\n")
}

export function datedFilename(prefix = "ambassadors-report", ext = "csv") {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.${ext}`
}

export default {
  validateAmbassadorRecord,
  validateAmbassadorPayload,
  validateAmbassadorImportRow,
  deriveAmbassadorKpis,
  buildCsv,
  datedFilename,
}
