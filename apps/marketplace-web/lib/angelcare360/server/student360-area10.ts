import { createClient } from '@/lib/supabase/server'
import {
  getAngelcare360AccessContext,
  Angelcare360AccessError,
} from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  Angelcare360Area10Attention,
  Angelcare360Area10CommandData,
  Angelcare360Area10Dossier,
  Angelcare360Area10Metric,
  Angelcare360Area10MutationRequest,
  Angelcare360Area10MutationResult,
  Angelcare360Area10StudentSummary,
  Angelcare360Area10TimelineEvent,
  Angelcare360Area10Tone,
  Angelcare360Area10View,
} from '@/types/angelcare360/student360-area10'

type Row = Record<string, any>
type Client = Awaited<ReturnType<typeof createClient>>

type PermissionMode = 'view' | 'create' | 'update' | 'sensitive' | 'attendance' | 'academic'

const VIEWS: Angelcare360Area10View[] = [
  'today', 'students', 'new-enrollments', 'attendance', 'journey', 'health-safety',
  'documents', 'authorizations', 'academics', 'wellbeing', 'incidents', 'services',
  'transport-meals', 'attention', 'transitions', 'history',
]

const AREA10_TABLES = {
  profiles: 'angelcare360_area10_student_profiles',
  health: 'angelcare360_area10_health_instructions',
  medicationPlans: 'angelcare360_area10_medication_plans',
  medicationAdministrations: 'angelcare360_area10_medication_administrations',
  authorizations: 'angelcare360_area10_authorizations',
  adaptationPlans: 'angelcare360_area10_adaptation_plans',
  adaptationCheckpoints: 'angelcare360_area10_adaptation_checkpoints',
  wellbeing: 'angelcare360_area10_wellbeing_observations',
  supportPlans: 'angelcare360_area10_support_plans',
  supportReviews: 'angelcare360_area10_support_reviews',
  incidents: 'angelcare360_area10_incidents',
  transitions: 'angelcare360_area10_transitions',
  departures: 'angelcare360_area10_departures',
  tasks: 'angelcare360_area10_tasks',
  notes: 'angelcare360_area10_notes',
  integrations: 'angelcare360_area10_integration_links',
  receipts: 'angelcare360_area10_action_receipts',
} as const

const OPERATION_MODE: Record<string, PermissionMode> = {
  'student.view': 'view',
  'student.view_sensitive': 'sensitive',
  'student.update_identity': 'update',
  'student.update_status': 'update',
  'student.request_verification': 'update',
  'student_enrollment.view': 'view',
  'student_enrollment.update': 'update',
  'student_enrollment.transition': 'update',
  'student_enrollment.close': 'update',
  'student_placement.view': 'view',
  'student_placement.request_change': 'update',
  'student_placement.preview_transition': 'view',
  'student_health.view': 'view',
  'student_health.view_sensitive': 'sensitive',
  'student_health.add_instruction': 'create',
  'student_health.update_instruction': 'update',
  'student_health.verify': 'update',
  'student_health.expire': 'update',
  'student_health.archive': 'update',
  'student_medication.create': 'create',
  'student_medication.update': 'update',
  'student_medication.record_administration': 'update',
  'student_medication.record_missed': 'update',
  'student_medication.close': 'update',
  'student_document.request': 'create',
  'student_document.receive': 'update',
  'student_document.verify': 'update',
  'student_document.replace': 'update',
  'student_document.archive': 'update',
  'student_consent.view': 'view',
  'student_consent.request': 'create',
  'student_consent.verify': 'update',
  'student_consent.expire': 'update',
  'student_attendance.view': 'attendance',
  'student_attendance.request_correction': 'attendance',
  'student_attendance.justify': 'attendance',
  'student_attendance.escalate': 'attendance',
  'student_academic.view': 'academic',
  'student_academic.request_review': 'academic',
  'student_academic.add_observation': 'academic',
  'student_wellbeing.add_observation': 'create',
  'student_wellbeing.create_support_plan': 'create',
  'student_wellbeing.update_support_plan': 'update',
  'student_wellbeing.review_support_plan': 'update',
  'student_wellbeing.close_support_plan': 'update',
  'student_incident.create': 'create',
  'student_incident.acknowledge': 'update',
  'student_incident.assign': 'update',
  'student_incident.add_evidence': 'update',
  'student_incident.request_followup': 'update',
  'student_incident.resolve': 'update',
  'student_incident.reopen': 'update',
  'student_service.view': 'view',
  'student_service.request_activation': 'update',
  'student_service.request_change': 'update',
  'student_service.request_stop': 'update',
  'student_transition.prepare': 'create',
  'student_transition.validate': 'update',
  'student_transition.request_approval': 'update',
  'student_transition.execute': 'update',
  'student_transition.retry': 'update',
  'student_transition.cancel': 'update',
  'student_departure.prepare': 'create',
  'student_departure.validate': 'update',
  'student_departure.execute': 'update',
  'student_departure.archive': 'update',
  'student_task.assign': 'update',
  'student_task.complete': 'update',
  'student_task.reopen': 'update',
  'student_note.add': 'create',
  'student_history.view': 'view',
  'student_evidence.request': 'update',
  'student_topup.request': 'update',
}

const VIEW_LABELS: Record<Angelcare360Area10View, string> = {
  today: "Aujourd’hui",
  students: 'Tous les élèves',
  'new-enrollments': 'Nouveaux inscrits',
  attendance: 'Présence & journée',
  journey: 'Classes & parcours',
  'health-safety': 'Santé & sécurité',
  documents: 'Documents',
  authorizations: 'Autorisations',
  academics: 'Suivi pédagogique',
  wellbeing: 'Bien-être & comportement',
  incidents: 'Incidents & accompagnement',
  services: 'Services & activités',
  'transport-meals': 'Transport & repas',
  attention: 'À régler',
  transitions: 'Transitions & départs',
  history: 'Historique',
}

function text(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  const result = String(value).trim()
  return result || fallback
}

function optional(value: unknown) {
  const result = text(value)
  return result || null
}

function numberValue(value: unknown) {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

function boolValue(value: unknown) {
  if (typeof value === 'boolean') return value
  const normalized = text(value).toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'active'
}

function normalizeView(value?: string | null): Angelcare360Area10View {
  return VIEWS.includes(value as Angelcare360Area10View) ? (value as Angelcare360Area10View) : 'today'
}

function todayBounds() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

function ageLabel(dateOfBirth: unknown) {
  const raw = text(dateOfBirth)
  if (!raw) return null
  const birth = new Date(raw)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) { years -= 1; months += 12 }
  if (years <= 0) return `${Math.max(months, 0)} mois`
  return `${years} an${years > 1 ? 's' : ''}`
}

function statusLabel(status: unknown) {
  const normalized = text(status, 'active').toLowerCase()
  const labels: Record<string, string> = {
    pre_enrolled: 'Pré-inscrit', enrolled: 'Inscrit', onboarding: 'Accueil en préparation', adapting: 'En adaptation',
    active: 'Actif', long_absence: 'Absence longue', suspended: 'Suspendu', transfer_pending: 'Transfert en préparation',
    departure_pending: 'Départ planifié', inactive: 'Retiré', completed: 'Fin de parcours', archived: 'Archivé',
  }
  return labels[normalized] || text(status, 'Actif')
}

