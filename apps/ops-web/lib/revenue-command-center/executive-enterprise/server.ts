import { createClient as createSupabaseAdmin } from '@/lib/supabase/contract-client'
import { cleanNumber, cleanString, logRevenueAction, logRevenueActivity, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"
import type {
  ExecutiveCommandPayload,
  ExecutiveExperience,
  ExecutiveForecastLine,
  ExecutivePortfolio,
  ExecutiveRecord,
  ExecutiveTeamRow,
} from "@/components/revenue-command-center/executive-enterprise/types"

type Row = Record<string, any>

const ACTIVE_OPPORTUNITY_STATUSES = new Set([
  "open", "active", "qualified", "discovery", "meeting", "proposal", "negotiation",
  "contracting", "commit", "best_case", "upside",
])
const CLOSED_STATUSES = new Set(["closed", "completed", "resolved", "cancelled", "canceled", "archived", "lost", "rejected"])
const REALIZATION_REVERSED = new Set(["reversed", "cancelled", "canceled", "void", "rejected"])

export async function executiveContext(permission: string | string[] = "revenue.executive.read") {
  const access = await requireRevenueApiAccess(permission)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const supabase = url && key
    ? createSupabaseAdmin(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : await revenueClient()
  return { access, supabase: supabase as any }
}

export function isMissingExecutiveRelation(error: unknown) {
  const message = String((error as any)?.message || error || "")
  return /relation .* does not exist|table .* does not exist|schema cache|could not find the table|column .* does not exist|function .* does not exist/i.test(message)
}

export async function optionalExecutiveRows(
  client: any,
  table: string,
  limit = 3000,
  configure?: (query: any) => any,
) {
  let query = client.from(table).select("*").limit(limit)
  if (configure) query = configure(query)
  const result = await query
  if (!result.error) return { rows: (result.data || []) as Row[], available: true, error: "" }
  if (isMissingExecutiveRelation(result.error)) {
    return { rows: [] as Row[], available: false, error: String(result.error.message || "") }
  }
  throw new Error(String(result.error.message || result.error))
}

function valueFrom(row: Row, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== "") {
      const number = Number(value)
      if (Number.isFinite(number)) return number
    }
  }
  return fallback
}

function textFrom(row: Row, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row?.[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (value !== undefined && value !== null && value !== "") return String(value)
  }
  return fallback
}

function dateFrom(row: Row, keys: string[]) {
  const value = textFrom(row, keys)
  return value || null
}

function rowId(row: Row, fallback: string) {
  return textFrom(row, ["id", "reference", "code", "key"], fallback)
}

function amount(row: Row) {
  return Math.max(0, valueFrom(row, [
    "amount_mad", "amount", "value_mad", "value", "estimated_value", "pipeline_value",
    "commercial_value_mad", "contract_value", "signed_value", "confirmed_amount",
    "realized_amount", "attributed_value_mad", "attributed_value", "revenue_at_risk",
    "risk_value_mad", "outstanding_mad", "expected_amount",
  ]))
}

function probability(row: Row) {
  const raw = valueFrom(row, ["probability", "confidence", "confidence_score", "score"], 50)
  return Math.max(0, Math.min(100, raw > 1 ? raw : raw * 100))
}

function status(row: Row) {
  return textFrom(row, ["status", "stage", "state", "risk_status", "decision_status"], "unknown").toLowerCase()
}

function owner(row: Row) {
  return textFrom(row, ["owner", "owner_name", "assignee_name", "assigned_to_name", "commercial_owner", "created_by_name"], "Non assigné")
}

function sum(rows: Row[], selector: (row: Row) => number = amount) {
  return rows.reduce((total, row) => total + Number(selector(row) || 0), 0)
}

function average(values: number[], fallback = 0) {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return fallback
  return valid.reduce((total, value) => total + value, 0) / valid.length
}

function open(row: Row) {
  return !CLOSED_STATUSES.has(status(row))
}

function toRecord(row: Row, sourceType: string, index: number): ExecutiveRecord {
  const recordStatus = status(row)
  return {
    id: rowId(row, `${sourceType}-${index}`),
    title: textFrom(row, ["title", "name", "reference", "risk_type", "event_type", "action", "description"], `${sourceType} ${index + 1}`),
    subtitle: textFrom(row, ["description", "reason", "notes", "next_action", "outcome", "summary"], ""),
    status: recordStatus,
    owner: owner(row),
    amountMad: amount(row),
    probability: probability(row),
    dueAt: dateFrom(row, ["due_at", "deadline", "expected_date", "promised_date", "close_date", "next_action_at"]),
    severity: textFrom(row, ["severity", "risk_level", "priority"], "medium"),
    sourceType,
    sourceId: textFrom(row, ["source_id", "entity_id", "subject_id", "opportunity_id", "contract_id", "campaign_id"], ""),
    evidence: (row.evidence || row.source_evidence || row.metadata || {}) as Record<string, unknown>,
    metadata: row,
  }
}

