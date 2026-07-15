import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360ClaimAuditQueryFiltersSchema,
  angelcare360ClaimTicketAssignSchema,
  angelcare360ClaimTicketCloseSchema,
  angelcare360ClaimTicketCreateSchema,
  angelcare360ClaimTicketResolveSchema,
  angelcare360ClaimTicketStatusChangeSchema,
  angelcare360ClaimTicketUpdateSchema,
} from '@/lib/angelcare360/validation'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type {
  Angelcare360ClaimPriority,
  Angelcare360ClaimStatus,
  Angelcare360ClaimTicketRecord,
} from '@/types/angelcare360/communications'
import type {
  Angelcare360ClaimAuditQueryFiltersInput,
  Angelcare360ClaimTicketAssignInput,
  Angelcare360ClaimTicketCloseInput,
  Angelcare360ClaimTicketCreateInput,
  Angelcare360ClaimTicketResolveInput,
  Angelcare360ClaimTicketStatusChangeInput,
} from '@/lib/angelcare360/validation'

type Row = Record<string, any>
type AccessContext = NonNullable<Awaited<ReturnType<typeof getAngelcare360AccessContext>>>
type SchoolAccessContext = Omit<AccessContext, 'school'> & {
  school: NonNullable<AccessContext['school']>
}

const MODULE = 'claims'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value.trim() : String(value)
}

function nowIso() {
  return new Date().toISOString()
}

async function getContextOrThrow(permissionKey: string, schoolId?: string | null): Promise<SchoolAccessContext> {
  const context = await requireAngelcare360Permission(permissionKey, { schoolId })
  if (!context || !context.school) {
    throw new Error('Aucun établissement actif n’est disponible.')
  }
  return context as SchoolAccessContext
}

