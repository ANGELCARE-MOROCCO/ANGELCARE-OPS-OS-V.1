import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type { Angelcare360PermissionRecord, Angelcare360RoleRecord } from '@/types/angelcare360/rbac'
import type { Angelcare360AdministrationOverview } from '@/types/angelcare360/administration'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { listAngelcare360AcademicYears, listAngelcare360Classes, listAngelcare360Permissions, listAngelcare360Roles, listAngelcare360Schools } from './queries'
import {
  angelcare360AcademicYearAdminSchema,
  angelcare360AuditFilterSchema,
  angelcare360ClassAdminSchema,
  angelcare360RolePermissionsSchema,
  angelcare360SchoolAdminSchema,
  angelcare360SchoolSettingsSchema,
  angelcare360SectionAdminSchema,
  angelcare360TermAdminSchema,
  angelcare360SubjectAdminSchema,
  angelcare360TeacherAssignmentAdminSchema,
} from '@/lib/angelcare360/validation'
import { recordAngelcare360AuditEventServer } from './audit'

type DatabaseClient = Awaited<ReturnType<typeof createClient>>

type MutationOutcome<T> = {
  ok: boolean
  record?: T | null
  error?: string
}

function pickSchoolId(input?: string | null, contextSchoolId?: string | null) {
  return input || contextSchoolId || null
}

async function countRows(table: string, schoolId?: string | null, filters?: Array<[string, string, unknown]>) {
  const supabase = await createClient()
  let query = supabase.from(table).select('id', { count: 'exact', head: true })

  if (schoolId) {
    query = query.eq('school_id', schoolId)
  }

  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }

  const { count } = await query
  return count ?? 0
}

async function getActiveSchoolId(explicitSchoolId?: string | null) {
  const context = await getAngelcare360AccessContext({ schoolId: explicitSchoolId || undefined })
  return context?.school?.id ?? explicitSchoolId ?? null
}

async function getCurrentUserAndContext(schoolId?: string | null) {
  const context = await getAngelcare360AccessContext({ schoolId: schoolId || undefined })
  if (!context) {
    throw new Error('Vous devez être connecté pour utiliser AngelCare 360.')
  }
  return context
}

function toRecord<T>(data: T | null | undefined) {
  return data ?? null
}

