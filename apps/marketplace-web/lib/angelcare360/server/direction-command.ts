import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import {
  actionsForMatter,
  DIRECTION_DOMAINS,
  matterLane,
  matterTone,
} from '@/data/angelcare360/direction-command'
import type {
  DirectionBriefing,
  DirectionCommandResult,
  DirectionCommandSnapshot,
  DirectionCommitment,
  DirectionCommitmentActionRequest,
  DirectionCommitmentCreateRequest,
  DirectionDecision,
  DirectionDecisionActionRequest,
  DirectionDecisionCreateRequest,
  DirectionDomainKey,
  DirectionDomainPosture,
  DirectionEvidenceItem,
  DirectionImpact,
  DirectionLinkedRecord,
  DirectionMatter,
  DirectionMatterActionRequest,
  DirectionMatterState,
  DirectionSeverity,
  DirectionSitePosture,
  DirectionTimelineEvent,
  DirectionTone,
} from '@/types/angelcare360/direction-command'

type Db = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

const ACTIVE_ACCESS = new Set(['super_admin', 'direction', 'administration', 'qualite', 'comptabilite', 'rh'])
const DECISION_ACCESS = new Set(['super_admin', 'direction'])
const TERMINAL_STATES = new Set<DirectionMatterState>(['resolved', 'released', 'rejected', 'cancelled'])

function asRow(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(asRow) : []
}

function text(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback
  const normalized = String(value).trim()
  return normalized || fallback
}

function optionalText(value: unknown): string | null {
  const normalized = text(value)
  return normalized || null
}

function numeric(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return fallback
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : []
}

function iso(value?: unknown): string {
  const candidate = optionalText(value)
  if (candidate && Number.isFinite(Date.parse(candidate))) return new Date(candidate).toISOString()
  return new Date().toISOString()
}

