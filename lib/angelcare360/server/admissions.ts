import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from './context'
import { recordAngelcare360AuditEventServer } from './audit'
import {
  angelcare360AdmissionApplicationCreateSchema,
  angelcare360AdmissionApplicationStatusChangeSchema,
  angelcare360AdmissionApplicationUpdateSchema,
  angelcare360AdmissionConversionSchema,
  angelcare360AdmissionDecisionSchema,
  angelcare360AdmissionDocumentSubmissionUpdateSchema,
  angelcare360AdmissionLeadCreateSchema,
  angelcare360AdmissionLeadStatusChangeSchema,
  angelcare360AdmissionLeadUpdateSchema,
  angelcare360AdmissionNextActionSchema,
  angelcare360AdmissionRequiredDocumentCreateSchema,
  angelcare360AdmissionRequiredDocumentUpdateSchema,
  angelcare360AdmissionsAuditFilterSchema,
  type Angelcare360ValidationResult,
} from '@/lib/angelcare360/validation'
import { listAngelcare360AcademicYears, listAngelcare360Classes, listAngelcare360Parents, listAngelcare360Staff } from './queries'
import { listAngelcare360Sections } from './administration'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type {
  Angelcare360AdmissionApplicationListRecord,
  Angelcare360AdmissionApplicationRecord,
  Angelcare360AdmissionConversionChecklistItem,
  Angelcare360AdmissionDocumentSubmissionListRecord,
  Angelcare360AdmissionDocumentSubmissionRecord,
  Angelcare360AdmissionLeadListRecord,
  Angelcare360AdmissionLeadRecord,
  Angelcare360AdmissionRequiredDocumentListRecord,
  Angelcare360AdmissionRequiredDocumentRecord,
  Angelcare360AdmissionsAuditFilter,
  Angelcare360AdmissionsOverviewRecord,
  Angelcare360AdmissionsPipelineCard,
} from '@/types/angelcare360/admissions'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type MutableRecord = Record<string, unknown>

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asOptionalString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

function buildDetailHref(path: string, id: string) {
  return `${path}/${id}`
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value && String(value).trim()))))
}

function textOfName(record: MutableRecord | null | undefined) {
  if (!record) return ''
  return asString(record.full_name || [record.first_name, record.last_name].filter(Boolean).join(' ').trim() || record.name)
}

function toDateString(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return value.slice(0, 10)
}

