import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type { Employee360Actor } from './permissions'
import {
  employeeProfileFromRow,
  loadEmployee360Aggregate,
  readRawEmployee,
} from './repository'
import {
  assertLifecycleTransition,
  cleanBoolean,
  cleanDate,
  cleanNumber,
  cleanText,
} from './validation'
import type {
  Employee360Aggregate,
  Employee360DomainKey,
  Employee360MutationRequest,
  Employee360MutationResult,
  EmployeeLifecycleState,
  JsonObject,
} from './types'

type DbRow = Record<string, unknown>
type DomainMutationTarget = {
  table: string
  employeeColumns: string[]
}

const DOMAIN_TARGETS: Record<Exclude<Employee360DomainKey, 'communications'>, DomainMutationTarget> = {
  attendance: { table: 'hr_attendance_corrections', employeeColumns: ['staff_id', 'employee_id'] },
  leave: { table: 'hr_leave_requests', employeeColumns: ['staff_id', 'employee_id'] },
  payroll: { table: 'hr_payroll_inputs', employeeColumns: ['staff_id', 'employee_id'] },
  planning: { table: 'hr_roster_assignments', employeeColumns: ['staff_id', 'employee_id'] },
  documents: { table: 'hr_documents', employeeColumns: ['staff_id', 'employee_id'] },
  contracts: { table: 'hr_contracts', employeeColumns: ['staff_id', 'employee_id'] },
  onboarding: { table: 'hr_onboarding_journeys', employeeColumns: ['staff_id', 'employee_id'] },
  training: { table: 'hr_training_records', employeeColumns: ['staff_id', 'employee_id'] },
  performance: { table: 'hr_performance_reviews', employeeColumns: ['staff_id', 'employee_id'] },
  tasks: { table: 'hr_tasks', employeeColumns: ['staff_id', 'employee_id'] },
  approvals: { table: 'hr_approval_requests', employeeColumns: ['staff_id', 'employee_id'] },
  incidents: { table: 'hr_incidents', employeeColumns: ['staff_id', 'employee_id'] },
}

function dbObject(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const output: JsonObject = {}
  Object.entries(value).forEach(([key, item]) => {
    if (
      item === null ||
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean' ||
      Array.isArray(item) ||
      (typeof item === 'object' && item !== null)
    ) {
      output[key] = item as JsonObject[string]
    }
  })
  return output
}

function scopeMatches(row: DbRow, actor: Employee360Actor): boolean {
  const tenant = cleanText(row.tenant_id)
  const organization = cleanText(row.organization_id)
  if (actor.tenantId && tenant && actor.tenantId !== tenant) return false
  if (actor.organizationId && organization && actor.organizationId !== organization) return false
  return true
}

function assertExpectedVersion(row: DbRow, expectedVersion: number): number {
  const actual = Math.max(1, cleanNumber(row.version) || 1)
  if (actual !== expectedVersion) {
    throw Object.assign(new Error('Le dossier a été modifié par un autre utilisateur. Rechargez les données.'), {
      status: 409,
      code: 'VERSION_CONFLICT',
      conflict: { expectedVersion, actualVersion: actual },
    })
  }
  return actual
}

async function writeAudit(input: {
  employeeId: string
  actor: Employee360Actor
  eventType: string
  domain: string
  action: string
  title: string
  summary?: string | null
  riskLevel?: string
  beforeState?: DbRow | JsonObject | null
  afterState?: DbRow | JsonObject | null
  metadata?: JsonObject
  correlationId?: string
}): Promise<void> {
  const db = await createServiceClient()
  const response = await db.from('hr_employee_360_audit_events').insert({
    employee_id: input.employeeId,
    tenant_id: input.actor.tenantId,
    organization_id: input.actor.organizationId,
    event_type: input.eventType,
    domain: input.domain,
    action: input.action,
    title: input.title,
    summary: input.summary || null,
    actor_id: input.actor.id,
    actor_name: input.actor.name,
    risk_level: input.riskLevel || 'normal',
    before_state: dbObject(input.beforeState),
    after_state: dbObject(input.afterState),
    metadata: input.metadata || {},
    correlation_id: input.correlationId || randomUUID(),
    created_at: new Date().toISOString(),
  })

  if (response.error) {
    throw Object.assign(new Error(`Échec de l’audit Employee 360: ${response.error.message}`), {
      status: 500,
      code: 'AUDIT_WRITE_FAILED',
    })
  }
}