async function auditClaimEvent(input: {
  action: string
  severity?: 'debug' | 'info' | 'notice' | 'warning' | 'critical'
  schoolId: string
  entityType: string
  entityId: string
  beforeData?: Record<string, unknown>
  afterData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  return recordAngelcare360AuditEventServer({
    category: 'claims',
    module: MODULE,
    action: input.action,
    schoolId: input.schoolId,
    entityType: input.entityType,
    entityId: input.entityId,
    severity: input.severity || 'info',
    beforeData: input.beforeData,
    afterData: input.afterData,
    metadata: input.metadata,
  })
}

function normalizeHistory(history: unknown) {
  if (Array.isArray(history)) return history as Array<Record<string, unknown>>
  return []
}

function appendHistory(history: unknown, entry: Record<string, unknown>) {
  return [...normalizeHistory(history), entry]
}

function mapClaim(row: Row): Angelcare360ClaimTicketRecord {
  return {
    id: asString(row.id),
    school_id: asString(row.school_id),
    reclamation_code: asString(row.reclamation_code),
    submitted_by_app_user_id: row.submitted_by_app_user_id ? asString(row.submitted_by_app_user_id) : null,
    reporter_role: row.reporter_role ? asString(row.reporter_role) : null,
    subject: asString(row.subject),
    description: asString(row.description),
    related_entity_type: row.related_entity_type ? asString(row.related_entity_type) : null,
    related_entity_id: row.related_entity_id ? asString(row.related_entity_id) : null,
    category: row.category ? asString(row.category) : null,
    priority: asString(row.priority) as Angelcare360ClaimPriority,
    status: asString(row.status) as Angelcare360ClaimStatus,
    assigned_staff_id: row.assigned_staff_id ? asString(row.assigned_staff_id) : null,
    resolution_notes: row.resolution_notes ? asString(row.resolution_notes) : null,
    resolution_summary: row.resolution_summary ? asString(row.resolution_summary) : null,
    status_history_json: normalizeHistory(row.status_history_json),
    internal_notes_json: normalizeHistory(row.internal_notes_json),
    resolved_at: row.resolved_at ? asString(row.resolved_at) : null,
    closed_at: row.closed_at ? asString(row.closed_at) : null,
    requester_label: row.requester_label ? asString(row.requester_label) : null,
    assigned_staff_label: row.assigned_staff_label ? asString(row.assigned_staff_label) : null,
  }
}

export async function getAngelcare360ClaimsOverview(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('reclamations.view', options?.schoolId)
  const supabase = await createClient()
  const [tickets, audit, unassigned, urgentOpen] = await Promise.all([
    supabase.from('angelcare360_reclamations').select('id,status,priority,assigned_staff_id,resolution_summary').eq('school_id', context.school.id),
    supabase.from('angelcare360_audit_logs').select('id').eq('school_id', context.school.id).eq('module', 'claims').order('created_at', { ascending: false }).limit(20),
    supabase.from('angelcare360_reclamations').select('id', { count: 'exact', head: true }).eq('school_id', context.school.id).is('assigned_staff_id', null).neq('status', 'closed').neq('status', 'archived'),
    supabase.from('angelcare360_reclamations').select('id', { count: 'exact', head: true }).eq('school_id', context.school.id).in('priority', ['high', 'urgent']).in('status', ['new', 'in_review', 'assigned', 'waiting_parent', 'waiting_internal']),
  ])

  const rows = tickets.data || []
  return {
    schoolId: context.school.id,
    schoolName: context.school.name,
    totalTickets: rows.length,
    newTickets: rows.filter((row) => row.status === 'new').length,
    assignedTickets: rows.filter((row) => row.status === 'assigned').length,
    urgentTickets: rows.filter((row) => row.priority === 'urgent').length,
    waitingParentTickets: rows.filter((row) => row.status === 'waiting_parent').length,
    waitingInternalTickets: rows.filter((row) => row.status === 'waiting_internal').length,
    resolvedTickets: rows.filter((row) => row.status === 'resolved').length,
    closedTickets: rows.filter((row) => row.status === 'closed').length,
    unassignedTickets: unassigned.count || 0,
    urgentOpenTickets: urgentOpen.count || 0,
    risks: [
      unassigned.count ? 'Des tickets restent sans assignation.' : null,
      urgentOpen.count ? 'Des tickets urgents restent ouverts.' : null,
      rows.some((row) => !row.resolution_summary && ['resolved', 'closed'].includes(row.status)) ? 'Des clôtures n’ont pas de résumé de résolution.' : null,
    ].filter(Boolean) as string[],
    recentAudit: (audit.data || []) as Angelcare360AuditRecord[],
  }
}

export async function listAngelcare360ClaimTickets(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('reclamations.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_reclamations').select('*').eq('school_id', context.school.id).order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(error.message)
  return (data || []).map(mapClaim)
}

export async function getAngelcare360ClaimTicketById(id: string, options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('reclamations.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_reclamations').select('*').eq('school_id', context.school.id).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return mapClaim(data)
}

export async function createAngelcare360ClaimTicket(input: Record<string, unknown>) {
  const parsed = angelcare360ClaimTicketCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La réclamation est invalide.' }
  const context = await getContextOrThrow('reclamations.create', parsed.data.schoolId)
  const supabase = await createClient()
  const payload = {
    school_id: context.school.id,
    reclamation_code: parsed.data.reclamationCode,
    submitted_by_app_user_id: parsed.data.submittedByAppUserId || null,
    submitted_by_parent_id: parsed.data.submittedByParentId || null,
    submitted_by_student_id: parsed.data.submittedByStudentId || null,
    submitted_by_staff_id: parsed.data.submittedByStaffId || null,
    reporter_role: parsed.data.submittedByAppUserId ? 'app_user' : parsed.data.submittedByParentId ? 'parent' : parsed.data.submittedByStudentId ? 'student' : parsed.data.submittedByStaffId ? 'staff' : null,
    subject: parsed.data.subject,
    description: parsed.data.description,
    category: parsed.data.category || null,
    priority: parsed.data.priority,
    status: parsed.data.status || 'new',
    status_history_json: [{ status: parsed.data.status || 'new', changed_at: nowIso(), changed_by: context.user.id }],
    internal_notes_json: [],
    metadata_json: { source: 'phase12' },
  }
  const { data, error } = await supabase.from('angelcare360_reclamations').insert(payload).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Impossible de créer la réclamation.' }
  await auditClaimEvent({
    action: 'claim.created',
    schoolId: context.school.id,
    entityType: 'angelcare360_reclamations',
    entityId: data.id,
    afterData: data,
  })
  return { ok: true, data: mapClaim(data) }
}

export async function updateAngelcare360ClaimTicket(input: Record<string, unknown>) {
  const parsed = angelcare360ClaimTicketUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La mise à jour de réclamation est invalide.' }
  const context = await getContextOrThrow('reclamations.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_reclamations').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  if (!before) return { ok: false, error: 'Réclamation introuvable.' }
  const { data, error } = await supabase.from('angelcare360_reclamations').update({
    reclamation_code: parsed.data.reclamationCode,
    subject: parsed.data.subject,
    description: parsed.data.description,
    category: parsed.data.category || null,
    priority: parsed.data.priority,
    status: parsed.data.status || before.status,
    submitted_by_app_user_id: parsed.data.submittedByAppUserId || before.submitted_by_app_user_id || null,
    submitted_by_parent_id: parsed.data.submittedByParentId || before.submitted_by_parent_id || null,
    submitted_by_student_id: parsed.data.submittedByStudentId || before.submitted_by_student_id || null,
    submitted_by_staff_id: parsed.data.submittedByStaffId || before.submitted_by_staff_id || null,
    status_history_json: appendHistory(before.status_history_json, { status: parsed.data.status || before.status, changed_at: nowIso(), changed_by: context.user.id, note: 'Mise à jour' }),
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Réclamation introuvable.' }
  await auditClaimEvent({
    action: 'claim.updated',
    schoolId: context.school.id,
    entityType: 'angelcare360_reclamations',
    entityId: data.id,
    beforeData: before,
    afterData: data,
  })
  return { ok: true, data: mapClaim(data) }
}

export async function assignAngelcare360ClaimTicket(input: Record<string, unknown>) {
  const parsed = angelcare360ClaimTicketAssignSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'L’assignation de réclamation est invalide.' }
  const context = await getContextOrThrow('reclamations.assign', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_reclamations').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  if (!before) return { ok: false, error: 'Réclamation introuvable.' }
  const { data, error } = await supabase.from('angelcare360_reclamations').update({
    assigned_staff_id: parsed.data.assignedStaffId,
    assigned_at: nowIso(),
    status: 'assigned',
    status_history_json: appendHistory(before.status_history_json, { status: 'assigned', changed_at: nowIso(), changed_by: context.user.id, note: parsed.data.note || 'Assignation' }),
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Assignation impossible.' }
  await auditClaimEvent({
    action: 'claim.assigned',
    schoolId: context.school.id,
    entityType: 'angelcare360_reclamations',
    entityId: data.id,
    beforeData: before,
    afterData: data,
    metadata: { note: parsed.data.note || null },
  })
  return { ok: true, data: mapClaim(data) }
}

export async function changeAngelcare360ClaimTicketStatus(input: Record<string, unknown>) {
  const parsed = angelcare360ClaimTicketStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Le changement de statut de réclamation est invalide.' }
  const context = await getContextOrThrow('reclamations.update', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_reclamations').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  if (!before) return { ok: false, error: 'Réclamation introuvable.' }
  const nextStatus = parsed.data.status
  const { data, error } = await supabase.from('angelcare360_reclamations').update({
    status: nextStatus,
    status_history_json: appendHistory(before.status_history_json, { status: nextStatus, changed_at: nowIso(), changed_by: context.user.id, note: parsed.data.note || 'Changement de statut' }),
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Changement de statut impossible.' }
  await auditClaimEvent({
    action: 'claim.status_changed',
    schoolId: context.school.id,
    entityType: 'angelcare360_reclamations',
    entityId: data.id,
    beforeData: before,
    afterData: data,
    metadata: { note: parsed.data.note || null },
  })
  return { ok: true, data: mapClaim(data) }
}

export async function resolveAngelcare360ClaimTicket(input: Record<string, unknown>) {
  const parsed = angelcare360ClaimTicketResolveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La résolution de réclamation est invalide.' }
  const context = await getContextOrThrow('reclamations.approve', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_reclamations').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  if (!before) return { ok: false, error: 'Réclamation introuvable.' }
  const { data, error } = await supabase.from('angelcare360_reclamations').update({
    status: 'resolved',
    resolution_summary: parsed.data.resolutionSummary,
    resolution_notes: parsed.data.note || parsed.data.resolutionSummary,
    resolved_at: nowIso(),
    status_history_json: appendHistory(before.status_history_json, { status: 'resolved', changed_at: nowIso(), changed_by: context.user.id, note: parsed.data.resolutionSummary }),
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Résolution impossible.' }
  await auditClaimEvent({
    action: 'claim.resolved',
    schoolId: context.school.id,
    entityType: 'angelcare360_reclamations',
    entityId: data.id,
    severity: 'warning',
    beforeData: before,
    afterData: data,
    metadata: { resolutionSummary: parsed.data.resolutionSummary },
  })
  return { ok: true, data: mapClaim(data) }
}

export async function closeAngelcare360ClaimTicket(input: Record<string, unknown>) {
  const parsed = angelcare360ClaimTicketCloseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'La clôture de réclamation est invalide.' }
  const context = await getContextOrThrow('reclamations.approve', parsed.data.schoolId)
  const supabase = await createClient()
  const { data: before } = await supabase.from('angelcare360_reclamations').select('*').eq('id', parsed.data.id).eq('school_id', context.school.id).maybeSingle()
  if (!before) return { ok: false, error: 'Réclamation introuvable.' }
  const { data, error } = await supabase.from('angelcare360_reclamations').update({
    status: 'closed',
    resolution_summary: parsed.data.resolutionSummary,
    resolution_notes: parsed.data.note || parsed.data.resolutionSummary,
    resolved_at: before.resolved_at || nowIso(),
    closed_at: nowIso(),
    status_history_json: appendHistory(before.status_history_json, { status: 'closed', changed_at: nowIso(), changed_by: context.user.id, note: parsed.data.resolutionSummary }),
  }).eq('id', parsed.data.id).eq('school_id', context.school.id).select('*').maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Clôture impossible.' }
  await auditClaimEvent({
    action: 'claim.closed',
    severity: 'warning',
    schoolId: context.school.id,
    entityType: 'angelcare360_reclamations',
    entityId: data.id,
    beforeData: before,
    afterData: data,
    metadata: { resolutionSummary: parsed.data.resolutionSummary },
  })
  return { ok: true, data: mapClaim(data) }
}

export async function listAngelcare360ClaimAssignments(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('reclamations.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('angelcare360_reclamations')
    .select('id, assigned_staff_id, status, priority, subject, assigned_at, created_at')
    .eq('school_id', context.school.id)
    .order('assigned_at', { ascending: false, nullsFirst: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return data || []
}

export async function listAngelcare360ClaimPriorityView(options?: { schoolId?: string | null }) {
  const context = await getContextOrThrow('reclamations.view', options?.schoolId)
  const supabase = await createClient()
  const { data, error } = await supabase.from('angelcare360_reclamations').select('id, priority, status, created_at').eq('school_id', context.school.id)
  if (error) throw new Error(error.message)
  return data || []
}

export async function listAngelcare360ClaimAuditEvents(options?: { schoolId?: string | null; filters?: Partial<Angelcare360ClaimAuditQueryFiltersInput> }) {
  const context = await getContextOrThrow('audit.view', options?.schoolId)
  const parsed = angelcare360ClaimAuditQueryFiltersSchema.safeParse(options?.filters || {})
  if (!parsed.success) throw new Error(parsed.errors[0]?.message || 'Les filtres d’audit réclamations sont invalides.')
  const supabase = await createClient()
  let query = supabase.from('angelcare360_audit_logs').select('*').eq('school_id', context.school.id).eq('module', 'claims').order('created_at', { ascending: false }).limit(200)
  if (parsed.data.action) query = query.eq('action', parsed.data.action)
  if (parsed.data.severity) query = query.eq('severity', parsed.data.severity)
  if (parsed.data.entityType) query = query.eq('entity_type', parsed.data.entityType)
  if (parsed.data.entityId) query = query.eq('entity_id', parsed.data.entityId)
  if (parsed.data.actorUserId) query = query.eq('actor_user_id', parsed.data.actorUserId)
  if (parsed.data.assignedStaffId) query = query.eq('metadata->assignedStaffId', parsed.data.assignedStaffId)
  if (parsed.data.search) query = query.or(`module.ilike.%${parsed.data.search}%,action.ilike.%${parsed.data.search}%,entity_type.ilike.%${parsed.data.search}%`)
  if (parsed.data.from) query = query.gte('created_at', parsed.data.from)
  if (parsed.data.to) query = query.lte('created_at', parsed.data.to)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as Angelcare360AuditRecord[]
}