function toIsoOrNull(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function normalizedMetadata(row: MutableRecord) {
  return (row.metadata_json && typeof row.metadata_json === 'object' ? row.metadata_json : {}) as MutableRecord
}

function validationErrorMessage<T>(result: Angelcare360ValidationResult<T>, fallback: string) {
  if (!result.success && 'errors' in result) {
    return result.errors[0]?.message || fallback
  }
  return fallback
}

function getLeadDisplayName(row: MutableRecord) {
  const metadata = normalizedMetadata(row)
  const childFirst = asOptionalString(row.child_first_name || metadata.child_first_name)
  const childLast = asOptionalString(row.child_last_name || metadata.child_last_name)
  const full = childFirst || childLast ? [childFirst, childLast].filter(Boolean).join(' ') : asString(row.student_full_name)
  return full || asString(row.student_full_name)
}

function getParentDisplayName(row: MutableRecord) {
  const metadata = normalizedMetadata(row)
  const first = asOptionalString(row.parent_first_name || metadata.parent_first_name)
  const last = asOptionalString(row.parent_last_name || metadata.parent_last_name)
  const full = [first, last].filter(Boolean).join(' ').trim()
  return full || asString(row.parent_name)
}

async function withContext(permissionKey: string, schoolId?: string | null) {
  return requireAngelcare360Permission(permissionKey, { schoolId })
}

async function countRows(client: SupabaseClient, table: string, schoolId?: string | null, filters?: Array<[string, 'eq' | 'gte' | 'lte' | 'in', unknown]>) {
  let query = client.from(table).select('id', { count: 'exact', head: true })
  if (schoolId) query = query.eq('school_id', schoolId)
  for (const [column, operator, value] of filters || []) {
    if (operator === 'eq') query = query.eq(column, value as never)
    if (operator === 'gte') query = query.gte(column, value as never)
    if (operator === 'lte') query = query.lte(column, value as never)
    if (operator === 'in' && Array.isArray(value)) query = query.in(column, value as never[])
  }
  const { count } = await query
  return count ?? 0
}

async function countMissingDocuments(client: SupabaseClient, schoolId: string, applicationId: string) {
  const [requiredDocuments, submissions] = await Promise.all([
    client
      .from('angelcare360_admission_required_documents')
      .select('id, is_required, status')
      .eq('school_id', schoolId)
      .eq('status', 'active'),
    client
      .from('angelcare360_admission_document_submissions')
      .select('required_document_id, verification_status, status')
      .eq('school_id', schoolId)
      .eq('application_id', applicationId)
      .eq('status', 'active'),
  ])

  const submissionMap = new Map<string, MutableRecord>()
  for (const submission of submissions.data || []) {
    submissionMap.set(String((submission as MutableRecord).required_document_id), submission as MutableRecord)
  }

  let missing = 0
  for (const requiredDocument of requiredDocuments.data || []) {
    const item = requiredDocument as MutableRecord
    const submission = submissionMap.get(String(item.id))
    if (!submission) {
      missing += 1
      continue
    }
    if (String(submission.verification_status) !== 'complete') {
      missing += 1
    }
  }

  return missing
}

async function getLeadAuditTrail(client: SupabaseClient, schoolId: string, leadId: string) {
  const { data } = await client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', schoolId)
    .eq('entity_type', 'admission_lead')
    .eq('entity_id', leadId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data || []) as Angelcare360AuditRecord[]
}

async function getApplicationAuditTrail(client: SupabaseClient, schoolId: string, applicationId: string) {
  const { data } = await client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', schoolId)
    .eq('entity_type', 'admission_application')
    .eq('entity_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data || []) as Angelcare360AuditRecord[]
}

async function listLeadRows(client: SupabaseClient, schoolId: string, academicYearId?: string | null) {
  let query = client
    .from('angelcare360_admission_leads')
    .select(`
      id,
      school_id,
      lead_code,
      parent_name,
      parent_phone,
      parent_email,
      student_full_name,
      child_first_name,
      child_last_name,
      child_date_of_birth,
      relationship_type,
      desired_level,
      source_channel,
      assigned_staff_id,
      contacted_at,
      converted_at,
      next_action,
      next_action_at,
      responsible_staff_id,
      priority,
      notes,
      status,
      metadata_json,
      created_at,
      updated_at,
      responsible:angelcare360_staff(id, staff_code, full_name)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(500)

  const [leadsResponse, applicationsResponse, submissionsResponse] = await Promise.all([
    query,
    client
      .from('angelcare360_admission_applications')
      .select('id, lead_id, converted_student_id, converted_parent_id, converted_at, status')
      .eq('school_id', schoolId),
    client
      .from('angelcare360_admission_document_submissions')
      .select('application_id, required_document_id, verification_status, status')
      .eq('school_id', schoolId),
  ])

  const applicationsByLead = new Map<string, number>()
  const applicationIdsByLead = new Map<string, string[]>()
  for (const application of applicationsResponse.data || []) {
    const item = application as MutableRecord
    const leadId = asString(item.lead_id)
    if (!leadId) continue
    applicationsByLead.set(leadId, (applicationsByLead.get(leadId) || 0) + 1)
    const current = applicationIdsByLead.get(leadId) || []
    current.push(String(item.id))
    applicationIdsByLead.set(leadId, current)
  }

  const submissionsByApplication = new Map<string, MutableRecord[]>()
  for (const submission of submissionsResponse.data || []) {
    const item = submission as MutableRecord
    const current = submissionsByApplication.get(asString(item.application_id)) || []
    current.push(item)
    submissionsByApplication.set(asString(item.application_id), current)
  }

  return ((leadsResponse.data || []) as MutableRecord[]).map((lead) => {
    const assigned = lead.responsible as MutableRecord | undefined
    if (academicYearId) {
      const leadYear = asString(normalizedMetadata(lead).academic_year_id)
      const applicationYearMatch = (applicationIdsByLead.get(String(lead.id)) || []).some((applicationId) => {
        const matchingApplication = (applicationsResponse.data || []).find((application) => String((application as MutableRecord).id) === applicationId) as MutableRecord | undefined
        return asString(matchingApplication?.academic_year_id) === academicYearId
      })
      if (leadYear !== academicYearId && !applicationYearMatch) {
        return null
      }
    }
    const appCount = applicationsByLead.get(String(lead.id)) || 0
    const documentCount = (applicationIdsByLead.get(String(lead.id)) || []).reduce((count, applicationId) => count + (submissionsByApplication.get(applicationId)?.length || 0), 0)
    const missingDocumentCount = (applicationIdsByLead.get(String(lead.id)) || []).reduce((count, applicationId) => {
      const submissions = submissionsByApplication.get(applicationId) || []
      return count + submissions.filter((submission) => String(submission.verification_status) !== 'complete').length
    }, 0)
    return {
      ...lead,
      assigned_staff_name: assigned ? textOfName(assigned) : null,
      assigned_staff_code: assigned ? asString(assigned.staff_code) : null,
      application_count: appCount,
      document_count: documentCount,
      missing_document_count: missingDocumentCount,
      detail_href: buildDetailHref('/angelcare-360-command-center/admissions/demandes', String(lead.id)),
    }
  }).filter(Boolean) as Angelcare360AdmissionLeadListRecord[]
}

async function listApplicationRows(client: SupabaseClient, schoolId: string, academicYearId?: string | null) {
  let query = client
    .from('angelcare360_admission_applications')
    .select(`
      id,
      school_id,
      application_code,
      lead_id,
      parent_id,
      student_id,
      academic_year_id,
      class_id,
      section_id,
      child_first_name,
      child_last_name,
      child_date_of_birth,
      child_gender,
      child_nationality,
      parent_first_name,
      parent_last_name,
      relationship_type,
      phone,
      email,
      address,
      application_stage,
      application_date,
      decision_date,
      decision_status,
      decision_reason,
      priority,
      next_action,
      next_action_at,
      responsible_staff_id,
      converted_at,
      converted_student_id,
      converted_parent_id,
      converted_enrollment_id,
      status,
      metadata_json,
      created_at,
      updated_at,
      lead:angelcare360_admission_leads(id, lead_code, parent_name, student_full_name, parent_phone, parent_email, child_first_name, child_last_name, status),
      class:angelcare360_classes(id, class_code, name, level),
      section:angelcare360_sections(id, section_code, name)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(500)

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  const [applicationsResponse, submissionsResponse] = await Promise.all([
    query,
    client
      .from('angelcare360_admission_document_submissions')
      .select('application_id, required_document_id, verification_status, status')
      .eq('school_id', schoolId),
  ])

  const submissionsByApplication = new Map<string, MutableRecord[]>()
  for (const submission of submissionsResponse.data || []) {
    const item = submission as MutableRecord
    const current = submissionsByApplication.get(asString(item.application_id)) || []
    current.push(item)
    submissionsByApplication.set(asString(item.application_id), current)
  }

  return ((applicationsResponse.data || []) as MutableRecord[]).map((application) => {
    const metadata = normalizedMetadata(application)
    const lead = application.lead as MutableRecord | undefined
    const classRecord = application.class as MutableRecord | undefined
    const sectionRecord = application.section as MutableRecord | undefined
    const submissions = submissionsByApplication.get(String(application.id)) || []
    const missingDocumentCount = submissions.filter((submission) => String(submission.verification_status) !== 'complete').length
    const readyForConversion = String(application.status) === 'approved' && missingDocumentCount === 0 && !application.converted_at

    return {
      ...application,
      lead_code: lead ? asString(lead.lead_code) : null,
      lead_parent_name: lead ? asString(lead.parent_name) : null,
      lead_student_full_name: lead ? asString(lead.student_full_name) : null,
      class_name: classRecord ? asString(classRecord.name) : null,
      class_code: classRecord ? asString(classRecord.class_code) : null,
      section_name: sectionRecord ? asString(sectionRecord.name) : null,
      section_code: sectionRecord ? asString(sectionRecord.section_code) : null,
      document_count: submissions.length,
      missing_document_count: missingDocumentCount,
      ready_for_conversion: readyForConversion,
      detail_href: buildDetailHref('/angelcare-360-command-center/admissions/dossiers', String(application.id)),
      metadata_json: {
        ...metadata,
        requested_class_code: metadata.requested_class_code || classRecord?.class_code || null,
        requested_section_code: metadata.requested_section_code || sectionRecord?.section_code || null,
      },
    }
  }) as Angelcare360AdmissionApplicationListRecord[]
}

async function listRequiredDocumentRows(client: SupabaseClient, schoolId: string, academicYearId?: string | null) {
  let query = client
    .from('angelcare360_admission_required_documents')
    .select('id, school_id, academic_year_id, document_key, title, description, required_for_stage, sort_order, is_required, status, metadata_json, created_at, updated_at')
    .eq('school_id', schoolId)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  if (academicYearId) {
    query = query.or(`academic_year_id.is.null,academic_year_id.eq.${academicYearId}`)
  }

  const [requiredDocumentsResponse, submissionsResponse] = await Promise.all([
    query,
    client
      .from('angelcare360_admission_document_submissions')
      .select('required_document_id, verification_status, status')
      .eq('school_id', schoolId),
  ])

  const submissionsByDocument = new Map<string, MutableRecord[]>()
  for (const submission of submissionsResponse.data || []) {
    const item = submission as MutableRecord
    const current = submissionsByDocument.get(asString(item.required_document_id)) || []
    current.push(item)
    submissionsByDocument.set(asString(item.required_document_id), current)
  }

  return ((requiredDocumentsResponse.data || []) as MutableRecord[]).map((doc) => {
    const submissions = submissionsByDocument.get(String(doc.id)) || []
    return {
      ...doc,
      submission_count: submissions.length,
      complete_count: submissions.filter((submission) => String(submission.verification_status) === 'complete').length,
      missing_count: submissions.filter((submission) => String(submission.verification_status) !== 'complete').length,
    }
  }) as Angelcare360AdmissionRequiredDocumentListRecord[]
}

async function listSubmissionRows(client: SupabaseClient, schoolId: string, academicYearId?: string | null) {
  let query = client
    .from('angelcare360_admission_document_submissions')
    .select(`
      id,
      school_id,
      application_id,
      required_document_id,
      document_id,
      submitted_by,
      submitted_at,
      verification_status,
      reviewed_by,
      reviewed_at,
      notes,
      status,
      metadata_json,
      created_at,
      updated_at,
      application:angelcare360_admission_applications(id, application_code, academic_year_id, status, converted_at),
      required_document:angelcare360_admission_required_documents(id, document_key, title),
      document:angelcare360_documents(id, title, file_name, document_code)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(500)

  const { data } = await query
  return ((data || []) as MutableRecord[])
    .filter((submission) => !academicYearId || asString((submission.application as MutableRecord | undefined)?.academic_year_id) === academicYearId)
    .map((submission) => ({
      ...submission,
      application_code: asString((submission.application as MutableRecord | undefined)?.application_code),
      required_document_key: asString((submission.required_document as MutableRecord | undefined)?.document_key),
      required_document_title: asString((submission.required_document as MutableRecord | undefined)?.title),
      linked_document_title: asString((submission.document as MutableRecord | undefined)?.title),
      detail_href: buildDetailHref('/angelcare-360-command-center/admissions/dossiers', String(submission.application_id)),
    })) as Angelcare360AdmissionDocumentSubmissionListRecord[]
}

async function listAuditRows(client: SupabaseClient, schoolId: string, filter?: Angelcare360AdmissionsAuditFilter) {
  let query = client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', schoolId)
    .or('module.eq.admissions,entity_type.eq.admission_lead,entity_type.eq.admission_application,entity_type.eq.admission_document')
    .order('created_at', { ascending: false })
    .limit(300)

  if (filter?.search) {
    query = query.or(`action.ilike.%${filter.search}%,entity_type.ilike.%${filter.search}%`)
  }
  if (filter?.module) query = query.eq('module', filter.module)
  if (filter?.action) query = query.eq('action', filter.action)
  if (filter?.severity) query = query.eq('severity', filter.severity)
  if (filter?.entityType) query = query.eq('entity_type', filter.entityType)
  if (filter?.actorRole) query = query.eq('actor_role', filter.actorRole)
  if (filter?.from) query = query.gte('created_at', filter.from)
  if (filter?.to) query = query.lte('created_at', filter.to)

  const { data } = await query
  return (data || []) as Angelcare360AuditRecord[]
}

export async function getAngelcare360AdmissionsOverview(options?: { schoolId?: string | null }) {
  const context = await getAngelcare360AccessContext({ schoolId: options?.schoolId || undefined })
  if (!context?.school) return null

  const client = await createClient()
  const schoolId = context.school.id
  const academicYearId = context.academicYear?.id || null

  const [
    schoolCount,
    leadCount,
    newLeadCount,
    openApplicationCount,
    missingDocumentRequirementCount,
    availableClassCount,
    availableSectionCount,
    acceptedCount,
    convertedCount,
    archivedOrRefusedCount,
    _duplicateRiskCount,
    latestAuditEvents,
    leads,
    applications,
    classes,
  ] = await Promise.all([
    countRows(client, 'angelcare360_schools'),
    countRows(client, 'angelcare360_admission_leads', schoolId),
    countRows(client, 'angelcare360_admission_leads', schoolId, [['status', 'eq', 'new']]),
    countRows(client, 'angelcare360_admission_applications', schoolId, [['status', 'in', ['open', 'in_review', 'approved', 'waitlisted']]]),
    countRows(client, 'angelcare360_admission_required_documents', schoolId, [['status', 'eq', 'active']]),
    countRows(client, 'angelcare360_classes', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_sections', schoolId, academicYearId ? [['academic_year_id', 'eq', academicYearId]] : undefined),
    countRows(client, 'angelcare360_admission_applications', schoolId, [['status', 'eq', 'approved']]),
    countRows(client, 'angelcare360_admission_applications', schoolId, [['status', 'eq', 'converted']]),
    countRows(client, 'angelcare360_admission_applications', schoolId, [['status', 'in', ['rejected', 'archived']]]),
    0,
    listAuditRows(client, schoolId, { module: 'admissions' }),
    listLeadRows(client, schoolId, academicYearId),
    listApplicationRows(client, schoolId, academicYearId),
    listAngelcare360Classes(schoolId, academicYearId),
  ])

  const activeSchoolName = context.school.name
  const activeAcademicYearLabel = context.academicYear?.label || null
  const missingDocumentApplicationCount = applications.filter((application) => (application.missing_document_count || 0) > 0).length
  const interviewReadyCount = applications.filter((application) => String(application.status) === 'approved' && Boolean(application.next_action_at)).length
  const conversionReadyCount = applications.filter((application) => Boolean(application.ready_for_conversion)).length
  const duplicateLeadSignatures = new Map<string, number>()
  for (const lead of leads) {
    const signature = [
      String(lead.parent_phone || '').trim().toLowerCase(),
      String(lead.parent_email || '').trim().toLowerCase(),
      String(lead.student_full_name || '').trim().toLowerCase(),
      String(lead.child_date_of_birth || '').trim().slice(0, 10),
    ]
      .filter(Boolean)
      .join('::')
    if (!signature) continue
    duplicateLeadSignatures.set(signature, (duplicateLeadSignatures.get(signature) || 0) + 1)
  }
  const duplicateRiskCount = Array.from(duplicateLeadSignatures.values()).reduce((count, value) => count + Math.max(0, value - 1), 0)

  const risks: string[] = []
  if (!academicYearId) risks.push('Aucune année scolaire active n’est disponible pour les admissions.')
  if (availableClassCount === 0) risks.push('Aucune classe active n’est configurée.')
  if (availableSectionCount === 0) risks.push('Aucune section active n’est configurée.')
  if (missingDocumentRequirementCount === 0) risks.push('Aucun document requis n’est configuré.')
  if (missingDocumentApplicationCount > 0) risks.push(`${missingDocumentApplicationCount} dossier(s) ont encore des documents manquants.`)
  if (conversionReadyCount > 0) risks.push(`${conversionReadyCount} dossier(s) sont prêts à être convertis.`)

  return {
    schoolCount,
    activeSchoolName,
    activeAcademicYearLabel,
    leadCount,
    newLeadCount,
    openApplicationCount,
    missingDocumentApplicationCount,
    interviewReadyCount,
    acceptedCount,
    conversionReadyCount,
    convertedCount,
    archivedOrRefusedCount,
    availableClassCount,
    availableSectionCount,
    missingDocumentRequirementCount,
    duplicateRiskCount,
    latestAuditEvents,
    risks,
    setupReadiness: {
      schoolReady: schoolCount > 0,
      academicYearReady: Boolean(academicYearId),
      classReady: availableClassCount > 0,
      documentReady: missingDocumentRequirementCount > 0,
      duplicateScanReady: true,
    },
  } as Angelcare360AdmissionsOverviewRecord
}

export async function listAngelcare360AdmissionLeads(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await withContext('admissions.view', options?.schoolId || undefined)
  const client = await createClient()
  return listLeadRows(client, context.school!.id, options?.academicYearId || context.academicYear?.id || null)
}

export async function getAngelcare360AdmissionLeadById(id: string) {
  const context = await withContext('admissions.view')
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_admission_leads')
    .select(`
      id,
      school_id,
      lead_code,
      parent_name,
      parent_phone,
      parent_email,
      student_full_name,
      child_first_name,
      child_last_name,
      child_date_of_birth,
      relationship_type,
      desired_level,
      source_channel,
      assigned_staff_id,
      contacted_at,
      converted_at,
      next_action,
      next_action_at,
      responsible_staff_id,
      priority,
      notes,
      status,
      metadata_json,
      created_at,
      updated_at,
      responsible:angelcare360_staff(id, staff_code, full_name)
    `)
    .eq('school_id', context.school!.id)
    .eq('id', id)
    .maybeSingle()

  if (!data) return null

  const applications = await client
    .from('angelcare360_admission_applications')
    .select('id, application_code, status, application_stage, academic_year_id, class_id, section_id, converted_at, converted_student_id, converted_parent_id, converted_enrollment_id, decision_status, decision_reason, priority, next_action, next_action_at, created_at, updated_at')
    .eq('school_id', context.school!.id)
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  const auditEvents = await getLeadAuditTrail(client, context.school!.id, id)

  return {
    ...(data as MutableRecord),
    assigned_staff_name: data.responsible ? textOfName(data.responsible as unknown as MutableRecord) : null,
    applications: applications.data || [],
    latest_audit_events: auditEvents,
  } as MutableRecord
}

export async function createAngelcare360AdmissionLead(input: unknown) {
  const parsed = angelcare360AdmissionLeadCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Payload demande invalide.') }

  const context = await requireAngelcare360Permission('admissions.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    lead_code: parsed.data.leadCode,
    parent_name: parsed.data.parentName,
    parent_phone: parsed.data.parentPhone || null,
    parent_email: parsed.data.parentEmail || null,
    student_full_name: parsed.data.studentFullName,
    child_first_name: parsed.data.childFirstName || null,
    child_last_name: parsed.data.childLastName || null,
    child_date_of_birth: toDateString(parsed.data.childDateOfBirth),
    relationship_type: parsed.data.relationshipType || null,
    desired_level: parsed.data.desiredLevel || null,
    source_channel: parsed.data.sourceChannel || null,
    assigned_staff_id: parsed.data.assignedStaffId || null,
    contacted_at: parsed.data.status === 'contacted' ? new Date().toISOString() : null,
    converted_at: null,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {
      priority: parsed.data.priority || 'normal',
      next_action: parsed.data.nextAction || null,
      next_action_at: parsed.data.nextActionAt || null,
      responsible_staff_id: parsed.data.responsibleStaffId || null,
      notes: parsed.data.notes || null,
      source_channel: parsed.data.sourceChannel || null,
      relationship_type: parsed.data.relationshipType || null,
    },
    priority: parsed.data.priority || 'normal',
    next_action: parsed.data.nextAction || null,
    next_action_at: toIsoOrNull(parsed.data.nextActionAt),
    responsible_staff_id: parsed.data.responsibleStaffId || null,
    notes: parsed.data.notes || null,
  }

  const { data, error } = await client.from('angelcare360_admission_leads').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: 'admission_lead.created',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: 'admission_lead',
    entityId: String(data.id),
    severity: 'info',
    afterData: data as MutableRecord,
  })

  return { ok: true, record: data }
}

export async function updateAngelcare360AdmissionLead(input: unknown) {
  const parsed = angelcare360AdmissionLeadUpdateSchema.safeParse(input)
  if (!parsed.success || !parsed.data.id) return { ok: false, error: validationErrorMessage(parsed, 'Payload demande invalide.') }

  const context = await requireAngelcare360Permission('admissions.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_admission_leads').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Demande introuvable.' }

  const { data, error } = await client
    .from('angelcare360_admission_leads')
    .update({
      lead_code: parsed.data.leadCode,
      parent_name: parsed.data.parentName,
      parent_phone: parsed.data.parentPhone || null,
      parent_email: parsed.data.parentEmail || null,
      student_full_name: parsed.data.studentFullName,
      child_first_name: parsed.data.childFirstName || null,
      child_last_name: parsed.data.childLastName || null,
      child_date_of_birth: toDateString(parsed.data.childDateOfBirth),
      relationship_type: parsed.data.relationshipType || null,
      desired_level: parsed.data.desiredLevel || null,
      source_channel: parsed.data.sourceChannel || null,
      assigned_staff_id: parsed.data.assignedStaffId || null,
      contacted_at: parsed.data.status === 'contacted' ? (before.data as MutableRecord).contacted_at || new Date().toISOString() : (before.data as MutableRecord).contacted_at,
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
      priority: parsed.data.priority || 'normal',
      next_action: parsed.data.nextAction || null,
      next_action_at: toIsoOrNull(parsed.data.nextActionAt),
      responsible_staff_id: parsed.data.responsibleStaffId || null,
      notes: parsed.data.notes || null,
      metadata_json: {
        ...(normalizedMetadata(before.data as MutableRecord) || {}),
        priority: parsed.data.priority || 'normal',
        next_action: parsed.data.nextAction || null,
        next_action_at: parsed.data.nextActionAt || null,
        responsible_staff_id: parsed.data.responsibleStaffId || null,
        notes: parsed.data.notes || null,
        source_channel: parsed.data.sourceChannel || null,
        relationship_type: parsed.data.relationshipType || null,
      },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: 'admission_lead.updated',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: 'admission_lead',
    entityId: String(data.id),
    severity: 'info',
    beforeData: before.data as MutableRecord,
    afterData: data as MutableRecord,
  })

  return { ok: true, record: data }
}

export async function changeAngelcare360AdmissionLeadStatus(input: unknown) {
  const parsed = angelcare360AdmissionLeadStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Statut de demande invalide.') }

  const context = await requireAngelcare360Permission('admissions.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_admission_leads').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Demande introuvable.' }

  const patch: MutableRecord = {
    status: parsed.data.status,
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.status === 'contacted' && !(before.data as MutableRecord).contacted_at) patch.contacted_at = new Date().toISOString()
  if (parsed.data.status === 'converted') patch.converted_at = new Date().toISOString()

  const { data, error } = await client
    .from('angelcare360_admission_leads')
    .update(patch)
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: 'admission_lead.status_changed',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: 'admission_lead',
    entityId: String(data.id),
    severity: 'warning',
    beforeData: before.data as MutableRecord,
    afterData: data as MutableRecord,
    metadata: { note: parsed.data.note || null },
  })

  return { ok: true, record: data }
}

export async function convertAngelcare360LeadToApplication(input: unknown) {
  const parsed = angelcare360AdmissionApplicationCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Conversion de demande invalide.') }

  const context = await requireAngelcare360Permission('admissions.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const lead = await client.from('angelcare360_admission_leads').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.leadId || '').maybeSingle()
  if (!lead.data) return { ok: false, error: 'Demande introuvable.' }

  const applicationCode = parsed.data.applicationCode || `APP-${Date.now()}`
  const existing = await client.from('angelcare360_admission_applications').select('*').eq('school_id', context.school!.id).eq('lead_id', lead.data.id).maybeSingle()
  if (existing.data) {
    return { ok: true, record: existing.data, warning: 'Un dossier existe déjà pour cette demande.' }
  }

  const metadata = {
    ...(normalizedMetadata(lead.data as MutableRecord) || {}),
    ...(normalizedMetadata(parsed.data as MutableRecord) || {}),
  }

  const { data, error } = await client
    .from('angelcare360_admission_applications')
    .insert({
      school_id: context.school!.id,
      application_code: applicationCode,
      lead_id: lead.data.id,
      parent_id: parsed.data.parentId || null,
      student_id: parsed.data.studentId || null,
      academic_year_id: parsed.data.academicYearId || context.academicYear?.id || null,
      class_id: parsed.data.classId || null,
      section_id: parsed.data.sectionId || null,
      child_first_name: parsed.data.childFirstName || (lead.data as MutableRecord).child_first_name || null,
      child_last_name: parsed.data.childLastName || null,
      child_date_of_birth: toDateString(parsed.data.childDateOfBirth),
      child_gender: parsed.data.childGender || null,
      child_nationality: parsed.data.childNationality || null,
      parent_first_name: parsed.data.parentFirstName || null,
      parent_last_name: parsed.data.parentLastName || null,
      relationship_type: parsed.data.relationshipType || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      application_stage: parsed.data.applicationStage,
      application_date: parsed.data.applicationDate || new Date().toISOString().slice(0, 10),
      decision_date: parsed.data.decisionDate || null,
      decision_status: parsed.data.decisionStatus || 'pending',
      decision_reason: parsed.data.decisionReason || null,
      priority: parsed.data.priority || 'normal',
      next_action: parsed.data.nextAction || null,
      next_action_at: toIsoOrNull(parsed.data.nextActionAt),
      responsible_staff_id: parsed.data.responsibleStaffId || null,
      converted_at: parsed.data.convertedAt || null,
      converted_student_id: parsed.data.convertedStudentId || null,
      converted_parent_id: parsed.data.convertedParentId || null,
      converted_enrollment_id: parsed.data.convertedEnrollmentId || null,
      status: parsed.data.status,
      created_by: context.user.id,
      updated_by: context.user.id,
      metadata_json: {
        ...metadata,
        requested_class_id: parsed.data.classId || null,
        requested_section_id: parsed.data.sectionId || null,
      },
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await client
    .from('angelcare360_admission_leads')
    .update({
      status: 'application_open',
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
      next_action: parsed.data.nextAction || null,
      next_action_at: toIsoOrNull(parsed.data.nextActionAt),
      responsible_staff_id: parsed.data.responsibleStaffId || null,
      metadata_json: {
        ...(normalizedMetadata(lead.data as MutableRecord) || {}),
        converted_application_id: data.id,
      },
    })
    .eq('school_id', context.school!.id)
    .eq('id', lead.data.id)

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: 'admission_lead.converted_to_application',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: 'admission_application',
    entityId: String(data.id),
    severity: 'warning',
    beforeData: lead.data as MutableRecord,
    afterData: data as MutableRecord,
  })

  return { ok: true, record: data }
}

export async function listAngelcare360AdmissionApplications(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await withContext('admissions.view', options?.schoolId || undefined)
  const client = await createClient()
  return listApplicationRows(client, context.school!.id, options?.academicYearId || context.academicYear?.id || null)
}

export async function getAngelcare360AdmissionApplicationById(id: string) {
  const context = await withContext('admissions.view')
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_admission_applications')
    .select(`
      id,
      school_id,
      application_code,
      lead_id,
      parent_id,
      student_id,
      academic_year_id,
      class_id,
      section_id,
      child_first_name,
      child_last_name,
      child_date_of_birth,
      child_gender,
      child_nationality,
      parent_first_name,
      parent_last_name,
      relationship_type,
      phone,
      email,
      address,
      application_stage,
      application_date,
      decision_date,
      decision_status,
      decision_reason,
      priority,
      next_action,
      next_action_at,
      responsible_staff_id,
      converted_at,
      converted_student_id,
      converted_parent_id,
      converted_enrollment_id,
      status,
      metadata_json,
      created_at,
      updated_at,
      lead:angelcare360_admission_leads(id, lead_code, parent_name, student_full_name, parent_phone, parent_email, status),
      parent:angelcare360_parents(id, parent_code, full_name, first_name, last_name, email, phone, status),
      student:angelcare360_students(id, student_code, full_name, first_name, last_name, current_class_id, current_section_id, status),
      class:angelcare360_classes(id, class_code, name, level),
      section:angelcare360_sections(id, section_code, name)
    `)
    .eq('school_id', context.school!.id)
    .eq('id', id)
    .maybeSingle()

  if (!data) return null

  const [history, submissions, auditEvents] = await Promise.all([
    client
      .from('angelcare360_admission_status_history')
      .select('id, school_id, application_id, from_status, to_status, note, changed_by, changed_at, metadata_json')
      .eq('school_id', context.school!.id)
      .eq('application_id', id)
      .order('changed_at', { ascending: false }),
    client
      .from('angelcare360_admission_document_submissions')
      .select('id, school_id, application_id, required_document_id, document_id, submitted_by, submitted_at, verification_status, reviewed_by, reviewed_at, notes, status, metadata_json, required:angelcare360_admission_required_documents(id, document_key, title, description, is_required, sort_order), document:angelcare360_documents(id, document_code, title, file_name, status)')
      .eq('school_id', context.school!.id)
      .eq('application_id', id)
      .order('created_at', { ascending: true }),
    getApplicationAuditTrail(client, context.school!.id, id),
  ])

  return {
    ...(data as MutableRecord),
    latest_audit_events: auditEvents,
    status_history: history.data || [],
    document_submissions: submissions.data || [],
  } as MutableRecord
}

export async function createAngelcare360AdmissionApplication(input: unknown) {
  const parsed = angelcare360AdmissionApplicationCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Payload dossier invalide.') }

  const context = await requireAngelcare360Permission('admissions.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const payload = {
    school_id: context.school!.id,
    application_code: parsed.data.applicationCode,
    lead_id: parsed.data.leadId || null,
    parent_id: parsed.data.parentId || null,
    student_id: parsed.data.studentId || null,
    academic_year_id: parsed.data.academicYearId || context.academicYear?.id || null,
    class_id: parsed.data.classId || null,
    section_id: parsed.data.sectionId || null,
    child_first_name: parsed.data.childFirstName || null,
    child_last_name: parsed.data.childLastName || null,
    child_date_of_birth: toDateString(parsed.data.childDateOfBirth),
    child_gender: parsed.data.childGender || null,
    child_nationality: parsed.data.childNationality || null,
    parent_first_name: parsed.data.parentFirstName || null,
    parent_last_name: parsed.data.parentLastName || null,
    relationship_type: parsed.data.relationshipType || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    application_stage: parsed.data.applicationStage,
    application_date: parsed.data.applicationDate || new Date().toISOString().slice(0, 10),
    decision_date: parsed.data.decisionDate || null,
    decision_status: parsed.data.decisionStatus || 'pending',
    decision_reason: parsed.data.decisionReason || null,
    priority: parsed.data.priority || 'normal',
    next_action: parsed.data.nextAction || null,
    next_action_at: toIsoOrNull(parsed.data.nextActionAt),
    responsible_staff_id: parsed.data.responsibleStaffId || null,
    converted_at: parsed.data.convertedAt || null,
    converted_student_id: parsed.data.convertedStudentId || null,
    converted_parent_id: parsed.data.convertedParentId || null,
    converted_enrollment_id: parsed.data.convertedEnrollmentId || null,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {
      source: parsed.data.source || null,
      requested_class_id: parsed.data.classId || null,
      requested_section_id: parsed.data.sectionId || null,
    },
  }

  const { data, error } = await client.from('angelcare360_admission_applications').insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }

  if (parsed.data.leadId) {
    await client
      .from('angelcare360_admission_leads')
      .update({
        status: 'application_open',
        updated_by: context.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('school_id', context.school!.id)
      .eq('id', parsed.data.leadId)
  }

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: 'admission_application.created',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: 'admission_application',
    entityId: String(data.id),
    severity: 'info',
    afterData: data as MutableRecord,
  })

  return { ok: true, record: data }
}

export async function updateAngelcare360AdmissionApplication(input: unknown) {
  const parsed = angelcare360AdmissionApplicationUpdateSchema.safeParse(input)
  if (!parsed.success || !parsed.data.id) return { ok: false, error: validationErrorMessage(parsed, 'Payload dossier invalide.') }

  const context = await requireAngelcare360Permission('admissions.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_admission_applications').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Dossier introuvable.' }

  const { data, error } = await client
    .from('angelcare360_admission_applications')
    .update({
      application_code: parsed.data.applicationCode,
      lead_id: parsed.data.leadId || null,
      parent_id: parsed.data.parentId || null,
      student_id: parsed.data.studentId || null,
      academic_year_id: parsed.data.academicYearId || null,
      class_id: parsed.data.classId || null,
      section_id: parsed.data.sectionId || null,
      child_first_name: parsed.data.childFirstName || null,
      child_last_name: parsed.data.childLastName || null,
      child_date_of_birth: toDateString(parsed.data.childDateOfBirth),
      child_gender: parsed.data.childGender || null,
      child_nationality: parsed.data.childNationality || null,
      parent_first_name: parsed.data.parentFirstName || null,
      parent_last_name: parsed.data.parentLastName || null,
      relationship_type: parsed.data.relationshipType || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      application_stage: parsed.data.applicationStage,
      application_date: parsed.data.applicationDate || (before.data as MutableRecord).application_date,
      decision_date: parsed.data.decisionDate || null,
      decision_status: parsed.data.decisionStatus || (before.data as MutableRecord).decision_status || 'pending',
      decision_reason: parsed.data.decisionReason || null,
      priority: parsed.data.priority || 'normal',
      next_action: parsed.data.nextAction || null,
      next_action_at: toIsoOrNull(parsed.data.nextActionAt),
      responsible_staff_id: parsed.data.responsibleStaffId || null,
      converted_at: parsed.data.convertedAt || null,
      converted_student_id: parsed.data.convertedStudentId || null,
      converted_parent_id: parsed.data.convertedParentId || null,
      converted_enrollment_id: parsed.data.convertedEnrollmentId || null,
      status: parsed.data.status,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
      metadata_json: {
        ...(normalizedMetadata(before.data as MutableRecord) || {}),
        source: (normalizedMetadata(before.data as MutableRecord) || {}).source || null,
        requested_class_id: parsed.data.classId || null,
        requested_section_id: parsed.data.sectionId || null,
      },
    })
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: 'admission_application.updated',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: 'admission_application',
    entityId: String(data.id),
    severity: 'info',
    beforeData: before.data as MutableRecord,
    afterData: data as MutableRecord,
  })

  return { ok: true, record: data }
}

export async function changeAngelcare360AdmissionApplicationStatus(input: unknown) {
  const parsed = angelcare360AdmissionApplicationStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Statut du dossier invalide.') }

  const context = await requireAngelcare360Permission('admissions.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const before = await client.from('angelcare360_admission_applications').select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Dossier introuvable.' }

  const patch: MutableRecord = {
    status: parsed.data.status,
    application_stage: parsed.data.applicationStage || (parsed.data.status === 'approved' ? 'accepte' : parsed.data.status === 'rejected' ? 'refuse' : parsed.data.status),
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.status === 'converted') patch.converted_at = new Date().toISOString()
  if (parsed.data.status === 'approved') patch.decision_status = 'accepted'
  if (parsed.data.status === 'rejected') patch.decision_status = 'rejected'
  if (parsed.data.status === 'waitlisted') patch.decision_status = 'waitlisted'

  const { data, error } = await client
    .from('angelcare360_admission_applications')
    .update(patch)
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await client.from('angelcare360_admission_status_history').insert({
    school_id: context.school!.id,
    application_id: parsed.data.id,
    from_status: (before.data as MutableRecord).status || null,
    to_status: parsed.data.status,
    note: parsed.data.note || null,
    changed_by: context.user.id,
    metadata_json: { application_stage: parsed.data.applicationStage || null },
  })

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: 'admission_application.status_changed',
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: 'admission_application',
    entityId: String(data.id),
    severity: parsed.data.status === 'approved' || parsed.data.status === 'converted' ? 'warning' : 'info',
    beforeData: before.data as MutableRecord,
    afterData: data as MutableRecord,
    metadata: { note: parsed.data.note || null },
  })

  return { ok: true, record: data }
}

export async function decideAngelcare360AdmissionApplication(input: unknown) {
  const parsed = angelcare360AdmissionDecisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Décision invalide.') }
  const status = parsed.data.decisionStatus
  return changeAngelcare360AdmissionApplicationStatus({
    id: parsed.data.id,
    schoolId: parsed.data.schoolId,
    status: status === 'accepted' ? 'approved' : status === 'rejected' ? 'rejected' : status === 'waitlisted' ? 'waitlisted' : 'open',
    applicationStage: status === 'accepted' ? 'accepte' : status === 'rejected' ? 'refuse' : status === 'waitlisted' ? 'liste_attente' : 'en_etude',
    note: parsed.data.decisionReason || null,
  })
}

export async function acceptAngelcare360AdmissionApplication(input: unknown) {
  const parsed = angelcare360AdmissionDecisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Décision invalide.') }
  return decideAngelcare360AdmissionApplication({
    id: parsed.data.id,
    schoolId: parsed.data.schoolId,
    decisionStatus: 'accepted',
    decisionReason: parsed.data.decisionReason || null,
  })
}

export async function rejectAngelcare360AdmissionApplication(input: unknown) {
  const parsed = angelcare360AdmissionDecisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Décision invalide.') }
  return decideAngelcare360AdmissionApplication({
    id: parsed.data.id,
    schoolId: parsed.data.schoolId,
    decisionStatus: 'rejected',
    decisionReason: parsed.data.decisionReason || null,
  })
}

export async function listAngelcare360AdmissionRequiredDocuments(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await withContext('documents.view', options?.schoolId || undefined)
  const client = await createClient()
  return listRequiredDocumentRows(client, context.school!.id, options?.academicYearId || context.academicYear?.id || null)
}

export async function createAngelcare360AdmissionRequiredDocument(input: unknown) {
  const parsed = angelcare360AdmissionRequiredDocumentCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Payload document requis invalide.') }
  const context = await requireAngelcare360Permission('documents.create', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const { data, error } = await client.from('angelcare360_admission_required_documents').insert({
    school_id: context.school!.id,
    academic_year_id: parsed.data.academicYearId || context.academicYear?.id || null,
    document_key: parsed.data.documentKey,
    title: parsed.data.title,
    description: parsed.data.description || null,
    required_for_stage: parsed.data.requiredForStage || null,
    sort_order: parsed.data.sortOrder,
    is_required: parsed.data.isRequired ?? true,
    status: parsed.data.status,
    created_by: context.user.id,
    updated_by: context.user.id,
    metadata_json: {},
  }).select('*').single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, record: data }
}

export async function updateAngelcare360AdmissionRequiredDocument(input: unknown) {
  const parsed = angelcare360AdmissionRequiredDocumentUpdateSchema.safeParse(input)
  if (!parsed.success || !parsed.data.id) return { ok: false, error: validationErrorMessage(parsed, 'Payload document requis invalide.') }
  const context = await requireAngelcare360Permission('documents.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const { data, error } = await client.from('angelcare360_admission_required_documents').update({
    academic_year_id: parsed.data.academicYearId || null,
    document_key: parsed.data.documentKey,
    title: parsed.data.title,
    description: parsed.data.description || null,
    required_for_stage: parsed.data.requiredForStage || null,
    sort_order: parsed.data.sortOrder,
    is_required: parsed.data.isRequired ?? true,
    status: parsed.data.status,
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, record: data }
}

export async function listAngelcare360AdmissionDocumentSubmissions(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await withContext('documents.view', options?.schoolId || undefined)
  const client = await createClient()
  return listSubmissionRows(client, context.school!.id, options?.academicYearId || context.academicYear?.id || null)
}

export async function updateAngelcare360AdmissionDocumentSubmissionStatus(input: unknown) {
  const parsed = angelcare360AdmissionDocumentSubmissionUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Statut documentaire invalide.') }
  const context = await requireAngelcare360Permission('documents.update', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const { data, error } = await client.from('angelcare360_admission_document_submissions').upsert({
    school_id: context.school!.id,
    application_id: parsed.data.applicationId,
    required_document_id: parsed.data.requiredDocumentId,
    document_id: parsed.data.documentId || null,
    verification_status: parsed.data.verificationStatus,
    reviewed_by: context.user.id,
    reviewed_at: new Date().toISOString(),
    notes: parsed.data.notes || null,
    status: parsed.data.status,
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
    metadata_json: {
      rejection_reason: parsed.data.rejectionReason || null,
    },
  }, { onConflict: 'application_id,required_document_id' }).select('*').single()
  if (error) return { ok: false, error: error.message }
  return { ok: true, record: data }
}

export async function getAngelcare360AdmissionDocumentChecklist(applicationId: string) {
  const context = await withContext('documents.view')
  const client = await createClient()
  const [application, requiredDocuments, submissions] = await Promise.all([
    client.from('angelcare360_admission_applications').select('id, school_id, application_code, status, converted_at, academic_year_id, class_id, section_id').eq('school_id', context.school!.id).eq('id', applicationId).maybeSingle(),
    listAngelcare360AdmissionRequiredDocuments({ schoolId: context.school!.id, academicYearId: context.academicYear?.id || null }),
    client.from('angelcare360_admission_document_submissions').select('id, application_id, required_document_id, verification_status, status').eq('school_id', context.school!.id).eq('application_id', applicationId),
  ])

  if (!application.data) return null

  const submissionMap = new Map<string, MutableRecord>()
  for (const submission of submissions.data || []) submissionMap.set(String((submission as MutableRecord).required_document_id), submission as MutableRecord)

  const checklist = (requiredDocuments || []).map((doc) => {
    const submission = submissionMap.get(String(doc.id))
    const ok = Boolean(submission && String(submission.verification_status) === 'complete')
    return {
      key: String(doc.document_key),
      label: String(doc.title),
      ok,
      explanation: ok ? 'Document validé.' : 'Document attendu ou en attente de validation.',
    } satisfies Angelcare360AdmissionConversionChecklistItem
  })

  return {
    application: application.data,
    checklist,
  }
}

export async function updateAngelcare360AdmissionNextAction(input: unknown) {
  const parsed = angelcare360AdmissionNextActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Prochaine action invalide.') }

  const permission = parsed.data.entity === 'lead' ? 'admissions.update' : 'admissions.update'
  const context = await requireAngelcare360Permission(permission, { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const table = parsed.data.entity === 'lead' ? 'angelcare360_admission_leads' : 'angelcare360_admission_applications'
  const before = await client.from(table).select('*').eq('school_id', context.school!.id).eq('id', parsed.data.id).maybeSingle()
  if (!before.data) return { ok: false, error: 'Dossier introuvable.' }

  const { data, error } = await client.from(table).update({
    next_action: parsed.data.nextAction || null,
    next_action_at: toIsoOrNull(parsed.data.nextActionAt),
    responsible_staff_id: parsed.data.responsibleStaffId || null,
    updated_by: context.user.id,
    updated_at: new Date().toISOString(),
    metadata_json: {
      ...(normalizedMetadata(before.data as MutableRecord) || {}),
      next_action: parsed.data.nextAction || null,
      next_action_at: parsed.data.nextActionAt || null,
      responsible_staff_id: parsed.data.responsibleStaffId || null,
      notes: parsed.data.notes || null,
    },
  }).eq('school_id', context.school!.id).eq('id', parsed.data.id).select('*').single()
  if (error) return { ok: false, error: error.message }

  await recordAngelcare360AuditEventServer({
    category: 'admissions',
    module: 'admissions',
    action: `${parsed.data.entity}.next_action_updated`,
    schoolId: context.school!.id,
    actorUserId: context.user.id,
    actorRole: context.primaryRoleKey || context.access.accessLevel,
    entityType: parsed.data.entity === 'lead' ? 'admission_lead' : 'admission_application',
    entityId: String(data.id),
    severity: 'info',
    beforeData: before.data as MutableRecord,
    afterData: data as MutableRecord,
    metadata: { notes: parsed.data.notes || null },
  })

  return { ok: true, record: data }
}

export async function listAngelcare360AdmissionFollowUps(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await withContext('admissions.view', options?.schoolId || undefined)
  const client = await createClient()
  const [leads, applications] = await Promise.all([
    listLeadRows(client, context.school!.id, options?.academicYearId || context.academicYear?.id || null),
    listApplicationRows(client, context.school!.id, options?.academicYearId || context.academicYear?.id || null),
  ])

  const rows = [
    ...leads
      .filter((item) => Boolean(item.next_action || item.next_action_at))
      .map((item) => ({
        id: item.id,
        kind: 'lead' as const,
        title: item.student_full_name,
        subtitle: item.parent_name,
        next_action: item.next_action || null,
        next_action_at: item.next_action_at || null,
        responsible_staff_name: item.assigned_staff_name || null,
        status: item.status,
        detail_href: item.detail_href || buildDetailHref('/angelcare-360-command-center/admissions/demandes', String(item.id)),
      })),
    ...applications
      .filter((item) => Boolean(item.next_action || item.next_action_at))
      .map((item) => ({
        id: item.id,
        kind: 'application' as const,
        title: getLeadDisplayName(item as unknown as MutableRecord),
        subtitle: item.lead_parent_name || null,
        next_action: item.next_action || null,
        next_action_at: item.next_action_at || null,
        responsible_staff_name: null,
        status: item.status,
        detail_href: item.detail_href || buildDetailHref('/angelcare-360-command-center/admissions/dossiers', String(item.id)),
      })),
  ]

  return rows.sort((left, right) => String(left.next_action_at || '').localeCompare(String(right.next_action_at || ''))) as Array<Record<string, unknown>>
}

export async function listAngelcare360AdmissionConversionCandidates(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const context = await withContext('admissions.view', options?.schoolId || undefined)
  const rows = await listApplicationRows(await createClient(), context.school!.id, options?.academicYearId || context.academicYear?.id || null)
  return rows.filter((row) => Boolean(row.ready_for_conversion || row.status === 'approved' || row.status === 'in_review'))
}

export async function getAngelcare360AdmissionConversionChecklist(applicationId: string) {
  const context = await withContext('admissions.view')
  const application = await getAngelcare360AdmissionApplicationById(applicationId)
  if (!application) return null

  const applicationMetadata = normalizedMetadata(application as MutableRecord)
  const documentChecklist = await getAngelcare360AdmissionDocumentChecklist(applicationId)
  const duplicateCheck = await detectAngelcare360AdmissionDuplicates(application)
  const capacityCheck = await checkAngelcare360ClassCapacityForAdmission({
    schoolId: context.school!.id,
    classId: asString(application.class_id || applicationMetadata.requested_class_id || ''),
    sectionId: asString(application.section_id || applicationMetadata.requested_section_id || ''),
  })
  const checklist: Angelcare360AdmissionConversionChecklistItem[] = [
    {
      key: 'school',
      label: 'Établissement sélectionné',
      ok: Boolean(context.school),
      explanation: context.school ? 'Établissement actif résolu.' : 'Aucun établissement actif n’est disponible.',
    },
    {
      key: 'academic_year',
      label: 'Année scolaire sélectionnée',
      ok: Boolean(application.academic_year_id || context.academicYear?.id),
      explanation: application.academic_year_id || context.academicYear?.id ? 'Année scolaire renseignée.' : 'Aucune année scolaire n’est associée.',
    },
    {
      key: 'class',
      label: 'Classe cible sélectionnée',
      ok: Boolean(application.class_id || applicationMetadata.requested_class_id),
      explanation: application.class_id || applicationMetadata.requested_class_id ? 'Classe prête.' : 'La classe cible n’est pas renseignée.',
    },
    {
      key: 'identity',
      label: 'Identité de l’enfant complète',
      ok: Boolean(application.child_first_name || application.lead_student_full_name),
      explanation: application.child_first_name || application.lead_student_full_name ? 'Identité exploitables.' : 'L’identité de l’enfant est incomplète.',
    },
    {
      key: 'parent',
      label: 'Identité du parent complète',
      ok: Boolean(application.parent_first_name || application.lead_parent_name || application.phone || application.email),
      explanation: application.parent_first_name || application.lead_parent_name ? 'Parent identifiable.' : 'Le parent n’est pas encore suffisamment identifié.',
    },
    {
      key: 'documents',
      label: 'Pièces justificatives',
      ok: Boolean(documentChecklist && documentChecklist.checklist.every((item) => item.ok)),
      explanation: documentChecklist && documentChecklist.checklist.every((item) => item.ok)
        ? 'Tous les documents requis sont couverts.'
        : `${documentChecklist ? documentChecklist.checklist.filter((item) => !item.ok).length : 0} pièce(s) manquante(s).`,
    },
    {
      key: 'duplicates',
      label: 'Aucun doublon bloquant',
      ok: duplicateCheck.duplicates.length === 0,
      explanation: duplicateCheck.duplicates.length === 0 ? 'Aucun doublon critique détecté.' : `${duplicateCheck.duplicates.length} doublon(s) potentiel(s) détecté(s).`,
    },
    {
      key: 'capacity',
      label: 'Capacité de la classe',
      ok: !capacityCheck.warning,
      explanation: capacityCheck.warning || 'Capacité conforme.',
    },
  ]

  return {
    application,
    checklist,
    duplicates: duplicateCheck,
    capacity: capacityCheck,
    documentChecklist,
  }
}

export async function detectAngelcare360AdmissionDuplicates(application: MutableRecord | Angelcare360AdmissionApplicationRecord) {
  const context = await withContext('admissions.view')
  const client = await createClient()
  const schoolId = context.school!.id
  const metadata = normalizedMetadata(application as MutableRecord)
  const childName = getLeadDisplayName(application as MutableRecord)
  const childBirthDate = asOptionalString((application as MutableRecord).child_date_of_birth || metadata.child_date_of_birth)
  const parentEmail = asOptionalString((application as MutableRecord).email || metadata.parent_email)
  const parentPhone = asOptionalString((application as MutableRecord).phone || metadata.parent_phone)

  const [students, parents, leads] = await Promise.all([
    client.from('angelcare360_students').select('id, student_code, full_name, first_name, last_name, date_of_birth, status').eq('school_id', schoolId),
    client.from('angelcare360_parents').select('id, parent_code, full_name, first_name, last_name, email, phone, whatsapp, status').eq('school_id', schoolId),
    client.from('angelcare360_admission_leads').select('id, lead_code, parent_name, student_full_name, parent_phone, parent_email, child_first_name, child_last_name, child_date_of_birth, status').eq('school_id', schoolId),
  ])

  const studentMatches = ((students.data || []) as MutableRecord[]).filter((student) => {
    const sameName = textOfName(student).toLowerCase() === childName.toLowerCase()
    const sameBirth = childBirthDate && toDateString(asOptionalString(student.date_of_birth)) === childBirthDate
    return sameName || sameBirth
  })

  const parentMatches = ((parents.data || []) as MutableRecord[]).filter((parent) => {
    const sameEmail = parentEmail && asString(parent.email).toLowerCase() === parentEmail.toLowerCase()
    const samePhone = parentPhone && [parent.phone, parent.whatsapp].filter(Boolean).some((item) => asString(item).includes(parentPhone))
    return sameEmail || samePhone
  })

  const leadMatches = ((leads.data || []) as MutableRecord[]).filter((lead) => {
    const samePhone = parentPhone && asString(lead.parent_phone).includes(parentPhone)
    const sameEmail = parentEmail && asString(lead.parent_email).toLowerCase() === parentEmail.toLowerCase()
    return samePhone || sameEmail
  })

  return {
    studentMatches,
    parentMatches,
    leadMatches,
    duplicates: [...studentMatches, ...parentMatches, ...leadMatches].map((item) => ({
      id: String(item.id),
      label: textOfName(item),
      kind: item.student_code ? 'student' : item.parent_code ? 'parent' : 'lead',
    })),
  }
}

export async function checkAngelcare360ClassCapacityForAdmission(input: { schoolId: string; classId?: string | null; sectionId?: string | null }) {
  if (!input.classId) {
    return { ok: true, warning: 'Capacité non configurée', classCapacity: null, currentEnrollment: null }
  }

  const client = await createClient()
  const [classRow, enrollmentCount] = await Promise.all([
    client.from('angelcare360_classes').select('id, name, class_code, capacity, status').eq('school_id', input.schoolId).eq('id', input.classId).maybeSingle(),
    client.from('angelcare360_class_enrollments').select('id', { count: 'exact', head: true }).eq('school_id', input.schoolId).eq('class_id', input.classId).eq('status', 'active'),
  ])

  const classCapacity = classRow.data ? Number((classRow.data as MutableRecord).capacity || 0) : null
  const currentEnrollment = enrollmentCount.count ?? 0
  const warning = classCapacity !== null && classCapacity > 0 && currentEnrollment >= classCapacity ? 'La classe cible atteint sa capacité maximale.' : null
  return {
    ok: true,
    warning,
    classCapacity,
    currentEnrollment,
    className: classRow.data ? asString((classRow.data as MutableRecord).name) : null,
  }
}

export async function convertAngelcare360ApplicationToPeopleRecords(input: unknown) {
  const parsed = angelcare360AdmissionConversionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: validationErrorMessage(parsed, 'Conversion invalide.') }

  const context = await requireAngelcare360Permission('admissions.approve', { schoolId: parsed.data.schoolId })
  const client = await createClient()
  const application = await client
    .from('angelcare360_admission_applications')
    .select('*')
    .eq('school_id', context.school!.id)
    .eq('id', parsed.data.applicationId)
    .maybeSingle()

  if (!application.data) return { ok: false, error: 'Dossier introuvable.' }
  if (String((application.data as MutableRecord).converted_at || '')) {
    return { ok: true, warning: 'Le dossier a déjà été converti.', record: application.data }
  }
  if (String((application.data as MutableRecord).status) !== 'approved') {
    return { ok: false, error: 'Le dossier doit être accepté avant conversion.' }
  }
  const applicationMetadata = normalizedMetadata(application.data as MutableRecord)
  if (!parsed.data.classId && !(application.data as MutableRecord).class_id && !applicationMetadata.requested_class_id) {
    return { ok: false, error: 'Une classe cible doit être renseignée pour la conversion.' }
  }

  const conversionChecklist = await getAngelcare360AdmissionConversionChecklist(parsed.data.applicationId)
  if (!conversionChecklist) return { ok: false, error: 'Checklist de conversion indisponible.' }

  const duplicateCheck = conversionChecklist.duplicates
  if (duplicateCheck.duplicates.length > 0 && !parsed.data.duplicateOverride) {
    return { ok: false, error: 'Des doublons potentiels ont été détectés. La conversion est bloquée sans validation explicite.' }
  }

  const applicationRow = application.data as MutableRecord
  const metadata = normalizedMetadata(applicationRow)
  const leadId = asOptionalString(applicationRow.lead_id)
  const schoolId = context.school!.id
  const { data: leadRow } = leadId
    ? await client
        .from('angelcare360_admission_leads')
        .select('id, school_id, lead_code, parent_name, parent_phone, parent_email, student_full_name, child_first_name, child_last_name, child_date_of_birth, relationship_type, desired_level, source_channel, assigned_staff_id, contacted_at, converted_at, next_action, next_action_at, responsible_staff_id, priority, notes, status, metadata_json, created_at, updated_at')
        .eq('school_id', schoolId)
        .eq('id', leadId)
        .maybeSingle()
    : { data: null }
  const leadRowRecord = (leadRow as MutableRecord | null) || null
  const leadChildFirstName = asOptionalString(leadRowRecord?.child_first_name as string | null | undefined)
  const leadChildLastName = asOptionalString(leadRowRecord?.child_last_name as string | null | undefined)
  const leadParentName = asOptionalString(leadRowRecord?.parent_name as string | null | undefined)
  const leadParentPhone = asOptionalString(leadRowRecord?.parent_phone as string | null | undefined)
  const leadParentEmail = asOptionalString(leadRowRecord?.parent_email as string | null | undefined)
  const childFirstName = asOptionalString(applicationRow.child_first_name || metadata.child_first_name || leadChildFirstName) || asString(applicationRow.child_first_name || metadata.child_first_name || '')
  const childLastName = asOptionalString(applicationRow.child_last_name || metadata.child_last_name || '') || ''
  const childFullName = [childFirstName, childLastName || leadChildLastName].filter(Boolean).join(' ').trim() || getLeadDisplayName((leadRowRecord || applicationRow) as unknown as MutableRecord)
  const parentFirstName = asOptionalString(applicationRow.parent_first_name || metadata.parent_first_name || leadParentName || '') || ''
  const parentLastName = asOptionalString(applicationRow.parent_last_name || metadata.parent_last_name || '') || ''
  const parentFullName = [parentFirstName, parentLastName].filter(Boolean).join(' ').trim() || leadParentName || 'Parent'

  const academicYearId = asOptionalString(parsed.data.academicYearId || applicationRow.academic_year_id || context.academicYear?.id || null)
  const classId = asOptionalString(parsed.data.classId || applicationRow.class_id || metadata.requested_class_id || null)
  const sectionId = asOptionalString(parsed.data.sectionId || applicationRow.section_id || metadata.requested_section_id || null)
  let capacityCheck: Awaited<ReturnType<typeof checkAngelcare360ClassCapacityForAdmission>> | null = null

  const [existingStudent, existingParent] = await Promise.all([
    client
      .from('angelcare360_students')
      .select('*')
      .eq('school_id', schoolId)
      .ilike('full_name', childFullName)
      .maybeSingle(),
    client
      .from('angelcare360_parents')
      .select('*')
      .eq('school_id', schoolId)
      .or(`email.eq.${asString(applicationRow.email || leadParentEmail || '')},phone.eq.${asString(applicationRow.phone || leadParentPhone || '')}`)
      .maybeSingle(),
  ])

  let createdStudentId: string | null = null
  let createdParentId: string | null = null
  let createdLinkId: string | null = null
  let createdEnrollmentId: string | null = null
  try {
    let studentId = existingStudent.data ? String((existingStudent.data as MutableRecord).id) : null
    let parentId = existingParent.data ? String((existingParent.data as MutableRecord).id) : null

    if (!parentId) {
      const { data, error } = await client.from('angelcare360_parents').insert({
        school_id: schoolId,
        parent_code: `PAR-${Date.now()}`,
        first_name: parentFirstName || leadParentName || 'Parent',
        last_name: parentLastName || '',
        full_name: parentFullName,
        email: applicationRow.email || leadParentEmail || null,
        phone: applicationRow.phone || leadParentPhone || null,
        preferred_language: 'fr',
        status: 'active',
        created_by: context.user.id,
        updated_by: context.user.id,
        metadata_json: {
          relationship_type: applicationRow.relationship_type || metadata.relationship_type || 'tuteur',
          source: 'admissions_conversion',
        },
      }).select('*').single()
      if (error) throw new Error(error.message)
      parentId = String(data.id)
      createdParentId = parentId
    }

    if (!studentId) {
      const { data, error } = await client.from('angelcare360_students').insert({
        school_id: schoolId,
        student_code: `STU-${Date.now()}`,
        first_name: childFirstName || childFullName,
        last_name: childLastName || '',
        full_name: childFullName,
        date_of_birth: toDateString(asOptionalString(applicationRow.child_date_of_birth || metadata.child_date_of_birth)),
        admission_status: 'enrolled',
        status: 'active',
        admission_date: new Date().toISOString().slice(0, 10),
        created_by: context.user.id,
        updated_by: context.user.id,
        metadata_json: {
          nationality: applicationRow.child_nationality || metadata.child_nationality || null,
          address: applicationRow.address || metadata.address || null,
          administrative_notes: 'Créé depuis le module Admissions',
          admission_application_id: applicationRow.id,
        },
      }).select('*').single()
      if (error) throw new Error(error.message)
      studentId = String(data.id)
      createdStudentId = studentId
    }

    const { data: linkData, error: linkError } = await client.from('angelcare360_student_parent_links').insert({
      school_id: schoolId,
      student_id: studentId,
      parent_id: parentId,
      relationship_type: applicationRow.relationship_type || metadata.relationship_type || 'tuteur',
      is_primary: true,
      is_guardian: true,
      can_pickup: true,
      can_receive_messages: true,
      can_pay_fees: true,
      status: 'active',
      created_by: context.user.id,
      updated_by: context.user.id,
      metadata_json: { source: 'admissions_conversion' },
    }).select('*').single()
    if (linkError) throw new Error(linkError.message)
    createdLinkId = String(linkData.id)

    if (classId) {
      capacityCheck = await checkAngelcare360ClassCapacityForAdmission({
        schoolId,
        classId: asOptionalString(classId),
        sectionId: asOptionalString(sectionId),
      })
      if (capacityCheck.warning && !parsed.data.duplicateOverride) {
        throw new Error(capacityCheck.warning)
      }

      const existingEnrollment = await client
        .from('angelcare360_class_enrollments')
        .select('*')
        .eq('school_id', schoolId)
        .eq('academic_year_id', academicYearId)
        .eq('student_id', studentId)
        .maybeSingle()

      if (!existingEnrollment.data) {
        const { data, error } = await client.from('angelcare360_class_enrollments').insert({
          school_id: schoolId,
          academic_year_id: academicYearId,
          student_id: studentId,
          class_id: classId,
          section_id: sectionId || null,
          enrollment_number: `ENR-${Date.now()}`,
          enrollment_status: 'enrolled',
          status: 'active',
          enrolled_on: new Date().toISOString().slice(0, 10),
          created_by: context.user.id,
          updated_by: context.user.id,
          metadata_json: { source: 'admissions_conversion' },
        }).select('*').single()
        if (error) throw new Error(error.message)
        createdEnrollmentId = String(data.id)
      } else {
        createdEnrollmentId = String(existingEnrollment.data.id)
      }
    }

    const { data: updatedApplication, error: applicationUpdateError } = await client
      .from('angelcare360_admission_applications')
      .update({
        student_id: studentId,
        parent_id: parentId,
        academic_year_id: academicYearId,
        class_id: classId,
        section_id: sectionId,
        converted_at: new Date().toISOString(),
        converted_student_id: studentId,
        converted_parent_id: parentId,
        converted_enrollment_id: createdEnrollmentId,
        status: 'converted',
        application_stage: 'converti',
        decision_status: 'converted',
        decision_reason: parsed.data.notes || (applicationRow.decision_reason || null),
        updated_by: context.user.id,
        updated_at: new Date().toISOString(),
        metadata_json: {
          ...metadata,
          conversion_notes: parsed.data.notes || null,
          converted: true,
        },
      })
      .eq('school_id', schoolId)
      .eq('id', applicationRow.id)
      .select('*')
      .single()

    if (applicationUpdateError) throw new Error(applicationUpdateError.message)

    await client
      .from('angelcare360_admission_leads')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        updated_by: context.user.id,
        updated_at: new Date().toISOString(),
        metadata_json: {
          ...(leadRowRecord ? normalizedMetadata(leadRowRecord) : {}),
          converted_application_id: applicationRow.id,
          converted_student_id: studentId,
          converted_parent_id: parentId,
        },
      })
      .eq('school_id', schoolId)
      .eq('id', applicationRow.lead_id)

    await client.from('angelcare360_admission_status_history').insert({
      school_id: schoolId,
      application_id: applicationRow.id,
      from_status: applicationRow.status,
      to_status: 'converted',
      note: parsed.data.notes || 'Conversion vers les dossiers personnes.',
      changed_by: context.user.id,
      metadata_json: {
        student_id: studentId,
        parent_id: parentId,
        enrollment_id: createdEnrollmentId,
      },
    })

    await recordAngelcare360AuditEventServer({
      category: 'admissions',
      module: 'admissions',
      action: 'admission_application.converted',
      schoolId,
      actorUserId: context.user.id,
      actorRole: context.primaryRoleKey || context.access.accessLevel,
      entityType: 'admission_application',
      entityId: String(applicationRow.id),
      severity: 'critical',
      beforeData: applicationRow,
      afterData: updatedApplication as MutableRecord,
      metadata: {
        student_id: studentId,
        parent_id: parentId,
        enrollment_id: createdEnrollmentId,
        duplicate_override: parsed.data.duplicateOverride || false,
      },
    })

    return {
      ok: true,
      record: updatedApplication,
      student_id: studentId,
      parent_id: parentId,
      enrollment_id: createdEnrollmentId,
      warning: capacityCheck?.warning || null,
    }
  } catch (error) {
    if (createdEnrollmentId) {
      await client.from('angelcare360_class_enrollments').delete().eq('school_id', schoolId).eq('id', createdEnrollmentId)
    }
    if (createdLinkId) {
      await client.from('angelcare360_student_parent_links').delete().eq('school_id', schoolId).eq('id', createdLinkId)
    }
    if (createdStudentId) {
      await client.from('angelcare360_students').delete().eq('school_id', schoolId).eq('id', createdStudentId)
    }
    if (createdParentId) {
      await client.from('angelcare360_parents').delete().eq('school_id', schoolId).eq('id', createdParentId)
    }
    return { ok: false, error: error instanceof Error ? error.message : 'Conversion impossible.' }
  }
}

export async function listAngelcare360AdmissionsAuditEvents(options?: { schoolId?: string | null; filter?: Angelcare360AdmissionsAuditFilter }) {
  const context = await withContext('audit.view', options?.schoolId || undefined)
  const client = await createClient()
  const filter = options?.filter || {}
  return listAuditRows(client, context.school!.id, filter)
}

export async function getAngelcare360AdmissionAuditEventDetail(id: string) {
  const context = await withContext('audit.view')
  const client = await createClient()
  const { data } = await client
    .from('angelcare360_audit_logs')
    .select('id, school_id, actor_user_id, actor_role, module, action, entity_type, entity_id, severity, ip_address, user_agent, request_id, before_data, after_data, metadata, created_at')
    .eq('school_id', context.school!.id)
    .eq('id', id)
    .maybeSingle()
  return data ?? null
}

export async function listAngelcare360AdmissionPipelineCards(options?: { schoolId?: string | null; academicYearId?: string | null }) {
  const applications = await listAngelcare360AdmissionApplications(options)
  return applications.reduce<Record<string, Angelcare360AdmissionsPipelineCard[]>>((accumulator, application) => {
    const key = String(application.status || 'open')
    const bucket = accumulator[key] || []
    bucket.push({
      id: String(application.id),
      title: getLeadDisplayName(application as unknown as MutableRecord),
      subtitle: [application.lead_parent_name, application.class_name, application.section_name].filter(Boolean).join(' · ') || null,
      status: String(application.application_stage || application.status || 'open'),
      nextAction: application.next_action || null,
      nextActionAt: application.next_action_at || null,
      missingDocumentCount: application.missing_document_count || 0,
      readyForConversion: Boolean(application.ready_for_conversion),
      detailHref: application.detail_href || buildDetailHref('/angelcare-360-command-center/admissions/dossiers', String(application.id)),
    })
    accumulator[key] = bucket
    return accumulator
  }, {})
}
