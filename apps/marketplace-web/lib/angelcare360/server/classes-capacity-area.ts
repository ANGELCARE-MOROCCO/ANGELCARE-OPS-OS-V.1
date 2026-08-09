import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type {
  CapacityActionKey,
  CapacityActionRequest,
  CapacityActionResult,
  CapacityAttentionItem,
  CapacityChild,
  CapacityClassRecord,
  CapacityDossierKind,
  CapacityEntitlement,
  CapacityHistoryEvent,
  CapacityHumanStatus,
  CapacityMovementItem,
  CapacityMovementRun,
  CapacityNote,
  CapacityProjection,
  CapacityReservation,
  CapacitySectionRecord,
  CapacityTask,
  CapacityTone,
  CapacityWaitingRequest,
  ClassesCapacitySnapshot,
} from '@/types/angelcare360/classes-capacity-area'

type Db = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, unknown>

const EDIT_ACCESS = new Set(['super_admin', 'direction', 'administration', 'qualite'])
const APPROVAL_ACCESS = new Set(['super_admin', 'direction', 'administration'])
const MOVEMENT_ACCESS = new Set(['super_admin', 'direction', 'administration', 'admissions', 'qualite'])
const TERMINAL_TASK_STATES = new Set(['completed', 'cancelled'])
const STRUCTURAL_PREVIEW_ACTIONS = new Set<CapacityActionKey>(['class_split.preview', 'section_merge.preview'])
const ISSUE_STATE_ACTIONS = new Set<CapacityActionKey>(['capacity_issue.resolve', 'capacity_issue.reopen'])
const CHILD_METER_KEYS = ['active_students', 'students.active', 'children.active', 'student_count', 'enrolled_children', 'active_children']

function row(value: unknown): Row { return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {} }
function rows(value: unknown): Row[] { return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object').map((item) => item as Row) : [] }
function text(value: unknown, fallback = ''): string { return value === null || value === undefined ? fallback : String(value) }
function optionalText(value: unknown): string | null { const valueText = text(value).trim(); return valueText || null }
function numeric(value: unknown, fallback = 0): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function boolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return fallback
}
function now() { return new Date().toISOString() }
function dateOnly() { return now().slice(0, 10) }
function stableHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function idempotency(value: unknown, fallback: unknown) { return optionalText(value) || stableHash(fallback) }
function required(value: unknown, label: string) { const result = optionalText(value); if (!result) throw new Error(`${label} est obligatoire.`); return result }
function positiveInteger(value: unknown, label: string, allowZero = false) {
  const result = Number(value)
  if (!Number.isInteger(result) || result < (allowZero ? 0 : 1)) throw new Error(`${label} doit être un nombre entier ${allowZero ? 'positif ou nul' : 'supérieur à zéro'}.`)
  return result
}
function percent(value: number, capacity: number) { return capacity > 0 ? Math.round((value / capacity) * 100) : value > 0 ? 999 : 0 }

async function requireAreaContext(options?: { approve?: boolean; move?: boolean }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) throw new Angelcare360AccessError('Aucun établissement actif n’est disponible.', 403)
  if (!EDIT_ACCESS.has(context.access.accessLevel) && !(options?.move && MOVEMENT_ACCESS.has(context.access.accessLevel))) throw new Angelcare360AccessError('Cet espace est réservé aux utilisateurs autorisés à organiser les classes.', 403)
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
  } catch { return [] }
}

async function safeRowById(db: Db, table: string, schoolId: string, id: string) {
  const { data, error } = await db.from(table).select('*').eq('school_id', schoolId).eq('id', id).single()
  if (error) throw new Error('Le dossier demandé est introuvable ou n’est plus disponible.')
  return row(data)
}

function humanStatus(input: { technical: string; metadata: Row; activeChildren: number; plannedPlaces: number; projected: number }): CapacityHumanStatus {
  const areaState = text(input.metadata.area3_state || input.metadata.capacity_state, input.technical)
  if (input.technical === 'archived' || areaState === 'archived') return 'archived'
  if (areaState === 'closing') return 'closing'
  if (input.technical === 'inactive' || areaState === 'closed') return 'closed'
  if (boolean(input.metadata.placements_frozen) || areaState === 'frozen') return 'frozen'
  if (input.activeChildren > input.plannedPlaces && input.plannedPlaces >= 0) return 'over_capacity'
  if (input.plannedPlaces > 0 && input.activeChildren >= input.plannedPlaces) return 'full'
  if (input.plannedPlaces > 0 && Math.max(input.activeChildren, input.projected) >= input.plannedPlaces * 0.85) return 'near_full'
  if (input.technical === 'active' && input.plannedPlaces > 0) return 'open'
  if (input.plannedPlaces > 0) return 'ready'
  return 'to_prepare'
}

function statusLabel(status: CapacityHumanStatus) {
  const labels: Record<CapacityHumanStatus, string> = {
    to_prepare: 'À préparer', ready: 'Prête à accueillir', open: 'Ouverte', near_full: 'Presque complète', full: 'Complète', over_capacity: 'Au-dessus de la capacité prévue', frozen: 'Nouvelles affectations suspendues', closing: 'En cours de fermeture', closed: 'Fermée', archived: 'Archivée',
  }
  return labels[status]
}

function toneFor(status: CapacityHumanStatus): CapacityTone {
  if (status === 'over_capacity') return 'critical'
  if (status === 'full' || status === 'near_full' || status === 'to_prepare') return 'warning'
  if (status === 'frozen' || status === 'closing') return 'decision'
  if (status === 'open' || status === 'ready') return 'verified'
  return 'neutral'
}

function reservationState(item: Row): CapacityReservation['state'] {
  const state = text(item.state, 'reserved') as CapacityReservation['state']
  const expiry = Date.parse(text(item.expires_on))
  if (['used', 'released', 'cancelled'].includes(state)) return state
  if (!Number.isNaN(expiry) && expiry < Date.now()) return 'expired'
  if (!Number.isNaN(expiry) && expiry - Date.now() <= 3 * 86_400_000) return 'expiring'
  return state === 'to_confirm' ? 'to_confirm' : 'reserved'
}

function reservationLabel(state: CapacityReservation['state']) {
  const labels: Record<CapacityReservation['state'], string> = { reserved: 'Réservée', to_confirm: 'À confirmer', expiring: 'Expire bientôt', expired: 'Expirée', used: 'Utilisée', released: 'Libérée', cancelled: 'Annulée' }
  return labels[state]
}

function movementStateLabel(state: string) {
  const labels: Record<string, string> = { draft: 'Brouillon', previewed: 'Prévisualisé', proposed: 'Proposé', approved: 'Validé', executing: 'En cours', completed: 'Terminé', partially_failed: 'Terminé avec corrections', failed: 'À corriger', cancelled: 'Annulé', repaired: 'Réparé' }
  return labels[state] || state
}

function mapTask(item: Row): CapacityTask {
  return { id: text(item.id), classId: optionalText(item.class_id), sectionId: optionalText(item.section_id), issueId: optionalText(item.issue_id), title: text(item.title), description: optionalText(item.description), state: text(item.state, 'open') as CapacityTask['state'], priority: text(item.priority, 'normal') as CapacityTask['priority'], ownerUserId: optionalText(item.owner_user_id), ownerLabel: optionalText(item.owner_label), dueAt: optionalText(item.due_at), createdAt: text(item.created_at, now()), updatedAt: text(item.updated_at, now()) }
}

function mapNote(item: Row): CapacityNote {
  return { id: text(item.id), classId: optionalText(item.class_id), sectionId: optionalText(item.section_id), issueId: optionalText(item.issue_id), body: text(item.body), important: boolean(item.important), authorLabel: text(item.author_label, 'Équipe administrative'), createdAt: text(item.created_at, now()) }
}

function mapHistory(item: Row, fallback = 'Mise à jour des classes et places'): CapacityHistoryEvent {
  return { id: text(item.id, stableHash(item)), label: text(item.label || item.action || item.event_type, fallback), detail: optionalText(item.detail || item.reason), actorLabel: optionalText(item.actor_label || item.actor_role || row(item.metadata_json).actor_label), createdAt: text(item.created_at || item.effective_at, now()), tone: text(item.severity) === 'critical' ? 'critical' : text(item.severity) === 'warning' ? 'warning' : 'neutral', sourceType: optionalText(item.entity_type || item.source_type), sourceId: optionalText(item.entity_id || item.source_id) }
}

function findChildMeter(context: Awaited<ReturnType<typeof requireAreaContext>>, activeChildren: number): CapacityEntitlement {
  const limits = context.runtimeEntitlements.limits
  const match = CHILD_METER_KEYS.map((key) => limits.find((item) => item.key === key)).find(Boolean) || limits.find((item) => /student|child|enfant|élève/i.test(`${item.key} ${item.label}`))
  const current = match?.current ?? activeChildren
  const allowed = match?.allowed ?? null
  const reserved = match?.reserved ?? 0
  const remaining = allowed === null ? null : Math.max(0, allowed - current - reserved)
  const state: CapacityEntitlement['state'] = !match ? 'unconfigured' : match.state === 'reached' || (allowed !== null && current + reserved >= allowed) ? 'reached' : match.state === 'warning' || (allowed !== null && current + reserved >= allowed * 0.8) ? 'warning' : 'available'
  const topupEnabled = context.runtimeEntitlements.enabledOperations.some((key) => /topup|top-up|capacity/.test(key)) || context.runtimeEntitlements.enabledFeatures.some((key) => /topup|extra.*place|capacity/.test(key))
  return { meterKey: match?.key || null, label: match?.label || 'Enfants actifs', included: allowed, purchased: 0, allowed, current, remaining, state, topupEnabled, topupIncrement: null, packageVersionName: context.runtimeEntitlements.packageVersionName }
}

async function audit(input: { schoolId: string; action: string; entityType: string; entityId: string; before?: Row; after?: Row; metadata?: Row; severity?: 'info' | 'notice' | 'warning' | 'critical' }) {
  await recordAngelcare360AuditEventServer({ schoolId: input.schoolId, module: 'classes_capacity_area', action: input.action, category: 'settings', entityType: input.entityType, entityId: input.entityId, beforeData: input.before || {}, afterData: input.after || {}, metadata: input.metadata || {}, severity: input.severity || 'info' })
}

function makeAttention(input: Omit<CapacityAttentionItem, 'resolved'>): CapacityAttentionItem { return { ...input, resolved: false } }