function metadata(row: Row | null | undefined) {
  const value = row?.metadata_json
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
}

function nestedLabel(value: unknown, fallback: string) {
  if (!value) return fallback
  if (Array.isArray(value)) return nestedLabel(value[0], fallback)
  if (typeof value === 'object') {
    const row = value as Row
    return text(row.name || row.label || row.full_name || row.title, fallback)
  }
  return text(value, fallback)
}

function toneForStatus(value: unknown): Angelcare360Area10Tone {
  const normalized = text(value).toLowerCase()
  if (['critical', 'blocked', 'rejected', 'expired', 'missed'].includes(normalized)) return 'danger'
  if (['warning', 'pending', 'attention', 'due', 'incomplete'].includes(normalized)) return 'warning'
  if (['active', 'verified', 'resolved', 'complete', 'completed', 'present'].includes(normalized)) return 'success'
  return 'neutral'
}

async function safeQuery(label: string, query: PromiseLike<any>, warnings: string[]): Promise<Row[]> {
  try {
    const { data, error } = await query
    if (error) {
      warnings.push(`${label}: ${error.message || 'source indisponible'}`)
      return []
    }
    return (data || []) as Row[]
  } catch (error) {
    warnings.push(`${label}: ${error instanceof Error ? error.message : 'source indisponible'}`)
    return []
  }
}

function indexBy<T extends Row>(rows: T[], key: string) {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const id = text(row[key])
    if (!id) continue
    const current = map.get(id) || []
    current.push(row)
    map.set(id, current)
  }
  return map
}

function primaryGuardian(links: Row[]) {
  const preferred = links.find((row) => boolValue(row.is_primary)) || links.find((row) => boolValue(row.is_guardian)) || links[0]
  if (!preferred) return null
  const parent = Array.isArray(preferred.parent) ? preferred.parent[0] : preferred.parent
  return parent && typeof parent === 'object' ? parent as Row : preferred
}

function hasHealthFlag(student: Row, health: Row[]) {
  if (health.some((row) => ['active', 'verified'].includes(text(row.status).toLowerCase()) && ['critical', 'high'].includes(text(row.severity).toLowerCase()))) return true
  const meta = metadata(student)
  return Boolean(meta.allergies || meta.health_alert || student.allergies || student.health_alert)
}

function healthLabel(student: Row, health: Row[]) {
  const critical = health.find((row) => ['critical', 'high'].includes(text(row.severity).toLowerCase()) && text(row.status, 'active') !== 'archived')
  if (critical) return text(critical.title || critical.instruction_type, 'Instruction santé prioritaire')
  const meta = metadata(student)
  return optional(meta.allergies || meta.health_alert || student.allergies || student.health_alert)
}

function currentEnrollment(rows: Row[], academicYearId: string | null) {
  return rows.find((row) => academicYearId && text(row.academic_year_id) === academicYearId && ['active', 'enrolled'].includes(text(row.status || row.enrollment_status).toLowerCase()))
    || rows.find((row) => ['active', 'enrolled'].includes(text(row.status || row.enrollment_status).toLowerCase()))
    || rows[0]
    || null
}

function latestAttendance(rows: Row[]) {
  return [...rows].sort((a, b) => text(b.recorded_at || b.created_at).localeCompare(text(a.recorded_at || a.created_at)))[0] || null
}

function documentState(rows: Row[]) {
  if (!rows.length) return 'Aucun document'
  if (rows.some((row) => ['expired', 'rejected', 'incomplete'].includes(text(row.status).toLowerCase()))) return 'À vérifier'
  if (rows.every((row) => ['verified', 'active', 'valid'].includes(text(row.status).toLowerCase()))) return 'Vérifié'
  return 'À compléter'
}

function isOpen(row: Row) {
  return !['resolved', 'closed', 'archived', 'cancelled', 'completed', 'inactive'].includes(text(row.status).toLowerCase())
}

async function assertStudent(client: Client, schoolId: string, studentId: string) {
  const { data, error } = await client.from('angelcare360_students').select('id, school_id, full_name, status').eq('school_id', schoolId).eq('id', studentId).maybeSingle()
  if (error || !data) throw new Angelcare360AccessError('Ce dossier élève n’existe pas dans votre établissement.', 404)
  return data as Row
}

function can(context: Awaited<ReturnType<typeof getAngelcare360AccessContext>>, mode: PermissionMode) {
  if (!context) return false
  if (context.access.accessLevel === 'super_admin') return true
  const permissions = context.permissions
  if (permissions.has('*') || permissions.has('angelcare360.*')) return true
  const candidates: Record<PermissionMode, string[]> = {
    view: ['eleves.view', 'angelcare360.people.view'],
    create: ['eleves.create', 'angelcare360.people.create', 'eleves.update', 'angelcare360.people.update'],
    update: ['eleves.update', 'angelcare360.people.update'],
    sensitive: ['eleves.view_sensitive', 'angelcare360.people.view_sensitive', 'eleves.view', 'angelcare360.people.view'],
    attendance: ['angelcare360.attendance.view', 'attendance.view', 'presences.view', 'eleves.update', 'angelcare360.people.update'],
    academic: ['angelcare360.academics.view', 'academics.view', 'academique.view', 'eleves.view', 'angelcare360.people.view'],
  }
  return candidates[mode].some((key) => permissions.has(key)) || (mode === 'view' && context.access.canSeePeopleData)
}

async function requireOperation(operation: string) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif.', 403)
  const mode = OPERATION_MODE[operation]
  if (!mode) throw new Angelcare360AccessError('Opération Élève 360 inconnue.', 400)
  if (!can(context, mode)) throw new Angelcare360AccessError('Votre rôle ne permet pas cette action sur le dossier élève.', 403)
  return context
}