function normalizeForecastCategory(row: Row) {
  const explicit = textFrom(row, ["forecast_category", "category", "commit_category"], "").toLowerCase().replaceAll("-", "_")
  if (["excluded", "pipeline", "upside", "best_case", "commit", "contracted", "collectible", "payment_confirmed", "realized", "reversed"].includes(explicit)) {
    return explicit
  }
  const stage = status(row)
  const p = probability(row)
  if (/won|contracted|signed/.test(stage)) return "contracted"
  if (/commit/.test(stage) || p >= 80) return "commit"
  if (/best/.test(stage) || p >= 60) return "best_case"
  if (/upside/.test(stage) || p >= 35) return "upside"
  return "pipeline"
}

function opportunityForecastLine(row: Row, index: number): ExecutiveForecastLine {
  const systemAmount = amount(row)
  const p = probability(row)
  const lastActivity = dateFrom(row, ["last_activity_at", "last_contact_at", "updated_at", "created_at"])
  const evidenceSignals = [
    Boolean(textFrom(row, ["owner", "commercial_owner"])),
    Boolean(textFrom(row, ["next_action"])),
    Boolean(dateFrom(row, ["expected_close_date", "close_date"])),
    Boolean(textFrom(row, ["account_id", "account_name"])),
    Boolean(textFrom(row, ["contact_id", "decision_maker"])),
  ]
  const evidenceScore = Math.round((evidenceSignals.filter(Boolean).length / evidenceSignals.length) * 100)
  return {
    id: rowId(row, `opportunity-${index}`),
    title: textFrom(row, ["title", "name", "account_name", "reference"], `Opportunité ${index + 1}`),
    subtitle: textFrom(row, ["next_action", "description", "notes"], ""),
    status: status(row),
    owner: owner(row),
    amountMad: systemAmount,
    category: normalizeForecastCategory(row),
    systemAmountMad: systemAmount,
    ownerAmountMad: valueFrom(row, ["owner_forecast_amount", "forecast_amount"], systemAmount),
    executiveAmountMad: valueFrom(row, ["executive_forecast_amount", "override_amount"], 0) || undefined,
    expectedDate: dateFrom(row, ["expected_close_date", "close_date", "forecast_date"]),
    confidence: p,
    evidenceScore,
    stage: status(row),
    lastActivityAt: lastActivity,
    blockers: [
      !textFrom(row, ["owner", "commercial_owner"]) ? "Propriétaire manquant" : "",
      !textFrom(row, ["next_action"]) ? "Prochaine action manquante" : "",
      !dateFrom(row, ["expected_close_date", "close_date"]) ? "Date de clôture manquante" : "",
    ].filter(Boolean),
    sourceType: "opportunity",
    sourceId: rowId(row, `opportunity-${index}`),
    evidence: { evidenceScore, source: "revenue_opportunities" },
    metadata: row,
  }
}

function persistedForecastLine(row: Row, index: number): ExecutiveForecastLine {
  return {
    id: rowId(row, `forecast-line-${index}`),
    title: textFrom(row, ["title", "source_label", "entity_label"], `Ligne forecast ${index + 1}`),
    subtitle: textFrom(row, ["rationale", "notes", "source_type"], ""),
    status: status(row),
    owner: owner(row),
    amountMad: valueFrom(row, ["executive_amount_mad", "owner_amount_mad", "system_amount_mad", "amount_mad"]),
    category: textFrom(row, ["effective_category", "forecast_category", "category"], "pipeline"),
    systemAmountMad: valueFrom(row, ["system_amount_mad", "amount_mad"]),
    ownerAmountMad: valueFrom(row, ["owner_amount_mad"], 0) || undefined,
    executiveAmountMad: valueFrom(row, ["executive_amount_mad"], 0) || undefined,
    expectedDate: dateFrom(row, ["effective_expected_date", "expected_date"]),
    confidence: valueFrom(row, ["confidence"], 0),
    evidenceScore: valueFrom(row, ["evidence_score"], 0),
    stage: textFrom(row, ["source_stage", "stage"], ""),
    lastActivityAt: dateFrom(row, ["last_activity_at"]),
    blockers: Array.isArray(row.blockers) ? row.blockers : [],
    sourceType: textFrom(row, ["source_entity_type", "source_type"], "forecast"),
    sourceId: textFrom(row, ["source_entity_id", "source_id"], ""),
    evidence: (row.evidence || {}) as Record<string, unknown>,
    metadata: row,
  }
}