async function assertEmployee(
  employeeId: string,
  actor: Employee360Actor,
  expectedVersion: number,
): Promise<DbRow> {
  const employee = await readRawEmployee(employeeId)
  if (!employee) {
    throw Object.assign(new Error('Collaborateur introuvable.'), { status: 404, code: 'EMPLOYEE_NOT_FOUND' })
  }
  if (!scopeMatches(employee, actor)) {
    throw Object.assign(new Error('Périmètre collaborateur non autorisé.'), { status: 403, code: 'SCOPE_MISMATCH' })
  }
  assertExpectedVersion(employee, expectedVersion)
  return employee
}

async function existingIdempotentResponse(
  employeeId: string,
  key: string | undefined,
): Promise<boolean> {
  if (!key) return false
  const db = await createServiceClient()
  const response = await db
    .from('hr_employee_360_idempotency')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('idempotency_key', key)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return Boolean(!response.error && response.data)
}

async function rememberIdempotency(
  employeeId: string,
  actor: Employee360Actor,
  key: string | undefined,
  action: string,
): Promise<void> {
  if (!key) return
  const db = await createServiceClient()
  const response = await db.from('hr_employee_360_idempotency').upsert({
    employee_id: employeeId,
    actor_id: actor.id,
    idempotency_key: key,
    request_hash: action,
    response_payload: { ok: true, action },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
  }, { onConflict: 'employee_id,idempotency_key' })
  if (response.error) {
    throw Object.assign(new Error(`Échec du registre d’idempotence: ${response.error.message}`), {
      status: 500,
      code: 'IDEMPOTENCY_WRITE_FAILED',
    })
  }
}

function profilePatch(payload: JsonObject, actor: Employee360Actor): DbRow {
  const firstName = cleanText(payload.firstName ?? payload.first_name, 160)
  const lastName = cleanText(payload.lastName ?? payload.last_name, 160)
  const suppliedFullName = cleanText(payload.fullName ?? payload.full_name, 320)
  const derivedName = [firstName, lastName].filter(Boolean).join(' ')
  const patch: DbRow = {
    first_name: firstName,
    last_name: lastName,
    preferred_name: cleanText(payload.preferredName ?? payload.preferred_name, 160),
    full_name: suppliedFullName || derivedName || undefined,
    email: cleanText(payload.email, 320),
    phone: cleanText(payload.phone, 80),
    national_id: cleanText(payload.nationalId ?? payload.national_id, 120),
    date_of_birth: cleanDate(payload.dateOfBirth ?? payload.date_of_birth),
    place_of_birth: cleanText(payload.placeOfBirth ?? payload.place_of_birth, 240),
    nationality: cleanText(payload.nationality, 120),
    gender: cleanText(payload.gender, 80),
    marital_status: cleanText(payload.maritalStatus ?? payload.marital_status, 80),
    children_count: cleanNumber(payload.childrenCount ?? payload.children_count),
    address: cleanText(payload.address, 1200),
    city: cleanText(payload.city, 160),
    postal_code: cleanText(payload.postalCode ?? payload.postal_code, 40),
    country: cleanText(payload.country, 160),
    branch_office: cleanText(payload.branchOffice ?? payload.branch_office, 240),
    work_city: cleanText(payload.workCity ?? payload.work_city, 160),
    remote_option: cleanText(payload.remoteOption ?? payload.remote_option, 80),
    position: cleanText(payload.position, 240),
    department: cleanText(payload.department, 240),
    manager: cleanText(payload.manager, 240),
    manager_user_id: cleanText(payload.managerUserId ?? payload.manager_user_id, 100),
    employment_type: cleanText(payload.employmentType ?? payload.employment_type, 120),
    start_date: cleanDate(payload.startDate ?? payload.start_date),
    hire_date: cleanDate(payload.hireDate ?? payload.hire_date),
    probation_end_date: cleanDate(payload.probationEndDate ?? payload.probation_end_date),
    contract_type: cleanText(payload.contractType ?? payload.contract_type, 120),
    salary: actor.access.manageCompensation ? cleanNumber(payload.salary) : undefined,
    currency: actor.access.manageCompensation ? cleanText(payload.currency, 20) : undefined,
    payment_method: actor.access.manageCompensation
      ? cleanText(payload.paymentMethod ?? payload.payment_method, 120)
      : undefined,
    cnss_number: cleanText(payload.cnssNumber ?? payload.cnss_number, 120),
    amo_number: cleanText(payload.amoNumber ?? payload.amo_number, 120),
    emergency_contact_name: cleanText(payload.emergencyContactName ?? payload.emergency_contact_name, 240),
    emergency_contact_phone: cleanText(payload.emergencyContactPhone ?? payload.emergency_contact_phone, 80),
    emergency_contact_relation: cleanText(payload.emergencyContactRelation ?? payload.emergency_contact_relation, 120),
    confidentiality_level: cleanText(payload.confidentialityLevel ?? payload.confidentiality_level, 80),
    updated_by: actor.id,
    source: 'employee_360_sovereign_command',
  }

  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
}