export async function getClassesCapacitySnapshot(): Promise<ClassesCapacitySnapshot> {
  const context = await requireAreaContext()
  const db = await createClient()
  const schoolId = context.school!.id
  const { data: schoolData } = await db.from('angelcare360_schools').select('*').eq('id', schoolId).maybeSingle()
  const schoolRow = row(schoolData)
  const schoolMetadata = row(schoolRow.metadata_json)
  const operatingCapacityValue = schoolMetadata.operating_capacity ?? schoolMetadata.capacity ?? schoolRow.capacity
  const operatingCapacity = operatingCapacityValue === null || operatingCapacityValue === undefined || operatingCapacityValue === '' ? null : numeric(operatingCapacityValue)
  const [years, classRows, sectionRows, enrollmentRows, studentRows, staffRows, assignmentRows, applicationRows, reservationRows, freezeRows, capacityChangeRows, exceptionRows, movementRows, movementItemRows, taskRows, noteRows, issueRows, rolloverItemRows, sites, auditRows, topupRows] = await Promise.all([
    safeRows(db, 'angelcare360_academic_years', schoolId, { order: 'starts_on', ascending: false, limit: 50 }),
    safeRows(db, 'angelcare360_classes', schoolId, { order: 'order_index', ascending: true, limit: 5000 }),
    safeRows(db, 'angelcare360_sections', schoolId, { order: 'created_at', ascending: true, limit: 10000 }),
    safeRows(db, 'angelcare360_class_enrollments', schoolId, { order: 'created_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_students', schoolId, { order: 'full_name', ascending: true, limit: 50000 }),
    safeRows(db, 'angelcare360_staff', schoolId, { order: 'full_name', ascending: true, limit: 5000 }),
    safeRows(db, 'angelcare360_teacher_assignments', schoolId, { order: 'created_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_admission_applications', schoolId, { order: 'application_date', ascending: false, limit: 30000 }),
    safeRows(db, 'angelcare360_capacity_seat_reservations', schoolId, { order: 'created_at', ascending: false, limit: 30000 }),
    safeRows(db, 'angelcare360_capacity_enrollment_freezes', schoolId, { order: 'created_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_governance_capacity_changes', schoolId, { order: 'created_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_capacity_temporary_exceptions', schoolId, { order: 'created_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_governance_population_movements', schoolId, { order: 'created_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_capacity_movement_items', schoolId, { order: 'created_at', ascending: false, limit: 100000 }),
    safeRows(db, 'angelcare360_capacity_tasks', schoolId, { order: 'updated_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_capacity_notes', schoolId, { order: 'created_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_capacity_issues', schoolId, { order: 'updated_at', ascending: false, limit: 10000 }),
    safeRows(db, 'angelcare360_governance_rollover_items', schoolId, { order: 'updated_at', ascending: false, limit: 50000 }),
    safeRows(db, 'angelcare360_governance_sites', schoolId, { order: 'created_at', ascending: true, limit: 500 }),
    safeRows(db, 'angelcare360_audit_logs', schoolId, { order: 'created_at', ascending: false, limit: 3000 }),
    safeRows(db, 'angelcare360_capacity_topup_requests', schoolId, { order: 'created_at', ascending: false, limit: 1000 }),
  ])
  const currentYear = years.find((item) => boolean(item.is_current)) || years.find((item) => text(item.status) === 'active') || years[0] || null
  const activeYearId = optionalText(currentYear?.id)
  const activeEnrollments = enrollmentRows.filter((item) => text(item.status) === 'active' && ['enrolled', 'active'].includes(text(item.enrollment_status)) && (!activeYearId || text(item.academic_year_id) === activeYearId))
  const entitlement = findChildMeter(context, activeEnrollments.length)
  const studentMap = new Map(studentRows.map((item) => [text(item.id), item]))
  const classMap = new Map(classRows.map((item) => [text(item.id), item]))
  const sectionMap = new Map(sectionRows.map((item) => [text(item.id), item]))
  const staffMap = new Map(staffRows.map((item) => [text(item.id), item]))
  const siteMap = new Map(sites.map((item) => [text(item.id), item]))
  const tasks = taskRows.map(mapTask)
  const notes = noteRows.map(mapNote)

  const reservations: CapacityReservation[] = reservationRows.map((item) => {
    const state = reservationState(item)
    const student = studentMap.get(text(item.student_id))
    const app = applicationRows.find((application) => text(application.id) === text(item.admission_application_id))
    return { id: text(item.id), studentId: optionalText(item.student_id), admissionApplicationId: optionalText(item.admission_application_id), childLabel: text(student?.full_name || row(app?.metadata_json).child_name || app?.application_code, 'Enfant à confirmer'), classId: text(item.class_id), sectionId: optionalText(item.section_id), state, stateLabel: reservationLabel(state), startsOn: text(item.starts_on, dateOnly()), expiresOn: text(item.expires_on, dateOnly()), responsibleLabel: optionalText(item.responsible_label), reason: optionalText(item.reason), countsAgainstCapacity: ['reserved', 'to_confirm', 'expiring'].includes(state), exactHref: item.admission_application_id ? `/angelcare-360-command-center/admissions?entity=${text(item.admission_application_id)}&drawer=dossier&source=classes-capacity` : item.student_id ? `/angelcare-360-command-center/people?entity=${text(item.student_id)}&type=student&drawer=dossier&source=classes-capacity` : null }
  })

  const waiting: CapacityWaitingRequest[] = applicationRows.filter((item) => ['approved', 'waitlisted', 'in_review'].includes(text(item.status))).map((item) => {
    const student = studentMap.get(text(item.student_id))
    const metadata = row(item.metadata_json)
    return { id: text(item.id), applicationCode: text(item.application_code), childLabel: text(student?.full_name || metadata.child_name || item.application_code, 'Dossier d’admission'), studentId: optionalText(item.student_id), academicYearId: optionalText(item.academic_year_id), requestedClassId: optionalText(item.class_id), requestedClassLabel: optionalText(classMap.get(text(item.class_id))?.name), requestedSectionId: optionalText(item.section_id), state: text(item.status), stateLabel: text(item.status) === 'approved' ? 'Acceptée, place à attribuer' : text(item.status) === 'waitlisted' ? 'En attente d’une place' : 'À vérifier', applicationDate: optionalText(item.application_date), priorityLabel: optionalText(metadata.priority_label), missingRequirement: optionalText(metadata.placement_blocker), compatibleClassIds: Array.isArray(metadata.compatible_class_ids) ? metadata.compatible_class_ids.map(String) : [], exactHref: `/angelcare-360-command-center/admissions?entity=${text(item.id)}&drawer=dossier&tab=placement&source=classes-capacity` }
  })

  const children: CapacityChild[] = activeEnrollments.map((item) => {
    const student = studentMap.get(text(item.student_id))
    const cls = classMap.get(text(item.class_id))
    const section = sectionMap.get(text(item.section_id))
    const transition = rolloverItemRows.find((transitionItem) => text(transitionItem.student_id) === text(item.student_id) && ['approved', 'completed'].includes(text(transitionItem.state)))
    const target = classMap.get(text(transition?.target_class_id))
    return { id: text(item.student_id), fullName: text(student?.full_name, text(student?.student_code, 'Enfant')), studentCode: text(student?.student_code), enrollmentId: text(item.id), enrollmentStatus: text(item.enrollment_status), classId: text(item.class_id), sectionId: optionalText(item.section_id), classLabel: text(cls?.name, 'Classe'), sectionLabel: optionalText(section?.name), enrolledOn: optionalText(item.enrolled_on), nextYearTargetClassId: optionalText(transition?.target_class_id), nextYearTargetLabel: optionalText(target?.name), attentionLabel: optionalText(row(student?.metadata_json).attention_label), exactHref: `/angelcare-360-command-center/people?entity=${text(item.student_id)}&type=student&drawer=dossier&tab=school&source=classes-capacity` }
  })

  const projectionForClass = (classId: string, plannedPlaces: number): CapacityProjection => {
    const current = children.filter((item) => item.classId === classId).length
    const confirmedReservations = reservations.filter((item) => item.classId === classId && item.countsAgainstCapacity).length
    const acceptedWaiting = waiting.filter((item) => item.requestedClassId === classId && item.state === 'approved').length
    const approvedTransitions = rolloverItemRows.filter((item) => text(item.target_class_id) === classId && ['approved', 'completed'].includes(text(item.state))).length
    const scheduledDepartures = rolloverItemRows.filter((item) => text(item.source_class_id) === classId && ['approved', 'completed'].includes(text(item.state)) && text(item.target_class_id) !== classId).length
    const scheduledMovementsIn = movementItemRows.filter((item) => text(item.target_class_id) === classId && ['approved', 'completed'].includes(text(item.state))).length
    const scheduledMovementsOut = movementItemRows.filter((item) => text(item.source_class_id) === classId && ['approved', 'completed'].includes(text(item.state)) && text(item.target_class_id) !== classId).length
    const projected = current + confirmedReservations + acceptedWaiting + approvedTransitions - scheduledDepartures + scheduledMovementsIn - scheduledMovementsOut
    return { classId, current, confirmedReservations, acceptedWaiting, approvedTransitions, scheduledDepartures, scheduledMovementsIn, scheduledMovementsOut, projected, plannedPlaces, difference: plannedPlaces - projected, sources: [
      { key: 'current', label: 'Enfants actuellement inscrits', value: current, sourceType: 'class_enrollment', sourceHref: null, committed: true },
      { key: 'reservations', label: 'Réservations confirmées', value: confirmedReservations, sourceType: 'seat_reservation', sourceHref: null, committed: true },
      { key: 'waiting', label: 'Admissions acceptées', value: acceptedWaiting, sourceType: 'admission', sourceHref: `/angelcare-360-command-center/admissions?class=${classId}&status=approved&source=classes-capacity`, committed: true },
      { key: 'transitions', label: 'Passages approuvés', value: approvedTransitions, sourceType: 'academic_transition', sourceHref: `/angelcare-360-command-center/administration?plane=academic-structure&view=next-year&class=${classId}&source=classes-capacity`, committed: true },
      { key: 'departures', label: 'Départs programmés', value: -scheduledDepartures, sourceType: 'academic_transition', sourceHref: null, committed: true },
      { key: 'move_in', label: 'Mouvements entrants', value: scheduledMovementsIn, sourceType: 'population_movement', sourceHref: null, committed: true },
      { key: 'move_out', label: 'Mouvements sortants', value: -scheduledMovementsOut, sourceType: 'population_movement', sourceHref: null, committed: true },
    ] }
  }

  const projections = classRows.filter((item) => !activeYearId || text(item.academic_year_id) === activeYearId).map((item) => projectionForClass(text(item.id), numeric(item.capacity)))
  const allAttention: CapacityAttentionItem[] = []

  const sectionRecords: CapacitySectionRecord[] = sectionRows.filter((item) => !activeYearId || text(item.academic_year_id) === activeYearId).map((item) => {
    const sectionId = text(item.id)
    const metadata = row(item.metadata_json)
    const sectionChildren = children.filter((child) => child.sectionId === sectionId)
    const sectionReservations = reservations.filter((reservation) => reservation.sectionId === sectionId)
    const reservedPlaces = sectionReservations.filter((reservation) => reservation.countsAgainstCapacity).length
    const plannedPlaces = numeric(item.capacity)
    const projectedChildren = sectionChildren.length + reservedPlaces
    const freeze = freezeRows.find((freezeItem) => text(freezeItem.section_id) === sectionId && text(freezeItem.state) === 'active')
    const status = humanStatus({ technical: text(item.status), metadata: { ...metadata, placements_frozen: Boolean(freeze) }, activeChildren: sectionChildren.length, plannedPlaces, projected: projectedChildren })
    const attention: CapacityAttentionItem[] = []
    if (plannedPlaces <= 0) attention.push(makeAttention({ id: `section-capacity:${sectionId}`, sourceType: 'section', sourceId: sectionId, title: 'Nombre de places à définir', explanation: 'Cette section ne peut pas recevoir de nouvelles affectations tant que son nombre de places n’est pas renseigné.', consequence: 'Les demandes restent en attente.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionKey: 'capacity.request_change', recommendedActionLabel: 'Définir le nombre de places', exactHref: null }))
    if (sectionChildren.length > plannedPlaces && plannedPlaces >= 0) attention.push(makeAttention({ id: `section-over:${sectionId}`, sourceType: 'section', sourceId: sectionId, title: `La section dépasse sa capacité de ${sectionChildren.length - plannedPlaces} enfant(s)`, explanation: 'L’effectif actif est supérieur au nombre de places prévu.', consequence: 'Les nouvelles affectations sont bloquées jusqu’à résolution.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionKey: 'population_move.preview', recommendedActionLabel: 'Examiner les solutions', exactHref: null }))
    allAttention.push(...attention)
    return { id: sectionId, schoolId, academicYearId: text(item.academic_year_id), classId: text(item.class_id), code: text(item.section_code), name: text(item.name), room: optionalText(item.room), status, statusLabel: statusLabel(status), tone: toneFor(status), plannedPlaces, activeChildren: sectionChildren.length, reservedPlaces, availablePlaces: Math.max(0, plannedPlaces - sectionChildren.length - reservedPlaces), projectedChildren, waitingRequests: waiting.filter((request) => request.requestedSectionId === sectionId).length, responsibleStaffId: optionalText(metadata.responsible_staff_id), responsibleLabel: optionalText(metadata.responsible_label), placementsFrozen: Boolean(freeze), freezeReason: optionalText(freeze?.reason), nextActionKey: attention[0]?.recommendedActionKey || null, nextActionLabel: attention[0]?.recommendedActionLabel || 'Consulter les enfants', children: sectionChildren, reservations: sectionReservations, attention, tasks: tasks.filter((task) => task.sectionId === sectionId), notes: notes.filter((note) => note.sectionId === sectionId), history: auditRows.filter((historyItem) => text(historyItem.entity_id) === sectionId).slice(0, 100).map((historyItem) => mapHistory(historyItem)), updatedAt: optionalText(item.updated_at) }
  })

  const classRecords: CapacityClassRecord[] = classRows.filter((item) => !activeYearId || text(item.academic_year_id) === activeYearId).map((item) => {
    const classId = text(item.id)
    const metadata = row(item.metadata_json)
    const classChildren = children.filter((child) => child.classId === classId)
    const classReservations = reservations.filter((reservation) => reservation.classId === classId)
    const classWaiting = waiting.filter((request) => request.requestedClassId === classId || request.compatibleClassIds.includes(classId))
    const reservedPlaces = classReservations.filter((reservation) => reservation.countsAgainstCapacity).length
    const plannedPlaces = numeric(item.capacity)
    const projection = projections.find((projectionItem) => projectionItem.classId === classId) || projectionForClass(classId, plannedPlaces)
    const freeze = freezeRows.find((freezeItem) => text(freezeItem.class_id) === classId && text(freezeItem.state) === 'active')
    const activeException = exceptionRows.find((exception) => text(exception.class_id) === classId && text(exception.state) === 'approved' && Date.parse(text(exception.expires_at)) >= Date.now())
    const effectivePlaces = activeException ? Math.max(plannedPlaces, numeric(activeException.temporary_capacity, plannedPlaces)) : plannedPlaces
    const status = humanStatus({ technical: text(item.status), metadata: { ...metadata, placements_frozen: Boolean(freeze) }, activeChildren: classChildren.length, plannedPlaces: effectivePlaces, projected: projection.projected })
    const attention: CapacityAttentionItem[] = []
    if (plannedPlaces <= 0) attention.push(makeAttention({ id: `capacity:${classId}`, sourceType: 'class', sourceId: classId, title: 'Nombre de places à définir', explanation: 'La classe existe mais le nombre de places prévu n’est pas renseigné.', consequence: 'Aucune nouvelle place ne peut être attribuée en toute sécurité.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionKey: 'capacity.request_change', recommendedActionLabel: 'Définir le nombre de places', exactHref: null }))
    if (classChildren.length > effectivePlaces && effectivePlaces >= 0) attention.push(makeAttention({ id: `over:${classId}`, sourceType: 'class', sourceId: classId, title: `La classe dépasse sa capacité de ${classChildren.length - effectivePlaces} enfant(s)`, explanation: 'L’effectif actif est supérieur au nombre de places prévu.', consequence: 'Les nouvelles affectations sont temporairement bloquées.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionKey: 'class_split.preview', recommendedActionLabel: sectionRecords.some((section) => section.classId === classId) ? 'Examiner les solutions' : 'Créer une nouvelle section', exactHref: null }))
    else if (projection.projected > effectivePlaces) attention.push(makeAttention({ id: `projected:${classId}`, sourceType: 'class', sourceId: classId, title: `Effectif prévu supérieur de ${projection.projected - effectivePlaces}`, explanation: 'Les décisions déjà approuvées dépasseraient le nombre de places prévu.', consequence: 'Certaines admissions ou passages doivent être réorganisés avant exécution.', severity: 'warning', tone: 'warning', ownerLabel: null, dueAt: null, recommendedActionKey: 'population_move.preview', recommendedActionLabel: 'Examiner l’effectif prévu', exactHref: `/angelcare-360-command-center/administration?plane=academic-structure&view=next-year&class=${classId}&source=classes-capacity` }))
    if (entitlement.remaining !== null && entitlement.remaining <= 0 && classWaiting.length) attention.push(makeAttention({ id: `entitlement:${classId}`, sourceType: 'entitlement', sourceId: classId, title: 'Aucune place contractuelle supplémentaire', explanation: 'La formule actuelle a atteint le nombre d’enfants actifs autorisé.', consequence: 'Une place opérationnelle peut exister, mais une affectation supplémentaire ne peut pas être confirmée.', severity: 'blocking', tone: 'critical', ownerLabel: null, dueAt: null, recommendedActionKey: 'capacity.request_topup', recommendedActionLabel: 'Demander des places supplémentaires', exactHref: null }))
    if (!item.homeroom_staff_id) attention.push(makeAttention({ id: `staff:${classId}`, sourceType: 'class', sourceId: classId, title: 'Aucune éducatrice principale n’est indiquée', explanation: 'La classe ne dispose pas d’une responsable pédagogique principale dans son dossier.', consequence: 'La classe peut rester visible, mais l’organisation doit être vérifiée.', severity: 'information', tone: 'warning', ownerLabel: null, dueAt: null, recommendedActionKey: null, recommendedActionLabel: null, exactHref: `/angelcare-360-command-center/administration?plane=assignments&view=classes&class=${classId}&drawer=dossier&source=classes-capacity` }))
    const unresolvedIssues = issueRows.filter((issue) => text(issue.class_id) === classId && !['resolved', 'closed', 'cancelled'].includes(text(issue.state)))
    for (const issue of unresolvedIssues) attention.push(makeAttention({ id: text(issue.id), sourceType: 'class', sourceId: classId, title: text(issue.title), explanation: text(issue.explanation, text(issue.description)), consequence: optionalText(issue.consequence), severity: text(issue.severity, 'warning') as CapacityAttentionItem['severity'], tone: text(issue.severity) === 'blocking' ? 'critical' : 'warning', ownerLabel: optionalText(issue.owner_label), dueAt: optionalText(issue.due_at), recommendedActionKey: optionalText(issue.recommended_action_key) as CapacityActionKey | null, recommendedActionLabel: optionalText(issue.recommended_action_label), exactHref: optionalText(issue.exact_href) }))
    allAttention.push(...attention)
    const homeroom = staffMap.get(text(item.homeroom_staff_id))
    const siteId = optionalText(metadata.site_id)
    const site = siteId ? siteMap.get(siteId) : null
    const next = attention[0]
    return { id: classId, schoolId, academicYearId: text(item.academic_year_id), academicYearLabel: text(years.find((year) => text(year.id) === text(item.academic_year_id))?.label, 'Année scolaire'), siteId, siteLabel: optionalText(site?.name || metadata.site_label), code: text(item.class_code), name: text(item.name), level: text(item.level), status, statusLabel: statusLabel(status), tone: toneFor(status), plannedPlaces, activeChildren: classChildren.length, reservedPlaces, availablePlaces: Math.max(0, effectivePlaces - classChildren.length - reservedPlaces), projectedChildren: projection.projected, waitingRequests: classWaiting.length, contractualRemaining: entitlement.remaining, occupancyPercent: percent(classChildren.length, effectivePlaces), projectedPercent: percent(projection.projected, effectivePlaces), homeroomStaffId: optionalText(item.homeroom_staff_id), homeroomLabel: optionalText(homeroom?.full_name), placementsFrozen: Boolean(freeze), freezeReason: optionalText(freeze?.reason), sections: sectionRecords.filter((section) => section.classId === classId), children: classChildren, reservations: classReservations, waiting: classWaiting, attention, tasks: tasks.filter((task) => task.classId === classId), notes: notes.filter((note) => note.classId === classId), history: [...capacityChangeRows.filter((historyItem) => text(historyItem.entity_id) === classId).map((historyItem) => mapHistory(historyItem, 'Capacité modifiée')), ...auditRows.filter((historyItem) => text(historyItem.entity_id) === classId).map((historyItem) => mapHistory(historyItem))].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 150), nextActionKey: next?.recommendedActionKey || (classWaiting.length && Math.max(0, effectivePlaces - classChildren.length - reservedPlaces) > 0 ? 'placement.preview' : null), nextActionLabel: next?.recommendedActionLabel || (classWaiting.length ? 'Répartir les demandes en attente' : 'Consulter les enfants'), exactHref: `/angelcare-360-command-center/administration?plane=classes-capacity&view=classes&type=class&entity=${classId}&drawer=dossier&tab=todo`, updatedAt: optionalText(item.updated_at) }
  })

  const movementRuns: CapacityMovementRun[] = movementRows.map((movement) => {
    const runItems = movementItemRows.filter((item) => text(item.movement_run_id) === text(movement.id)).map((item): CapacityMovementItem => ({ id: text(item.id), studentId: text(item.student_id), childLabel: text(studentMap.get(text(item.student_id))?.full_name, 'Enfant'), sourceClassId: optionalText(item.source_class_id), sourceClassLabel: optionalText(classMap.get(text(item.source_class_id))?.name), sourceSectionId: optionalText(item.source_section_id), targetClassId: text(item.target_class_id), targetClassLabel: text(classMap.get(text(item.target_class_id))?.name, 'Classe cible'), targetSectionId: optionalText(item.target_section_id), state: text(item.state, 'proposed') as CapacityMovementItem['state'], stateLabel: movementStateLabel(text(item.state, 'proposed')), failureReason: optionalText(item.failure_reason), executedAt: optionalText(item.executed_at) }))
    const completedItems = runItems.filter((item) => ['completed', 'repaired'].includes(item.state)).length
    const failedItems = runItems.filter((item) => item.state === 'failed').length
    return { id: text(movement.id), runCode: text(movement.movement_code), movementType: text(row(movement.metadata_json).movement_type, 'movement') as CapacityMovementRun['movementType'], state: text(movement.state, 'previewed') as CapacityMovementRun['state'], stateLabel: movementStateLabel(text(movement.state, 'previewed')), sourceClassId: optionalText(movement.source_class_id), sourceClassLabel: optionalText(classMap.get(text(movement.source_class_id))?.name), targetClassId: optionalText(movement.target_class_id), targetClassLabel: optionalText(classMap.get(text(movement.target_class_id))?.name), requestedByLabel: optionalText(row(movement.metadata_json).requested_by_label), reason: optionalText(movement.reason), effectiveAt: optionalText(movement.effective_at), totalItems: runItems.length || (Array.isArray(movement.student_ids) ? movement.student_ids.length : 0), completedItems, failedItems, items: runItems, createdAt: text(movement.created_at, now()), executedAt: optionalText(movement.executed_at) }
  })

  const unresolvedTopup = topupRows.find((request) => ['requested', 'review', 'approved'].includes(text(request.state)))
  if (unresolvedTopup) allAttention.push(makeAttention({ id: text(unresolvedTopup.id), sourceType: 'entitlement', sourceId: text(unresolvedTopup.id), title: 'Demande de places supplémentaires en cours', explanation: `${numeric(unresolvedTopup.quantity)} place(s) ont été demandées pour la formule actuelle.`, consequence: 'La limite contractuelle ne change qu’après activation confirmée.', severity: 'information', tone: 'decision', ownerLabel: optionalText(unresolvedTopup.owner_label), dueAt: optionalText(unresolvedTopup.review_at), recommendedActionKey: null, recommendedActionLabel: null, exactHref: optionalText(unresolvedTopup.exact_catalogue_href) }))

  const resolvedIssueKeys = new Set(issueRows.filter((issue) => ['resolved', 'closed', 'cancelled'].includes(text(issue.state))).map((issue) => text(issue.issue_key)).filter(Boolean))
  const visibleAttention = allAttention.filter((item) => !resolvedIssueKeys.has(item.id))

  const metrics = [
    { key: 'children', label: 'Enfants répartis', value: String(children.length), detail: `${classRecords.length} classe(s) ouverte(s)`, tone: 'active' as CapacityTone, view: 'classes' as const },
    { key: 'available', label: 'Places disponibles', value: String(classRecords.reduce((sum, item) => sum + item.availablePlaces, 0)), detail: `${classRecords.filter((item) => item.availablePlaces > 0).length} classe(s) peuvent accueillir`, tone: 'verified' as CapacityTone, view: 'places' as const },
    { key: 'waiting', label: 'Demandes en attente', value: String(waiting.length), detail: `${waiting.filter((item) => item.state === 'approved').length} déjà acceptée(s)`, tone: waiting.length ? 'warning' as CapacityTone : 'verified' as CapacityTone, view: 'waiting' as const },
    { key: 'conflicts', label: 'Classes à régler', value: String(classRecords.filter((item) => ['over_capacity', 'frozen', 'to_prepare'].includes(item.status) || item.projectedChildren > item.plannedPlaces).length), detail: `${visibleAttention.filter((item) => item.severity === 'blocking').length} blocage(s)`, tone: visibleAttention.some((item) => item.severity === 'blocking') ? 'critical' as CapacityTone : 'verified' as CapacityTone, view: 'attention' as const },
    { key: 'entitlement', label: 'Places de la formule', value: entitlement.allowed === null ? 'Non configuré' : `${entitlement.remaining ?? 0} restante(s)`, detail: entitlement.packageVersionName || 'Formule en cours', tone: entitlement.state === 'reached' ? 'critical' as CapacityTone : entitlement.state === 'warning' ? 'warning' as CapacityTone : entitlement.state === 'available' ? 'verified' as CapacityTone : 'neutral' as CapacityTone, view: 'places' as const },
  ]

  return {
    generatedAt: now(), mode: sites.length ? 'multi' : 'single', title: sites.length ? 'Classes & places du réseau' : 'Mes classes', subtitle: sites.length ? 'Comparez les effectifs, les places et les décisions de répartition pour chaque site.' : 'Voyez immédiatement où se trouve chaque enfant, quelles places restent disponibles et ce qui doit être réglé.', school: { id: schoolId, name: context.school!.name, siteCount: sites.length, operatingCapacity }, academicYear: currentYear ? { id: text(currentYear.id), label: text(currentYear.label) } : null, viewer: { userId: context.user.id, displayName: context.user.full_name || context.user.name || context.user.email || 'Utilisateur', roleLabel: context.access.roleLabel, canEdit: EDIT_ACCESS.has(context.access.accessLevel), canApprove: APPROVAL_ACCESS.has(context.access.accessLevel), canMove: MOVEMENT_ACCESS.has(context.access.accessLevel), canRequestTopup: EDIT_ACCESS.has(context.access.accessLevel), canViewHistory: context.access.canSeeAuditData }, entitlement, classes: classRecords, sections: sectionRecords, waiting, reservations, movements: movementRuns, projections, attention: visibleAttention, metrics, history: auditRows.filter((item) => text(item.module) === 'classes_capacity_area' || ['class', 'section', 'class_enrollment'].includes(text(item.entity_type))).slice(0, 500).map((item) => mapHistory(item)), directory: { classes: classRecords.map((item) => ({ id: item.id, label: item.name, secondary: `${item.level} · ${item.availablePlaces} place(s)` })), sections: sectionRecords.map((item) => ({ id: item.id, label: item.name, secondary: classRecords.find((record) => record.id === item.classId)?.name || null })), students: studentRows.map((item) => ({ id: text(item.id), label: text(item.full_name, text(item.student_code)), secondary: optionalText(item.student_code) })), staff: staffRows.map((item) => ({ id: text(item.id), label: text(item.full_name, text(item.staff_code)), secondary: optionalText(item.staff_type) })), sites: sites.map((item) => ({ id: text(item.id), label: text(item.name, text(item.site_code)), secondary: optionalText(item.city) })), topups: context.runtimeEntitlements.limits.filter((item) => /student|child|enfant|élève/i.test(`${item.key} ${item.label}`)).map((item) => ({ id: item.key, label: item.label, secondary: item.allowed === null ? 'Quantité sur demande' : `${item.allowed} incluses` })) }, warnings: context.runtimeEntitlements.warning ? [context.runtimeEntitlements.warning] : [],
  }
}

export async function getClassesCapacityDetail(id: string, kind: CapacityDossierKind) {
  const snapshot = await getClassesCapacitySnapshot()
  if (kind === 'class') return snapshot.classes.find((item) => item.id === id) || null
  if (kind === 'section') return snapshot.sections.find((item) => item.id === id) || null
  if (kind === 'movement') return snapshot.movements.find((item) => item.id === id) || null
  if (kind === 'reservation') return snapshot.reservations.find((item) => item.id === id) || null
  return snapshot.attention.find((item) => item.id === id) || null
}

function actionNeedsApproval(action: CapacityActionKey) {
  return ['class.close', 'class.archive', 'section.close', 'capacity.approve_change', 'capacity.apply_change', 'capacity.approve_exception', 'population_move.execute', 'class_split.execute', 'section_merge.execute'].includes(action)
}
function actionNeedsMove(action: CapacityActionKey) { return action.startsWith('placement.') || action.startsWith('population_move.') || action.startsWith('class_split.') || action.startsWith('section_merge.') }

async function currentReceipt(db: Db, schoolId: string, key: string) {
  try { const { data, error } = await db.from('angelcare360_capacity_action_receipts').select('*').eq('school_id', schoolId).eq('idempotency_key', key).maybeSingle(); return error ? null : row(data) } catch { return null }
}
async function storeReceipt(db: Db, input: { schoolId: string; actionKey: string; key: string; classId?: string | null; sectionId?: string | null; reservationId?: string | null; movementRunId?: string | null; issueId?: string | null; message: string; result: Row; userId: string }) {
  try { await db.from('angelcare360_capacity_action_receipts').insert({ school_id: input.schoolId, class_id: input.classId || null, section_id: input.sectionId || null, reservation_id: input.reservationId || null, movement_run_id: input.movementRunId || null, issue_id: input.issueId || null, action_key: input.actionKey, idempotency_key: input.key, message: input.message, result_json: input.result, actor_user_id: input.userId }) } catch { /* optional replay protection */ }
}

async function ensurePlacementAllowed(input: { db: Db; schoolId: string; classId: string; sectionId?: string | null; studentCount: number; classDelta?: number; entitlement: CapacityEntitlement }) {
  const cls = await safeRowById(input.db, 'angelcare360_classes', input.schoolId, input.classId)
  const freezes = await safeRows(input.db, 'angelcare360_capacity_enrollment_freezes', input.schoolId, { limit: 10000 })
  if (freezes.some((item) => text(item.class_id) === input.classId && (!input.sectionId || !item.section_id || text(item.section_id) === input.sectionId) && text(item.state) === 'active')) throw new Error('Les nouvelles affectations sont suspendues pour cette classe.')
  const enrollments = await safeRows(input.db, 'angelcare360_class_enrollments', input.schoolId, { limit: 50000 })
  const reservations = await safeRows(input.db, 'angelcare360_capacity_seat_reservations', input.schoolId, { limit: 30000 })
  const exceptions = await safeRows(input.db, 'angelcare360_capacity_temporary_exceptions', input.schoolId, { limit: 10000 })
  const active = enrollments.filter((item) => text(item.class_id) === input.classId && text(item.status) === 'active' && ['enrolled', 'active'].includes(text(item.enrollment_status))).length
  const reserved = reservations.filter((item) => text(item.class_id) === input.classId && ['reserved', 'to_confirm'].includes(text(item.state)) && Date.parse(text(item.expires_on)) >= Date.now()).length
  const exception = exceptions.find((item) => text(item.class_id) === input.classId && !item.section_id && text(item.state) === 'approved' && Date.parse(text(item.expires_at)) >= Date.now())
  const capacity = exception ? Math.max(numeric(cls.capacity), numeric(exception.temporary_capacity)) : numeric(cls.capacity)
  const classDelta = input.classDelta ?? input.studentCount
  if (active + reserved + classDelta > capacity) throw new Error(`La classe cible ne dispose que de ${Math.max(0, capacity - active - reserved)} place(s) disponible(s).`)
  if (input.sectionId) {
    const section = await safeRowById(input.db, 'angelcare360_sections', input.schoolId, input.sectionId)
    if (text(section.class_id) !== input.classId) throw new Error('La section choisie n’appartient pas à la classe cible.')
    const sectionActive = enrollments.filter((item) => text(item.section_id) === input.sectionId && text(item.status) === 'active' && ['enrolled', 'active'].includes(text(item.enrollment_status))).length
    const sectionReserved = reservations.filter((item) => text(item.section_id) === input.sectionId && ['reserved', 'to_confirm'].includes(text(item.state)) && Date.parse(text(item.expires_on)) >= Date.now()).length
    const sectionException = exceptions.find((item) => text(item.section_id) === input.sectionId && text(item.state) === 'approved' && Date.parse(text(item.expires_at)) >= Date.now())
    const sectionCapacity = sectionException ? Math.max(numeric(section.capacity), numeric(sectionException.temporary_capacity)) : numeric(section.capacity)
    if (sectionActive + sectionReserved + input.studentCount > sectionCapacity) throw new Error(`La section cible ne dispose que de ${Math.max(0, sectionCapacity - sectionActive - sectionReserved)} place(s) disponible(s).`)
  }
  if (input.entitlement.remaining !== null && classDelta > input.entitlement.remaining) throw new Error(`Votre formule ne dispose que de ${input.entitlement.remaining} place(s) contractuelle(s) restante(s).`)
}

export async function executeClassesCapacityAction(request: CapacityActionRequest): Promise<CapacityActionResult> {
  const context = await requireAreaContext({ approve: actionNeedsApproval(request.actionKey), move: actionNeedsMove(request.actionKey) })
  const db = await createClient()
  const schoolId = context.school!.id
  const userId = context.user.id
  const payload = row(request.payload)
  const reason = optionalText(request.reason || payload.reason)
  const effectiveAt = optionalText(request.effectiveAt || payload.effectiveAt) || now()
  const key = idempotency(request.idempotencyKey, request)
  const replay = await currentReceipt(db, schoolId, key)
  if (replay) return { ok: true, state: 'replayed', message: text(replay.message, 'Cette action a déjà été appliquée.'), classId: request.classId, sectionId: request.sectionId, reservationId: request.reservationId, movementRunId: request.movementRunId, issueId: request.issueId, result: row(replay.result_json) }
  let classId = request.classId || null
  let sectionId = request.sectionId || null
  let reservationId = request.reservationId || null
  let movementRunId = request.movementRunId || null
  let issueId = request.issueId || null
  let message = 'Modification enregistrée.'
  let result: Row = {}
  let state: CapacityActionResult['state'] = 'applied'

  if (request.actionKey === 'class.create') {
    const academicYearId = required(payload.academicYearId || context.academicYear?.id, 'L’année scolaire')
    const classCode = required(payload.classCode, 'Le code de la classe')
    const name = required(payload.name, 'Le nom de la classe')
    const level = required(payload.level, 'Le niveau')
    const capacity = positiveInteger(payload.capacity, 'Le nombre de places', true)
    const { data, error } = await db.from('angelcare360_classes').insert({ school_id: schoolId, academic_year_id: academicYearId, class_code: classCode, name, level, capacity, order_index: numeric(payload.orderIndex, 1), homeroom_staff_id: optionalText(payload.homeroomStaffId), status: capacity > 0 ? 'active' : 'inactive', metadata_json: { area3_state: capacity > 0 ? 'open' : 'to_prepare', site_id: optionalText(payload.siteId), placements_frozen: false }, created_by: userId, updated_by: userId }).select('*').single()
    if (error) throw new Error(error.message.includes('duplicate') ? 'Une classe utilise déjà ce code pour cette année scolaire.' : 'La classe n’a pas pu être créée.')
    classId = text(row(data).id); result = row(data); message = 'La classe a été créée. Vous pouvez maintenant organiser ses enfants et ses sections.'
    await audit({ schoolId, action: request.actionKey, entityType: 'class', entityId: classId, after: result })
  } else if (request.actionKey === 'class.update' || request.actionKey === 'class.open') {
    classId = required(classId, 'La classe')
    const before = await safeRowById(db, 'angelcare360_classes', schoolId, classId)
    const metadata = { ...row(before.metadata_json), area3_state: request.actionKey === 'class.open' ? 'open' : text(row(before.metadata_json).area3_state, 'open'), site_id: payload.siteId === undefined ? row(before.metadata_json).site_id : optionalText(payload.siteId) }
    const patch: Row = { name: optionalText(payload.name) || before.name, level: optionalText(payload.level) || before.level, class_code: optionalText(payload.classCode) || before.class_code, homeroom_staff_id: payload.homeroomStaffId === undefined ? before.homeroom_staff_id : optionalText(payload.homeroomStaffId), status: request.actionKey === 'class.open' ? 'active' : before.status, metadata_json: metadata, updated_by: userId, updated_at: now() }
    const { data, error } = await db.from('angelcare360_classes').update(patch).eq('school_id', schoolId).eq('id', classId).select('*').single()
    if (error) throw new Error('Les informations de la classe n’ont pas pu être mises à jour.')
    result = row(data); message = request.actionKey === 'class.open' ? 'La classe est maintenant ouverte aux affectations autorisées.' : 'Les informations de la classe ont été mises à jour.'
    await audit({ schoolId, action: request.actionKey, entityType: 'class', entityId: classId, before, after: result })
  } else if (request.actionKey === 'class.freeze_placements' || request.actionKey === 'class.unfreeze_placements' || request.actionKey === 'section.freeze_placements' || request.actionKey === 'section.unfreeze_placements') {
    const freezing = request.actionKey.includes('freeze_placements') && !request.actionKey.includes('unfreeze')
    classId = required(classId, 'La classe')
    if (freezing) {
      const { data, error } = await db.from('angelcare360_capacity_enrollment_freezes').insert({ school_id: schoolId, class_id: classId, section_id: sectionId, state: 'active', reason: required(reason, 'Le motif'), effective_from: effectiveAt, review_at: optionalText(payload.reviewAt), requested_by: userId, created_by: userId }).select('*').single()
      if (error) throw new Error('La suspension des nouvelles affectations n’a pas pu être enregistrée.')
      result = row(data); message = sectionId ? 'Les nouvelles affectations sont suspendues pour cette section.' : 'Les nouvelles affectations sont suspendues pour cette classe.'
    } else {
      const query = db.from('angelcare360_capacity_enrollment_freezes').update({ state: 'released', released_at: now(), released_by: userId, release_reason: reason, updated_at: now() }).eq('school_id', schoolId).eq('class_id', classId).eq('state', 'active')
      const { data, error } = sectionId ? await query.eq('section_id', sectionId).select('*') : await query.is('section_id', null).select('*')
      if (error) throw new Error('La reprise des affectations n’a pas pu être enregistrée.')
      result = { released: rows(data).length }; message = sectionId ? 'Les affectations sont de nouveau autorisées pour cette section.' : 'Les affectations sont de nouveau autorisées pour cette classe.'
    }
    await audit({ schoolId, action: request.actionKey, entityType: sectionId ? 'section' : 'class', entityId: sectionId || classId, after: result, metadata: { reason } })
  } else if (request.actionKey === 'class.begin_closure' || request.actionKey === 'class.close' || request.actionKey === 'class.archive') {
    classId = required(classId, 'La classe')
    const before = await safeRowById(db, 'angelcare360_classes', schoolId, classId)
    const enrollments = await safeRows(db, 'angelcare360_class_enrollments', schoolId, { limit: 50000 })
    const activeCount = enrollments.filter((item) => text(item.class_id) === classId && text(item.status) === 'active').length
    if (request.actionKey !== 'class.begin_closure' && activeCount > 0) throw new Error(`Cette classe contient encore ${activeCount} enfant(s) actif(s). Déplacez-les ou terminez leur affectation avant la fermeture.`)
    const metadata = { ...row(before.metadata_json), area3_state: request.actionKey === 'class.begin_closure' ? 'closing' : request.actionKey === 'class.archive' ? 'archived' : 'closed', closure_reason: reason, closed_at: request.actionKey === 'class.close' ? now() : row(before.metadata_json).closed_at }
    const status = request.actionKey === 'class.archive' ? 'archived' : request.actionKey === 'class.close' ? 'inactive' : text(before.status)
    const { data, error } = await db.from('angelcare360_classes').update({ status, metadata_json: metadata, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', classId).select('*').single()
    if (error) throw new Error('La fermeture de la classe n’a pas pu être enregistrée.')
    result = row(data); message = request.actionKey === 'class.begin_closure' ? 'La préparation de la fermeture a commencé.' : request.actionKey === 'class.archive' ? 'La classe a été archivée sans perdre son historique.' : 'La classe est fermée.'
    await audit({ schoolId, action: request.actionKey, entityType: 'class', entityId: classId, before, after: result, metadata: { reason } })
  } else if (request.actionKey === 'section.create') {
    classId = required(classId || payload.classId, 'La classe')
    const cls = await safeRowById(db, 'angelcare360_classes', schoolId, classId)
    const sectionCode = required(payload.sectionCode, 'Le code de la section')
    const name = required(payload.name, 'Le nom de la section')
    const capacity = positiveInteger(payload.capacity, 'Le nombre de places', true)
    const { data, error } = await db.from('angelcare360_sections').insert({ school_id: schoolId, academic_year_id: text(cls.academic_year_id), class_id: classId, section_code: sectionCode, name, capacity, room: optionalText(payload.room), status: capacity > 0 ? 'active' : 'inactive', metadata_json: { area3_state: capacity > 0 ? 'open' : 'to_prepare', responsible_staff_id: optionalText(payload.responsibleStaffId), responsible_label: optionalText(payload.responsibleLabel) }, created_by: userId, updated_by: userId }).select('*').single()
    if (error) throw new Error(error.message.includes('duplicate') ? 'Une section utilise déjà ce code dans cette classe.' : 'La section n’a pas pu être créée.')
    sectionId = text(row(data).id); result = row(data); message = 'La section a été créée. Vous pouvez maintenant préparer la répartition des enfants.'
    await audit({ schoolId, action: request.actionKey, entityType: 'section', entityId: sectionId, after: result })
  } else if (request.actionKey === 'section.update' || request.actionKey === 'section.assign_responsible') {
    sectionId = required(sectionId, 'La section')
    const before = await safeRowById(db, 'angelcare360_sections', schoolId, sectionId)
    const metadata = { ...row(before.metadata_json), responsible_staff_id: payload.responsibleStaffId === undefined ? row(before.metadata_json).responsible_staff_id : optionalText(payload.responsibleStaffId), responsible_label: payload.responsibleLabel === undefined ? row(before.metadata_json).responsible_label : optionalText(payload.responsibleLabel) }
    const { data, error } = await db.from('angelcare360_sections').update({ name: optionalText(payload.name) || before.name, section_code: optionalText(payload.sectionCode) || before.section_code, room: payload.room === undefined ? before.room : optionalText(payload.room), metadata_json: metadata, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', sectionId).select('*').single()
    if (error) throw new Error('La section n’a pas pu être mise à jour.')
    result = row(data); message = request.actionKey === 'section.assign_responsible' ? 'La personne responsable de cette section a été mise à jour.' : 'Les informations de la section ont été mises à jour.'
    await audit({ schoolId, action: request.actionKey, entityType: 'section', entityId: sectionId, before, after: result })
  } else if (request.actionKey === 'section.begin_closure' || request.actionKey === 'section.close') {
    sectionId = required(sectionId, 'La section')
    const before = await safeRowById(db, 'angelcare360_sections', schoolId, sectionId)
    const enrollments = await safeRows(db, 'angelcare360_class_enrollments', schoolId, { limit: 50000 })
    const activeCount = enrollments.filter((item) => text(item.section_id) === sectionId && text(item.status) === 'active').length
    if (request.actionKey === 'section.close' && activeCount > 0) throw new Error(`Cette section contient encore ${activeCount} enfant(s). Déplacez-les avant la fermeture.`)
    const metadata = { ...row(before.metadata_json), area3_state: request.actionKey === 'section.close' ? 'closed' : 'closing', closure_reason: reason }
    const { data, error } = await db.from('angelcare360_sections').update({ status: request.actionKey === 'section.close' ? 'inactive' : before.status, metadata_json: metadata, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', sectionId).select('*').single()
    if (error) throw new Error('La fermeture de la section n’a pas pu être enregistrée.')
    result = row(data); message = request.actionKey === 'section.close' ? 'La section est fermée.' : 'La préparation de la fermeture a commencé.'
    await audit({ schoolId, action: request.actionKey, entityType: 'section', entityId: sectionId, before, after: result, metadata: { reason } })
  } else if (request.actionKey.startsWith('capacity.')) {
    classId = required(classId || payload.classId, 'La classe')
    const cls = await safeRowById(db, 'angelcare360_classes', schoolId, classId)
    if (request.actionKey === 'capacity.preview_change') {
      const nextCapacity = positiveInteger(payload.newCapacity, 'La nouvelle capacité', true)
      const snapshot = await getClassesCapacitySnapshot(); const current = snapshot.classes.find((item) => item.id === classId)
      state = 'preview'; result = { previousCapacity: numeric(cls.capacity), newCapacity: nextCapacity, activeChildren: current?.activeChildren || 0, reservations: current?.reservedPlaces || 0, availableBefore: current?.availablePlaces || 0, availableAfter: Math.max(0, nextCapacity - (current?.activeChildren || 0) - (current?.reservedPlaces || 0)), waitingAffected: current?.waitingRequests || 0, projectedChildren: current?.projectedChildren || 0, entitlementRemaining: snapshot.entitlement.remaining }; message = 'La simulation est prête. Aucune donnée n’a été modifiée.'
    } else if (request.actionKey === 'capacity.request_topup') {
      const snapshot = await getClassesCapacitySnapshot()
      const quantity = positiveInteger(payload.quantity, 'Le nombre de places supplémentaires')
      const { data, error } = await db.from('angelcare360_capacity_topup_requests').insert({ school_id: schoolId, subscription_id: context.runtimeEntitlements.subscriptionId, package_version_id: context.runtimeEntitlements.packageVersionId, meter_key: snapshot.entitlement.meterKey, quantity, state: 'requested', reason: required(reason, 'Le motif'), source_class_id: classId, requested_by: userId, requested_at: now(), exact_catalogue_href: `/angelcare-360-operator/platform?workspace=product&section=topups&meter=${snapshot.entitlement.meterKey || ''}&quantity=${quantity}&school=${schoolId}` }).select('*').single()
      if (error) throw new Error('La demande de places supplémentaires n’a pas pu être enregistrée.')
      state = 'requested'; result = row(data); message = `${quantity} place(s) supplémentaire(s) ont été demandées. La limite changera après activation confirmée.`
      await audit({ schoolId, action: request.actionKey, entityType: 'capacity_topup_request', entityId: text(row(data).id), after: result, metadata: { classId, meterKey: snapshot.entitlement.meterKey, quantity } })
    } else if (request.actionKey === 'capacity.request_exception' || request.actionKey === 'capacity.approve_exception' || request.actionKey === 'capacity.expire_exception') {
      if (request.actionKey === 'capacity.request_exception') {
        const temporaryCapacity = positiveInteger(payload.temporaryCapacity, 'La capacité temporaire')
        const { data, error } = await db.from('angelcare360_capacity_temporary_exceptions').insert({ school_id: schoolId, class_id: classId, section_id: sectionId, previous_capacity: numeric(cls.capacity), temporary_capacity: temporaryCapacity, starts_at: effectiveAt, expires_at: required(payload.expiresAt, 'La date d’expiration'), review_at: optionalText(payload.reviewAt), reason: required(reason, 'Le motif'), state: 'requested', requested_by: userId, created_by: userId }).select('*').single()
        if (error) throw new Error('La demande d’autorisation temporaire n’a pas pu être créée.')
        state = 'requested'; result = row(data); message = 'La demande d’autorisation temporaire a été transmise pour validation.'
      } else {
        const exceptionId = required(payload.exceptionId, 'L’autorisation temporaire')
        const nextState = request.actionKey === 'capacity.approve_exception' ? 'approved' : 'expired'
        const { data, error } = await db.from('angelcare360_capacity_temporary_exceptions').update({ state: nextState, approved_by: nextState === 'approved' ? userId : null, approved_at: nextState === 'approved' ? now() : null, expired_at: nextState === 'expired' ? now() : null, updated_at: now() }).eq('school_id', schoolId).eq('id', exceptionId).select('*').single()
        if (error) throw new Error('L’autorisation temporaire n’a pas pu être mise à jour.')
        result = row(data); message = nextState === 'approved' ? 'L’autorisation temporaire est active jusqu’à sa date d’expiration.' : 'L’autorisation temporaire est terminée.'
      }
    } else {
      const newCapacity = positiveInteger(payload.newCapacity, 'La nouvelle capacité', true)
      if (request.actionKey === 'capacity.request_change') {
        const { data, error } = await db.from('angelcare360_governance_capacity_changes').insert({ school_id: schoolId, entity_type: sectionId ? 'section' : 'class', entity_id: sectionId || classId, previous_capacity: sectionId ? numeric((await safeRowById(db, 'angelcare360_sections', schoolId, sectionId)).capacity) : numeric(cls.capacity), new_capacity: newCapacity, effective_at: effectiveAt, reason: required(reason, 'Le motif'), impact_json: row(payload.impact), state: 'requested', requested_by: userId, created_by: userId }).select('*').single()
        if (error) throw new Error('La demande de modification n’a pas pu être enregistrée.')
        state = 'requested'; result = row(data); message = 'La modification du nombre de places a été préparée pour validation.'
      } else if (request.actionKey === 'capacity.approve_change') {
        const changeId = required(payload.changeId, 'La demande de modification')
        const { data, error } = await db.from('angelcare360_governance_capacity_changes').update({ state: 'approved', approved_by: userId }).eq('school_id', schoolId).eq('id', changeId).select('*').single()
        if (error) throw new Error('La modification n’a pas pu être validée.')
        result = row(data); message = 'La nouvelle capacité est validée et peut être appliquée.'
      } else if (request.actionKey === 'capacity.apply_change') {
        const changeId = optionalText(payload.changeId)
        const target = sectionId ? await safeRowById(db, 'angelcare360_sections', schoolId, sectionId) : cls
        const snapshot = await getClassesCapacitySnapshot(); const current = sectionId ? snapshot.sections.find((item) => item.id === sectionId) : snapshot.classes.find((item) => item.id === classId)
        if ((current?.activeChildren || 0) > newCapacity) throw new Error(`La nouvelle capacité est inférieure à l’effectif actuel de ${current?.activeChildren || 0} enfant(s).`)
        const table = sectionId ? 'angelcare360_sections' : 'angelcare360_classes'
        const targetId = sectionId || classId
        const { data, error } = await db.from(table).update({ capacity: newCapacity, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', targetId).select('*').single()
        if (error) throw new Error('La nouvelle capacité n’a pas pu être appliquée.')
        if (changeId) await db.from('angelcare360_governance_capacity_changes').update({ state: 'applied', applied_at: now(), approved_by: userId }).eq('school_id', schoolId).eq('id', changeId)
        result = row(data); message = `Le nombre de places est maintenant fixé à ${newCapacity}.`
        await audit({ schoolId, action: request.actionKey, entityType: sectionId ? 'section' : 'class', entityId: targetId, before: target, after: result, metadata: { reason, previousCapacity: target.capacity, newCapacity } })
      }
    }
  } else if (request.actionKey.startsWith('seat.')) {
    if (request.actionKey === 'seat.reserve') {
      classId = required(classId || payload.classId, 'La classe')
      const snapshot = await getClassesCapacitySnapshot()
      await ensurePlacementAllowed({ db, schoolId, classId, sectionId, studentCount: 1, entitlement: snapshot.entitlement })
      const { data, error } = await db.from('angelcare360_capacity_seat_reservations').insert({ school_id: schoolId, student_id: optionalText(payload.studentId), admission_application_id: optionalText(payload.admissionApplicationId), class_id: classId, section_id: sectionId, starts_on: optionalText(payload.startsOn) || dateOnly(), expires_on: required(payload.expiresOn, 'La date d’expiration'), state: 'reserved', reason, responsible_user_id: optionalText(payload.responsibleUserId) || userId, responsible_label: optionalText(payload.responsibleLabel) || context.user.full_name || context.user.email, created_by: userId }).select('*').single()
      if (error) throw new Error('La place n’a pas pu être réservée.')
      reservationId = text(row(data).id); result = row(data); message = 'La place est réservée jusqu’à la date indiquée.'
    } else {
      reservationId = required(reservationId, 'La réservation')
      const nextState = request.actionKey === 'seat.confirm' ? 'used' : request.actionKey === 'seat.release' ? 'released' : request.actionKey === 'seat.cancel' ? 'cancelled' : 'reserved'
      const patch: Row = { state: nextState, updated_at: now() }
      if (request.actionKey === 'seat.extend') patch.expires_on = required(payload.expiresOn, 'La nouvelle date d’expiration')
      const { data, error } = await db.from('angelcare360_capacity_seat_reservations').update(patch).eq('school_id', schoolId).eq('id', reservationId).select('*').single()
      if (error) throw new Error('La réservation n’a pas pu être mise à jour.')
      result = row(data); message = request.actionKey === 'seat.confirm' ? 'La réservation a été convertie en affectation confirmée.' : request.actionKey === 'seat.release' ? 'La place est de nouveau disponible.' : request.actionKey === 'seat.cancel' ? 'La réservation est annulée.' : 'La réservation a été prolongée avec justification.'
    }
    await audit({ schoolId, action: request.actionKey, entityType: 'seat_reservation', entityId: reservationId, after: result, metadata: { classId, sectionId, reason } })
  } else if (request.actionKey === 'placement.preview' || request.actionKey === 'placement.assign' || request.actionKey === 'placement.cancel') {
    classId = required(classId || payload.classId, 'La classe')
    const studentId = required(payload.studentId || request.studentIds?.[0], 'L’enfant')
    const snapshot = await getClassesCapacitySnapshot()
    if (request.actionKey === 'placement.preview') {
      await ensurePlacementAllowed({ db, schoolId, classId, sectionId, studentCount: 1, entitlement: snapshot.entitlement })
      const target = snapshot.classes.find((item) => item.id === classId)
      state = 'preview'; result = { studentId, classId, sectionId, targetClassLabel: target?.name, availableBefore: target?.availablePlaces, availableAfter: Math.max(0, (target?.availablePlaces || 0) - 1), projectedAfter: (target?.projectedChildren || 0) + 1, entitlementRemainingAfter: snapshot.entitlement.remaining === null ? null : Math.max(0, snapshot.entitlement.remaining - 1) }; message = 'La place est disponible. Vérifiez les conséquences avant de confirmer.'
    } else if (request.actionKey === 'placement.assign') {
      await ensurePlacementAllowed({ db, schoolId, classId, sectionId, studentCount: 1, entitlement: snapshot.entitlement })
      const academicYearId = required(payload.academicYearId || context.academicYear?.id, 'L’année scolaire')
      const existing = snapshot.classes.flatMap((item) => item.children).find((child) => child.id === studentId)
      if (existing) throw new Error('Cet enfant possède déjà une affectation active pour cette année scolaire. Utilisez le déplacement de classe.')
      const { data, error } = await db.from('angelcare360_class_enrollments').insert({ school_id: schoolId, academic_year_id: academicYearId, student_id: studentId, class_id: classId, section_id: sectionId, enrollment_status: 'enrolled', enrolled_on: optionalText(payload.enrolledOn) || dateOnly(), status: 'active', transfer_reason: reason, metadata_json: { source: 'classes_capacity_area', admission_application_id: optionalText(payload.admissionApplicationId) }, created_by: userId, updated_by: userId }).select('*').single()
      if (error) throw new Error(error.message.includes('duplicate') ? 'Cet enfant possède déjà une affectation pour cette année scolaire.' : 'La place n’a pas pu être attribuée.')
      await db.from('angelcare360_students').update({ current_class_id: classId, current_section_id: sectionId, admission_status: 'enrolled', updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', studentId)
      if (payload.admissionApplicationId) await db.from('angelcare360_admission_applications').update({ class_id: classId, section_id: sectionId, status: 'approved', updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', String(payload.admissionApplicationId))
      result = row(data); message = 'La place est attribuée et le dossier de l’enfant a été mis à jour.'
      await audit({ schoolId, action: request.actionKey, entityType: 'class_enrollment', entityId: text(row(data).id), after: result, metadata: { studentId, classId, sectionId } })
    } else {
      const enrollmentId = required(payload.enrollmentId, 'L’affectation')
      const before = await safeRowById(db, 'angelcare360_class_enrollments', schoolId, enrollmentId)
      const { data, error } = await db.from('angelcare360_class_enrollments').update({ status: 'inactive', enrollment_status: 'withdrawn', left_on: dateOnly(), transfer_reason: reason, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', enrollmentId).select('*').single()
      if (error) throw new Error('L’affectation n’a pas pu être annulée.')
      result = row(data); message = 'L’affectation est terminée et reste visible dans l’historique.'
      await audit({ schoolId, action: request.actionKey, entityType: 'class_enrollment', entityId: enrollmentId, before, after: result })
    }
  } else if (request.actionKey.startsWith('population_move.') || request.actionKey.startsWith('class_split.') || request.actionKey.startsWith('section_merge.')) {
    const studentIds = request.studentIds || (Array.isArray(payload.studentIds) ? payload.studentIds.map(String) : [])
    const targetClassId = required(payload.targetClassId || classId, 'La classe cible')
    const sourceClassId = optionalText(payload.sourceClassId || classId)
    let targetSectionId = optionalText(payload.targetSectionId || sectionId)
    const sourceSectionId = optionalText(payload.sourceSectionId)
    const snapshot = await getClassesCapacitySnapshot()
    const movementType: CapacityMovementRun['movementType'] = request.actionKey.startsWith('class_split.') ? 'split' : request.actionKey.startsWith('section_merge.') ? 'merge' : 'movement'
    if (movementType === 'merge' && sourceSectionId && targetSectionId && sourceSectionId === targetSectionId) throw new Error('Choisissez deux sections différentes.')
    if (request.actionKey.endsWith('.preview') || STRUCTURAL_PREVIEW_ACTIONS.has(request.actionKey)) {
      if (movementType === 'split' && !targetSectionId) {
        const proposedCapacity = positiveInteger(payload.newSectionCapacity || payload.capacity, 'Le nombre de places de la nouvelle section', true)
        if (studentIds.length > proposedCapacity) throw new Error(`La nouvelle section ne prévoit que ${proposedCapacity} place(s) pour ${studentIds.length} enfant(s).`)
      } else {
        await ensurePlacementAllowed({ db, schoolId, classId: targetClassId, sectionId: targetSectionId, studentCount: studentIds.length, classDelta: sourceClassId === targetClassId ? 0 : studentIds.length, entitlement: { ...snapshot.entitlement, remaining: null } })
      }
      const source = snapshot.classes.find((item) => item.id === sourceClassId)
      const target = snapshot.classes.find((item) => item.id === targetClassId)
      state = 'preview'; result = { movementType, studentIds, sourceClassId, targetClassId, sourceBefore: source?.activeChildren || 0, sourceAfter: Math.max(0, (source?.activeChildren || 0) - studentIds.length), targetBefore: target?.activeChildren || 0, targetAfter: (target?.activeChildren || 0) + studentIds.length, targetCapacity: target?.plannedPlaces || 0, blockedStudentIds: studentIds.filter((studentId) => !snapshot.classes.flatMap((item) => item.children).some((child) => child.id === studentId)) }; message = 'La nouvelle répartition est prête à être vérifiée. Aucune donnée n’a été modifiée.'
    } else if (request.actionKey === 'population_move.cancel') {
      movementRunId = required(movementRunId, 'Le mouvement')
      const { data, error } = await db.from('angelcare360_governance_population_movements').update({ state: 'rolled_back' }).eq('school_id', schoolId).eq('id', movementRunId).select('*').single()
      if (error) throw new Error('Le mouvement n’a pas pu être annulé.')
      result = row(data); message = 'Le mouvement a été annulé avant son exécution.'
    } else if (request.actionKey === 'population_move.retry_item') {
      const itemId = required(request.movementItemId || payload.movementItemId, 'L’élément à réessayer')
      const item = await safeRowById(db, 'angelcare360_capacity_movement_items', schoolId, itemId)
      const enrollment = rows((await db.from('angelcare360_class_enrollments').select('*').eq('school_id', schoolId).eq('student_id', text(item.student_id)).eq('status', 'active')).data)[0]
      if (!enrollment) throw new Error('L’affectation active de cet enfant est introuvable.')
      const { error: updateError } = await db.from('angelcare360_class_enrollments').update({ class_id: text(item.target_class_id), section_id: optionalText(item.target_section_id), transfer_reason: reason || text(item.reason), updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', text(enrollment.id))
      if (updateError) throw new Error('Cet enfant n’a pas pu être déplacé. Vérifiez son dossier et la classe cible.')
      await db.from('angelcare360_students').update({ current_class_id: text(item.target_class_id), current_section_id: optionalText(item.target_section_id), updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', text(item.student_id))
      const { data, error } = await db.from('angelcare360_capacity_movement_items').update({ state: 'repaired', failure_reason: null, executed_at: now(), updated_at: now() }).eq('school_id', schoolId).eq('id', itemId).select('*').single()
      if (error) throw new Error('Le résultat du déplacement n’a pas pu être confirmé.')
      result = row(data); message = 'Le déplacement de cet enfant a été réparé.'
    } else {
      if (!studentIds.length) throw new Error('Sélectionnez au moins un enfant.')
      let createdSection: Row | null = null
      if (movementType === 'split' && !targetSectionId) {
        const targetClass = await safeRowById(db, 'angelcare360_classes', schoolId, targetClassId)
        const sectionCode = required(payload.newSectionCode || payload.sectionCode, 'Le code de la nouvelle section')
        const sectionName = required(payload.newSectionName || payload.name, 'Le nom de la nouvelle section')
        const sectionCapacity = positiveInteger(payload.newSectionCapacity || payload.capacity, 'Le nombre de places de la nouvelle section', true)
        if (studentIds.length > sectionCapacity) throw new Error(`La nouvelle section ne prévoit que ${sectionCapacity} place(s) pour ${studentIds.length} enfant(s).`)
        const { data: sectionData, error: sectionError } = await db.from('angelcare360_sections').insert({ school_id: schoolId, academic_year_id: text(targetClass.academic_year_id), class_id: targetClassId, section_code: sectionCode, name: sectionName, capacity: sectionCapacity, room: optionalText(payload.room), status: 'active', metadata_json: { area3_state: 'open', responsible_staff_id: optionalText(payload.responsibleStaffId), responsible_label: optionalText(payload.responsibleLabel), created_from_split: true }, created_by: userId, updated_by: userId }).select('*').single()
        if (sectionError) throw new Error(sectionError.message.includes('duplicate') ? 'Une section utilise déjà ce code dans cette classe.' : 'La nouvelle section n’a pas pu être créée.')
        createdSection = row(sectionData)
        targetSectionId = text(createdSection.id)
      }
      await ensurePlacementAllowed({ db, schoolId, classId: targetClassId, sectionId: targetSectionId, studentCount: studentIds.length, classDelta: sourceClassId === targetClassId ? 0 : studentIds.length, entitlement: { ...snapshot.entitlement, remaining: null } })
      const movementCode = `MOV-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${randomUUID().slice(0, 6).toUpperCase()}`
      const { data: runData, error: runError } = await db.from('angelcare360_governance_population_movements').insert({ school_id: schoolId, movement_code: movementCode, student_ids: studentIds, source_class_id: sourceClassId, source_section_id: sourceSectionId, target_class_id: targetClassId, target_section_id: targetSectionId, effective_at: effectiveAt, reason, state: 'executing', requested_by: userId, executed_by: userId, created_by: userId, metadata_json: { movement_type: movementType, requested_by_label: context.user.full_name || context.user.email } }).select('*').single()
      if (runError) throw new Error('Le mouvement n’a pas pu être préparé.')
      movementRunId = text(row(runData).id)
      const outcomes: Row[] = []
      for (const studentId of studentIds) {
        const enrollment = rows((await db.from('angelcare360_class_enrollments').select('*').eq('school_id', schoolId).eq('student_id', studentId).eq('status', 'active')).data)[0]
        let itemState = 'completed'; let failureReason: string | null = null
        if (!enrollment) { itemState = 'failed'; failureReason = 'Aucune affectation active n’a été trouvée.' }
        else {
          const { error } = await db.from('angelcare360_class_enrollments').update({ class_id: targetClassId, section_id: targetSectionId, transfer_reason: reason, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', text(enrollment.id))
          if (error) { itemState = 'failed'; failureReason = 'Le dossier de l’enfant n’a pas pu être mis à jour.' }
          else await db.from('angelcare360_students').update({ current_class_id: targetClassId, current_section_id: targetSectionId, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', studentId)
        }
        const { data: itemData } = await db.from('angelcare360_capacity_movement_items').insert({ school_id: schoolId, movement_run_id: movementRunId, student_id: studentId, source_class_id: optionalText(enrollment?.class_id) || sourceClassId, source_section_id: optionalText(enrollment?.section_id) || sourceSectionId, target_class_id: targetClassId, target_section_id: targetSectionId, state: itemState, failure_reason: failureReason, reason, executed_at: itemState === 'completed' ? now() : null, created_by: userId }).select('*').single()
        outcomes.push(row(itemData))
      }
      const failed = outcomes.filter((item) => text(item.state) === 'failed').length
      const finalState = failed === 0 ? 'completed' : failed === outcomes.length ? 'failed' : 'partially_failed'
      await db.from('angelcare360_governance_population_movements').update({ state: finalState, executed_at: now() }).eq('school_id', schoolId).eq('id', movementRunId)
      let closedSourceSection: Row | null = null
      if (movementType === 'merge' && failed === 0 && sourceSectionId) {
        const remaining = rows((await db.from('angelcare360_class_enrollments').select('id').eq('school_id', schoolId).eq('section_id', sourceSectionId).eq('status', 'active')).data).length
        if (remaining === 0) {
          const sourceSection = await safeRowById(db, 'angelcare360_sections', schoolId, sourceSectionId)
          const metadata = { ...row(sourceSection.metadata_json), area3_state: 'closed', merged_into_section_id: targetSectionId, merged_at: now() }
          const { data: closedData } = await db.from('angelcare360_sections').update({ status: 'inactive', metadata_json: metadata, updated_by: userId, updated_at: now() }).eq('school_id', schoolId).eq('id', sourceSectionId).select('*').single()
          closedSourceSection = row(closedData)
        }
      }
      result = { run: row(runData), outcomes, failed, completed: outcomes.length - failed, createdSection, closedSourceSection }
      sectionId = targetSectionId
      state = failed ? 'partially_failed' : 'applied'
      message = failed ? `${outcomes.length - failed} enfant(s) déplacé(s). ${failed} dossier(s) doivent être corrigés.` : `${outcomes.length} enfant(s) ont été déplacés avec succès.`
      await audit({ schoolId, action: request.actionKey, entityType: 'population_movement', entityId: movementRunId, after: result, metadata: { sourceClassId, targetClassId, studentIds } })
    }
  } else if (request.actionKey.startsWith('capacity_issue.')) {
    const requestedIssueKey = required(issueId || payload.issueId, 'Le problème')
    let issueRow: Row | null = null
    try {
      const byId = await db.from('angelcare360_capacity_issues').select('*').eq('school_id', schoolId).eq('id', requestedIssueKey).maybeSingle()
      issueRow = byId.error ? null : row(byId.data)
    } catch { issueRow = null }
    if (!issueRow || !issueRow.id) {
      const byKey = await db.from('angelcare360_capacity_issues').select('*').eq('school_id', schoolId).eq('issue_key', requestedIssueKey).maybeSingle()
      issueRow = byKey.error ? null : row(byKey.data)
    }
    if (!issueRow || !issueRow.id) {
      const sourceType = sectionId ? 'section' : classId ? 'class' : 'placement'
      const sourceId = sectionId || classId || requestedIssueKey
      const { data: created, error: createError } = await db.from('angelcare360_capacity_issues').insert({ school_id: schoolId, issue_key: requestedIssueKey, class_id: classId, section_id: sectionId, source_type: sourceType, source_id: sourceId, title: optionalText(payload.title) || 'Point Classes et places', explanation: optionalText(payload.explanation) || reason || 'Ce point a été enregistré depuis le dossier Classes et places.', consequence: optionalText(payload.consequence), severity: text(payload.severity, 'warning'), state: 'open', recommended_action_key: optionalText(payload.recommendedActionKey), recommended_action_label: optionalText(payload.recommendedActionLabel), exact_href: optionalText(payload.exactHref), created_by: userId }).select('*').single()
      if (createError) throw new Error('Ce point n’a pas pu être préparé pour le suivi.')
      issueRow = row(created)
    }
    issueId = text(issueRow.id)
    if (request.actionKey === 'capacity_issue.assign') {
      const { data, error } = await db.from('angelcare360_capacity_issues').update({ state: 'owned', owner_user_id: required(payload.ownerUserId, 'La personne responsable'), owner_label: required(payload.ownerLabel, 'Le nom de la personne responsable'), due_at: optionalText(payload.dueAt), updated_at: now() }).eq('school_id', schoolId).eq('id', issueId).select('*').single()
      if (error) throw new Error('La responsabilité n’a pas pu être attribuée.')
      result = row(data); message = `Ce point est maintenant pris en charge par ${text(row(data).owner_label)}.`
    } else {
      const nextState = request.actionKey === 'capacity_issue.resolve' ? 'resolved' : request.actionKey === 'capacity_issue.reopen' && ISSUE_STATE_ACTIONS.has(request.actionKey) ? 'reopened' : 'reopened'
      const { data, error } = await db.from('angelcare360_capacity_issues').update({ state: nextState, resolution_note: reason, resolved_at: nextState === 'resolved' ? now() : null, resolved_by: nextState === 'resolved' ? userId : null, updated_at: now() }).eq('school_id', schoolId).eq('id', issueId).select('*').single()
      if (error) throw new Error('Ce point n’a pas pu être mis à jour.')
      result = row(data); message = nextState === 'resolved' ? 'Ce point est réglé et reste visible dans l’historique.' : 'Ce point a été rouvert.'
    }
    await audit({ schoolId, action: request.actionKey, entityType: 'capacity_issue', entityId: issueId, after: result, metadata: { issueKey: requestedIssueKey } })
  } else if (request.actionKey === 'capacity_note.add') {
    const body = required(payload.body, 'La note')
    const { data, error } = await db.from('angelcare360_capacity_notes').insert({ school_id: schoolId, class_id: classId, section_id: sectionId, issue_id: issueId, body, important: boolean(payload.important), author_user_id: userId, author_label: context.user.full_name || context.user.email || 'Équipe administrative', created_by: userId }).select('*').single()
    if (error) throw new Error('La note n’a pas pu être ajoutée.')
    result = row(data); message = 'La note a été ajoutée au dossier.'
  } else if (request.actionKey === 'capacity_evidence.request') {
    const title = required(payload.title, 'Le document ou justificatif attendu')
    const { data, error } = await db.from('angelcare360_capacity_tasks').insert({ school_id: schoolId, class_id: classId, section_id: sectionId, issue_id: issueId, title: `Justificatif demandé · ${title}`, description: optionalText(payload.description), state: 'open', priority: 'high', owner_user_id: optionalText(payload.ownerUserId), owner_label: optionalText(payload.ownerLabel), due_at: optionalText(payload.dueAt), metadata_json: { task_type: 'evidence_request' }, created_by: userId }).select('*').single()
    if (error) throw new Error('La demande de justificatif n’a pas pu être créée.')
    result = row(data); message = 'La demande de justificatif est enregistrée.'
  } else {
    throw new Error('Cette action n’est pas encore disponible dans ce contexte.')
  }

  await storeReceipt(db, { schoolId, actionKey: request.actionKey, key, classId, sectionId, reservationId, movementRunId, issueId, message, result, userId })
  return { ok: true, state, message, classId, sectionId, reservationId, movementRunId, issueId, result, snapshot: state === 'preview' ? undefined : await getClassesCapacitySnapshot() }
}
