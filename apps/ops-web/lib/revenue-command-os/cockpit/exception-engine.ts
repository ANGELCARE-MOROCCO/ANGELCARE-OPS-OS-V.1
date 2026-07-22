import { cockpitStableId } from './crypto'
import { freshness } from './freshness'
import { isoDate, numberValue, rowPayload, text } from './normalizers'
import type { CockpitPriority, CockpitSeverity, CouncilSummary, ExecutionProgressSummary, ObjectiveCommandSummary, RevenueException, RevenueProgramSummary } from './types'
import type { RawCockpitSources } from './repository'

interface ExceptionContext {
  objective: ObjectiveCommandSummary | null
  council: CouncilSummary | null
  programs: RevenueProgramSummary[]
  execution: ExecutionProgressSummary
  sources: RawCockpitSources
}

export function buildRevenueExceptions(context: ExceptionContext): RevenueException[] {
  const generated: RevenueException[] = []
  const now = new Date().toISOString()

  if (context.objective) {
    const gap = Math.max(0, context.objective.revenueTarget - context.objective.forecastRevenue)
    if (context.objective.revenueTarget > 0 && context.objective.forecastPercent < 75) {
      generated.push(exceptionRecord({
        key: `objective-gap:${context.objective.id}`,
        type: 'revenue_target_at_risk',
        title: 'Objectif revenu sous trajectoire',
        summary: `La prévision couvre ${context.objective.forecastPercent}% de l’objectif approuvé.`,
        priority: context.objective.forecastPercent < 50 ? 'P0' : 'P1',
        severity: context.objective.forecastPercent < 50 ? 'critical' : 'high',
        businessImpact: `Écart prévisionnel de ${Math.round(gap).toLocaleString('fr-FR')} Dh.`,
        revenueAtRisk: gap,
        rootCause: context.objective.currentBlockers[0] || 'La trajectoire pipeline et conversion est insuffisante au regard de l’objectif.',
        entityType: 'objective',
        entityId: context.objective.id,
        entityLabel: context.objective.title,
        evidence: [`Progression réelle: ${context.objective.progressPercent}%`, `Prévision: ${context.objective.forecastPercent}%`, `Confiance: ${context.objective.confidence}%`],
        recommendedAction: 'Ouvrir l’objectif, examiner les campagnes contributrices et lancer une intervention de recalibrage.',
        allowedActions: ['open_objective','request_reanalysis','launch_rescue','assign_executive_owner'],
        sourceZone: 'objective-command',
        sourceRecordId: context.objective.id,
        createdAt: now,
        observedAt: context.objective.freshness.observedAt,
      }))
    }
  }

  for (const signal of context.sources.signals) {
    const severity = text(signal.severity, 'medium') as CockpitSeverity
    const status = text(signal.status, 'new')
    if (!['critical','high'].includes(severity) || ['resolved','dismissed'].includes(status)) continue
    const signalType = text(signal.signal_type, text(signal.category, 'signal'))
    const payload = rowPayload(signal)
    generated.push(exceptionRecord({
      key: `signal:${signal.id || signal.code}`,
      type: signalType,
      title: text(signal.title, 'Signal critique non traité'),
      summary: text(signal.summary, 'Un signal revenu à forte priorité nécessite une intervention.'),
      priority: severity === 'critical' ? 'P0' : 'P1',
      severity,
      businessImpact: text(payload.businessImpact, 'Impact commercial ou opérationnel à confirmer immédiatement.'),
      revenueAtRisk: numberValue(payload.revenueAtRisk || payload.revenue_at_risk),
      rootCause: text(payload.rootCause, `Signal ${signalType} détecté par ${text(signal.source_code, 'une source Revenue OS')}.`),
      entityType: text(payload.entityType, 'signal'),
      entityId: String(signal.id || ''),
      entityLabel: text(signal.title),
      evidence: Array.isArray(signal.evidence) ? signal.evidence.map(String).slice(0, 8) : [],
      recommendedAction: Array.isArray(signal.recommended_next_actions) && signal.recommended_next_actions[0] ? String(signal.recommended_next_actions[0]) : 'Accuser réception, vérifier la preuve et affecter un propriétaire.',
      allowedActions: ['acknowledge','assign_intervention','open_signal','launch_rescue'],
      sourceZone: 'live-signals',
      sourceRecordId: String(signal.id || ''),
      createdAt: text(signal.created_at, now),
      observedAt: text(signal.detected_at, text(signal.occurred_at, now)),
    }))
  }

  if (context.council && context.council.blockingFindings > 0) {
    generated.push(exceptionRecord({
      key: `council-block:${context.council.runId}`,
      type: 'strategy_blocked',
      title: 'Stratégie bloquée par le Conseil',
      summary: `${context.council.blockingFindings} conclusion(s) bloquante(s) et ${context.council.contradictions} contradiction(s) restent ouvertes.`,
      priority: 'P1',
      severity: 'high',
      businessImpact: 'La stratégie ne peut pas progresser vers une exécution sûre.',
      revenueAtRisk: context.objective ? Math.max(0, context.objective.revenueTarget - context.objective.actualRevenue) : 0,
      rootCause: context.council.topFindings[0] || 'Le Conseil a identifié des conditions non satisfaites.',
      entityType: 'council_run',
      entityId: context.council.runId,
      entityLabel: context.council.classification,
      evidence: context.council.topFindings,
      recommendedAction: 'Ouvrir le Conseil, résoudre les blocages puis demander une nouvelle classification.',
      allowedActions: ['open_council','request_evidence','request_reanalysis','open_strategy_studio'],
      sourceZone: 'validation-council',
      sourceRecordId: context.council.runId,
      createdAt: now,
      observedAt: context.council.freshness.observedAt,
    }))
  }

  for (const program of context.programs) {
    if (program.capacityUtilization < 90 && program.tasksBlocked === 0 && !program.stopConditionTriggered) continue
    const critical = program.capacityUtilization >= 100 || program.stopConditionTriggered
    generated.push(exceptionRecord({
      key: `program-capacity:${program.id}`,
      type: program.stopConditionTriggered ? 'stop_condition_reached' : 'capacity_conflict',
      title: program.stopConditionTriggered ? `Condition d’arrêt déclenchée · ${program.title}` : `Capacité sous tension · ${program.title}`,
      summary: `${program.capacityUtilization}% de capacité utilisée et ${program.tasksBlocked} tâche(s) bloquée(s).`,
      priority: critical ? 'P0' : 'P1',
      severity: critical ? 'critical' : 'high',
      businessImpact: `Programme contribuant à ${Math.round(program.pipelineContribution).toLocaleString('fr-FR')} Dh de pipeline.`,
      revenueAtRisk: program.pipelineContribution,
      rootCause: program.stopConditionTriggered ? 'Une condition d’arrêt compilée a été atteinte.' : 'La charge opérationnelle dépasse le seuil de sécurité.',
      entityType: 'program',
      entityId: program.id,
      entityLabel: program.title,
      evidence: [`Capacité: ${program.capacityUtilization}%`, `Tâches bloquées: ${program.tasksBlocked}`, `Campagnes actives: ${program.activeCampaigns}`],
      recommendedAction: critical ? 'Suspendre l’expansion, ouvrir le compilateur et arbitrer capacité ou périmètre.' : 'Réaffecter les ressources ou réduire la prochaine wave.',
      allowedActions: ['pause_campaign','recompile_mission','change_owner','open_capacity'],
      sourceZone: 'active-programs',
      sourceRecordId: program.id,
      createdAt: now,
      observedAt: program.freshness.observedAt,
    }))
  }

  for (const row of context.sources.approvalRequests) {
    const status = text(row.status, text(rowPayload(row).status, 'pending'))
    if (!['pending','requested','awaiting','awaiting_approval'].includes(status)) continue
    const expiresAt = isoDate(row.expires_at || rowPayload(row).expiresAt)
    const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false
    generated.push(exceptionRecord({
      key: `approval:${row.id}`,
      type: expired ? 'approval_expired' : 'approval_required',
      title: expired ? 'Approbation expirée' : 'Décision exécutive requise',
      summary: text(rowPayload(row).title, text(row.approval_class, 'Une action gouvernée attend une décision.')),
      priority: expired ? 'P1' : 'P2',
      severity: expired ? 'high' : 'medium',
      businessImpact: text(rowPayload(row).businessConsequence, 'Le processus reste bloqué tant que la décision n’est pas enregistrée.'),
      revenueAtRisk: numberValue(rowPayload(row).revenueAtRisk),
      rootCause: expired ? 'La fenêtre d’autorité a expiré.' : 'L’action dépasse la classe d’autorité automatique.',
      entityType: 'approval_request',
      entityId: String(row.id || ''),
      entityLabel: text(row.approval_class, 'Approbation'),
      evidence: [],
      recommendedAction: expired ? 'Renouveler ou rejeter explicitement la demande.' : 'Ouvrir la gouvernance et décider avec le contexte complet.',
      allowedActions: ['open_approval','approve','reject','request_evidence'],
      sourceZone: 'approvals-governance',
      sourceRecordId: String(row.id || ''),
      createdAt: text(row.created_at, now),
      observedAt: text(row.updated_at, text(row.created_at, now)),
      dueAt: expiresAt,
    }))
  }

  for (const row of context.sources.deadLetters) {
    const payload = rowPayload(row)
    const status = text(row.status, text(payload.status, 'open'))
    if (['resolved','discarded'].includes(status)) continue
    generated.push(exceptionRecord({
      key: `dead-letter:${row.id}`,
      type: 'execution_dead_letter',
      title: 'Action d’exécution en dead letter',
      summary: text(row.reason, text(payload.reason, 'Une action n’a pas pu être exécutée après les tentatives autorisées.')),
      priority: 'P1',
      severity: 'high',
      businessImpact: text(payload.businessImpact, 'L’étape opérationnelle et ses dépendances restent bloquées.'),
      revenueAtRisk: numberValue(payload.revenueAtRisk),
      rootCause: text(row.reason, text(payload.lastError, 'Échec technique ou gouvernance non résolue.')),
      entityType: 'execution_action',
      entityId: text(row.action_id, text(payload.actionId)),
      entityLabel: text(payload.actionType, text(row.adapter_code, 'Action MZ14')),
      evidence: [`Tentatives: ${numberValue(row.attempts, numberValue(payload.attempts))}`],
      recommendedAction: 'Examiner le payload redacted, l’adaptateur et l’approbation avant retry ou compensation.',
      allowedActions: ['retry_adapter','compensate','suspend_adapter','open_execution'],
      sourceZone: 'execution-progress',
      sourceRecordId: text(row.action_id, String(row.id || '')),
      createdAt: text(row.created_at, now),
      observedAt: text(row.updated_at, text(row.created_at, now)),
    }))
  }

  for (const row of context.sources.executionActions) {
    const payload = rowPayload(row)
    const status = text(row.status, text(payload.status))
    if (!['failed','retry_scheduled'].includes(status)) continue
    if (generated.some((item) => item.sourceRecordId === String(row.id || payload.id))) continue
    generated.push(exceptionRecord({
      key: `execution-failure:${row.id || payload.id}`,
      type: 'adapter_failure',
      title: `Échec d’exécution · ${text(row.action_type, text(payload.actionType, 'action'))}`,
      summary: text(row.last_error, text(payload.lastError, 'L’adaptateur a retourné un échec.')),
      priority: status === 'failed' ? 'P1' : 'P2',
      severity: status === 'failed' ? 'high' : 'medium',
      businessImpact: text(payload.businessImpact, 'Le prochain jalon dépendant peut être retardé.'),
      revenueAtRisk: numberValue(payload.revenueAtRisk),
      rootCause: text(row.last_error, text(payload.lastError, 'Échec non classifié.')),
      entityType: 'execution_action',
      entityId: String(row.id || payload.id || ''),
      entityLabel: text(row.adapter_code, text(payload.adapterCode, 'adaptateur')),
      evidence: [`Statut: ${status}`, `Tentatives: ${numberValue(row.attempt_count, numberValue(payload.attemptCount))}`],
      recommendedAction: status === 'retry_scheduled' ? 'Surveiller la prochaine tentative et vérifier l’état de l’adaptateur.' : 'Examiner, corriger puis retry ou compenser.',
      allowedActions: ['retry_adapter','compensate','open_execution'],
      sourceZone: 'execution-progress',
      sourceRecordId: String(row.id || payload.id || ''),
      createdAt: text(row.created_at, now),
      observedAt: text(row.updated_at, text(row.created_at, now)),
    }))
  }

  const persisted = new Map<string, any>(context.sources.cockpitExceptions.map((row) => [text(row.exception_code, text(rowPayload(row).code)), row]))
  const merged = generated.map((exception) => {
    const existing = persisted.get(exception.code)
    if (!existing) return exception
    const payload = rowPayload<RevenueException & Record<string, unknown>>(existing)
    return {
      ...exception,
      id: text(existing.id, exception.id),
      status: (text(existing.status, text(payload.status, exception.status)) as RevenueException['status']),
      ownerId: text(existing.owner_id, text(payload.ownerId)) || undefined,
      ownerLabel: text(payload.ownerLabel) || undefined,
      dueAt: isoDate(existing.due_at || payload.dueAt) || exception.dueAt,
      acknowledgedAt: isoDate(existing.acknowledged_at || payload.acknowledgedAt),
      resolvedAt: isoDate(existing.resolved_at || payload.resolvedAt),
    }
  })

  return merged
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || b.revenueAtRisk - a.revenueAtRisk)
    .slice(0, 250)
}