function stableId(value: string): string {
  const hash = createHash('sha256').update(value).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

function idempotency(value: unknown, fallbackPayload: unknown): string {
  return optionalText(value) || createHash('sha256').update(JSON.stringify(fallbackPayload)).digest('hex')
}

function minorFromUnknown(value: unknown): number {
  const amount = numeric(value)
  if (!amount) return 0
  return Math.round(amount * 100)
}

function formatMoneyMinor(value: number, currency = 'Dh') {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value / 100))} ${currency}`
}

function severityFrom(input: unknown, fallback: DirectionSeverity = 'medium'): DirectionSeverity {
  const normalized = text(input).toLowerCase()
  if (['critical', 'critique', 'urgent'].includes(normalized)) return 'critical'
  if (['high', 'haute', 'warning', 'overdue'].includes(normalized)) return 'high'
  if (['medium', 'moyenne', 'info', 'open', 'pending'].includes(normalized)) return 'medium'
  if (['low', 'basse'].includes(normalized)) return 'low'
  if (['information', 'neutral'].includes(normalized)) return 'information'
  return fallback
}

function stateFrom(value: unknown, fallback: DirectionMatterState = 'new'): DirectionMatterState {
  const normalized = text(value).toLowerCase()
  const allowed: DirectionMatterState[] = [
    'new', 'acknowledged', 'owned', 'in_progress', 'waiting_evidence', 'decision_required',
    'approved_execution', 'executing', 'resolved', 'released', 'snoozed', 'reopened',
    'rejected', 'cancelled',
  ]
  return allowed.includes(normalized as DirectionMatterState) ? normalized as DirectionMatterState : fallback
}

async function requireDirectionContext(options?: { decide?: boolean; domain?: DirectionDomainKey }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif ne peut être résolu.', 403)
  const access = context.access.accessLevel
  if (!ACTIVE_ACCESS.has(access)) throw new Angelcare360AccessError('Le Cockpit de Direction est hors de votre périmètre.', 403)
  if (options?.decide && !DECISION_ACCESS.has(access)) {
    const domainAllowed = (options.domain === 'finance' && access === 'comptabilite')
      || (['people', 'payroll'].includes(options.domain || '') && access === 'rh')
      || (['quality', 'compliance'].includes(options.domain || '') && access === 'qualite')
    if (!domainAllowed) throw new Angelcare360AccessError('Cette décision exige une autorité de Direction.', 403)
  }
  return context
}

async function safeRows(
  db: Db,
  table: string,
  schoolId: string,
  options?: { limit?: number; order?: string; ascending?: boolean; filters?: Array<{ column: string; operator: 'eq' | 'neq' | 'in' | 'gte' | 'lte'; value: unknown }> },
): Promise<Row[]> {
  try {
    let query = db.from(table).select('*').eq('school_id', schoolId)
    for (const filter of options?.filters || []) {
      if (filter.operator === 'eq') query = query.eq(filter.column, filter.value as never)
      if (filter.operator === 'neq') query = query.neq(filter.column, filter.value as never)
      if (filter.operator === 'in') query = query.in(filter.column, Array.isArray(filter.value) ? filter.value as never[] : [filter.value] as never[])
      if (filter.operator === 'gte') query = query.gte(filter.column, filter.value as never)
      if (filter.operator === 'lte') query = query.lte(filter.column, filter.value as never)
    }
    if (options?.order) query = query.order(options.order, { ascending: options.ascending ?? false })
    const { data, error } = await query.limit(options?.limit || 80)
    if (error) return []
    return asRows(data)
  } catch {
    return []
  }
}

async function safeSingle(db: Db, table: string, schoolId: string, id: string): Promise<Row | null> {
  try {
    const { data, error } = await db.from(table).select('*').eq('school_id', schoolId).eq('id', id).maybeSingle()
    return error ? null : asRow(data)
  } catch {
    return null
  }
}

function recordHref(domain: DirectionDomainKey, sourceType: string, sourceId: string) {
  const encoded = encodeURIComponent(sourceId)
  const mappings: Record<string, string> = {
    admission_application: `/angelcare-360-command-center/admissions?plane=dossiers&entity=${encoded}&drawer=application&source=direction`,
    attendance_correction: `/angelcare-360-command-center/presences?plane=corrections&entity=${encoded}&drawer=correction&source=direction`,
    attendance_session: `/angelcare-360-command-center/presences?plane=day-closure&entity=${encoded}&drawer=session&source=direction`,
    invoice: `/angelcare-360-command-center/finance/factures?plane=invoices&entity=${encoded}&drawer=invoice&source=direction`,
    refund_request: `/angelcare-360-command-center/finance/paiements?plane=refunds&entity=${encoded}&drawer=refund&source=direction`,
    payment_commitment: `/angelcare-360-command-center/finance/soldes-eleves?plane=commitments&entity=${encoded}&drawer=commitment&source=direction`,
    payroll_execution: `/angelcare-360-command-center/paie/validation?plane=exceptions&entity=${encoded}&drawer=payroll-execution&source=direction`,
    payroll_period: `/angelcare-360-command-center/paie/periodes?plane=period-command&entity=${encoded}&drawer=period&source=direction`,
    reclamation: `/angelcare-360-command-center/reclamations/tickets?entity=${encoded}&drawer=claim&source=direction`,
    product_reality_exception: `/angelcare-360-command-center/administration?plane=readiness&entity=${encoded}&drawer=exception&source=direction`,
    timetable_conflict: `/angelcare-360-command-center/emploi-du-temps?plane=conflicts&entity=${encoded}&drawer=conflict&source=direction`,
    grade_correction: `/angelcare-360-command-center/academique?plane=validation&entity=${encoded}&drawer=grade-correction&source=direction`,
  }
  return mappings[sourceType] || `${DIRECTION_DOMAINS[domain].exactBaseHref}?entity=${encoded}&source=direction`
}

function linkedRecord(input: {
  id: string
  type: string
  label: string
  secondary?: string | null
  status?: string | null
  domain: DirectionDomainKey
}): DirectionLinkedRecord {
  return {
    id: input.id,
    type: input.type,
    label: input.label,
    secondary: input.secondary || null,
    status: input.status || null,
    href: recordHref(input.domain, input.type, input.id),
  }
}

function sourceEvent(input: {
  fingerprint: string
  label: string
  detail?: string | null
  createdAt?: unknown
  tone?: DirectionTone
}): DirectionTimelineEvent {
  return {
    id: stableId(`${input.fingerprint}:source-event`),
    eventType: 'source_detected',
    label: input.label,
    detail: input.detail || null,
    actorLabel: 'Moteur de détection',
    createdAt: iso(input.createdAt),
    tone: input.tone || 'neutral',
  }
}

function evidence(input: {
  fingerprint: string
  label: string
  kind?: DirectionEvidenceItem['kind']
  state?: DirectionEvidenceItem['state']
  href?: string | null
  createdAt?: unknown
}): DirectionEvidenceItem {
  return {
    id: stableId(`${input.fingerprint}:evidence:${input.label}`),
    label: input.label,
    kind: input.kind || 'record',
    state: input.state || 'available',
    href: input.href || null,
    createdAt: input.createdAt ? iso(input.createdAt) : null,
  }
}

function buildMatter(input: {
  fingerprint: string
  title: string
  summary: string
  domain: DirectionDomainKey
  sourceType: string
  sourceId: string
  sourceLabel: string
  severity: DirectionSeverity
  dueAt?: string | null
  detectedAt?: unknown
  updatedAt?: unknown
  impact?: Partial<DirectionImpact>
  linkedRecords?: DirectionLinkedRecord[]
  evidence?: DirectionEvidenceItem[]
  timeline?: DirectionTimelineEvent[]
  metadata?: Row
  projected?: Row | null
  canDecide: boolean
}): DirectionMatter {
  const projected = input.projected || {}
  const state = stateFrom(projected.state, 'new')
  const severity = severityFrom(projected.severity, input.severity)
  const dueAt = optionalText(projected.due_at) || input.dueAt || null
  const impact: DirectionImpact = {
    operational: optionalText(asRow(projected.impact_json).operational) || input.impact?.operational || null,
    financialMinor: projected.financial_impact_minor === null || projected.financial_impact_minor === undefined
      ? input.impact?.financialMinor ?? null
      : numeric(projected.financial_impact_minor),
    peopleCount: projected.people_count === null || projected.people_count === undefined
      ? input.impact?.peopleCount ?? null
      : numeric(projected.people_count),
    familyCount: projected.family_count === null || projected.family_count === undefined
      ? input.impact?.familyCount ?? null
      : numeric(projected.family_count),
    compliance: optionalText(asRow(projected.impact_json).compliance) || input.impact?.compliance || null,
    dependencies: arrayOfStrings(asRow(projected.impact_json).dependencies).length
      ? arrayOfStrings(asRow(projected.impact_json).dependencies)
      : input.impact?.dependencies || [],
  }
  return {
    id: optionalText(projected.id) || stableId(input.fingerprint),
    fingerprint: input.fingerprint,
    title: optionalText(projected.title) || input.title,
    summary: optionalText(projected.summary) || input.summary,
    domain: input.domain,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceLabel: input.sourceLabel,
    state,
    severity,
    tone: matterTone(severity, state),
    lane: matterLane({ severity, state, dueAt }),
    ownerUserId: optionalText(projected.owner_user_id),
    ownerLabel: optionalText(projected.owner_label),
    dueAt,
    detectedAt: iso(projected.detected_at || input.detectedAt),
    updatedAt: iso(projected.updated_at || input.updatedAt || input.detectedAt),
    acknowledgedAt: optionalText(projected.acknowledged_at),
    checkedAt: optionalText(projected.checked_at),
    resolvedAt: optionalText(projected.resolved_at),
    resolutionReason: optionalText(projected.resolution_reason),
    exactHref: optionalText(projected.exact_href) || recordHref(input.domain, input.sourceType, input.sourceId),
    availableActions: actionsForMatter(state, input.canDecide),
    impact,
    linkedRecords: input.linkedRecords || [],
    evidence: input.evidence || [],
    timeline: input.timeline || [],
    metadata: { ...(input.metadata || {}), ...asRow(projected.metadata_json) },
  }
}

async function loadProjectionMap(db: Db, schoolId: string) {
  const rows = await safeRows(db, 'angelcare360_direction_matters', schoolId, { limit: 500, order: 'updated_at' })
  return new Map(rows.map((row) => [text(row.fingerprint), row]))
}

async function loadDirectionEvents(db: Db, schoolId: string, matterIds: string[]) {
  if (!matterIds.length) return new Map<string, DirectionTimelineEvent[]>()
  try {
    const { data, error } = await db
      .from('angelcare360_direction_matter_events')
      .select('*')
      .eq('school_id', schoolId)
      .in('matter_id', matterIds)
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) return new Map<string, DirectionTimelineEvent[]>()
    const map = new Map<string, DirectionTimelineEvent[]>()
    for (const row of asRows(data)) {
      const matterId = text(row.matter_id)
      const events = map.get(matterId) || []
      events.push({
        id: text(row.id),
        eventType: text(row.event_type, 'event'),
        label: text(row.label, 'Événement Direction'),
        detail: optionalText(row.detail),
        actorLabel: optionalText(row.actor_label),
        createdAt: iso(row.created_at),
        tone: (text(row.tone, 'neutral') as DirectionTone),
      })
      map.set(matterId, events)
    }
    return map
  } catch {
    return new Map<string, DirectionTimelineEvent[]>()
  }
}

function projectionFor(map: Map<string, Row>, fingerprint: string) {
  return map.get(fingerprint) || null
}

async function synthesizeMatters(db: Db, schoolId: string, projection: Map<string, Row>, canDecide: boolean, currency: string) {
  const matters: DirectionMatter[] = []
  const warnings: string[] = []
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    invoices,
    admissions,
    attendanceCorrections,
    attendanceSessions,
    complaints,
    realityExceptions,
    timetableConflicts,
    gradeCorrections,
    refundRequests,
    commitments,
    payrollExecutions,
    payrollPeriods,
  ] = await Promise.all([
    safeRows(db, 'angelcare360_invoices', schoolId, { limit: 80, order: 'due_date', ascending: true }),
    safeRows(db, 'angelcare360_admission_applications', schoolId, { limit: 80, order: 'updated_at' }),
    safeRows(db, 'angelcare360_attendance_correction_requests', schoolId, { limit: 80, order: 'created_at' }),
    safeRows(db, 'angelcare360_attendance_sessions', schoolId, { limit: 80, order: 'session_date' }),
    safeRows(db, 'angelcare360_reclamations', schoolId, { limit: 80, order: 'created_at' }),
    safeRows(db, 'angelcare360_product_reality_exceptions', schoolId, { limit: 80, order: 'created_at' }),
    safeRows(db, 'angelcare360_timetable_conflict_findings', schoolId, { limit: 80, order: 'created_at' }),
    safeRows(db, 'angelcare360_grade_correction_requests', schoolId, { limit: 80, order: 'created_at' }),
    safeRows(db, 'angelcare360_finance_refund_requests', schoolId, { limit: 80, order: 'created_at' }),
    safeRows(db, 'angelcare360_finance_payment_commitments', schoolId, { limit: 80, order: 'due_at' }),
    safeRows(db, 'angelcare360_payroll_sovereign_executions', schoolId, { limit: 80, order: 'created_at' }),
    safeRows(db, 'angelcare360_payroll_periods', schoolId, { limit: 24, order: 'period_start' }),
  ])

  for (const row of invoices) {
    const status = text(row.status).toLowerCase()
    const balanceMinor = minorFromUnknown(row.balance_due ?? row.balance ?? row.total_amount)
    const dueAt = optionalText(row.due_date)
    const overdue = status === 'overdue' || (dueAt ? Date.parse(dueAt) < Date.now() && balanceMinor > 0 : false)
    if (!overdue && !['partial', 'partially_paid', 'disputed'].includes(status)) continue
    const id = text(row.id)
    const fingerprint = `finance:invoice:${id}`
    const numberLabel = text(row.invoice_number || row.invoice_code, `Facture ${id.slice(0, 8)}`)
    matters.push(buildMatter({
      fingerprint,
      title: overdue ? `Créance échue · ${numberLabel}` : `Facture sous surveillance · ${numberLabel}`,
      summary: balanceMinor > 0
        ? `${formatMoneyMinor(balanceMinor, currency)} restent à sécuriser sur ce compte.`
        : 'Cette facture exige une revue de son état et de son allocation.',
      domain: 'finance', sourceType: 'invoice', sourceId: id, sourceLabel: numberLabel,
      severity: balanceMinor >= 500000 ? 'critical' : overdue ? 'high' : 'medium', dueAt,
      detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Recouvrement et relation famille', financialMinor: balanceMinor, familyCount: 1, peopleCount: 1, dependencies: ['Compte payeur', 'Allocations de paiement'] },
      linkedRecords: [linkedRecord({ id, type: 'invoice', label: numberLabel, secondary: balanceMinor ? formatMoneyMinor(balanceMinor, currency) : null, status, domain: 'finance' })],
      evidence: [evidence({ fingerprint, label: 'Facture autoritative', kind: 'document', href: recordHref('finance', 'invoice', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Exposition financière détectée', detail: status, createdAt: row.updated_at || row.created_at, tone: overdue ? 'critical' : 'warning' })],
      metadata: { status, balanceMinor }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of admissions) {
    const status = text(row.application_stage || row.status).toLowerCase()
    if (['converted', 'closed', 'archived', 'rejected'].includes(status)) continue
    const id = text(row.id)
    const fingerprint = `admissions:application:${id}`
    const candidate = [text(row.child_first_name), text(row.child_last_name)].filter(Boolean).join(' ') || text(row.application_code, `Dossier ${id.slice(0, 8)}`)
    const dueAt = optionalText(row.review_due_at || row.due_at)
    const critical = ['decision_required', 'capacity_blocked', 'documents_blocked'].includes(status)
    matters.push(buildMatter({
      fingerprint,
      title: critical ? `Admission bloquée · ${candidate}` : `Admission à faire progresser · ${candidate}`,
      summary: `Le dossier est actuellement « ${status || 'à qualifier'} » et requiert une prochaine action explicite.`,
      domain: 'admissions', sourceType: 'admission_application', sourceId: id, sourceLabel: candidate,
      severity: critical ? 'high' : 'medium', dueAt, detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Parcours famille et capacité', peopleCount: 1, familyCount: 1, dependencies: ['Documents', 'Capacité', 'Décision admission'] },
      linkedRecords: [linkedRecord({ id, type: 'admission_application', label: candidate, secondary: text(row.application_code) || null, status, domain: 'admissions' })],
      evidence: [evidence({ fingerprint, label: 'Dossier de candidature', href: recordHref('admissions', 'admission_application', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Dossier admission sous contrôle', detail: status, createdAt: row.updated_at || row.created_at, tone: critical ? 'warning' : 'active' })],
      metadata: { status }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of attendanceCorrections) {
    const status = text(row.status).toLowerCase()
    if (['applied', 'resolved', 'rejected', 'closed'].includes(status)) continue
    const id = text(row.id)
    const fingerprint = `attendance:correction:${id}`
    matters.push(buildMatter({
      fingerprint,
      title: text(row.title, 'Correction de présence à autoriser'),
      summary: text(row.detail || row.reason, 'Une correction demande une revue de l’état avant/après et de sa preuve.'),
      domain: 'attendance', sourceType: 'attendance_correction', sourceId: id, sourceLabel: text(row.title, 'Correction présence'),
      severity: severityFrom(row.severity, 'medium'), dueAt: optionalText(row.due_at), detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Exactitude de la journée scolaire', peopleCount: 1, familyCount: 1, dependencies: ['Record de présence', 'Justification'] },
      linkedRecords: [linkedRecord({ id, type: 'attendance_correction', label: text(row.title, 'Correction présence'), secondary: text(row.reason) || null, status, domain: 'attendance' })],
      evidence: [evidence({ fingerprint, label: 'État avant/après', kind: 'record', href: recordHref('attendance', 'attendance_correction', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Correction demandée', detail: text(row.reason) || null, createdAt: row.created_at, tone: 'warning' })],
      metadata: { status }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of attendanceSessions) {
    const status = text(row.status).toLowerCase()
    const sessionDate = optionalText(row.session_date)
    if (!sessionDate || Date.parse(sessionDate) < Date.parse(todayStart) || ['closed', 'locked'].includes(status)) continue
    const expected = numeric(row.total_expected)
    const marked = numeric(row.total_present) + numeric(row.total_absent) + numeric(row.total_late) + numeric(row.total_excused)
    if (!expected || marked >= expected) continue
    const id = text(row.id)
    const fingerprint = `attendance:session:${id}`
    const missing = Math.max(0, expected - marked)
    matters.push(buildMatter({
      fingerprint,
      title: `${missing} présence(s) non finalisée(s)`,
      summary: 'La clôture de journée reste bloquée tant que la population attendue n’est pas entièrement traitée.',
      domain: 'attendance', sourceType: 'attendance_session', sourceId: id, sourceLabel: `Session ${sessionDate}`,
      severity: missing >= 5 ? 'high' : 'medium', dueAt: `${sessionDate}T18:00:00.000Z`, detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Clôture de journée', peopleCount: missing, familyCount: missing, dependencies: ['Classe', 'Justifications'] },
      linkedRecords: [linkedRecord({ id, type: 'attendance_session', label: `Session ${sessionDate}`, secondary: `${missing} manquante(s)`, status, domain: 'attendance' })],
      evidence: [evidence({ fingerprint, label: 'Session de présence', href: recordHref('attendance', 'attendance_session', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Clôture incomplète détectée', detail: `${missing} record(s) restant(s)`, createdAt: row.updated_at, tone: 'warning' })],
      metadata: { expected, marked, missing }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of complaints) {
    const status = text(row.status).toLowerCase()
    if (['resolved', 'closed', 'archived', 'rejected'].includes(status)) continue
    const id = text(row.id)
    const priority = text(row.priority || row.severity).toLowerCase()
    const fingerprint = `quality:reclamation:${id}`
    const title = text(row.title || row.subject, `Réclamation ${text(row.claim_code, id.slice(0, 8))}`)
    matters.push(buildMatter({
      fingerprint,
      title,
      summary: text(row.description || row.detail, 'Une réclamation ouverte exige un propriétaire, une réponse et une preuve de résolution.'),
      domain: 'quality', sourceType: 'reclamation', sourceId: id, sourceLabel: title,
      severity: ['urgent', 'critical'].includes(priority) ? 'critical' : priority === 'high' ? 'high' : 'medium',
      dueAt: optionalText(row.sla_due_at || row.due_at), detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Qualité et confiance famille', familyCount: 1, peopleCount: 1, compliance: priority === 'urgent' ? 'Revue immédiate' : null, dependencies: ['Réponse', 'Preuve de résolution'] },
      linkedRecords: [linkedRecord({ id, type: 'reclamation', label: title, secondary: text(row.claim_code) || null, status, domain: 'quality' })],
      evidence: [evidence({ fingerprint, label: 'Dossier de réclamation', href: recordHref('quality', 'reclamation', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Réclamation active', detail: priority || status, createdAt: row.updated_at || row.created_at, tone: ['urgent', 'critical'].includes(priority) ? 'critical' : 'warning' })],
      metadata: { status, priority }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of realityExceptions) {
    const status = text(row.status).toLowerCase()
    if (['resolved', 'closed', 'archived'].includes(status)) continue
    const id = text(row.id)
    const domainCandidate = text(row.domain_key || row.domain).toLowerCase() as DirectionDomainKey
    const domain: DirectionDomainKey = domainCandidate in DIRECTION_DOMAINS ? domainCandidate : 'governance'
    const fingerprint = `reality:exception:${id}`
    matters.push(buildMatter({
      fingerprint,
      title: text(row.title, 'Exception Product Reality'),
      summary: text(row.detail || row.description, 'Une exception de configuration ou d’exécution empêche le comportement attendu.'),
      domain, sourceType: 'product_reality_exception', sourceId: id, sourceLabel: text(row.title, 'Exception Product Reality'),
      severity: severityFrom(row.severity, 'high'), dueAt: optionalText(row.due_at), detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: text(row.operation_key) || 'Runtime et gouvernance', compliance: 'Contrôle Product Reality', dependencies: [text(row.entity_type)].filter(Boolean) },
      linkedRecords: [linkedRecord({ id, type: 'product_reality_exception', label: text(row.title, 'Exception'), secondary: text(row.operation_key) || null, status, domain })],
      evidence: [evidence({ fingerprint, label: 'Exception runtime', kind: 'event', href: recordHref(domain, 'product_reality_exception', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Exception runtime détectée', detail: text(row.operation_key) || null, createdAt: row.created_at, tone: 'critical' })],
      metadata: { status, operationKey: row.operation_key }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of timetableConflicts) {
    const status = text(row.status).toLowerCase()
    if (['resolved', 'closed', 'archived'].includes(status)) continue
    const id = text(row.id)
    const fingerprint = `academics:timetable-conflict:${id}`
    matters.push(buildMatter({
      fingerprint,
      title: text(row.title, 'Conflit emploi du temps'),
      summary: text(row.detail, 'Un chevauchement de classe, enseignant ou salle bloque la publication.'),
      domain: 'academics', sourceType: 'timetable_conflict', sourceId: id, sourceLabel: text(row.title, 'Conflit emploi du temps'),
      severity: severityFrom(row.severity, 'high'), dueAt: optionalText(row.due_at), detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Publication de l’emploi du temps', peopleCount: numeric(row.people_count) || null, dependencies: ['Créneaux', 'Classe', 'Enseignant'] },
      linkedRecords: [linkedRecord({ id, type: 'timetable_conflict', label: text(row.title, 'Conflit'), secondary: text(row.conflict_type) || null, status, domain: 'academics' })],
      evidence: [evidence({ fingerprint, label: 'Créneaux en conflit', href: recordHref('academics', 'timetable_conflict', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Conflit détecté', detail: text(row.conflict_type) || null, createdAt: row.created_at, tone: 'warning' })],
      metadata: { status }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of gradeCorrections) {
    const status = text(row.status).toLowerCase()
    if (['applied', 'resolved', 'rejected', 'closed'].includes(status)) continue
    const id = text(row.id)
    const fingerprint = `academics:grade-correction:${id}`
    matters.push(buildMatter({
      fingerprint,
      title: text(row.title, 'Correction de note à décider'),
      summary: text(row.detail || row.reason, 'La correction doit préserver la note originale et recalculer les conséquences académiques.'),
      domain: 'academics', sourceType: 'grade_correction', sourceId: id, sourceLabel: text(row.title, 'Correction de note'),
      severity: severityFrom(row.severity, 'medium'), dueAt: optionalText(row.due_at), detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Exactitude académique et bulletin', peopleCount: 1, familyCount: 1, dependencies: ['Note', 'Moyenne', 'Bulletin'] },
      linkedRecords: [linkedRecord({ id, type: 'grade_correction', label: text(row.title, 'Correction de note'), secondary: text(row.reason) || null, status, domain: 'academics' })],
      evidence: [evidence({ fingerprint, label: 'Révision de note', href: recordHref('academics', 'grade_correction', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Correction académique demandée', detail: text(row.reason) || null, createdAt: row.created_at, tone: 'decision' })],
      metadata: { status }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of refundRequests) {
    const status = text(row.status).toLowerCase()
    if (['executed', 'reconciled', 'rejected', 'cancelled', 'closed'].includes(status)) continue
    const id = text(row.id)
    const amountMinor = numeric(row.requested_amount_minor) || minorFromUnknown(row.requested_amount)
    const fingerprint = `finance:refund:${id}`
    matters.push(buildMatter({
      fingerprint,
      title: `Remboursement à gouverner · ${formatMoneyMinor(amountMinor, currency)}`,
      summary: text(row.reason, 'Une demande de remboursement exige autorité, preuve et exécution réconciliée.'),
      domain: 'finance', sourceType: 'refund_request', sourceId: id, sourceLabel: text(row.refund_code, `Remboursement ${id.slice(0, 8)}`),
      severity: amountMinor >= 500000 ? 'critical' : amountMinor >= 100000 ? 'high' : 'medium', dueAt: optionalText(row.due_at), detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Remboursement et relation payeur', financialMinor: amountMinor, familyCount: 1, dependencies: ['Paiement source', 'Approbation', 'Rapprochement'] },
      linkedRecords: [linkedRecord({ id, type: 'refund_request', label: text(row.refund_code, 'Remboursement'), secondary: formatMoneyMinor(amountMinor, currency), status, domain: 'finance' })],
      evidence: [evidence({ fingerprint, label: 'Demande et paiement source', href: recordHref('finance', 'refund_request', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Remboursement demandé', detail: formatMoneyMinor(amountMinor, currency), createdAt: row.created_at, tone: 'decision' })],
      metadata: { status, amountMinor }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of commitments) {
    const status = text(row.status).toLowerCase()
    if (['fulfilled', 'completed', 'cancelled', 'closed'].includes(status)) continue
    const id = text(row.id)
    const dueAt = optionalText(row.due_at || row.commitment_due_at)
    const fingerprint = `finance:payment-commitment:${id}`
    const broken = ['broken', 'defaulted'].includes(status) || Boolean(dueAt && Date.parse(dueAt) < Date.now())
    matters.push(buildMatter({
      fingerprint,
      title: broken ? 'Engagement de paiement rompu' : 'Engagement de paiement à surveiller',
      summary: text(row.detail || row.notes, 'Une promesse de paiement possède une échéance et doit être suivie jusqu’à son accomplissement.'),
      domain: 'finance', sourceType: 'payment_commitment', sourceId: id, sourceLabel: text(row.commitment_code, `Engagement ${id.slice(0, 8)}`),
      severity: broken ? 'high' : 'medium', dueAt, detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Recouvrement et engagement famille', financialMinor: numeric(row.committed_amount_minor) || minorFromUnknown(row.committed_amount), familyCount: 1, dependencies: ['Compte payeur', 'Factures'] },
      linkedRecords: [linkedRecord({ id, type: 'payment_commitment', label: text(row.commitment_code, 'Engagement'), secondary: dueAt, status, domain: 'finance' })],
      evidence: [evidence({ fingerprint, label: 'Engagement documenté', href: recordHref('finance', 'payment_commitment', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: broken ? 'Engagement rompu' : 'Engagement actif', detail: dueAt, createdAt: row.updated_at || row.created_at, tone: broken ? 'critical' : 'active' })],
      metadata: { status }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of payrollExecutions) {
    const state = text(row.state || row.status).toLowerCase()
    if (!['failed', 'partially_failed', 'approval_required', 'blocked'].includes(state)) continue
    const id = text(row.id)
    const fingerprint = `payroll:execution:${id}`
    matters.push(buildMatter({
      fingerprint,
      title: text(row.title, state === 'approval_required' ? 'Paie en attente de décision' : 'Exécution paie bloquée'),
      summary: text(row.last_error || asRow(row.result_payload).message, 'Une exécution de paie exige une intervention avant finalisation ou paiement.'),
      domain: 'payroll', sourceType: 'payroll_execution', sourceId: id, sourceLabel: text(row.operation_key, 'Exécution paie'),
      severity: state === 'failed' ? 'critical' : 'high', dueAt: optionalText(row.due_at), detectedAt: row.created_at || row.requested_at, updatedAt: row.updated_at,
      impact: { operational: 'Production et paiement de la paie', financialMinor: numeric(asRow(row.result_payload).financial_impact_minor) || null, peopleCount: numeric(asRow(row.result_payload).people_count) || null, compliance: 'Contrôle paie', dependencies: ['Période', 'Calcul', 'Approbation'] },
      linkedRecords: [linkedRecord({ id, type: 'payroll_execution', label: text(row.operation_key, 'Exécution paie'), secondary: state, status: state, domain: 'payroll' })],
      evidence: [evidence({ fingerprint, label: 'Résultat d’exécution paie', kind: 'calculation', href: recordHref('payroll', 'payroll_execution', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Exécution paie sous contrôle', detail: text(row.last_error) || state, createdAt: row.updated_at || row.created_at, tone: 'critical' })],
      metadata: { state, operationKey: row.operation_key }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const row of payrollPeriods) {
    const status = text(row.status).toLowerCase()
    if (!['review', 'approval_requested', 'approved', 'payment_processing'].includes(status)) continue
    const id = text(row.id)
    const fingerprint = `payroll:period:${id}`
    const blockers = numeric(row.blocker_count || asRow(row.readiness_json).blockers)
    if (!blockers && status !== 'approval_requested') continue
    matters.push(buildMatter({
      fingerprint,
      title: blockers ? `Période paie · ${blockers} contrôle(s) bloquant(s)` : 'Période paie à approuver',
      summary: blockers ? 'La période ne peut pas être finalisée avant résolution des contrôles.' : 'La période a atteint son gate d’approbation.',
      domain: 'payroll', sourceType: 'payroll_period', sourceId: id, sourceLabel: text(row.label || row.period_code, `Période ${id.slice(0, 8)}`),
      severity: blockers ? 'high' : 'medium', dueAt: optionalText(row.approval_due_at || row.payment_date), detectedAt: row.created_at, updatedAt: row.updated_at,
      impact: { operational: 'Finalisation de la paie', financialMinor: numeric(row.net_total_minor) || null, peopleCount: numeric(row.employee_count) || null, dependencies: ['Readiness', 'Approbation', 'Paiement'] },
      linkedRecords: [linkedRecord({ id, type: 'payroll_period', label: text(row.label || row.period_code, 'Période paie'), secondary: `${blockers} blocage(s)`, status, domain: 'payroll' })],
      evidence: [evidence({ fingerprint, label: 'Readiness de période', kind: 'calculation', href: recordHref('payroll', 'payroll_period', id), createdAt: row.created_at })],
      timeline: [sourceEvent({ fingerprint, label: 'Gate de période atteint', detail: status, createdAt: row.updated_at || row.created_at, tone: blockers ? 'critical' : 'decision' })],
      metadata: { status, blockers }, projected: projectionFor(projection, fingerprint), canDecide,
    }))
  }

  for (const [fingerprint, row] of projection.entries()) {
    if (matters.some((item) => item.fingerprint === fingerprint)) continue
    const state = stateFrom(row.state)
    if (TERMINAL_STATES.has(state) || ['snoozed', 'waiting_evidence', 'decision_required', 'owned', 'in_progress', 'reopened', 'acknowledged', 'new'].includes(state)) {
      const domainCandidate = text(row.domain_key, 'governance') as DirectionDomainKey
      const domain = domainCandidate in DIRECTION_DOMAINS ? domainCandidate : 'governance'
      matters.push(buildMatter({
        fingerprint,
        title: text(row.title, 'Intervention de Direction'),
        summary: text(row.summary, 'Matter exécutif persisté.'),
        domain,
        sourceType: text(row.source_entity_type, 'direction_matter'),
        sourceId: text(row.source_entity_id, text(row.id)),
        sourceLabel: text(row.source_label, 'Matter Direction'),
        severity: severityFrom(row.severity), dueAt: optionalText(row.due_at), detectedAt: row.detected_at, updatedAt: row.updated_at,
        impact: {
          operational: optionalText(asRow(row.impact_json).operational),
          financialMinor: row.financial_impact_minor === null ? null : numeric(row.financial_impact_minor),
          peopleCount: row.people_count === null ? null : numeric(row.people_count),
          familyCount: row.family_count === null ? null : numeric(row.family_count),
          compliance: optionalText(asRow(row.impact_json).compliance),
          dependencies: arrayOfStrings(asRow(row.impact_json).dependencies),
        },
        linkedRecords: [], evidence: [], timeline: [], metadata: asRow(row.metadata_json), projected: row, canDecide,
      }))
    }
  }

  if (!invoices.length) warnings.push('Aucune donnée facture exploitable n’a été chargée pour la projection Direction.')
  if (!admissions.length) warnings.push('Aucune donnée admission exploitable n’a été chargée pour la projection Direction.')

  return { matters, warnings }
}

function mapDecision(row: Row): DirectionDecision {
  return {
    id: text(row.id),
    decisionCode: text(row.decision_code, `DEC-${text(row.id).slice(0, 8)}`),
    title: text(row.title, 'Décision Direction'),
    question: text(row.question, 'Décision à formaliser'),
    domain: (text(row.domain_key, 'governance') as DirectionDomainKey),
    state: (text(row.state, 'draft') as DirectionDecision['state']),
    severity: severityFrom(row.severity),
    matterId: optionalText(row.matter_id),
    ownerLabel: optionalText(row.owner_label),
    dueAt: optionalText(row.due_at),
    options: Array.isArray(row.options_json) ? (row.options_json as DirectionDecision['options']) : [],
    recommendedOptionKey: optionalText(row.recommended_option_key),
    selectedOptionKey: optionalText(row.selected_option_key),
    conditions: arrayOfStrings(row.conditions_json),
    impact: {
      operational: optionalText(asRow(row.impact_json).operational),
      financialMinor: row.financial_impact_minor === null || row.financial_impact_minor === undefined ? null : numeric(row.financial_impact_minor),
      peopleCount: row.people_count === null || row.people_count === undefined ? null : numeric(row.people_count),
      familyCount: row.family_count === null || row.family_count === undefined ? null : numeric(row.family_count),
      compliance: optionalText(asRow(row.impact_json).compliance),
      dependencies: arrayOfStrings(asRow(row.impact_json).dependencies),
    },
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

function mapCommitment(row: Row): DirectionCommitment {
  return {
    id: text(row.id),
    commitmentCode: text(row.commitment_code, `COM-${text(row.id).slice(0, 8)}`),
    title: text(row.title, 'Engagement Direction'),
    domain: (text(row.domain_key, 'governance') as DirectionDomainKey),
    state: (text(row.state, 'open') as DirectionCommitment['state']),
    ownerLabel: optionalText(row.owner_label),
    dueAt: optionalText(row.due_at),
    progressPercent: Math.max(0, Math.min(100, numeric(row.progress_percent))),
    blocker: optionalText(row.blocker),
    nextCheckpoint: optionalText(row.next_checkpoint),
    matterId: optionalText(row.matter_id),
    exactHref: optionalText(row.exact_href),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

function buildDomainPosture(matters: DirectionMatter[]): DirectionDomainPosture[] {
  return (Object.keys(DIRECTION_DOMAINS) as DirectionDomainKey[]).map((domain) => {
    const active = matters.filter((item) => item.domain === domain && !TERMINAL_STATES.has(item.state))
    const critical = active.filter((item) => item.severity === 'critical').length
    const decisionRequired = active.filter((item) => item.state === 'decision_required' || item.lane === 'decision').length
    const financialExposureMinor = active.reduce((sum, item) => sum + (item.impact.financialMinor || 0), 0)
    const peopleAffected = active.reduce((sum, item) => sum + (item.impact.peopleCount || 0), 0)
    const sortedDetected = active.map((item) => item.detectedAt).filter(Boolean).sort()
    const sortedDue = active.map((item) => item.dueAt).filter((value): value is string => Boolean(value)).sort()
    const posture: DirectionDomainPosture['posture'] = critical ? 'critical' : active.length ? 'attention' : 'stable'
    return {
      domain,
      label: DIRECTION_DOMAINS[domain].label,
      tone: critical ? 'critical' : active.length ? DIRECTION_DOMAINS[domain].tone : 'verified',
      posture,
      openMatters: active.length,
      criticalMatters: critical,
      decisionsRequired: decisionRequired,
      financialExposureMinor,
      peopleAffected,
      oldestUnresolvedAt: sortedDetected[0] || null,
      ownerLabel: active.find((item) => item.ownerLabel)?.ownerLabel || null,
      nextDeadline: sortedDue[0] || null,
    }
  })
}

function buildSitePostures(context: Awaited<ReturnType<typeof requireDirectionContext>>, matters: DirectionMatter[]): DirectionSitePosture[] {
  return [{
    id: context.school!.id,
    label: context.school!.name,
    status: context.school!.status,
    readinessPercent: context.academicYear ? 100 : 70,
    attendanceTone: matters.some((item) => item.domain === 'attendance' && item.severity === 'critical') ? 'critical' : matters.some((item) => item.domain === 'attendance') ? 'warning' : 'verified',
    admissionsTone: matters.some((item) => item.domain === 'admissions' && item.severity === 'critical') ? 'critical' : matters.some((item) => item.domain === 'admissions') ? 'decision' : 'verified',
    financeTone: matters.some((item) => item.domain === 'finance' && item.severity === 'critical') ? 'critical' : matters.some((item) => item.domain === 'finance') ? 'warning' : 'verified',
    workforceTone: matters.some((item) => ['people', 'payroll'].includes(item.domain) && item.severity === 'critical') ? 'critical' : matters.some((item) => ['people', 'payroll'].includes(item.domain)) ? 'decision' : 'verified',
    incidents: matters.filter((item) => ['quality', 'transport'].includes(item.domain) && !TERMINAL_STATES.has(item.state)).length,
    complianceTone: matters.some((item) => item.domain === 'compliance' && item.severity === 'critical') ? 'critical' : matters.some((item) => item.domain === 'compliance') ? 'warning' : 'verified',
    openMatters: matters.filter((item) => !TERMINAL_STATES.has(item.state)).length,
  }]
}

function buildPosture(matters: DirectionMatter[]) {
  const active = matters.filter((item) => !TERMINAL_STATES.has(item.state))
  const critical = active.filter((item) => item.severity === 'critical').length
  const high = active.filter((item) => item.severity === 'high').length
  const score = Math.max(0, Math.min(100, 100 - critical * 16 - high * 7 - Math.max(0, active.length - 5) * 2))
  if (critical) return { state: 'critical' as const, label: 'Intervention exécutive requise', score, rationale: `${critical} situation(s) critique(s) nécessitent une action de Direction.` }
  if (active.length) return { state: 'attention' as const, label: 'Sous contrôle actif', score, rationale: `${active.length} matter(s) sont suivis dans le commandement exécutif.` }
  return { state: 'stable' as const, label: 'Posture stable', score: 100, rationale: 'Aucune intervention exécutive active détectée.' }
}

export async function getDirectionCommandSnapshot(): Promise<DirectionCommandSnapshot> {
  const context = await requireDirectionContext()
  const db = await createClient()
  const schoolId = context.school!.id
  const canDecide = DECISION_ACCESS.has(context.access.accessLevel)
  const projection = await loadProjectionMap(db, schoolId)
  const { matters: rawMatters, warnings } = await synthesizeMatters(
    db,
    schoolId,
    projection,
    canDecide,
    context.schoolSettings?.default_currency || context.school!.currency || 'Dh',
  )
  const persistedMatterIds = rawMatters.filter((item) => projection.has(item.fingerprint)).map((item) => item.id)
  const eventMap = await loadDirectionEvents(db, schoolId, persistedMatterIds)
  const matters = rawMatters.map((matter) => ({
    ...matter,
    timeline: [...(eventMap.get(matter.id) || []), ...matter.timeline].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  })).sort((a, b) => {
    const weights: Record<DirectionSeverity, number> = { critical: 5, high: 4, medium: 3, low: 2, information: 1 }
    return weights[b.severity] - weights[a.severity] || Date.parse(a.dueAt || '9999-12-31') - Date.parse(b.dueAt || '9999-12-31')
  })

  const decisionRows = await safeRows(db, 'angelcare360_direction_decisions', schoolId, { limit: 100, order: 'updated_at' })
  const commitmentRows = await safeRows(db, 'angelcare360_direction_commitments', schoolId, { limit: 100, order: 'due_at', ascending: true })
  const auditRows = await safeRows(db, 'angelcare360_audit_logs', schoolId, { limit: 50, order: 'created_at' })
  const decisions = decisionRows.map(mapDecision)
  const commitments = commitmentRows.map(mapCommitment)
  const activity: DirectionTimelineEvent[] = auditRows.map((row) => ({
    id: text(row.id),
    eventType: text(row.action, 'audit'),
    label: text(row.action, 'Action enregistrée'),
    detail: [text(row.module), text(row.entity_type)].filter(Boolean).join(' · ') || null,
    actorLabel: optionalText(row.actor_role),
    createdAt: iso(row.created_at),
    tone: severityFrom(row.severity, 'information') === 'critical' ? 'critical' : 'neutral',
  }))
  const active = matters.filter((item) => !TERMINAL_STATES.has(item.state))
  const critical = active.filter((item) => item.severity === 'critical').length
  const decisionsRequired = active.filter((item) => item.state === 'decision_required' || item.lane === 'decision').length + decisions.filter((item) => ['submitted', 'evidence_required'].includes(item.state)).length
  const commitmentsDue = commitments.filter((item) => item.state !== 'completed' && item.dueAt && Date.parse(item.dueAt) <= Date.now() + 86400000).length
  const financialExposureMinor = active.reduce((sum, item) => sum + (item.impact.financialMinor || 0), 0)
  const peopleAffected = active.reduce((sum, item) => sum + (item.impact.peopleCount || 0), 0)
  const unacknowledged = active.filter((item) => item.state === 'new').length
  const currency = context.schoolSettings?.default_currency || context.school!.currency || 'Dh'

  return {
    generatedAt: new Date().toISOString(),
    school: {
      id: schoolId,
      name: context.school!.name,
      code: context.school!.school_code,
      status: context.school!.status,
      academicYearLabel: context.academicYear?.label || null,
      timezone: context.schoolSettings?.default_timezone || context.school!.timezone || 'Africa/Casablanca',
      currency,
    },
    viewer: {
      userId: context.user.id,
      displayName: context.user.full_name || context.user.name || context.user.email || 'Direction',
      roleLabel: context.access.roleLabel,
      accessLevel: context.access.accessLevel,
      canDecide,
      canIntervene: ['super_admin', 'direction', 'administration', 'qualite', 'comptabilite', 'rh'].includes(context.access.accessLevel),
      canViewSensitiveFinance: context.access.canSeeSensitiveFinance,
      canViewAudit: context.access.canSeeAuditData,
    },
    posture: buildPosture(matters),
    metrics: [
      { key: 'active', label: 'Matters actifs', value: String(active.length), detail: `${unacknowledged} non accusé(s)`, tone: critical ? 'critical' : active.length ? 'warning' : 'verified', filter: 'active' },
      { key: 'decisions', label: 'Décisions requises', value: String(decisionsRequired), detail: 'Conseil exécutif', tone: decisionsRequired ? 'decision' : 'verified', filter: 'decision' },
      { key: 'commitments', label: 'Engagements à échéance', value: String(commitmentsDue), detail: 'Dans les prochaines 24 h', tone: commitmentsDue ? 'warning' : 'verified', filter: 'commitment' },
      { key: 'financial', label: 'Exposition financière', value: formatMoneyMinor(financialExposureMinor, currency), detail: `${active.filter((item) => item.impact.financialMinor).length} matière(s) liée(s)`, tone: financialExposureMinor ? 'warning' : 'verified', filter: 'finance' },
      { key: 'people', label: 'Personnes affectées', value: String(peopleAffected), detail: 'Impact consolidé', tone: peopleAffected ? 'active' : 'neutral', filter: 'people' },
      { key: 'critical', label: 'Critiques', value: String(critical), detail: critical ? 'Intervention immédiate' : 'Aucun signal critique', tone: critical ? 'critical' : 'verified', filter: 'critical' },
    ],
    matters,
    decisions,
    commitments,
    domains: buildDomainPosture(matters),
    sites: buildSitePostures(context, matters),
    activity,
    warnings,
  }
}

async function ensurePersistedMatter(db: Db, schoolId: string, userId: string, request: DirectionMatterActionRequest) {
  const snapshot = request.matterSnapshot || {}
  const fingerprint = request.fingerprint || snapshot.fingerprint || null
  let existing: Row | null = null
  if (request.matterId) existing = await safeSingle(db, 'angelcare360_direction_matters', schoolId, request.matterId)
  if (!existing && fingerprint) {
    try {
      const { data } = await db.from('angelcare360_direction_matters').select('*').eq('school_id', schoolId).eq('fingerprint', fingerprint).maybeSingle()
      existing = data ? asRow(data) : null
    } catch { existing = null }
  }
  if (existing) return existing
  if (!fingerprint) throw new Error('Le fingerprint du matter est requis pour matérialiser cette intervention.')
  const domain = text(snapshot.domain, 'governance') as DirectionDomainKey
  if (!(domain in DIRECTION_DOMAINS)) throw new Error('Domaine Direction invalide.')
  const payload = {
    school_id: schoolId,
    fingerprint,
    title: text(snapshot.title, 'Intervention Direction'),
    summary: text(snapshot.summary, 'Matter matérialisé depuis une source opérationnelle.'),
    domain_key: domain,
    source_entity_type: text(snapshot.sourceType, 'unknown'),
    source_entity_id: text(snapshot.sourceId, request.matterId),
    source_label: text(snapshot.sourceLabel, snapshot.title ? String(snapshot.title) : 'Source opérationnelle'),
    exact_href: text(snapshot.exactHref, DIRECTION_DOMAINS[domain].exactBaseHref),
    state: 'new',
    severity: severityFrom(snapshot.severity),
    due_at: optionalText(snapshot.dueAt),
    detected_at: snapshot.detectedAt || new Date().toISOString(),
    impact_json: asRow(snapshot.impact),
    financial_impact_minor: numeric(asRow(snapshot.impact).financialMinor) || null,
    people_count: numeric(asRow(snapshot.impact).peopleCount) || null,
    family_count: numeric(asRow(snapshot.impact).familyCount) || null,
    metadata_json: asRow(snapshot.metadata),
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await db.from('angelcare360_direction_matters').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  return asRow(data)
}

function requireReason(action: DirectionMatterActionRequest['action'], reason: string | null) {
  if (['resolve', 'release', 'reopen', 'escalate', 'snooze'].includes(action) && !reason) {
    throw new Error('Une raison explicite est requise pour cette action.')
  }
}

async function eventForAction(db: Db, input: {
  schoolId: string
  matterId: string
  actorUserId: string
  actorLabel: string
  action: string
  label: string
  detail?: string | null
  before?: Row
  after?: Row
  tone?: DirectionTone
  idempotencyKey: string
}) {
  const { error } = await db.from('angelcare360_direction_matter_events').upsert({
    school_id: input.schoolId,
    matter_id: input.matterId,
    event_type: input.action,
    label: input.label,
    detail: input.detail || null,
    actor_user_id: input.actorUserId,
    actor_label: input.actorLabel,
    before_json: input.before || {},
    after_json: input.after || {},
    tone: input.tone || 'neutral',
    idempotency_key: input.idempotencyKey,
  }, { onConflict: 'school_id,idempotency_key' })
  if (error) throw new Error(error.message)
}

export async function executeDirectionMatterAction(request: DirectionMatterActionRequest): Promise<DirectionCommandResult> {
  const domain = (request.matterSnapshot?.domain || 'governance') as DirectionDomainKey
  const decisive = ['assign', 'escalate', 'resolve', 'release', 'reopen', 'approve', 'reject', 'conditional_approval'].includes(request.action)
  const context = await requireDirectionContext({ decide: decisive, domain })
  const db = await createClient()
  const schoolId = context.school!.id
  const reason = optionalText(request.reason || request.note)
  requireReason(request.action, reason)
  const idempotencyKey = idempotency(request.idempotencyKey, { schoolId, userId: context.user.id, request })
  const matter = await ensurePersistedMatter(db, schoolId, context.user.id, request)
  const matterId = text(matter.id)

  try {
    const { data: existingEvent } = await db
      .from('angelcare360_direction_matter_events')
      .select('id,after_json')
      .eq('school_id', schoolId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()
    if (existingEvent) {
      return { ok: true, message: 'Cette action a déjà été exécutée.', replayed: true, snapshot: await getDirectionCommandSnapshot() }
    }
  } catch { /* table is guaranteed after migration; continue to explicit write */ }

  const before = { ...matter }
  const patch: Row = { updated_by: context.user.id, updated_at: new Date().toISOString() }
  let label = 'Matter mis à jour'
  let tone: DirectionTone = 'active'

  if (request.action === 'acknowledge') {
    Object.assign(patch, { state: 'acknowledged', acknowledged_at: new Date().toISOString(), acknowledged_by: context.user.id })
    label = 'Matter accusé réception'
  } else if (request.action === 'take_ownership') {
    Object.assign(patch, { state: 'owned', owner_user_id: context.user.id, owner_label: context.user.full_name || context.user.name || context.access.roleLabel })
    label = 'Matter pris en charge'
  } else if (request.action === 'assign') {
    Object.assign(patch, { state: 'owned', owner_user_id: request.assigneeUserId || context.user.id, owner_label: request.assigneeLabel || context.user.full_name || context.user.name || context.access.roleLabel })
    label = 'Matter assigné'
  } else if (request.action === 'mark_checked') {
    Object.assign(patch, { checked_at: new Date().toISOString(), checked_by: context.user.id })
    label = 'Matter marqué vérifié'
    tone = 'verified'
  } else if (request.action === 'request_evidence') {
    Object.assign(patch, { state: 'waiting_evidence', evidence_requested_at: new Date().toISOString(), evidence_requested_by: context.user.id })
    label = 'Preuve demandée'
    tone = 'warning'
  } else if (request.action === 'snooze') {
    const snoozedUntil = request.snoozedUntil && Number.isFinite(Date.parse(request.snoozedUntil))
      ? new Date(request.snoozedUntil).toISOString()
      : new Date(Date.now() + 86400000).toISOString()
    Object.assign(patch, { state: 'snoozed', snoozed_until: snoozedUntil, snooze_reason: reason })
    label = 'Matter reporté'
    tone = 'warning'
  } else if (request.action === 'escalate') {
    Object.assign(patch, { state: 'decision_required', escalation_reason: reason, escalated_at: new Date().toISOString(), escalated_by: context.user.id })
    label = 'Matter escaladé au Conseil de décision'
    tone = 'decision'
  } else if (request.action === 'resolve') {
    Object.assign(patch, { state: 'resolved', resolved_at: new Date().toISOString(), resolved_by: context.user.id, resolution_reason: reason })
    label = 'Matter résolu'
    tone = 'verified'
  } else if (request.action === 'release') {
    Object.assign(patch, { state: 'released', released_at: new Date().toISOString(), released_by: context.user.id, resolution_reason: reason })
    label = 'Matter libéré de Direction'
    tone = 'verified'
  } else if (request.action === 'reopen') {
    Object.assign(patch, { state: 'reopened', reopened_at: new Date().toISOString(), reopened_by: context.user.id, reopen_reason: reason, resolved_at: null, released_at: null })
    label = 'Matter réouvert'
    tone = 'warning'
  } else if (request.action === 'add_note') {
    label = 'Note ajoutée au matter'
  } else {
    throw new Error(`Action non prise en charge: ${request.action}.`)
  }

  let after = before
  if (request.action !== 'add_note') {
    const { data, error } = await db.from('angelcare360_direction_matters').update(patch).eq('school_id', schoolId).eq('id', matterId).select('*').single()
    if (error) throw new Error(error.message)
    after = asRow(data)
  }

  await eventForAction(db, {
    schoolId,
    matterId,
    actorUserId: context.user.id,
    actorLabel: context.user.full_name || context.user.name || context.access.roleLabel,
    action: request.action,
    label,
    detail: reason,
    before,
    after,
    tone,
    idempotencyKey,
  })

  await recordAngelcare360AuditEventServer({
    category: 'direction_command',
    module: 'direction',
    action: `direction.matter.${request.action}`,
    schoolId,
    entityType: 'direction_matter',
    entityId: matterId,
    severity: request.action === 'resolve' || request.action === 'release' ? 'info' : request.action === 'escalate' ? 'warning' : 'info',
    beforeData: before,
    afterData: after,
    metadata: { idempotency_key: idempotencyKey, reason },
  })

  return { ok: true, message: label, snapshot: await getDirectionCommandSnapshot() }
}

export async function createDirectionDecision(request: DirectionDecisionCreateRequest): Promise<DirectionCommandResult> {
  const context = await requireDirectionContext({ decide: true, domain: request.domain })
  const db = await createClient()
  const schoolId = context.school!.id
  if (!request.title.trim() || !request.question.trim()) throw new Error('Le titre et la question de décision sont requis.')
  if (request.options.length < 2) throw new Error('Une décision doit proposer au moins deux options explicites.')
  const idempotencyKey = idempotency(request.idempotencyKey, { schoolId, request })
  try {
    const { data: existing } = await db.from('angelcare360_direction_decisions').select('*').eq('school_id', schoolId).eq('idempotency_key', idempotencyKey).maybeSingle()
    if (existing) return { ok: true, message: 'Cette décision existe déjà.', decision: mapDecision(asRow(existing)), replayed: true }
  } catch { /* continue */ }
  const impact = request.impact || {}
  const payload = {
    school_id: schoolId,
    decision_code: `DEC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 6).toUpperCase()}`,
    matter_id: request.matterId || null,
    title: request.title.trim(),
    question: request.question.trim(),
    domain_key: request.domain,
    state: request.state === 'draft' ? 'draft' : 'submitted',
    severity: request.severity,
    owner_user_id: context.user.id,
    owner_label: request.ownerLabel || context.user.full_name || context.user.name || context.access.roleLabel,
    due_at: request.dueAt || null,
    options_json: request.options,
    recommended_option_key: request.recommendedOptionKey || null,
    conditions_json: request.conditions || [],
    evidence_ids: request.evidenceIds || [],
    impact_json: impact,
    financial_impact_minor: impact.financialMinor ?? null,
    people_count: impact.peopleCount ?? null,
    family_count: impact.familyCount ?? null,
    idempotency_key: idempotencyKey,
    created_by: context.user.id,
    updated_by: context.user.id,
  }
  const { data, error } = await db.from('angelcare360_direction_decisions').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  if (request.matterId) {
    await db.from('angelcare360_direction_matters').update({ state: 'decision_required', updated_by: context.user.id, updated_at: new Date().toISOString() }).eq('school_id', schoolId).eq('id', request.matterId)
  }
  await recordAngelcare360AuditEventServer({
    category: 'direction_command', module: 'direction', action: 'direction.decision.create', schoolId,
    entityType: 'direction_decision', entityId: text(asRow(data).id), severity: request.severity === 'critical' ? 'critical' : 'info',
    afterData: asRow(data), metadata: { idempotency_key: idempotencyKey },
  })
  return { ok: true, message: request.state === 'draft' ? 'Brouillon de décision enregistré.' : 'Décision créée et soumise au Conseil.', decision: mapDecision(asRow(data)), snapshot: await getDirectionCommandSnapshot() }
}

export async function actOnDirectionDecision(request: DirectionDecisionActionRequest): Promise<DirectionCommandResult> {
  const context = await requireDirectionContext({ decide: true })
  const db = await createClient()
  const schoolId = context.school!.id
  const before = await safeSingle(db, 'angelcare360_direction_decisions', schoolId, request.decisionId)
  if (!before) throw new Error('Décision introuvable.')
  const key = idempotency(request.idempotencyKey, { schoolId, userId: context.user.id, request })
  const nextState: Record<DirectionDecisionActionRequest['action'], DirectionDecision['state']> = {
    submit: 'submitted',
    request_evidence: 'evidence_required',
    approve: 'approved',
    conditional_approval: 'conditionally_approved',
    reject: 'rejected',
    execute: 'executed',
    cancel: 'cancelled',
  }
  const reason = optionalText(request.reason)
  if (['approve', 'conditional_approval', 'reject', 'execute', 'cancel'].includes(request.action) && !reason) {
    throw new Error('Une justification est requise pour cette décision.')
  }
  const patch: Row = {
    state: nextState[request.action],
    selected_option_key: request.selectedOptionKey || before.selected_option_key || null,
    decision_reason: reason,
    conditions_json: request.conditions || before.conditions_json || [],
    decided_by: ['approve', 'conditional_approval', 'reject'].includes(request.action) ? context.user.id : before.decided_by,
    decided_at: ['approve', 'conditional_approval', 'reject'].includes(request.action) ? new Date().toISOString() : before.decided_at,
    executed_by: request.action === 'execute' ? context.user.id : before.executed_by,
    executed_at: request.action === 'execute' ? new Date().toISOString() : before.executed_at,
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
    metadata_json: { ...asRow(before.metadata_json), last_idempotency_key: key },
  }
  const { data, error } = await db.from('angelcare360_direction_decisions').update(patch).eq('school_id', schoolId).eq('id', request.decisionId).select('*').single()
  if (error) throw new Error(error.message)
  const matterId = optionalText(before.matter_id)
  if (matterId) {
    const matterPatch: Row = { updated_by: context.user.id, updated_at: new Date().toISOString() }
    if (request.action === 'approve' || request.action === 'conditional_approval') matterPatch.state = 'approved_execution'
    if (request.action === 'reject') matterPatch.state = 'rejected'
    if (request.action === 'execute') matterPatch.state = 'resolved'
    if (matterPatch.state) await db.from('angelcare360_direction_matters').update(matterPatch).eq('school_id', schoolId).eq('id', matterId)
  }
  await recordAngelcare360AuditEventServer({
    category: 'direction_command', module: 'direction', action: `direction.decision.${request.action}`, schoolId,
    entityType: 'direction_decision', entityId: request.decisionId, severity: request.action === 'reject' ? 'warning' : 'info',
    beforeData: before, afterData: asRow(data), metadata: { idempotency_key: key, reason },
  })
  return { ok: true, message: `Décision ${nextState[request.action]}.`, decision: mapDecision(asRow(data)), snapshot: await getDirectionCommandSnapshot() }
}


export async function createDirectionCommitment(request: DirectionCommitmentCreateRequest): Promise<DirectionCommandResult> {
  const context = await requireDirectionContext({ decide: true, domain: request.domain })
  const db = await createClient()
  const schoolId = context.school!.id
  if (!request.title.trim()) throw new Error("Le titre de l'engagement est requis.")
  const key = idempotency(request.idempotencyKey, { schoolId, request })
  try {
    const { data: existing } = await db.from('angelcare360_direction_commitments').select('*').eq('school_id', schoolId).eq('metadata_json->>idempotency_key', key).maybeSingle()
    if (existing) return { ok: true, message: 'Cet engagement existe déjà.', commitment: mapCommitment(asRow(existing)), replayed: true }
  } catch { /* continue */ }
  let exactHref = request.exactHref || null
  if (!exactHref && request.matterId) {
    const matter = await safeSingle(db, 'angelcare360_direction_matters', schoolId, request.matterId)
    exactHref = matter ? optionalText(matter.exact_href) : null
  }
  const payload = {
    school_id: schoolId,
    commitment_code: `COM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 6).toUpperCase()}`,
    matter_id: request.matterId || null,
    decision_id: request.decisionId || null,
    title: request.title.trim(),
    domain_key: request.domain,
    state: 'open',
    owner_user_id: context.user.id,
    owner_label: request.ownerLabel || context.user.full_name || context.user.name || context.access.roleLabel,
    due_at: request.dueAt || null,
    progress_percent: 0,
    next_checkpoint: request.nextCheckpoint || null,
    evidence_required_json: request.evidenceRequired || [],
    exact_href: exactHref || DIRECTION_DOMAINS[request.domain].exactBaseHref,
    metadata_json: { idempotency_key: key },
    created_by: context.user.id,
    updated_by: context.user.id,
  }
  const { data, error } = await db.from('angelcare360_direction_commitments').insert(payload).select('*').single()
  if (error) throw new Error(error.message)
  if (request.matterId) {
    await eventForAction(db, {
      schoolId,
      matterId: request.matterId,
      actorUserId: context.user.id,
      actorLabel: context.user.full_name || context.user.name || context.access.roleLabel,
      action: 'commitment_created',
      label: 'Engagement exécutif créé',
      detail: request.title.trim(),
      after: asRow(data),
      tone: 'active',
      idempotencyKey: `${key}:matter-event`,
    })
  }
  await recordAngelcare360AuditEventServer({
    category: 'direction_command', module: 'direction', action: 'direction.commitment.create', schoolId,
    entityType: 'direction_commitment', entityId: text(asRow(data).id), severity: 'info',
    afterData: asRow(data), metadata: { idempotency_key: key },
  })
  return { ok: true, message: 'Engagement créé et placé sous suivi exécutif.', commitment: mapCommitment(asRow(data)), snapshot: await getDirectionCommandSnapshot() }
}

export async function actOnDirectionCommitment(request: DirectionCommitmentActionRequest): Promise<DirectionCommandResult> {
  const context = await requireDirectionContext({ decide: ['complete', 'cancel', 'reopen'].includes(request.action) })
  const db = await createClient()
  const schoolId = context.school!.id
  const before = await safeSingle(db, 'angelcare360_direction_commitments', schoolId, request.commitmentId)
  if (!before) throw new Error('Engagement introuvable.')
  const key = idempotency(request.idempotencyKey, { schoolId, userId: context.user.id, request })
  if (asRow(before.metadata_json).last_idempotency_key === key) {
    return { ok: true, message: 'Action déjà exécutée.', commitment: mapCommitment(before), replayed: true }
  }
  const reason = optionalText(request.reason)
  if (['block', 'complete', 'cancel', 'reopen'].includes(request.action) && !reason) throw new Error('Une justification est requise.')
  const stateMap: Record<DirectionCommitmentActionRequest['action'], DirectionCommitment['state']> = {
    acknowledge: 'acknowledged', start: 'in_progress', update: text(before.state, 'open') as DirectionCommitment['state'], block: 'blocked', complete: 'completed', reopen: 'in_progress', cancel: 'cancelled',
  }
  const progress = request.action === 'complete' ? 100 : request.progressPercent == null ? numeric(before.progress_percent) : Math.max(0, Math.min(100, numeric(request.progressPercent)))
  const patch: Row = {
    state: stateMap[request.action],
    progress_percent: progress,
    blocker: request.action === 'block' ? reason : request.action === 'reopen' || request.action === 'complete' ? null : request.blocker ?? before.blocker,
    next_checkpoint: request.nextCheckpoint ?? before.next_checkpoint,
    due_at: request.dueAt ?? before.due_at,
    completion_reason: request.action === 'complete' || request.action === 'cancel' ? reason : before.completion_reason,
    completed_by: request.action === 'complete' ? context.user.id : request.action === 'reopen' ? null : before.completed_by,
    completed_at: request.action === 'complete' ? new Date().toISOString() : request.action === 'reopen' ? null : before.completed_at,
    metadata_json: { ...asRow(before.metadata_json), last_idempotency_key: key, last_reason: reason },
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await db.from('angelcare360_direction_commitments').update(patch).eq('school_id', schoolId).eq('id', request.commitmentId).select('*').single()
  if (error) throw new Error(error.message)
  const matterId = optionalText(before.matter_id)
  if (matterId) {
    await eventForAction(db, {
      schoolId, matterId, actorUserId: context.user.id,
      actorLabel: context.user.full_name || context.user.name || context.access.roleLabel,
      action: `commitment_${request.action}`,
      label: `Engagement ${request.action}`,
      detail: reason || request.nextCheckpoint || null,
      before, after: asRow(data), tone: request.action === 'complete' ? 'verified' : request.action === 'block' ? 'critical' : 'active',
      idempotencyKey: `${key}:matter-event`,
    })
  }
  await recordAngelcare360AuditEventServer({
    category: 'direction_command', module: 'direction', action: `direction.commitment.${request.action}`, schoolId,
    entityType: 'direction_commitment', entityId: request.commitmentId,
    severity: request.action === 'block' ? 'warning' : 'info', beforeData: before, afterData: asRow(data),
    metadata: { idempotency_key: key, reason },
  })
  return { ok: true, message: request.action === 'complete' ? 'Engagement terminé et retiré des actifs.' : 'Engagement mis à jour.', commitment: mapCommitment(asRow(data)), snapshot: await getDirectionCommandSnapshot() }
}

export async function generateDirectionBriefing(input: {
  briefingType: DirectionBriefing['briefingType']
  siteId?: string | null
  idempotencyKey?: string | null
}): Promise<DirectionCommandResult> {
  const context = await requireDirectionContext()
  const db = await createClient()
  const snapshot = await getDirectionCommandSnapshot()
  const schoolId = context.school!.id
  const key = idempotency(input.idempotencyKey, { schoolId, input, generatedDate: new Date().toISOString().slice(0, 13) })
  try {
    const { data: existing } = await db.from('angelcare360_direction_briefing_runs').select('*').eq('school_id', schoolId).eq('idempotency_key', key).maybeSingle()
    if (existing) {
      const payload = asRow(asRow(existing).briefing_json)
      return { ok: true, message: 'Briefing existant réutilisé.', briefing: payload as unknown as DirectionBriefing, replayed: true }
    }
  } catch { /* continue */ }
  const active = snapshot.matters.filter((matter) => !TERMINAL_STATES.has(matter.state))
  const topMatters = active.slice(0, 8)
  const decisionsRequired = snapshot.decisions.filter((decision) => ['submitted', 'evidence_required'].includes(decision.state)).slice(0, 8)
  const commitmentsDue = snapshot.commitments.filter((commitment) => commitment.state !== 'completed' && commitment.dueAt).slice(0, 8)
  const completedActions = snapshot.activity.filter((event) => /resolve|complete|approve|close|publish/i.test(event.eventType)).slice(0, 8)
  const titles: Record<DirectionBriefing['briefingType'], string> = {
    morning: 'Brief exécutif du matin',
    end_of_day: 'Clôture exécutive de journée',
    weekly: 'Brief exécutif hebdomadaire',
    site: 'Revue exécutive établissement',
    financial_risk: 'Brief risques financiers',
    people_workforce: 'Brief personnes & workforce',
  }
  const briefing: DirectionBriefing = {
    id: randomUUID(),
    briefingType: input.briefingType,
    title: titles[input.briefingType],
    generatedAt: new Date().toISOString(),
    posture: snapshot.posture.label,
    topMatters,
    decisionsRequired,
    commitmentsDue,
    completedActions,
    executiveSummary: [
      `${active.length} matter(s) exécutif(s) actif(s), dont ${active.filter((matter) => matter.severity === 'critical').length} critique(s).`,
      `${decisionsRequired.length} décision(s) attendent une autorité explicite.`,
      `${commitmentsDue.length} engagement(s) possèdent une échéance active.`,
      `Posture consolidée: ${snapshot.posture.label} (${snapshot.posture.score}/100).`,
    ],
  }
  const { error } = await db.from('angelcare360_direction_briefing_runs').insert({
    school_id: schoolId,
    briefing_type: input.briefingType,
    site_id: input.siteId || null,
    title: briefing.title,
    posture: briefing.posture,
    briefing_json: briefing,
    source_signature: createHash('sha256').update(JSON.stringify({ generatedAt: snapshot.generatedAt, matters: snapshot.matters.map((matter) => [matter.id, matter.state, matter.updatedAt]) })).digest('hex'),
    idempotency_key: key,
    status: 'generated',
    requested_by: context.user.id,
    generated_at: briefing.generatedAt,
  })
  if (error) throw new Error(error.message)
  await recordAngelcare360AuditEventServer({
    category: 'direction_command', module: 'direction', action: 'direction.briefing.generate', schoolId,
    entityType: 'direction_briefing', entityId: briefing.id, severity: 'info', afterData: briefing as unknown as Row,
    metadata: { briefing_type: input.briefingType, idempotency_key: key },
  })
  return { ok: true, message: 'Briefing exécutif généré depuis les sources autoritatives.', briefing }
}

export async function getDirectionMatterDetail(matterId: string): Promise<DirectionMatter | null> {
  const snapshot = await getDirectionCommandSnapshot()
  return snapshot.matters.find((matter) => matter.id === matterId || matter.fingerprint === matterId) || null
}
