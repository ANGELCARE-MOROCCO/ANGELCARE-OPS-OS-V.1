import { createClient } from '@/lib/supabase/server'

type AnyRecord = Record<string, any>

async function safeSelect(supabase: any, table: string, select = '*', limit = 20) {
  try {
    const { data, error } = await supabase.from(table).select(select).limit(limit)
    if (error) return { rows: [], error: error.message, exists: false }
    return { rows: data || [], error: null, exists: true }
  } catch (e: any) {
    return { rows: [], error: e?.message || 'Unavailable', exists: false }
  }
}

export async function getHrFinalCoreSnapshot() {
  const supabase = await createClient()

  const [
    users,
    staffProfiles,
    positions,
    departments,
    rosters,
    leaveRequests,
    approvals,
    docs,
    performance,
    certifications,
    discipline,
    notifications,
    activity,
    syncSources,
    payrollPeriods,
    payrollItems,
    compliance,
    intelligence,
    missions,
    tasks,
    incidents,
    caregivers,
  ] = await Promise.all([
    safeSelect(supabase, 'users', '*', 50),
    safeSelect(supabase, 'hr_staff_profiles', '*', 50),
    safeSelect(supabase, 'hr_positions', '*', 100),
    safeSelect(supabase, 'hr_departments', '*', 50),
    safeSelect(supabase, 'hr_rosters', '*', 80),
    safeSelect(supabase, 'hr_leave_requests', '*', 80),
    safeSelect(supabase, 'hr_approval_requests', '*', 80),
    safeSelect(supabase, 'hr_staff_documents', '*', 80),
    safeSelect(supabase, 'hr_performance_reviews', '*', 80),
    safeSelect(supabase, 'hr_certifications', '*', 80),
    safeSelect(supabase, 'hr_disciplinary_actions', '*', 80),
    safeSelect(supabase, 'hr_staff_notifications', '*', 80),
    safeSelect(supabase, 'hr_activity_events', '*', 80),
    safeSelect(supabase, 'hr_sync_sources', '*', 50),
    safeSelect(supabase, 'hr_payroll_periods', '*', 20),
    safeSelect(supabase, 'hr_payroll_items', '*', 100),
    safeSelect(supabase, 'hr_compliance_checks', '*', 100),
    safeSelect(supabase, 'hr_intelligence_alerts', '*', 100),
    safeSelect(supabase, 'missions', '*', 50),
    safeSelect(supabase, 'tasks', '*', 50),
    safeSelect(supabase, 'incidents', '*', 50),
    safeSelect(supabase, 'caregivers', '*', 50),
  ])

  const staffCount = Math.max(staffProfiles.rows.length, users.rows.length)
  const openLeaves = leaveRequests.rows.filter((r: AnyRecord) => String(r.status || '').toLowerCase() === 'pending').length
  const activeAlerts = intelligence.rows.filter((r: AnyRecord) => String(r.status || '').toLowerCase() === 'active').length
  const openCompliance = compliance.rows.filter((r: AnyRecord) => ['open','pending','overdue'].includes(String(r.status || '').toLowerCase())).length
  const scheduledRoster = rosters.rows.filter((r: AnyRecord) => ['scheduled','confirmed','active'].includes(String(r.status || '').toLowerCase())).length

  const sources = [
    ['users', users],
    ['staff_profiles', staffProfiles],
    ['positions', positions],
    ['departments', departments],
    ['rosters', rosters],
    ['leave', leaveRequests],
    ['approvals', approvals],
    ['documents', docs],
    ['performance', performance],
    ['certifications', certifications],
    ['discipline', discipline],
    ['notifications', notifications],
    ['missions', missions],
    ['tasks', tasks],
    ['incidents', incidents],
    ['caregivers', caregivers],
  ].map(([key, value]: any) => ({
    key,
    exists: value.exists,
    count: value.rows.length,
    error: value.error,
  }))

  const commandCards = [
    { label: 'Staff coverage', value: staffCount, detail: 'Known users/staff profiles', href: '/hr/staff' },
    { label: 'Roster duties', value: scheduledRoster, detail: 'Scheduled / active shifts', href: '/hr/roster/monthly' },
    { label: 'Pending leave', value: openLeaves, detail: 'Awaiting HR decision', href: '/hr/leave' },
    { label: 'Compliance risks', value: openCompliance, detail: 'Open controls/checks', href: '/hr/compliance-center' },
    { label: 'HR alerts', value: activeAlerts, detail: 'Active intelligence alerts', href: '/hr/intelligence' },
    { label: 'Payroll periods', value: payrollPeriods.rows.length, detail: 'Draft/approved payroll prep', href: '/hr/payroll-prep' },
  ]

  const unifiedFeed = [
    ...activity.rows.map((r: AnyRecord) => ({
      title: r.title,
      subtitle: r.description || r.event_type,
      type: r.source || 'hr',
      status: r.status || 'open',
      href: '/hr/actions',
      created_at: r.created_at,
    })),
    ...leaveRequests.rows.slice(0, 10).map((r: AnyRecord) => ({
      title: `Leave request: ${r.status || 'pending'}`,
      subtitle: `${r.start_date || ''} → ${r.end_date || ''}`,
      type: 'leave',
      status: r.status || 'pending',
      href: '/hr/leave',
      created_at: r.created_at,
    })),
    ...approvals.rows.slice(0, 10).map((r: AnyRecord) => ({
      title: `Approval: ${r.type || 'request'}`,
      subtitle: `Status: ${r.status || 'pending'}`,
      type: 'approval',
      status: r.status || 'pending',
      href: '/hr/approvals',
      created_at: r.created_at,
    })),
    ...intelligence.rows.slice(0, 10).map((r: AnyRecord) => ({
      title: r.title,
      subtitle: r.message,
      type: r.alert_type || 'alert',
      status: r.severity || 'info',
      href: r.route || '/hr/intelligence',
      created_at: r.created_at,
    })),
  ].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))).slice(0, 18)

  return {
    staffCount,
    commandCards,
    sources,
    unifiedFeed,
    rows: {
      users: users.rows,
      staffProfiles: staffProfiles.rows,
      positions: positions.rows,
      departments: departments.rows,
      rosters: rosters.rows,
      leaveRequests: leaveRequests.rows,
      approvals: approvals.rows,
      docs: docs.rows,
      performance: performance.rows,
      certifications: certifications.rows,
      discipline: discipline.rows,
      notifications: notifications.rows,
      activity: activity.rows,
      syncSources: syncSources.rows,
      payrollPeriods: payrollPeriods.rows,
      payrollItems: payrollItems.rows,
      compliance: compliance.rows,
      intelligence: intelligence.rows,
      missions: missions.rows,
      tasks: tasks.rows,
      incidents: incidents.rows,
      caregivers: caregivers.rows,
    },
  }
}