export async function getAngelcare360AdministrationOverview(options?: { schoolId?: string | null }): Promise<Angelcare360AdministrationOverview | null> {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId })
  if (!context?.school) return null

  const supabase = await createClient()
  const schoolId = context.school.id

  const [
    schoolCount,
    academicYearCount,
    termCount,
    classCount,
    sectionCount,
    subjectCount,
    activeRoleCount,
    permissionCount,
    latestSchool,
    currentAcademicYear,
    latestAuditEvents,
  ] = await Promise.all([
    countRows('angelcare360_schools'),
    countRows('angelcare360_academic_years', schoolId),
    countRows('angelcare360_terms', schoolId),
    countRows('angelcare360_classes', schoolId),
    countRows('angelcare360_sections', schoolId),
    countRows('angelcare360_subjects', schoolId),
    countRows('angelcare360_roles', schoolId, [['status', 'eq', 'active']]),
    countRows('angelcare360_permissions', undefined, [['status', 'eq', 'active']]),
    supabase
      .from('angelcare360_schools')
      .select('id, school_code, name, city, status')
      .eq('id', schoolId)
      .maybeSingle(),
    supabase
      .from('angelcare360_academic_years')
      .select('id, year_code, label, starts_on, ends_on, status, is_current')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .order('is_current', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('angelcare360_audit_logs')
      .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, request_id, metadata, created_at')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const setupScore = [
    schoolCount > 0,
    academicYearCount > 0,
    termCount > 0,
    classCount > 0,
    sectionCount > 0,
    subjectCount > 0,
    activeRoleCount > 0,
    permissionCount > 0,
  ].filter(Boolean).length

  const risks: string[] = []
  if (academicYearCount === 0) risks.push('Aucune année scolaire active n’est configurée.')
  if (classCount === 0) risks.push('Aucune classe n’est disponible pour les inscriptions et la pédagogie.')
  if (sectionCount === 0) risks.push('Aucune section n’est encore rattachée aux classes.')
  if (subjectCount === 0) risks.push('Le catalogue de matières est vide.')
  if (permissionCount === 0) risks.push('Le catalogue de permissions n’est pas encore chargé.')

  return {
    schoolCount,
    academicYearCount,
    termCount,
    classCount,
    sectionCount,
    subjectCount,
    activeRoleCount,
    permissionCatalogReady: permissionCount > 0,
    setupScore,
    currentSchool: (latestSchool.data as never) || context.school,
    currentAcademicYear: (currentAcademicYear.data as never) || null,
    latestAuditEvents: (latestAuditEvents.data || []) as Angelcare360AuditRecord[],
    risks,
  }
}

export async function getAngelcare360SchoolSettings(schoolId?: string | null) {
  const context = await getAngelcare360AccessContext({ schoolId: schoolId || undefined })
  if (!context?.school) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_school_settings')
    .select('*')
    .eq('school_id', context.school.id)
    .maybeSingle()

  return data ?? null
}

export async function listAngelcare360Sections(schoolId?: string | null, academicYearId?: string | null) {
  const resolvedSchoolId = await getActiveSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_sections')
    .select('id, school_id, academic_year_id, class_id, section_code, name, capacity, room, status, created_at, updated_at')
    .eq('school_id', resolvedSchoolId)
    .order('name', { ascending: true })

  if (academicYearId) query = query.eq('academic_year_id', academicYearId)

  const { data } = await query
  return data ?? []
}

export async function listAngelcare360Terms(schoolId?: string | null, academicYearId?: string | null) {
  const resolvedSchoolId = await getActiveSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_terms')
    .select('id, school_id, academic_year_id, term_code, label, starts_on, ends_on, order_index, status, metadata_json, created_at, updated_at')
    .eq('school_id', resolvedSchoolId)
    .order('order_index', { ascending: true })

  if (academicYearId) query = query.eq('academic_year_id', academicYearId)

  const { data } = await query
  return data ?? []
}

export async function listAngelcare360Subjects(schoolId?: string | null) {
  const resolvedSchoolId = await getActiveSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  const [{ data: subjects }, { data: links }] = await Promise.all([
    supabase
      .from('angelcare360_subjects')
      .select('id, school_id, subject_code, name, short_name, department, credit_hours, status, created_at, updated_at')
      .eq('school_id', resolvedSchoolId)
      .order('name', { ascending: true }),
    supabase
      .from('angelcare360_class_subjects')
      .select('subject_id, class_id')
      .eq('school_id', resolvedSchoolId),
  ])

  const linkedClasses = new Map<string, string[]>()
  for (const link of links || []) {
    const current = linkedClasses.get(link.subject_id) || []
    current.push(link.class_id)
    linkedClasses.set(link.subject_id, current)
  }

  return (subjects || []).map((subject) => ({
    ...subject,
    linked_class_ids: linkedClasses.get(subject.id) || [],
  }))
}

export async function listAngelcare360TeacherAssignments(schoolId?: string | null, academicYearId?: string | null) {
  const resolvedSchoolId = await getActiveSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_teacher_assignments')
    .select(`
      id,
      school_id,
      academic_year_id,
      staff_id,
      class_id,
      section_id,
      subject_id,
      assignment_role,
      weekly_hours,
      assigned_from,
      assigned_to,
      status,
      created_at,
      updated_at,
      staff:angelcare360_staff(id, full_name, staff_code),
      class:angelcare360_classes(id, name, class_code),
      section:angelcare360_sections(id, name, section_code),
      subject:angelcare360_subjects(id, name, subject_code)
    `)
    .eq('school_id', resolvedSchoolId)
    .order('created_at', { ascending: false })

  if (academicYearId) query = query.eq('academic_year_id', academicYearId)

  const { data } = await query
  return data ?? []
}

export async function listAngelcare360AdminAuditEvents(filters?: Record<string, unknown>) {
  const parsed = angelcare360AuditFilterSchema.safeParse(filters || {})
  const data = parsed.success ? parsed.data : null
  const context = await getAngelcare360AccessContext()
  if (!context?.school) return []

  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school.id)
    .order('created_at', { ascending: false })
    .limit(300)

  if (data?.search) {
    query = query.or(
      `module.ilike.%${data.search}%,action.ilike.%${data.search}%,entity_type.ilike.%${data.search}%,request_id.ilike.%${data.search}%`,
    )
  }
  if (data?.module) query = query.eq('module', data.module)
  if (data?.action) query = query.eq('action', data.action)
  if (data?.severity) query = query.eq('severity', data.severity)
  if (data?.entityType) query = query.eq('entity_type', data.entityType)
  if (data?.actorRole) query = query.eq('actor_role', data.actorRole)
  if (data?.from) query = query.gte('created_at', data.from)
  if (data?.to) query = query.lte('created_at', data.to)

  const { data: rows } = await query
  return (rows || []) as Angelcare360AuditRecord[]
}

