import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { requireEmployee360Actor } from '@/lib/hr-employee-360/permissions'
import { loadEmployee360Aggregate } from '@/lib/hr-employee-360/repository'
import { cleanBoolean, cleanDate, cleanNumber, cleanText } from '@/lib/hr-employee-360/validation'
import type { JsonObject } from '@/lib/hr-employee-360/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DbRow = Record<string, unknown>

function profilePayload(body: Record<string, unknown>, creating: boolean, allowCompensation: boolean): DbRow {
  const firstName = cleanText(body.first_name ?? body.firstName, 160)
  const lastName = cleanText(body.last_name ?? body.lastName, 160)
  const suppliedFullName = cleanText(body.full_name ?? body.fullName, 320)
  const fullName = suppliedFullName || [firstName, lastName].filter(Boolean).join(' ') || cleanText(body.email, 320) || 'Collaborateur'
  const saveAsDraft = cleanBoolean(body.save_as_draft ?? body.saveAsDraft)
  const status = saveAsDraft ? 'draft' : cleanText(body.employment_status ?? body.employmentStatus, 120) || (creating ? 'active' : null)

  const row: DbRow = {
    first_name: firstName,
    last_name: lastName,
    preferred_name: cleanText(body.preferred_name ?? body.preferredName, 160),
    full_name: fullName,
    email: cleanText(body.email, 320),
    phone: cleanText(body.phone, 80),
    national_id: cleanText(body.national_id ?? body.nationalId, 120),
    date_of_birth: cleanDate(body.date_of_birth ?? body.dateOfBirth),
    place_of_birth: cleanText(body.place_of_birth ?? body.placeOfBirth, 240),
    nationality: cleanText(body.nationality, 120) || (creating ? 'Moroccan' : null),
    gender: cleanText(body.gender, 80),
    marital_status: cleanText(body.marital_status ?? body.maritalStatus, 80),
    children_count: cleanNumber(body.children_count ?? body.childrenCount) || 0,
    address: cleanText(body.address, 1200),
    city: cleanText(body.city, 160),
    postal_code: cleanText(body.postal_code ?? body.postalCode, 40),
    country: cleanText(body.country, 160) || (creating ? 'Morocco' : null),
    branch_office: cleanText(body.branch_office ?? body.branchOffice, 240),
    work_city: cleanText(body.work_city ?? body.workCity, 160),
    remote_option: cleanText(body.remote_option ?? body.remoteOption, 80),
    position: cleanText(body.position, 240),
    department: cleanText(body.department, 240),
    manager: cleanText(body.manager, 240),
    employment_status: status,
    status,
    lifecycle_state: saveAsDraft ? 'draft' : status === 'probation' ? 'probation' : status === 'archived' ? 'archived' : 'active',
    employment_type: cleanText(body.employment_type ?? body.employmentType, 120),
    start_date: cleanDate(body.start_date ?? body.startDate),
    hire_date: cleanDate(body.hire_date ?? body.hireDate ?? body.start_date ?? body.startDate),
    probation_end_date: cleanDate(body.probation_end_date ?? body.probationEndDate),
    contract_type: cleanText(body.contract_type ?? body.contractType, 120),
    salary: allowCompensation ? cleanNumber(body.salary) : undefined,
    currency: allowCompensation ? cleanText(body.currency, 20) || (creating ? 'MAD' : null) : undefined,
    payment_method: allowCompensation ? cleanText(body.payment_method ?? body.paymentMethod, 120) : undefined,
    cnss_number: cleanText(body.cnss_number ?? body.cnssNumber, 120),
    amo_number: cleanText(body.amo_number ?? body.amoNumber, 120),
    emergency_contact_name: cleanText(body.emergency_name ?? body.emergencyContactName, 240),
    emergency_contact_phone: cleanText(body.emergency_phone ?? body.emergencyContactPhone, 80),
    emergency_contact_relation: cleanText(body.emergency_relation ?? body.emergencyContactRelation, 120),
    source: 'hr-employees-command-center',
    updated_at: new Date().toISOString(),
  }
  if (creating) row.created_at = new Date().toISOString()
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined))
}

async function audit(input: {
  employeeId: string
  actorId: string
  actorName: string
  tenantId: string | null
  organizationId: string | null
  eventType: string
  action: string
  title: string
  beforeState?: DbRow
  afterState?: DbRow
  metadata?: JsonObject
}) {
  const db = await createServiceClient()
  const response = await db.from('hr_employee_360_audit_events').insert({
    employee_id: input.employeeId,
    tenant_id: input.tenantId,
    organization_id: input.organizationId,
    event_type: input.eventType,
    domain: 'identity',
    action: input.action,
    title: input.title,
    actor_id: input.actorId,
    actor_name: input.actorName,
    before_state: input.beforeState || {},
    after_state: input.afterState || {},
    metadata: input.metadata || {},
    correlation_id: randomUUID(),
    created_at: new Date().toISOString(),
  })
  if (response.error) throw new Error(`Échec audit Employee 360: ${response.error.message}`)
}

