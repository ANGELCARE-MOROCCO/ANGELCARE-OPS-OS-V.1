import { getHRDashboardData } from './repository'
import { createClient } from '@/lib/supabase/server'

export type EmployeeCommandRow = Record<string, any> & {
  __sync?: {
    attendance: number
    leave: number
    payroll: number
    contracts: number
    documents: number
    performance: number
    training: number
    roster: number
    onboarding: number
    risk: number
    readiness: number
    profileKey: string
  }
}

function s(v: any) { return String(v ?? '').trim() }
function lower(v: any) { return s(v).toLowerCase() }
function first(row: any, keys: string[], fallback = '—') {
  for (const key of keys) if (s(row?.[key])) return s(row[key])
  return fallback
}

function userBridgeKey(value: any) {
  return lower(value)
}

function userBridgeEmail(row: any) {
  return userBridgeKey(row?.email || row?.user_email || row?.username || row?.work_email || row?.personal_email)
}

function userBridgeIds(row: any) {
  return [
    row?.user_id,
    row?.app_user_id,
    row?.auth_user_id,
    row?.profile_id,
  ].map(userBridgeKey).filter(Boolean)
}

function employeeKeys(row: any) {
  return new Set([row?.id, row?.staff_id, row?.employee_id, row?.user_id, row?.profile_id, row?.email, row?.full_name, row?.name].map((x) => lower(x)).filter(Boolean))
}
function belongsTo(row: any, keys: Set<string>) {
  const candidates = [row?.id, row?.staff_id, row?.employee_id, row?.user_id, row?.profile_id, row?.email, row?.staff_email, row?.employee_email, row?.full_name, row?.name]
  return candidates.some((x) => keys.has(lower(x)))
}
function countRelated(rows: any[], keys: Set<string>) { return rows.filter((x) => belongsTo(x, keys)).length }
function isOpen(row: any) {
  const status = lower(row?.status || row?.request_status || row?.approval_status || row?.state)
  return !status || ['open', 'pending', 'requested', 'draft', 'active', 'in_progress'].some((x) => status.includes(x))
}
function isActiveEmployee(row: any) {
  const status = lower(row?.employment_status || row?.status || 'active')
  return !status.includes('archiv') && !status.includes('inactive') && !status.includes('terminated')
}
function readiness(row: any, rel: Record<string, number>) {
  let score = 100
  if (!s(row.email)) score -= 12
  if (!s(row.phone)) score -= 10
  if (!s(row.department)) score -= 10
  if (!s(row.position)) score -= 10
  if (!s(row.city)) score -= 6
  if (rel.contracts < 1) score -= 12
  if (rel.documents < 1) score -= 10
  if (rel.attendance < 1) score -= 4
  if (lower(row.employment_status || row.status).includes('archiv')) score -= 30
  return Math.max(0, Math.min(100, score))
}
function risk(row: any, rel: Record<string, number>, ready: number) {
  let score = 100 - ready
  if (rel.leave > 2) score += 8
  if (rel.performance < 1) score += 6
  if (rel.training < 1) score += 5
  if (lower(row.employment_status || row.status).includes('archiv')) score += 20
  return Math.max(0, Math.min(100, score))
}

