import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext } from './context'

async function getSchoolId(explicitSchoolId?: string | null) {
  if (explicitSchoolId) return explicitSchoolId
  const context = await getAngelcare360AccessContext()
  return context?.school?.id ?? null
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

export async function listAngelcare360Schools() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_schools')
    .select('id, school_code, name, legal_name, status, language, currency, timezone, city, created_at, updated_at')
    .order('name', { ascending: true })

  return (data || []) as Array<Record<string, unknown>>
}

export async function getAngelcare360ActiveSchool(explicitSchoolId?: string | null) {
  const supabase = await createClient()

  if (explicitSchoolId) {
    const { data } = await supabase
      .from('angelcare360_schools')
      .select('id, school_code, name, legal_name, status, language, currency, timezone, city')
      .eq('id', explicitSchoolId)
      .maybeSingle()

    return data ?? null
  }

  const { data } = await supabase
    .from('angelcare360_schools')
    .select('id, school_code, name, legal_name, status, language, currency, timezone, city')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data ?? null
}

export async function listAngelcare360AcademicYears(schoolId?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_academic_years')
    .select('id, school_id, year_code, label, starts_on, ends_on, is_current, status')
    .eq('school_id', resolvedSchoolId)
    .order('starts_on', { ascending: false })

  return data ?? []
}

export async function listAngelcare360Roles(schoolId?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_roles')
    .select('id, school_id, role_key, label, description, scope, is_system_locked, status, created_at, updated_at')
    .eq('school_id', resolvedSchoolId)
    .order('label', { ascending: true })

  return data ?? []
}

export async function listAngelcare360Permissions() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('angelcare360_permissions')
    .select('permission_key, domain_key, action_key, label, description, risk_level, status, created_at, updated_at')
    .order('domain_key', { ascending: true })
    .order('action_key', { ascending: true })

  return data ?? []
}

export async function listAngelcare360Students(schoolId?: string | null, search?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_students')
    .select('id, school_id, student_code, first_name, last_name, full_name, admission_status, status, current_class_id, current_section_id, portal_app_user_id, created_at, updated_at')
    .eq('school_id', resolvedSchoolId)
    .order('full_name', { ascending: true })
    .limit(200)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,student_code.ilike.%${search}%`)
  }

  const { data } = await query
  return data ?? []
}

export async function listAngelcare360Parents(schoolId?: string | null, search?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_parents')
    .select('id, school_id, parent_code, first_name, last_name, full_name, email, phone, status, portal_app_user_id, created_at, updated_at')
    .eq('school_id', resolvedSchoolId)
    .order('full_name', { ascending: true })
    .limit(200)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,parent_code.ilike.%${search}%`)
  }

  const { data } = await query
  return data ?? []
}

export async function listAngelcare360Staff(schoolId?: string | null, search?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_staff')
    .select('id, school_id, staff_code, first_name, last_name, full_name, staff_type, email, phone, status, portal_app_user_id, created_at, updated_at')
    .eq('school_id', resolvedSchoolId)
    .order('full_name', { ascending: true })
    .limit(250)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,staff_code.ilike.%${search}%`)
  }

  const { data } = await query
  return data ?? []
}

export async function listAngelcare360Classes(schoolId?: string | null, academicYearId?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return []
  const supabase = await createClient()
  let query = supabase
    .from('angelcare360_classes')
    .select('id, school_id, academic_year_id, class_code, name, level, capacity, status, order_index, homeroom_staff_id, created_at, updated_at')
    .eq('school_id', resolvedSchoolId)
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })

  if (academicYearId) query = query.eq('academic_year_id', academicYearId)

  const { data } = await query
  return data ?? []
}

export async function listAngelcare360AttendanceFoundation(schoolId?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return null

  const [sessions, records, justifications, slots, calendarEvents] = await Promise.all([
    countRows('angelcare360_attendance_sessions', resolvedSchoolId),
    countRows('angelcare360_attendance_records', resolvedSchoolId),
    countRows('angelcare360_attendance_justifications', resolvedSchoolId),
    countRows('angelcare360_timetable_slots', resolvedSchoolId),
    countRows('angelcare360_school_calendar_events', resolvedSchoolId),
  ])

  return {
    schoolId: resolvedSchoolId,
    sessions,
    records,
    justifications,
    slots,
    calendarEvents,
  }
}

export async function listAngelcare360FinanceFoundation(schoolId?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return null

  const [invoices, payments, reminders, expenses] = await Promise.all([
    countRows('angelcare360_invoices', resolvedSchoolId),
    countRows('angelcare360_payments', resolvedSchoolId),
    countRows('angelcare360_payment_reminders', resolvedSchoolId),
    countRows('angelcare360_expenses', resolvedSchoolId),
  ])

  return {
    schoolId: resolvedSchoolId,
    invoices,
    payments,
    reminders,
    expenses,
  }
}

export async function getAngelcare360DashboardFoundation(schoolId?: string | null) {
  const resolvedSchoolId = await getSchoolId(schoolId)
  if (!resolvedSchoolId) return null

  const supabase = await createClient()
  const [school, years, students, parents, staff, classes, admissions, invoices, payments, auditLogs] = await Promise.all([
    getAngelcare360ActiveSchool(resolvedSchoolId),
    countRows('angelcare360_academic_years', resolvedSchoolId),
    countRows('angelcare360_students', resolvedSchoolId),
    countRows('angelcare360_parents', resolvedSchoolId),
    countRows('angelcare360_staff', resolvedSchoolId),
    countRows('angelcare360_classes', resolvedSchoolId),
    countRows('angelcare360_admission_leads', resolvedSchoolId),
    countRows('angelcare360_invoices', resolvedSchoolId),
    countRows('angelcare360_payments', resolvedSchoolId),
    countRows('angelcare360_audit_logs', resolvedSchoolId),
  ])

  const { data: latestAcademicYears } = await supabase
    .from('angelcare360_academic_years')
    .select('id, school_id, year_code, label, starts_on, ends_on, is_current, status')
    .eq('school_id', resolvedSchoolId)
    .order('is_current', { ascending: false })
    .order('starts_on', { ascending: false })
    .limit(3)

  const attendance = await listAngelcare360AttendanceFoundation(resolvedSchoolId)
  const finance = await listAngelcare360FinanceFoundation(resolvedSchoolId)

  return {
    school,
    latestAcademicYears: latestAcademicYears ?? [],
    counts: {
      academicYears: years,
      students,
      parents,
      staff,
      classes,
      admissions,
      invoices,
      payments,
      auditLogs,
    },
    attendance,
    finance,
  }
}
