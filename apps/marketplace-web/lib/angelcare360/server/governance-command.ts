import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import { actionsForGovernanceMatter, governanceTone, operationDefinition } from '@/data/angelcare360/governance-command'
import type {
  GovernanceAcademicYearRecord,
  GovernanceAssignmentRecord,
  GovernanceBriefing,
  GovernanceCapacityRecord,
  GovernanceCommandResult,
  GovernanceCommandSnapshot,
  GovernanceConfigurationRecord,
  GovernanceCreateRequest,
  GovernanceDelegationRecord,
  GovernanceEntityActionRequest,
  GovernanceEntityRecord,
  GovernanceEntityType,
  GovernanceInstitutionRecord,
  GovernanceLinkedRecord,
  GovernanceMatter,
  GovernanceMatterActionRequest,
  GovernanceMatterState,
  GovernanceRoleRecord,
  GovernanceSeverity,
  GovernanceSubjectRecord,
  GovernanceTimelineEvent,
  GovernanceTone,
} from '@/types/angelcare360/governance-command'

type Db = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

const ACTIVE_ACCESS = new Set(['super_admin', 'direction', 'administration', 'qualite'])
const APPROVAL_ACCESS = new Set(['super_admin', 'direction', 'administration'])
const ACCESS_ADMIN = new Set(['super_admin', 'direction', 'administration'])
const TERMINAL_STATES = new Set<GovernanceMatterState>(['resolved', 'released', 'cancelled'])

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
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return fallback
}

function arrayStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function now() {
  return new Date().toISOString()
}

function dateOnly(value = new Date()) {
  return value.toISOString().slice(0, 10)
}

function stableHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function idempotency(input: unknown, fallback: unknown) {
  return optionalText(input) || stableHash(fallback)
}

