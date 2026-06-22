export type AmbassadorProgramRecord = Record<string, any>
export type AmbassadorProgramRisk = "low" | "medium" | "high" | "critical" | string
export type AmbassadorProgramStage = string

export const ambassadorOperatingModes: AmbassadorProgramRecord[] = []
export const ambassadorPrograms: AmbassadorProgramRecord[] = []
export const ambassadorProgramKpis: AmbassadorProgramRecord[] = []
export const ambassadorProgramStages: AmbassadorProgramRecord[] = []
export const ambassadorProgramActions: AmbassadorProgramRecord[] = []
export const ambassadorProgramRisks: AmbassadorProgramRecord[] = []
export const ambassadorProgramTimeline: AmbassadorProgramRecord[] = []

export function formatMad(value: number | string = 0) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString("fr-MA")} MAD`
}

export function getAmbassadorReadiness(record: AmbassadorProgramRecord = {}) {
  const score = Number(record.score || record.readiness || record.avgCompliance || 0)
  return score
}

export function getAmbassadorReadinessDetail(record: AmbassadorProgramRecord = {}) {
  return {
    score: Number(record.score || record.readiness || 0),
    label: record.label || "Not configured",
    tone: record.tone || "slate",
    leads: Number(record.leads || 0),
    qualified: Number(record.qualified || 0),
    conversions: Number(record.conversions || 0),
    revenue: Number(record.revenue || 0),
    avgCompliance: Number(record.avgCompliance || 0),
  }
}

export function getAmbassadorDecision(record: AmbassadorProgramRecord = {}) {
  return String(record.decision || record.status || "Review")
}

export function getAmbassadorDecisionDetail(record: AmbassadorProgramRecord = {}) {
  return {
    label: record.decision || "Review",
    tone: record.tone || "slate",
    description: record.description || "Compatibility decision state.",
  }
}

export const ambassadorProgramExecutionModel = {
  modes: ambassadorOperatingModes,
  programs: ambassadorPrograms,
  kpis: ambassadorProgramKpis,
  stages: ambassadorProgramStages,
  actions: ambassadorProgramActions,
  risks: ambassadorProgramRisks,
  timeline: ambassadorProgramTimeline,
  source: "ambassador-program-compat",
}

export default ambassadorProgramExecutionModel