function makeSummary(input: {
  student: Row
  schoolName: string
  academicYearLabel: string
  academicYearId: string | null
  enrollments: Row[]
  attendance: Row[]
  links: Row[]
  documents: Row[]
  health: Row[]
  incidents: Row[]
  tasks: Row[]
  invoices: Row[]
  transport: Row[]
  adaptations: Row[]
}): Angelcare360Area10StudentSummary {
  const { student } = input
  const enrollment = currentEnrollment(input.enrollments, input.academicYearId)
  const attendance = latestAttendance(input.attendance)
  const guardian = primaryGuardian(input.links)
  const classRecord = student.class || enrollment?.class
  const sectionRecord = student.section || enrollment?.section
  const attendanceState = text(attendance?.status || attendance?.attendance_status || attendance?.presence_status, 'unknown').toLowerCase()
  const present = ['present', 'late', 'checked_in', 'in'].includes(attendanceState)
  const balance = input.invoices.reduce((sum, row) => sum + numberValue(row.balance_due ?? row.remaining_amount ?? row.balance ?? row.total_due), 0)
  const activeTransport = input.transport.find((row) => ['active', 'assigned', 'confirmed'].includes(text(row.status).toLowerCase()))
  const healthAlert = hasHealthFlag(student, input.health)
  const openIncidents = input.incidents.filter(isOpen).length
  const openTasks = input.tasks.filter(isOpen).length
  const docState = documentState(input.documents)
  const attentionCount = Number(!present && attendanceState !== 'unknown') + Number(healthAlert) + Number(docState !== 'Vérifié') + openIncidents + openTasks + Number(!guardian)
  return {
    id: text(student.id),
    studentCode: optional(student.student_code),
    fullName: text(student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' '), 'Élève'),
    firstName: optional(student.first_name),
    lastName: optional(student.last_name),
    photoUrl: optional(metadata(student).photo_url || student.photo_url),
    dateOfBirth: optional(student.date_of_birth),
    ageLabel: ageLabel(student.date_of_birth),
    status: text(student.status, 'active'),
    statusLabel: statusLabel(student.status),
    admissionStatus: optional(student.admission_status),
    admissionDate: optional(student.admission_date),
    classId: optional(student.current_class_id || enrollment?.class_id),
    className: nestedLabel(classRecord, 'Classe à confirmer'),
    sectionId: optional(student.current_section_id || enrollment?.section_id),
    sectionName: nestedLabel(sectionRecord, 'Section à confirmer'),
    institutionLabel: input.schoolName,
    academicYearLabel: input.academicYearLabel,
    attendanceState,
    attendanceLabel: attendanceState === 'unknown' ? 'Non renseignée' : present ? 'Présent aujourd’hui' : attendanceState === 'absent' ? 'Absent aujourd’hui' : text(attendance?.status || attendanceState),
    arrivedAt: optional(attendance?.check_in_at || attendance?.arrival_at || attendance?.recorded_at),
    departedAt: optional(attendance?.check_out_at || attendance?.departure_at),
    guardianLabel: guardian ? text(guardian.full_name || [guardian.first_name, guardian.last_name].filter(Boolean).join(' '), 'Responsable') : null,
    guardianPhone: guardian ? optional(guardian.phone) : null,
    hasHealthAlert: healthAlert,
    healthAlertLabel: healthLabel(student, input.health),
    documentState: docState,
    openIncidentCount: openIncidents,
    openTaskCount: openTasks,
    balance,
    transportActive: Boolean(activeTransport),
    transportLabel: activeTransport ? text(activeTransport.route?.name || activeTransport.route_name || activeTransport.route_id, 'Transport actif') : null,
    adaptationState: optional(input.adaptations[0]?.status),
    attentionCount,
  }
}

function buildAttention(students: Angelcare360Area10StudentSummary[]): Angelcare360Area10Attention[] {
  const attention: Angelcare360Area10Attention[] = []
  for (const student of students) {
    if (student.attendanceState === 'absent') attention.push({ id: `absence:${student.id}`, studentId: student.id, studentLabel: student.fullName, category: 'attendance', title: 'Absence à vérifier', detail: `${student.fullName} est marqué absent aujourd’hui.`, consequence: 'Une absence non attendue doit être comprise et justifiée selon la politique de l’établissement.', actionLabel: 'Ouvrir la présence', tone: 'warning', deepLink: `/angelcare-360-command-center/presences?student=${student.id}&source=student360` })
    if (student.hasHealthAlert) attention.push({ id: `health:${student.id}`, studentId: student.id, studentLabel: student.fullName, category: 'health', title: student.healthAlertLabel || 'Instruction santé prioritaire', detail: 'Une information de santé ou de sécurité demande une vigilance opérationnelle.', consequence: 'Les personnes autorisées doivent disposer de l’instruction utile, sans exposer inutilement le dossier médical.', actionLabel: 'Voir Santé & sécurité', tone: 'danger', deepLink: `/angelcare-360-command-center/eleves/${student.id}?tab=health` })
    if (student.documentState !== 'Vérifié') attention.push({ id: `documents:${student.id}`, studentId: student.id, studentLabel: student.fullName, category: 'documents', title: 'Dossier documentaire à compléter', detail: `État actuel : ${student.documentState}.`, consequence: 'Une pièce manquante, expirée ou non vérifiée peut bloquer une opération future.', actionLabel: 'Voir les documents', tone: 'warning', deepLink: `/angelcare-360-command-center/eleves/${student.id}?tab=documents` })
    if (student.openIncidentCount > 0) attention.push({ id: `incident:${student.id}`, studentId: student.id, studentLabel: student.fullName, category: 'incident', title: `${student.openIncidentCount} incident${student.openIncidentCount > 1 ? 's' : ''} à suivre`, detail: 'Un dossier incident reste ouvert ou demande une action.', consequence: 'La clôture doit correspondre à une résolution réelle, avec suivi et preuve si nécessaire.', actionLabel: 'Ouvrir les incidents', tone: 'danger', deepLink: `/angelcare-360-command-center/eleves/${student.id}?tab=incidents` })
    if (!student.guardianLabel) attention.push({ id: `family:${student.id}`, studentId: student.id, studentLabel: student.fullName, category: 'family', title: 'Responsable à confirmer', detail: 'Aucun responsable principal actif n’est visible dans la relation opérationnelle.', consequence: 'Les décisions de remise de l’enfant et les communications sensibles exigent une relation familiale vérifiée.', actionLabel: 'Vérifier la famille', tone: 'warning', deepLink: `/angelcare-360-command-center/parents?student=${student.id}&source=student360` })
    if (student.openTaskCount > 0) attention.push({ id: `task:${student.id}`, studentId: student.id, studentLabel: student.fullName, category: 'task', title: `${student.openTaskCount} action${student.openTaskCount > 1 ? 's' : ''} à terminer`, detail: 'Le dossier contient encore une ou plusieurs actions ouvertes.', consequence: 'Une tâche n’est terminée que lorsque son résultat attendu est réellement obtenu.', actionLabel: 'Voir les actions', tone: 'info', deepLink: `/angelcare-360-command-center/eleves/${student.id}?tab=actions` })
  }
  return attention.slice(0, 100)
}

function buildMetrics(students: Angelcare360Area10StudentSummary[], attention: Angelcare360Area10Attention[]): Angelcare360Area10Metric[] {
  const active = students.filter((student) => !['inactive', 'archived'].includes(student.status.toLowerCase())).length
  const present = students.filter((student) => ['present', 'late', 'checked_in', 'in'].includes(student.attendanceState)).length
  const absences = students.filter((student) => student.attendanceState === 'absent').length
  const health = students.filter((student) => student.hasHealthAlert).length
  const incidents = students.reduce((sum, student) => sum + student.openIncidentCount, 0)
  return [
    { key: 'active', label: 'Élèves inscrits', value: active, detail: 'Dossiers actifs dans l’établissement', tone: 'info', targetView: 'students' },
    { key: 'present', label: 'Présents aujourd’hui', value: present, detail: 'Présence enregistrée aujourd’hui', tone: 'success', targetView: 'attendance' },
    { key: 'absent', label: 'Absences à vérifier', value: absences, detail: 'Absences enregistrées ce jour', tone: absences ? 'warning' : 'success', targetView: 'attendance' },
    { key: 'health', label: 'Vigilances santé', value: health, detail: 'Instructions santé ou sécurité actives', tone: health ? 'danger' : 'success', targetView: 'health-safety' },
    { key: 'incidents', label: 'Incidents ouverts', value: incidents, detail: 'Suivis non clôturés', tone: incidents ? 'danger' : 'success', targetView: 'incidents' },
    { key: 'attention', label: 'À régler', value: attention.length, detail: 'Matières opérationnelles actionnables', tone: attention.length ? 'warning' : 'success', targetView: 'attention' },
  ]
}