function code(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function required(payload: Row, key: string, label: string) {
  const value = optionalText(payload[key])
  if (!value) throw new Error(`${label} est requis.`)
  return value
}

function toneForStatus(status: string): GovernanceTone {
  if (['active', 'published', 'ready', 'completed', 'closed', 'verified'].includes(status)) return 'verified'
  if (['blocked', 'failed', 'overcapacity', 'expired'].includes(status)) return 'critical'
  if (['suspended', 'warning', 'incomplete', 'draft', 'planned'].includes(status)) return 'warning'
  if (['review', 'decision_required', 'approval_required'].includes(status)) return 'decision'
  return 'active'
}

async function requireGovernanceContext(options?: { approve?: boolean; accessAdmin?: boolean }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Établissement actif introuvable.', 403)
  if (!ACTIVE_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('Le workspace Gouvernance est réservé aux autorités institutionnelles.', 403)
  if (options?.approve && !APPROVAL_ACCESS.has(context.access.accessLevel)) throw new Angelcare360AccessError('Cette opération exige une autorité institutionnelle.', 403)
  if (options?.accessAdmin && !ACCESS_ADMIN.has(context.access.accessLevel)) throw new Angelcare360AccessError('La gouvernance des accès exige une autorité déléguée.', 403)
  return context
}

async function safeRows(db: Db, table: string, schoolId: string, options?: { order?: string; ascending?: boolean; limit?: number }) {
  try {
    let query = db.from(table).select('*').eq('school_id', schoolId)
    if (options?.order) query = query.order(options.order, { ascending: options.ascending ?? false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    if (error) return []
    return rows(data)
  } catch {
    return []
  }
}

async function safeAllRows(db: Db, table: string, options?: { order?: string; ascending?: boolean; limit?: number }) {
  try {
    let query = db.from(table).select('*')
    if (options?.order) query = query.order(options.order, { ascending: options.ascending ?? false })
    if (options?.limit) query = query.limit(options.limit)
    const { data, error } = await query
    if (error) return []
    return rows(data)
  } catch {
    return []
  }
}

async function safeCount(db: Db, table: string, schoolId: string, filters: Array<[string, unknown]> = []) {
  try {
    let query = db.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)
    for (const [column, value] of filters) query = query.eq(column, value as never)
    const { count, error } = await query
    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

async function audit(input: {
  schoolId: string
  module: string
  action: string
  entityType: string
  entityId?: string | null
  before?: Row
  after?: Row
  metadata?: Row
  severity?: 'info' | 'notice' | 'warning' | 'critical'
}) {
  return recordAngelcare360AuditEventServer({
    schoolId: input.schoolId,
    module: input.module,
    action: input.action,
    category: 'settings',
    entityType: input.entityType,
    entityId: input.entityId || null,
    beforeData: input.before || {},
    afterData: input.after || {},
    metadata: input.metadata || {},
    severity: input.severity || 'info',
  })
}

function exactHref(type: GovernanceEntityType | string, id: string, drawer = 'dossier') {
  const base: Record<string, string> = {
    institution: '/angelcare-360-command-center/administration/etablissements',
    academic_year: '/angelcare-360-command-center/administration/annees-scolaires',
    term: '/angelcare-360-command-center/administration/periodes',
    class: '/angelcare-360-command-center/administration/classes',
    section: '/angelcare-360-command-center/administration/sections',
    subject: '/angelcare-360-command-center/administration/matieres',
    assignment: '/angelcare-360-command-center/administration/affectations',
    role: '/angelcare-360-command-center/administration/roles-permissions',
    delegation: '/angelcare-360-command-center/administration/roles-permissions',
    configuration: '/angelcare-360-command-center/administration/parametres',
    audit_event: '/angelcare-360-command-center/administration/audit',
    rollover: '/angelcare-360-command-center/administration?plane=academic-structure',
    matter: '/angelcare-360-command-center/administration',
  }
  const root = base[type] || '/angelcare-360-command-center/administration'
  const separator = root.includes('?') ? '&' : '?'
  return `${root}${separator}entity=${encodeURIComponent(id)}&drawer=${encodeURIComponent(drawer)}&source=governance`
}

function linkedRecord(type: GovernanceEntityType | string, record: Row, labelKey = 'name'): GovernanceLinkedRecord {
  const id = text(record.id)
  return {
    id,
    type,
    label: text(record[labelKey] || record.label || record.full_name || record.title || id),
    secondary: optionalText(record.code || record.school_code || record.year_code || record.class_code || record.subject_code || record.role_key),
    status: optionalText(record.status),
    exactHref: exactHref(type, id),
  }
}

function matterLane(category: GovernanceMatter['category'], severity: GovernanceSeverity, state: GovernanceMatterState) {
  if (TERMINAL_STATES.has(state)) return 'resolved' as const
  if (state === 'decision_required' || state === 'approved_execution') return 'decision' as const
  if (category === 'activation' || category === 'closure') return 'activation' as const
  if (['capacity', 'assignment', 'subject_coverage', 'rollover'].includes(category) || severity === 'critical') return 'conflict' as const
  return 'publication' as const
}

function projectionFor(map: Map<string, Row>, fingerprint: string) {
  return map.get(fingerprint) || {}
}

function buildMatter(input: {
  projection: Row
  fingerprint: string
  title: string
  summary: string
  category: GovernanceMatter['category']
  sourceType: string
  sourceId: string
  sourceLabel: string
  severity: GovernanceSeverity
  exactHref: string
  linkedRecords?: GovernanceLinkedRecord[]
  impact?: Partial<GovernanceMatter['impact']>
  metadata?: Row
}): GovernanceMatter {
  const state = text(input.projection.state, 'new') as GovernanceMatterState
  const severity = text(input.projection.severity, input.severity) as GovernanceSeverity
  return {
    id: text(input.projection.id, input.fingerprint),
    fingerprint: input.fingerprint,
    title: text(input.projection.title, input.title),
    summary: text(input.projection.summary, input.summary),
    category: input.category,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceLabel: input.sourceLabel,
    state,
    severity,
    tone: governanceTone(severity, state),
    lane: matterLane(input.category, severity, state),
    ownerUserId: optionalText(input.projection.owner_user_id),
    ownerLabel: optionalText(input.projection.owner_label),
    dueAt: optionalText(input.projection.due_at),
    detectedAt: text(input.projection.detected_at, now()),
    updatedAt: text(input.projection.updated_at, now()),
    acknowledgedAt: optionalText(input.projection.acknowledged_at),
    verifiedAt: optionalText(input.projection.verified_at),
    resolvedAt: optionalText(input.projection.resolved_at),
    resolutionReason: optionalText(input.projection.resolution_reason),
    exactHref: input.exactHref,
    availableActions: actionsForGovernanceMatter(state),
    impact: {
      institutions: numeric(input.impact?.institutions),
      students: numeric(input.impact?.students),
      staff: numeric(input.impact?.staff),
      classes: numeric(input.impact?.classes),
      operational: input.impact?.operational || null,
      financial: input.impact?.financial || null,
      dependencies: input.impact?.dependencies || [],
    },
    linkedRecords: input.linkedRecords || [],
    timeline: [],
    metadata: { ...(input.metadata || {}), ...row(input.projection.metadata_json) },
  }
}

async function loadProjectionMap(db: Db, schoolId: string) {
  const projections = await safeRows(db, 'angelcare360_governance_matters', schoolId, { order: 'updated_at', limit: 500 })
  return new Map(projections.map((item) => [text(item.fingerprint), item]))
}

async function loadMatterEvents(db: Db, schoolId: string, matterIds: string[]) {
  if (!matterIds.length) return new Map<string, GovernanceTimelineEvent[]>()
  try {
    const { data, error } = await db
      .from('angelcare360_governance_matter_events')
      .select('*')
      .eq('school_id', schoolId)
      .in('matter_id', matterIds)
      .order('created_at', { ascending: false })
      .limit(800)
    if (error) return new Map<string, GovernanceTimelineEvent[]>()
    const map = new Map<string, GovernanceTimelineEvent[]>()
    for (const event of rows(data)) {
      const matterId = text(event.matter_id)
      const current = map.get(matterId) || []
      current.push({
        id: text(event.id),
        label: text(event.label, text(event.event_type)),
        detail: optionalText(event.detail),
        actorLabel: optionalText(event.actor_label),
        createdAt: text(event.created_at, now()),
        tone: text(event.tone, 'neutral') as GovernanceTone,
        entityType: 'matter',
        entityId: matterId,
      })
      map.set(matterId, current)
    }
    return map
  } catch {
    return new Map<string, GovernanceTimelineEvent[]>()
  }
}

function readinessFor(input: {
  settings: Row | null
  academicYears: Row[]
  terms: Row[]
  classes: Row[]
  sections: Row[]
  subjects: Row[]
  assignments: Row[]
  roles: Row[]
  permissions: Row[]
}) {
  const requirements = [
    { key: 'settings', label: 'Paramètres institutionnels', passed: Boolean(input.settings) },
    { key: 'academic_year', label: 'Année scolaire active', passed: input.academicYears.some((item) => item.status === 'active') },
    { key: 'terms', label: 'Périodes configurées', passed: input.terms.length > 0 },
    { key: 'classes', label: 'Classes actives', passed: input.classes.some((item) => item.status === 'active') },
    { key: 'sections', label: 'Sections actives', passed: input.sections.some((item) => item.status === 'active') },
    { key: 'subjects', label: 'Matières actives', passed: input.subjects.some((item) => item.status === 'active') },
    { key: 'assignments', label: 'Affectations enseignants', passed: input.assignments.some((item) => item.status === 'active') },
    { key: 'roles', label: 'Rôles actifs', passed: input.roles.some((item) => item.status === 'active') },
    { key: 'permissions', label: 'Catalogue de permissions', passed: input.permissions.some((item) => item.status === 'active') },
  ]
  const passed = requirements.filter((item) => item.passed).length
  const blockers = requirements.filter((item) => !item.passed)
  return {
    requirements,
    passed,
    required: requirements.length,
    state: blockers.length === 0 ? 'ready' as const : blockers.length <= 2 ? 'ready_with_warnings' as const : blockers.length <= 4 ? 'incomplete' as const : 'blocked' as const,
    blockers,
  }
}

function mapActivity(events: Row[]): GovernanceTimelineEvent[] {
  return events.map((event) => ({
    id: text(event.id),
    label: `${text(event.module, 'Gouvernance')} · ${text(event.action, 'événement')}`,
    detail: optionalText(event.entity_type || event.request_id),
    actorLabel: optionalText(event.actor_role),
    createdAt: text(event.created_at, now()),
    tone: text(event.severity) === 'critical' ? 'critical' : text(event.severity) === 'warning' ? 'warning' : 'neutral',
    entityType: optionalText(event.entity_type),
    entityId: optionalText(event.entity_id),
  }))
}

async function synthesizeMatters(input: {
  projection: Map<string, Row>
  school: Row
  academicYears: Row[]
  terms: Row[]
  classes: Row[]
  sections: Row[]
  subjects: Row[]
  assignments: Row[]
  roles: Row[]
  rolePermissions: Row[]
  delegations: Row[]
  configurations: Row[]
  students: Row[]
  admissionApplications: Row[]
  readiness: ReturnType<typeof readinessFor>
}) {
  const matters: GovernanceMatter[] = []
  const schoolId = text(input.school.id)
  if (input.readiness.blockers.length) {
    const fingerprint = `institution-readiness:${schoolId}`
    matters.push(buildMatter({
      projection: projectionFor(input.projection, fingerprint),
      fingerprint,
      title: 'Readiness institutionnelle incomplète',
      summary: `${input.readiness.blockers.length} exigence(s) empêchent une posture institutionnelle complète.`,
      category: 'activation',
      sourceType: 'institution',
      sourceId: schoolId,
      sourceLabel: text(input.school.name),
      severity: input.readiness.state === 'blocked' ? 'critical' : 'high',
      exactHref: exactHref('institution', schoolId, 'readiness'),
      linkedRecords: [linkedRecord('institution', input.school)],
      impact: { institutions: 1, students: input.students.length, classes: input.classes.length, operational: input.readiness.blockers.map((item) => item.label).join(' · '), dependencies: input.readiness.blockers.map((item) => item.key) },
      metadata: { requirements: input.readiness.requirements },
    }))
  }

  const activeYear = input.academicYears.find((item) => item.status === 'active')
  if (!activeYear) {
    const fingerprint = `academic-year-active:${schoolId}`
    matters.push(buildMatter({
      projection: projectionFor(input.projection, fingerprint), fingerprint,
      title: 'Aucune année scolaire active', summary: 'Les opérations académiques ne disposent pas d’un contexte annuel actif.',
      category: 'academic_structure', sourceType: 'academic_year', sourceId: schoolId, sourceLabel: text(input.school.name),
      severity: 'critical', exactHref: '/angelcare-360-command-center/administration?plane=academic-structure&focus=years',
      linkedRecords: input.academicYears.slice(0, 3).map((item) => linkedRecord('academic_year', item, 'label')),
      impact: { institutions: 1, students: input.students.length, classes: input.classes.length, operational: 'Admissions, classes, présence et académique sans contexte annuel actif.', dependencies: ['academic_year'] },
    }))
  }

  for (const academicYear of input.academicYears.filter((item) => ['planned', 'active'].includes(text(item.status)))) {
    const yearTerms = input.terms.filter((item) => item.academic_year_id === academicYear.id)
    if (!yearTerms.length) {
      const fingerprint = `academic-year-terms:${text(academicYear.id)}`
      matters.push(buildMatter({
        projection: projectionFor(input.projection, fingerprint), fingerprint,
        title: `Périodes absentes · ${text(academicYear.label)}`,
        summary: 'La structure ne peut pas être publiée sans calendrier de périodes.',
        category: 'academic_structure', sourceType: 'academic_year', sourceId: text(academicYear.id), sourceLabel: text(academicYear.label),
        severity: text(academicYear.status) === 'active' ? 'high' : 'medium', exactHref: exactHref('academic_year', text(academicYear.id), 'periods'),
        linkedRecords: [linkedRecord('academic_year', academicYear, 'label')], impact: { institutions: 1, operational: 'Calendrier académique incomplet.', dependencies: ['terms'] },
      }))
    }
  }

  const enrollmentByClass = new Map<string, number>()
  for (const student of input.students.filter((item) => item.status === 'active')) {
    const classId = optionalText(student.current_class_id)
    if (classId) enrollmentByClass.set(classId, (enrollmentByClass.get(classId) || 0) + 1)
  }
  for (const classRecord of input.classes.filter((item) => item.status === 'active')) {
    const current = enrollmentByClass.get(text(classRecord.id)) || 0
    const capacity = numeric(classRecord.capacity)
    if (capacity > 0 && current > capacity) {
      const fingerprint = `class-overcapacity:${text(classRecord.id)}`
      matters.push(buildMatter({
        projection: projectionFor(input.projection, fingerprint), fingerprint,
        title: `Surcapacité · ${text(classRecord.name)}`,
        summary: `${current} élèves pour une capacité déclarée de ${capacity}.`, category: 'capacity', sourceType: 'class', sourceId: text(classRecord.id), sourceLabel: text(classRecord.name),
        severity: 'critical', exactHref: exactHref('class', text(classRecord.id), 'capacity'), linkedRecords: [linkedRecord('class', classRecord)],
        impact: { institutions: 1, students: current, classes: 1, operational: `${current - capacity} place(s) au-dessus de la capacité.`, dependencies: ['capacity', 'enrollment'] },
        metadata: { currentStudents: current, capacity },
      }))
    }
  }

  const assignmentBySubject = new Map<string, number>()
  const assignmentByComposite = new Map<string, Row[]>()
  for (const assignment of input.assignments.filter((item) => item.status === 'active')) {
    const subjectId = optionalText(assignment.subject_id)
    if (subjectId) assignmentBySubject.set(subjectId, (assignmentBySubject.get(subjectId) || 0) + 1)
    const key = `${text(assignment.staff_id)}:${text(assignment.class_id)}:${text(assignment.subject_id)}`
    assignmentByComposite.set(key, [...(assignmentByComposite.get(key) || []), assignment])
  }
  for (const subject of input.subjects.filter((item) => item.status === 'active')) {
    if ((assignmentBySubject.get(text(subject.id)) || 0) === 0) {
      const fingerprint = `subject-uncovered:${text(subject.id)}`
      matters.push(buildMatter({
        projection: projectionFor(input.projection, fingerprint), fingerprint,
        title: `Matière sans couverture · ${text(subject.name)}`,
        summary: 'Aucune affectation enseignante active ne couvre cette matière.', category: 'subject_coverage', sourceType: 'subject', sourceId: text(subject.id), sourceLabel: text(subject.name), severity: 'high',
        exactHref: exactHref('subject', text(subject.id), 'coverage'), linkedRecords: [linkedRecord('subject', subject)], impact: { institutions: 1, operational: 'Couverture pédagogique absente.', dependencies: ['teacher_assignment'] },
      }))
    }
  }
  for (const duplicateSet of [...assignmentByComposite.values()].filter((items) => items.length > 1)) {
    const first = duplicateSet[0]
    const fingerprint = `assignment-duplicate:${text(first.staff_id)}:${text(first.class_id)}:${text(first.subject_id)}`
    matters.push(buildMatter({
      projection: projectionFor(input.projection, fingerprint), fingerprint,
      title: 'Affectations potentiellement dupliquées', summary: `${duplicateSet.length} affectations actives partagent le même enseignant, la même classe et la même matière.`, category: 'assignment',
      sourceType: 'assignment', sourceId: text(first.id), sourceLabel: text(first.staff_id), severity: 'high', exactHref: exactHref('assignment', text(first.id), 'conflict'),
      linkedRecords: duplicateSet.map((item) => linkedRecord('assignment', item, 'assignment_role')), impact: { institutions: 1, staff: 1, classes: 1, operational: 'Charge ou couverture potentiellement comptée plusieurs fois.', dependencies: ['assignment'] },
    }))
  }

  const permissionByRole = new Map<string, number>()
  for (const item of input.rolePermissions) permissionByRole.set(text(item.role_id), (permissionByRole.get(text(item.role_id)) || 0) + 1)
  for (const roleRecord of input.roles.filter((item) => item.status === 'active')) {
    if ((permissionByRole.get(text(roleRecord.id)) || 0) === 0) {
      const fingerprint = `role-empty:${text(roleRecord.id)}`
      matters.push(buildMatter({
        projection: projectionFor(input.projection, fingerprint), fingerprint,
        title: `Rôle sans permission · ${text(roleRecord.label)}`,
        summary: 'Le rôle est actif mais ne possède aucune permission effective.', category: 'access', sourceType: 'role', sourceId: text(roleRecord.id), sourceLabel: text(roleRecord.label), severity: 'high',
        exactHref: exactHref('role', text(roleRecord.id), 'permissions'), linkedRecords: [linkedRecord('role', roleRecord, 'label')], impact: { institutions: 1, operational: 'Accès incohérent ou inutilisable.', dependencies: ['role_permissions'] },
      }))
    }
  }

  const timestamp = Date.now()
  for (const delegation of input.delegations.filter((item) => item.status === 'active' && item.ends_at && Date.parse(text(item.ends_at)) < timestamp)) {
    const fingerprint = `delegation-expired:${text(delegation.id)}`
    matters.push(buildMatter({
      projection: projectionFor(input.projection, fingerprint), fingerprint,
      title: `Délégation expirée · ${text(delegation.user_label, text(delegation.user_id))}`,
      summary: 'Une délégation temporaire reste active après sa date de fin.', category: 'access', sourceType: 'delegation', sourceId: text(delegation.id), sourceLabel: text(delegation.user_label), severity: 'critical',
      exactHref: exactHref('delegation', text(delegation.id), 'delegation'), linkedRecords: [linkedRecord('delegation', delegation, 'user_label')], impact: { institutions: 1, operational: 'Accès temporaire non révoqué.', dependencies: ['delegation'] },
    }))
  }

  for (const configuration of input.configurations.filter((item) => ['draft', 'approved', 'scheduled'].includes(text(item.status)))) {
    const fingerprint = `configuration-pending:${text(configuration.id)}`
    matters.push(buildMatter({
      projection: projectionFor(input.projection, fingerprint), fingerprint,
      title: `Configuration à publier · ${text(configuration.title, text(configuration.changeset_code))}`,
      summary: 'Un changeset validé ou en préparation attend sa publication.', category: 'configuration', sourceType: 'configuration', sourceId: text(configuration.id), sourceLabel: text(configuration.title), severity: text(configuration.status) === 'approved' ? 'medium' : 'low',
      exactHref: exactHref('configuration', text(configuration.id), 'changeset'), linkedRecords: [linkedRecord('configuration', configuration, 'title')], impact: { institutions: 1, operational: 'La configuration runtime ne reflète pas encore ce changement.', dependencies: ['configuration_publication'] },
    }))
  }

  const waitingAdmissions = input.admissionApplications.filter((item) => ['approved', 'waitlisted', 'in_review'].includes(text(item.status)))
  if (waitingAdmissions.length && input.classes.length === 0) {
    const fingerprint = `admissions-no-capacity:${schoolId}`
    matters.push(buildMatter({
      projection: projectionFor(input.projection, fingerprint), fingerprint,
      title: 'Admissions sans structure de placement', summary: `${waitingAdmissions.length} candidature(s) avancée(s) ne disposent d’aucune classe active.`, category: 'capacity', sourceType: 'institution', sourceId: schoolId, sourceLabel: text(input.school.name), severity: 'critical',
      exactHref: '/angelcare-360-command-center/administration?plane=classes-capacity&focus=admissions', linkedRecords: waitingAdmissions.slice(0, 5).map((item) => linkedRecord('matter', item, 'application_code')),
      impact: { institutions: 1, students: waitingAdmissions.length, operational: 'Conversion et affectation bloquées.', dependencies: ['classes', 'capacity'] },
    }))
  }

  return matters
}

function institutionRecord(input: {
  school: Row
  readiness: ReturnType<typeof readinessFor>
  students: Row[]
  classes: Row[]
  roles: Row[]
  matters: GovernanceMatter[]
  currentYear: Row | undefined
  siteCount: number
}): GovernanceInstitutionRecord {
  const capacity = input.classes.reduce((sum, item) => sum + numeric(item.capacity), 0)
  const activeStudents = input.students.filter((item) => item.status === 'active').length
  const metadata = row(input.school.metadata_json)
  return {
    id: text(input.school.id), type: 'institution', code: text(input.school.school_code), title: text(input.school.name), subtitle: [input.school.school_type, input.school.city].filter(Boolean).map(String).join(' · '),
    status: text(input.school.status), lifecycleState: text(metadata.governance_state, text(input.school.status)), tone: input.readiness.state === 'blocked' ? 'critical' : input.readiness.state === 'incomplete' ? 'warning' : toneForStatus(text(input.school.status)), exactHref: exactHref('institution', text(input.school.id)),
    createdAt: optionalText(input.school.created_at), updatedAt: optionalText(input.school.updated_at), metrics: [
      { label: 'Sites', value: String(input.siteCount) }, { label: 'Élèves actifs', value: String(activeStudents) }, { label: 'Capacité', value: String(capacity) }, { label: 'Findings', value: String(input.matters.filter((item) => item.sourceId === input.school.id).length), tone: input.matters.some((item) => item.sourceId === input.school.id && item.severity === 'critical') ? 'critical' : 'neutral' },
    ], metadata: { ...metadata, readinessRequirements: input.readiness.requirements }, city: optionalText(input.school.city), schoolType: text(input.school.school_type, 'ecole'), readinessState: input.readiness.state, readinessPassed: input.readiness.passed, readinessRequired: input.readiness.required,
    activeStudents, classCapacity: capacity, currentAcademicYearLabel: optionalText(input.currentYear?.label), administrators: input.roles.filter((item) => item.status === 'active').length, findings: input.matters.filter((item) => item.sourceId === input.school.id || item.impact.institutions > 0).length,
  }
}

function siteInstitutionRecord(site: Row, currentYear: Row | undefined): GovernanceInstitutionRecord {
  const metadata = row(site.metadata_json)
  const requirements = [
    { key: 'identity', label: 'Identité du site', passed: Boolean(text(site.site_code) && text(site.name)), blocking: true },
    { key: 'location', label: 'Localisation du site', passed: Boolean(optionalText(site.city)), blocking: true },
    { key: 'owner', label: 'Responsable de configuration', passed: Boolean(optionalText(metadata.setup_owner_label)), blocking: true },
    { key: 'academic_year', label: 'Année scolaire active', passed: Boolean(currentYear), blocking: true },
    { key: 'parent_institution', label: 'Institution de rattachement', passed: Boolean(site.school_id), blocking: true },
  ]
  const required = requirements.length
  const passed = requirements.filter((item) => item.passed).length
  const readinessState: GovernanceInstitutionRecord['readinessState'] = text(site.status) === 'suspended'
    ? 'blocked'
    : passed >= required
      ? 'ready'
      : passed >= Math.max(1, required - 1)
        ? 'ready_with_warnings'
        : 'incomplete'
  const capacity = numeric(metadata.capacity)
  const students = numeric(metadata.active_students)
  const findings = numeric(metadata.findings) + requirements.filter((item) => !item.passed).length
  return {
    id: text(site.id),
    type: 'institution',
    code: text(site.site_code),
    title: text(site.name),
    subtitle: [site.site_type, site.city].filter(Boolean).map(String).join(' · '),
    status: text(site.status, 'draft'),
    lifecycleState: text(metadata.governance_state, text(site.status, 'draft')),
    tone: readinessState === 'blocked' ? 'critical' : readinessState === 'incomplete' ? 'warning' : toneForStatus(text(site.status)),
    exactHref: `/angelcare-360-command-center/administration?plane=institutions&entity=${encodeURIComponent(text(site.id))}&type=institution&drawer=site&source=governance`,
    createdAt: optionalText(site.created_at),
    updatedAt: optionalText(site.updated_at),
    metrics: [
      { label: 'Type', value: text(site.site_type, 'site') },
      { label: 'Élèves actifs', value: String(students) },
      { label: 'Capacité', value: String(capacity) },
      { label: 'Findings', value: String(findings), tone: findings ? 'warning' : 'verified' },
    ],
    metadata: { ...metadata, rootInstitution: false, parentSchoolId: site.school_id, readinessRequirements: requirements },
    city: optionalText(site.city),
    schoolType: text(site.site_type, 'site'),
    readinessState,
    readinessPassed: passed,
    readinessRequired: required,
    activeStudents: students,
    classCapacity: capacity,
    currentAcademicYearLabel: optionalText(currentYear?.label),
    administrators: numeric(metadata.administrators),
    findings,
  }
}

function academicYearRecords(years: Row[], terms: Row[], classes: Row[], enrollments: Row[], matters: GovernanceMatter[]): GovernanceAcademicYearRecord[] {
  return years.map((year) => {
    const metadata = row(year.metadata_json)
    const yearId = text(year.id)
    const studentCount = new Set(enrollments.filter((item) => item.academic_year_id === yearId && item.status === 'active').map((item) => text(item.student_id))).size
    const blockers = matters.filter((item) => item.sourceId === yearId && !TERMINAL_STATES.has(item.state)).length
    return {
      id: yearId, type: 'academic_year', code: text(year.year_code), title: text(year.label), subtitle: `${text(year.starts_on)} → ${text(year.ends_on)}`,
      status: text(year.status), lifecycleState: text(metadata.governance_state, text(year.status)), tone: blockers ? 'warning' : toneForStatus(text(year.status)), exactHref: exactHref('academic_year', yearId), createdAt: optionalText(year.created_at), updatedAt: optionalText(year.updated_at),
      metrics: [{ label: 'Périodes', value: String(terms.filter((item) => item.academic_year_id === yearId).length) }, { label: 'Classes', value: String(classes.filter((item) => item.academic_year_id === yearId).length) }, { label: 'Élèves', value: String(studentCount) }, { label: 'Blockers', value: String(blockers), tone: blockers ? 'warning' : 'verified' }],
      metadata, startsOn: text(year.starts_on), endsOn: text(year.ends_on), isCurrent: boolean(year.is_current), termCount: terms.filter((item) => item.academic_year_id === yearId).length, classCount: classes.filter((item) => item.academic_year_id === yearId).length, studentCount, rolloverState: text(metadata.rollover_state, 'not_started'), closureBlockers: blockers,
    }
  })
}

function capacityRecords(classes: Row[], sections: Row[], students: Row[], admissions: Row[]): GovernanceCapacityRecord[] {
  const studentByClass = new Map<string, number>()
  const studentBySection = new Map<string, number>()
  for (const student of students.filter((item) => item.status === 'active')) {
    if (student.current_class_id) studentByClass.set(text(student.current_class_id), (studentByClass.get(text(student.current_class_id)) || 0) + 1)
    if (student.current_section_id) studentBySection.set(text(student.current_section_id), (studentBySection.get(text(student.current_section_id)) || 0) + 1)
  }
  const waitingByClass = new Map<string, number>()
  for (const application of admissions.filter((item) => ['in_review', 'approved', 'waitlisted'].includes(text(item.status)))) {
    if (application.class_id) waitingByClass.set(text(application.class_id), (waitingByClass.get(text(application.class_id)) || 0) + 1)
  }
  const classRecords: GovernanceCapacityRecord[] = classes.map((item) => {
    const capacity = numeric(item.capacity)
    const current = studentByClass.get(text(item.id)) || 0
    const reserved = numeric(row(item.metadata_json).reserved_seats)
    const available = Math.max(0, capacity - current - reserved)
    const percent = capacity > 0 ? Math.round(current * 100 / capacity) : 0
    const conflictState = capacity <= 0 ? 'unconfigured' : current > capacity ? 'overcapacity' : percent >= 90 ? 'warning' : 'stable'
    return {
      id: text(item.id), type: 'class', code: text(item.class_code), title: text(item.name), subtitle: text(item.level), status: text(item.status), lifecycleState: text(row(item.metadata_json).governance_state, text(item.status)), tone: conflictState === 'overcapacity' ? 'critical' : conflictState === 'warning' || conflictState === 'unconfigured' ? 'warning' : 'verified', exactHref: exactHref('class', text(item.id), 'capacity'), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at),
      metrics: [{ label: 'Occupation', value: `${current}/${capacity}` }, { label: 'Disponible', value: String(available) }, { label: 'Attente', value: String(waitingByClass.get(text(item.id)) || 0) }], metadata: row(item.metadata_json), institutionId: text(item.school_id), academicYearId: text(item.academic_year_id), classId: null, level: optionalText(item.level), targetCapacity: capacity, currentStudents: current, reservedSeats: reserved, availableSeats: available, utilizationPercent: percent, waitingAdmissions: waitingByClass.get(text(item.id)) || 0, rolloverProposals: 0, conflictState,
    }
  })
  const sectionRecords: GovernanceCapacityRecord[] = sections.map((item) => {
    const capacity = numeric(item.capacity)
    const current = studentBySection.get(text(item.id)) || 0
    const reserved = numeric(row(item.metadata_json).reserved_seats)
    const available = Math.max(0, capacity - current - reserved)
    const percent = capacity > 0 ? Math.round(current * 100 / capacity) : 0
    const conflictState = capacity <= 0 ? 'unconfigured' : current > capacity ? 'overcapacity' : percent >= 90 ? 'warning' : 'stable'
    return {
      id: text(item.id), type: 'section', code: text(item.section_code), title: text(item.name), subtitle: optionalText(item.room) || 'Section', status: text(item.status), lifecycleState: text(row(item.metadata_json).governance_state, text(item.status)), tone: conflictState === 'overcapacity' ? 'critical' : conflictState === 'warning' || conflictState === 'unconfigured' ? 'warning' : 'verified', exactHref: exactHref('section', text(item.id), 'capacity'), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at),
      metrics: [{ label: 'Occupation', value: `${current}/${capacity}` }, { label: 'Disponible', value: String(available) }], metadata: row(item.metadata_json), institutionId: text(item.school_id), academicYearId: text(item.academic_year_id), classId: optionalText(item.class_id), level: null, targetCapacity: capacity, currentStudents: current, reservedSeats: reserved, availableSeats: available, utilizationPercent: percent, waitingAdmissions: 0, rolloverProposals: 0, conflictState,
    }
  })
  return [...classRecords, ...sectionRecords]
}

function subjectRecords(subjects: Row[], links: Row[], assignments: Row[]): GovernanceSubjectRecord[] {
  return subjects.map((item) => {
    const subjectId = text(item.id)
    const linkedClasses = new Set(links.filter((link) => link.subject_id === subjectId && link.status === 'active').map((link) => text(link.class_id))).size
    const teacherAssignments = assignments.filter((assignment) => assignment.subject_id === subjectId && assignment.status === 'active').length
    const state = text(item.status) !== 'active' ? 'inactive' : teacherAssignments === 0 ? 'uncovered' : linkedClasses === 0 ? 'partial' : 'covered'
    const metadata = row(item.metadata_json)
    return {
      id: subjectId, type: 'subject', code: text(item.subject_code), title: text(item.name), subtitle: optionalText(item.department) || optionalText(item.short_name) || 'Matière', status: text(item.status), lifecycleState: text(metadata.governance_state, text(item.status)), tone: state === 'covered' ? 'verified' : state === 'uncovered' ? 'critical' : state === 'partial' ? 'warning' : 'neutral', exactHref: exactHref('subject', subjectId, 'coverage'), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at),
      metrics: [{ label: 'Classes', value: String(linkedClasses) }, { label: 'Affectations', value: String(teacherAssignments) }, { label: 'Version', value: `V${numeric(metadata.version_number, 1)}` }], metadata, department: optionalText(item.department), linkedClasses, teacherAssignments, coverageState: state, versionNumber: numeric(metadata.version_number, 1),
    }
  })
}

function assignmentRecords(assignments: Row[]): GovernanceAssignmentRecord[] {
  const composites = new Map<string, number>()
  for (const item of assignments.filter((assignment) => assignment.status === 'active')) {
    const key = `${text(item.staff_id)}:${text(item.class_id)}:${text(item.subject_id)}`
    composites.set(key, (composites.get(key) || 0) + 1)
  }
  return assignments.map((item) => {
    const staff = Array.isArray(item.staff) ? row(item.staff[0]) : row(item.staff)
    const classRecord = Array.isArray(item.class) ? row(item.class[0]) : row(item.class)
    const section = Array.isArray(item.section) ? row(item.section[0]) : row(item.section)
    const subject = Array.isArray(item.subject) ? row(item.subject[0]) : row(item.subject)
    const key = `${text(item.staff_id)}:${text(item.class_id)}:${text(item.subject_id)}`
    const conflicts = Math.max(0, (composites.get(key) || 0) - 1)
    return {
      id: text(item.id), type: 'assignment', code: text(item.assignment_role, 'teacher'), title: text(staff.full_name, text(item.staff_id)), subtitle: [classRecord.name, subject.name].filter(Boolean).map(String).join(' · '), status: text(item.status), lifecycleState: text(row(item.metadata_json).governance_state, text(item.status)), tone: conflicts ? 'critical' : toneForStatus(text(item.status)), exactHref: exactHref('assignment', text(item.id), conflicts ? 'conflict' : 'dossier'), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at),
      metrics: [{ label: 'Classe', value: text(classRecord.name, '—') }, { label: 'Matière', value: text(subject.name, '—') }, { label: 'Charge', value: `${numeric(item.weekly_hours)} h` }, { label: 'Conflits', value: String(conflicts), tone: conflicts ? 'critical' : 'verified' }], metadata: row(item.metadata_json), staffId: text(item.staff_id), staffLabel: text(staff.full_name, text(item.staff_id)), classId: optionalText(item.class_id), classLabel: optionalText(classRecord.name), sectionId: optionalText(item.section_id), sectionLabel: optionalText(section.name), subjectId: optionalText(item.subject_id), subjectLabel: optionalText(subject.name), weeklyHours: numeric(item.weekly_hours), effectiveFrom: optionalText(item.assigned_from), effectiveTo: optionalText(item.assigned_to), conflictCount: conflicts,
    }
  })
}

function roleRecords(roles: Row[], rolePermissions: Row[], userRoles: Row[]): GovernanceRoleRecord[] {
  return roles.map((item) => {
    const roleId = text(item.id)
    const permissions = rolePermissions.filter((permission) => permission.role_id === roleId)
    const sensitive = permissions.filter((permission) => /finance|paie|securite|audit|export|approve/i.test(text(permission.permission_key))).length
    const metadata = row(item.metadata_json)
    return {
      id: roleId, type: 'role', code: text(item.role_key), title: text(item.label), subtitle: optionalText(item.description) || text(item.scope), status: text(item.status), lifecycleState: text(metadata.governance_state, text(item.status)), tone: text(item.status) === 'active' && permissions.length ? 'verified' : permissions.length === 0 ? 'critical' : toneForStatus(text(item.status)), exactHref: exactHref('role', roleId, 'permissions'), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at),
      metrics: [{ label: 'Permissions', value: String(permissions.length) }, { label: 'Utilisateurs', value: String(userRoles.filter((assignment) => assignment.role_id === roleId && assignment.status === 'active').length) }, { label: 'Sensibles', value: String(sensitive), tone: sensitive ? 'decision' : 'neutral' }, { label: 'Version', value: `V${numeric(metadata.version_number, 1)}` }], metadata, roleKey: text(item.role_key), scope: text(item.scope), permissionCount: permissions.length, userCount: userRoles.filter((assignment) => assignment.role_id === roleId && assignment.status === 'active').length, sensitivePermissionCount: sensitive, versionNumber: numeric(metadata.version_number, 1), systemLocked: boolean(item.is_system_locked),
    }
  })
}

