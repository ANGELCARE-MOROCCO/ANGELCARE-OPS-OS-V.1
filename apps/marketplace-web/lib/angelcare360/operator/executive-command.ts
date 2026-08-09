import { asNumber, asString, safeList, summarizeMoney } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import type {
  ExecutiveAgendaStream,
  ExecutiveBoardSession,
  ExecutiveDecision,
  ExecutiveGrowthLever,
  ExecutiveInitiative,
  ExecutiveMandate,
  ExecutiveMetric,
  ExecutiveObjective,
  ExecutivePaper,
  ExecutivePriority,
  ExecutiveRisk,
  ExecutiveSignal,
  ExecutiveSnapshot,
  ExecutiveSourceReport,
  ExecutiveTone,
} from '@/types/angelcare360/operator/executive-command'

type Row = Record<string, unknown>

const nowIso = () => new Date().toISOString()

function firstString(row: Row | undefined, keys: string[], fallback = '') {
  if (!row) return fallback
  for (const key of keys) {
    const value = asString(row[key])
    if (value) return value
  }
  return fallback
}

function firstNumber(row: Row | undefined, keys: string[], fallback = 0) {
  if (!row) return fallback
  for (const key of keys) {
    const value = asNumber(row[key], Number.NaN)
    if (Number.isFinite(value)) return value
  }
  return fallback
}

function firstArray(row: Row | undefined, keys: string[]) {
  if (!row) return [] as string[]
  for (const key of keys) {
    const value = row[key]
    if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
    if (typeof value === 'string' && value.trim()) {
      return value.split(/\n|,|;/).map((item) => item.trim()).filter(Boolean)
    }
  }
  return [] as string[]
}

function normalizeStatus(row: Row | undefined) {
  return firstString(row, ['status', 'state', 'lifecycle_stage', 'stage'], 'unknown').toLowerCase()
}

function openStatus(status: string) {
  return !['closed', 'resolved', 'completed', 'done', 'archived', 'cancelled', 'canceled', 'rejected', 'expired', 'superseded'].includes(status)
}

function toneFromStatus(status: string, priority = ''): ExecutiveTone {
  const normalized = `${status} ${priority}`.toLowerCase()
  if (['critical', 'urgent', 'blocked', 'overdue', 'crisis', 'red'].some((value) => normalized.includes(value))) return 'critical'
  if (['warning', 'at_risk', 'attention', 'pending', 'review', 'amber'].some((value) => normalized.includes(value))) return 'warning'
  if (['approved', 'active', 'completed', 'healthy', 'published', 'green'].some((value) => normalized.includes(value))) return 'good'
  if (['draft', 'proposed', 'planned', 'info'].some((value) => normalized.includes(value))) return 'info'
  return 'neutral'
}

function compactMoney(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Dh`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K Dh`
  return `${Math.round(value).toLocaleString('fr-FR')} Dh`
}

async function readRows(table: string, limit = 300, orderColumn = 'created_at') {
  return await safeList(table, '*', [], [orderColumn, { ascending: false }], limit) as Row[]
}

async function readCandidates(tables: string[], limit = 300) {
  const sets = await Promise.all(tables.map((table) => readRows(table, limit)))
  return sets.find((rows) => rows.length > 0) || []
}

function source(key: string, label: string, rows: Row[], message?: string): ExecutiveSourceReport {
  return {
    key,
    label,
    state: rows.length > 0 ? 'live' : 'partial',
    count: rows.length,
    updatedAt: nowIso(),
    message: rows.length > 0 ? null : message || 'Aucune donnée active ou source non initialisée.',
  }
}

