import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import UsersEmployeeCommandClient, { type UserStaffRecord } from './_components/UsersEmployeeCommandClient'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>

const DELETE_PERMISSION_KEYS = new Set(['*', 'users.delete', 'admin.manage'])
const ADMIN_DELETE_ROLES = new Set(['ceo', 'direction', 'admin', 'super_admin', 'owner', 'root', 'root_admin'])

async function readTable(table: string, columns = '*', limit = 500) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from(table).select(columns).limit(limit)
    return (data || []) as unknown as Row[]
  } catch {
    return [] as Row[]
  }
}

function key(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function normalizeRole(value: unknown) {
  return key(value).replace(/[\s-]+/g, '_')
}

function permissionsFor(row: Row) {
  return Array.isArray(row.permissions) ? row.permissions.map(String) : []
}

function canPermanentlyDeleteUsers(row: Row) {
  const role = normalizeRole(row.role)
  const permissions = permissionsFor(row)
  return ADMIN_DELETE_ROLES.has(role) || permissions.some((permission) => DELETE_PERMISSION_KEYS.has(permission))
}

function pick(row: Row | undefined, keys: string[], fallback: unknown = null) {
  if (!row) return fallback
  for (const name of keys) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') return row[name]
  }
  return fallback
}

function normalizeStatus(value: unknown) {
  const raw = key(value)
  if (['active', 'enabled', 'available', 'actif'].includes(raw)) return 'active'
  if (['inactive', 'disabled', 'suspended', 'archived'].includes(raw)) return raw
  return raw || 'active'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'
}

function countRelated(rows: Row[], staff: Row | undefined, user: Row) {
  const staffId = key(pick(staff, ['id', 'staff_id', 'profile_id']))
  const userId = key(pick(user, ['id', 'user_id', 'profile_id']))
  const email = key(pick(user, ['email']))
  return rows.filter((row) => {
    const rowStaff = key(pick(row, ['staff_id', 'employee_id', 'profile_id', 'user_id']))
    const rowEmail = key(pick(row, ['email', 'staff_email', 'employee_email']))
    return (staffId && rowStaff === staffId) || (userId && rowStaff === userId) || (email && rowEmail === email)
  }).length
}

function latestAttendance(rows: Row[], staff: Row | undefined, user: Row) {
  const staffId = key(pick(staff, ['id', 'staff_id', 'profile_id']))
  const userId = key(pick(user, ['id', 'user_id', 'profile_id']))
  const email = key(pick(user, ['email']))
  const matched = rows.filter((row) => {
    const rowStaff = key(pick(row, ['staff_id', 'employee_id', 'profile_id', 'user_id']))
    const rowEmail = key(pick(row, ['email', 'staff_email', 'employee_email']))
    return (staffId && rowStaff === staffId) || (userId && rowStaff === userId) || (email && rowEmail === email)
  })
  return matched.sort((a, b) => String(pick(b, ['work_date', 'created_at', 'punch_in_at'], '')).localeCompare(String(pick(a, ['work_date', 'created_at', 'punch_in_at'], ''))))[0]
}

function readiness(record: UserStaffRecord) {
  let score = 28
  if (record.status === 'active') score += 12
  if (record.email) score += 8
  if (record.department && record.department !== '—') score += 10
  if (record.position && record.position !== '—') score += 8
  if (record.coverage.documents > 0) score += 8
  if (record.coverage.contracts > 0) score += 8
  if (record.coverage.training > 0) score += 6
  if (record.coverage.rosters > 0) score += 5
  if (record.coverage.attendance > 0) score += 7
  return Math.max(0, Math.min(100, score))
}