function buildTeam(
  opportunities: Row[],
  tasks: Row[],
  interventions: Row[],
  realizations: Row[],
): ExecutiveTeamRow[] {
  const owners = new Set<string>()
  for (const row of [...opportunities, ...tasks, ...interventions, ...realizations]) owners.add(owner(row))
  owners.delete("Non assigné")
  return Array.from(owners).map((name) => {
    const ownerOpportunities = opportunities.filter((row) => owner(row) === name)
    const ownerTasks = tasks.filter((row) => owner(row) === name)
    const ownerInterventions = interventions.filter((row) => owner(row) === name)
    const ownerRealizations = realizations.filter((row) => owner(row) === name || textFrom(row, ["commercial_owner"]) === name)
    const pipelineMad = sum(ownerOpportunities)
    const weightedMad = ownerOpportunities.reduce((total, row) => total + amount(row) * probability(row) / 100, 0)
    const openTasks = ownerTasks.filter(open).length
    const overdueTasks = ownerTasks.filter((row) => {
      const due = dateFrom(row, ["due_at"])
      return open(row) && due && new Date(due).getTime() < Date.now()
    }).length
    const evidence = ownerOpportunities.map((row) => opportunityForecastLine(row, 0).evidenceScore)
    return {
      owner: name,
      pipelineMad,
      weightedMad,
      realizedMad: sum(ownerRealizations),
      openTasks,
      overdueTasks,
      interventions: ownerInterventions.filter(open).length,
      forecastAccuracy: Math.round(average(evidence, 0)),
      dataQualityScore: Math.round(average(evidence, 0)),
    }
  }).sort((a, b) => b.weightedMad - a.weightedMad)
}

function buildDataQuality(opportunities: Row[], contracts: Row[], realizations: Row[]) {
  const issues: ExecutiveRecord[] = []
  opportunities.forEach((row, index) => {
    const id = rowId(row, `opportunity-${index}`)
    if (!textFrom(row, ["owner", "commercial_owner"])) {
      issues.push({ id: `owner-${id}`, title: "Opportunité sans propriétaire", subtitle: textFrom(row, ["title", "name"], id), status: "open", severity: "high", sourceType: "opportunity", sourceId: id })
    }
    if (amount(row) <= 0) {
      issues.push({ id: `value-${id}`, title: "Valeur commerciale manquante", subtitle: textFrom(row, ["title", "name"], id), status: "open", severity: "medium", sourceType: "opportunity", sourceId: id })
    }
    if (!textFrom(row, ["next_action"])) {
      issues.push({ id: `next-${id}`, title: "Prochaine action absente", subtitle: textFrom(row, ["title", "name"], id), status: "open", severity: "medium", sourceType: "opportunity", sourceId: id })
    }
  })
  contracts.forEach((row, index) => {
    if (!textFrom(row, ["proposal_id", "commercial_outcome_id", "opportunity_id"])) {
      const id = rowId(row, `contract-${index}`)
      issues.push({ id: `contract-source-${id}`, title: "Contrat sans source commerciale explicite", subtitle: textFrom(row, ["title", "reference"], id), status: "review", severity: "high", sourceType: "contract", sourceId: id, amountMad: amount(row) })
    }
  })
  realizations.forEach((row, index) => {
    if (!textFrom(row, ["contract_id"])) {
      const id = rowId(row, `realization-${index}`)
      issues.push({ id: `realization-source-${id}`, title: "Réalisation sans contrat lié", status: "review", severity: "critical", sourceType: "realization", sourceId: id, amountMad: amount(row) })
    }
  })
  return issues.slice(0, 200)
}

