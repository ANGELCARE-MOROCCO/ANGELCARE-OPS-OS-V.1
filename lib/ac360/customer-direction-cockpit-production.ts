import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { getAc360CurrentContext } from './runtime'
import { runAc360WiredAction } from './action-wiring'

type JsonRecord = Record<string, unknown>

type DirectionCommandOperation =
  | 'direction_action.create'
  | 'direction_action.status'
  | 'decision.request'
  | 'decision.decide'
  | 'risk.create'
  | 'risk.status'
  | 'report.queue'
  | 'export.queue'
  | 'control.launch'
  | 'escalation.open'

type DirectionCommandInput = {
  orgId?: string
  campusId?: string | null
  operation?: DirectionCommandOperation | string
  sourceView?: string
  title?: string
  moduleKey?: string
  priority?: string
  status?: string
  ownerLabel?: string
  requesterLabel?: string
  amountMad?: number | string | null
  dueAt?: string | null
  decisionId?: string
  riskId?: string
  actionId?: string
  reportId?: string
  exportId?: string
  decision?: string
  note?: string
  format?: string
  payload?: JsonRecord
  metadata?: JsonRecord
}

const TABLES = {
  actions: 'ac360_direction_actions',
  decisions: 'ac360_direction_decisions',
  risks: 'ac360_direction_risks',
  reports: 'ac360_direction_reports',
  exports: 'ac360_direction_exports',
  audit: 'ac360_direction_audit_events',
} as const

const fallbackNow = () => new Date().toISOString()
const proofRef = (prefix = 'AC360-DIR') => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
const codeRef = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

function asText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function cleanJson(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return JSON.parse(JSON.stringify(value)) as JsonRecord
}

function normalizeDbError(error: any) {
  const message = error?.message || String(error || 'Erreur inconnue')
  const code = error?.code || ''
  const missingTable = code === '42P01' || message.includes('does not exist')
  return { message, code, missingTable }
}