function delegationRecords(delegations: Row[]): GovernanceDelegationRecord[] {
  return delegations.map((item) => ({
    id: text(item.id), type: 'delegation', code: text(item.delegation_code), title: text(item.user_label, text(item.user_id)), subtitle: `${text(item.role_label, text(item.role_id))} · ${text(item.scope_type, 'school')}`, status: text(item.status), lifecycleState: text(item.status), tone: text(item.status) === 'active' && item.ends_at && Date.parse(text(item.ends_at)) < Date.now() ? 'critical' : toneForStatus(text(item.status)), exactHref: exactHref('delegation', text(item.id)), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at),
    metrics: [{ label: 'Début', value: text(item.starts_at).slice(0, 10) }, { label: 'Fin', value: optionalText(item.ends_at)?.slice(0, 10) || 'Sans fin' }, { label: 'Revue', value: optionalText(item.review_at)?.slice(0, 10) || '—' }], metadata: row(item.metadata_json), userId: text(item.user_id), userLabel: text(item.user_label, text(item.user_id)), roleId: text(item.role_id), roleLabel: text(item.role_label, text(item.role_id)), scopeType: text(item.scope_type, 'school'), scopeId: optionalText(item.scope_id), startsAt: text(item.starts_at), endsAt: optionalText(item.ends_at), reviewAt: optionalText(item.review_at),
  }))
}