function mapPriority(row: Row, index: number): ExecutivePriority {
  const status = normalizeStatus(row)
  const priority = firstString(row, ['priority', 'severity'], 'normal')
  return {
    id: firstString(row, ['id'], `priority-${index}`),
    priorityCode: firstString(row, ['priority_code', 'code'], `EX-P${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'subject', 'name'], 'Priorité exécutive'),
    summary: firstString(row, ['summary', 'description', 'impact'], 'Action de Direction à structurer.'),
    status,
    priority,
    authorityLevel: firstString(row, ['authority_level'], 'Direction Générale'),
    ownerName: firstString(row, ['owner_name', 'assignee_name'], 'À assigner'),
    sponsorName: firstString(row, ['sponsor_name'], '') || null,
    dueAt: firstString(row, ['due_at', 'due_date'], '') || null,
    impact: firstString(row, ['impact', 'business_impact'], 'Impact à documenter'),
    evidenceState: firstString(row, ['evidence_state'], 'partial'),
    sourceType: firstString(row, ['source_type', 'related_entity_type'], '') || null,
    sourceId: firstString(row, ['source_id', 'related_entity_id'], '') || null,
    nextAction: firstString(row, ['next_action'], '') || null,
    tone: toneFromStatus(status, priority),
    href: firstString(row, ['href'], '') || undefined,
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapDecision(row: Row, index: number): ExecutiveDecision {
  return {
    id: firstString(row, ['id'], `decision-${index}`),
    decisionCode: firstString(row, ['decision_code', 'code'], `EX-D${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Décision exécutive'),
    statement: firstString(row, ['statement', 'description', 'summary'], 'Décision à formaliser.'),
    status: normalizeStatus(row),
    decisionType: firstString(row, ['decision_type', 'type'], 'executive'),
    authorityLevel: firstString(row, ['authority_level'], 'Direction Générale'),
    ownerName: firstString(row, ['owner_name'], 'À assigner'),
    sponsorName: firstString(row, ['sponsor_name'], '') || null,
    dueAt: firstString(row, ['due_at', 'due_date'], '') || null,
    financialImpactMad: firstNumber(row, ['financial_impact_mad', 'amount_mad']),
    customerImpact: firstString(row, ['customer_impact'], 'À évaluer'),
    riskLevel: firstString(row, ['risk_level'], 'medium'),
    evidenceState: firstString(row, ['evidence_state'], 'partial'),
    conditions: firstArray(row, ['conditions']),
    outcome: firstString(row, ['outcome'], '') || null,
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapAgenda(row: Row, index: number): ExecutiveAgendaStream {
  return {
    id: firstString(row, ['id'], `agenda-${index}`),
    streamCode: firstString(row, ['stream_code', 'code'], `EX-A${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Flux stratégique'),
    strategicPillar: firstString(row, ['strategic_pillar', 'pillar'], 'Croissance durable'),
    horizon: firstString(row, ['horizon'], 'Quarter'),
    status: normalizeStatus(row),
    executiveSponsor: firstString(row, ['executive_sponsor', 'sponsor_name'], 'Direction Générale'),
    ownerName: firstString(row, ['owner_name'], 'À assigner'),
    objective: firstString(row, ['objective', 'description'], 'Objectif stratégique à formaliser.'),
    progress: Math.max(0, Math.min(100, firstNumber(row, ['progress'], 0))),
    confidence: Math.max(0, Math.min(100, firstNumber(row, ['confidence'], 50))),
    dueAt: firstString(row, ['due_at', 'due_date'], '') || null,
    dependencies: firstArray(row, ['dependencies']),
    pressure: firstString(row, ['pressure'], 'normal'),
    expectedOutcome: firstString(row, ['expected_outcome'], 'Résultat à définir'),
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapObjective(row: Row, index: number): ExecutiveObjective {
  const target = firstNumber(row, ['target_value', 'target'], 100)
  const actual = firstNumber(row, ['actual_value', 'actual'], 0)
  return {
    id: firstString(row, ['id'], `objective-${index}`),
    objectiveCode: firstString(row, ['objective_code', 'code'], `EX-O${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Objectif exécutif'),
    domain: firstString(row, ['domain'], 'Company'),
    status: normalizeStatus(row),
    ownerName: firstString(row, ['owner_name'], 'À assigner'),
    targetValue: target,
    actualValue: actual,
    unit: firstString(row, ['unit'], '%'),
    confidence: Math.max(0, Math.min(100, firstNumber(row, ['confidence'], 50))),
    trend: firstString(row, ['trend'], actual >= target ? 'up' : 'stable') as ExecutiveObjective['trend'],
    dueAt: firstString(row, ['due_at', 'due_date'], '') || null,
    evidenceState: firstString(row, ['evidence_state'], 'partial'),
    correctiveAction: firstString(row, ['corrective_action'], '') || null,
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapInitiative(row: Row, index: number): ExecutiveInitiative {
  return {
    id: firstString(row, ['id'], `initiative-${index}`),
    initiativeCode: firstString(row, ['initiative_code', 'code'], `EX-I${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Initiative stratégique'),
    programType: firstString(row, ['program_type', 'type'], 'transformation'),
    status: normalizeStatus(row),
    sponsorName: firstString(row, ['sponsor_name'], 'Direction Générale'),
    ownerName: firstString(row, ['owner_name'], 'À assigner'),
    progress: Math.max(0, Math.min(100, firstNumber(row, ['progress'], 0))),
    confidence: Math.max(0, Math.min(100, firstNumber(row, ['confidence'], 50))),
    expectedValue: firstString(row, ['expected_value'], 'Valeur à documenter'),
    currentMilestone: firstString(row, ['current_milestone'], 'Initialisation'),
    nextMilestone: firstString(row, ['next_milestone'], '') || null,
    dueAt: firstString(row, ['due_at', 'due_date'], '') || null,
    dependencies: firstArray(row, ['dependencies']),
    blockers: firstArray(row, ['blockers']),
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapRisk(row: Row, index: number): ExecutiveRisk {
  const likelihood = Math.max(1, Math.min(5, firstNumber(row, ['likelihood'], 3)))
  const impact = Math.max(1, Math.min(5, firstNumber(row, ['impact'], 3)))
  const exposure = firstNumber(row, ['exposure'], likelihood * impact * 4)
  return {
    id: firstString(row, ['id'], `risk-${index}`),
    riskCode: firstString(row, ['risk_code', 'code'], `EX-R${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Risque exécutif'),
    domain: firstString(row, ['domain'], 'Strategic'),
    status: normalizeStatus(row),
    likelihood,
    impact,
    exposure,
    ownerName: firstString(row, ['owner_name'], 'À assigner'),
    sponsorName: firstString(row, ['sponsor_name'], '') || null,
    earlySignals: firstArray(row, ['early_signals']),
    planA: firstString(row, ['plan_a'], 'Réponse primaire à définir'),
    planB: firstString(row, ['plan_b'], '') || null,
    planC: firstString(row, ['plan_c'], '') || null,
    escalationThreshold: firstString(row, ['escalation_threshold'], 'Seuil à définir'),
    currentResponse: firstString(row, ['current_response'], '') || null,
    nextReviewAt: firstString(row, ['next_review_at'], '') || null,
    tone: exposure >= 75 ? 'critical' : exposure >= 45 ? 'warning' : exposure >= 20 ? 'info' : 'good',
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapBoardSession(row: Row, index: number): ExecutiveBoardSession {
  return {
    id: firstString(row, ['id'], `board-${index}`),
    sessionCode: firstString(row, ['session_code', 'code'], `EX-B${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Session de gouvernance'),
    sessionType: firstString(row, ['session_type', 'type'], 'executive_review'),
    status: normalizeStatus(row),
    scheduledAt: firstString(row, ['scheduled_at'], '') || null,
    chairName: firstString(row, ['chair_name'], 'Managing Director'),
    secretaryName: firstString(row, ['secretary_name'], '') || null,
    agendaCount: firstNumber(row, ['agenda_count'], 0),
    resolutionCount: firstNumber(row, ['resolution_count'], 0),
    openCommitments: firstNumber(row, ['open_commitments'], 0),
    evidenceState: firstString(row, ['evidence_state'], 'partial'),
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapPaper(row: Row, index: number): ExecutivePaper {
  return {
    id: firstString(row, ['id'], `paper-${index}`),
    paperCode: firstString(row, ['paper_code', 'code'], `EX-PAP${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Document exécutif'),
    paperType: firstString(row, ['paper_type', 'type'], 'executive_brief'),
    status: normalizeStatus(row),
    audience: firstString(row, ['audience'], 'Executive Committee'),
    ownerName: firstString(row, ['owner_name'], 'À assigner'),
    approvalState: firstString(row, ['approval_state'], 'draft'),
    dueAt: firstString(row, ['due_at'], '') || null,
    versionNumber: firstNumber(row, ['version_number'], 1),
    confidentiality: firstString(row, ['confidentiality'], 'restricted'),
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function mapMandate(row: Row, index: number): ExecutiveMandate {
  return {
    id: firstString(row, ['id'], `mandate-${index}`),
    mandateCode: firstString(row, ['mandate_code', 'code'], `EX-M${String(index + 1).padStart(3, '0')}`),
    title: firstString(row, ['title', 'name'], 'Mandat exécutif'),
    status: normalizeStatus(row),
    ownerName: firstString(row, ['owner_name'], 'À assigner'),
    sponsorName: firstString(row, ['sponsor_name'], '') || null,
    dueAt: firstString(row, ['due_at'], '') || null,
    progress: Math.max(0, Math.min(100, firstNumber(row, ['progress'], 0))),
    expectedOutcome: firstString(row, ['expected_outcome'], 'Résultat à définir'),
    outcomeState: firstString(row, ['outcome_state'], '') || null,
    sourceType: firstString(row, ['source_type'], '') || null,
    sourceId: firstString(row, ['source_id'], '') || null,
    createdAt: firstString(row, ['created_at'], nowIso()),
    updatedAt: firstString(row, ['updated_at'], nowIso()),
  }
}

function buildSignal(rows: Row[], domain: string, href: string, fallback: string) {
  return rows.slice(0, 8).map((row, index): ExecutiveSignal => {
    const status = normalizeStatus(row)
    return {
      id: firstString(row, ['id'], `${domain}-${index}`),
      domain,
      title: firstString(row, ['title', 'subject', 'name', 'event_type'], fallback),
      summary: firstString(row, ['summary', 'description', 'notes', 'status'], status),
      context: firstString(row, ['client_name', 'customer_name', 'tenant_name', 'organization_name'], 'AngelCare 360'),
      occurredAt: firstString(row, ['occurred_at', 'created_at', 'updated_at'], nowIso()),
      tone: toneFromStatus(status, firstString(row, ['priority', 'severity'])),
      href,
    }
  })
}

export async function getExecutiveCommandSnapshot(): Promise<ExecutiveSnapshot> {
  await requireAngelcare360OperatorPermission('operator.audit.view')

  const [
    priorityRows,
    decisionRows,
    agendaRows,
    objectiveRows,
    initiativeRows,
    riskRows,
    boardRows,
    paperRows,
    mandateRows,
    clients,
    opportunities,
    offers,
    contracts,
    subscriptions,
    invoices,
    payments,
    tenants,
    cases,
    incidents,
    interventions,
    emailMessages,
    auditEvents,
    productSnapshots,
  ] = await Promise.all([
    readRows('angelcare360_operator_executive_priorities'),
    readRows('angelcare360_operator_executive_decisions'),
    readRows('angelcare360_operator_executive_agenda_streams'),
    readRows('angelcare360_operator_executive_objectives'),
    readRows('angelcare360_operator_executive_initiatives'),
    readRows('angelcare360_operator_executive_risks'),
    readRows('angelcare360_operator_executive_board_sessions'),
    readRows('angelcare360_operator_executive_papers'),
    readRows('angelcare360_operator_executive_mandates'),
    readRows('angelcare360_operator_clients'),
    readRows('angelcare360_operator_growth_opportunities'),
    readRows('angelcare360_operator_growth_offers'),
    readRows('angelcare360_operator_contracts'),
    readRows('angelcare360_operator_subscriptions'),
    readRows('angelcare360_operator_invoices'),
    readRows('angelcare360_operator_payments'),
    readRows('angelcare360_operator_tenants'),
    readCandidates(['angelcare360_operator_customer_cases', 'angelcare360_operator_growth_customer_cases']),
    readRows('angelcare360_operator_incidents'),
    readCandidates(['angelcare360_operator_customer_interventions', 'angelcare360_operator_growth_interventions']),
    readCandidates(['angelcare360_operator_email_messages', 'email_os_messages', 'email_messages']),
    readRows('angelcare360_operator_audit_logs'),
    readRows('angelcare360_operator_tenant_entitlement_snapshots'),
  ])

  const priorities = priorityRows.map(mapPriority)
  const decisions = decisionRows.map(mapDecision)
  const agenda = agendaRows.map(mapAgenda)
  const objectives = objectiveRows.map(mapObjective)
  const initiatives = initiativeRows.map(mapInitiative)
  const risks = riskRows.map(mapRisk)
  const boardSessions = boardRows.map(mapBoardSession)
  const papers = paperRows.map(mapPaper)
  const mandates = mandateRows.map(mapMandate)

  const openDecisions = decisions.filter((item) => openStatus(item.status))
  const criticalRisks = risks.filter((item) => item.tone === 'critical' && openStatus(item.status))
  const activeInitiatives = initiatives.filter((item) => openStatus(item.status))
  const activeObjectives = objectives.filter((item) => openStatus(item.status))
  const openPriorities = priorities.filter((item) => openStatus(item.status))
  const openMandates = mandates.filter((item) => openStatus(item.status))

  const activeMrr = summarizeMoney(subscriptions.filter((row) => ['active', 'live', 'trial'].includes(normalizeStatus(row))).map((row) => row.billing_amount_mad ?? row.monthly_price_mad ?? row.mrr_mad))
  const pipeline = summarizeMoney(opportunities.filter((row) => openStatus(normalizeStatus(row))).map((row) => row.expected_arr_mad ?? row.expected_value_mad ?? row.amount_mad))
  const offered = summarizeMoney(offers.filter((row) => openStatus(normalizeStatus(row))).map((row) => row.contract_value_mad ?? row.annual_price_mad ?? row.total_mad))
  const contracted = summarizeMoney(contracts.filter((row) => ['active', 'signed', 'executed'].includes(normalizeStatus(row))).map((row) => row.contract_value_mad ?? row.annual_value_mad ?? row.amount_mad))
  const invoiced = summarizeMoney(invoices.map((row) => row.total_mad ?? row.amount_mad ?? row.total_amount_mad))
  const collected = summarizeMoney(payments.map((row) => row.amount_mad ?? row.paid_amount_mad))
  const openCases = cases.filter((row) => openStatus(normalizeStatus(row)))
  const openIncidents = incidents.filter((row) => openStatus(normalizeStatus(row)))
  const activeTenants = tenants.filter((row) => ['active', 'live', 'operational', 'provisioned'].includes(normalizeStatus(row)))
  const activeClients = clients.filter((row) => ['active', 'pilot', 'live'].includes(normalizeStatus(row)))

  const objectiveAttainment = activeObjectives.length
    ? Math.round(activeObjectives.reduce((sum, item) => sum + Math.min(100, item.targetValue ? item.actualValue / item.targetValue * 100 : 0), 0) / activeObjectives.length)
    : 0
  const executionConfidence = activeInitiatives.length
    ? Math.round(activeInitiatives.reduce((sum, item) => sum + item.confidence, 0) / activeInitiatives.length)
    : 50
  const riskPressure = risks.reduce((sum, item) => sum + (openStatus(item.status) ? item.exposure : 0), 0)
  const strategicHealth = Math.max(20, Math.min(99, Math.round((objectiveAttainment * 0.36) + (executionConfidence * 0.34) + (100 - Math.min(100, riskPressure / Math.max(1, risks.length))) * 0.3)))

  const sources = [
    source('executive', 'Executive Control', [...priorityRows, ...decisionRows, ...agendaRows, ...objectiveRows, ...initiativeRows, ...riskRows, ...boardRows, ...paperRows, ...mandateRows], 'La migration Executive Command doit être appliquée.'),
    source('commercial', 'Commercial & Growth', [...opportunities, ...offers, ...contracts]),
    source('customers', 'Customer Portfolio', clients),
    source('tenants', 'Tenants & Product', [...tenants, ...productSnapshots]),
    source('finance', 'Revenue & Finance', [...invoices, ...payments, ...subscriptions]),
    source('service', 'Service & Recovery', [...cases, ...incidents, ...interventions]),
    source('communications', 'Email & Correspondence', emailMessages),
    source('audit', 'Platform & Audit', auditEvents),
  ]
  const liveSources = sources.filter((item) => item.state === 'live').length
  const sourceState = liveSources === sources.length ? 'live' : liveSources >= 4 ? 'partial' : 'unavailable'

  const metrics: ExecutiveMetric[] = [
    { key: 'authority', label: 'Authority queue', value: String(openDecisions.length), detail: 'Décisions en attente de Direction', delta: `${openPriorities.length} priorités actives`, tone: openDecisions.length > 8 ? 'critical' : openDecisions.length > 3 ? 'warning' : 'good', href: '/angelcare-360-operator/executive?view=decisions' },
    { key: 'health', label: 'Strategic health', value: `${strategicHealth}%`, detail: 'Objectifs, exécution et risques combinés', delta: `${objectiveAttainment}% attainment`, tone: strategicHealth >= 80 ? 'good' : strategicHealth >= 60 ? 'info' : strategicHealth >= 40 ? 'warning' : 'critical', href: '/angelcare-360-operator/executive?view=performance' },
    { key: 'growth', label: 'Active MRR', value: compactMoney(activeMrr), detail: `${activeClients.length} clients actifs`, delta: `${compactMoney(pipeline)} pipeline`, tone: activeMrr > 0 ? 'good' : 'neutral', href: '/angelcare-360-operator/executive?view=growth' },
    { key: 'risk', label: 'Critical risks', value: String(criticalRisks.length), detail: `${risks.filter((item) => openStatus(item.status)).length} risques ouverts`, delta: `${openIncidents.length} incidents actifs`, tone: criticalRisks.length ? 'critical' : risks.length ? 'warning' : 'good', href: '/angelcare-360-operator/executive?view=risk' },
    { key: 'execution', label: 'Execution confidence', value: `${executionConfidence}%`, detail: `${activeInitiatives.length} initiatives actives`, delta: `${openMandates.length} mandats ouverts`, tone: executionConfidence >= 80 ? 'good' : executionConfidence >= 60 ? 'info' : 'warning', href: '/angelcare-360-operator/executive?view=transformation' },
    { key: 'board', label: 'Governance cycle', value: String(boardSessions.filter((item) => openStatus(item.status)).length), detail: 'Sessions et comités ouverts', delta: `${papers.filter((item) => openStatus(item.status)).length} papers en préparation`, tone: 'info', href: '/angelcare-360-operator/executive?view=board' },
  ]

  const growthLevers: ExecutiveGrowthLever[] = [
    { key: 'pipeline', label: 'Pipeline', value: compactMoney(pipeline), detail: `${opportunities.filter((row) => openStatus(normalizeStatus(row))).length} opportunités`, pressure: pipeline > 0 ? 74 : 12, tone: pipeline > 0 ? 'info' : 'neutral', href: '/angelcare-360-operator/growth?view=pipeline' },
    { key: 'offers', label: 'Offres', value: compactMoney(offered), detail: `${offers.filter((row) => openStatus(normalizeStatus(row))).length} offres actives`, pressure: offered > 0 ? 62 : 10, tone: offered > 0 ? 'info' : 'neutral', href: '/angelcare-360-operator/growth?view=offers' },
    { key: 'contracted', label: 'Contracté', value: compactMoney(contracted), detail: `${contracts.filter((row) => ['active', 'signed', 'executed'].includes(normalizeStatus(row))).length} contrats`, pressure: contracted > 0 ? 82 : 8, tone: contracted > 0 ? 'good' : 'neutral', href: '/angelcare-360-operator/growth?view=contracts' },
    { key: 'mrr', label: 'MRR activé', value: compactMoney(activeMrr), detail: `${activeTenants.length} tenants actifs`, pressure: activeMrr > 0 ? 86 : 8, tone: activeMrr > 0 ? 'good' : 'neutral', href: '/angelcare-360-operator/tenants-product?view=deployments' },
    { key: 'invoiced', label: 'Facturé', value: compactMoney(invoiced), detail: `${invoices.length} factures`, pressure: invoiced > 0 ? 70 : 8, tone: invoiced > 0 ? 'info' : 'neutral', href: '/angelcare-360-operator/billing/invoices' },
    { key: 'collected', label: 'Collecté', value: compactMoney(collected), detail: `${payments.length} paiements`, pressure: collected > 0 ? 78 : 8, tone: collected > 0 ? 'good' : 'neutral', href: '/angelcare-360-operator/billing/payments' },
  ]

  const derivedPriorities: ExecutivePriority[] = []
  if (criticalRisks.length) derivedPriorities.push({
    id: 'derived-critical-risks', priorityCode: 'LIVE-RISK', title: 'Risques critiques nécessitant arbitrage', summary: `${criticalRisks.length} risque(s) ont franchi le seuil critique.`, status: 'critical', priority: 'urgent', authorityLevel: 'Direction Générale', ownerName: criticalRisks[0]?.ownerName || 'À assigner', dueAt: criticalRisks[0]?.nextReviewAt || null, impact: 'Continuité, valeur ou réputation exposée', evidenceState: 'live', sourceType: 'risk', sourceId: criticalRisks[0]?.id || null, nextAction: 'Ouvrir la Crisis Room', tone: 'critical', href: '/angelcare-360-operator/executive?view=risk', createdAt: nowIso(), updatedAt: nowIso(),
  })
  if (openCases.length > 0) derivedPriorities.push({
    id: 'derived-customer-pressure', priorityCode: 'LIVE-CX', title: 'Pression client et service active', summary: `${openCases.length} cas ouverts et ${openIncidents.length} incident(s) à contrôler.`, status: openCases.length > 8 ? 'warning' : 'active', priority: openCases.length > 8 ? 'high' : 'normal', authorityLevel: 'Executive Sponsor', ownerName: 'Customer Operations', dueAt: null, impact: 'Rétention et expérience client', evidenceState: 'live', sourceType: 'customer_cases', sourceId: null, nextAction: 'Ouvrir le portefeuille de recovery', tone: openCases.length > 8 ? 'warning' : 'info', href: '/angelcare-360-operator/growth?view=health', createdAt: nowIso(), updatedAt: nowIso(),
  })
  if (pipeline > 0 && offered < pipeline * 0.35) derivedPriorities.push({
    id: 'derived-commercial-conversion', priorityCode: 'LIVE-GROWTH', title: 'Conversion commerciale sous pression', summary: 'La valeur offerte reste faible par rapport au pipeline actif.', status: 'attention', priority: 'high', authorityLevel: 'Commercial Executive', ownerName: 'Commercial', dueAt: null, impact: 'Accélération revenue', evidenceState: 'live', sourceType: 'growth', sourceId: null, nextAction: 'Prioriser les comptes décisifs', tone: 'warning', href: '/angelcare-360-operator/executive?view=growth', createdAt: nowIso(), updatedAt: nowIso(),
  })

  const signals = [
    ...buildSignal(decisionRows, 'Authority', '/angelcare-360-operator/executive?view=decisions', 'Décision exécutive'),
    ...buildSignal(riskRows, 'Risk', '/angelcare-360-operator/executive?view=risk', 'Risque exécutif'),
    ...buildSignal(opportunities, 'Growth', '/angelcare-360-operator/growth?view=pipeline', 'Mouvement commercial'),
    ...buildSignal(cases, 'Customer', '/angelcare-360-operator/growth?view=health', 'Signal client'),
    ...buildSignal(auditEvents, 'Platform', '/angelcare-360-operator/audit', 'Événement plateforme'),
  ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 30)

  return {
    generatedAt: nowIso(),
    sourceState,
    sources,
    metrics,
    priorities: [...openPriorities, ...derivedPriorities].slice(0, 24),
    decisions,
    agenda,
    objectives,
    initiatives,
    risks,
    boardSessions,
    papers,
    mandates,
    signals,
    growthLevers,
    authorityQueue: openDecisions.length,
    criticalRiskCount: criticalRisks.length,
    strategicHealth,
    executionConfidence,
    companyPulse: {
      revenue: Math.max(0, Math.min(100, activeMrr > 0 ? 84 : pipeline > 0 ? 68 : 35)),
      customers: Math.max(0, Math.min(100, 92 - openCases.length * 2)),
      tenants: Math.max(0, Math.min(100, activeTenants.length ? 88 : tenants.length ? 60 : 30)),
      service: Math.max(0, Math.min(100, 95 - openCases.length * 2 - openIncidents.length * 4)),
      platform: Math.max(0, Math.min(100, auditEvents.length ? 90 : 72)),
      people: Math.max(0, Math.min(100, openMandates.length ? 78 : 68)),
    },
  }
}