export async function getAngelcare360AuditEventDetail(eventId: string) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school.id)
    .eq('id', eventId)
    .maybeSingle()

  return (data as Angelcare360AuditRecord | null) ?? null
}

export async function getAngelcare360PermissionMatrix(schoolId?: string | null) {
  const resolvedSchoolId = await getActiveSchoolId(schoolId)
  if (!resolvedSchoolId) return { roles: [], permissions: [], rolePermissions: [] }
  const supabase = await createClient()
  const [rolesResponse, permissionsResponse, rolePermissionsResponse] = await Promise.all([
    supabase
      .from('angelcare360_roles')
      .select('id, school_id, role_key, label, description, scope, is_system_locked, status, created_at, updated_at')
      .eq('school_id', resolvedSchoolId)
      .order('label', { ascending: true }),
    supabase
      .from('angelcare360_permissions')
      .select('permission_key, domain_key, action_key, label, description, risk_level, status, created_at, updated_at')
      .order('domain_key', { ascending: true })
      .order('action_key', { ascending: true }),
    supabase
      .from('angelcare360_role_permissions')
      .select('id, role_id, permission_key, effect, created_at, metadata_json')
      .in(
        'role_id',
        (await supabase
          .from('angelcare360_roles')
          .select('id')
          .eq('school_id', resolvedSchoolId))
          .data?.map((row) => row.id) || [],
      ),
  ])

  return {
    roles: (rolesResponse.data || []) as Array<Pick<Angelcare360RoleRecord, 'id' | 'role_key' | 'label' | 'scope' | 'school_id'> & { description?: string | null; is_system_locked?: boolean; status?: string }>,
    permissions: (permissionsResponse.data || []) as Angelcare360PermissionRecord[],
    rolePermissions: rolePermissionsResponse.data || [],
  }
}

export async function createAngelcare360School(input: unknown): Promise<MutationOutcome<{ id: string }>> {
  const parsed = angelcare360SchoolAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload établissement invalide.' }

  await requireAngelcare360Permission('parametres.create')
  const supabase = await createClient()
  const data = parsed.data
  const payload = {
    school_code: data.schoolCode,
    name: data.name,
    school_type: data.schoolType,
    city: data.city || null,
    country: data.country || 'Maroc',
    address: data.address || null,
    phone: data.phone || null,
    email: data.email || null,
    language: data.language || 'fr',
    currency: data.currency || 'MAD',
    timezone: data.timezone || 'Africa/Casablanca',
    status: data.status,
    metadata_json: {
      target_capacity: data.targetCapacity ?? null,
      contact_principal: data.contactPrincipal || null,
      notes: data.notes || null,
    },
  }

  const { data: record, error } = await supabase.from('angelcare360_schools').insert(payload).select('id').single()
  if (error) return { ok: false, error: error.message }

  await supabase.from('angelcare360_school_settings').upsert({
    school_id: record.id,
    default_language: data.language || 'fr',
    default_currency: data.currency || 'MAD',
    default_timezone: data.timezone || 'Africa/Casablanca',
    status: data.status === 'archived' ? 'inactive' : 'active',
    metadata_json: { source: 'phase3_admin', contact_principal: data.contactPrincipal || null },
  })

  const auditResult = await recordAngelcare360AuditEventServer({
    module: 'parametres',
    action: 'school.created',
    category: 'settings',
    severity: 'notice',
    schoolId: record.id,
    entityType: 'school',
    entityId: record.id,
    metadata: { schoolCode: data.schoolCode, schoolType: data.schoolType },
  })

  if (!auditResult.ok) return { ok: false, error: auditResult.error || 'École créée, mais audit impossible.' }

  return { ok: true, record: { id: record.id } }
}

