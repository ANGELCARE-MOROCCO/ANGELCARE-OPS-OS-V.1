
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
  const existing = input && typeof input === "object" && !Array.isArray(input) && input.kpis && typeof input.kpis === "object" ? input.kpis : {}
  const totalAmbassadors = records.length
  const activeAmbassadors = records.filter((item: any) => String(item.status || "").toLowerCase() === "active").length
  const archived = records.filter((item: any) => String(item.status || "").toLowerCase() === "archived").length

  return {
    total: existing.total ?? totalAmbassadors,
    active: existing.active ?? activeAmbassadors,
    pending: existing.pending ?? records.filter((item: any) => ["candidate", "pending"].includes(String(item.status || "").toLowerCase())).length,
    archived: existing.archived ?? archived,
    readiness: existing.readiness ?? (totalAmbassadors ? Math.round((activeAmbassadors / totalAmbassadors) * 100) : 0),
    totalAmbassadors: existing.totalAmbassadors ?? totalAmbassadors,
    activeAmbassadors: existing.activeAmbassadors ?? activeAmbassadors,
    suspendedAmbassadors: existing.suspendedAmbassadors ?? records.filter((item: any) => String(item.status || "").toLowerCase() === "suspended").length,
    territoryCoverage: existing.territoryCoverage ?? 0,
    assignedTerritories: existing.assignedTerritories ?? 0,
    missionsAssigned: existing.missionsAssigned ?? 0,
    missionsCompleted: existing.missionsCompleted ?? 0,
    onboardingCompletion: existing.onboardingCompletion ?? 0,
    recruitmentPipeline: existing.recruitmentPipeline ?? 0,
    trainingCompletion: existing.trainingCompletion ?? 0,
    certificationValidity: existing.certificationValidity ?? 0,
    kpiCompletion: existing.kpiCompletion ?? 0,
    incentivesPaid: existing.incentivesPaid ?? 0,
    incentivesPending: existing.incentivesPending ?? 0,
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
