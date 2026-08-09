import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  AcademicAttentionItem,
  AcademicCalendarFinding,
  AcademicDirectoryOption,
  AcademicDossierKind,
  AcademicHistoryEvent,
  AcademicHumanStatus,
  AcademicNote,
  AcademicPeriodRecord,
  AcademicRequirement,
  AcademicStructureActionKey,
  AcademicStructureActionRequest,
  AcademicStructureActionResult,
  AcademicStructureSnapshot,
  AcademicTask,
  AcademicTone,
  AcademicTransitionDecision,
  AcademicTransitionItem,
  AcademicTransitionRun,
  AcademicYearRecord,
} from '@/types/angelcare360/academic-structure-area'

type Db = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

const EDIT_ACCESS = new Set(['super_admin', 'direction', 'administration', 'qualite'])
const APPROVAL_ACCESS = new Set(['super_admin', 'direction', 'administration'])
const TERMINAL_TASK_STATES = new Set(['completed', 'cancelled'])

function row(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object').map((item) => item as Row) : []
}

function text(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value)
}

function optionalText(value: unknown): string | null {
  const result = text(value).trim()
  return result || null
}

function numeric(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return fallback
}

function now() {
  return new Date().toISOString()
}

function dateOnly() {
  return new Date().toISOString().slice(0, 10)
}

function stableHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function idempotency(value: unknown, fallback: unknown) {
  return optionalText(value) || stableHash(fallback)
}

function required(value: unknown, label: string) {
  const result = optionalText(value)
  if (!result) throw new Error(`${label} est obligatoire.`)
  return result
}

function daysBetween(from: string, to: string) {
  const start = Date.parse(from)
  const end = Date.parse(to)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.ceil((end - start) / 86_400_000)
}