export async function updateAngelcare360School(input: unknown): Promise<MutationOutcome<{ id: string }>> {
  const parsed = angelcare360SchoolAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload établissement invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de l’établissement est requis.' }
  await requireAngelcare360Permission('parametres.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_schools').select('*').eq('id', parsed.data.id).maybeSingle()
  const data = parsed.data
  const { error } = await supabase
    .from('angelcare360_schools')
    .update({
      school_code: data.schoolCode,
      name: data.name,
      school_type: data.schoolType,
      city: data.city || null,
      country: data.country || null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      language: data.language || 'fr',
      currency: data.currency || 'MAD',
      timezone: data.timezone || 'Africa/Casablanca',
      status: data.status,
      metadata_json: {
        target_capacity: data.targetCapacity ?? null,
        contact_principal: data.contactPrincipal || null,
        notes: data.notes || null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)

  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    module: 'parametres',
    action: 'school.updated',
    category: 'settings',
    severity: 'info',
    schoolId: parsed.data.id,
    entityType: 'school',
    entityId: parsed.data.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: data as unknown as Record<string, unknown>,
  })

  if (!auditResult.ok) return { ok: false, error: auditResult.error || 'École mise à jour, mais audit impossible.' }
  return { ok: true, record: { id: parsed.data.id } }
}

export async function changeAngelcare360SchoolStatus(input: { id: string; status: 'active' | 'inactive' | 'suspended' | 'archived' }) {
  await requireAngelcare360Permission('parametres.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_schools').select('*').eq('id', input.id).maybeSingle()
  const { error } = await supabase
    .from('angelcare360_schools')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.id)
  if (error) return { ok: false, error: error.message }
  const auditResult = await recordAngelcare360AuditEventServer({
    module: 'parametres',
    action: 'school.status_changed',
    category: 'settings',
    severity: 'warning',
    schoolId: input.id,
    entityType: 'school',
    entityId: input.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: { status: input.status },
  })
  if (!auditResult.ok) return { ok: false, error: auditResult.error || 'Statut mis à jour, mais audit impossible.' }
  return { ok: true, record: { id: input.id } }
}