function configurationRecords(changesets: Row[], versions: Row[]): GovernanceConfigurationRecord[] {
  const result: GovernanceConfigurationRecord[] = changesets.map((item) => ({
    id: text(item.id), type: 'configuration', code: text(item.changeset_code), title: text(item.title), subtitle: text(item.configuration_key), status: text(item.status), lifecycleState: text(item.status), tone: toneForStatus(text(item.status)), exactHref: exactHref('configuration', text(item.id), 'changeset'), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at), metrics: [{ label: 'Ownership', value: text(item.ownership, 'tenant') }, { label: 'Changements', value: String(rows(item.changes_json).length) }, { label: 'Effective', value: optionalText(item.effective_at)?.slice(0, 10) || '—' }], metadata: row(item.metadata_json), configurationKey: text(item.configuration_key), ownership: text(item.ownership, 'tenant') as GovernanceConfigurationRecord['ownership'], versionNumber: numeric(item.version_number, 1), effectiveFrom: optionalText(item.effective_at), effectiveTo: null, currentValue: item.current_value, proposedValue: item.proposed_value, changeCount: rows(item.changes_json).length || numeric(item.change_count),
  }))
  for (const item of versions) {
    if (result.some((record) => record.configurationKey === item.configuration_key && record.status !== 'published')) continue
    result.push({
      id: text(item.id), type: 'configuration', code: text(item.version_code), title: text(item.label, text(item.configuration_key)), subtitle: text(item.configuration_key), status: text(item.status), lifecycleState: text(item.status), tone: toneForStatus(text(item.status)), exactHref: exactHref('configuration', text(item.id), 'version'), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at), metrics: [{ label: 'Ownership', value: text(item.ownership, 'tenant') }, { label: 'Version', value: `V${numeric(item.version_number, 1)}` }, { label: 'Effective', value: optionalText(item.effective_from)?.slice(0, 10) || '—' }], metadata: row(item.metadata_json), configurationKey: text(item.configuration_key), ownership: text(item.ownership, 'tenant') as GovernanceConfigurationRecord['ownership'], versionNumber: numeric(item.version_number, 1), effectiveFrom: optionalText(item.effective_from), effectiveTo: optionalText(item.effective_to), currentValue: item.value_json, proposedValue: null, changeCount: 0,
    })
  }
  return result
}

function genericEntity(type: GovernanceEntityType, item: Row, titleKey: string, codeKey: string, subtitle: string): GovernanceEntityRecord {
  return {
    id: text(item.id), type, code: text(item[codeKey]), title: text(item[titleKey]), subtitle, status: text(item.status), lifecycleState: text(row(item.metadata_json).governance_state, text(item.status)), tone: toneForStatus(text(item.status)), exactHref: exactHref(type, text(item.id)), createdAt: optionalText(item.created_at), updatedAt: optionalText(item.updated_at), metrics: [], metadata: row(item.metadata_json),
  }
}

export async function getGovernanceCommandSnapshot(): Promise<GovernanceCommandSnapshot> {
  const context = await requireGovernanceContext()
  const db = await createClient()
  const schoolId = context.school!.id
  const [
    schoolResult, settingsResult, academicYearsResult, termsResult, classesResult, sectionsResult, subjectsResult, classSubjectResult,
    assignmentsResult, rolesResult, permissionsResult, rolePermissionsResult, userRolesResult, staffResult, studentsResult, enrollmentsResult,
    admissionsResult, auditResult, sites, delegations, changesets, configVersions, briefings, projection,
  ] = await Promise.all([
    db.from('angelcare360_schools').select('*').eq('id', schoolId).single(),
    db.from('angelcare360_school_settings').select('*').eq('school_id', schoolId).maybeSingle(),
    db.from('angelcare360_academic_years').select('*').eq('school_id', schoolId).order('starts_on', { ascending: false }),
    db.from('angelcare360_terms').select('*').eq('school_id', schoolId).order('order_index'),
    db.from('angelcare360_classes').select('*').eq('school_id', schoolId).order('order_index'),
    db.from('angelcare360_sections').select('*').eq('school_id', schoolId).order('name'),
    db.from('angelcare360_subjects').select('*').eq('school_id', schoolId).order('name'),
    db.from('angelcare360_class_subjects').select('*').eq('school_id', schoolId),
    db.from('angelcare360_teacher_assignments').select('*,staff:angelcare360_staff(id,full_name,staff_code),class:angelcare360_classes(id,name,class_code),section:angelcare360_sections(id,name,section_code),subject:angelcare360_subjects(id,name,subject_code)').eq('school_id', schoolId).order('created_at', { ascending: false }),
    db.from('angelcare360_roles').select('*').eq('school_id', schoolId).order('label'),
    safeAllRows(db, 'angelcare360_permissions', { order: 'permission_key', ascending: true, limit: 1000 }),
    db.from('angelcare360_role_permissions').select('*'),
    db.from('angelcare360_user_roles').select('*').eq('school_id', schoolId),
    db.from('angelcare360_staff').select('id,portal_app_user_id,full_name,staff_code,staff_type,status').eq('school_id', schoolId).neq('status', 'archived').order('full_name'),
    db.from('angelcare360_students').select('*').eq('school_id', schoolId),
    db.from('angelcare360_class_enrollments').select('*').eq('school_id', schoolId),
    db.from('angelcare360_admission_applications').select('*').eq('school_id', schoolId),
    db.from('angelcare360_audit_logs').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(120),
    safeRows(db, 'angelcare360_governance_sites', schoolId, { order: 'created_at', ascending: true, limit: 100 }),
    safeRows(db, 'angelcare360_governance_delegations', schoolId, { order: 'created_at', limit: 200 }),
    safeRows(db, 'angelcare360_governance_configuration_changesets', schoolId, { order: 'created_at', limit: 200 }),
    safeRows(db, 'angelcare360_governance_configuration_versions', schoolId, { order: 'created_at', limit: 300 }),
    safeRows(db, 'angelcare360_governance_briefing_runs', schoolId, { order: 'generated_at', limit: 20 }),
    loadProjectionMap(db, schoolId),
  ])

  const school = row(schoolResult.data || context.school)
  const settings = settingsResult.data ? row(settingsResult.data) : null
  const academicYears = rows(academicYearsResult.data)
  const terms = rows(termsResult.data)
  const classes = rows(classesResult.data)
  const sections = rows(sectionsResult.data)
  const subjects = rows(subjectsResult.data)
  const classSubjects = rows(classSubjectResult.data)
  const assignments = rows(assignmentsResult.data)
  const roles = rows(rolesResult.data)
  const permissions = Array.isArray(permissionsResult) ? permissionsResult : []
  const rolePermissions = rows(rolePermissionsResult.data)
  const userRoles = rows(userRolesResult.data)
  const staffDirectory = rows(staffResult.data)
  const students = rows(studentsResult.data)
  const enrollments = rows(enrollmentsResult.data)
  const admissions = rows(admissionsResult.data)
  const auditRows = rows(auditResult.data)
  const readiness = readinessFor({ settings, academicYears, terms, classes, sections, subjects, assignments, roles, permissions })
  const matters = await synthesizeMatters({ projection, school, academicYears, terms, classes, sections, subjects, assignments, roles, rolePermissions, delegations, configurations: changesets, students, admissionApplications: admissions, readiness })
  const persistedIds = matters.map((matter) => matter.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id))
  const matterEvents = await loadMatterEvents(db, schoolId, persistedIds)
  for (const matter of matters) matter.timeline = matterEvents.get(matter.id) || []
  const currentYear = academicYears.find((item) => item.status === 'active') || academicYears.find((item) => boolean(item.is_current))
  const institutions = [institutionRecord({ school, readiness, students, classes, roles, matters, currentYear, siteCount: sites.length }), ...sites.map((site) => siteInstitutionRecord(site, currentYear))]
  const academicYearList = academicYearRecords(academicYears, terms, classes, enrollments, matters)
  const capacities = capacityRecords(classes, sections, students, admissions)
  const subjectList = subjectRecords(subjects, classSubjects, assignments)
  const assignmentList = assignmentRecords(assignments)
  const roleList = roleRecords(roles, rolePermissions, userRoles)
  const delegationList = delegationRecords(delegations)
  const configurationList = configurationRecords(changesets, configVersions)
  const activity = mapActivity(auditRows)
  const openMatters = matters.filter((matter) => !TERMINAL_STATES.has(matter.state))
  const critical = openMatters.filter((matter) => matter.severity === 'critical').length
  const overCapacity = capacities.filter((item) => item.conflictState === 'overcapacity').length
  const uncovered = subjectList.filter((item) => item.coverageState === 'uncovered').length
  const assignmentConflicts = assignmentList.reduce((sum, item) => sum + item.conflictCount, 0)
  const postureState = critical ? 'critical' : openMatters.length || readiness.state !== 'ready' ? 'attention' : 'stable'
  const briefingList: GovernanceBriefing[] = briefings.map((item) => ({ id: text(item.id), briefingType: text(item.briefing_type, 'weekly') as GovernanceBriefing['briefingType'], title: text(item.title), generatedAt: text(item.generated_at, text(item.created_at, now())), posture: text(item.posture), summary: arrayStrings(row(item.briefing_json).summary), matterIds: arrayStrings(row(item.briefing_json).matter_ids) }))

  return {
    generatedAt: now(),
    school: { id: schoolId, name: text(school.name, context.school!.name), code: text(school.school_code, context.school!.school_code), city: optionalText(school.city), status: text(school.status), currentAcademicYearId: optionalText(currentYear?.id), currentAcademicYearLabel: optionalText(currentYear?.label), timezone: text(settings?.default_timezone || school.timezone, 'Africa/Casablanca'), currency: text(settings?.default_currency || school.currency, 'Dh') },
    viewer: { userId: context.user.id, displayName: context.user.full_name || context.user.name || context.user.email || 'Utilisateur', roleLabel: context.access.roleLabel, canConfigure: context.access.canSeeConfiguration || context.access.accessLevel === 'super_admin', canApprove: APPROVAL_ACCESS.has(context.access.accessLevel), canManageAccess: ACCESS_ADMIN.has(context.access.accessLevel), canViewAudit: context.access.canSeeAuditData },
    posture: { state: postureState, label: postureState === 'critical' ? 'Intervention structurelle requise' : postureState === 'attention' ? 'Gouvernance sous surveillance' : 'Architecture institutionnelle stable', rationale: critical ? `${critical} matière(s) critique(s) requièrent une autorité.` : openMatters.length ? `${openMatters.length} matière(s) active(s) restent à traiter.` : 'Les exigences principales sont configurées et aucune matière active n’est détectée.' },
    metrics: [
      { key: 'readiness', label: 'Readiness', value: `${readiness.passed}/${readiness.required}`, detail: readiness.state.replaceAll('_', ' '), tone: readiness.state === 'ready' ? 'verified' : readiness.state === 'blocked' ? 'critical' : 'warning', filter: 'readiness' },
      { key: 'matters', label: 'Matières actives', value: String(openMatters.length), detail: `${critical} critique(s)`, tone: critical ? 'critical' : openMatters.length ? 'warning' : 'verified', filter: 'matters' },
      { key: 'capacity', label: 'Conflits capacité', value: String(overCapacity), detail: `${capacities.filter((item) => item.conflictState === 'warning').length} sous surveillance`, tone: overCapacity ? 'critical' : 'verified', filter: 'capacity' },
      { key: 'coverage', label: 'Matières non couvertes', value: String(uncovered), detail: `${subjectList.length} matière(s)`, tone: uncovered ? 'warning' : 'verified', filter: 'subjects' },
      { key: 'assignments', label: 'Conflits affectations', value: String(assignmentConflicts), detail: `${assignmentList.length} affectation(s)`, tone: assignmentConflicts ? 'critical' : 'verified', filter: 'assignments' },
      { key: 'access', label: 'Délégations actives', value: String(delegationList.filter((item) => item.status === 'active').length), detail: `${roleList.length} rôle(s)`, tone: matters.some((item) => item.category === 'access' && !TERMINAL_STATES.has(item.state)) ? 'warning' : 'active', filter: 'access' },
    ],
    institutions, academicYears: academicYearList,
    terms: terms.map((item) => genericEntity('term', item, 'label', 'term_code', `${text(item.starts_on)} → ${text(item.ends_on)}`)),
    capacities, subjects: subjectList, assignments: assignmentList, roles: roleList,
    directory: {
      staff: staffDirectory.map((item) => ({ id: text(item.id), label: text(item.full_name, text(item.staff_code)), secondary: optionalText(item.staff_code) || optionalText(item.staff_type) })),
      users: staffDirectory.filter((item) => Boolean(item.portal_app_user_id)).map((item) => ({ id: text(item.portal_app_user_id), label: text(item.full_name, text(item.staff_code)), secondary: optionalText(item.staff_code) || 'Compte portail' })),
      subjects: subjectList.map((item) => ({ id: item.id, label: item.title, secondary: item.code || null })),
      roles: roleList.map((item) => ({ id: item.id, label: item.title, secondary: item.code || null })),
    },
    delegations: delegationList, configurations: configurationList, matters, activity, briefings: briefingList,
    warnings: [
      ...(readiness.state !== 'ready' ? [`Readiness ${readiness.state}: ${readiness.blockers.map((item) => item.label).join(', ')}.`] : []),
      ...(sites.length === 0 ? ['Aucun site secondaire n’est configuré; le workspace reste en mode institution unique.'] : []),
    ],
  }
}