async function loadSummarySources(client: Client, schoolId: string, studentIds: string[], warnings: string[]) {
  const ids = studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000']
  const { start, end } = todayBounds()
  const [links, documents, enrollments, attendance, health, incidents, tasks, invoices, transport, adaptations] = await Promise.all([
    safeQuery('Relations famille', client.from('angelcare360_student_parent_links').select('*, parent:angelcare360_parents(id, full_name, first_name, last_name, phone, email, status)').eq('school_id', schoolId).in('student_id', ids).eq('status', 'active'), warnings),
    safeQuery('Documents élèves', client.from('angelcare360_documents').select('*').eq('school_id', schoolId).eq('documentable_type', 'student').in('documentable_id', ids), warnings),
    safeQuery('Parcours de classe', client.from('angelcare360_class_enrollments').select('*, class:angelcare360_classes(id,name,class_code,level), section:angelcare360_sections(id,name,section_code)').eq('school_id', schoolId).in('student_id', ids).order('enrolled_on', { ascending: false }), warnings),
    safeQuery('Présence du jour', client.from('angelcare360_attendance_records').select('*').eq('school_id', schoolId).in('student_id', ids).gte('recorded_at', start).lt('recorded_at', end), warnings),
    safeQuery('Instructions santé', client.from(AREA10_TABLES.health).select('*').eq('school_id', schoolId).in('student_id', ids), warnings),
    safeQuery('Incidents élève', client.from(AREA10_TABLES.incidents).select('*').eq('school_id', schoolId).in('student_id', ids), warnings),
    safeQuery('Actions élève', client.from(AREA10_TABLES.tasks).select('*').eq('school_id', schoolId).in('student_id', ids), warnings),
    safeQuery('Contexte financier', client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).in('student_id', ids), warnings),
    safeQuery('Affectations transport', client.from('angelcare360_transport_assignments').select('*, route:angelcare360_transport_routes(id,name,route_code)').eq('school_id', schoolId).in('student_id', ids), warnings),
    safeQuery('Plans adaptation', client.from(AREA10_TABLES.adaptationPlans).select('*').eq('school_id', schoolId).in('student_id', ids).order('created_at', { ascending: false }), warnings),
  ])
  return { links, documents, enrollments, attendance, health, incidents, tasks, invoices, transport, adaptations }
}

async function loadDossier(client: Client, schoolId: string, academicYearId: string | null, summary: Angelcare360Area10StudentSummary, warnings: string[]): Promise<Angelcare360Area10Dossier> {
  const studentId = summary.id
  const [studentRows, family, emergencyContacts, enrollmentHistory, healthInstructions, medicationPlans, medicationAdministrations, documents, authorizations, attendance, reportCards, marks, wellbeing, supportPlans, incidents, transport, invoices, adaptationPlans, transitions, departures, tasks, notes, handover, audits] = await Promise.all([
    safeQuery('Identité élève', client.from('angelcare360_students').select('*').eq('school_id', schoolId).eq('id', studentId).limit(1), warnings),
    safeQuery('Famille opérationnelle', client.from('angelcare360_student_parent_links').select('*, parent:angelcare360_parents(*)').eq('school_id', schoolId).eq('student_id', studentId), warnings),
    safeQuery('Contacts urgence', client.from('angelcare360_emergency_contacts').select('*').eq('school_id', schoolId).eq('contactable_type', 'student').eq('contactable_id', studentId), warnings),
    safeQuery('Historique inscriptions', client.from('angelcare360_class_enrollments').select('*, class:angelcare360_classes(id,name,class_code,level), section:angelcare360_sections(id,name,section_code)').eq('school_id', schoolId).eq('student_id', studentId).order('enrolled_on', { ascending: false }), warnings),
    safeQuery('Santé sécurité', client.from(AREA10_TABLES.health).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('effective_from', { ascending: false }), warnings),
    safeQuery('Plans médicaments', client.from(AREA10_TABLES.medicationPlans).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }), warnings),
    safeQuery('Administration médicaments', client.from(AREA10_TABLES.medicationAdministrations).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('administered_at', { ascending: false }).limit(100), warnings),
    safeQuery('Documents', client.from('angelcare360_documents').select('*').eq('school_id', schoolId).eq('documentable_type', 'student').eq('documentable_id', studentId).order('created_at', { ascending: false }), warnings),
    safeQuery('Autorisations', client.from(AREA10_TABLES.authorizations).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }), warnings),
    safeQuery('Historique présence', client.from('angelcare360_attendance_records').select('*').eq('school_id', schoolId).eq('student_id', studentId).order('recorded_at', { ascending: false }).limit(120), warnings),
    safeQuery('Bulletins', client.from('angelcare360_report_cards').select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }).limit(20), warnings),
    safeQuery('Notes académiques', client.from('angelcare360_marks').select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }).limit(80), warnings),
    safeQuery('Observations bien-être', client.from(AREA10_TABLES.wellbeing).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('observed_at', { ascending: false }).limit(80), warnings),
    safeQuery('Plans accompagnement', client.from(AREA10_TABLES.supportPlans).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }), warnings),
    safeQuery('Incidents', client.from(AREA10_TABLES.incidents).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('occurred_at', { ascending: false }), warnings),
    safeQuery('Transport', client.from('angelcare360_transport_assignments').select('*, route:angelcare360_transport_routes(*), stop:angelcare360_transport_stops(*)').eq('school_id', schoolId).eq('student_id', studentId), warnings),
    safeQuery('Finance', client.from('angelcare360_invoices').select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }).limit(50), warnings),
    safeQuery('Adaptation', client.from(AREA10_TABLES.adaptationPlans).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }), warnings),
    safeQuery('Transitions', client.from(AREA10_TABLES.transitions).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('effective_at', { ascending: false }), warnings),
    safeQuery('Départs', client.from(AREA10_TABLES.departures).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('effective_at', { ascending: false }), warnings),
    safeQuery('Actions', client.from(AREA10_TABLES.tasks).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('due_at', { ascending: true }), warnings),
    safeQuery('Notes', client.from(AREA10_TABLES.notes).select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }).limit(100), warnings),
    safeQuery('Handover admissions', client.from('angelcare360_area9_handover_outcomes').select('*').eq('school_id', schoolId).eq('student_id', studentId).order('created_at', { ascending: false }), warnings),
    safeQuery('Historique audit', client.from('angelcare360_audit_logs').select('*').eq('school_id', schoolId).eq('entity_id', studentId).order('created_at', { ascending: false }).limit(150), warnings),
  ])

  const timeline: Angelcare360Area10TimelineEvent[] = []
  for (const row of enrollmentHistory) timeline.push({ id: `enrollment:${row.id}`, at: optional(row.enrolled_on || row.created_at), category: 'Parcours', title: `Affectation · ${nestedLabel(row.class, 'Classe')}`, detail: `${nestedLabel(row.section, 'Section')} · ${text(row.enrollment_status || row.status, 'historique')}`, source: 'Aire 3 · Classes', tone: 'violet' })
  for (const row of incidents) timeline.push({ id: `incident:${row.id}`, at: optional(row.occurred_at || row.created_at), category: 'Incident', title: text(row.title || row.incident_type, 'Incident'), detail: text(row.facts || row.summary || row.status, 'Suivi incident'), source: 'Élève 360', tone: toneForStatus(row.severity || row.status) })
  for (const row of transitions) timeline.push({ id: `transition:${row.id}`, at: optional(row.effective_at || row.created_at), category: 'Transition', title: text(row.transition_type, 'Transition'), detail: `${text(row.from_label, 'Situation actuelle')} → ${text(row.to_label, 'Situation cible')}`, source: 'Élève 360 + source canonique', tone: 'violet' })
  for (const row of audits) timeline.push({ id: `audit:${row.id}`, at: optional(row.created_at), category: text(row.module, 'Historique'), title: text(row.action, 'Événement'), detail: `${text(row.entity_type)} · ${text(row.severity)}`, source: 'Aire 8 · Audit', tone: toneForStatus(row.severity) })
  timeline.sort((a, b) => text(b.at).localeCompare(text(a.at)))

  const academics = [...reportCards.map((row) => ({ ...row, source_kind: 'report_card' })), ...marks.map((row) => ({ ...row, source_kind: 'mark' }))]
  const services: Row[] = []
  const identity = studentRows[0] || {}
  return {
    student: summary,
    identity,
    enrollmentHistory,
    family,
    emergencyContacts,
    healthInstructions,
    medicationPlans,
    medicationAdministrations,
    documents,
    authorizations,
    attendance,
    academics,
    wellbeing,
    supportPlans,
    incidents,
    services,
    transport,
    finance: invoices,
    adaptationPlans,
    transitions,
    departures,
    tasks,
    notes,
    admissionHandover: handover,
    timeline: timeline.slice(0, 200),
    sourceWarnings: [...warnings],
  }
}