async function resolveContext(orgId?: string) {
  const context = await getAc360CurrentContext(orgId)
  const resolvedOrgId = context.context?.org?.id || orgId || null
  if (!context.ok || !resolvedOrgId) {
    return {
      ok: false as const,
      status: 409,
      error: 'Compte à finaliser : nous devons terminer la liaison de votre établissement avant d’enregistrer cette action. La consultation du cockpit reste disponible.',
      clientReason: 'account_setup_required',
      context,
      orgId: null,
      ac360: {
        blocked: true,
        recovery: ['Vérifier le compte', 'Contacter AngelCare Success', 'Réessayer après activation'],
      },
    }
  }
  return { ok: true as const, context, orgId: resolvedOrgId }
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function selectRows(db: any, table: string, orgId: string, limit = 30) {
  const { data, error } = await db.from(table).select('*').eq('org_id', orgId).order('created_at', { ascending: false }).limit(limit)
  if (error) {
    const normalized = normalizeDbError(error)
    if (normalized.missingTable) return { rows: [], error: normalized, databaseReady: false }
    return { rows: [], error: normalized, databaseReady: true }
  }
  return { rows: data || [], error: null, databaseReady: true }
}

function fallbackRecords() {
  return {
    actions: [
      { id: 'fallback-action-finance', title: 'Lancer relance douce sur familles à risque', module_key: 'finance', priority: 'high', status: 'planned', source_view: 'finance', proof_reference: 'MODE-DEMO-PREUVE' },
      { id: 'fallback-action-admissions', title: 'Planifier relance leads chauds sans suivi', module_key: 'admissions', priority: 'medium', status: 'open', source_view: 'admissions', proof_reference: 'MODE-DEMO-PREUVE' },
    ],
    decisions: [
      { id: 'fallback-decision-budget', title: 'Révision budget marketing 2025', module_key: 'finance', priority: 'high', status: 'pending', amount_mad: 320000, proof_reference: 'MODE-DEMO-PREUVE' },
      { id: 'fallback-decision-staffing', title: 'Renfort éducateur Rabat Agdal', module_key: 'hr', priority: 'medium', status: 'waiting_proof', proof_reference: 'MODE-DEMO-PREUVE' },
    ],
    risks: [
      { id: 'fallback-risk-impayes', title: 'Créances > 90 jours en hausse', module_key: 'finance', severity: 'critical', impact_score: 82, status: 'open', proof_reference: 'MODE-DEMO-PREUVE' },
      { id: 'fallback-risk-parenttrust', title: 'Réclamations facturation en hausse', module_key: 'parenttrust', severity: 'high', impact_score: 68, status: 'watch', proof_reference: 'MODE-DEMO-PREUVE' },
    ],
    reports: [
      { id: 'fallback-report-board', title: 'Pack exécutif mensuel', report_type: 'executive_board_pack', format: 'pdf', status: 'queued', proof_reference: 'MODE-DEMO-PREUVE' },
    ],
    exports: [
      { id: 'fallback-export-finance', title: 'Export finance direction', export_type: 'finance_snapshot', format: 'xlsx', status: 'queued', proof_reference: 'MODE-DEMO-PREUVE' },
    ],
    auditEvents: [
      { id: 'fallback-audit', event_type: 'demo_runtime', source_view: 'cockpit_direction', proof_reference: 'MODE-DEMO-PREUVE', created_at: fallbackNow() },
    ],
  }
}

function deriveSellableReadiness(records: ReturnType<typeof fallbackRecords>, databaseReady: boolean, context: any) {
  const restrictions = context?.context?.restrictions || []
  const wallet = context?.context?.wallet || null
  const subscription = context?.context?.subscription || null
  const criticalRisks = records.risks.filter((risk: any) => ['critical', 'high'].includes(String(risk.severity || '').toLowerCase())).length
  const pendingDecisions = records.decisions.filter((decision: any) => ['pending', 'waiting_proof'].includes(String(decision.status || '').toLowerCase())).length
  const openActions = records.actions.filter((action: any) => !['completed', 'archived', 'cancelled'].includes(String(action.status || '').toLowerCase())).length
  const readyReports = records.reports.filter((report: any) => ['queued', 'processing', 'ready'].includes(String(report.status || '').toLowerCase())).length
  const score = Math.max(35, Math.min(96, 84 - criticalRisks * 5 - restrictions.length * 7 + readyReports * 2 + (databaseReady ? 8 : -12)))
  return {
    score,
    databaseReady,
    runtimeMode: databaseReady ? 'production_wired' : 'fallback_until_sql_applied',
    commercialStatus: databaseReady ? 'vendable avec données persistées' : 'démo visuelle — migration SQL requise',
    pendingDecisions,
    openActions,
    criticalRisks,
    reportsInPipeline: readyReports,
    activeRestrictions: restrictions.length,
    walletBalance: wallet?.balance ?? wallet?.available_balance ?? null,
    planLabel: subscription?.plan?.label || subscription?.plan_key || 'Plan actif',
  }
}

async function loadOperationsSourceSummary(db: any, orgId: string) {
  const operationalDate = new Date().toISOString().slice(0, 10)
  const { data, error } = await db.rpc('ac360_ops_runtime_summary', { p_org_id: orgId, p_operational_date: operationalDate } as any)
  if (error) {
    const normalized = normalizeDbError(error)
    return {
      ready: false,
      operationalDate,
      summary: null,
      error: normalized,
      clientStatus: normalized.missingTable ? 'Espace opérations à finaliser' : 'Synchronisation opérations indisponible',
    }
  }
  return {
    ready: true,
    operationalDate,
    summary: data || {},
    error: null,
    clientStatus: 'Données opérations synchronisées',
  }
}

export async function getAc360DirectionCockpitProductionDashboard(input: { orgId?: string; view?: string } = {}) {
  const resolved = await resolveContext(input.orgId)
  if (!resolved.ok) return resolved

  const db = await createClient()
  const orgId = resolved.orgId
  const [actionsRes, decisionsRes, risksRes, reportsRes, exportsRes, auditRes] = await Promise.all([
    selectRows(db, TABLES.actions, orgId, 50),
    selectRows(db, TABLES.decisions, orgId, 50),
    selectRows(db, TABLES.risks, orgId, 50),
    selectRows(db, TABLES.reports, orgId, 30),
    selectRows(db, TABLES.exports, orgId, 30),
    selectRows(db, TABLES.audit, orgId, 50),
  ])

  const operationsSource = await loadOperationsSourceSummary(db, orgId)
  const databaseReady = [actionsRes, decisionsRes, risksRes, reportsRes, exportsRes, auditRes].every((res) => res.databaseReady)
  const fallback = fallbackRecords()
  const records = {
    actions: actionsRes.rows.length ? actionsRes.rows : fallback.actions,
    decisions: decisionsRes.rows.length ? decisionsRes.rows : fallback.decisions,
    risks: risksRes.rows.length ? risksRes.rows : fallback.risks,
    reports: reportsRes.rows.length ? reportsRes.rows : fallback.reports,
    exports: exportsRes.rows.length ? exportsRes.rows : fallback.exports,
    auditEvents: auditRes.rows.length ? auditRes.rows : fallback.auditEvents,
  }

  return {
    ok: true as const,
    context: resolved.context.context,
    view: input.view || 'synthese',
    loadedAt: fallbackNow(),
    databaseReady,
    errors: [actionsRes, decisionsRes, risksRes, reportsRes, exportsRes, auditRes].map((res) => res.error).filter(Boolean),
    operationsSource,
    sourceSync: {
      operations: operationsSource.ready,
      operationsStatus: operationsSource.clientStatus,
      operationsDate: operationsSource.operationalDate,
    },
    sellableReadiness: deriveSellableReadiness(records, databaseReady, resolved.context),
    records,
  }
}

async function auditEvent(db: any, input: { orgId: string; campusId?: string | null; eventType: string; sourceView?: string; entityType?: string; entityId?: string | null; actorId?: string | null; proofReference: string; eventJson?: JsonRecord }) {
  const { error } = await db.from(TABLES.audit).insert({
    org_id: input.orgId,
    campus_id: input.campusId || null,
    event_code: codeRef('DIR-AUDIT'),
    event_type: input.eventType,
    source_view: input.sourceView || 'cockpit_direction',
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    actor_app_user_id: input.actorId || null,
    proof_reference: input.proofReference,
    event_json: input.eventJson || {},
  })
  if (error) return normalizeDbError(error)
  return null
}

function operationFromInput(input: DirectionCommandInput): DirectionCommandOperation {
  const raw = String(input.operation || input.payload?.action || '').trim()
  if (raw === 'create_direction_action') return 'direction_action.create'
  if (raw === 'direction_check') return 'control.launch'
  if (raw === 'risk_create') return 'risk.create'
  if (raw === 'decision_request') return 'decision.request'
  if (raw === 'decision_decide') return 'decision.decide'
  if (raw === 'report_queue' || raw === 'open_report') return 'report.queue'
  if (raw === 'export_queue') return 'export.queue'
  return (raw || 'direction_action.create') as DirectionCommandOperation
}

async function insertWithAudit(db: any, table: string, row: JsonRecord, audit: Parameters<typeof auditEvent>[1]) {
  const { data, error } = await db.from(table).insert(row).select('*').single()
  if (error) return { ok: false as const, status: 500, error: normalizeDbError(error).message, dbCode: error.code, requiresMigration: normalizeDbError(error).missingTable }
  const auditError = await auditEvent(db, { ...audit, entityId: (data as any)?.id || null })
  return {
    ok: true as const,
    status: 200,
    data,
    proofReference: audit.proofReference,
    auditWarning: auditError?.message || null,
  }
}

export async function executeAc360DirectionCockpitCommand(input: DirectionCommandInput = {}) {
  const resolved = await resolveContext(input.orgId)
  if (!resolved.ok) return resolved

  const db = await createClient()
  const actorId = await currentActorId()
  const orgId = resolved.orgId
  const campusId = input.campusId || resolved.context.context?.membership?.campus_id || null
  const operation = operationFromInput(input)
  const proofReference = proofRef()
  const sourceView = asText(input.sourceView, 'cockpit_direction')
  const title = asText(input.title, 'Action directionnelle AC360')
  const moduleKey = asText(input.moduleKey, sourceView || 'cockpit_direction')
  const payload = cleanJson({ ...(input.payload || {}), ...(input.metadata || {}), operation, title, moduleKey, sourceView })
  const quantity = operation === 'export.queue' || operation === 'report.queue' ? 2 : 1

  const guarded = await runAc360WiredAction('ac360.policy.preflight' as any, async () => {
    if (operation === 'decision.decide') {
      const targetId = input.decisionId || (input.payload?.decisionId as string | undefined)
      if (!targetId) return { ok: false, status: 422, error: 'decisionId requis pour décider une validation.' }
      const status = String(input.decision || input.status || 'approved') === 'rejected' ? 'rejected' : 'approved'
      const { data, error } = await db.from(TABLES.decisions).update({
        status,
        decision_note: input.note || null,
        decided_by: actorId,
        decided_at: fallbackNow(),
        updated_by: actorId,
        result_json: { proofReference, status, note: input.note || null },
        proof_reference: proofReference,
      }).eq('id', targetId).eq('org_id', orgId).select('*').single()
      if (error) return { ok: false, status: 500, error: normalizeDbError(error).message, requiresMigration: normalizeDbError(error).missingTable }
      await auditEvent(db, { orgId, campusId, eventType: 'decision.decide', sourceView, entityType: 'decision', entityId: data?.id, actorId, proofReference, eventJson: { status, note: input.note || null } })
      return { ok: true, data, proofReference }
    }

    if (operation === 'risk.status') {
      const targetId = input.riskId || (input.payload?.riskId as string | undefined)
      if (!targetId) return { ok: false, status: 422, error: 'riskId requis pour mettre à jour un risque.' }
      const status = String(input.status || 'mitigating')
      const { data, error } = await db.from(TABLES.risks).update({ status, updated_by: actorId, result_json: { proofReference, status }, proof_reference: proofReference }).eq('id', targetId).eq('org_id', orgId).select('*').single()
      if (error) return { ok: false, status: 500, error: normalizeDbError(error).message, requiresMigration: normalizeDbError(error).missingTable }
      await auditEvent(db, { orgId, campusId, eventType: 'risk.status', sourceView, entityType: 'risk', entityId: data?.id, actorId, proofReference, eventJson: { status } })
      return { ok: true, data, proofReference }
    }

    if (operation === 'decision.request') {
      return insertWithAudit(db, TABLES.decisions, {
        org_id: orgId,
        campus_id: campusId,
        decision_code: codeRef('DIR-DEC'),
        title,
        decision_type: asText(input.payload?.decisionType, 'direction'),
        module_key: moduleKey,
        priority: asText(input.priority || input.payload?.priority, 'normal'),
        status: 'pending',
        amount_mad: asNumber(input.amountMad || input.payload?.amountMad),
        requester_label: asText(input.requesterLabel || input.payload?.requesterLabel, 'Direction'),
        owner_label: asText(input.ownerLabel || input.payload?.ownerLabel, 'Direction'),
        due_at: input.dueAt || null,
        payload_json: payload,
        result_json: { proofReference, runtime: 'created' },
        proof_reference: proofReference,
        created_by: actorId,
        updated_by: actorId,
      }, { orgId, campusId, eventType: 'decision.request', sourceView, entityType: 'decision', actorId, proofReference, eventJson: payload })
    }

    if (operation === 'risk.create' || operation === 'control.launch' || operation === 'escalation.open') {
      return insertWithAudit(db, TABLES.risks, {
        org_id: orgId,
        campus_id: campusId,
        risk_code: codeRef(operation === 'control.launch' ? 'DIR-CTRL' : 'DIR-RISK'),
        title,
        risk_type: operation === 'control.launch' ? 'control' : asText(input.payload?.riskType, 'operational'),
        module_key: moduleKey,
        severity: asText(input.priority || input.payload?.severity, operation === 'control.launch' ? 'medium' : 'high'),
        probability: asText(input.payload?.probability, 'medium'),
        impact_score: Number(input.payload?.impactScore || 65),
        status: operation === 'control.launch' ? 'mitigating' : 'open',
        owner_label: asText(input.ownerLabel || input.payload?.ownerLabel, 'Direction'),
        due_at: input.dueAt || null,
        mitigation_json: { recommendedAction: input.payload?.recommendedAction || 'Suivi directionnel requis' },
        payload_json: payload,
        result_json: { proofReference, runtime: 'created' },
        proof_reference: proofReference,
        created_by: actorId,
        updated_by: actorId,
      }, { orgId, campusId, eventType: operation, sourceView, entityType: 'risk', actorId, proofReference, eventJson: payload })
    }

    if (operation === 'report.queue') {
      return insertWithAudit(db, TABLES.reports, {
        org_id: orgId,
        campus_id: campusId,
        report_code: codeRef('DIR-REP'),
        title: title || 'Rapport directionnel',
        report_type: asText(input.payload?.reportType || input.payload?.report, 'executive_board_pack'),
        period_label: asText(input.payload?.periodLabel, 'Période active'),
        format: asText(input.format || input.payload?.format, 'pdf').toLowerCase(),
        status: 'queued',
        payload_json: payload,
        result_json: { proofReference, runtime: 'queued' },
        proof_reference: proofReference,
        created_by: actorId,
        updated_by: actorId,
      }, { orgId, campusId, eventType: 'report.queue', sourceView, entityType: 'report', actorId, proofReference, eventJson: payload })
    }

    if (operation === 'export.queue') {
      return insertWithAudit(db, TABLES.exports, {
        org_id: orgId,
        campus_id: campusId,
        export_code: codeRef('DIR-EXP'),
        title: title || 'Export directionnel',
        export_type: asText(input.payload?.exportType, 'executive_export'),
        format: asText(input.format || input.payload?.format, 'xlsx').toLowerCase(),
        status: 'queued',
        payload_json: payload,
        result_json: { proofReference, runtime: 'queued' },
        proof_reference: proofReference,
        created_by: actorId,
        updated_by: actorId,
      }, { orgId, campusId, eventType: 'export.queue', sourceView, entityType: 'export', actorId, proofReference, eventJson: payload })
    }

    return insertWithAudit(db, TABLES.actions, {
      org_id: orgId,
      campus_id: campusId,
      action_code: codeRef('DIR-ACT'),
      title,
      module_key: moduleKey,
      source_view: sourceView,
      priority: asText(input.priority || input.payload?.priority, 'normal'),
      status: asText(input.status || input.payload?.status, 'open'),
      owner_label: asText(input.ownerLabel || input.payload?.ownerLabel, 'Direction'),
      due_at: input.dueAt || null,
      impact_json: { businessImpact: input.payload?.impact || input.payload?.businessImpact || 'Action directionnelle gouvernée' },
      payload_json: payload,
      result_json: { proofReference, runtime: 'created' },
      proof_reference: proofReference,
      created_by: actorId,
      updated_by: actorId,
    }, { orgId, campusId, eventType: 'direction_action.create', sourceView, entityType: 'action', actorId, proofReference, eventJson: payload })
  }, {
    orgId,
    quantity,
    idempotencyKey: `${operation}:${proofReference}`,
    metadata: {
      source: 'ac360.phase3o_r3.direction_cockpit.production',
      operation,
      sourceView,
      moduleKey,
      proofReference,
    },
  })

  if (!guarded.ok) {
    return {
      ok: false as const,
      status: 402,
      error: guarded.error || guarded.guard?.reason || 'Action non finalisée : certains droits, crédits ou paramètres du compte doivent être vérifiés avant enregistrement.',
      clientReason: 'account_or_entitlement_check_required',
      ac360: { blocked: true, guard: guarded.guard, recovery: ['Vérifier le compte', 'Vérifier le plan actif', 'Contacter AngelCare Success'] },
    }
  }

  return {
    ok: true as const,
    status: 200,
    operation,
    proofReference: (guarded.data as any)?.proofReference || proofReference,
    result: guarded.data,
    ac360: { guard: guarded.guard, usage: guarded.usage, blocked: false },
  }
}