export async function buildExecutivePortfolio(client: any, experience: ExecutiveExperience): Promise<ExecutivePortfolio> {
  const tableNames = [
    "revenue_opportunities",
    "revenue_proposals",
    "revenue_contracts",
    "revenue_payment_requirements",
    "revenue_payment_confirmations",
    "revenue_payment_promises",
    "revenue_finance_handoffs",
    "revenue_realization_events",
    "revenue_tasks",
    "revenue_appointments",
    "revenue_communication_events",
    "revenue_account_risks",
    "revenue_opportunity_risks",
    "revenue_contract_risks",
    "revenue_partnership_risks",
    "revenue_partner_referral_attributions",
    "revenue_partner_performance_metrics",
    "revenue_b2c_cases",
    "revenue_b2c_retention_risks",
    "revenue_b2c_recovery_plans",
    "revenue_campaigns",
    "revenue_campaign_attributions",
    "revenue_campaign_costs",
    "revenue_campaign_risks",
    "revenue_campaign_recovery_plans",
    "revenue_executive_forecast_snapshots",
    "revenue_executive_forecast_lines",
    "revenue_executive_signals",
    "revenue_executive_leakage_events",
    "revenue_executive_interventions",
    "revenue_executive_decision_requests",
    "revenue_executive_decisions",
    "revenue_executive_scenarios",
    "revenue_executive_briefings",
    "revenue_executive_data_quality_issues",
  ] as const

  const results = await Promise.all(tableNames.map((table) => optionalExecutiveRows(client, table)))
  const byTable = Object.fromEntries(tableNames.map((table, index) => [table, results[index]])) as Record<string, { rows: Row[]; available: boolean; error: string }>
  const rows = (table: string) => byTable[table]?.rows || []

  const opportunities = rows("revenue_opportunities")
  const activeOpportunities = opportunities.filter((row) => ACTIVE_OPPORTUNITY_STATUSES.has(status(row)) || !CLOSED_STATUSES.has(status(row)))
  const proposals = rows("revenue_proposals")
  const contracts = rows("revenue_contracts")
  const activeContracts = contracts.filter((row) => !["draft", "terminated", "expired", "archived", "cancelled", "canceled"].includes(status(row)))
  const paymentRequirements = rows("revenue_payment_requirements").filter(open)
  const paymentConfirmations = rows("revenue_payment_confirmations").filter((row) => !["rejected", "cancelled", "canceled"].includes(status(row)))
  const paymentPromises = rows("revenue_payment_promises")
  const realizations = rows("revenue_realization_events")
  const activeRealizations = realizations.filter((row) => !REALIZATION_REVERSED.has(status(row)) && !/revers/i.test(textFrom(row, ["event_type", "realization_type"])))
  const reversedRealizations = realizations.filter((row) => REALIZATION_REVERSED.has(status(row)) || /revers/i.test(textFrom(row, ["event_type", "realization_type"])))
  const tasks = rows("revenue_tasks")

  const pipelineMad = sum(activeOpportunities)
  const weightedMad = activeOpportunities.reduce((total, row) => total + amount(row) * probability(row) / 100, 0)
  const upsideMad = activeOpportunities.filter((row) => normalizeForecastCategory(row) === "upside").reduce((total, row) => total + amount(row), 0)
  const bestCaseMad = activeOpportunities.filter((row) => normalizeForecastCategory(row) === "best_case").reduce((total, row) => total + amount(row), 0)
  const commitMad = activeOpportunities.filter((row) => normalizeForecastCategory(row) === "commit").reduce((total, row) => total + amount(row), 0)
  const contractedMad = sum(activeContracts, (row) => valueFrom(row, ["contract_value", "signed_value", "amount"], amount(row)))
  const requiredMad = sum(paymentRequirements)
  const confirmedMad = sum(paymentConfirmations, (row) => valueFrom(row, ["confirmed_amount", "amount"], amount(row)))
  const collectibleMad = Math.max(0, requiredMad - confirmedMad)
  const realizedMad = sum(activeRealizations)
  const reversedMad = sum(reversedRealizations)

  const riskSources = [
    ...rows("revenue_account_risks").map((row, index) => toRecord(row, "account-risk", index)),
    ...rows("revenue_opportunity_risks").map((row, index) => toRecord(row, "opportunity-risk", index)),
    ...rows("revenue_contract_risks").map((row, index) => toRecord(row, "contract-risk", index)),
    ...rows("revenue_partnership_risks").map((row, index) => toRecord(row, "partnership-risk", index)),
    ...rows("revenue_b2c_retention_risks").map((row, index) => toRecord(row, "b2c-retention-risk", index)),
    ...rows("revenue_campaign_risks").map((row, index) => toRecord(row, "campaign-risk", index)),
  ].filter((record) => !CLOSED_STATUSES.has(String(record.status || "")))

  const derivedLeakage: ExecutiveRecord[] = [
    ...activeOpportunities.filter((row) => !textFrom(row, ["next_action"])).map((row, index) => ({ ...toRecord(row, "opportunity-no-next-action", index), title: `Opportunité sans prochaine action — ${textFrom(row, ["title", "name"], "Sans titre")}`, severity: "high" })),
    ...paymentPromises.filter((row) => ["broken", "overdue"].includes(status(row))).map((row, index) => ({ ...toRecord(row, "broken-payment-promise", index), title: `Promesse de paiement ${status(row)}`, severity: "critical" })),
    ...activeContracts.filter((row) => ["payment_expected", "payment_overdue", "promise_broken", "blocked"].includes(textFrom(row, ["payment_gate_status"], "").toLowerCase())).map((row, index) => ({ ...toRecord(row, "contract-payment-gate", index), title: `Gate paiement — ${textFrom(row, ["title", "reference"], "Contrat")}`, severity: "critical" })),
    ...rows("revenue_campaign_attributions").filter((row) => !textFrom(row, ["evidence_reference"]) && !row.evidence).map((row, index) => ({ ...toRecord(row, "campaign-attribution-evidence", index), title: "Attribution campagne sans preuve explicite", severity: "high" })),
  ]

  const persistedLeakage = rows("revenue_executive_leakage_events").map((row, index) => toRecord(row, "executive-leakage", index))
  const leakage = [...persistedLeakage, ...riskSources, ...derivedLeakage].sort((a, b) => Number(b.amountMad || 0) - Number(a.amountMad || 0))
  const atRiskMad = leakage.reduce((total, record) => total + Number(record.amountMad || 0), 0)

  const persistedForecast = rows("revenue_executive_forecast_lines")
  const forecastLines = (persistedForecast.length
    ? persistedForecast.map(persistedForecastLine)
    : activeOpportunities.map(opportunityForecastLine)
  ).sort((a, b) => (b.executiveAmountMad || b.ownerAmountMad || b.systemAmountMad) - (a.executiveAmountMad || a.ownerAmountMad || a.systemAmountMad))

  const interventions = rows("revenue_executive_interventions").map((row, index) => toRecord(row, "executive-intervention", index))
  const signals = rows("revenue_executive_signals").map((row, index) => toRecord(row, "executive-signal", index))
  const decisions = [
    ...rows("revenue_executive_decision_requests").map((row, index) => toRecord(row, "decision-request", index)),
    ...rows("revenue_executive_decisions").map((row, index) => toRecord(row, "decision", index)),
  ]
  const scenarios = rows("revenue_executive_scenarios").map((row, index) => toRecord(row, "scenario", index))
  const briefings = rows("revenue_executive_briefings").map((row, index) => toRecord(row, "briefing", index))

  const collections = [
    ...paymentPromises.map((row, index) => toRecord(row, "payment-promise", index)),
    ...paymentRequirements.map((row, index) => toRecord(row, "payment-requirement", index)),
    ...rows("revenue_collection_actions").map((row, index) => toRecord(row, "collection-action", index)),
  ]

  const partnerAttributions = rows("revenue_partner_referral_attributions")
  const campaignAttributions = rows("revenue_campaign_attributions")
  const b2cCases = rows("revenue_b2c_cases")
  const campaignCosts = rows("revenue_campaign_costs")

  const contributions = [
    { source: "B2B direct", pipelineMad, contractedMad, confirmedMad, realizedMad, count: activeOpportunities.length },
    {
      source: "Partenaires",
      pipelineMad: 0,
      contractedMad: sum(partnerAttributions, (row) => valueFrom(row, ["contracted_value", "attributed_contract_value", "attributed_value"], 0)),
      confirmedMad: sum(partnerAttributions, (row) => valueFrom(row, ["payment_confirmed_value", "confirmed_value"], 0)),
      realizedMad: sum(partnerAttributions, (row) => valueFrom(row, ["realized_value", "attributed_realized_revenue", "attributed_value"], 0)),
      count: partnerAttributions.length,
    },
    {
      source: "B2C familles",
      pipelineMad: sum(b2cCases),
      contractedMad: sum(b2cCases, (row) => valueFrom(row, ["contracted_value", "quotation_value", "value_mad"], 0)),
      confirmedMad: sum(b2cCases, (row) => valueFrom(row, ["payment_confirmed_value", "confirmed_amount"], 0)),
      realizedMad: sum(b2cCases, (row) => valueFrom(row, ["realized_value", "realized_revenue"], 0)),
      count: b2cCases.length,
    },
    {
      source: "Campagnes",
      pipelineMad: sum(campaignAttributions, (row) => valueFrom(row, ["pipeline_value", "attributed_value"], 0)),
      contractedMad: sum(campaignAttributions, (row) => valueFrom(row, ["contracted_value", "attributed_contract_value"], 0)),
      confirmedMad: sum(campaignAttributions, (row) => valueFrom(row, ["payment_confirmed_value", "confirmed_value"], 0)),
      realizedMad: sum(campaignAttributions, (row) => valueFrom(row, ["realized_revenue", "attributed_realized_revenue", "attributed_value"], 0)),
      count: campaignAttributions.length,
    },
  ]

  const dataQualityDerived = buildDataQuality(opportunities, contracts, realizations)
  const dataQualityPersisted = rows("revenue_executive_data_quality_issues").map((row, index) => toRecord(row, "data-quality", index))
  const dataQuality = [...dataQualityPersisted, ...dataQualityDerived]

  const team = buildTeam(opportunities, tasks, interventions, activeRealizations)
  const evidenceCompleteness = Math.round(average(forecastLines.map((line) => line.evidenceScore), 0))
  const commitAccuracy = valueFrom(rows("revenue_executive_forecast_snapshots")[0] || {}, ["commit_accuracy"], 0)
  const forecastBias = valueFrom(rows("revenue_executive_forecast_snapshots")[0] || {}, ["forecast_bias"], 0)
  const dateAccuracy = valueFrom(rows("revenue_executive_forecast_snapshots")[0] || {}, ["date_accuracy"], 0)

  const metrics = [
    { key: "pipeline", label: "Pipeline", value: pipelineMad, detail: `${activeOpportunities.length} opportunités`, tone: "blue" as const, source: "revenue_opportunities" },
    { key: "weighted", label: "Pondéré", value: weightedMad, detail: "Probabilité explicable", tone: "cyan" as const, source: "revenue_opportunities" },
    { key: "contracted", label: "Contracté", value: contractedMad, detail: `${activeContracts.length} contrats`, tone: "navy" as const, source: "revenue_contracts" },
    { key: "confirmed", label: "Confirmé", value: confirmedMad, detail: "Confirmation Finance", tone: "green" as const, source: "revenue_payment_confirmations" },
    { key: "realized", label: "Réalisé", value: realizedMad, detail: `${activeRealizations.length} événements`, tone: "green" as const, source: "revenue_realization_events" },
    { key: "risk", label: "À risque", value: atRiskMad, detail: `${leakage.length} expositions`, tone: "red" as const, source: "risk and leakage sources" },
  ]

  return {
    syncedAt: new Date().toISOString(),
    experience,
    schema: Object.fromEntries(Object.entries(byTable).map(([table, value]) => [table, value.available])),
    summary: {
      pipelineMad,
      weightedMad,
      upsideMad,
      bestCaseMad,
      commitMad,
      contractedMad,
      collectibleMad,
      confirmedMad,
      realizedMad,
      reversedMad,
      atRiskMad,
      campaignCostMad: sum(campaignCosts),
      commitAccuracy,
      forecastBias,
      dateAccuracy,
      evidenceCompleteness,
      openInterventions: interventions.filter((row) => !CLOSED_STATUSES.has(String(row.status || ""))).length,
      decisionsDue: decisions.filter((row) => !CLOSED_STATUSES.has(String(row.status || ""))).length,
      leakageCount: leakage.length,
      dataQualityCount: dataQuality.length,
    },
    metrics,
    forecastLines,
    interventions,
    signals,
    leakage,
    decisions,
    scenarios,
    briefings,
    collections,
    accounts: activeOpportunities.slice(0, 100).map((row, index) => toRecord(row, "account-opportunity", index)),
    partners: rows("revenue_partner_performance_metrics").map((row, index) => toRecord(row, "partner", index)),
    b2c: b2cCases.map((row, index) => toRecord(row, "b2c", index)),
    campaigns: rows("revenue_campaigns").map((row, index) => toRecord(row, "campaign", index)),
    team,
    contributions,
    dataQuality,
    sourceHealth: Object.entries(byTable).map(([source, result]) => ({
      source,
      available: result.available,
      records: result.rows.length,
      note: result.available ? `${result.rows.length} enregistrements lisibles` : "Source absente ou non installée",
    })),
  }
}