export async function loadAngelcare360Area10StudentCommand(input?: { view?: string | null; studentId?: string | null }): Promise<Angelcare360Area10CommandData> {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif.', 403)
  if (!can(context, 'view')) throw new Angelcare360AccessError('Votre rôle ne permet pas de consulter les dossiers élèves.', 403)
  const client = await createClient()
  const warnings: string[] = []
  const students = await safeQuery('Élèves', client.from('angelcare360_students').select('*, class:angelcare360_classes(id,name,class_code,level), section:angelcare360_sections(id,name,section_code)').eq('school_id', context.school.id).order('full_name', { ascending: true }).limit(500), warnings)
  const studentIds = students.map((row) => text(row.id)).filter(Boolean)
  const sources = await loadSummarySources(client, context.school.id, studentIds, warnings)
  const by = {
    links: indexBy(sources.links, 'student_id'), documents: indexBy(sources.documents, 'documentable_id'), enrollments: indexBy(sources.enrollments, 'student_id'),
    attendance: indexBy(sources.attendance, 'student_id'), health: indexBy(sources.health, 'student_id'), incidents: indexBy(sources.incidents, 'student_id'),
    tasks: indexBy(sources.tasks, 'student_id'), invoices: indexBy(sources.invoices, 'student_id'), transport: indexBy(sources.transport, 'student_id'), adaptations: indexBy(sources.adaptations, 'student_id'),
  }
  const summaries = students.map((student) => makeSummary({
    student,
    schoolName: context.school!.name,
    academicYearLabel: context.academicYear?.label || 'Année scolaire à configurer',
    academicYearId: context.academicYear?.id || null,
    enrollments: by.enrollments.get(text(student.id)) || [], attendance: by.attendance.get(text(student.id)) || [], links: by.links.get(text(student.id)) || [],
    documents: by.documents.get(text(student.id)) || [], health: by.health.get(text(student.id)) || [], incidents: by.incidents.get(text(student.id)) || [], tasks: by.tasks.get(text(student.id)) || [],
    invoices: by.invoices.get(text(student.id)) || [], transport: by.transport.get(text(student.id)) || [], adaptations: by.adaptations.get(text(student.id)) || [],
  }))
  const attention = buildAttention(summaries)
  const selectedSummary = input?.studentId ? summaries.find((student) => student.id === input.studentId) || null : null
  const selectedWarnings: string[] = []
  const selectedStudent = selectedSummary ? await loadDossier(client, context.school.id, context.academicYear?.id || null, selectedSummary, selectedWarnings) : null
  return {
    view: normalizeView(input?.view),
    school: { id: context.school.id, name: context.school.name },
    academicYear: { id: context.academicYear?.id || null, label: context.academicYear?.label || 'Année scolaire à configurer' },
    metrics: buildMetrics(summaries, attention),
    students: summaries,
    attention,
    selectedStudent,
    sourceWarnings: [...new Set([...warnings, ...selectedWarnings])],
    permissions: [...context.permissions],
    generatedAt: new Date().toISOString(),
  }
}

function payloadText(payload: Row, key: string, fallback = '') { return text(payload[key], fallback) }
function payloadOptional(payload: Row, key: string) { return optional(payload[key]) }

async function existingReceipt(client: Client, schoolId: string, operation: string, key: string) {
  const { data } = await client.from(AREA10_TABLES.receipts).select('*').eq('school_id', schoolId).eq('action_key', operation).eq('idempotency_key', key).maybeSingle()
  return data as Row | null
}

async function writeReceipt(client: Client, input: { schoolId: string; studentId: string; operation: string; key: string; actorId: string; result: Row }) {
  const { data, error } = await client.from(AREA10_TABLES.receipts).insert({ school_id: input.schoolId, student_id: input.studentId, action_key: input.operation, idempotency_key: input.key, actor_user_id: input.actorId, result_json: input.result, status: 'completed' }).select('id').single()
  if (error) throw new Error(`Le reçu d’intégrité n’a pas pu être écrit : ${error.message}`)
  return text((data as Row)?.id)
}

async function insertTask(client: Client, schoolId: string, studentId: string, actorId: string, payload: Row, defaults: { title: string; category: string; deepLink?: string | null }) {
  const { data, error } = await client.from(AREA10_TABLES.tasks).insert({ school_id: schoolId, student_id: studentId, category: defaults.category, title: payloadText(payload, 'title', defaults.title), detail: payloadOptional(payload, 'detail'), assigned_to_user_id: payloadOptional(payload, 'assignedToUserId'), due_at: payloadOptional(payload, 'dueAt'), expected_outcome: payloadOptional(payload, 'expectedOutcome'), source_deep_link: defaults.deepLink || payloadOptional(payload, 'deepLink'), priority: payloadText(payload, 'priority', 'normal'), status: 'open', created_by_user_id: actorId }).select('*').single()
  if (error) throw new Error(error.message)
  return data as Row
}