export async function createAngelcare360AcademicYear(input: unknown) {
  const parsed = angelcare360AcademicYearAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload année scolaire invalide.' }
  await requireAngelcare360Permission('annees_scolaires.create')
  const supabase = await createClient()
  const { data: record, error } = await supabase
    .from('angelcare360_academic_years')
    .insert({
      school_id: parsed.data.schoolId,
      year_code: parsed.data.yearCode,
      label: parsed.data.label,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
      is_current: Boolean(parsed.data.isCurrent),
      status: parsed.data.status,
      metadata_json: {},
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  if (parsed.data.isCurrent || parsed.data.status === 'active') {
    await supabase
      .from('angelcare360_academic_years')
      .update({ is_current: false })
      .eq('school_id', parsed.data.schoolId)
      .neq('id', record.id)
  }

  await recordAngelcare360AuditEventServer({
    module: 'annees_scolaires',
    action: 'academic_year.created',
    category: 'settings',
    severity: 'notice',
    schoolId: parsed.data.schoolId,
    entityType: 'academic_year',
    entityId: record.id,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })

  return { ok: true, record: { id: record.id } }
}

export async function updateAngelcare360AcademicYear(input: unknown) {
  const parsed = angelcare360AcademicYearAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload année scolaire invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de l’année scolaire est requis.' }
  await requireAngelcare360Permission('annees_scolaires.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_academic_years').select('*').eq('id', parsed.data.id).maybeSingle()
  const { error } = await supabase
    .from('angelcare360_academic_years')
    .update({
      year_code: parsed.data.yearCode,
      label: parsed.data.label,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
      is_current: Boolean(parsed.data.isCurrent),
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }

  await recordAngelcare360AuditEventServer({
    module: 'annees_scolaires',
    action: 'academic_year.updated',
    category: 'settings',
    severity: 'info',
    schoolId: parsed.data.schoolId,
    entityType: 'academic_year',
    entityId: parsed.data.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as unknown as Record<string, unknown>,
  })

  return { ok: true, record: { id: parsed.data.id } }
}

export async function setAngelcare360ActiveAcademicYear(input: { schoolId: string; academicYearId: string }) {
  await requireAngelcare360Permission('annees_scolaires.update')
  const supabase = await createClient()
  await supabase
    .from('angelcare360_academic_years')
    .update({ is_current: false, status: 'planned', updated_at: new Date().toISOString() })
    .eq('school_id', input.schoolId)
  const { error } = await supabase
    .from('angelcare360_academic_years')
    .update({ is_current: true, status: 'active', updated_at: new Date().toISOString() })
    .eq('id', input.academicYearId)
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'annees_scolaires',
    action: 'academic_year.activated',
    category: 'settings',
    severity: 'warning',
    schoolId: input.schoolId,
    entityType: 'academic_year',
    entityId: input.academicYearId,
    afterData: { is_current: true, status: 'active' },
  })
  return { ok: true, record: { id: input.academicYearId } }
}

export async function createAngelcare360Term(input: unknown) {
  const parsed = angelcare360TermAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload période invalide.' }
  await requireAngelcare360Permission('annees_scolaires.update')
  const supabase = await createClient()
  const { data: record, error } = await supabase
    .from('angelcare360_terms')
    .insert({
      school_id: parsed.data.schoolId,
      academic_year_id: parsed.data.academicYearId,
      term_code: parsed.data.termCode,
      label: parsed.data.label,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
      order_index: parsed.data.orderIndex,
      status: parsed.data.status,
      metadata_json: { term_type: parsed.data.termType || null },
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'annees_scolaires',
    action: 'term.created',
    category: 'settings',
    severity: 'notice',
    schoolId: parsed.data.schoolId,
    entityType: 'term',
    entityId: record.id,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: record.id } }
}

export async function updateAngelcare360Term(input: unknown) {
  const parsed = angelcare360TermAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload période invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de la période est requis.' }
  await requireAngelcare360Permission('annees_scolaires.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_terms').select('*').eq('id', parsed.data.id).maybeSingle()
  const { error } = await supabase
    .from('angelcare360_terms')
    .update({
      term_code: parsed.data.termCode,
      label: parsed.data.label,
      starts_on: parsed.data.startsOn,
      ends_on: parsed.data.endsOn,
      order_index: parsed.data.orderIndex,
      status: parsed.data.status,
      metadata_json: { term_type: parsed.data.termType || null },
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'annees_scolaires',
    action: 'term.updated',
    category: 'settings',
    severity: 'info',
    schoolId: parsed.data.schoolId,
    entityType: 'term',
    entityId: parsed.data.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: parsed.data.id } }
}

export async function createAngelcare360Class(input: unknown) {
  const parsed = angelcare360ClassAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload classe invalide.' }
  await requireAngelcare360Permission('classes.create')
  const supabase = await createClient()
  const { data: record, error } = await supabase
    .from('angelcare360_classes')
    .insert({
      school_id: parsed.data.schoolId,
      academic_year_id: parsed.data.academicYearId,
      class_code: parsed.data.classCode,
      name: parsed.data.name,
      level: parsed.data.level,
      capacity: parsed.data.capacity,
      order_index: parsed.data.orderIndex,
      homeroom_staff_id: parsed.data.homeroomStaffId || null,
      status: parsed.data.status,
      metadata_json: { description: parsed.data.description || null },
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'classes',
    action: 'class.created',
    category: 'settings',
    severity: 'notice',
    schoolId: parsed.data.schoolId,
    entityType: 'class',
    entityId: record.id,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: record.id } }
}

export async function updateAngelcare360Class(input: unknown) {
  const parsed = angelcare360ClassAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload classe invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de la classe est requis.' }
  await requireAngelcare360Permission('classes.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_classes').select('*').eq('id', parsed.data.id).maybeSingle()
  const { error } = await supabase
    .from('angelcare360_classes')
    .update({
      class_code: parsed.data.classCode,
      name: parsed.data.name,
      level: parsed.data.level,
      capacity: parsed.data.capacity,
      order_index: parsed.data.orderIndex,
      homeroom_staff_id: parsed.data.homeroomStaffId || null,
      status: parsed.data.status,
      metadata_json: { description: parsed.data.description || null },
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'classes',
    action: 'class.updated',
    category: 'settings',
    severity: 'info',
    schoolId: parsed.data.schoolId,
    entityType: 'class',
    entityId: parsed.data.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: parsed.data.id } }
}

export async function createAngelcare360Section(input: unknown) {
  const parsed = angelcare360SectionAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload section invalide.' }
  await requireAngelcare360Permission('classes.create')
  const supabase = await createClient()
  const { data: record, error } = await supabase
    .from('angelcare360_sections')
    .insert({
      school_id: parsed.data.schoolId,
      academic_year_id: parsed.data.academicYearId,
      class_id: parsed.data.classId,
      section_code: parsed.data.sectionCode,
      name: parsed.data.name,
      capacity: parsed.data.capacity,
      room: parsed.data.room || null,
      status: parsed.data.status,
      metadata_json: { main_teacher_id: parsed.data.mainTeacherId || null },
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'classes',
    action: 'section.created',
    category: 'settings',
    severity: 'notice',
    schoolId: parsed.data.schoolId,
    entityType: 'section',
    entityId: record.id,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: record.id } }
}

export async function updateAngelcare360Section(input: unknown) {
  const parsed = angelcare360SectionAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload section invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de la section est requis.' }
  await requireAngelcare360Permission('classes.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_sections').select('*').eq('id', parsed.data.id).maybeSingle()
  const { error } = await supabase
    .from('angelcare360_sections')
    .update({
      section_code: parsed.data.sectionCode,
      name: parsed.data.name,
      capacity: parsed.data.capacity,
      room: parsed.data.room || null,
      status: parsed.data.status,
      metadata_json: { main_teacher_id: parsed.data.mainTeacherId || null },
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'classes',
    action: 'section.updated',
    category: 'settings',
    severity: 'info',
    schoolId: parsed.data.schoolId,
    entityType: 'section',
    entityId: parsed.data.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: parsed.data.id } }
}

export async function createAngelcare360Subject(input: unknown) {
  const parsed = angelcare360SubjectAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload matière invalide.' }
  await requireAngelcare360Permission('matieres.create')
  const supabase = await createClient()
  const { data: record, error } = await supabase
    .from('angelcare360_subjects')
    .insert({
      school_id: parsed.data.schoolId,
      subject_code: parsed.data.subjectCode,
      name: parsed.data.name,
      short_name: parsed.data.shortName || null,
      department: parsed.data.department || null,
      credit_hours: parsed.data.creditHours ?? null,
      status: parsed.data.status,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  await syncSubjectClassLinks(supabase, parsed.data.schoolId, record.id, parsed.data.linkedClassIds)
  await recordAngelcare360AuditEventServer({
    module: 'matieres',
    action: 'subject.created',
    category: 'settings',
    severity: 'notice',
    schoolId: parsed.data.schoolId,
    entityType: 'subject',
    entityId: record.id,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: record.id } }
}

export async function updateAngelcare360Subject(input: unknown) {
  const parsed = angelcare360SubjectAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload matière invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de la matière est requis.' }
  await requireAngelcare360Permission('matieres.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_subjects').select('*').eq('id', parsed.data.id).maybeSingle()
  const { error } = await supabase
    .from('angelcare360_subjects')
    .update({
      subject_code: parsed.data.subjectCode,
      name: parsed.data.name,
      short_name: parsed.data.shortName || null,
      department: parsed.data.department || null,
      credit_hours: parsed.data.creditHours ?? null,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }
  await syncSubjectClassLinks(supabase, parsed.data.schoolId, parsed.data.id, parsed.data.linkedClassIds)
  await recordAngelcare360AuditEventServer({
    module: 'matieres',
    action: 'subject.updated',
    category: 'settings',
    severity: 'info',
    schoolId: parsed.data.schoolId,
    entityType: 'subject',
    entityId: parsed.data.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: parsed.data.id } }
}

async function syncSubjectClassLinks(supabase: DatabaseClient, schoolId: string, subjectId: string, classIds: string[]) {
  await supabase.from('angelcare360_class_subjects').delete().eq('school_id', schoolId).eq('subject_id', subjectId)
  if (classIds.length === 0) return
  const classes = classIds.map((classId) => ({
    school_id: schoolId,
    academic_year_id: null,
    class_id: classId,
    subject_id: subjectId,
    coefficient: 1,
    is_required: true,
    status: 'active',
    metadata_json: { source: 'phase3_admin' },
  }))
  await supabase.from('angelcare360_class_subjects').insert(classes)
}

export async function createAngelcare360TeacherAssignment(input: unknown) {
  const parsed = angelcare360TeacherAssignmentAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload affectation invalide.' }
  await requireAngelcare360Permission('enseignants.assign')
  const supabase = await createClient()
  const { data: record, error } = await supabase
    .from('angelcare360_teacher_assignments')
    .insert({
      school_id: parsed.data.schoolId,
      academic_year_id: parsed.data.academicYearId,
      staff_id: parsed.data.staffId,
      class_id: parsed.data.classId || null,
      section_id: parsed.data.sectionId || null,
      subject_id: parsed.data.subjectId || null,
      assignment_role: parsed.data.assignmentRole,
      weekly_hours: parsed.data.weeklyHours,
      assigned_from: parsed.data.assignedFrom || null,
      assigned_to: parsed.data.assignedTo || null,
      status: parsed.data.status,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'enseignants',
    action: 'teacher_assignment.created',
    category: 'staff',
    severity: 'notice',
    schoolId: parsed.data.schoolId,
    entityType: 'teacher_assignment',
    entityId: record.id,
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: record.id } }
}

export async function updateAngelcare360TeacherAssignment(input: unknown) {
  const parsed = angelcare360TeacherAssignmentAdminSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload affectation invalide.' }
  if (!parsed.data.id) return { ok: false, error: 'L’identifiant de l’affectation est requis.' }
  await requireAngelcare360Permission('enseignants.assign')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_teacher_assignments').select('*').eq('id', parsed.data.id).maybeSingle()
  const { error } = await supabase
    .from('angelcare360_teacher_assignments')
    .update({
      academic_year_id: parsed.data.academicYearId,
      staff_id: parsed.data.staffId,
      class_id: parsed.data.classId || null,
      section_id: parsed.data.sectionId || null,
      subject_id: parsed.data.subjectId || null,
      assignment_role: parsed.data.assignmentRole,
      weekly_hours: parsed.data.weeklyHours,
      assigned_from: parsed.data.assignedFrom || null,
      assigned_to: parsed.data.assignedTo || null,
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, error: error.message }
  await recordAngelcare360AuditEventServer({
    module: 'enseignants',
    action: 'teacher_assignment.updated',
    category: 'staff',
    severity: 'info',
    schoolId: parsed.data.schoolId,
    entityType: 'teacher_assignment',
    entityId: parsed.data.id,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as unknown as Record<string, unknown>,
  })
  return { ok: true, record: { id: parsed.data.id } }
}

export async function updateAngelcare360SchoolSettings(input: unknown) {
  const parsed = angelcare360SchoolSettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload paramètres invalide.' }
  await requireAngelcare360Permission('parametres.update')
  const supabase = await createClient()
  const before = await supabase.from('angelcare360_school_settings').select('*').eq('school_id', parsed.data.schoolId).maybeSingle()
  const { error } = await supabase.from('angelcare360_school_settings').upsert({
    school_id: parsed.data.schoolId,
    default_language: parsed.data.defaultLanguage,
    default_currency: parsed.data.defaultCurrency,
    default_timezone: parsed.data.defaultTimezone,
    academic_year_start_month: parsed.data.academicYearStartMonth,
    week_start_day: parsed.data.weekStartDay,
    grading_scale: parsed.data.gradingScale,
    attendance_grace_minutes: parsed.data.attendanceGraceMinutes,
    allow_parent_portal: parsed.data.allowParentPortal,
    allow_student_portal: parsed.data.allowStudentPortal,
    communication_sender_name: parsed.data.communicationSenderName || null,
    school_year_label_format: parsed.data.schoolYearLabelFormat,
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }

  const auditResult = await recordAngelcare360AuditEventServer({
    module: 'parametres',
    action: 'school_settings.updated',
    category: 'settings',
    severity: 'warning',
    schoolId: parsed.data.schoolId,
    entityType: 'school_settings',
    entityId: before.data?.id || null,
    beforeData: (before.data as Record<string, unknown>) || {},
    afterData: parsed.data as unknown as Record<string, unknown>,
  })

  if (!auditResult.ok) return { ok: false, error: auditResult.error || 'Paramètres enregistrés, mais audit impossible.' }
  return { ok: true, record: { id: before.data?.id || parsed.data.schoolId } }
}

export async function updateAngelcare360RolePermissions(input: unknown) {
  const parsed = angelcare360RolePermissionsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.errors[0]?.message || 'Payload RBAC invalide.' }
  await requireAngelcare360Permission('securite.configure')
  const supabase = await createClient()

  const { data: role } = await supabase
    .from('angelcare360_roles')
    .select('id, role_key, label, scope, is_system_locked, status')
    .eq('id', parsed.data.roleId)
    .maybeSingle()

  if (!role) return { ok: false, error: 'Le rôle ciblé est introuvable.' }
  if (role.is_system_locked) return { ok: false, error: 'Ce rôle système est verrouillé et ne peut pas être modifié.' }

  const permissionRows = parsed.data.permissionKeys.map((permissionKey) => ({
    role_id: parsed.data.roleId,
    permission_key: permissionKey,
    effect: 'allow',
    metadata_json: { source: 'phase3_admin' },
  }))

  const { error: deleteError } = await supabase.from('angelcare360_role_permissions').delete().eq('role_id', parsed.data.roleId)
  if (deleteError) return { ok: false, error: deleteError.message }

  if (permissionRows.length > 0) {
    const { error: insertError } = await supabase.from('angelcare360_role_permissions').insert(permissionRows)
    if (insertError) return { ok: false, error: insertError.message }
  }

  const auditResult = await recordAngelcare360AuditEventServer({
    module: 'securite',
    action: 'role_permissions.updated',
    category: 'rbac',
    severity: 'critical',
    schoolId: parsed.data.schoolId,
    entityType: 'role',
    entityId: parsed.data.roleId,
    afterData: { permissionKeys: parsed.data.permissionKeys, roleKey: role.role_key },
  })

  if (!auditResult.ok) return { ok: false, error: auditResult.error || 'Permissions enregistrées, mais audit impossible.' }
  return { ok: true, record: { id: parsed.data.roleId } }
}

export async function getAngelcare360AdministrationRolesAndPermissions() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) return null
  const { roles, permissions, rolePermissions } = await getAngelcare360PermissionMatrix(context.school.id)
  return {
    roles,
    permissions,
    rolePermissions,
  }
}

export async function getAngelcare360AdministrationContext() {
  const context = await getAngelcare360AccessContext()
  if (!context) return null
  const overview = await getAngelcare360AdministrationOverview({ schoolId: context.school?.id || null })
  return { context, overview }
}