export async function getHREmployeesCommandData() {
  const data = await getHRDashboardData()

  let appUsers: any[] = []
  try {
    const supabase = await createClient()
    const { data: users } = await supabase.from('app_users').select('*').limit(2000)
    appUsers = Array.isArray(users) ? users : []
  } catch {
    appUsers = []
  }

  const usersById = new Map((appUsers.map((user) => [userBridgeKey(user?.id), user]).filter(([key]) => Boolean(key))) as Array<[string, Record<string, any>]>)
  const usersByEmail = new Map((appUsers.map((user) => [userBridgeEmail(user), user]).filter(([key]) => Boolean(key))) as Array<[string, Record<string, any>]>)

  function linkedUserForEmployee(employee: any) {
    for (const candidate of userBridgeIds(employee)) {
      const found = usersById.get(candidate)
      if (found) return found
    }

    const email = userBridgeEmail(employee)
    if (email) {
      const found = usersByEmail.get(email)
      if (found) return found
    }

    return null
  }

  const employees: EmployeeCommandRow[] = (data.staff || []).map((employee: any) => {
    const keys = employeeKeys(employee)
    const rel = {
      attendance: countRelated(data.attendance || [], keys),
      leave: (data.leave || []).filter((x: any) => belongsTo(x, keys) && isOpen(x)).length,
      payroll: countRelated(data.payroll || [], keys),
      contracts: countRelated(data.contracts || [], keys),
      documents: countRelated(data.documents || [], keys),
      performance: countRelated(data.performance || [], keys),
      training: countRelated(data.training || [], keys),
      roster: countRelated(data.rosters || [], keys),
      onboarding: countRelated(data.onboarding || [], keys),
    }
    const ready = readiness(employee, rel)
    const linkedUser = linkedUserForEmployee(employee)
    const linkedUserId = s(linkedUser?.id)
    const linkedUserEmail = s(linkedUser?.email || linkedUser?.username)

    return {
      ...employee,
      app_user_id: linkedUserId || employee.app_user_id || employee.user_id || null,
      user_system_id: linkedUserId || null,
      user_system_email: linkedUserEmail || s(employee.email || employee.user_email || employee.username),
      user_system_href: linkedUserId ? `/users/${encodeURIComponent(linkedUserId)}` : linkedUserEmail ? `/users/${encodeURIComponent(linkedUserEmail)}` : '',
      __userSystem: linkedUser ? {
        id: linkedUserId,
        email: linkedUserEmail,
        username: s(linkedUser.username),
        full_name: s(linkedUser.full_name || linkedUser.name || linkedUser.display_name),
        href: linkedUserId ? `/users/${encodeURIComponent(linkedUserId)}` : '',
      } : null,
      __sync: { ...rel, readiness: ready, risk: risk(employee, rel, ready), profileKey: first(employee, ['id', 'user_id', 'profile_id', 'email', 'full_name'], 'unknown') },
    }
  })

  const active = employees.filter(isActiveEmployee)
  const archived = employees.filter((x) => !isActiveEmployee(x))
  const departments = Array.from(new Set(employees.map((x) => first(x, ['department'], '')).filter(Boolean)))
  const cities = Array.from(new Set(employees.map((x) => first(x, ['city'], '')).filter(Boolean)))
  const avgReadiness = employees.length ? Math.round(employees.reduce((a, x) => a + Number(x.__sync?.readiness || 0), 0) / employees.length) : 0
  const avgRisk = employees.length ? Math.round(employees.reduce((a, x) => a + Number(x.__sync?.risk || 0), 0) / employees.length) : 0
  const incompleteProfiles = employees.filter((x) => Number(x.__sync?.readiness || 0) < 75)

  const departmentBreakdown = departments.map((name) => {
    const scoped = employees.filter((x) => first(x, ['department'], '') === name)
    return { name, total: scoped.length, active: scoped.filter(isActiveEmployee).length, readiness: scoped.length ? Math.round(scoped.reduce((a, x) => a + Number(x.__sync?.readiness || 0), 0) / scoped.length) : 0 }
  }).sort((a, b) => b.total - a.total)
  const cityBreakdown = cities.map((name) => ({ name, total: employees.filter((x) => first(x, ['city'], '') === name).length })).sort((a, b) => b.total - a.total)

  return {
    loadedAt: data.loadedAt,
    errors: data.errors || ({} as Record<string, any>),
    employees,
    active,
    archived,
    departments,
    cities,
    departmentBreakdown,
    cityBreakdown,
    avgReadiness,
    avgRisk,
    incompleteProfiles,
    totals: {
      employees: employees.length,
      active: active.length,
      archived: archived.length,
      departments: departments.length,
      cities: cities.length,
      attendance: data.attendance?.length || 0,
      leave: data.leave?.length || 0,
      payroll: data.payroll?.length || 0,
      contracts: data.contracts?.length || 0,
      documents: data.documents?.length || 0,
      performance: data.performance?.length || 0,
      onboarding: data.onboarding?.length || 0,
      training: data.training?.length || 0,
      rosters: data.rosters?.length || 0,
      approvals: data.approvals?.length || 0,
    },
  }
}