async function mutate(client: Client, schoolId: string, studentId: string, actorId: string, operation: string, payload: Row): Promise<{ data: Row; message: string; deepLink?: string | null }> {
  const now = new Date().toISOString()
  if (operation === 'student.update_identity') {
    const allowed: Row = {}
    for (const key of ['first_name', 'last_name', 'full_name', 'date_of_birth', 'gender', 'national_id']) if (payload[key] !== undefined) allowed[key] = payload[key]
    const { data, error } = await client.from('angelcare360_students').update(allowed).eq('school_id', schoolId).eq('id', studentId).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Identité élève mise à jour.' }
  }
  if (operation === 'student.update_status') {
    const status = payloadText(payload, 'status', 'active')
    const { data, error } = await client.from('angelcare360_students').update({ status }).eq('school_id', schoolId).eq('id', studentId).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: `Statut élève mis à jour : ${statusLabel(status)}.` }
  }
  if (operation === 'student_health.add_instruction') {
    const { data, error } = await client.from(AREA10_TABLES.health).insert({ school_id: schoolId, student_id: studentId, instruction_type: payloadText(payload, 'instructionType', 'health'), title: payloadText(payload, 'title', 'Instruction santé'), instruction: payloadText(payload, 'instruction'), severity: payloadText(payload, 'severity', 'standard'), source_kind: payloadText(payload, 'sourceKind', 'family_declaration'), source_reference: payloadOptional(payload, 'sourceReference'), evidence_document_id: payloadOptional(payload, 'evidenceDocumentId'), effective_from: payloadOptional(payload, 'effectiveFrom') || now, effective_until: payloadOptional(payload, 'effectiveUntil'), status: 'active', created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Instruction santé ajoutée avec sa source et sa période de validité.' }
  }
  if (['student_health.update_instruction', 'student_health.verify', 'student_health.expire', 'student_health.archive'].includes(operation)) {
    const id = payloadText(payload, 'id')
    if (!id) throw new Error('L’instruction santé à modifier est obligatoire.')
    const patch: Row = operation === 'student_health.verify' ? { status: 'verified', verified_at: now, verified_by_user_id: actorId } : operation === 'student_health.expire' ? { status: 'expired', effective_until: payloadOptional(payload, 'effectiveUntil') || now } : operation === 'student_health.archive' ? { status: 'archived', archived_at: now } : { title: payloadOptional(payload, 'title'), instruction: payloadOptional(payload, 'instruction'), severity: payloadOptional(payload, 'severity'), effective_until: payloadOptional(payload, 'effectiveUntil') }
    Object.keys(patch).forEach((key) => patch[key] === null && delete patch[key])
    const { data, error } = await client.from(AREA10_TABLES.health).update(patch).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Instruction santé mise à jour.' }
  }
  if (operation === 'student_medication.create') {
    const { data, error } = await client.from(AREA10_TABLES.medicationPlans).insert({ school_id: schoolId, student_id: studentId, medication_name: payloadText(payload, 'medicationName'), dosage_instruction: payloadText(payload, 'dosageInstruction'), schedule_instruction: payloadText(payload, 'scheduleInstruction'), authorization_document_id: payloadOptional(payload, 'authorizationDocumentId'), medical_evidence_document_id: payloadOptional(payload, 'medicalEvidenceDocumentId'), effective_from: payloadOptional(payload, 'effectiveFrom') || now, effective_until: payloadOptional(payload, 'effectiveUntil'), status: 'active', created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Plan médicament créé sous contrôle documentaire.' }
  }
  if (operation === 'student_medication.update' || operation === 'student_medication.close') {
    const id = payloadText(payload, 'id')
    if (!id) throw new Error('Le plan médicament est obligatoire.')
    const patch = operation === 'student_medication.close' ? { status: 'closed', effective_until: payloadOptional(payload, 'effectiveUntil') || now } : { dosage_instruction: payloadOptional(payload, 'dosageInstruction'), schedule_instruction: payloadOptional(payload, 'scheduleInstruction'), effective_until: payloadOptional(payload, 'effectiveUntil') }
    const { data, error } = await client.from(AREA10_TABLES.medicationPlans).update(patch).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Plan médicament mis à jour.' }
  }
  if (operation === 'student_medication.record_administration' || operation === 'student_medication.record_missed') {
    const { data, error } = await client.from(AREA10_TABLES.medicationAdministrations).insert({ school_id: schoolId, student_id: studentId, medication_plan_id: payloadOptional(payload, 'medicationPlanId'), administered_at: payloadOptional(payload, 'administeredAt') || now, outcome: operation.endsWith('missed') ? 'missed' : 'administered', dosage_given: payloadOptional(payload, 'dosageGiven'), note: payloadOptional(payload, 'note'), administered_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: operation.endsWith('missed') ? 'Administration manquée enregistrée et traçable.' : 'Administration enregistrée.' }
  }
  if (['student_consent.request', 'student_consent.verify', 'student_consent.expire'].includes(operation)) {
    if (operation === 'student_consent.request') {
      const { data, error } = await client.from(AREA10_TABLES.authorizations).insert({ school_id: schoolId, student_id: studentId, authorization_type: payloadText(payload, 'authorizationType', 'consent'), scope_label: payloadText(payload, 'scopeLabel', 'Autorisation opérationnelle'), valid_from: payloadOptional(payload, 'validFrom'), valid_until: payloadOptional(payload, 'validUntil'), evidence_document_id: payloadOptional(payload, 'evidenceDocumentId'), status: 'requested', created_by_user_id: actorId }).select('*').single()
      if (error) throw new Error(error.message)
      return { data: data as Row, message: 'Autorisation demandée.' }
    }
    const id = payloadText(payload, 'id')
    const patch = operation.endsWith('verify') ? { status: 'verified', verified_at: now, verified_by_user_id: actorId } : { status: 'expired', valid_until: now }
    const { data, error } = await client.from(AREA10_TABLES.authorizations).update(patch).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Autorisation mise à jour.' }
  }
  if (operation === 'student_wellbeing.add_observation' || operation === 'student_academic.add_observation') {
    const { data, error } = await client.from(AREA10_TABLES.wellbeing).insert({ school_id: schoolId, student_id: studentId, observation_kind: operation.startsWith('student_academic') ? 'academic_support' : payloadText(payload, 'observationKind', 'wellbeing'), observed_at: payloadOptional(payload, 'observedAt') || now, observed_fact: payloadText(payload, 'observedFact'), context: payloadOptional(payload, 'context'), adult_interpretation: payloadOptional(payload, 'adultInterpretation'), action_taken: payloadOptional(payload, 'actionTaken'), follow_up: payloadOptional(payload, 'followUp'), created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Observation factuelle ajoutée au dossier.' }
  }
  if (operation === 'student_wellbeing.create_support_plan') {
    const { data, error } = await client.from(AREA10_TABLES.supportPlans).insert({ school_id: schoolId, student_id: studentId, plan_type: payloadText(payload, 'planType', 'support'), objective: payloadText(payload, 'objective'), need_statement: payloadOptional(payload, 'needStatement'), actions_json: payload.actions || [], owner_user_id: payloadOptional(payload, 'ownerUserId'), starts_at: payloadOptional(payload, 'startsAt') || now, review_at: payloadOptional(payload, 'reviewAt'), success_condition: payloadOptional(payload, 'successCondition'), status: 'active', created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Plan d’accompagnement créé.' }
  }
  if (['student_wellbeing.update_support_plan', 'student_wellbeing.close_support_plan'].includes(operation)) {
    const id = payloadText(payload, 'id')
    const patch = operation.endsWith('close_support_plan') ? { status: 'closed', closed_at: now, outcome: payloadOptional(payload, 'outcome') } : { objective: payloadOptional(payload, 'objective'), actions_json: payload.actions, review_at: payloadOptional(payload, 'reviewAt'), success_condition: payloadOptional(payload, 'successCondition') }
    const { data, error } = await client.from(AREA10_TABLES.supportPlans).update(patch).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Plan d’accompagnement mis à jour.' }
  }
  if (operation === 'student_wellbeing.review_support_plan') {
    const { data, error } = await client.from(AREA10_TABLES.supportReviews).insert({ school_id: schoolId, student_id: studentId, support_plan_id: payloadOptional(payload, 'supportPlanId'), reviewed_at: now, outcome: payloadText(payload, 'outcome', 'reviewed'), evidence: payloadOptional(payload, 'evidence'), next_review_at: payloadOptional(payload, 'nextReviewAt'), reviewed_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Revue du plan enregistrée.' }
  }
  if (operation === 'student_incident.create') {
    const { data, error } = await client.from(AREA10_TABLES.incidents).insert({ school_id: schoolId, student_id: studentId, incident_type: payloadText(payload, 'incidentType', 'operational'), title: payloadText(payload, 'title', 'Incident élève'), facts: payloadText(payload, 'facts'), occurred_at: payloadOptional(payload, 'occurredAt') || now, location_label: payloadOptional(payload, 'locationLabel'), severity: payloadText(payload, 'severity', 'standard'), immediate_action: payloadOptional(payload, 'immediateAction'), parent_notification_state: payloadText(payload, 'parentNotificationState', 'not_required'), status: 'open', created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Incident ouvert avec les faits observés.' }
  }
  if (operation.startsWith('student_incident.') && operation !== 'student_incident.create') {
    const id = payloadText(payload, 'id')
    if (!id) throw new Error('L’incident est obligatoire.')
    const patchMap: Record<string, Row> = {
      'student_incident.acknowledge': { status: 'acknowledged', acknowledged_at: now, acknowledged_by_user_id: actorId },
      'student_incident.assign': { assigned_to_user_id: payloadOptional(payload, 'assignedToUserId'), status: 'in_progress' },
      'student_incident.add_evidence': { evidence_json: payload.evidence || payload.evidenceJson || {} },
      'student_incident.request_followup': { follow_up_required: true, follow_up_due_at: payloadOptional(payload, 'dueAt'), status: 'follow_up' },
      'student_incident.resolve': { status: 'resolved', resolution: payloadOptional(payload, 'resolution'), resolved_at: now, resolved_by_user_id: actorId },
      'student_incident.reopen': { status: 'reopened', resolved_at: null, resolution: null },
    }
    const { data, error } = await client.from(AREA10_TABLES.incidents).update(patchMap[operation] || {}).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Incident mis à jour.' }
  }
  if (operation === 'student_transition.prepare') {
    const { data, error } = await client.from(AREA10_TABLES.transitions).insert({ school_id: schoolId, student_id: studentId, transition_type: payloadText(payload, 'transitionType', 'class_change'), from_label: payloadOptional(payload, 'fromLabel'), to_label: payloadText(payload, 'toLabel'), target_class_id: payloadOptional(payload, 'targetClassId'), target_section_id: payloadOptional(payload, 'targetSectionId'), effective_at: payloadOptional(payload, 'effectiveAt'), reason: payloadOptional(payload, 'reason'), readiness_json: payload.readiness || {}, status: 'prepared', created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Transition préparée sans modifier la source canonique.' }
  }
  if (operation.startsWith('student_transition.') && operation !== 'student_transition.prepare') {
    const id = payloadText(payload, 'id')
    if (!id) throw new Error('La transition est obligatoire.')
    const state: Record<string, string> = { 'student_transition.validate': 'validated', 'student_transition.request_approval': 'approval_requested', 'student_transition.execute': 'ready_for_canonical_execution', 'student_transition.retry': 'prepared', 'student_transition.cancel': 'cancelled' }
    const patch: Row = { status: state[operation], updated_by_user_id: actorId }
    if (operation === 'student_transition.execute') patch.canonical_deep_link = `/angelcare-360-command-center/administration?plane=classes-capacity&student=${encodeURIComponent(studentId)}&source=student360`
    const { data, error } = await client.from(AREA10_TABLES.transitions).update(patch).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: operation === 'student_transition.execute' ? 'Transition prête : la modification de classe reste sous l’autorité canonique des classes.' : 'Transition mise à jour.', deepLink: operation === 'student_transition.execute' ? patch.canonical_deep_link : null }
  }
  if (operation === 'student_departure.prepare') {
    const { data, error } = await client.from(AREA10_TABLES.departures).insert({ school_id: schoolId, student_id: studentId, departure_type: payloadText(payload, 'departureType', 'withdrawal'), effective_at: payloadOptional(payload, 'effectiveAt'), reason: payloadOptional(payload, 'reason'), checklist_json: payload.checklist || {}, status: 'prepared', created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Départ préparé avec contrôle des obligations.' }
  }
  if (operation.startsWith('student_departure.') && operation !== 'student_departure.prepare') {
    const id = payloadText(payload, 'id')
    if (!id) throw new Error('Le plan de départ est obligatoire.')
    if (operation === 'student_departure.execute') {
      const effectiveAt = payloadOptional(payload, 'effectiveAt') || now
      const { error: studentError } = await client.from('angelcare360_students').update({ status: 'inactive', exit_date: effectiveAt.slice(0, 10) }).eq('school_id', schoolId).eq('id', studentId)
      if (studentError) throw new Error(studentError.message)
    }
    const state: Record<string, string> = { 'student_departure.validate': 'validated', 'student_departure.execute': 'executed', 'student_departure.archive': 'archived' }
    const { data, error } = await client.from(AREA10_TABLES.departures).update({ status: state[operation], updated_by_user_id: actorId, completed_at: operation === 'student_departure.execute' ? now : undefined }).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: operation === 'student_departure.execute' ? 'Départ exécuté et cycle élève clôturé sans supprimer l’historique.' : 'Plan de départ mis à jour.' }
  }
  if (operation === 'student_task.assign') {
    const data = await insertTask(client, schoolId, studentId, actorId, payload, { title: 'Action Élève 360', category: payloadText(payload, 'category', 'student') })
    return { data, message: 'Action attribuée.' }
  }
  if (operation === 'student_task.complete' || operation === 'student_task.reopen') {
    const id = payloadText(payload, 'id')
    const patch = operation.endsWith('complete') ? { status: 'completed', completed_at: now, completion_note: payloadOptional(payload, 'completionNote') } : { status: 'open', completed_at: null, completion_note: null }
    const { data, error } = await client.from(AREA10_TABLES.tasks).update(patch).eq('school_id', schoolId).eq('student_id', studentId).eq('id', id).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: operation.endsWith('complete') ? 'Action terminée avec son résultat.' : 'Action rouverte.' }
  }
  if (operation === 'student_note.add') {
    const { data, error } = await client.from(AREA10_TABLES.notes).insert({ school_id: schoolId, student_id: studentId, note_kind: payloadText(payload, 'noteKind', 'operational'), title: payloadOptional(payload, 'title'), body: payloadText(payload, 'body'), visibility: payloadText(payload, 'visibility', 'internal'), created_by_user_id: actorId }).select('*').single()
    if (error) throw new Error(error.message)
    return { data: data as Row, message: 'Note opérationnelle ajoutée.' }
  }

  const deepLinks: Record<string, string> = {
    'student.request_verification': `/angelcare-360-command-center/eleves/${studentId}?tab=overview`,
    'student_placement.request_change': `/angelcare-360-command-center/administration?plane=classes-capacity&student=${studentId}&source=student360`,
    'student_placement.preview_transition': `/angelcare-360-command-center/administration?plane=classes-capacity&student=${studentId}&source=student360`,
    'student_document.request': `/angelcare-360-command-center/personnes/documents?student=${studentId}&source=student360`,
    'student_document.receive': `/angelcare-360-command-center/personnes/documents?student=${studentId}&source=student360`,
    'student_document.verify': `/angelcare-360-command-center/personnes/documents?student=${studentId}&source=student360`,
    'student_document.replace': `/angelcare-360-command-center/personnes/documents?student=${studentId}&source=student360`,
    'student_document.archive': `/angelcare-360-command-center/personnes/documents?student=${studentId}&source=student360`,
    'student_attendance.view': `/angelcare-360-command-center/presences?student=${studentId}&source=student360`,
    'student_attendance.request_correction': `/angelcare-360-command-center/presences?student=${studentId}&source=student360`,
    'student_attendance.justify': `/angelcare-360-command-center/presences?student=${studentId}&source=student360`,
    'student_attendance.escalate': `/angelcare-360-command-center/presences?student=${studentId}&source=student360`,
    'student_academic.view': `/angelcare-360-command-center/academique?student=${studentId}&source=student360`,
    'student_academic.request_review': `/angelcare-360-command-center/academique?student=${studentId}&source=student360`,
    'student_service.view': `/angelcare-360-command-center/eleves/${studentId}?tab=services`,
    'student_service.request_activation': `/angelcare-360-command-center/eleves/${studentId}?tab=services`,
    'student_service.request_change': `/angelcare-360-command-center/eleves/${studentId}?tab=services`,
    'student_service.request_stop': `/angelcare-360-command-center/eleves/${studentId}?tab=services`,
    'student_history.view': `/angelcare-360-command-center/administration?plane=audit&entity=student&entityId=${studentId}&source=student360`,
    'student_evidence.request': `/angelcare-360-command-center/administration?plane=audit&view=evidence&entity=student&entityId=${studentId}&source=student360`,
    'student_topup.request': `/angelcare-360-operator/platform?source=student360`,
    'student_enrollment.view': `/angelcare-360-command-center/admissions?view=enrollments&student=${studentId}&source=student360`,
    'student_enrollment.update': `/angelcare-360-command-center/admissions?view=enrollments&student=${studentId}&source=student360`,
    'student_enrollment.transition': `/angelcare-360-command-center/administration?plane=classes-capacity&student=${studentId}&source=student360`,
    'student_enrollment.close': `/angelcare-360-command-center/eleves/${studentId}?tab=journey`,
    'student_health.view': `/angelcare-360-command-center/eleves/${studentId}?tab=health`,
    'student_health.view_sensitive': `/angelcare-360-command-center/eleves/${studentId}?tab=health`,
    'student_consent.view': `/angelcare-360-command-center/eleves/${studentId}?tab=documents`,
  }
  const deepLink = deepLinks[operation]
  if (!deepLink) throw new Error('Cette opération n’a pas encore de mutation directe autorisée.')
  const task = await insertTask(client, schoolId, studentId, actorId, payload, { title: `Action demandée · ${operation}`, category: 'source_authority', deepLink })
  return { data: task, message: 'La demande est enregistrée. La source canonique reste l’autorité de modification.', deepLink }
}

export async function executeAngelcare360Area10Operation(request: Angelcare360Area10MutationRequest): Promise<Angelcare360Area10MutationResult> {
  const operation = text(request.operation)
  const studentId = text(request.studentId)
  const idempotencyKey = text(request.idempotencyKey)
  if (!operation || !studentId || !idempotencyKey) throw new Angelcare360AccessError('Opération, élève et clé d’intégrité sont obligatoires.', 422)
  const context = await requireOperation(operation)
  const client = await createClient()
  await assertStudent(client, context.school!.id, studentId)
  const prior = await existingReceipt(client, context.school!.id, operation, idempotencyKey)
  if (prior) {
    const result = prior.result_json && typeof prior.result_json === 'object' ? prior.result_json as Row : {}
    return { ok: true, operation, studentId, receiptId: text(prior.id), message: text(result.message, 'Opération déjà enregistrée.'), deepLink: optional(result.deepLink), refresh: true, data: result.data || null }
  }
  const payload = (request.payload || {}) as Row
  const before = { operation, studentId }
  const mutation = await mutate(client, context.school!.id, studentId, context.user.id, operation, payload)
  const result: Row = { message: mutation.message, deepLink: mutation.deepLink || null, data: mutation.data || null }
  const receiptId = await writeReceipt(client, { schoolId: context.school!.id, studentId, operation, key: idempotencyKey, actorId: context.user.id, result })
  await recordAngelcare360AuditEventServer({
    schoolId: context.school!.id,
    category: 'student',
    module: 'student360',
    action: operation,
    entityType: 'student',
    entityId: studentId,
    severity: operation.includes('incident') || operation.includes('health') ? 'warning' : 'info',
    beforeData: before,
    afterData: mutation.data || {},
    metadata: { area: 10, idempotency_key: idempotencyKey, receipt_id: receiptId, source_authority_preserved: true },
  })
  return { ok: true, operation, studentId, receiptId, message: mutation.message, deepLink: mutation.deepLink || null, refresh: true, data: mutation.data || null }
}

export const ANGELCARE360_AREA10_VIEWS = VIEWS
export const ANGELCARE360_AREA10_VIEW_LABELS = VIEW_LABELS
export const ANGELCARE360_AREA10_OPERATION_PERMISSIONS = OPERATION_MODE