export default async function UsersPage() {
  const actor = await requireRole(['ceo', 'manager', 'hr_admin', 'hr_manager', 'operations_manager'])

  const [usersRaw, staffRaw, attendance, documents, contracts, training, rosters, payroll, leave] = await Promise.all([
    readTable('app_users'),
    readTable('hr_staff_profiles'),
    readTable('hr_attendance_records'),
    readTable('hr_documents'),
    readTable('hr_contracts'),
    readTable('hr_training_records'),
    readTable('hr_roster_assignments'),
    readTable('hr_payroll_inputs'),
    readTable('hr_leave_requests'),
  ])

  const staffByEmail = new Map<string, Row>(
    staffRaw
      .map((row): [string, Row] => [key(pick(row, ['email', 'work_email', 'personal_email'])), row])
      .filter(([email]) => Boolean(email)),
  )
  const staffByUser = new Map<string, Row>(
    staffRaw
      .map((row): [string, Row] => [key(pick(row, ['user_id', 'profile_id', 'app_user_id'])), row])
      .filter(([id]) => Boolean(id)),
  )

  const users = usersRaw.map((user): UserStaffRecord => {
    const staff = staffByUser.get(key(pick(user, ['id', 'user_id', 'profile_id']))) || staffByEmail.get(key(pick(user, ['email'])))
    const name = String(pick(user, ['full_name', 'name', 'display_name'], pick(staff, ['full_name', 'name', 'display_name'], 'Unnamed user')))
    const department = String(pick(user, ['department', 'department_name'], pick(staff, ['department', 'department_name'], '—')))
    const position = String(pick(user, ['position', 'job_title', 'role_title'], pick(staff, ['position', 'job_title', 'title'], '—')))
    const status = normalizeStatus(pick(user, ['status'], pick(staff, ['status'], 'active')))
    const attendanceRow = latestAttendance(attendance, staff, user)
    const record: UserStaffRecord = {
      id: String(pick(user, ['id', 'user_id', 'profile_id'])),
      staffId: staff ? String(pick(staff, ['id', 'staff_id', 'profile_id'])) : null,
      initials: initials(name),
      fullName: name,
      email: String(pick(user, ['email'], pick(staff, ['email', 'work_email'], '')) || ''),
      username: String(pick(user, ['username'], '')),
      role: String(pick(user, ['role'], 'agent')),
      department,
      position,
      city: String(pick(user, ['city', 'location', 'work_location'], pick(staff, ['city', 'location', 'work_location'], '—'))),
      status,
      language: String(pick(user, ['language'], 'fr')),
      startDate: String(pick(staff, ['start_date', 'hire_date', 'created_at'], pick(user, ['created_at'], '')) || ''),
      manager: String(pick(staff, ['manager_name', 'reports_to_name', 'supervisor'], '—')),
      phone: String(pick(user, ['phone', 'phone_number'], pick(staff, ['phone', 'phone_number'], '')) || ''),
      lastLoginAt: String(pick(user, ['last_login_at'], '') || ''),
      createdAt: String(pick(user, ['created_at'], '') || ''),
      attendanceStatus: String(pick(attendanceRow, ['status'], 'not_pointed')),
      punchInAt: String(pick(attendanceRow, ['punch_in_at'], '') || ''),
      punchOutAt: String(pick(attendanceRow, ['punch_out_at'], '') || ''),
      coverage: {
        attendance: countRelated(attendance, staff, user),
        documents: countRelated(documents, staff, user),
        contracts: countRelated(contracts, staff, user),
        training: countRelated(training, staff, user),
        rosters: countRelated(rosters, staff, user),
        payroll: countRelated(payroll, staff, user),
        leave: countRelated(leave, staff, user),
      },
      rawUser: user,
      rawStaff: staff || null,
      readiness: 0,
      risk: 0,
    }
    record.readiness = readiness(record)
    record.risk = Math.max(0, 100 - record.readiness)
    return record
  })

  return <UsersEmployeeCommandClient initialUsers={users} loadedAt={new Date().toISOString()} currentUserId={String(actor.id)} canPermanentlyDeleteUsers={canPermanentlyDeleteUsers(actor as Row)} />
}