function employeeScope(employee: DbRow, actor: Employee360Actor): DbRow {
  return {
    tenant_id: cleanText(employee.tenant_id) || actor.tenantId,
    organization_id: cleanText(employee.organization_id) || actor.organizationId,
  }
}

function commonDomainFields(employeeId: string, employee: DbRow, actor: Employee360Actor): DbRow {
  return {
    staff_id: employeeId,
    employee_id: employeeId,
    ...employeeScope(employee, actor),
    created_by: actor.id,
    updated_by: actor.id,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function buildDomainPayload(
  domain: Exclude<Employee360DomainKey, 'communications'>,
  payload: JsonObject,
  employeeId: string,
  employee: DbRow,
  actor: Employee360Actor,
): DbRow {
  const common = commonDomainFields(employeeId, employee, actor)
  const employeeName = cleanText(employee.full_name) || cleanText(employee.email) || 'Collaborateur'
  const title = cleanText(payload.title, 500)
  const status = cleanText(payload.status, 120)
  const priority = cleanText(payload.priority, 80)
  const notes = cleanText(payload.notes ?? payload.description, 8000)
  const metadata = dbObject(payload.metadata)

  switch (domain) {
    case 'attendance':
      return {
        ...common,
        correction_type: cleanText(payload.correctionType ?? payload.correction_type, 160) || 'manual_correction',
        attendance_id: cleanText(payload.attendanceId ?? payload.attendance_id, 100),
        requested_by: actor.id,
        original_value: dbObject(payload.originalValue ?? payload.original_value),
        requested_value: dbObject(payload.requestedValue ?? payload.requested_value),
        reason: cleanText(payload.reason, 5000),
        stage: cleanText(payload.stage, 80) || 'requested',
        status: status || 'pending',
        notes,
        metadata: { ...metadata, title: title || 'Correction de présence' },
      }
    case 'leave':
      return {
        ...common,
        employee_name: employeeName,
        leave_type: cleanText(payload.leaveType ?? payload.leave_type, 160) || title || 'Congé',
        start_date: cleanDate(payload.startDate ?? payload.start_date),
        end_date: cleanDate(payload.endDate ?? payload.end_date),
        status: status || 'pending',
        priority: priority || 'medium',
        reason: cleanText(payload.reason, 5000),
        notes,
        metadata,
      }
    case 'payroll':
      if (!actor.access.manageCompensation) {
        throw Object.assign(new Error('Autorisation rémunération requise.'), { status: 403, code: 'COMPENSATION_FORBIDDEN' })
      }
      return {
        ...common,
        title: title || 'Élément de paie',
        input_type: cleanText(payload.inputType ?? payload.input_type, 120) || 'adjustment',
        period_start: cleanDate(payload.periodStart ?? payload.period_start),
        period_end: cleanDate(payload.periodEnd ?? payload.period_end),
        amount: cleanNumber(payload.amount),
        currency: cleanText(payload.currency, 20) || 'MAD',
        status: status || 'draft',
        reason: cleanText(payload.reason, 5000),
        notes,
        metadata,
      }
    case 'planning':
      return {
        ...common,
        staff_name: employeeName,
        title: title || 'Affectation planning',
        department: cleanText(employee.department),
        work_date: cleanDate(payload.workDate ?? payload.work_date),
        start_time: cleanText(payload.startTime ?? payload.start_time, 40),
        end_time: cleanText(payload.endTime ?? payload.end_time, 40),
        location: cleanText(payload.location, 320),
        shift_type: cleanText(payload.shiftType ?? payload.shift_type, 120) || 'standard',
        status: status || 'planned',
        priority: priority || 'medium',
        notes,
        metadata,
      }
    case 'documents':
      return {
        ...common,
        employee_name: employeeName,
        title: title || 'Document RH',
        document_type: cleanText(payload.documentType ?? payload.document_type, 160) || 'document',
        status: status || 'pending',
        file_url: cleanText(payload.fileUrl ?? payload.file_url, 3000),
        storage_bucket: cleanText(payload.storageBucket ?? payload.storage_bucket, 160),
        storage_path: cleanText(payload.storagePath ?? payload.storage_path, 3000),
        content_hash: cleanText(payload.contentHash ?? payload.content_hash, 160),
        uploaded_by: cleanText(payload.uploadedBy ?? payload.uploaded_by, 100) || actor.id,
        uploaded_at: cleanDate(payload.uploadedAt ?? payload.uploaded_at) || new Date().toISOString(),
        file_name: cleanText(payload.fileName ?? payload.file_name, 500),
        file_size: cleanNumber(payload.fileSize ?? payload.file_size),
        mime_type: cleanText(payload.mimeType ?? payload.mime_type, 160),
        expiry_date: cleanDate(payload.expiryDate ?? payload.expiry_date),
        owner: cleanText(payload.owner, 240),
        signature_status: cleanText(payload.signatureStatus ?? payload.signature_status, 120),
        compliance_status: cleanText(payload.complianceStatus ?? payload.compliance_status, 120),
        notes,
        metadata,
      }
    case 'contracts':
      return {
        ...common,
        employee_name: employeeName,
        title: title || 'Contrat collaborateur',
        contract_type: cleanText(payload.contractType ?? payload.contract_type, 160) || 'standard',
        type: cleanText(payload.type, 160),
        status: status || 'draft',
        start_date: cleanDate(payload.startDate ?? payload.start_date),
        end_date: cleanDate(payload.endDate ?? payload.end_date),
        probation_end_date: cleanDate(payload.probationEndDate ?? payload.probation_end_date),
        salary: actor.access.manageCompensation ? cleanNumber(payload.salary) : undefined,
        currency: actor.access.manageCompensation ? cleanText(payload.currency, 20) || 'MAD' : undefined,
        signed_at: cleanDate(payload.signedAt ?? payload.signed_at),
        document_id: cleanText(payload.documentId ?? payload.document_id, 100),
        notes,
        metadata,
      }
    case 'onboarding':
      return {
        ...common,
        title: title || 'Parcours intégration',
        status: status || 'draft',
        position: cleanText(employee.position),
        department: cleanText(employee.department),
        start_date: cleanDate(payload.startDate ?? payload.start_date) || cleanDate(employee.start_date),
        progress: cleanNumber(payload.progress) || 0,
        owner: cleanText(payload.owner, 240),
        notes,
        metadata,
      }
    case 'training':
      return {
        ...common,
        employee_name: employeeName,
        title: title || cleanText(payload.trainingTitle ?? payload.training_title, 500) || 'Formation',
        training_title: cleanText(payload.trainingTitle ?? payload.training_title, 500) || title,
        category: cleanText(payload.category, 160),
        status: status || 'assigned',
        progress_percent: cleanNumber(payload.progressPercent ?? payload.progress_percent) || 0,
        assigned_at: cleanDate(payload.assignedAt ?? payload.assigned_at) || new Date().toISOString(),
        due_at: cleanDate(payload.dueAt ?? payload.due_at),
        completed_at: cleanDate(payload.completedAt ?? payload.completed_at),
        priority: priority || 'medium',
        notes,
        metadata,
      }
    case 'performance':
      return {
        ...common,
        employee_name: employeeName,
        title: title || 'Revue de performance',
        review_cycle: cleanText(payload.reviewCycle ?? payload.review_cycle, 160),
        reviewer_id: cleanText(payload.reviewerId ?? payload.reviewer_id, 100),
        stage: cleanText(payload.stage, 120) || 'draft',
        status: status || 'draft',
        score: cleanNumber(payload.score),
        due_date: cleanDate(payload.dueDate ?? payload.due_date),
        due_at: cleanDate(payload.dueAt ?? payload.due_at),
        strengths: cleanText(payload.strengths, 5000),
        improvements: cleanText(payload.improvements, 5000),
        action_plan: cleanText(payload.actionPlan ?? payload.action_plan, 8000),
        notes,
        metadata,
      }
    case 'tasks':
      return {
        ...common,
        title: title || 'Action RH',
        task_type: cleanText(payload.taskType ?? payload.task_type, 160) || 'employee_action',
        status: status || 'open',
        priority: priority || 'medium',
        due_date: cleanDate(payload.dueDate ?? payload.due_date),
        due_at: cleanDate(payload.dueAt ?? payload.due_at),
        owner: cleanText(payload.owner, 240),
        assigned_to: cleanText(payload.assignedTo ?? payload.assigned_to, 100),
        related_module: cleanText(payload.relatedModule ?? payload.related_module, 160) || 'employee360',
        description: cleanText(payload.description, 8000),
        outcome: cleanText(payload.outcome, 8000),
        metadata,
      }
    case 'approvals':
      return {
        ...common,
        title: title || 'Approbation RH',
        request_type: cleanText(payload.requestType ?? payload.request_type, 160) || 'employee360',
        entity_type: cleanText(payload.entityType ?? payload.entity_type, 160) || 'employee',
        entity_id: cleanText(payload.entityId ?? payload.entity_id, 100) || employeeId,
        requester_name: actor.name,
        approver_name: cleanText(payload.approverName ?? payload.approver_name, 240),
        status: status || 'pending',
        priority: priority || 'medium',
        decision_notes: cleanText(payload.decisionNotes ?? payload.decision_notes, 8000),
        decided_at: cleanDate(payload.decidedAt ?? payload.decided_at),
        metadata,
      }
    case 'incidents':
      return {
        ...common,
        title: title || 'Incident RH',
        incident_type: cleanText(payload.incidentType ?? payload.incident_type, 160) || 'employee_incident',
        severity: cleanText(payload.severity, 80) || 'medium',
        priority: priority || 'medium',
        status: status || 'open',
        occurred_at: cleanDate(payload.occurredAt ?? payload.occurred_at) || new Date().toISOString(),
        due_at: cleanDate(payload.dueAt ?? payload.due_at),
        description: cleanText(payload.description, 8000),
        resolution: cleanText(payload.resolution, 8000),
        owner: cleanText(payload.owner, 240),
        metadata,
      }
  }
}

async function updateProfile(
  employeeId: string,
  employee: DbRow,
  actor: Employee360Actor,
  request: Employee360MutationRequest,
): Promise<void> {
  const db = await createServiceClient()
  const patch = profilePatch(request.payload || {}, actor)
  const previous = { ...employee }
  const update = await db
    .from('hr_staff_profiles')
    .update(patch)
    .eq('id', employeeId)
    .eq('version', request.expectedVersion)
    .select('*')
    .maybeSingle()

  if (update.error || !update.data) {
    throw Object.assign(new Error(update.error?.message || 'Échec de mise à jour du profil.'), {
      status: update.error ? 500 : 409,
      code: update.error ? 'PROFILE_UPDATE_FAILED' : 'VERSION_CONFLICT',
    })
  }

  try {
    await writeAudit({
      employeeId,
      actor,
      eventType: 'employee_profile_updated',
      domain: 'identity',
      action: 'profile.update',
      title: 'Profil collaborateur mis à jour',
      summary: request.reason || 'Modification depuis Employee 360.',
      beforeState: previous,
      afterState: update.data,
      metadata: { employeeVersion: cleanNumber(update.data.version) || request.expectedVersion + 1 },
    })
  } catch (error) {
    await db.from('hr_staff_profiles').update(previous).eq('id', employeeId)
    throw error
  }
}

async function lifecycleTransition(
  employeeId: string,
  employee: DbRow,
  actor: Employee360Actor,
  request: Employee360MutationRequest,
): Promise<void> {
  if (!request.targetState || !request.reason) {
    throw Object.assign(new Error('État cible et justification obligatoires.'), { status: 400, code: 'LIFECYCLE_INPUT_REQUIRED' })
  }

  const profile = employeeProfileFromRow(employee)
  assertLifecycleTransition(profile.lifecycleState, request.targetState)
  const db = await createServiceClient()
  const now = new Date().toISOString()
  const statusMap: Partial<Record<EmployeeLifecycleState, string>> = {
    active: 'active',
    probation: 'probation',
    on_leave: 'on_leave',
    suspended: 'suspended',
    notice_period: 'notice_period',
    terminated: 'terminated',
    archived: 'archived',
    rehired: 'active',
  }

  const patch: DbRow = {
    lifecycle_state: request.targetState,
    employment_status: statusMap[request.targetState] || profile.employmentStatus,
    status: statusMap[request.targetState] || profile.employmentStatus,
    terminated_at: request.targetState === 'terminated' ? now : profile.terminatedAt,
    termination_reason: request.targetState === 'terminated' ? request.reason : profile.terminationReason,
    archived_at: request.targetState === 'archived' ? now : request.targetState === 'rehired' ? null : profile.archivedAt,
    archived_by: request.targetState === 'archived' ? actor.id : request.targetState === 'rehired' ? null : employee.archived_by,
    archive_reason: request.targetState === 'archived' ? request.reason : request.targetState === 'rehired' ? null : profile.archiveReason,
    updated_by: actor.id,
  }

  const update = await db
    .from('hr_staff_profiles')
    .update(patch)
    .eq('id', employeeId)
    .eq('version', request.expectedVersion)
    .select('*')
    .maybeSingle()

  if (update.error || !update.data) {
    throw Object.assign(new Error(update.error?.message || 'Conflit de cycle de vie.'), {
      status: update.error ? 500 : 409,
      code: update.error ? 'LIFECYCLE_UPDATE_FAILED' : 'VERSION_CONFLICT',
    })
  }

  const lifecycleInsert = await db.from('hr_employee_lifecycle_events').insert({
    employee_id: employeeId,
    ...employeeScope(employee, actor),
    from_state: profile.lifecycleState,
    to_state: request.targetState,
    effective_at: now,
    reason: request.reason,
    actor_id: actor.id,
    actor_name: actor.name,
    employee_version: cleanNumber(update.data.version) || request.expectedVersion + 1,
    metadata: request.payload || {},
    created_at: now,
  })

  if (lifecycleInsert.error) {
    await db.from('hr_staff_profiles').update(employee).eq('id', employeeId)
    throw Object.assign(new Error(`Échec du journal de cycle de vie: ${lifecycleInsert.error.message}`), {
      status: 500,
      code: 'LIFECYCLE_AUDIT_FAILED',
    })
  }

  try {
    await writeAudit({
      employeeId,
      actor,
      eventType: 'employee_lifecycle_transition',
      domain: 'lifecycle',
      action: 'lifecycle.transition',
      title: `Cycle de vie: ${profile.lifecycleState} → ${request.targetState}`,
      summary: request.reason,
      beforeState: employee,
      afterState: update.data,
      riskLevel: ['terminated', 'archived', 'suspended'].includes(request.targetState) ? 'high' : 'normal',
    })
  } catch (error) {
    await db.from('hr_employee_lifecycle_events').delete().eq('employee_id', employeeId).eq('employee_version', cleanNumber(update.data.version) || request.expectedVersion + 1)
    await db.from('hr_staff_profiles').update(employee).eq('id', employeeId)
    throw error
  }
}

async function archiveOrRestore(
  employeeId: string,
  employee: DbRow,
  actor: Employee360Actor,
  request: Employee360MutationRequest,
): Promise<void> {
  const restoring = request.action === 'employee.restore'
  if (!restoring && !request.reason) {
    throw Object.assign(new Error('La justification d’archivage est obligatoire.'), { status: 400, code: 'ARCHIVE_REASON_REQUIRED' })
  }
  const db = await createServiceClient()
  const now = new Date().toISOString()
  const patch = restoring
    ? {
        archived_at: null,
        archived_by: null,
        archive_reason: null,
        lifecycle_state: 'active',
        employment_status: 'active',
        status: 'active',
        updated_by: actor.id,
      }
    : {
        archived_at: now,
        archived_by: actor.id,
        archive_reason: request.reason,
        lifecycle_state: 'archived',
        employment_status: 'archived',
        status: 'archived',
        updated_by: actor.id,
      }

  const update = await db
    .from('hr_staff_profiles')
    .update(patch)
    .eq('id', employeeId)
    .eq('version', request.expectedVersion)
    .select('*')
    .maybeSingle()

  if (update.error || !update.data) {
    throw Object.assign(new Error(update.error?.message || 'Conflit d’archivage.'), {
      status: update.error ? 500 : 409,
      code: update.error ? 'ARCHIVE_UPDATE_FAILED' : 'VERSION_CONFLICT',
    })
  }

  try {
    await writeAudit({
      employeeId,
      actor,
      eventType: restoring ? 'employee_restored' : 'employee_archived',
      domain: 'lifecycle',
      action: request.action,
      title: restoring ? 'Dossier collaborateur restauré' : 'Dossier collaborateur archivé',
      summary: request.reason || 'Restauration contrôlée.',
      beforeState: employee,
      afterState: update.data,
      riskLevel: restoring ? 'normal' : 'high',
    })
  } catch (error) {
    await db.from('hr_staff_profiles').update(employee).eq('id', employeeId)
    throw error
  }
}

async function readDomainRow(
  table: string,
  recordId: string,
  employeeId: string,
): Promise<DbRow | null> {
  const db = await createServiceClient()
  const response = await db.from(table).select('*').eq('id', recordId).maybeSingle()
  if (response.error || !response.data) return null
  const row = response.data as DbRow
  const linkedIds = [cleanText(row.staff_id), cleanText(row.employee_id), cleanText(row.profile_id)].filter(Boolean)
  return linkedIds.includes(employeeId) ? row : null
}

async function compensateDomain(
  table: string,
  action: 'create' | 'update',
  recordId: string,
  previous: DbRow | null,
): Promise<void> {
  const db = await createServiceClient()
  if (action === 'create') {
    await db.from(table).delete().eq('id', recordId)
    return
  }
  if (previous) await db.from(table).update(previous).eq('id', recordId)
}

async function mutateDomain(
  employeeId: string,
  employee: DbRow,
  actor: Employee360Actor,
  request: Employee360MutationRequest,
): Promise<void> {
  if (!request.domain) {
    throw Object.assign(new Error('Domaine requis.'), { status: 400, code: 'DOMAIN_REQUIRED' })
  }
  if (request.domain === 'communications') {
    throw Object.assign(new Error('Les communications sont envoyées par le Centre de communication RH dédié.'), {
      status: 409,
      code: 'COMMUNICATIONS_READ_ONLY',
    })
  }

  const target = DOMAIN_TARGETS[request.domain]
  const db = await createServiceClient()
  const correlationId = randomUUID()
  const now = new Date().toISOString()

  if (request.action === 'domain.create') {
    const payload = buildDomainPayload(request.domain, request.payload || {}, employeeId, employee, actor)
    const insert = await db.from(target.table).insert(payload).select('*').single()
    if (insert.error || !insert.data) {
      throw Object.assign(new Error(insert.error?.message || 'Création du dossier métier impossible.'), {
        status: 500,
        code: 'DOMAIN_CREATE_FAILED',
      })
    }
    try {
      await writeAudit({
        employeeId,
        actor,
        eventType: 'employee_domain_record_created',
        domain: request.domain,
        action: request.action,
        title: `Création ${request.domain}`,
        summary: request.reason || cleanText((request.payload || {}).title),
        afterState: insert.data,
        correlationId,
      })
    } catch (error) {
      await compensateDomain(target.table, 'create', String(insert.data.id || ''), null)
      throw error
    }
    return
  }

  if (!request.recordId) {
    throw Object.assign(new Error('Identifiant du dossier métier requis.'), { status: 400, code: 'RECORD_ID_REQUIRED' })
  }
  const previous = await readDomainRow(target.table, request.recordId, employeeId)
  if (!previous) {
    throw Object.assign(new Error('Dossier métier introuvable ou non rattaché au collaborateur.'), {
      status: 404,
      code: 'DOMAIN_RECORD_NOT_FOUND',
    })
  }
  if (!scopeMatches(previous, actor)) {
    throw Object.assign(new Error('Périmètre du dossier métier non autorisé.'), { status: 403, code: 'DOMAIN_SCOPE_MISMATCH' })
  }
  const actualRecordVersion = Math.max(1, cleanNumber(previous.version) || 1)
  if (request.expectedRecordVersion && request.expectedRecordVersion !== actualRecordVersion) {
    throw Object.assign(new Error('Cet enregistrement métier a été modifié par un autre utilisateur.'), {
      status: 409,
      code: 'DOMAIN_VERSION_CONFLICT',
      conflict: {
        expectedVersion: request.expectedRecordVersion,
        actualVersion: actualRecordVersion,
      },
    })
  }

  let patch: DbRow
  if (request.action === 'domain.archive') {
    if (!request.reason) {
      throw Object.assign(new Error('Justification d’archivage obligatoire.'), { status: 400, code: 'ARCHIVE_REASON_REQUIRED' })
    }
    patch = {
      archived_at: now,
      archived_by: actor.id,
      updated_by: actor.id,
      metadata: { ...dbObject(previous.metadata), archiveReason: request.reason },
    }
  } else if (request.action === 'domain.restore') {
    patch = {
      archived_at: null,
      archived_by: null,
      updated_by: actor.id,
      metadata: { ...dbObject(previous.metadata), restoredReason: request.reason || 'Restauration contrôlée' },
    }
  } else if (request.action === 'domain.validate') {
    if (!actor.access.validate) {
      throw Object.assign(new Error('Autorisation de validation requise.'), { status: 403, code: 'VALIDATION_FORBIDDEN' })
    }
    patch = {
      status: cleanText((request.payload || {}).status, 120) || 'validated',
      approved_by: actor.id,
      approved_at: now,
      decided_at: now,
      updated_by: actor.id,
      metadata: { ...dbObject(previous.metadata), validationReason: request.reason || null },
    }
  } else {
    patch = buildDomainPayload(request.domain, request.payload || {}, employeeId, employee, actor)
    delete patch.created_at
    delete patch.created_by
    delete patch.staff_id
    delete patch.employee_id
    delete patch.tenant_id
    delete patch.organization_id
  }

  let updateQuery = db.from(target.table).update(patch).eq('id', request.recordId)
  if (request.expectedRecordVersion) {
    updateQuery = updateQuery.eq('version', request.expectedRecordVersion)
  }
  const update = await updateQuery.select('*').maybeSingle()
  if (update.error || !update.data) {
    throw Object.assign(new Error(update.error?.message || 'Mise à jour métier impossible ou conflit de version.'), {
      status: update.error ? 500 : 409,
      code: update.error ? 'DOMAIN_UPDATE_FAILED' : 'DOMAIN_VERSION_CONFLICT',
    })
  }

  try {
    await writeAudit({
      employeeId,
      actor,
      eventType: 'employee_domain_record_changed',
      domain: request.domain,
      action: request.action,
      title: `${request.action} · ${request.domain}`,
      summary: request.reason || cleanText((request.payload || {}).title),
      beforeState: previous,
      afterState: update.data,
      riskLevel: request.action === 'domain.archive' ? 'review' : 'normal',
      correlationId,
    })
  } catch (error) {
    await compensateDomain(target.table, 'update', request.recordId, previous)
    throw error
  }
}

async function createNote(
  employeeId: string,
  employee: DbRow,
  actor: Employee360Actor,
  request: Employee360MutationRequest,
): Promise<void> {
  const payload = request.payload || {}
  const title = cleanText(payload.title, 500)
  const description = cleanText(payload.description ?? payload.notes, 10000)
  if (!title || !description) {
    throw Object.assign(new Error('Titre et contenu de la note sont obligatoires.'), {
      status: 400,
      code: 'NOTE_FIELDS_REQUIRED',
    })
  }

  const db = await createServiceClient()
  const insert = await db.from('hr_employee_cases').insert({
    employee_id: employeeId,
    ...employeeScope(employee, actor),
    case_type: cleanText(payload.caseType ?? payload.case_type, 160) || 'internal_note',
    domain: cleanText(payload.domain, 160) || 'employee',
    title,
    description,
    status: cleanText(payload.status, 120) || 'open',
    priority: cleanText(payload.priority, 80) || 'medium',
    owner_id: cleanText(payload.ownerId ?? payload.owner_id, 100) || actor.id,
    owner_name: cleanText(payload.ownerName ?? payload.owner_name, 240) || actor.name,
    due_at: cleanDate(payload.dueAt ?? payload.due_at),
    metadata: dbObject(payload.metadata),
    created_by: actor.id,
    updated_by: actor.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select('*').single()

  if (insert.error || !insert.data) {
    throw Object.assign(new Error(insert.error?.message || 'Création de la note impossible.'), {
      status: 500,
      code: 'NOTE_CREATE_FAILED',
    })
  }

  try {
    await writeAudit({
      employeeId,
      actor,
      eventType: 'employee_note_created',
      domain: cleanText(payload.domain, 160) || 'employee',
      action: request.action,
      title,
      summary: description,
      afterState: insert.data,
    })
  } catch (error) {
    await db.from('hr_employee_cases').delete().eq('id', insert.data.id)
    throw error
  }
}

export async function executeEmployee360Mutation(
  employeeId: string,
  actor: Employee360Actor,
  request: Employee360MutationRequest,
): Promise<Employee360MutationResult> {
  try {
    if (await existingIdempotentResponse(employeeId, request.idempotencyKey)) {
      return { ok: true, aggregate: await loadEmployee360Aggregate(employeeId, actor) }
    }

    const employee = await assertEmployee(employeeId, actor, request.expectedVersion)

    switch (request.action) {
      case 'profile.update':
        if (!actor.access.editProfile) throw Object.assign(new Error('Modification du profil interdite.'), { status: 403, code: 'FORBIDDEN' })
        await updateProfile(employeeId, employee, actor, request)
        break
      case 'employee.archive':
        if (!actor.access.archive) throw Object.assign(new Error('Archivage du collaborateur interdit.'), { status: 403, code: 'FORBIDDEN' })
        await archiveOrRestore(employeeId, employee, actor, request)
        break
      case 'employee.restore':
        if (!actor.access.restore) throw Object.assign(new Error('Restauration du collaborateur interdite.'), { status: 403, code: 'FORBIDDEN' })
        await archiveOrRestore(employeeId, employee, actor, request)
        break
      case 'lifecycle.transition':
        if (!actor.access.manageLifecycle) throw Object.assign(new Error('Gestion du cycle de vie interdite.'), { status: 403, code: 'FORBIDDEN' })
        await lifecycleTransition(employeeId, employee, actor, request)
        break
      case 'note.create':
        if (!actor.access.manageDomains) throw Object.assign(new Error('Création de notes interdite.'), { status: 403, code: 'FORBIDDEN' })
        await createNote(employeeId, employee, actor, request)
        break
      default:
        if (!actor.access.manageDomains) throw Object.assign(new Error('Gestion des domaines RH interdite.'), { status: 403, code: 'FORBIDDEN' })
        await mutateDomain(employeeId, employee, actor, request)
    }

    await rememberIdempotency(employeeId, actor, request.idempotencyKey, request.action)
    return { ok: true, aggregate: await loadEmployee360Aggregate(employeeId, actor) }
  } catch (error) {
    const detail = error as Error & {
      code?: string
      status?: number
      conflict?: { expectedVersion: number; actualVersion: number }
    }
    return {
      ok: false,
      error: detail.message || 'Échec de l’opération Employee 360.',
      code: detail.code || 'EMPLOYEE_360_MUTATION_FAILED',
      conflict: detail.conflict,
    }
  }
}