function refreshEmployeeRoutes(employeeId?: string) {
  ;['/hr', '/hr/employees', '/hr/staff', '/hr/onboarding', '/hr/training', '/hr/audit'].forEach((path) => revalidatePath(path))
  if (employeeId) revalidatePath(`/hr/employees/${employeeId}`)
}

export async function GET(request: Request) {
  try {
    const actor = await requireEmployee360Actor('read')
    const url = new URL(request.url)
    const id = cleanText(url.searchParams.get('id'), 100)
    const email = cleanText(url.searchParams.get('email'), 320)
    const db = await createServiceClient()

    let query = db.from('hr_staff_profiles').select('*')
    if (id) query = query.eq('id', id)
    else if (email) query = query.eq('email', email)
    else return NextResponse.json({ ok: false, error: 'Identifiant ou email requis.' }, { status: 400 })

    const response = await query.maybeSingle()
    if (response.error || !response.data) {
      return NextResponse.json({ ok: false, error: 'Collaborateur introuvable.' }, { status: 404 })
    }

    const aggregate = await loadEmployee360Aggregate(String(response.data.id), actor)
    return NextResponse.json({
      ok: true,
      employee: {
        ...response.data,
        __sync: {
          attendance: aggregate.domains.attendance.length,
          leave: aggregate.domains.leave.length,
          payroll: aggregate.domains.payroll.length,
          documents: aggregate.domains.documents.length,
          contracts: aggregate.domains.contracts.length,
          roster: aggregate.domains.planning.length,
          training: aggregate.domains.training.length,
          performance: aggregate.domains.performance.length,
          onboarding: aggregate.domains.onboarding.length,
          readiness: aggregate.summary.readiness,
          risk: aggregate.summary.risk,
        },
      },
      table: 'hr_staff_profiles',
      aggregate,
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json({ ok: false, error: detail.message, code: detail.code }, { status: detail.status || 500 })
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireEmployee360Actor('editProfile')
    const body = await request.json() as Record<string, unknown>
    if (!cleanText(body.first_name ?? body.firstName ?? body.full_name ?? body.fullName ?? body.email, 320)) {
      return NextResponse.json({ ok: false, error: 'Nom ou email requis.' }, { status: 400 })
    }

    const db = await createServiceClient()
    const row = {
      ...profilePayload(body, true, actor.access.manageCompensation),
      tenant_id: actor.tenantId,
      organization_id: actor.organizationId,
      version: 1,
      created_by: actor.id,
      updated_by: actor.id,
    }
    const insert = await db.from('hr_staff_profiles').insert(row).select('*').single()
    if (insert.error || !insert.data) {
      return NextResponse.json({ ok: false, error: insert.error?.message || 'Création impossible.' }, { status: 500 })
    }

    try {
      await audit({
        employeeId: String(insert.data.id),
        actorId: actor.id,
        actorName: actor.name,
        tenantId: actor.tenantId,
        organizationId: actor.organizationId,
        eventType: 'employee_created',
        action: 'employee.create',
        title: 'Collaborateur créé',
        afterState: insert.data,
      })
    } catch (error) {
      await db.from('hr_staff_profiles').delete().eq('id', insert.data.id)
      throw error
    }

    refreshEmployeeRoutes(String(insert.data.id))
    return NextResponse.json({ ok: true, employee: insert.data, table: 'hr_staff_profiles' })
  } catch (error) {
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json({ ok: false, error: detail.message, code: detail.code }, { status: detail.status || 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireEmployee360Actor('editProfile')
    const url = new URL(request.url)
    const body = await request.json() as Record<string, unknown>
    const id = cleanText(body.id ?? url.searchParams.get('id'), 100)
    if (!id) return NextResponse.json({ ok: false, error: 'Identifiant collaborateur requis.' }, { status: 400 })

    const db = await createServiceClient()
    const before = await db.from('hr_staff_profiles').select('*').eq('id', id).maybeSingle()
    if (before.error || !before.data) return NextResponse.json({ ok: false, error: 'Collaborateur introuvable.' }, { status: 404 })

    const expectedVersion = cleanNumber(body.expectedVersion ?? body.version) || cleanNumber(before.data.version) || 1
    if ((actor.tenantId && before.data.tenant_id && actor.tenantId !== String(before.data.tenant_id)) ||
        (actor.organizationId && before.data.organization_id && actor.organizationId !== String(before.data.organization_id))) {
      return NextResponse.json({ ok: false, error: 'Périmètre collaborateur non autorisé.', code: 'SCOPE_MISMATCH' }, { status: 403 })
    }

    const patch = {
      ...profilePayload(body, false, actor.access.manageCompensation),
      updated_by: actor.id,
    }
    const update = await db.from('hr_staff_profiles').update(patch).eq('id', id).eq('version', expectedVersion).select('*').maybeSingle()
    if (update.error || !update.data) {
      return NextResponse.json({ ok: false, error: update.error?.message || 'Conflit de version.', code: update.error ? 'PROFILE_UPDATE_FAILED' : 'VERSION_CONFLICT' }, { status: update.error ? 500 : 409 })
    }

    try {
      await audit({
        employeeId: id,
        actorId: actor.id,
        actorName: actor.name,
        tenantId: actor.tenantId,
        organizationId: actor.organizationId,
        eventType: 'employee_updated',
        action: 'employee.update',
        title: 'Collaborateur mis à jour',
        beforeState: before.data,
        afterState: update.data,
      })
    } catch (error) {
      const rollback = Object.fromEntries(Object.entries(before.data).filter(([key]) => !['id', 'version', 'created_at', 'updated_at'].includes(key)))
      await db.from('hr_staff_profiles').update(rollback).eq('id', id)
      throw error
    }

    refreshEmployeeRoutes(id)
    return NextResponse.json({ ok: true, employee: update.data, table: 'hr_staff_profiles' })
  } catch (error) {
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json({ ok: false, error: detail.message, code: detail.code }, { status: detail.status || 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireEmployee360Actor('archive')
    const url = new URL(request.url)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const id = cleanText(body.id ?? url.searchParams.get('id'), 100)
    const reason = cleanText(body.reason, 5000)
    const permanentRequested = cleanBoolean(body.confirm_hard_delete) || url.searchParams.get('permanent') === 'true'

    if (permanentRequested) {
      return NextResponse.json({
        ok: false,
        error: 'La suppression définitive n’est pas disponible depuis l’interface RH. Utilisez l’archivage contrôlé.',
        code: 'HARD_DELETE_DISABLED',
      }, { status: 409 })
    }
    if (!id || !reason) {
      return NextResponse.json({ ok: false, error: 'Identifiant et justification d’archivage requis.' }, { status: 400 })
    }

    const db = await createServiceClient()
    const before = await db.from('hr_staff_profiles').select('*').eq('id', id).maybeSingle()
    if (before.error || !before.data) return NextResponse.json({ ok: false, error: 'Collaborateur introuvable.' }, { status: 404 })
    if ((actor.tenantId && before.data.tenant_id && actor.tenantId !== String(before.data.tenant_id)) ||
        (actor.organizationId && before.data.organization_id && actor.organizationId !== String(before.data.organization_id))) {
      return NextResponse.json({ ok: false, error: 'Périmètre collaborateur non autorisé.', code: 'SCOPE_MISMATCH' }, { status: 403 })
    }
    const expectedVersion = cleanNumber(body.expectedVersion ?? body.version) || cleanNumber(before.data.version) || 1

    const update = await db.from('hr_staff_profiles').update({
      employment_status: 'archived',
      status: 'archived',
      lifecycle_state: 'archived',
      archived_at: new Date().toISOString(),
      archived_by: actor.id,
      archive_reason: reason,
      updated_by: actor.id,
    }).eq('id', id).eq('version', expectedVersion).select('*').maybeSingle()

    if (update.error || !update.data) return NextResponse.json({ ok: false, error: update.error?.message || 'Archivage impossible ou conflit de version.', code: update.error ? 'ARCHIVE_FAILED' : 'VERSION_CONFLICT' }, { status: update.error ? 500 : 409 })

    try {
      await audit({
        employeeId: id,
        actorId: actor.id,
        actorName: actor.name,
        tenantId: actor.tenantId,
        organizationId: actor.organizationId,
        eventType: 'employee_archived',
        action: 'employee.archive',
        title: 'Collaborateur archivé',
        beforeState: before.data,
        afterState: update.data,
        metadata: { reason },
      })
    } catch (error) {
      const rollback = Object.fromEntries(Object.entries(before.data).filter(([key]) => !['id', 'version', 'created_at', 'updated_at'].includes(key)))
      await db.from('hr_staff_profiles').update(rollback).eq('id', id)
      throw error
    }

    refreshEmployeeRoutes(id)
    return NextResponse.json({ ok: true, mode: 'controlled_archive', employee: update.data })
  } catch (error) {
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json({ ok: false, error: detail.message, code: detail.code }, { status: detail.status || 500 })
  }
}