async function ensureMatter(db: Db, schoolId: string, userId: string, request: GovernanceMatterActionRequest) {
  if (/^[0-9a-f-]{36}$/i.test(request.matterId)) {
    const { data } = await db.from('angelcare360_governance_matters').select('*').eq('school_id', schoolId).eq('id', request.matterId).maybeSingle()
    if (data) return row(data)
  }
  const snapshot = row(request.matterSnapshot)
  const fingerprint = optionalText(request.fingerprint) || optionalText(snapshot.fingerprint)
  if (!fingerprint) throw new Error('Le fingerprint de la matière est requis.')
  const payload = {
    school_id: schoolId,
    fingerprint,
    title: text(snapshot.title, 'Matière de gouvernance'),
    summary: text(snapshot.summary, 'Matière détectée dans le commandement Gouvernance.'),
    category_key: text(snapshot.category, 'configuration'),
    source_entity_type: text(snapshot.sourceType, 'matter'),
    source_entity_id: text(snapshot.sourceId, fingerprint),
    source_label: optionalText(snapshot.sourceLabel),
    exact_href: text(snapshot.exactHref, '/angelcare-360-command-center/administration'),
    state: text(snapshot.state, 'new'),
    severity: text(snapshot.severity, 'medium'),
    impact_json: row(snapshot.impact),
    metadata_json: row(snapshot.metadata),
    detected_at: text(snapshot.detectedAt, now()),
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await db.from('angelcare360_governance_matters').upsert(payload, { onConflict: 'school_id,fingerprint' }).select('*').single()
  if (error) throw new Error(error.message)
  return row(data)
}

async function addMatterEvent(db: Db, input: { schoolId: string; matterId: string; eventType: string; label: string; detail?: string | null; actorUserId: string; actorLabel: string; tone: GovernanceTone; idempotencyKey: string; before?: Row; after?: Row }) {
  const { error } = await db.from('angelcare360_governance_matter_events').upsert({ school_id: input.schoolId, matter_id: input.matterId, event_type: input.eventType, label: input.label, detail: input.detail || null, actor_user_id: input.actorUserId, actor_label: input.actorLabel, tone: input.tone, idempotency_key: input.idempotencyKey, before_json: input.before || {}, after_json: input.after || {} }, { onConflict: 'school_id,idempotency_key' })
  if (error) throw new Error(error.message)
}

export async function executeGovernanceMatterAction(request: GovernanceMatterActionRequest): Promise<GovernanceCommandResult> {
  const context = await requireGovernanceContext({ approve: ['resolve', 'release', 'reopen', 'escalate_direction'].includes(request.action) })
  const db = await createClient()
  const schoolId = context.school!.id
  const matter = await ensureMatter(db, schoolId, context.user.id, request)
  const before = { ...matter }
  const reason = optionalText(request.reason || request.note)
  if (['resolve', 'release', 'reopen', 'snooze', 'escalate_direction'].includes(request.action) && !reason) throw new Error('Une raison est requise pour cette action.')
  const update: Row = { updated_by: context.user.id, updated_at: now() }
  let label: string = request.action
  let tone: GovernanceTone = 'active'
  if (request.action === 'acknowledge') { update.state = 'acknowledged'; update.acknowledged_at = now(); update.acknowledged_by = context.user.id; label = 'Matière reconnue' }
  if (request.action === 'take_ownership') { update.state = 'owned'; update.owner_user_id = context.user.id; update.owner_label = context.user.full_name || context.user.name || context.user.email; label = 'Prise en charge' }
  if (request.action === 'assign') { update.state = 'owned'; update.owner_user_id = request.assigneeUserId || null; update.owner_label = request.assigneeLabel || 'Responsable assigné'; update.due_at = request.dueAt || matter.due_at || null; label = 'Responsable assigné' }
  if (request.action === 'verify') { update.state = text(matter.state) === 'new' ? 'acknowledged' : matter.state; update.verified_at = now(); update.verified_by = context.user.id; label = 'Vérification enregistrée'; tone = 'verified' }
  if (request.action === 'request_evidence') { update.state = 'waiting_evidence'; update.evidence_requested_at = now(); update.evidence_requested_by = context.user.id; label = 'Preuve demandée'; tone = 'warning' }
  if (request.action === 'add_note') { label = 'Note ajoutée' }
  if (request.action === 'schedule_review') { update.state = 'in_progress'; update.due_at = request.dueAt || null; label = 'Revue programmée' }
  if (request.action === 'snooze') { update.state = 'snoozed'; update.snoozed_until = request.snoozedUntil || request.dueAt; update.snooze_reason = reason; label = 'Matière reportée'; tone = 'warning' }
  if (request.action === 'escalate_direction') { update.state = 'decision_required'; update.escalated_at = now(); update.escalated_by = context.user.id; update.escalation_reason = reason; label = 'Escaladée vers Direction'; tone = 'decision' }
  if (request.action === 'resolve') { update.state = 'resolved'; update.resolved_at = now(); update.resolved_by = context.user.id; update.resolution_reason = reason; label = 'Matière résolue'; tone = 'verified' }
  if (request.action === 'release') { update.state = 'released'; update.released_at = now(); update.released_by = context.user.id; update.resolution_reason = reason; label = 'Libérée de Gouvernance'; tone = 'verified' }
  if (request.action === 'reopen') { update.state = 'reopened'; update.reopened_at = now(); update.reopened_by = context.user.id; update.reopen_reason = reason; update.resolved_at = null; update.resolution_reason = null; label = 'Matière réouverte'; tone = 'decision' }
  const eventKey = idempotency(request.idempotencyKey, { schoolId, matterId: matter.id, action: request.action, reason, dueAt: request.dueAt, assignee: request.assigneeUserId })
  const { data: existingEvent } = await db.from('angelcare360_governance_matter_events').select('id').eq('school_id', schoolId).eq('idempotency_key', eventKey).maybeSingle()
  if (existingEvent) return { ok: true, state: 'replayed', message: 'Action déjà exécutée.', matterId: text(matter.id) }
  const { data, error } = await db.from('angelcare360_governance_matters').update(update).eq('school_id', schoolId).eq('id', text(matter.id)).select('*').single()
  if (error) throw new Error(error.message)
  await addMatterEvent(db, { schoolId, matterId: text(matter.id), eventType: request.action, label, detail: reason || request.note || null, actorUserId: context.user.id, actorLabel: context.user.full_name || context.user.name || context.user.email || 'Utilisateur', tone, idempotencyKey: eventKey, before, after: row(data) })
  await audit({ schoolId, module: 'governance', action: `governance.matter.${request.action}`, entityType: 'governance_matter', entityId: text(matter.id), before, after: row(data), metadata: { fingerprint: matter.fingerprint } })
  return { ok: true, state: 'completed', message: label, operationKey: 'governance.matter.action', matterId: text(matter.id), result: row(data) }
}

async function beginExecution(db: Db, schoolId: string, userId: string, request: GovernanceEntityActionRequest) {
  const key = idempotency(request.idempotencyKey, { schoolId, operationKey: request.operationKey, entityId: request.entityId, payload: request.payload, effectiveAt: request.effectiveAt })
  const { data: existing } = await db.from('angelcare360_governance_executions').select('*').eq('school_id', schoolId).eq('idempotency_key', key).maybeSingle()
  if (existing && ['completed', 'blocked', 'failed'].includes(text(row(existing).state))) return { execution: row(existing), replay: true }
  if (existing) {
    const { data, error } = await db.from('angelcare360_governance_executions').update({ state: 'executing', started_at: now(), retry_count: numeric(row(existing).retry_count) + 1, updated_at: now() }).eq('id', text(row(existing).id)).select('*').single()
    if (error) throw new Error(error.message)
    return { execution: row(data), replay: false }
  }
  const { data, error } = await db.from('angelcare360_governance_executions').insert({ school_id: schoolId, operation_key: request.operationKey, entity_type: request.entityType, entity_id: request.entityId || null, idempotency_key: key, state: 'executing', request_json: request.payload || {}, reason: request.reason || null, effective_at: request.effectiveAt || null, requested_by: userId, requested_at: now(), started_at: now(), created_by: userId }).select('*').single()
  if (error) throw new Error(error.message)
  return { execution: row(data), replay: false }
}

async function finishExecution(db: Db, executionId: string, state: string, result: Row, errorMessage?: string | null) {
  await db.from('angelcare360_governance_executions').update({ state, result_json: result, error_message: errorMessage || null, completed_at: now(), updated_at: now() }).eq('id', executionId)
}

async function currentRecord(db: Db, table: string, schoolId: string, id: string) {
  let query = db.from(table).select('*').eq('id', id)
  if (table !== 'angelcare360_schools') query = query.eq('school_id', schoolId)
  const { data, error } = await query.single()
  if (error) throw new Error(error.message)
  if (table === 'angelcare360_schools' && text(row(data).id) !== schoolId) throw new Angelcare360AccessError('Institution hors du périmètre tenant.', 403)
  return row(data)
}

async function updateMetadataRecord(db: Db, table: string, schoolId: string, id: string, updates: Row, metadata: Row) {
  const before = await currentRecord(db, table, schoolId, id)
  let query = db.from(table).update({ ...updates, metadata_json: { ...row(before.metadata_json), ...metadata }, updated_at: now() }).eq('id', id)
  if (table !== 'angelcare360_schools') query = query.eq('school_id', schoolId)
  const { data, error } = await query.select('*').single()
  if (error) throw new Error(error.message)
  return { before, after: row(data) }
}

async function runReadiness(db: Db, schoolId: string, userId: string, institutionId: string, executionId: string) {
  const snapshot = await getGovernanceCommandSnapshot()
  const institution = snapshot.institutions.find((item) => item.id === institutionId)
  if (!institution) throw new Error('Institution introuvable.')
  const requirements = rows(institution.metadata.readinessRequirements)
  const blockers = requirements.filter((item) => !boolean(item.passed))
  const runCode = code('READY')
  const { data: run, error } = await db.from('angelcare360_governance_readiness_runs').insert({ school_id: schoolId, institution_id: institutionId, run_code: runCode, state: blockers.length ? 'blocked' : 'ready', passed_count: requirements.length - blockers.length, required_count: requirements.length, snapshot_json: { requirements }, requested_by: userId, executed_at: now(), execution_id: executionId, created_by: userId }).select('*').single()
  if (error) throw new Error(error.message)
  if (blockers.length) {
    const findings = blockers.map((item) => ({ school_id: schoolId, readiness_run_id: row(run).id, institution_id: institutionId, requirement_key: text(item.key), title: text(item.label), status: 'open', severity: 'blocking', source_entity_type: text(item.key), source_entity_id: institutionId, owner_user_id: null, evidence_json: {}, created_by: userId }))
    const { error: findingsError } = await db.from('angelcare360_governance_readiness_findings').insert(findings)
    if (findingsError) throw new Error(findingsError.message)
  }
  return { run: row(run), blockers: blockers.map((item) => text(item.label)), institution }
}

async function executeRolloverPreview(db: Db, schoolId: string, userId: string, executionId: string, payload: Row) {
  const sourceYearId = required(payload, 'sourceAcademicYearId', 'L’année source')
  const targetYearId = required(payload, 'targetAcademicYearId', 'L’année cible')
  const { data: enrollments, error } = await db.from('angelcare360_class_enrollments').select('*,student:angelcare360_students(id,student_code,full_name,current_class_id,current_section_id,status)').eq('school_id', schoolId).eq('academic_year_id', sourceYearId).eq('status', 'active')
  if (error) throw new Error(error.message)
  const runCode = text(payload.runCode, code('ROLL'))
  const { data: run, error: runError } = await db.from('angelcare360_governance_rollover_runs').upsert({ school_id: schoolId, source_academic_year_id: sourceYearId, target_academic_year_id: targetYearId, run_code: runCode, state: 'previewed', source_signature: stableHash(enrollments || []), summary_json: { population: (enrollments || []).length }, requested_by: userId, requested_at: now(), execution_id: executionId, created_by: userId }, { onConflict: 'school_id,run_code' }).select('*').single()
  if (runError) throw new Error(runError.message)
  const runId = text(row(run).id)
  const classMap = row(payload.classMap)
  const sectionMap = row(payload.sectionMap)
  const items = rows(enrollments).map((enrollment) => {
    const student = Array.isArray(enrollment.student) ? row(enrollment.student[0]) : row(enrollment.student)
    return { school_id: schoolId, rollover_run_id: runId, student_id: enrollment.student_id, source_enrollment_id: enrollment.id, source_class_id: enrollment.class_id, source_section_id: enrollment.section_id, decision: text(payload.defaultDecision, 'promote'), target_class_id: classMap[text(enrollment.class_id)] || null, target_section_id: sectionMap[text(enrollment.section_id)] || null, state: classMap[text(enrollment.class_id)] ? 'proposed' : 'exception', blocker_reason: classMap[text(enrollment.class_id)] ? null : 'Classe cible non définie.', result_json: { student_code: student.student_code, student_name: student.full_name }, created_by: userId }
  })
  await db.from('angelcare360_governance_rollover_items').delete().eq('rollover_run_id', runId).in('state', ['proposed', 'exception'])
  if (items.length) {
    const { error: itemError } = await db.from('angelcare360_governance_rollover_items').insert(items)
    if (itemError) throw new Error(itemError.message)
  }
  return { run: row(run), items, blockers: items.filter((item) => item.state === 'exception').map((item) => text(item.blocker_reason)) }
}

async function executeRolloverRun(db: Db, schoolId: string, userId: string, executionId: string, runId: string) {
  const run = await currentRecord(db, 'angelcare360_governance_rollover_runs', schoolId, runId)
  const { data: items, error } = await db.from('angelcare360_governance_rollover_items').select('*').eq('school_id', schoolId).eq('rollover_run_id', runId).in('state', ['proposed', 'approved', 'failed'])
  if (error) throw new Error(error.message)
  const outcomes: Row[] = []
  for (const item of rows(items)) {
    if (!item.target_class_id && ['promote', 'repeat', 'transfer_class'].includes(text(item.decision))) {
      outcomes.push({ itemId: item.id, state: 'failed', error: 'Classe cible absente.' })
      await db.from('angelcare360_governance_rollover_items').update({ state: 'failed', blocker_reason: 'Classe cible absente.', updated_at: now() }).eq('id', text(item.id))
      continue
    }
    try {
      const decision = text(item.decision)
      if (['promote', 'repeat', 'transfer_class'].includes(decision)) {
        const enrollmentPayload = { school_id: schoolId, academic_year_id: run.target_academic_year_id, student_id: item.student_id, class_id: item.target_class_id, section_id: item.target_section_id || null, enrollment_status: 'enrolled', enrolled_on: dateOnly(), promoted_from_class_id: item.source_class_id || null, status: 'active', metadata_json: { governance_rollover_run_id: runId, decision }, created_by: userId, updated_by: userId }
        const { data: existing } = await db.from('angelcare360_class_enrollments').select('id').eq('school_id', schoolId).eq('student_id', item.student_id as never).eq('academic_year_id', run.target_academic_year_id as never).maybeSingle()
        if (existing) await db.from('angelcare360_class_enrollments').update(enrollmentPayload).eq('id', text(row(existing).id))
        else await db.from('angelcare360_class_enrollments').insert(enrollmentPayload)
        await db.from('angelcare360_students').update({ current_class_id: item.target_class_id, current_section_id: item.target_section_id || null, admission_status: 'enrolled', status: 'active', updated_by: userId, updated_at: now(), metadata_json: { rollover_run_id: runId, rollover_decision: decision } }).eq('school_id', schoolId).eq('id', item.student_id as never)
      } else if (decision === 'withdraw') {
        await db.from('angelcare360_students').update({ admission_status: 'withdrawn', status: 'inactive', exit_date: dateOnly(), updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', item.student_id as never)
      } else if (decision === 'graduate') {
        await db.from('angelcare360_students').update({ admission_status: 'graduated', status: 'inactive', exit_date: dateOnly(), updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', item.student_id as never)
      }
      await db.from('angelcare360_governance_rollover_items').update({ state: 'completed', executed_at: now(), execution_id: executionId, updated_at: now() }).eq('id', text(item.id))
      outcomes.push({ itemId: item.id, studentId: item.student_id, state: 'completed' })
    } catch (problem) {
      const message = problem instanceof Error ? problem.message : 'Échec rollover.'
      await db.from('angelcare360_governance_rollover_items').update({ state: 'failed', blocker_reason: message, updated_at: now() }).eq('id', text(item.id))
      outcomes.push({ itemId: item.id, state: 'failed', error: message })
    }
  }
  const failed = outcomes.filter((item) => item.state === 'failed').length
  await db.from('angelcare360_governance_rollover_runs').update({ state: failed ? 'partially_failed' : 'completed', executed_by: userId, executed_at: now(), summary_json: { total: outcomes.length, failed, completed: outcomes.length - failed }, updated_at: now() }).eq('id', runId)
  return { run, outcomes, blockers: failed ? [`${failed} item(s) nécessitent une réparation.`] : [] }
}

async function dispatchEntityAction(input: { db: Db; schoolId: string; userId: string; executionId: string; request: GovernanceEntityActionRequest }) {
  const { db, schoolId, userId, executionId, request } = input
  const payload = row(request.payload)
  const entityId = request.entityId || optionalText(payload.id)
  const effectiveAt = request.effectiveAt || optionalText(payload.effectiveAt) || now()
  if (request.operationKey === 'governance.institution.review') return runReadiness(db, schoolId, userId, entityId || schoolId, executionId)
  if (request.operationKey.startsWith('governance.institution.')) {
    const id = entityId || schoolId
    const statusMap: Record<string, string> = { 'governance.institution.activate': 'active', 'governance.institution.suspend': 'suspended', 'governance.institution.reactivate': 'active', 'governance.institution.close': 'inactive', 'governance.institution.archive': 'archived' }
    const stateMap: Record<string, string> = { 'governance.institution.activate': 'active', 'governance.institution.suspend': 'suspended', 'governance.institution.reactivate': 'active', 'governance.institution.close': 'closed', 'governance.institution.archive': 'archived' }
    if (request.operationKey === 'governance.institution.activate') {
      const review = await runReadiness(db, schoolId, userId, id, executionId)
      if (review.blockers.length) return { message: 'Activation bloquée par la readiness.', blockers: review.blockers, result: review }
    }
    const institutionTable = id === schoolId ? 'angelcare360_schools' : 'angelcare360_governance_sites'
    const outcome = await updateMetadataRecord(db, institutionTable, schoolId, id, { status: statusMap[request.operationKey], updated_by: userId }, { governance_state: stateMap[request.operationKey], governance_effective_at: effectiveAt, governance_execution_id: executionId, governance_reason: request.reason || null })
    await db.from('angelcare360_governance_institution_lifecycle_events').insert({ school_id: schoolId, institution_id: id, from_state: text(row(outcome.before.metadata_json).governance_state, text(outcome.before.status)), to_state: stateMap[request.operationKey], effective_at: effectiveAt, reason: request.reason || null, execution_id: executionId, actor_user_id: userId })
    return { message: `Institution transitionnée vers ${stateMap[request.operationKey]}.`, result: outcome }
  }
  if (request.operationKey.startsWith('governance.academic_year.')) {
    if (!entityId) throw new Error('L’année scolaire est requise.')
    const statusMap: Record<string, string> = { 'governance.academic_year.publish': 'planned', 'governance.academic_year.activate': 'active', 'governance.academic_year.close': 'closed', 'governance.academic_year.reopen': 'planned' }
    const stateMap: Record<string, string> = { 'governance.academic_year.publish': 'published', 'governance.academic_year.activate': 'active', 'governance.academic_year.close': 'closed', 'governance.academic_year.reopen': 'reopened' }
    if (request.operationKey === 'governance.academic_year.activate') await db.from('angelcare360_academic_years').update({ is_current: false, updated_at: now() }).eq('school_id', schoolId).neq('id', entityId)
    const outcome = await updateMetadataRecord(db, 'angelcare360_academic_years', schoolId, entityId, { status: statusMap[request.operationKey], is_current: request.operationKey === 'governance.academic_year.activate', updated_by: userId }, { governance_state: stateMap[request.operationKey], governance_effective_at: effectiveAt, governance_execution_id: executionId, governance_reason: request.reason || null })
    if (['governance.academic_year.publish', 'governance.academic_year.activate', 'governance.academic_year.close'].includes(request.operationKey)) {
      const { data: structure } = await db.from('angelcare360_academic_years').select('*,terms:angelcare360_terms(*),classes:angelcare360_classes(*,sections:angelcare360_sections(*))').eq('school_id', schoolId).eq('id', entityId).single()
      await db.from('angelcare360_governance_academic_structure_versions').insert({ school_id: schoolId, academic_year_id: entityId, version_code: code('STRUCT'), version_number: numeric(row(outcome.before.metadata_json).structure_version, 0) + 1, state: request.operationKey === 'governance.academic_year.close' ? 'closed' : 'published', effective_from: effectiveAt, structure_json: structure || {}, source_signature: stableHash(structure || {}), published_by: userId, published_at: now(), execution_id: executionId, created_by: userId })
    }
    return { message: `Année scolaire transitionnée vers ${stateMap[request.operationKey]}.`, result: outcome }
  }
  if (request.operationKey === 'governance.rollover.preview') return executeRolloverPreview(db, schoolId, userId, executionId, payload)
  if (request.operationKey === 'governance.rollover.execute' || request.operationKey === 'governance.rollover.repair') {
    const runId = entityId || required(payload, 'runId', 'Le rollover')
    return executeRolloverRun(db, schoolId, userId, executionId, runId)
  }
  if (request.operationKey.startsWith('governance.period.')) {
    if (!entityId) throw new Error('La période est requise.')
    const statusMap: Record<string, string> = { 'governance.period.publish': 'active', 'governance.period.close': 'closed', 'governance.period.reopen': 'planned' }
    const outcome = await updateMetadataRecord(db, 'angelcare360_terms', schoolId, entityId, { status: statusMap[request.operationKey], updated_by: userId }, { governance_state: statusMap[request.operationKey], governance_effective_at: effectiveAt, governance_execution_id: executionId })
    return { message: `Période transitionnée vers ${statusMap[request.operationKey]}.`, result: outcome }
  }
  if (request.operationKey === 'governance.capacity.change') {
    if (!entityId) throw new Error('La classe ou section est requise.')
    const entityType = request.entityType === 'section' ? 'section' : 'class'
    const table = entityType === 'section' ? 'angelcare360_sections' : 'angelcare360_classes'
    const capacity = numeric(payload.capacity, -1)
    if (capacity < 0) throw new Error('La capacité doit être positive ou nulle.')
    const outcome = await updateMetadataRecord(db, table, schoolId, entityId, { capacity, updated_by: userId }, { capacity_reason: request.reason || null, capacity_effective_at: effectiveAt, governance_execution_id: executionId })
    await db.from('angelcare360_governance_capacity_changes').insert({ school_id: schoolId, entity_type: entityType, entity_id: entityId, previous_capacity: numeric(outcome.before.capacity), new_capacity: capacity, effective_at: effectiveAt, reason: request.reason || null, impact_json: payload.impact || {}, state: 'applied', execution_id: executionId, requested_by: userId, approved_by: userId, applied_at: now(), created_by: userId })
    return { message: `Capacité mise à jour à ${capacity}.`, result: outcome }
  }
  if (request.operationKey === 'governance.population.move') {
    const studentIds = arrayStrings(payload.studentIds)
    const targetClassId = required(payload, 'targetClassId', 'La classe cible')
    const targetSectionId = optionalText(payload.targetSectionId)
    if (!studentIds.length) throw new Error('Sélectionnez au moins un élève.')
    const { error } = await db.from('angelcare360_students').update({ current_class_id: targetClassId, current_section_id: targetSectionId, updated_by: userId, updated_at: now(), metadata_json: { governance_population_move_execution_id: executionId, governance_population_move_reason: request.reason || null } }).eq('school_id', schoolId).in('id', studentIds)
    if (error) throw new Error(error.message)
    await db.from('angelcare360_governance_population_movements').insert({ school_id: schoolId, movement_code: code('MOVE'), student_ids: studentIds, source_class_id: payload.sourceClassId || null, source_section_id: payload.sourceSectionId || null, target_class_id: targetClassId, target_section_id: targetSectionId, effective_at: effectiveAt, reason: request.reason || null, state: 'completed', execution_id: executionId, requested_by: userId, executed_by: userId, executed_at: now(), created_by: userId })
    return { message: `${studentIds.length} élève(s) déplacé(s).`, result: { studentIds, targetClassId, targetSectionId } }
  }
  if (request.operationKey === 'governance.enrollment.freeze') {
    if (!entityId) throw new Error('La classe est requise.')
    const outcome = await updateMetadataRecord(db, 'angelcare360_classes', schoolId, entityId, {}, { enrollment_frozen: boolean(payload.frozen, true), enrollment_freeze_reason: request.reason || null, enrollment_freeze_at: effectiveAt, governance_execution_id: executionId })
    return { message: boolean(payload.frozen, true) ? 'Inscriptions gelées.' : 'Inscriptions réouvertes.', result: outcome }
  }
  if (request.operationKey.startsWith('governance.subject.')) {
    if (!entityId) throw new Error('La matière est requise.')
    const statusMap: Record<string, string> = { 'governance.subject.publish': 'active', 'governance.subject.replace': 'inactive', 'governance.subject.retire': 'archived' }
    const before = await currentRecord(db, 'angelcare360_subjects', schoolId, entityId)
    const metadata = row(before.metadata_json)
    const outcome = await updateMetadataRecord(db, 'angelcare360_subjects', schoolId, entityId, { status: statusMap[request.operationKey], updated_by: userId }, { governance_state: request.operationKey.split('.').pop(), version_number: numeric(metadata.version_number, 1) + (request.operationKey === 'governance.subject.publish' ? 1 : 0), replaced_by_subject_id: payload.replacementSubjectId || null, governance_effective_at: effectiveAt, governance_execution_id: executionId })
    return { message: `Matière ${request.operationKey.split('.').pop()}.`, result: outcome }
  }
  if (request.operationKey.startsWith('governance.assignment.')) {
    if (!entityId) throw new Error('L’affectation est requise.')
    if (request.operationKey === 'governance.assignment.end') {
      const outcome = await updateMetadataRecord(db, 'angelcare360_teacher_assignments', schoolId, entityId, { status: 'archived', updated_by: userId }, { governance_state: 'ended', assignment_end_reason: request.reason || null, assignment_end_at: effectiveAt, governance_execution_id: executionId })
      return { message: 'Affectation terminée.', result: outcome }
    }
    if (request.operationKey === 'governance.assignment.replace') {
      const before = await currentRecord(db, 'angelcare360_teacher_assignments', schoolId, entityId)
      const replacementStaffId = required(payload, 'replacementStaffId', 'L’enseignant remplaçant')
      await db.from('angelcare360_teacher_assignments').update({ status: 'inactive', updated_by: userId, updated_at: now(), metadata_json: { ...row(before.metadata_json), replaced_by_staff_id: replacementStaffId, replacement_execution_id: executionId } }).eq('id', entityId)
      const { data, error } = await db.from('angelcare360_teacher_assignments').insert({ school_id: schoolId, academic_year_id: before.academic_year_id, staff_id: replacementStaffId, class_id: before.class_id || null, section_id: before.section_id || null, subject_id: before.subject_id || null, assignment_role: before.assignment_role || 'teacher', weekly_hours: before.weekly_hours || 0, assigned_from: effectiveAt.slice(0, 10), assigned_to: before.assigned_to || null, status: 'active', metadata_json: { replaces_assignment_id: entityId, governance_execution_id: executionId }, created_by: userId, updated_by: userId }).select('*').single()
      if (error) throw new Error(error.message)
      return { message: 'Enseignant remplacé avec historique.', result: { before, replacement: row(data) } }
    }
    const outcome = await updateMetadataRecord(db, 'angelcare360_teacher_assignments', schoolId, entityId, { staff_id: payload.staffId || undefined, class_id: payload.classId || undefined, section_id: payload.sectionId || null, subject_id: payload.subjectId || null, weekly_hours: payload.weeklyHours === undefined ? undefined : numeric(payload.weeklyHours), updated_by: userId }, { governance_state: 'changed', governance_effective_at: effectiveAt, governance_execution_id: executionId, governance_reason: request.reason || null })
    return { message: 'Affectation mise à jour.', result: outcome }
  }
  if (request.operationKey === 'governance.role.publish') {
    if (!entityId) throw new Error('Le rôle est requis.')
    const before = await currentRecord(db, 'angelcare360_roles', schoolId, entityId)
    const permissionKeys = arrayStrings(payload.permissionKeys)
    if (permissionKeys.length) {
      await db.from('angelcare360_role_permissions').delete().eq('role_id', entityId)
      await db.from('angelcare360_role_permissions').insert(permissionKeys.map((permissionKey) => ({ role_id: entityId, permission_key: permissionKey, effect: 'allow', created_by: userId, updated_by: userId })))
    }
    const versionNumber = numeric(row(before.metadata_json).version_number, 1) + 1
    const { data, error } = await db.from('angelcare360_roles').update({ status: 'active', metadata_json: { ...row(before.metadata_json), governance_state: 'published', version_number: versionNumber, published_at: now(), governance_execution_id: executionId }, updated_by: userId, updated_at: now() }).eq('id', entityId).select('*').single()
    if (error) throw new Error(error.message)
    await db.from('angelcare360_governance_role_versions').insert({ school_id: schoolId, role_id: entityId, version_number: versionNumber, version_code: `${text(before.role_key)}-V${versionNumber}`, state: 'published', role_snapshot: data || {}, permission_keys: permissionKeys, impact_json: payload.impact || {}, effective_from: effectiveAt, published_by: userId, published_at: now(), execution_id: executionId, created_by: userId })
    return { message: `Rôle publié en version ${versionNumber}.`, result: { before, after: row(data) } }
  }
  if (request.operationKey === 'governance.role.assign') {
    const roleId = entityId || required(payload, 'roleId', 'Le rôle')
    const userIdTarget = required(payload, 'userId', 'L’utilisateur')
    const { data, error } = await db.from('angelcare360_user_roles').upsert({ school_id: schoolId, app_user_id: userIdTarget, role_id: roleId, access_scope_id: payload.accessScopeId || null, starts_at: effectiveAt, ends_at: payload.endsAt || null, status: 'active', metadata_json: { governance_execution_id: executionId, assignment_reason: request.reason || null }, created_by: userId, updated_by: userId, updated_at: now() }, { onConflict: 'school_id,app_user_id,role_id' }).select('*').single()
    if (error) throw new Error(error.message)
    return { message: 'Rôle affecté.', result: row(data) }
  }
  if (request.operationKey === 'governance.role.revoke') {
    const assignmentId = entityId || required(payload, 'userRoleId', 'L’affectation de rôle')
    const { data, error } = await db.from('angelcare360_user_roles').update({ status: 'revoked', ends_at: effectiveAt, updated_by: userId, updated_at: now(), metadata_json: { revoke_reason: request.reason || null, governance_execution_id: executionId } }).eq('school_id', schoolId).eq('id', assignmentId).select('*').single()
    if (error) throw new Error(error.message)
    return { message: 'Affectation de rôle révoquée.', result: row(data) }
  }
  if (request.operationKey === 'governance.delegation.create') {
    const targetUserId = required(payload, 'userId', 'L’utilisateur')
    const targetRoleId = required(payload, 'roleId', 'Le rôle')
    const [staffLookup, roleLookup] = await Promise.all([
      db.from('angelcare360_staff').select('full_name,staff_code').eq('school_id', schoolId).eq('portal_app_user_id', targetUserId).maybeSingle(),
      db.from('angelcare360_roles').select('label,role_key').eq('school_id', schoolId).eq('id', targetRoleId).single(),
    ])
    if (roleLookup.error) throw new Error(roleLookup.error.message)
    const staffRecord = row(staffLookup.data)
    const roleRecord = row(roleLookup.data)
    const { data, error } = await db.from('angelcare360_governance_delegations').insert({ school_id: schoolId, delegation_code: text(payload.delegationCode, code('DELEG')), user_id: targetUserId, user_label: text(payload.userLabel, text(staffRecord.full_name, text(staffRecord.staff_code, 'Utilisateur autorisé'))), role_id: targetRoleId, role_label: text(payload.roleLabel, text(roleRecord.label, text(roleRecord.role_key, 'Rôle gouverné'))), scope_type: text(payload.scopeType, 'school'), scope_id: payload.scopeId || null, starts_at: payload.startsAt || effectiveAt, ends_at: payload.endsAt || null, review_at: payload.reviewAt || null, restrictions_json: row(payload.restrictions), reason: request.reason || null, status: 'active', delegated_by: userId, execution_id: executionId, created_by: userId }).select('*').single()
    if (error) throw new Error(error.message)
    return { message: 'Délégation créée.', result: row(data) }
  }
  if (request.operationKey === 'governance.delegation.revoke') {
    if (!entityId) throw new Error('La délégation est requise.')
    const { data, error } = await db.from('angelcare360_governance_delegations').update({ status: 'revoked', revoked_by: userId, revoked_at: now(), revoke_reason: request.reason || null, updated_at: now() }).eq('school_id', schoolId).eq('id', entityId).select('*').single()
    if (error) throw new Error(error.message)
    return { message: 'Délégation révoquée.', result: row(data) }
  }
  if (request.operationKey === 'governance.configuration.publish') {
    const changesetId = entityId || required(payload, 'changesetId', 'Le changeset')
    const changeset = await currentRecord(db, 'angelcare360_governance_configuration_changesets', schoolId, changesetId)
    if (text(changeset.ownership) === 'operator' || text(changeset.ownership) === 'derived') return { message: 'Publication bloquée: configuration non détenue par le tenant.', blockers: ['Cette configuration est contrôlée par l’Operator ou dérivée.'], result: changeset }
    const { data: previous } = await db.from('angelcare360_governance_configuration_versions').select('*').eq('school_id', schoolId).eq('configuration_key', changeset.configuration_key as never).eq('state', 'published').order('version_number', { ascending: false }).limit(1).maybeSingle()
    const versionNumber = numeric(row(previous).version_number) + 1
    if (previous) await db.from('angelcare360_governance_configuration_versions').update({ state: 'superseded', effective_to: effectiveAt, updated_at: now() }).eq('id', text(row(previous).id))
    const { data: version, error } = await db.from('angelcare360_governance_configuration_versions').insert({ school_id: schoolId, configuration_key: changeset.configuration_key, version_code: `${text(changeset.configuration_key)}-V${versionNumber}`, label: changeset.title, ownership: changeset.ownership, version_number: versionNumber, state: 'published', value_json: changeset.proposed_value || {}, effective_from: effectiveAt, supersedes_version_id: row(previous).id || null, source_changeset_id: changesetId, source_signature: stableHash(changeset.proposed_value || {}), published_by: userId, published_at: now(), execution_id: executionId, created_by: userId }).select('*').single()
    if (error) throw new Error(error.message)
    await db.from('angelcare360_governance_configuration_changesets').update({ status: 'published', published_by: userId, published_at: now(), version_number: versionNumber, updated_at: now() }).eq('id', changesetId)
    return { message: `Configuration publiée en V${versionNumber}.`, result: row(version) }
  }
  if (request.operationKey === 'governance.configuration.rollback') {
    const versionId = entityId || required(payload, 'versionId', 'La version')
    const version = await currentRecord(db, 'angelcare360_governance_configuration_versions', schoolId, versionId)
    const { data, error } = await db.from('angelcare360_governance_configuration_changesets').insert({ school_id: schoolId, changeset_code: code('ROLLBACK'), title: `Rollback ${text(version.configuration_key)} vers ${text(version.version_code)}`, configuration_key: version.configuration_key, ownership: version.ownership, current_value: payload.currentValue || {}, proposed_value: version.value_json || {}, changes_json: [{ operation: 'rollback', version_id: versionId }], status: 'approved', effective_at: effectiveAt, rollback_of_version_id: versionId, created_by: userId, approved_by: userId, approved_at: now(), metadata_json: { governance_execution_id: executionId, reason: request.reason || null } }).select('*').single()
    if (error) throw new Error(error.message)
    return { message: 'Changeset de rollback préparé et approuvé.', result: row(data) }
  }
  throw new Error(`Opération non implémentée: ${request.operationKey}.`)
}

export async function executeGovernanceEntityAction(request: GovernanceEntityActionRequest): Promise<GovernanceCommandResult> {
  const definition = operationDefinition(request.operationKey)
  if (!definition) throw new Error(`Opération Gouvernance inconnue: ${request.operationKey}.`)
  const context = await requireGovernanceContext({ approve: definition.approval, accessAdmin: request.operationKey.includes('.role.') || request.operationKey.includes('.delegation.') })
  if (!context.permissions.has(definition.permission) && context.access.accessLevel !== 'super_admin' && !context.access.permissions.includes(definition.permission)) throw new Angelcare360AccessError(`Permission requise: ${definition.permission}.`, 403)
  const db = await createClient()
  const schoolId = context.school!.id
  const { execution, replay } = await beginExecution(db, schoolId, context.user.id, request)
  if (replay) {
    const result = row(execution.result_json)
    return { ok: text(execution.state) === 'completed', state: 'replayed', message: text(result.message, 'Opération déjà exécutée.'), operationKey: request.operationKey, executionId: text(execution.id), entityId: request.entityId || null, blockers: arrayStrings(result.blockers), warnings: arrayStrings(result.warnings), result }
  }
  try {
    const outcome = await dispatchEntityAction({ db, schoolId, userId: context.user.id, executionId: text(execution.id), request })
    const blockers = arrayStrings(row(outcome).blockers)
    const result = { ...row(outcome), message: text(row(outcome).message), blockers }
    const state = blockers.length ? 'blocked' : 'completed'
    await finishExecution(db, text(execution.id), state, result)
    await audit({ schoolId, module: 'governance', action: request.operationKey, entityType: request.entityType, entityId: request.entityId || null, after: result, metadata: { execution_id: execution.id, effective_at: request.effectiveAt }, severity: blockers.length ? 'warning' : 'notice' })
    return { ok: blockers.length === 0, state: blockers.length ? 'blocked' : 'completed', message: text(result.message), operationKey: request.operationKey, executionId: text(execution.id), entityId: request.entityId || null, blockers, result }
  } catch (problem) {
    const message = problem instanceof Error ? problem.message : 'Échec de l’opération Gouvernance.'
    await finishExecution(db, text(execution.id), 'failed', { message }, message).catch(() => undefined)
    throw problem
  }
}

export async function createGovernanceEntity(request: GovernanceCreateRequest): Promise<GovernanceCommandResult> {
  const context = await requireGovernanceContext({ accessAdmin: request.entityType === 'role' || request.entityType === 'delegation' })
  const db = await createClient()
  const schoolId = context.school!.id
  const payload = row(request.payload)
  const key = idempotency(request.idempotencyKey, { schoolId, entityType: request.entityType, payload })
  const { data: existing } = await db.from('angelcare360_governance_executions').select('*').eq('school_id', schoolId).eq('idempotency_key', key).eq('state', 'completed').maybeSingle()
  if (existing) return { ok: true, state: 'replayed', message: 'Création déjà exécutée.', executionId: text(row(existing).id), entityId: optionalText(row(row(existing).result_json).entityId), result: row(row(existing).result_json) }
  const requestAction: GovernanceEntityActionRequest = { operationKey: ({ institution: 'governance.institution.create', academic_year: 'governance.academic_year.create', term: 'governance.period.create', class: 'governance.class.create', section: 'governance.section.create', subject: 'governance.subject.create', assignment: 'governance.assignment.create', role: 'governance.role.create', delegation: 'governance.delegation.create' } as Partial<Record<GovernanceEntityType, GovernanceEntityActionRequest['operationKey']>>)[request.entityType] || 'governance.configuration.publish', entityType: request.entityType, idempotencyKey: key, payload }
  const definition = operationDefinition(requestAction.operationKey)
  if (definition && !context.permissions.has(definition.permission) && context.access.accessLevel !== 'super_admin' && !context.access.permissions.includes(definition.permission)) throw new Angelcare360AccessError(`Permission requise: ${definition.permission}.`, 403)
  const { execution } = await beginExecution(db, schoolId, context.user.id, requestAction)
  let table = ''
  let insert: Row = { school_id: schoolId, created_by: context.user.id, updated_by: context.user.id }
  if (request.entityType === 'institution') { table = 'angelcare360_governance_sites'; insert = { ...insert, site_code: required(payload, 'schoolCode', 'Le code'), name: required(payload, 'name', 'Le nom'), site_type: text(payload.schoolType, 'site'), city: optionalText(payload.city), country: text(payload.country, 'Maroc'), timezone: text(payload.timezone, 'Africa/Casablanca'), status: 'draft', metadata_json: { governance_state: 'draft', setup_owner_label: payload.ownerLabel || null, readiness_required: 5, readiness_passed: 1 } } }
  if (request.entityType === 'academic_year') { table = 'angelcare360_academic_years'; insert = { ...insert, year_code: required(payload, 'yearCode', 'Le code'), label: required(payload, 'label', 'Le libellé'), starts_on: required(payload, 'startsOn', 'La date de début'), ends_on: required(payload, 'endsOn', 'La date de fin'), is_current: false, status: 'planned', metadata_json: { governance_state: 'configuring' } } }
  if (request.entityType === 'term') { table = 'angelcare360_terms'; insert = { ...insert, academic_year_id: required(payload, 'academicYearId', 'L’année scolaire'), term_code: required(payload, 'termCode', 'Le code'), label: required(payload, 'label', 'Le libellé'), starts_on: required(payload, 'startsOn', 'La date de début'), ends_on: required(payload, 'endsOn', 'La date de fin'), order_index: numeric(payload.orderIndex, 1), status: 'planned', metadata_json: { governance_state: 'draft', term_type: payload.termType || null } } }
  if (request.entityType === 'class') { table = 'angelcare360_classes'; insert = { ...insert, academic_year_id: required(payload, 'academicYearId', 'L’année scolaire'), class_code: required(payload, 'classCode', 'Le code'), name: required(payload, 'name', 'Le nom'), level: required(payload, 'level', 'Le niveau'), capacity: numeric(payload.capacity), order_index: numeric(payload.orderIndex, 1), status: 'active', metadata_json: { governance_state: 'active', enrollment_frozen: false, reserved_seats: numeric(payload.reservedSeats) } } }
  if (request.entityType === 'section') { table = 'angelcare360_sections'; insert = { ...insert, academic_year_id: required(payload, 'academicYearId', 'L’année scolaire'), class_id: required(payload, 'classId', 'La classe'), section_code: required(payload, 'sectionCode', 'Le code'), name: required(payload, 'name', 'Le nom'), capacity: numeric(payload.capacity), room: optionalText(payload.room), status: 'active', metadata_json: { governance_state: 'active', reserved_seats: numeric(payload.reservedSeats) } } }
  if (request.entityType === 'subject') { table = 'angelcare360_subjects'; insert = { ...insert, subject_code: required(payload, 'subjectCode', 'Le code'), name: required(payload, 'name', 'Le nom'), short_name: optionalText(payload.shortName), department: optionalText(payload.department), credit_hours: payload.creditHours === undefined ? null : numeric(payload.creditHours), status: 'active', metadata_json: { governance_state: 'draft', version_number: 1 } } }
  if (request.entityType === 'assignment') { table = 'angelcare360_teacher_assignments'; insert = { ...insert, academic_year_id: required(payload, 'academicYearId', 'L’année scolaire'), staff_id: required(payload, 'staffId', 'L’enseignant'), class_id: payload.classId || null, section_id: payload.sectionId || null, subject_id: payload.subjectId || null, assignment_role: text(payload.assignmentRole, 'teacher'), weekly_hours: numeric(payload.weeklyHours), assigned_from: payload.assignedFrom || null, assigned_to: payload.assignedTo || null, status: 'active', metadata_json: { governance_state: 'proposed' } } }
  if (request.entityType === 'role') { table = 'angelcare360_roles'; insert = { ...insert, role_key: required(payload, 'roleKey', 'La clé du rôle'), label: required(payload, 'label', 'Le libellé'), description: optionalText(payload.description), scope: text(payload.scope, 'school'), is_system_locked: false, status: 'inactive', metadata_json: { governance_state: 'draft', version_number: 1 } } }
  if (request.entityType === 'delegation') return executeGovernanceEntityAction({ operationKey: 'governance.delegation.create', entityType: 'delegation', idempotencyKey: key, payload })
  if (request.entityType === 'configuration') {
    table = 'angelcare360_governance_configuration_changesets'
    insert = { ...insert, changeset_code: text(payload.changesetCode, code('CFG')), title: required(payload, 'title', 'Le titre'), configuration_key: required(payload, 'configurationKey', 'La configuration'), ownership: text(payload.ownership, 'tenant'), current_value: payload.currentValue || {}, proposed_value: payload.proposedValue || {}, changes_json: Array.isArray(payload.changes) ? payload.changes : [], status: 'draft', effective_at: payload.effectiveAt || null, metadata_json: { rollback_plan: payload.rollbackPlan || null } }
  }
  if (!table) throw new Error(`Création non supportée pour ${request.entityType}.`)
  const { data, error } = await db.from(table).insert(insert).select('*').single()
  if (error) { await finishExecution(db, text(execution.id), 'failed', { message: error.message }, error.message); throw new Error(error.message) }
  const result = { entityId: text(row(data).id), entityType: request.entityType, record: row(data), message: `${request.entityType} créé avec succès.` }
  await finishExecution(db, text(execution.id), 'completed', result)
  await audit({ schoolId, module: 'governance', action: requestAction.operationKey, entityType: request.entityType, entityId: text(row(data).id), after: row(data), metadata: { execution_id: execution.id }, severity: 'notice' })
  return { ok: true, state: 'completed', message: text(result.message), operationKey: requestAction.operationKey, executionId: text(execution.id), entityId: text(row(data).id), result }
}

export async function generateGovernanceBriefing(input: { briefingType: GovernanceBriefing['briefingType']; idempotencyKey?: string | null }): Promise<GovernanceCommandResult> {
  const context = await requireGovernanceContext()
  const db = await createClient()
  const snapshot = await getGovernanceCommandSnapshot()
  const key = idempotency(input.idempotencyKey, { schoolId: snapshot.school.id, briefingType: input.briefingType, generatedDate: dateOnly() })
  const { data: existing } = await db.from('angelcare360_governance_briefing_runs').select('*').eq('school_id', snapshot.school.id).eq('idempotency_key', key).maybeSingle()
  if (existing) return { ok: true, state: 'replayed', message: 'Briefing déjà généré.', entityId: text(row(existing).id), result: row(existing) }
  const active = snapshot.matters.filter((matter) => !TERMINAL_STATES.has(matter.state))
  const selected = input.briefingType === 'capacity_risk' ? active.filter((matter) => matter.category === 'capacity') : input.briefingType === 'assignment_coverage' ? active.filter((matter) => ['assignment', 'subject_coverage'].includes(matter.category)) : input.briefingType === 'access' ? active.filter((matter) => matter.category === 'access') : input.briefingType === 'rollover' ? active.filter((matter) => matter.category === 'rollover' || matter.category === 'academic_structure') : input.briefingType === 'configuration' ? active.filter((matter) => matter.category === 'configuration') : active
  const summary = [
    snapshot.posture.label,
    `${selected.length} matière(s) dans le périmètre du briefing.`,
    `${selected.filter((matter) => matter.severity === 'critical').length} matière(s) critique(s).`,
    `${snapshot.institutions[0]?.readinessPassed || 0}/${snapshot.institutions[0]?.readinessRequired || 0} exigences readiness satisfaites.`,
    `${snapshot.capacities.filter((item) => item.conflictState === 'overcapacity').length} conflit(s) de capacité.`,
  ]
  const briefingJson = { summary, matter_ids: selected.map((matter) => matter.id), metrics: snapshot.metrics, generated_at: now() }
  const { data, error } = await db.from('angelcare360_governance_briefing_runs').insert({ school_id: snapshot.school.id, briefing_type: input.briefingType, title: `Briefing Gouvernance · ${input.briefingType.replaceAll('_', ' ')}`, posture: snapshot.posture.state, briefing_json: briefingJson, source_signature: stableHash({ matters: selected.map((matter) => [matter.fingerprint, matter.state, matter.updatedAt]), metrics: snapshot.metrics }), idempotency_key: key, status: 'generated', requested_by: context.user.id, generated_at: now(), created_by: context.user.id }).select('*').single()
  if (error) throw new Error(error.message)
  await audit({ schoolId: snapshot.school.id, module: 'governance', action: 'governance.briefing.generate', entityType: 'governance_briefing', entityId: text(row(data).id), after: briefingJson })
  return { ok: true, state: 'completed', message: 'Briefing institutionnel généré.', operationKey: 'governance.briefing.generate', entityId: text(row(data).id), result: row(data) }
}

export async function getGovernanceEntityDetail(entityType: GovernanceEntityType, entityId: string) {
  const snapshot = await getGovernanceCommandSnapshot()
  const sources: GovernanceEntityRecord[][] = [snapshot.institutions, snapshot.academicYears, snapshot.terms, snapshot.capacities, snapshot.subjects, snapshot.assignments, snapshot.roles, snapshot.delegations, snapshot.configurations]
  const record = sources.flat().find((item) => item.type === entityType && item.id === entityId) || null
  const matters = snapshot.matters.filter((matter) => matter.sourceId === entityId || matter.linkedRecords.some((linked) => linked.id === entityId))
  const activity = snapshot.activity.filter((event) => event.entityId === entityId)
  return { record, matters, activity, generatedAt: snapshot.generatedAt }
}