function exceptionRecord(input: {
  key: string
  type: string
  title: string
  summary: string
  priority: CockpitPriority
  severity: CockpitSeverity
  businessImpact: string
  revenueAtRisk: number
  rootCause: string
  entityType: string
  entityId?: string
  entityLabel?: string
  evidence: string[]
  recommendedAction: string
  allowedActions: string[]
  sourceZone: RevenueException['sourceZone']
  sourceRecordId?: string
  createdAt: string
  observedAt?: string
  dueAt?: string
}): RevenueException {
  const id = cockpitStableId('cockpit-exception', input.key)
  return {
    id,
    code: `EXC-${input.key.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase().slice(0, 90)}`,
    exceptionType: input.type,
    title: input.title,
    summary: input.summary,
    priority: input.priority,
    severity: input.severity,
    status: 'open',
    businessImpact: input.businessImpact,
    revenueAtRisk: input.revenueAtRisk,
    rootCause: input.rootCause,
    affectedEntityType: input.entityType,
    affectedEntityId: input.entityId,
    affectedEntityLabel: input.entityLabel,
    evidence: input.evidence,
    recommendedAction: input.recommendedAction,
    allowedActions: input.allowedActions,
    dueAt: input.dueAt,
    escalationRole: input.priority === 'P0' ? 'Managing Director' : input.priority === 'P1' ? 'Revenue Director' : 'Revenue Operations',
    sourceZone: input.sourceZone,
    sourceRecordId: input.sourceRecordId,
    createdAt: input.createdAt,
    freshness: freshness(`exception:${input.type}`, input.observedAt || input.createdAt, 120),
  }
}

function priorityWeight(priority: CockpitPriority): number {
  return { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 }[priority]
}