async function auditExecutiveCommand(client: any, input: {
  command: string
  entityId?: string
  payload: Record<string, unknown>
  result: Record<string, unknown>
}) {
  await logRevenueAction(client, {
    actionType: `executive_${input.command}`,
    entityType: "executive",
    entityId: input.entityId || null,
    payload: input.payload,
    result: input.result,
  }).catch(() => undefined)
  await logRevenueActivity(client, {
    entityType: "executive",
    entityId: input.entityId || null,
    eventType: `executive_${input.command}`,
    title: `Commande exécutive : ${input.command}`,
    body: cleanString(input.payload.reason),
    metadata: { ...input.payload, result: input.result },
  }).catch(() => undefined)
}

export async function executeExecutiveCommand(
  client: any,
  actorId: string | null,
  raw: ExecutiveCommandPayload,
) {
  const command = cleanString(raw.command)
  const entityId = cleanString(raw.entityId)
  const reason = cleanString(raw.reason)
  const title = cleanString(raw.title, "Commande exécutive ANGELCARE")
  const evidenceReference = cleanString(raw.evidenceReference)
  const amountMad = Math.max(0, cleanNumber(raw.amountMad, 0))
  const ownerName = cleanString(raw.owner, "Revenue Manager")
  const dueAt = cleanString(raw.dueAt) || null
  const now = new Date().toISOString()
  let result: Record<string, unknown> = { command }

  if (command === "generate-forecast-snapshot") {
    const portfolio = await buildExecutivePortfolio(client, "forecast-command")
    const rpc = await client.rpc("revenue_executive_create_forecast_snapshot", {
      p_input: {
        label: title,
        horizon: cleanString(raw.horizon, "current_month"),
        periodStart: new Date().toISOString().slice(0, 10),
        periodEnd: dueAt ? dueAt.slice(0, 10) : null,
        summary: portfolio.summary,
        lines: portfolio.forecastLines,
        evidenceReference,
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, snapshot: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (command === "submit-owner-forecast") {
    if (!entityId) throw new Error("Ligne de prévision requise.")
    if (!reason) throw new Error("Rationale propriétaire requise.")
    const rpc = await client.rpc("revenue_executive_submit_forecast", {
      p_forecast_line_id: entityId,
      p_input: {
        amountMad,
        category: cleanString(raw.category, "commit"),
        expectedDate: cleanString(raw.expectedDate) || dueAt,
        probability: cleanNumber(raw.probability, 0),
        rationale: reason,
        evidenceReference,
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, submission: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (command === "override-forecast" || command === "expire-forecast-override") {
    if (!entityId) throw new Error("Ligne de prévision requise.")
    if (!reason) throw new Error("Motif d'override requis.")
    const rpc = await client.rpc("revenue_executive_override_forecast", {
      p_forecast_line_id: entityId,
      p_input: {
        mode: command === "expire-forecast-override" ? "expire" : "apply",
        amountMad,
        category: cleanString(raw.category, "commit"),
        expectedDate: cleanString(raw.expectedDate) || dueAt,
        reason,
        evidenceReference,
        reviewAt: dueAt,
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, override: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (command === "create-intervention") {
    if (!reason) throw new Error("Analyse de l'intervention requise.")
    const rpc = await client.rpc("revenue_executive_create_intervention", {
      p_input: {
        sourceEntityType: cleanString(raw.metadata?.sourceType, "executive_signal"),
        sourceEntityId: entityId || null,
        title,
        rootCause: reason,
        affectedValueMad: amountMad,
        owner: ownerName,
        executiveSponsor: cleanString(raw.executiveSponsor, "Direction Revenue"),
        dueAt,
        evidenceReference,
        severity: amountMad > 0 ? "high" : "warning",
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, intervention: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (["assign-intervention", "escalate-intervention", "record-intervention-checkpoint"].includes(command)) {
    if (!entityId) throw new Error("Intervention requise.")
    if (!reason) throw new Error("Motif ou checkpoint requis.")
    if (command === "record-intervention-checkpoint") {
      const insert = await client.from("revenue_executive_intervention_checkpoints").insert({
        intervention_id: entityId,
        checkpoint_type: "progress",
        status: "recorded",
        note: reason,
        affected_value_mad: amountMad,
        evidence_reference: evidenceReference || null,
        created_by: actorId,
      }).select("*").single()
      if (insert.error) throw new Error(insert.error.message)
      result = { command, checkpoint: insert.data }
    } else {
      const nextStatus = command === "escalate-intervention" ? "escalated" : "triage"
      const update = await client.from("revenue_executive_interventions").update({
        owner_label: ownerName,
        executive_sponsor_label: cleanString(raw.executiveSponsor) || null,
        status: nextStatus,
        due_at: dueAt,
        updated_by: actorId,
        updated_at: now,
      }).eq("id", entityId).select("*").single()
      if (update.error) throw new Error(update.error.message)
      result = { command, intervention: update.data }
    }
  } else if (command === "request-decision") {
    if (!reason) throw new Error("Contexte de décision requis.")
    const insert = await client.from("revenue_executive_decision_requests").insert({
      intervention_id: entityId || null,
      title,
      decision_statement: reason,
      affected_value_mad: amountMad,
      requested_authority: cleanString(raw.executiveSponsor, "Direction Revenue"),
      decision_due_at: dueAt,
      status: "requested",
      evidence_reference: evidenceReference || null,
      requested_by: actorId,
    }).select("*").single()
    if (insert.error) throw new Error(insert.error.message)
    result = { command, decisionRequest: insert.data }
  } else if (command === "decide-intervention") {
    if (!entityId) throw new Error("Demande de décision ou intervention requise.")
    if (!reason) throw new Error("Motif de décision requis.")
    const rpc = await client.rpc("revenue_executive_decide_intervention", {
      p_target_id: entityId,
      p_input: {
        decision: cleanString(raw.decision, "approved"),
        reason,
        conditions: cleanString(raw.conditions),
        evidenceReference,
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, decision: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (command === "close-intervention") {
    if (!entityId) throw new Error("Intervention requise.")
    if (!reason || !evidenceReference) throw new Error("Résultat et preuve de clôture requis.")
    const rpc = await client.rpc("revenue_executive_close_intervention", {
      p_intervention_id: entityId,
      p_input: {
        outcome: reason,
        evidenceReference,
        protectedValueMad: amountMad,
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, outcome: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (["create-scenario", "run-scenario", "approve-scenario"].includes(command)) {
    if (command !== "run-scenario" && !reason) throw new Error("Hypothèses ou motif requis.")
    const rpc = await client.rpc("revenue_executive_manage_scenario", {
      p_scenario_id: entityId || null,
      p_input: {
        mode: command === "create-scenario" ? "create" : command === "approve-scenario" ? "approve" : "run",
        title,
        scenarioType: cleanString(raw.scenarioType, "expected"),
        horizon: cleanString(raw.horizon, "current_month"),
        assumptions: raw.assumptions || [],
        rationale: reason,
        evidenceReference,
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, scenario: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (["generate-briefing", "approve-briefing"].includes(command)) {
    const rpc = await client.rpc("revenue_executive_manage_briefing", {
      p_briefing_id: entityId || null,
      p_input: {
        mode: command === "approve-briefing" ? "approve" : "generate",
        title,
        briefingType: cleanString(raw.briefingType, "weekly"),
        horizon: cleanString(raw.horizon, "current_month"),
        narrative: reason,
        evidenceReference,
      },
      p_actor_id: actorId,
    })
    if (rpc.error) throw new Error(rpc.error.message)
    result = { command, briefing: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data }
  } else if (command === "acknowledge-signal" || command === "dismiss-signal") {
    if (!entityId) throw new Error("Signal requis.")
    const update = await client.from("revenue_executive_signals").update({
      status: command === "dismiss-signal" ? "dismissed" : "acknowledged",
      acknowledgement_note: reason || null,
      acknowledged_by: actorId,
      acknowledged_at: now,
      updated_at: now,
    }).eq("id", entityId).select("*").single()
    if (update.error) throw new Error(update.error.message)
    result = { command, signal: update.data }
  } else if (command === "create-canonical-task" || command === "request-finance-review") {
    if (!reason) throw new Error("Objectif de la tâche requis.")
    const task = await client.from("revenue_tasks").insert({
      entity_type: command === "request-finance-review" ? "finance_review" : "executive",
      entity_id: entityId || null,
      title,
      description: reason,
      owner: ownerName,
      priority: command === "request-finance-review" ? "critical" : "high",
      status: "open",
      due_at: dueAt,
      expected_outcome: reason,
      metadata: {
        source: "revenue_executive_enterprise",
        evidence_reference: evidenceReference || null,
        affected_value_mad: amountMad,
      },
    }).select("*").single()
    if (task.error) throw new Error(task.error.message)
    result = { command, task: task.data }
  } else {
    throw new Error("Commande exécutive non reconnue.")
  }

  await auditExecutiveCommand(client, {
    command,
    entityId: entityId || undefined,
    payload: raw as unknown as Record<string, unknown>,
    result,
  })
  return result
}
