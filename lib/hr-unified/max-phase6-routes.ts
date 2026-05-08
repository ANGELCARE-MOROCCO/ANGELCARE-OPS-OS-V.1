export type HRRouteGroup = {
  title: string
  description: string
  routes: {
    label: string
    href: string
    description: string
    priority: 'core' | 'high' | 'medium' | 'support'
  }[]
}

export const HR_PHASE6_ROUTE_GROUPS: HRRouteGroup[] = [
  {
    title: 'Command & Executive',
    description: 'Main command spaces, leadership cockpit, analytics and system health.',
    routes: [
      { label: 'HR Dashboard', href: '/hr', description: 'Main HR command dashboard.', priority: 'core' },
      { label: 'Control Room', href: '/hr/control-room', description: 'Central command expansion workspace.', priority: 'core' },
      { label: 'Executive Cockpit', href: '/hr/executive', description: 'Executive HR cockpit.', priority: 'high' },
      { label: 'Analytics', href: '/hr/analytics', description: 'Management-grade HR analytics.', priority: 'high' },
      { label: 'System Health', href: '/hr/system-health', description: 'Route and module consistency checks.', priority: 'high' },
      { label: 'Route Map', href: '/hr/route-map', description: 'Complete HR route inventory.', priority: 'support' },
      { label: 'Navigation Hub', href: '/hr/navigation', description: 'Full HR navigation board.', priority: 'support' },
    ],
  },
  {
    title: 'Hiring & Recruitment',
    description: 'Openings, candidates, interviews, sources and pipeline execution.',
    routes: [
      { label: 'Openings', href: '/hr/openings', description: 'Opening jobs workspace.', priority: 'core' },
      { label: 'New Opening', href: '/hr/openings/new', description: 'Create job opening.', priority: 'high' },
      { label: 'Openings Board', href: '/hr/openings/board', description: 'Board view by opening status.', priority: 'medium' },
      { label: 'Recruitment', href: '/hr/recruitment', description: 'Recruitment command center.', priority: 'core' },
      { label: 'Candidates', href: '/hr/recruitment/candidates', description: 'Candidate intake and database.', priority: 'core' },
      { label: 'Recruitment Kanban', href: '/hr/recruitment/kanban', description: 'Candidate stage board.', priority: 'high' },
      { label: 'Interviews', href: '/hr/recruitment/interviews', description: 'Interview scheduling and scoring.', priority: 'medium' },
      { label: 'Sources', href: '/hr/recruitment/sources', description: 'Recruitment source control.', priority: 'medium' },
    ],
  },
  {
    title: 'People Operations',
    description: 'Staff 360, departments, positions, training and documents.',
    routes: [
      { label: 'Staff 360', href: '/hr/staff', description: 'Staff profile database.', priority: 'core' },
      { label: 'New Staff', href: '/hr/staff/new', description: 'Create staff profile.', priority: 'high' },
      { label: 'Departments', href: '/hr/departments', description: 'Department control.', priority: 'medium' },
      { label: 'Positions', href: '/hr/positions', description: 'Position matrix.', priority: 'medium' },
      { label: 'Documents', href: '/hr/documents', description: 'Document verification center.', priority: 'high' },
      { label: 'Training', href: '/hr/training', description: 'Training readiness center.', priority: 'medium' },
      { label: 'Contracts', href: '/hr/contracts', description: 'Contract request workspace.', priority: 'medium' },
    ],
  },
  {
    title: 'Operations & Planning',
    description: 'Rosters, attendance, onboarding, calendar and workforce intelligence.',
    routes: [
      { label: 'Onboarding', href: '/hr/onboarding', description: 'Onboarding execution.', priority: 'core' },
      { label: 'Onboarding Board', href: '/hr/onboarding/board', description: 'Onboarding status board.', priority: 'high' },
      { label: 'Checklists', href: '/hr/onboarding/checklists', description: 'Onboarding templates.', priority: 'medium' },
      { label: 'Rosters', href: '/hr/rosters', description: 'Roster workspace.', priority: 'core' },
      { label: 'Roster Planner', href: '/hr/rosters/planner', description: 'Roster planning and creation.', priority: 'high' },
      { label: 'Roster Conflicts', href: '/hr/rosters/conflicts', description: 'Planning risk control.', priority: 'high' },
      { label: 'Attendance', href: '/hr/attendance', description: 'Attendance records.', priority: 'core' },
      { label: 'Attendance Corrections', href: '/hr/attendance/corrections', description: 'Correction workflow.', priority: 'high' },
      { label: 'Calendar', href: '/hr/calendar', description: 'HR calendar events.', priority: 'medium' },
      { label: 'Mission Staffing', href: '/hr/workforce/missions', description: 'Mission staffing intelligence.', priority: 'medium' },
      { label: 'Workforce Forecast', href: '/hr/workforce/forecast', description: 'Forward staffing pressure.', priority: 'medium' },
      { label: 'Workforce Intelligence', href: '/hr/workforce-intelligence', description: 'Workforce intelligence page.', priority: 'support' },
    ],
  },
  {
    title: 'Governance & Execution',
    description: 'Tasks, approvals, audit, compliance, playbooks and quality controls.',
    routes: [
      { label: 'Tasks', href: '/hr/tasks', description: 'HR execution task engine.', priority: 'core' },
      { label: 'Approvals', href: '/hr/approvals', description: 'Approval center.', priority: 'core' },
      { label: 'Compliance', href: '/hr/compliance', description: 'Compliance center.', priority: 'high' },
      { label: 'Audit', href: '/hr/audit', description: 'Audit traceability.', priority: 'high' },
      { label: 'Reports', href: '/hr/reports', description: 'HR reports.', priority: 'high' },
      { label: 'Export', href: '/hr/reports/export', description: 'HR export snapshot.', priority: 'medium' },
      { label: 'Notifications', href: '/hr/notifications', description: 'HR notification center.', priority: 'medium' },
      { label: 'Playbooks', href: '/hr/playbooks', description: 'Operating playbooks.', priority: 'medium' },
      { label: 'Templates', href: '/hr/templates', description: 'Reusable HR templates.', priority: 'medium' },
      { label: 'Bulk Actions', href: '/hr/bulk-actions', description: 'Batch action center.', priority: 'medium' },
      { label: 'Quality', href: '/hr/quality', description: 'Quality reviews.', priority: 'medium' },
      { label: 'Escalations', href: '/hr/escalations', description: 'Escalation control.', priority: 'high' },
      { label: 'Payroll', href: '/hr/payroll', description: 'Payroll bridge.', priority: 'medium' },
      { label: 'Settings', href: '/hr/settings', description: 'HR configuration reference.', priority: 'support' },
    ],
  },
]

export const HR_PHASE6_ALL_ROUTES = HR_PHASE6_ROUTE_GROUPS.flatMap((group) =>
  group.routes.map((route) => ({ ...route, group: group.title }))
)