async function requireAreaContext(options?: { approve?: boolean }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif n’est disponible.', 403)
  if (!EDIT_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('Cet espace est réservé à l’administration de l’établissement.', 403)
  if (options?.approve && !APPROVAL_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('La validation de la direction est nécessaire.', 403)
  return context
}

async function safeRows(db: Db, table: string, schoolId: string, options?: { order?: string; ascending?: boolean; limit?: number }) {
  try {
    let query = db.from(table).select('*').eq('school_id', schoolId)
    if (options?.order) query = query.order(options.order, { ascending: options.ascending ?? false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    return error ? [] : rows(data)
  } catch {
    return []
  }
}

async function safeRowById(db: Db, table: string, schoolId: string, id: string) {
  const { data, error } = await db.from(table).select('*').eq('school_id', schoolId).eq('id', id).single()
  if (error) throw new Error('Le dossier demandé est introuvable ou n’est plus disponible.')
  return row(data)
}

function academicStatus(technical: string, metadata: Row, isCurrent: boolean): AcademicHumanStatus {
  const state = text(metadata.area2_state || metadata.governance_state, technical)
  if (state === 'archived' || technical === 'archived') return 'archived'
  if (state === 'reopened') return 'reopened'
  if (state === 'closing') return 'closing'
  if (technical === 'closed' || state === 'closed') return 'closed'
  if (technical === 'active' || isCurrent || state === 'active') return 'active'
  if (state === 'ready' || state === 'published') return 'ready'
  if (state === 'review' || state === 'to_verify') return 'to_verify'
  return 'draft'
}

function statusLabel(status: AcademicHumanStatus) {
  const labels: Record<AcademicHumanStatus, string> = {
    draft: 'Brouillon',
    to_verify: 'À vérifier',
    ready: 'Prête à utiliser',
    active: 'Active',
    closing: 'À clôturer',
    closed: 'Clôturée',
    reopened: 'Réouverte',
    archived: 'Archivée',
  }
  return labels[status]
}

function toneFor(status: AcademicHumanStatus, blockers = 0): AcademicTone {
  if (blockers > 0) return 'warning'
  if (status === 'active' || status === 'ready' || status === 'closed') return 'verified'
  if (status === 'closing' || status === 'reopened') return 'decision'
  if (status === 'archived') return 'neutral'
  return 'warning'
}

function requirement(input: Omit<AcademicRequirement, 'state'>): AcademicRequirement {
  return {
    ...input,
    state: !input.applicable ? 'not_applicable' : input.passed ? 'complete' : input.blocking ? 'blocked' : 'to_complete',
  }
}

function mapTask(item: Row): AcademicTask {
  return {
    id: text(item.id),
    academicYearId: text(item.academic_year_id),
    periodId: optionalText(item.period_id),
    transitionRunId: optionalText(item.transition_run_id),
    title: text(item.title),
    description: optionalText(item.description),
    state: text(item.state, 'open') as AcademicTask['state'],
    priority: text(item.priority, 'normal') as AcademicTask['priority'],
    ownerUserId: optionalText(item.owner_user_id),
    ownerLabel: optionalText(item.owner_label),
    dueAt: optionalText(item.due_at),
    createdAt: text(item.created_at, now()),
    updatedAt: text(item.updated_at, now()),
  }
}

function mapNote(item: Row): AcademicNote {
  return {
    id: text(item.id),
    academicYearId: text(item.academic_year_id),
    periodId: optionalText(item.period_id),
    transitionRunId: optionalText(item.transition_run_id),
    body: text(item.body),
    important: boolean(item.important),
    authorLabel: text(item.author_label, 'Équipe administrative'),
    createdAt: text(item.created_at, now()),
  }
}

function mapHistory(item: Row, fallback = 'Mise à jour de l’année scolaire'): AcademicHistoryEvent {
  return {
    id: text(item.id, stableHash(item)),
    label: text(item.label || item.action || item.event_type, fallback),
    detail: optionalText(item.detail || item.reason),
    actorLabel: optionalText(item.actor_label || item.actor_role || row(item.metadata_json).actor_label),
    createdAt: text(item.created_at || item.effective_at, now()),
    tone: text(item.severity) === 'critical' ? 'critical' : text(item.severity) === 'warning' ? 'warning' : 'neutral',
    sourceType: optionalText(item.entity_type || item.source_type),
    sourceId: optionalText(item.entity_id || item.source_id),
  }
}

function calendarFindings(year: Row, periods: Row[]): AcademicCalendarFinding[] {
  const result: AcademicCalendarFinding[] = []
  const yearId = text(year.id)
  const sorted = [...periods].sort((a, b) => numeric(a.order_index) - numeric(b.order_index) || text(a.starts_on).localeCompare(text(b.starts_on)))
  if (!sorted.length) {
    result.push({ id: `missing:${yearId}`, academicYearId: yearId, periodId: null, findingType: 'missing_period', title: 'Aucune période n’est configurée', explanation: 'Ajoutez les trimestres ou semestres qui organiseront l’année scolaire.', severity: 'blocking', tone: 'critical', resolved: false, exactHref: null })
    return result
  }
  sorted.forEach((period, index) => {
    const periodId = text(period.id)
    const start = text(period.starts_on)
    const end = text(period.ends_on)
    if (Date.parse(end) < Date.parse(start)) result.push({ id: `invalid:${periodId}`, academicYearId: yearId, periodId, findingType: 'invalid_dates', title: `Dates invalides · ${text(period.label)}`, explanation: 'La date de fin précède la date de début.', severity: 'blocking', tone: 'critical', resolved: false, exactHref: null })
    if (Date.parse(start) < Date.parse(text(year.starts_on)) || Date.parse(end) > Date.parse(text(year.ends_on))) result.push({ id: `outside:${periodId}`, academicYearId: yearId, periodId, findingType: 'outside_year', title: `Période hors de l’année · ${text(period.label)}`, explanation: 'Les dates de cette période dépassent les limites de l’année scolaire.', severity: 'blocking', tone: 'critical', resolved: false, exactHref: null })
    const previous = index > 0 ? sorted[index - 1] : null
    if (previous && Date.parse(start) <= Date.parse(text(previous.ends_on))) result.push({ id: `overlap:${text(previous.id)}:${periodId}`, academicYearId: yearId, periodId, findingType: 'overlap', title: `Chevauchement · ${text(previous.label)} et ${text(period.label)}`, explanation: 'Deux périodes couvrent les mêmes dates. Corrigez-les avant de rendre l’année active.', severity: 'blocking', tone: 'critical', resolved: false, exactHref: null })
    if (previous) {
      const gap = daysBetween(text(previous.ends_on), start)
      if (gap !== null && gap > 2) result.push({ id: `gap:${text(previous.id)}:${periodId}`, academicYearId: yearId, periodId, findingType: 'gap', title: `Intervalle à vérifier avant ${text(period.label)}`, explanation: `${gap - 1} jour(s) ne sont rattachés à aucune période.`, severity: 'warning', tone: 'warning', resolved: false, exactHref: null })
    }
  })
  return result
}

function periodClosureAttention(input: { period: Row; attendanceSessions: Row[]; reportCards: Row[]; validationBatches: Row[]; publicationRuns: Row[] }): AcademicAttentionItem[] {
  const periodId = text(input.period.id)
  const yearId = text(input.period.academic_year_id)
  if (text(input.period.status) === 'closed') return []
  const startsOn = text(input.period.starts_on)
  const endsOn = text(input.period.ends_on)
  const openAttendance = input.attendanceSessions.filter((item) => text(item.academic_year_id) === yearId && text(item.status) === 'open' && text(item.session_date) >= startsOn && text(item.session_date) <= endsOn)
  const draftCards = input.reportCards.filter((item) => text(item.term_id) === periodId && text(item.status) !== 'published' && text(item.status) !== 'archived')
  const openValidations = input.validationBatches.filter((item) => text(item.term_id) === periodId && !['completed', 'resolved', 'approved', 'closed'].includes(text(item.status)))
  const blockedPublications = input.publicationRuns.filter((item) => text(item.term_id) === periodId && (numeric(item.blocked_count) > 0 || !['completed', 'resolved', 'published', 'closed'].includes(text(item.status))))
  const result: AcademicAttentionItem[] = []
  if (openAttendance.length) result.push({ id: `period:${periodId}:attendance`, academicYearId: yearId, periodId, transitionRunId: null, title: `${openAttendance.length} feuille(s) de présence restent ouvertes`, explanation: 'Les présences de cette période doivent être terminées avant une clôture fiable.', consequence: 'La période ne peut pas être clôturée tant que ces feuilles restent ouvertes.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: endsOn, recommendedActionLabel: 'Ouvrir les présences concernées', actionKey: null, exactHref: `/angelcare-360-command-center/presences?academicYear=${encodeURIComponent(yearId)}&period=${encodeURIComponent(periodId)}&status=open&source=academic-structure`, sourceType: 'attendance', sourceId: periodId })
  if (draftCards.length) result.push({ id: `period:${periodId}:report-cards`, academicYearId: yearId, periodId, transitionRunId: null, title: `${draftCards.length} bulletin(s) restent à publier`, explanation: 'Les bulletins préparés pour cette période ne sont pas encore tous publiés.', consequence: 'La clôture resterait incomplète pour les familles concernées.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: endsOn, recommendedActionLabel: 'Ouvrir les bulletins concernés', actionKey: null, exactHref: `/angelcare-360-command-center/academique/bulletins?academicYear=${encodeURIComponent(yearId)}&term=${encodeURIComponent(periodId)}&status=draft&source=academic-structure`, sourceType: 'report_card', sourceId: periodId })
  if (openValidations.length) result.push({ id: `period:${periodId}:validations`, academicYearId: yearId, periodId, transitionRunId: null, title: `${openValidations.length} validation(s) académique(s) restent ouvertes`, explanation: 'Des résultats ou corrections attendent encore une validation.', consequence: 'La période ne doit pas être figée avant leur résolution.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: endsOn, recommendedActionLabel: 'Voir les validations', actionKey: null, exactHref: `/angelcare-360-command-center/academique/notes?academicYear=${encodeURIComponent(yearId)}&term=${encodeURIComponent(periodId)}&status=open&source=academic-structure`, sourceType: 'academic_validation', sourceId: periodId })
  if (blockedPublications.length) result.push({ id: `period:${periodId}:publication`, academicYearId: yearId, periodId, transitionRunId: null, title: `${blockedPublications.length} publication(s) nécessitent une vérification`, explanation: 'Une publication de bulletins ou de résultats n’est pas terminée.', consequence: 'La clôture doit attendre la fin ou la résolution de ces publications.', severity: 'warning', tone: 'warning', ownerLabel: null, dueAt: endsOn, recommendedActionLabel: 'Vérifier les publications', actionKey: null, exactHref: `/angelcare-360-command-center/academique/bulletins?academicYear=${encodeURIComponent(yearId)}&term=${encodeURIComponent(periodId)}&source=academic-structure`, sourceType: 'publication', sourceId: periodId })
  return result
}

function periodRecord(period: Row, year: Row, findings: AcademicCalendarFinding[], allAttention: AcademicAttentionItem[]): AcademicPeriodRecord {
  const metadata = row(period.metadata_json)
  const status = academicStatus(text(period.status), metadata, text(period.status) === 'active')
  const today = Date.now()
  const isCurrent = Date.parse(text(period.starts_on)) <= today && Date.parse(text(period.ends_on)) >= today && text(period.status) !== 'closed'
  const periodFindings = findings.filter((item) => item.periodId === text(period.id))
  const periodAttention = allAttention.filter((item) => item.periodId === text(period.id))
  return {
    id: text(period.id), academicYearId: text(period.academic_year_id), code: text(period.term_code), label: text(period.label), startsOn: text(period.starts_on), endsOn: text(period.ends_on), orderIndex: numeric(period.order_index, 1), technicalStatus: text(period.status, 'planned'), status, statusLabel: statusLabel(status), tone: toneFor(status, periodAttention.filter((item) => item.severity === 'blocking').length + periodFindings.filter((item) => item.severity === 'blocking').length), termType: optionalText(metadata.term_type), daysRemaining: isCurrent ? daysBetween(dateOnly(), text(period.ends_on)) : null, isCurrent, closureBlockers: periodAttention.filter((item) => item.severity === 'blocking').length, attention: periodAttention, findings: periodFindings, updatedAt: optionalText(period.updated_at),
  }
}

function transitionDecision(value: unknown): AcademicTransitionDecision {
  const technical = text(value, 'undecided')
  const aliases: Record<string, AcademicTransitionDecision> = {
    promote: 'promote',
    repeat: 'repeat',
    transfer_class: 'change_class',
    change_class: 'change_class',
    transfer_section: 'change_section',
    change_section: 'change_section',
    transfer_institution: 'change_institution',
    change_institution: 'change_institution',
    suspend: 'suspend',
    withdraw: 'withdraw',
    graduate: 'graduate',
    alumni: 'graduate',
    reenroll: 'reenroll',
    undecided: 'undecided',
  }
  return aliases[technical] || 'undecided'
}

function storedTransitionDecision(value: AcademicTransitionDecision): string {
  const aliases: Record<AcademicTransitionDecision, string> = {
    promote: 'promote',
    repeat: 'repeat',
    change_class: 'transfer_class',
    change_section: 'transfer_section',
    change_institution: 'transfer_institution',
    suspend: 'suspend',
    withdraw: 'withdraw',
    graduate: 'graduate',
    reenroll: 'reenroll',
    undecided: 'promote',
  }
  return aliases[value]
}

function transitionState(value: unknown, summary: Row): AcademicTransitionRun['state'] {
  if (optionalText(summary.verified_at)) return 'verified'
  const state = text(value, 'draft')
  if (state === 'previewed') return 'prepared'
  if (state === 'review') return 'reviewing'
  if (state === 'approved') return 'approved'
  if (state === 'executing') return 'executing'
  if (state === 'partially_failed' || state === 'failed') return 'partially_failed'
  if (state === 'completed') return 'completed'
  return 'draft'
}

function mapTransitionRun(run: Row, items: Row[], years: Row[], students: Row[], classes: Row[]): AcademicTransitionRun {
  const runItems = items.filter((item) => text(item.rollover_run_id) === text(run.id))
  const yearLabel = (id: unknown) => text(years.find((item) => text(item.id) === text(id))?.label, 'Année scolaire')
  const classLabel = (id: unknown) => optionalText(classes.find((item) => text(item.id) === text(id))?.name)
  const studentLabel = (id: unknown) => text(students.find((item) => text(item.id) === text(id))?.full_name, text(id, 'Enfant'))
  const mapped: AcademicTransitionItem[] = runItems.map((item) => {
    const proposal = row(item.proposal_json)
    const result = row(item.result_json)
    const storedState = text(item.state, 'proposed')
    const proposed = transitionDecision(proposal.proposed_decision || item.decision)
    const finalDecision = storedState === 'review' && proposed === 'undecided' ? 'undecided' : transitionDecision(item.decision)
    const state: AcademicTransitionItem['state'] = storedState === 'review' ? 'proposed' : storedState === 'repaired' ? 'completed' : ['proposed', 'approved', 'excluded', 'executing', 'completed', 'failed'].includes(storedState) ? storedState as AcademicTransitionItem['state'] : 'proposed'
    return {
      id: text(item.id),
      runId: text(run.id),
      studentId: text(item.student_id),
      studentLabel: studentLabel(item.student_id),
      sourceClassId: optionalText(item.source_class_id),
      sourceClassLabel: classLabel(item.source_class_id),
      proposedDecision: proposed,
      finalDecision,
      targetClassId: optionalText(item.target_class_id),
      targetClassLabel: classLabel(item.target_class_id),
      targetSectionId: optionalText(item.target_section_id),
      state,
      capacityConflict: boolean(proposal.capacity_conflict),
      blockerReason: optionalText(item.blocker_reason),
      ownerLabel: optionalText(proposal.owner_label),
      executionId: optionalText(item.execution_id),
      updatedAt: text(item.updated_at || result.updated_at, now()),
    }
  })
  const summary = row(run.summary_json)
  return {
    id: text(run.id),
    sourceAcademicYearId: text(run.source_academic_year_id),
    targetAcademicYearId: text(run.target_academic_year_id),
    sourceAcademicYearLabel: yearLabel(run.source_academic_year_id),
    targetAcademicYearLabel: yearLabel(run.target_academic_year_id),
    state: transitionState(run.state, summary),
    totalItems: mapped.length,
    readyItems: mapped.filter((item) => ['approved', 'completed'].includes(item.state) && !item.capacityConflict).length,
    decisionRequired: mapped.filter((item) => item.finalDecision === 'undecided' || item.state === 'proposed').length,
    capacityConflicts: mapped.filter((item) => item.capacityConflict).length,
    failedItems: mapped.filter((item) => item.state === 'failed').length,
    completedItems: mapped.filter((item) => item.state === 'completed').length,
    approvedByLabel: optionalText(summary.approved_by_label),
    executedAt: optionalText(run.executed_at),
    verifiedAt: optionalText(summary.verified_at),
    items: mapped,
    updatedAt: text(run.updated_at, now()),
  }
}

function academicRequirements(input: { year: Row; periods: Row[]; classes: Row[]; assignments: Row[]; activeUsers: number; findings: AcademicCalendarFinding[]; transition: AcademicTransitionRun | null; tasks: AcademicTask[] }): AcademicRequirement[] {
  const yearId = text(input.year.id)
  const metadata = row(input.year.metadata_json)
  const relevantClasses = input.classes.filter((item) => text(item.academic_year_id) === yearId && text(item.status) === 'active')
  const relevantAssignments = input.assignments.filter((item) => text(item.academic_year_id) === yearId && text(item.status) === 'active')
  const blockingFindings = input.findings.filter((item) => item.severity === 'blocking')
  const openTasks = input.tasks.filter((item) => !TERMINAL_TASK_STATES.has(item.state))
  return [
    requirement({ key: 'identity', label: 'Informations générales', explanation: 'Le libellé et les dates définissent le cadre officiel de l’année scolaire.', passed: Boolean(optionalText(input.year.label) && optionalText(input.year.starts_on) && optionalText(input.year.ends_on)), applicable: true, blocking: true, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'academic_year', sourceId: yearId, actionLabel: 'Compléter les informations', actionKey: 'academic_year.update', exactHref: null }),
    requirement({ key: 'periods', label: 'Périodes scolaires', explanation: 'Au moins une période valide doit organiser l’année scolaire.', passed: input.periods.length > 0, applicable: true, blocking: true, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'period', sourceId: null, actionLabel: 'Ajouter une période', actionKey: 'academic_period.create', exactHref: null }),
    requirement({ key: 'calendar', label: 'Calendrier vérifié', explanation: 'Les périodes ne doivent pas se chevaucher ni dépasser les dates de l’année.', passed: blockingFindings.length === 0, applicable: input.periods.length > 0, blocking: true, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'calendar', sourceId: yearId, actionLabel: 'Vérifier le calendrier', actionKey: 'academic_period.verify_calendar', exactHref: null }),
    requirement({ key: 'classes', label: 'Classes préparées', explanation: 'Au moins une classe doit être disponible dans cette année.', passed: relevantClasses.length > 0, applicable: true, blocking: true, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'class', sourceId: null, actionLabel: 'Ouvrir les classes', actionKey: null, exactHref: `/angelcare-360-command-center/administration?plane=classes-capacity&view=classes&academicYear=${encodeURIComponent(yearId)}&source=academic-structure` }),
    requirement({ key: 'capacity', label: 'Capacité des classes', explanation: 'Chaque classe active doit avoir une capacité définie.', passed: relevantClasses.length > 0 && relevantClasses.every((item) => numeric(item.capacity) > 0), applicable: relevantClasses.length > 0, blocking: true, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'class', sourceId: null, actionLabel: 'Voir les classes sans capacité', actionKey: null, exactHref: `/angelcare-360-command-center/administration?plane=classes-capacity&view=capacity&academicYear=${encodeURIComponent(yearId)}&filter=unconfigured&source=academic-structure` }),
    requirement({ key: 'assignments', label: 'Affectations principales', explanation: 'Les affectations essentielles doivent être vérifiées avant le démarrage.', passed: relevantAssignments.length > 0 || Boolean(metadata.assignments_not_required), applicable: true, blocking: false, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'assignment', sourceId: null, actionLabel: 'Vérifier les affectations', actionKey: null, exactHref: `/angelcare-360-command-center/administration?plane=assignments&view=coverage&academicYear=${encodeURIComponent(yearId)}&source=academic-structure` }),
    requirement({ key: 'users', label: 'Accès administratifs', explanation: 'Au moins un utilisateur autorisé doit pouvoir administrer l’année.', passed: input.activeUsers > 0, applicable: true, blocking: true, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'user', sourceId: null, actionLabel: 'Vérifier les accès', actionKey: null, exactHref: '/angelcare-360-command-center/administration?plane=roles-permissions&view=users&source=academic-structure' }),
    requirement({ key: 'tasks', label: 'Tâches de préparation', explanation: 'Les tâches bloquantes doivent être terminées avant la mise en service.', passed: !openTasks.some((item) => item.priority === 'urgent'), applicable: true, blocking: false, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'task', sourceId: null, actionLabel: 'Voir les tâches', actionKey: null, exactHref: null }),
    requirement({ key: 'next_year', label: 'Année suivante', explanation: 'Une année cible doit être préparée avant le passage des enfants.', passed: Boolean(input.transition), applicable: text(input.year.status) === 'active' || text(input.year.status) === 'closed', blocking: false, ownerLabel: optionalText(metadata.responsible_label), dueAt: null, sourceType: 'transition', sourceId: input.transition?.id || null, actionLabel: 'Préparer l’année suivante', actionKey: 'academic_transition.prepare_target', exactHref: null }),
  ]
}

function attentionForYear(year: Row, requirements: AcademicRequirement[], findings: AcademicCalendarFinding[], transition: AcademicTransitionRun | null): AcademicAttentionItem[] {
  const yearId = text(year.id)
  const items: AcademicAttentionItem[] = requirements.filter((item) => item.applicable && !item.passed).map((item) => ({
    id: `year:${yearId}:${item.key}`, academicYearId: yearId, periodId: null, transitionRunId: transition?.id || null, title: item.label, explanation: item.explanation, consequence: item.blocking ? 'Cet élément empêche encore la mise en service ou la clôture complète.' : 'Cet élément doit être vérifié pour garder l’année scolaire fiable.', severity: item.blocking ? 'blocking' : 'warning', tone: item.blocking ? 'critical' : 'warning', ownerLabel: item.ownerLabel, dueAt: item.dueAt, recommendedActionLabel: item.actionLabel || 'Ouvrir le dossier concerné', actionKey: item.actionKey, exactHref: item.exactHref, sourceType: item.sourceType || 'academic_year', sourceId: item.sourceId,
  }))
  for (const finding of findings) items.push({ id: finding.id, academicYearId: yearId, periodId: finding.periodId, transitionRunId: null, title: finding.title, explanation: finding.explanation, consequence: finding.severity === 'blocking' ? 'Le calendrier ne peut pas être validé tant que ce conflit reste présent.' : 'Vérifiez cet intervalle avant de poursuivre.', severity: finding.severity, tone: finding.tone, ownerLabel: null, dueAt: null, recommendedActionLabel: 'Corriger les dates', actionKey: finding.periodId ? 'academic_period.update' : 'academic_period.create', exactHref: finding.exactHref, sourceType: 'calendar', sourceId: finding.periodId || yearId })
  if (transition?.decisionRequired) items.push({ id: `transition-decisions:${transition.id}`, academicYearId: yearId, periodId: null, transitionRunId: transition.id, title: `${transition.decisionRequired} enfant(s) nécessitent une décision`, explanation: 'Chaque enfant doit recevoir une destination explicite avant le passage à l’année suivante.', consequence: 'Le passage ne peut pas être exécuté pour ces enfants.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionLabel: 'Décider des destinations', actionKey: null, exactHref: null, sourceType: 'transition', sourceId: transition.id })
  if (transition?.capacityConflicts) items.push({ id: `transition-capacity:${transition.id}`, academicYearId: yearId, periodId: null, transitionRunId: transition.id, title: `${transition.capacityConflicts} conflit(s) de capacité`, explanation: 'Certaines classes cibles dépasseraient leur capacité prévue.', consequence: 'Les enfants concernés restent exclus de l’exécution tant que la capacité n’est pas corrigée.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionLabel: 'Voir les classes concernées', actionKey: null, exactHref: `/angelcare-360-command-center/administration?plane=classes-capacity&view=conflicts&source=academic-transition&run=${encodeURIComponent(transition.id)}`, sourceType: 'capacity', sourceId: transition.id })
  if (transition?.failedItems) items.push({ id: `transition-failed:${transition.id}`, academicYearId: yearId, periodId: null, transitionRunId: transition.id, title: `${transition.failedItems} passage(s) à corriger`, explanation: 'Une partie du passage a échoué et doit être reprise individuellement.', consequence: 'Les autres enfants restent transférés correctement ; seuls les dossiers en échec doivent être réparés.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionLabel: 'Corriger les dossiers', actionKey: 'academic_transition.retry_item', exactHref: null, sourceType: 'transition', sourceId: transition.id })
  return items
}

async function audit(input: { schoolId: string; action: string; entityType: string; entityId: string; before?: Row; after?: Row; metadata?: Row; severity?: 'info' | 'notice' | 'warning' | 'critical' }) {
  await recordAngelcare360AuditEventServer({ schoolId: input.schoolId, module: 'academic_structure_area', action: input.action, category: 'settings', entityType: input.entityType, entityId: input.entityId, beforeData: input.before || {}, afterData: input.after || {}, metadata: input.metadata || {}, severity: input.severity || 'info' })
}

export async function getAcademicStructureSnapshot(): Promise<AcademicStructureSnapshot> {
  const context = await requireAreaContext()
  const db = await createClient()
  const schoolId = context.school!.id
  const [years, periods, classes, sections, enrollments, students, assignments, staff, userRoles, sites, tasksRows, notesRows, transitionRows, transitionItemRows, attendanceSessions, reportCards, validationBatches, publicationRuns, auditRows] = await Promise.all([
    safeRows(db, 'angelcare360_academic_years', schoolId, { order: 'starts_on', ascending: false, limit: 40 }),
    safeRows(db, 'angelcare360_terms', schoolId, { order: 'order_index', ascending: true, limit: 300 }),
    safeRows(db, 'angelcare360_classes', schoolId, { order: 'order_index', ascending: true, limit: 2000 }),
    safeRows(db, 'angelcare360_sections', schoolId, { order: 'created_at', ascending: true, limit: 4000 }),
    safeRows(db, 'angelcare360_class_enrollments', schoolId, { order: 'created_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_students', schoolId, { order: 'full_name', ascending: true, limit: 10000 }),
    safeRows(db, 'angelcare360_teacher_assignments', schoolId, { order: 'created_at', ascending: false, limit: 5000 }),
    safeRows(db, 'angelcare360_staff', schoolId, { order: 'full_name', ascending: true, limit: 2000 }),
    safeRows(db, 'angelcare360_user_roles', schoolId, { order: 'created_at', ascending: false, limit: 2000 }),
    safeRows(db, 'angelcare360_governance_sites', schoolId, { order: 'created_at', ascending: true, limit: 100 }),
    safeRows(db, 'angelcare360_academic_structure_tasks', schoolId, { order: 'updated_at', ascending: false, limit: 2000 }),
    safeRows(db, 'angelcare360_academic_structure_notes', schoolId, { order: 'created_at', ascending: false, limit: 2000 }),
    safeRows(db, 'angelcare360_governance_rollover_runs', schoolId, { order: 'updated_at', ascending: false, limit: 100 }),
    safeRows(db, 'angelcare360_governance_rollover_items', schoolId, { order: 'updated_at', ascending: false, limit: 20000 }),
    safeRows(db, 'angelcare360_attendance_sessions', schoolId, { order: 'session_date', ascending: false, limit: 30000 }),
    safeRows(db, 'angelcare360_report_cards', schoolId, { order: 'created_at', ascending: false, limit: 30000 }),
    safeRows(db, 'angelcare360_academic_validation_batches', schoolId, { order: 'created_at', ascending: false, limit: 5000 }),
    safeRows(db, 'angelcare360_report_card_publication_runs', schoolId, { order: 'created_at', ascending: false, limit: 5000 }),
    safeRows(db, 'angelcare360_audit_logs', schoolId, { order: 'created_at', ascending: false, limit: 1000 }),
  ])
  const tasks = tasksRows.map(mapTask)
  const notes = notesRows.map(mapNote)
  const transitionRuns = transitionRows.map((run) => mapTransitionRun(run, transitionItemRows, years, students, classes))
  const activeUsers = new Set(userRoles.filter((item) => text(item.status) === 'active').map((item) => text(item.app_user_id))).size
  const yearRecords: AcademicYearRecord[] = years.map((year) => {
    const yearId = text(year.id)
    const yearPeriods = periods.filter((item) => text(item.academic_year_id) === yearId)
    const yearClasses = classes.filter((item) => text(item.academic_year_id) === yearId)
    const yearEnrollments = enrollments.filter((item) => text(item.academic_year_id) === yearId && text(item.status) === 'active')
    const findings = calendarFindings(year, yearPeriods)
    const transition = transitionRuns.find((item) => item.sourceAcademicYearId === yearId) || null
    const yearTasks = tasks.filter((item) => item.academicYearId === yearId)
    const requirements = academicRequirements({ year, periods: yearPeriods, classes, assignments, activeUsers, findings, transition, tasks: yearTasks })
    const closureAttention = yearPeriods.flatMap((period) => periodClosureAttention({ period, attendanceSessions, reportCards, validationBatches, publicationRuns }))
    const attention = [...attentionForYear(year, requirements, findings, transition), ...closureAttention]
    const metadata = row(year.metadata_json)
    const status = academicStatus(text(year.status), metadata, boolean(year.is_current))
    const currentPeriod = yearPeriods.find((item) => Date.parse(text(item.starts_on)) <= Date.now() && Date.parse(text(item.ends_on)) >= Date.now() && text(item.status) !== 'closed')
    const successor = years.find((item) => text(item.id) === optionalText(metadata.successor_academic_year_id)) || years.find((item) => Date.parse(text(item.starts_on)) > Date.parse(text(year.starts_on)))
    const complete = requirements.filter((item) => item.applicable && item.passed).length
    const requiredCount = requirements.filter((item) => item.applicable).length
    const blockers = requirements.filter((item) => item.applicable && item.blocking && !item.passed).length + findings.filter((item) => item.severity === 'blocking').length
    const nextRequirement = requirements.find((item) => item.applicable && !item.passed)
    return {
      id: yearId, code: text(year.year_code), label: text(year.label), startsOn: text(year.starts_on), endsOn: text(year.ends_on), technicalStatus: text(year.status, 'planned'), status, statusLabel: statusLabel(status), tone: toneFor(status, blockers), isCurrent: boolean(year.is_current) || text(year.status) === 'active', currentPeriodId: optionalText(currentPeriod?.id), currentPeriodLabel: optionalText(currentPeriod?.label), responsibleUserId: optionalText(metadata.responsible_user_id), responsibleLabel: optionalText(metadata.responsible_label), classCount: yearClasses.length, childrenCount: new Set(yearEnrollments.map((item) => text(item.student_id))).size, periodCount: yearPeriods.length, preparationComplete: complete, preparationRequired: requiredCount, blockersCount: blockers, warningsCount: attention.filter((item) => item.severity === 'warning').length, closureBlockers: closureAttention.filter((item) => item.severity === 'blocking').length + yearPeriods.filter((item) => text(item.status) !== 'closed').length, nextActionLabel: nextRequirement?.actionLabel || (status === 'active' ? 'Préparer l’année suivante' : status === 'closed' ? 'Consulter l’historique' : 'Rendre l’année active'), nextActionKey: nextRequirement?.actionKey || (status === 'active' ? 'academic_transition.prepare_target' : status === 'closed' ? null : 'academic_year.activate'), successorYearId: optionalText(successor?.id), successorYearLabel: optionalText(successor?.label), periods: yearPeriods.map((period) => periodRecord(period, year, findings, attention)), requirements, attention, tasks: yearTasks, notes: notes.filter((item) => item.academicYearId === yearId), history: auditRows.filter((item) => text(item.entity_id) === yearId || text(item.module) === 'academic_structure_area').slice(0, 100).map((item) => mapHistory(item)), transition, updatedAt: optionalText(year.updated_at),
    }
  })
  const currentYear = yearRecords.find((item) => item.isCurrent) || yearRecords.find((item) => item.status === 'active') || yearRecords[0] || null
  const allAttention = yearRecords.flatMap((item) => item.attention)
  const allFindings = yearRecords.flatMap((item) => item.periods.flatMap((period) => period.findings))
  const history = auditRows.filter((item) => text(item.module) === 'academic_structure_area' || ['academic_year', 'term', 'class_enrollment'].includes(text(item.entity_type))).slice(0, 300).map((item) => mapHistory(item))
  const directoryClasses: AcademicDirectoryOption[] = classes.map((item) => ({ id: text(item.id), label: text(item.name, text(item.class_code)), secondary: years.find((year) => text(year.id) === text(item.academic_year_id))?.label ? text(years.find((year) => text(year.id) === text(item.academic_year_id))?.label) : optionalText(item.level) }))
  return {
    generatedAt: now(), mode: sites.length ? 'multi' : 'single', title: sites.length ? 'Années scolaires du réseau' : 'Mon année scolaire', subtitle: sites.length ? 'Comparez les calendriers, les clôtures et la préparation de l’année suivante pour chaque site.' : 'Organisez les périodes, terminez les vérifications et préparez l’année suivante sans perdre le fil.', school: { id: schoolId, name: context.school!.name, siteCount: sites.length }, viewer: { userId: context.user.id, displayName: context.user.full_name || context.user.name || context.user.email || 'Utilisateur', roleLabel: context.access.roleLabel, canEdit: EDIT_ACCESS.has(context.access.accessLevel), canActivate: APPROVAL_ACCESS.has(context.access.accessLevel), canClose: APPROVAL_ACCESS.has(context.access.accessLevel), canReopen: APPROVAL_ACCESS.has(context.access.accessLevel), canExecuteTransition: APPROVAL_ACCESS.has(context.access.accessLevel), canAssign: EDIT_ACCESS.has(context.access.accessLevel), canViewHistory: context.access.canSeeAuditData }, years: yearRecords, currentYearId: currentYear?.id || null, currentYear, attention: allAttention, calendarFindings: allFindings, transitionRuns, directory: { staff: staff.map((item) => ({ id: text(item.id), label: text(item.full_name, text(item.staff_code)), secondary: optionalText(item.staff_type) || optionalText(item.staff_code) })), classes: directoryClasses, sections: sections.map((item) => ({ id: text(item.id), label: text(item.name, text(item.section_code)), secondary: directoryClasses.find((entry) => entry.id === text(item.class_id))?.label || null })) }, metrics: [
      { key: 'attention', label: 'Éléments à régler', value: String(allAttention.length), detail: `${allAttention.filter((item) => item.severity === 'blocking').length} bloquant(s)`, tone: allAttention.some((item) => item.severity === 'blocking') ? 'critical' : allAttention.length ? 'warning' : 'verified', view: 'attention' },
      { key: 'period', label: 'Période actuelle', value: currentYear?.currentPeriodLabel || 'À définir', detail: currentYear ? currentYear.label : 'Aucune année active', tone: currentYear?.currentPeriodId ? 'active' : 'warning', view: 'periods' },
      { key: 'preparation', label: 'Préparation', value: currentYear ? `${currentYear.preparationComplete}/${currentYear.preparationRequired}` : '0/0', detail: currentYear?.blockersCount ? `${currentYear.blockersCount} élément(s) bloquant(s)` : 'Préparation vérifiée', tone: currentYear?.blockersCount ? 'warning' : 'verified', view: 'preparation' },
      { key: 'closure', label: 'Clôture', value: currentYear?.status === 'closed' ? 'Terminée' : currentYear?.status === 'closing' ? 'En cours' : 'À préparer', detail: currentYear?.closureBlockers ? `${currentYear.closureBlockers} point(s) à régler` : 'Aucun blocage enregistré', tone: currentYear?.status === 'closed' ? 'verified' : currentYear?.closureBlockers ? 'warning' : 'neutral', view: 'closure' },
      { key: 'transition', label: 'Année suivante', value: currentYear?.transition ? `${currentYear.transition.readyItems}/${currentYear.transition.totalItems}` : 'À préparer', detail: currentYear?.transition ? `${currentYear.transition.decisionRequired} décision(s) restante(s)` : 'Aucune proposition générée', tone: currentYear?.transition?.failedItems ? 'critical' : currentYear?.transition ? 'decision' : 'neutral', view: 'next-year' },
    ], history, warnings: [],
  }
}

function actionNeedsApproval(action: AcademicStructureActionKey) {
  return ['academic_year.activate', 'academic_year.close', 'academic_year.reopen', 'academic_period.close', 'academic_period.reopen', 'academic_transition.execute', 'academic_transition.complete'].includes(action)
}

async function storeReceipt(db: Db, input: { schoolId: string; actionKey: string; key: string; academicYearId?: string | null; periodId?: string | null; transitionRunId?: string | null; message: string; result: Row; userId: string }) {
  try {
    await db.from('angelcare360_academic_structure_action_receipts').insert({ school_id: input.schoolId, academic_year_id: input.academicYearId || null, period_id: input.periodId || null, transition_run_id: input.transitionRunId || null, action_key: input.actionKey, idempotency_key: input.key, message: input.message, result_json: input.result, actor_user_id: input.userId })
  } catch {
    // Optional idempotency table; the authoritative business mutation remains valid.
  }
}

async function currentReceipt(db: Db, schoolId: string, key: string) {
  try {
    const { data, error } = await db.from('angelcare360_academic_structure_action_receipts').select('*').eq('school_id', schoolId).eq('idempotency_key', key).maybeSingle()
    return error ? null : row(data)
  } catch {
    return null
  }
}

export async function executeAcademicStructureAction(request: AcademicStructureActionRequest): Promise<AcademicStructureActionResult> {
  const context = await requireAreaContext({ approve: actionNeedsApproval(request.actionKey) })
  const db = await createClient()
  const schoolId = context.school!.id
  const userId = context.user.id
  const payload = row(request.payload)
  const reason = optionalText(request.reason)
  const effectiveAt = optionalText(request.effectiveAt) || now()
  const key = idempotency(request.idempotencyKey, request)
  const replay = await currentReceipt(db, schoolId, key)
  if (replay) return { ok: true, state: 'replayed', message: text(replay.message, 'Cette action a déjà été appliquée.'), academicYearId: request.academicYearId, periodId: request.periodId, transitionRunId: request.transitionRunId, result: row(replay.result_json) }
  let message = 'Modification enregistrée.'
  let result: Row = {}
  let yearId = request.academicYearId || null
  let periodId = request.periodId || null
  let runId = request.transitionRunId || null

  if (request.actionKey === 'academic_year.create') {
    const yearCode = required(payload.yearCode, 'Le code de l’année')
    const label = required(payload.label, 'Le nom de l’année')
    const startsOn = required(payload.startsOn, 'La date de début')
    const endsOn = required(payload.endsOn, 'La date de fin')
    if (Date.parse(endsOn) < Date.parse(startsOn)) throw new Error('La date de fin doit être postérieure à la date de début.')
    const { data, error } = await db.from('angelcare360_academic_years').insert({ school_id: schoolId, year_code: yearCode, label, starts_on: startsOn, ends_on: endsOn, is_current: false, status: 'planned', metadata_json: { area2_state: 'draft', responsible_user_id: optionalText(payload.responsibleUserId), responsible_label: optionalText(payload.responsibleLabel) }, created_by: userId, updated_by: userId }).select('*').single()
    if (error) throw new Error(error.message.includes('duplicate') ? 'Cette année scolaire existe déjà.' : 'L’année scolaire n’a pas pu être créée.')
    yearId = text(row(data).id)
    result = row(data)
    message = 'L’année scolaire a été créée. Vous pouvez maintenant ajouter ses périodes.'
    await audit({ schoolId, action: request.actionKey, entityType: 'academic_year', entityId: yearId, after: result })
  } else if (request.actionKey === 'academic_year.update') {
    yearId = required(yearId, 'L’année scolaire')
    const before = await safeRowById(db, 'angelcare360_academic_years', schoolId, yearId)
    const metadata = { ...row(before.metadata_json), responsible_user_id: payload.responsibleUserId === undefined ? row(before.metadata_json).responsible_user_id : optionalText(payload.responsibleUserId), responsible_label: payload.responsibleLabel === undefined ? row(before.metadata_json).responsible_label : optionalText(payload.responsibleLabel), area2_state: text(row(before.metadata_json).area2_state, 'draft') }
    const startsOn = optionalText(payload.startsOn) || text(before.starts_on)
    const endsOn = optionalText(payload.endsOn) || text(before.ends_on)
    if (Date.parse(endsOn) < Date.parse(startsOn)) throw new Error('La date de fin doit être postérieure à la date de début.')
    const yearPeriods = await safeRows(db, 'angelcare360_terms', schoolId, { order: 'order_index', ascending: true, limit: 500 })
    const outsidePeriod = yearPeriods.find((item) => text(item.academic_year_id) === yearId && (Date.parse(text(item.starts_on)) < Date.parse(startsOn) || Date.parse(text(item.ends_on)) > Date.parse(endsOn)))
    if (outsidePeriod) throw new Error(`La période ${text(outsidePeriod.label)} se trouverait en dehors des nouvelles dates. Corrigez-la d’abord.`)
    const { data, error } = await db.from('angelcare360_academic_years').update({ label: optionalText(payload.label) || before.label, year_code: optionalText(payload.yearCode) || before.year_code, starts_on: startsOn, ends_on: endsOn, metadata_json: metadata, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', yearId).select('*').single()
    if (error) throw new Error('Les informations de l’année scolaire n’ont pas pu être enregistrées.')
    result = row(data); message = 'Les informations de l’année scolaire ont été mises à jour.'
    await audit({ schoolId, action: request.actionKey, entityType: 'academic_year', entityId: yearId, before, after: result })
  } else if (request.actionKey === 'academic_period.create') {
    yearId = required(yearId || payload.academicYearId, 'L’année scolaire')
    const label = required(payload.label, 'Le nom de la période')
    const startsOn = required(payload.startsOn, 'La date de début')
    const endsOn = required(payload.endsOn, 'La date de fin')
    if (Date.parse(endsOn) < Date.parse(startsOn)) throw new Error('La date de fin doit être postérieure à la date de début.')
    const parentYear = await safeRowById(db, 'angelcare360_academic_years', schoolId, yearId)
    if (Date.parse(startsOn) < Date.parse(text(parentYear.starts_on)) || Date.parse(endsOn) > Date.parse(text(parentYear.ends_on))) throw new Error('La période doit rester comprise dans les dates de l’année scolaire.')
    const { data, error } = await db.from('angelcare360_terms').insert({ school_id: schoolId, academic_year_id: yearId, term_code: optionalText(payload.termCode) || `P${numeric(payload.orderIndex, 1)}`, label, starts_on: startsOn, ends_on: endsOn, order_index: numeric(payload.orderIndex, 1), status: 'planned', metadata_json: { area2_state: 'draft', term_type: optionalText(payload.termType) }, created_by: userId, updated_by: userId }).select('*').single()
    if (error) throw new Error('La période n’a pas pu être créée.')
    periodId = text(row(data).id); result = row(data); message = 'La période a été ajoutée au calendrier.'
    await audit({ schoolId, action: request.actionKey, entityType: 'term', entityId: periodId, after: result, metadata: { academicYearId: yearId } })
  } else if (request.actionKey === 'academic_period.update' || request.actionKey === 'academic_period.reorder') {
    periodId = required(periodId, 'La période')
    const before = await safeRowById(db, 'angelcare360_terms', schoolId, periodId)
    yearId = text(before.academic_year_id)
    const startsOn = optionalText(payload.startsOn) || text(before.starts_on)
    const endsOn = optionalText(payload.endsOn) || text(before.ends_on)
    if (Date.parse(endsOn) < Date.parse(startsOn)) throw new Error('La date de fin doit être postérieure à la date de début.')
    const parentYear = await safeRowById(db, 'angelcare360_academic_years', schoolId, yearId)
    if (Date.parse(startsOn) < Date.parse(text(parentYear.starts_on)) || Date.parse(endsOn) > Date.parse(text(parentYear.ends_on))) throw new Error('La période doit rester comprise dans les dates de l’année scolaire.')
    const { data, error } = await db.from('angelcare360_terms').update({ label: optionalText(payload.label) || before.label, term_code: optionalText(payload.termCode) || before.term_code, starts_on: startsOn, ends_on: endsOn, order_index: payload.orderIndex === undefined ? before.order_index : numeric(payload.orderIndex, 1), metadata_json: { ...row(before.metadata_json), term_type: payload.termType === undefined ? row(before.metadata_json).term_type : optionalText(payload.termType), area2_state: 'to_verify' }, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', periodId).select('*').single()
    if (error) throw new Error('La période n’a pas pu être mise à jour.')
    result = row(data); message = request.actionKey === 'academic_period.reorder' ? 'L’ordre des périodes a été mis à jour.' : 'Les dates de la période ont été mises à jour.'
    await audit({ schoolId, action: request.actionKey, entityType: 'term', entityId: periodId, before, after: result })
  } else if (request.actionKey === 'academic_period.verify_calendar' || request.actionKey === 'academic_year.prepare') {
    yearId = required(yearId, 'L’année scolaire')
    const snapshot = await getAcademicStructureSnapshot()
    const year = snapshot.years.find((item) => item.id === yearId)
    if (!year) throw new Error('L’année scolaire est introuvable.')
    const blockers = request.actionKey === 'academic_period.verify_calendar'
      ? year.periods.flatMap((item) => item.findings).filter((item) => item.severity === 'blocking').map((item) => item.title)
      : year.requirements.filter((item) => item.applicable && item.blocking && !item.passed).map((item) => item.label)
    const { data, error } = await db.from('angelcare360_academic_year_preparation_runs').insert({ school_id: schoolId, academic_year_id: yearId, run_type: request.actionKey === 'academic_period.verify_calendar' ? 'calendar' : 'preparation', state: blockers.length ? 'blocked' : 'ready', summary_json: { blockers, requirements: year.requirements }, requested_by: userId, requested_at: now(), reason }).select('*').single()
    if (error) throw new Error('La vérification n’a pas pu être enregistrée.')
    result = row(data)
    if (blockers.length) return { ok: true, state: 'blocked', message: `L’année scolaire ne peut pas encore être rendue active. ${blockers.length} élément(s) restent à compléter.`, academicYearId: yearId, blockers, result }
    message = 'Le calendrier et la préparation ont été vérifiés. L’année est prête pour validation.'
  } else if (['academic_year.request_activation', 'academic_year.request_closure', 'academic_year.request_reopen', 'academic_period.request_closure', 'academic_period.request_reopen', 'academic_transition.request_approval'].includes(request.actionKey)) {
    const isTransitionReview = request.actionKey === 'academic_transition.request_approval'
    const isPeriodReview = request.actionKey.startsWith('academic_period.')
    if (isPeriodReview) {
      periodId = required(periodId, 'La période')
      const period = await safeRowById(db, 'angelcare360_terms', schoolId, periodId)
      yearId = text(period.academic_year_id)
    }
    const entityId = isTransitionReview ? required(runId, 'Le passage à l’année suivante') : isPeriodReview ? required(periodId, 'La période') : required(yearId, 'L’année scolaire')
    const reviewType = request.actionKey === 'academic_year.request_activation' ? 'activation' : request.actionKey === 'academic_year.request_closure' ? 'year_closure' : request.actionKey === 'academic_year.request_reopen' ? 'year_reopen' : request.actionKey === 'academic_period.request_closure' ? 'period_closure' : request.actionKey === 'academic_period.request_reopen' ? 'period_reopen' : 'transition'
    const { data, error } = await db.from('angelcare360_academic_structure_reviews').insert({ school_id: schoolId, academic_year_id: yearId || null, period_id: periodId || null, transition_run_id: runId || null, review_type: reviewType, state: 'approval_requested', summary_json: payload, requested_by: userId, requested_at: now(), reason }).select('*').single()
    if (error) throw new Error('La demande de validation n’a pas pu être enregistrée.')
    result = row(data); message = 'La demande de validation a été transmise à la direction.'
    await audit({ schoolId, action: request.actionKey, entityType: reviewType, entityId, after: result })
  } else if (request.actionKey === 'academic_year.activate') {
    yearId = required(yearId, 'L’année scolaire')
    const snapshot = await getAcademicStructureSnapshot()
    const year = snapshot.years.find((item) => item.id === yearId)
    if (!year) throw new Error('L’année scolaire est introuvable.')
    const blockers = year.requirements.filter((item) => item.applicable && item.blocking && !item.passed).map((item) => item.label)
    if (blockers.length) return { ok: true, state: 'blocked', message: 'L’année scolaire ne peut pas encore être rendue active.', academicYearId: yearId, blockers }
    await db.from('angelcare360_academic_years').update({ is_current: false, updated_at: now() }).eq('school_id', schoolId).neq('id', yearId)
    const before = await safeRowById(db, 'angelcare360_academic_years', schoolId, yearId)
    const { data, error } = await db.from('angelcare360_academic_years').update({ status: 'active', is_current: true, metadata_json: { ...row(before.metadata_json), area2_state: 'active', activated_at: now(), activated_by: userId }, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', yearId).select('*').single()
    if (error) throw new Error('L’année scolaire n’a pas pu être rendue active.')
    result = row(data); message = `L’année scolaire ${text(result.label)} est maintenant active.`
    await audit({ schoolId, action: request.actionKey, entityType: 'academic_year', entityId: yearId, before, after: result })
  } else if (request.actionKey === 'academic_period.activate' || request.actionKey === 'academic_period.begin_closure' || request.actionKey === 'academic_period.close' || request.actionKey === 'academic_period.reopen' || request.actionKey === 'academic_period.replace') {
    periodId = required(periodId, 'La période')
    const before = await safeRowById(db, 'angelcare360_terms', schoolId, periodId)
    yearId = text(before.academic_year_id)
    const metadata = row(before.metadata_json)
    if (['academic_period.close', 'academic_period.reopen', 'academic_period.replace'].includes(request.actionKey) && !reason) throw new Error('Expliquez la raison de cette décision.')
    if (request.actionKey === 'academic_period.close') {
      const snapshot = await getAcademicStructureSnapshot()
      const period = snapshot.years.flatMap((item) => item.periods).find((item) => item.id === periodId)
      const blockers = period?.attention.filter((item) => item.severity === 'blocking').map((item) => item.title) || []
      if (blockers.length) return { ok: true, state: 'blocked', message: 'La période ne peut pas encore être clôturée.', academicYearId: yearId, periodId, blockers }
    }
    const target = request.actionKey === 'academic_period.activate' ? { status: 'active', state: 'active', message: 'La période est maintenant active.' } : request.actionKey === 'academic_period.begin_closure' ? { status: text(before.status), state: 'closing', message: 'La préparation de la clôture a commencé.' } : request.actionKey === 'academic_period.close' ? { status: 'closed', state: 'closed', message: 'La période est clôturée. Son historique reste disponible.' } : request.actionKey === 'academic_period.reopen' ? { status: 'active', state: 'reopened', message: 'La période a été réouverte avec conservation de sa clôture précédente.' } : { status: 'archived', state: 'archived', message: 'La période a été remplacée et reste disponible dans l’historique.' }
    const { data, error } = await db.from('angelcare360_terms').update({ status: target.status, metadata_json: { ...metadata, area2_state: target.state, area2_effective_at: effectiveAt, area2_reason: reason, area2_execution_id: randomUUID() }, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', periodId).select('*').single()
    if (error) throw new Error('L’état de la période n’a pas pu être modifié.')
    result = row(data); message = target.message
    await db.from('angelcare360_academic_period_closure_runs').insert({ school_id: schoolId, academic_year_id: yearId, period_id: periodId, action_type: request.actionKey.split('.').pop(), state: target.state, reason, effective_at: effectiveAt, actor_user_id: userId, summary_json: payload })
    await audit({ schoolId, action: request.actionKey, entityType: 'term', entityId: periodId, before, after: result, metadata: { reason, effectiveAt } })
  } else if (request.actionKey === 'academic_year.begin_closure' || request.actionKey === 'academic_year.close' || request.actionKey === 'academic_year.reopen' || request.actionKey === 'academic_year.archive') {
    yearId = required(yearId, 'L’année scolaire')
    const before = await safeRowById(db, 'angelcare360_academic_years', schoolId, yearId)
    if (['academic_year.close', 'academic_year.reopen', 'academic_year.archive'].includes(request.actionKey) && !reason) throw new Error('Expliquez la raison de cette décision.')
    if (request.actionKey === 'academic_year.close') {
      const snapshot = await getAcademicStructureSnapshot()
      const year = snapshot.years.find((item) => item.id === yearId)
      const blockers = [year?.periods.some((item) => item.status !== 'closed') ? 'Toutes les périodes ne sont pas clôturées.' : null, year?.transition && year.transition.decisionRequired ? `${year.transition.decisionRequired} décision(s) de passage restent à prendre.` : null, year?.tasks.some((item) => !TERMINAL_TASK_STATES.has(item.state) && item.priority === 'urgent') ? 'Des tâches urgentes restent ouvertes.' : null].filter(Boolean) as string[]
      if (blockers.length) return { ok: true, state: 'blocked', message: 'L’année scolaire ne peut pas encore être clôturée.', academicYearId: yearId, blockers }
    }
    const target = request.actionKey === 'academic_year.begin_closure' ? { status: text(before.status), state: 'closing', current: boolean(before.is_current), message: 'La préparation de la clôture a commencé.' } : request.actionKey === 'academic_year.close' ? { status: 'closed', state: 'closed', current: false, message: 'L’année scolaire est clôturée. Son historique reste disponible.' } : request.actionKey === 'academic_year.reopen' ? { status: 'active', state: 'reopened', current: true, message: 'L’année scolaire a été réouverte avec conservation de la clôture précédente.' } : { status: 'archived', state: 'archived', current: false, message: 'L’année scolaire est archivée.' }
    if (request.actionKey === 'academic_year.reopen') await db.from('angelcare360_academic_years').update({ is_current: false, updated_at: now() }).eq('school_id', schoolId).neq('id', yearId)
    const { data, error } = await db.from('angelcare360_academic_years').update({ status: target.status, is_current: target.current, metadata_json: { ...row(before.metadata_json), area2_state: target.state, area2_effective_at: effectiveAt, area2_reason: reason, area2_execution_id: randomUUID() }, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', yearId).select('*').single()
    if (error) throw new Error('L’état de l’année scolaire n’a pas pu être modifié.')
    result = row(data); message = target.message
    await db.from('angelcare360_academic_year_closure_runs').insert({ school_id: schoolId, academic_year_id: yearId, action_type: request.actionKey.split('.').pop(), state: target.state, reason, effective_at: effectiveAt, actor_user_id: userId, summary_json: payload })
    await audit({ schoolId, action: request.actionKey, entityType: 'academic_year', entityId: yearId, before, after: result, metadata: { reason, effectiveAt } })
  } else if (request.actionKey === 'academic_transition.prepare_target') {
    yearId = required(yearId, 'L’année scolaire source')
    const targetYearId = required(payload.targetAcademicYearId, 'L’année scolaire suivante')
    if (targetYearId === yearId) throw new Error('L’année suivante doit être différente de l’année source.')
    await safeRowById(db, 'angelcare360_academic_years', schoolId, targetYearId)
    const { data: existing } = await db.from('angelcare360_governance_rollover_runs').select('*').eq('school_id', schoolId).eq('source_academic_year_id', yearId).eq('target_academic_year_id', targetYearId).maybeSingle()
    if (existing) {
      runId = text(row(existing).id)
      result = row(existing)
      message = 'La préparation de l’année suivante existe déjà. Vous pouvez continuer la vérification.'
    } else {
      const runCode = `AREA2-${yearId.slice(0, 8)}-${targetYearId.slice(0, 8)}`
      const runKey = `area2:${schoolId}:${yearId}:${targetYearId}`
      const { data, error } = await db.from('angelcare360_governance_rollover_runs').insert({
        school_id: schoolId,
        source_academic_year_id: yearId,
        target_academic_year_id: targetYearId,
        run_code: runCode,
        state: 'previewed',
        idempotency_key: runKey,
        summary_json: { area2_contract: true, prepared_at: now(), prepared_by_label: context.user.full_name || context.user.name || context.user.email || 'Direction' },
        requested_by: userId,
        requested_at: now(),
        created_by: userId,
      }).select('*').single()
      if (error) throw new Error('La préparation de l’année suivante n’a pas pu être créée.')
      runId = text(row(data).id)
      result = row(data)
      message = 'L’année suivante est prête à recevoir les propositions de passage.'
    }
    await audit({ schoolId, action: request.actionKey, entityType: 'academic_transition', entityId: runId, after: result, metadata: { sourceYearId: yearId, targetYearId } })
  } else if (request.actionKey === 'academic_transition.copy_structure') {
    runId = required(runId, 'Le passage à l’année suivante')
    const run = await safeRowById(db, 'angelcare360_governance_rollover_runs', schoolId, runId)
    const [allClasses, allSections] = await Promise.all([
      safeRows(db, 'angelcare360_classes', schoolId, { order: 'order_index', ascending: true, limit: 5000 }),
      safeRows(db, 'angelcare360_sections', schoolId, { order: 'created_at', ascending: true, limit: 10000 }),
    ])
    const source = allClasses.filter((item) => text(item.academic_year_id) === text(run.source_academic_year_id) && text(item.status) === 'active')
    const target = allClasses.filter((item) => text(item.academic_year_id) === text(run.target_academic_year_id) && text(item.status) !== 'archived')
    const targetByCode = new Map(target.map((item) => [text(item.class_code), item]))
    let copiedClasses = 0
    let copiedSections = 0
    for (const item of source) {
      let targetClass = targetByCode.get(text(item.class_code)) || null
      if (!targetClass) {
        const { data, error } = await db.from('angelcare360_classes').insert({
          school_id: schoolId,
          academic_year_id: run.target_academic_year_id,
          class_code: text(item.class_code),
          name: text(item.name),
          level: text(item.level),
          capacity: numeric(item.capacity),
          order_index: numeric(item.order_index, 1),
          status: 'active',
          metadata_json: { copied_from_class_id: item.id, area2_rollover_run_id: runId, requires_review: true },
          created_by: userId,
          updated_by: userId,
        }).select('*').single()
        if (error) continue
        targetClass = row(data)
        targetByCode.set(text(item.class_code), targetClass)
        copiedClasses += 1
      }
      const sourceSections = allSections.filter((section) => text(section.class_id) === text(item.id) && text(section.status) === 'active')
      const existingTargetSections = allSections.filter((section) => text(section.class_id) === text(targetClass?.id))
      const existingCodes = new Set(existingTargetSections.map((section) => text(section.section_code)))
      for (const section of sourceSections) {
        if (existingCodes.has(text(section.section_code))) continue
        const { error } = await db.from('angelcare360_sections').insert({
          school_id: schoolId,
          academic_year_id: run.target_academic_year_id,
          class_id: targetClass?.id,
          section_code: text(section.section_code),
          name: text(section.name),
          capacity: numeric(section.capacity),
          room: optionalText(section.room),
          status: 'active',
          metadata_json: { copied_from_section_id: section.id, area2_rollover_run_id: runId, requires_review: true },
          created_by: userId,
          updated_by: userId,
        })
        if (!error) copiedSections += 1
      }
    }
    result = { copiedClasses, copiedSections, existingClasses: target.length }
    message = copiedClasses || copiedSections ? `${copiedClasses} classe(s) et ${copiedSections} section(s) ont été préparées dans l’année suivante.` : 'La structure cible est déjà présente. Aucun doublon n’a été créé.'
  } else if (request.actionKey === 'academic_transition.generate_proposals') {
    runId = required(runId, 'Le passage à l’année suivante')
    const run = await safeRowById(db, 'angelcare360_governance_rollover_runs', schoolId, runId)
    const [allEnrollments, allClasses, existingItems] = await Promise.all([
      safeRows(db, 'angelcare360_class_enrollments', schoolId, { order: 'created_at', ascending: false, limit: 30000 }),
      safeRows(db, 'angelcare360_classes', schoolId, { order: 'order_index', ascending: true, limit: 5000 }),
      safeRows(db, 'angelcare360_governance_rollover_items', schoolId, { order: 'created_at', ascending: false, limit: 30000 }),
    ])
    const sourceEnrollments = allEnrollments.filter((item) => text(item.academic_year_id) === text(run.source_academic_year_id) && text(item.status) === 'active')
    const targetClasses = allClasses.filter((item) => text(item.academic_year_id) === text(run.target_academic_year_id) && text(item.status) === 'active')
    const existingStudentIds = new Set(existingItems.filter((item) => text(item.rollover_run_id) === runId).map((item) => text(item.student_id)))
    const projectedByClass = new Map<string, number>()
    for (const enrollment of allEnrollments.filter((item) => text(item.academic_year_id) === text(run.target_academic_year_id) && text(item.status) === 'active')) {
      const classId = text(enrollment.class_id)
      projectedByClass.set(classId, (projectedByClass.get(classId) || 0) + 1)
    }
    let created = 0
    for (const enrollment of sourceEnrollments) {
      const studentId = text(enrollment.student_id)
      if (existingStudentIds.has(studentId)) continue
      const sourceClass = allClasses.find((item) => text(item.id) === text(enrollment.class_id))
      const sourceLevel = text(sourceClass?.level).toLowerCase()
      const sourceOrder = numeric(sourceClass?.order_index)
      const targetClass = targetClasses.find((item) => numeric(item.order_index) === sourceOrder + 1) || targetClasses.find((item) => text(item.level).toLowerCase() === sourceLevel) || null
      const proposal: AcademicTransitionDecision = targetClass ? 'promote' : 'undecided'
      const targetCount = targetClass ? projectedByClass.get(text(targetClass.id)) || 0 : 0
      const capacityConflict = Boolean(targetClass && numeric(targetClass.capacity) > 0 && targetCount >= numeric(targetClass.capacity))
      const itemState = proposal === 'undecided' || capacityConflict ? 'review' : 'approved'
      const { error } = await db.from('angelcare360_governance_rollover_items').insert({
        school_id: schoolId,
        rollover_run_id: runId,
        student_id: studentId,
        source_class_id: enrollment.class_id,
        source_section_id: enrollment.section_id || null,
        decision: storedTransitionDecision(proposal),
        target_class_id: targetClass?.id || null,
        target_section_id: null,
        state: itemState,
        blocker_reason: proposal === 'undecided' ? 'Aucune classe cible disponible.' : capacityConflict ? 'Capacité de la classe cible à vérifier.' : null,
        proposal_json: { proposed_decision: proposal, capacity_conflict: capacityConflict, proposal_reason: targetClass ? 'Classe suivante déterminée par l’ordre des niveaux.' : 'Aucune destination automatique.' },
        result_json: {},
      })
      if (!error) {
        created += 1
        if (targetClass) projectedByClass.set(text(targetClass.id), targetCount + 1)
      }
    }
    const previousSummary = row(run.summary_json)
    await db.from('angelcare360_governance_rollover_runs').update({ state: 'review', summary_json: { ...previousSummary, generated: created, source_enrollment_count: sourceEnrollments.length, proposals_generated_at: now() }, updated_at: now() }).eq('school_id', schoolId).eq('id', runId)
    result = { created, sourceEnrollmentCount: sourceEnrollments.length }
    message = `${created} proposition(s) ont été préparées. Vérifiez les exceptions avant l’exécution.`
  } else if (request.actionKey === 'academic_transition.update_decision') {
    runId = required(runId, 'Le passage à l’année suivante')
    const itemId = required(request.transitionItemId, 'Le dossier de l’enfant')
    const decision = transitionDecision(payload.decision)
    const targetClassId = optionalText(payload.targetClassId)
    if (['promote', 'repeat', 'change_class', 'change_section', 'reenroll'].includes(decision) && !targetClassId) throw new Error('Sélectionnez la classe de destination.')
    const before = await safeRowById(db, 'angelcare360_governance_rollover_items', schoolId, itemId)
    if (text(before.rollover_run_id) !== runId) throw new Error('Ce dossier ne correspond pas au passage sélectionné.')
    const proposal = { ...row(before.proposal_json), proposed_decision: decision, decision_reason: reason, capacity_conflict: boolean(payload.capacityConflict), owner_label: optionalText(payload.ownerLabel), decided_by: userId, decided_at: now() }
    const { data, error } = await db.from('angelcare360_governance_rollover_items').update({
      decision: storedTransitionDecision(decision),
      target_class_id: targetClassId,
      target_section_id: optionalText(payload.targetSectionId),
      state: decision === 'undecided' ? 'review' : 'approved',
      blocker_reason: decision === 'undecided' ? 'Une décision reste nécessaire.' : boolean(payload.capacityConflict) ? 'Capacité de la classe cible à vérifier.' : null,
      proposal_json: proposal,
      updated_at: now(),
    }).eq('school_id', schoolId).eq('rollover_run_id', runId).eq('id', itemId).select('*').single()
    if (error) throw new Error('La décision de passage n’a pas pu être enregistrée.')
    result = row(data)
    message = 'La destination de l’enfant a été mise à jour.'
  } else if (request.actionKey === 'academic_transition.bulk_approve') {
    runId = required(runId, 'Le passage à l’année suivante')
    const items = await safeRows(db, 'angelcare360_governance_rollover_items', schoolId, { order: 'updated_at', ascending: true, limit: 30000 })
    let approved = 0
    for (const item of items.filter((entry) => text(entry.rollover_run_id) === runId && ['proposed', 'review'].includes(text(entry.state)))) {
      const proposal = row(item.proposal_json)
      if (transitionDecision(proposal.proposed_decision || item.decision) === 'undecided' || boolean(proposal.capacity_conflict)) continue
      const { error } = await db.from('angelcare360_governance_rollover_items').update({ state: 'approved', blocker_reason: null, updated_at: now() }).eq('school_id', schoolId).eq('id', text(item.id))
      if (!error) approved += 1
    }
    result = { approved }
    message = `${approved} proposition(s) valides ont été approuvées.`
  } else if (request.actionKey === 'academic_transition.execute' || request.actionKey === 'academic_transition.retry_item') {
    runId = required(runId, 'Le passage à l’année suivante')
    const run = await safeRowById(db, 'angelcare360_governance_rollover_runs', schoolId, runId)
    const allItems = await safeRows(db, 'angelcare360_governance_rollover_items', schoolId, { order: 'updated_at', ascending: true, limit: 30000 })
    const selected = allItems.filter((item) => text(item.rollover_run_id) === runId && (request.actionKey === 'academic_transition.retry_item' ? (request.transitionItemId ? text(item.id) === text(request.transitionItemId) : text(item.state) === 'failed') : text(item.state) === 'approved'))
    if (!selected.length) throw new Error(request.actionKey === 'academic_transition.retry_item' ? 'Aucun dossier en échec n’est disponible pour une nouvelle tentative.' : 'Aucune décision approuvée n’est prête à être appliquée.')
    const runSummary = row(run.summary_json)
    await db.from('angelcare360_governance_rollover_runs').update({ state: 'executing', summary_json: { ...runSummary, execution_started_at: now() }, updated_at: now() }).eq('school_id', schoolId).eq('id', runId)
    const outcomes: Array<{ id: string; ok: boolean; message?: string }> = []
    for (const item of selected) {
      const itemId = text(item.id)
      const proposal = row(item.proposal_json)
      const decision = transitionDecision(proposal.proposed_decision || item.decision)
      const executionId = randomUUID()
      try {
        if (decision === 'undecided') throw new Error('Une décision finale est nécessaire.')
        const targetClassId = optionalText(item.target_class_id)
        const needsTarget = ['promote', 'repeat', 'change_class', 'change_section', 'reenroll'].includes(decision)
        if (needsTarget && !targetClassId) throw new Error('La classe de destination est manquante.')
        if (needsTarget) {
          const { data: existingEnrollment, error: existingError } = await db.from('angelcare360_class_enrollments').select('*').eq('school_id', schoolId).eq('student_id', item.student_id).eq('academic_year_id', run.target_academic_year_id).maybeSingle()
          if (existingError) throw new Error('Le dossier d’inscription cible ne peut pas être vérifié.')
          if (existingEnrollment) {
            const { error } = await db.from('angelcare360_class_enrollments').update({ class_id: targetClassId, section_id: item.target_section_id || null, enrollment_status: 'enrolled', status: 'active', promoted_from_class_id: item.source_class_id || null, transfer_reason: reason, updated_by: userId, updated_at: now(), metadata_json: { ...row(row(existingEnrollment).metadata_json), area2_rollover_run_id: runId, transition_decision: decision, execution_id: executionId } }).eq('school_id', schoolId).eq('id', row(existingEnrollment).id)
            if (error) throw new Error('L’inscription cible n’a pas pu être mise à jour.')
          } else {
            const { error } = await db.from('angelcare360_class_enrollments').insert({ school_id: schoolId, academic_year_id: run.target_academic_year_id, student_id: item.student_id, class_id: targetClassId, section_id: item.target_section_id || null, enrollment_status: 'enrolled', enrolled_on: dateOnly(), promoted_from_class_id: item.source_class_id || null, transfer_reason: reason, status: 'active', metadata_json: { area2_rollover_run_id: runId, transition_decision: decision, execution_id: executionId }, created_by: userId, updated_by: userId })
            if (error) throw new Error('La nouvelle inscription n’a pas pu être créée.')
          }
          await db.from('angelcare360_class_enrollments').update({ status: 'inactive', left_on: dateOnly(), transfer_reason: `Passage vers ${text(run.target_academic_year_id)}`, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('student_id', item.student_id).eq('academic_year_id', run.source_academic_year_id).eq('status', 'active')
          await db.from('angelcare360_students').update({ current_class_id: targetClassId, current_section_id: item.target_section_id || null, admission_status: 'enrolled', status: 'active', updated_by: userId, updated_at: now(), metadata_json: { area2_rollover_run_id: runId, transition_decision: decision, execution_id: executionId } }).eq('school_id', schoolId).eq('id', item.student_id)
        } else if (decision === 'withdraw' || decision === 'graduate') {
          await db.from('angelcare360_class_enrollments').update({ status: 'inactive', left_on: dateOnly(), transfer_reason: decision, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('student_id', item.student_id).eq('academic_year_id', run.source_academic_year_id).eq('status', 'active')
          await db.from('angelcare360_students').update({ admission_status: decision === 'graduate' ? 'graduated' : 'withdrawn', status: 'inactive', exit_date: dateOnly(), updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', item.student_id)
        } else if (decision === 'suspend' || decision === 'change_institution') {
          await db.from('angelcare360_class_enrollments').update({ status: 'inactive', left_on: dateOnly(), transfer_reason: decision, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('student_id', item.student_id).eq('academic_year_id', run.source_academic_year_id).eq('status', 'active')
          await db.from('angelcare360_students').update({ status: 'inactive', updated_by: userId, updated_at: now(), metadata_json: { area2_rollover_run_id: runId, transition_decision: decision, execution_id: executionId } }).eq('school_id', schoolId).eq('id', item.student_id)
        }
        const { error } = await db.from('angelcare360_governance_rollover_items').update({ state: 'completed', execution_id: executionId, executed_at: now(), blocker_reason: null, result_json: { ok: true, decision, target_academic_year_id: run.target_academic_year_id, target_class_id: targetClassId, executed_at: now() }, updated_at: now() }).eq('school_id', schoolId).eq('id', itemId)
        if (error) throw new Error('Le résultat individuel n’a pas pu être enregistré.')
        outcomes.push({ id: itemId, ok: true })
      } catch (problem) {
        const failure = problem instanceof Error ? problem.message : 'Le passage n’a pas pu être terminé.'
        await db.from('angelcare360_governance_rollover_items').update({ state: 'failed', blocker_reason: failure, result_json: { ok: false, message: failure, failed_at: now() }, updated_at: now() }).eq('school_id', schoolId).eq('id', itemId)
        outcomes.push({ id: itemId, ok: false, message: failure })
      }
    }
    const failed = outcomes.filter((item) => !item.ok).length
    const state = failed ? 'partially_failed' : 'completed'
    const summary = { ...runSummary, total: outcomes.length, failed, completed: outcomes.length - failed, executed_at: now() }
    await db.from('angelcare360_governance_rollover_runs').update({ state, executed_by: userId, executed_at: now(), summary_json: summary, updated_at: now() }).eq('school_id', schoolId).eq('id', runId)
    result = { outcomes, failed, completed: outcomes.length - failed }
    message = failed ? `Passage terminé avec ${failed} dossier(s) à corriger.` : `${outcomes.length} enfant(s) ont été transférés correctement.`
    if (failed) {
      await storeReceipt(db, { schoolId, actionKey: request.actionKey, key, academicYearId: yearId, transitionRunId: runId, message, result, userId })
      return { ok: true, state: 'partially_failed', message, academicYearId: yearId, transitionRunId: runId, result }
    }
  } else if (request.actionKey === 'academic_transition.verify' || request.actionKey === 'academic_transition.complete') {
    runId = required(runId, 'Le passage à l’année suivante')
    const snapshot = await getAcademicStructureSnapshot()
    const run = snapshot.transitionRuns.find((item) => item.id === runId)
    if (!run) throw new Error('Le passage demandé est introuvable.')
    const blockers = [run.decisionRequired ? `${run.decisionRequired} décision(s) restent à prendre.` : null, run.capacityConflicts ? `${run.capacityConflicts} conflit(s) de capacité restent présents.` : null, run.failedItems ? `${run.failedItems} dossier(s) doivent être réparés.` : null].filter(Boolean) as string[]
    if (blockers.length) return { ok: true, state: 'blocked', message: 'Le passage ne peut pas encore être terminé.', transitionRunId: runId, blockers }
    const before = await safeRowById(db, 'angelcare360_governance_rollover_runs', schoolId, runId)
    const summary = { ...row(before.summary_json), verified_at: now(), verified_by: userId, verified_by_label: context.user.full_name || context.user.name || context.user.email || 'Direction', completed_at: request.actionKey === 'academic_transition.complete' ? now() : row(before.summary_json).completed_at }
    const { data, error } = await db.from('angelcare360_governance_rollover_runs').update({ state: 'completed', summary_json: summary, updated_at: now() }).eq('school_id', schoolId).eq('id', runId).select('*').single()
    if (error) throw new Error('La vérification finale n’a pas pu être enregistrée.')
    result = row(data)
    message = request.actionKey === 'academic_transition.verify' ? 'Le passage a été vérifié. Tous les enfants disposent d’un résultat explicite.' : 'Le passage à l’année suivante est terminé.'
  } else if (request.actionKey.startsWith('academic_task.')) {
    yearId = required(yearId, 'L’année scolaire')
    if (request.actionKey === 'academic_task.assign' && !request.taskId) {
      const title = required(payload.title, 'Le titre de la tâche')
      const { data, error } = await db.from('angelcare360_academic_structure_tasks').insert({ school_id: schoolId, academic_year_id: yearId, period_id: periodId, transition_run_id: runId, title, description: optionalText(payload.description), state: optionalText(payload.ownerLabel) ? 'assigned' : 'open', priority: optionalText(payload.priority) || 'normal', owner_user_id: optionalText(payload.ownerUserId), owner_label: optionalText(payload.ownerLabel), due_at: optionalText(payload.dueAt), created_by: userId, updated_by: userId }).select('*').single()
      if (error) throw new Error('La tâche n’a pas pu être créée.')
      result = row(data); message = optionalText(payload.ownerLabel) ? `La tâche a été attribuée à ${text(payload.ownerLabel)}.` : 'La tâche a été ajoutée au dossier.'
    } else {
      const taskId = required(request.taskId, 'La tâche')
      const stateMap: Partial<Record<AcademicStructureActionKey, string>> = { 'academic_task.start': 'in_progress', 'academic_task.complete': 'completed', 'academic_task.reopen': 'reopened', 'academic_task.assign': 'assigned' }
      const update: Row = { state: stateMap[request.actionKey], updated_by: userId, updated_at: now() }
      if (request.actionKey === 'academic_task.assign') Object.assign(update, { owner_user_id: optionalText(payload.ownerUserId), owner_label: optionalText(payload.ownerLabel), due_at: optionalText(payload.dueAt) })
      if (request.actionKey === 'academic_task.complete') Object.assign(update, { completed_by: userId, completed_at: now(), completion_note: reason })
      const { data, error } = await db.from('angelcare360_academic_structure_tasks').update(update).eq('school_id', schoolId).eq('id', taskId).select('*').single()
      if (error) throw new Error('La tâche n’a pas pu être mise à jour.')
      result = row(data); message = request.actionKey === 'academic_task.complete' ? 'La tâche est terminée.' : request.actionKey === 'academic_task.reopen' ? 'La tâche a été réouverte.' : request.actionKey === 'academic_task.start' ? 'La tâche est maintenant en cours.' : 'La responsabilité a été mise à jour.'
    }
  } else if (request.actionKey === 'academic_note.add') {
    yearId = required(yearId, 'L’année scolaire')
    const body = required(payload.body, 'La note')
    const { data, error } = await db.from('angelcare360_academic_structure_notes').insert({ school_id: schoolId, academic_year_id: yearId, period_id: periodId, transition_run_id: runId, body, important: boolean(payload.important), author_user_id: userId, author_label: context.user.full_name || context.user.name || context.user.email || 'Équipe administrative' }).select('*').single()
    if (error) throw new Error('La note n’a pas pu être enregistrée.')
    result = row(data); message = 'La note a été ajoutée au dossier.'
  } else if (request.actionKey === 'academic_evidence.request' || request.actionKey === 'academic_exception.assign' || request.actionKey === 'academic_exception.resolve' || request.actionKey === 'academic_exception.reopen') {
    yearId = required(yearId, 'L’année scolaire')
    const title = request.actionKey === 'academic_evidence.request' ? optionalText(payload.title) || 'Justificatif à fournir' : optionalText(payload.title) || 'Élément académique à vérifier'
    const state = request.actionKey === 'academic_exception.resolve' ? 'completed' : request.actionKey === 'academic_exception.reopen' ? 'reopened' : optionalText(payload.ownerLabel) ? 'assigned' : 'open'
    const { data, error } = await db.from('angelcare360_academic_structure_tasks').insert({ school_id: schoolId, academic_year_id: yearId, period_id: periodId, transition_run_id: runId, title, description: optionalText(payload.description) || reason, state, priority: optionalText(payload.priority) || 'high', owner_user_id: optionalText(payload.ownerUserId), owner_label: optionalText(payload.ownerLabel), due_at: optionalText(payload.dueAt), source_type: request.actionKey.startsWith('academic_evidence') ? 'evidence' : 'exception', source_id: optionalText(payload.sourceId), created_by: userId, updated_by: userId }).select('*').single()
    if (error) throw new Error('L’élément n’a pas pu être enregistré.')
    result = row(data); message = request.actionKey === 'academic_evidence.request' ? 'La demande de justificatif a été ajoutée.' : 'L’élément à vérifier a été mis à jour.'
  } else {
    throw new Error('Cette action n’est pas encore disponible dans ce dossier.')
  }

  await storeReceipt(db, { schoolId, actionKey: request.actionKey, key, academicYearId: yearId, periodId, transitionRunId: runId, message, result, userId })
  return { ok: true, state: 'completed', message, academicYearId: yearId, periodId, transitionRunId: runId, result }
}

export async function getAcademicStructureDetail(id: string, kind: AcademicDossierKind) {
  const snapshot = await getAcademicStructureSnapshot()
  if (kind === 'academic_year') {
    const record = snapshot.years.find((item) => item.id === id)
    if (!record) throw new Angelcare360AccessError('L’année scolaire demandée est introuvable.', 404)
    return record
  }
  if (kind === 'period') {
    const record = snapshot.years.flatMap((item) => item.periods).find((item) => item.id === id)
    if (!record) throw new Angelcare360AccessError('La période demandée est introuvable.', 404)
    return record
  }
  const record = snapshot.transitionRuns.find((item) => item.id === id)
  if (!record) throw new Angelcare360AccessError('Le passage demandé est introuvable.', 404)
  return record
}
