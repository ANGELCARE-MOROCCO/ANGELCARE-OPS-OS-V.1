import type { StaffPortalData, StaffPortalUser } from './phase1-data'

export type StaffPortalPersona = {
  key: string
  label: string
  theme: {
    primary: string
    secondary: string
    accent: string
    surface: string
    glow: string
  }
  mission: string
  briefing: string
  workspaceFocus: string[]
  recommendedActions: { label: string; href: string; detail: string }[]
  performanceIndicators: { label: string; value: string | number; detail: string; tone: string }[]
}

function norm(value: unknown): string {
  return String(value ?? '').toLowerCase()
}

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word))
}

export function getStaffPortalPersona(user: StaffPortalUser | null, data?: Partial<StaffPortalData>): StaffPortalPersona {
  const dept = norm(user?.department)
  const role = norm(user?.role || user?.role_key)
  const position = norm(user?.position || user?.job_title)
  const combined = `${dept} ${role} ${position}`

  const isExecutive = includesAny(combined, ['ceo', 'executive', 'director', 'general manager', 'admin'])
  const isManager = includesAny(combined, ['manager', 'supervisor', 'lead', 'head'])
  const isHR = includesAny(combined, ['hr', 'human resources', 'people'])
  const isSales = includesAny(combined, ['sales', 'commercial', 'business development', 'revenue'])
  const isMarket = includesAny(combined, ['marketing', 'market', 'campaign', 'seo', 'content'])
  const isOps = includesAny(combined, ['operations', 'ops', 'mission', 'field', 'caregiver', 'care'])
  const isAcademy = includesAny(combined, ['academy', 'training', 'trainer', 'formation'])

  if (isExecutive) {
    return {
      key: 'executive',
      label: 'Executive Command Persona',
      theme: { primary: '#020617', secondary: '#1e3a8a', accent: '#f59e0b', surface: '#fffbeb', glow: 'rgba(245,158,11,.20)' },
      mission: 'Lead company-wide execution, risk, performance and strategic decisions.',
      briefing: 'Your workspace prioritizes boardroom signals, approvals, escalations, operating risks and authorized command routes.',
      workspaceFocus: ['Boardroom', 'Approvals', 'Risk Center', 'Analytics', 'Executive Automation'],
      recommendedActions: [
        { label: 'Open Boardroom', href: '/hr/boardroom', detail: 'Executive HR and workforce cockpit.' },
        { label: 'Review Approvals', href: '/hr/approvals', detail: 'Decision queue requiring leadership.' },
        { label: 'Risk Center', href: '/hr/risk-center', detail: 'Operational risks and escalation pressure.' },
        { label: 'Enterprise Dashboard', href: '/hr/enterprise-dashboard', detail: 'Board-level operating surface.' },
      ],
      performanceIndicators: [
        { label: 'Decision load', value: data?.kpis?.find((x) => x.label === 'Pending approvals')?.value ?? 0, detail: 'Leadership approvals pending', tone: '#7c3aed' },
        { label: 'Risk watch', value: data?.memos?.length ?? 0, detail: 'Control tower briefings', tone: '#dc2626' },
        { label: 'Access depth', value: data?.accessRoutes?.length ?? 0, detail: 'Authorized command routes', tone: '#2563eb' },
        { label: 'Execution horizon', value: data?.tasksMonth?.length ?? 0, detail: 'Monthly operating items', tone: '#f59e0b' },
      ],
    }
  }

  if (isHR) {
    return {
      key: 'hr',
      label: 'HR Operations Persona',
      theme: { primary: '#0f172a', secondary: '#7c3aed', accent: '#2563eb', surface: '#f5f3ff', glow: 'rgba(124,58,237,.18)' },
      mission: 'Control hiring, staff readiness, onboarding, attendance, documents and HR execution.',
      briefing: 'Your portal emphasizes people operations, document control, roster readiness, approvals and staff support services.',
      workspaceFocus: ['HR MAX', 'Staff 360', 'Recruitment', 'Documents', 'Attendance'],
      recommendedActions: [
        { label: 'HR MAX', href: '/hr', detail: 'Open HR command center.' },
        { label: 'Staff 360', href: '/hr/staff', detail: 'Manage staff profiles and readiness.' },
        { label: 'Recruitment', href: '/hr/recruitment', detail: 'Pipeline, candidates and openings.' },
        { label: 'Staff Services', href: '/staff-services', detail: 'Staff requests and memos.' },
      ],
      performanceIndicators: [
        { label: 'Today tasks', value: data?.tasksToday?.length ?? 0, detail: 'Immediate HR execution', tone: '#7c3aed' },
        { label: 'Document checks', value: data?.kpis?.find((x) => x.label === 'Document checks')?.value ?? 0, detail: 'Pending HR verification', tone: '#dc2626' },
        { label: 'Service memos', value: data?.memos?.length ?? 0, detail: 'Briefings to acknowledge', tone: '#16a34a' },
        { label: 'Weekly load', value: data?.tasksWeek?.length ?? 0, detail: 'Open HR work this week', tone: '#2563eb' },
      ],
    }
  }

  if (isSales) {
    return {
      key: 'sales',
      label: 'Revenue & Sales Persona',
      theme: { primary: '#07111f', secondary: '#0369a1', accent: '#16a34a', surface: '#ecfdf5', glow: 'rgba(22,163,74,.18)' },
      mission: 'Drive revenue execution, clients, leads, contracts and commercial follow-up.',
      briefing: 'Your portal prioritizes leads, contracts, revenue tasks, appointments and client execution.',
      workspaceFocus: ['Sales', 'Revenue Command', 'Leads', 'Contracts', 'Appointments'],
      recommendedActions: [
        { label: 'Revenue Command', href: '/revenue-command-center', detail: 'Open revenue operating center.' },
        { label: 'Leads', href: '/leads', detail: 'Follow active lead pipeline.' },
        { label: 'Contracts', href: '/contracts', detail: 'Track agreements and closing.' },
        { label: 'Appointments', href: '/revenue-command-center/appointments', detail: 'Commercial appointments.' },
      ],
      performanceIndicators: [
        { label: 'Today tasks', value: data?.tasksToday?.length ?? 0, detail: 'Commercial execution today', tone: '#16a34a' },
        { label: 'Week pipeline', value: data?.tasksWeek?.length ?? 0, detail: 'Upcoming follow-ups', tone: '#0369a1' },
        { label: 'Route access', value: data?.accessRoutes?.length ?? 0, detail: 'Authorized revenue routes', tone: '#2563eb' },
        { label: 'Memos', value: data?.memos?.length ?? 0, detail: 'Control messages', tone: '#f59e0b' },
      ],
    }
  }

  if (isMarket) {
    return {
      key: 'market',
      label: 'Market OS Persona',
      theme: { primary: '#111827', secondary: '#be123c', accent: '#f97316', surface: '#fff7ed', glow: 'rgba(249,115,22,.18)' },
      mission: 'Run campaigns, content, SEO, ambassadors and growth execution.',
      briefing: 'Your portal highlights campaign execution, market tasks, content workflows and growth access.',
      workspaceFocus: ['Market OS', 'Campaigns', 'SEO', 'Ambassadors', 'Content'],
      recommendedActions: [
        { label: 'Market OS', href: '/market-os', detail: 'Open marketing command center.' },
        { label: 'Campaigns', href: '/market-os/campaign-lifecycle', detail: 'Campaign lifecycle workspace.' },
        { label: 'SEO Blog', href: '/market-os/seo-blog-workspace', detail: 'SEO and editorial operations.' },
        { label: 'Ambassadors', href: '/market-os/ambassadors', detail: 'Ambassador program execution.' },
      ],
      performanceIndicators: [
        { label: 'Today tasks', value: data?.tasksToday?.length ?? 0, detail: 'Growth execution today', tone: '#f97316' },
        { label: 'Weekly load', value: data?.tasksWeek?.length ?? 0, detail: 'Campaign follow-ups', tone: '#be123c' },
        { label: 'Access routes', value: data?.accessRoutes?.length ?? 0, detail: 'Authorized workspaces', tone: '#2563eb' },
        { label: 'Briefings', value: data?.memos?.length ?? 0, detail: 'Control updates', tone: '#16a34a' },
      ],
    }
  }

  if (isAcademy) {
    return {
      key: 'academy',
      label: 'Academy & Training Persona',
      theme: { primary: '#1e1b4b', secondary: '#4338ca', accent: '#06b6d4', surface: '#ecfeff', glow: 'rgba(6,182,212,.18)' },
      mission: 'Manage training readiness, programs, trainees, trainers and certification execution.',
      briefing: 'Your portal prioritizes training, academy operations, readiness, schedules and staff development.',
      workspaceFocus: ['Academy', 'Training', 'Programs', 'Staff Readiness', 'Reports'],
      recommendedActions: [
        { label: 'Academy', href: '/academy', detail: 'Open academy workspace.' },
        { label: 'Training HR', href: '/hr/training', detail: 'Training readiness in HR.' },
        { label: 'Staff Documents', href: '/hr/documents', detail: 'Certification and documents.' },
        { label: 'Reports', href: '/reports', detail: 'Training and performance reports.' },
      ],
      performanceIndicators: [
        { label: 'Training focus', value: data?.tasksWeek?.length ?? 0, detail: 'Training-related work horizon', tone: '#06b6d4' },
        { label: 'Today actions', value: data?.tasksToday?.length ?? 0, detail: 'Immediate academy tasks', tone: '#4338ca' },
        { label: 'Memos', value: data?.memos?.length ?? 0, detail: 'Training updates', tone: '#16a34a' },
        { label: 'Access', value: data?.accessRoutes?.length ?? 0, detail: 'Authorized academy routes', tone: '#2563eb' },
      ],
    }
  }

  if (isOps || isManager) {
    return {
      key: isManager ? 'manager' : 'operations',
      label: isManager ? 'Manager Command Persona' : 'Operations Persona',
      theme: { primary: '#042f2e', secondary: '#0f766e', accent: '#2563eb', surface: '#ecfeff', glow: 'rgba(15,118,110,.18)' },
      mission: 'Coordinate operations, missions, roster pressure, incidents, availability and daily execution.',
      briefing: 'Your portal prioritizes mission execution, roster status, attendance, incidents and team coordination.',
      workspaceFocus: ['Operations', 'Missions', 'Rosters', 'Incidents', 'Availability'],
      recommendedActions: [
        { label: 'Operations', href: '/operations', detail: 'Open operations workspace.' },
        { label: 'Missions', href: '/missions', detail: 'Mission execution.' },
        { label: 'Availability', href: '/operations/availability', detail: 'Roster and availability.' },
        { label: 'Incidents', href: '/incidents', detail: 'Operational incidents.' },
      ],
      performanceIndicators: [
        { label: 'Today tasks', value: data?.tasksToday?.length ?? 0, detail: 'Field execution today', tone: '#0f766e' },
        { label: 'Week load', value: data?.tasksWeek?.length ?? 0, detail: 'Operational horizon', tone: '#2563eb' },
        { label: 'Roster today', value: data?.kpis?.find((x) => x.label === 'Roster today')?.value ?? 0, detail: 'Roster entries today', tone: '#06b6d4' },
        { label: 'Memos', value: data?.memos?.length ?? 0, detail: 'Control tower updates', tone: '#dc2626' },
      ],
    }
  }

  return {
    key: 'staff',
    label: 'Staff Portal Persona',
    theme: { primary: '#020617', secondary: '#1e3a8a', accent: '#0f766e', surface: '#f8fafc', glow: 'rgba(37,99,235,.16)' },
    mission: 'Execute your daily work, access authorized modules, manage your personal space and acknowledge control briefings.',
    briefing: 'Your portal is optimized around your allowed routes, personal task horizon, memos and services.',
    workspaceFocus: ['My Space', 'Tasks', 'Services', 'Memos', 'Authorized Access'],
    recommendedActions: [
      { label: 'My Profile', href: '/profile', detail: 'Open personal profile.' },
      { label: 'Staff Services', href: '/staff-services', detail: 'Submit support request.' },
      { label: 'My Tasks', href: '/staff-home#tasks', detail: 'Review task command center.' },
      { label: 'Access Menu', href: '/staff-home#access-menu', detail: 'Open authorized modules.' },
    ],
    performanceIndicators: [
      { label: 'Today tasks', value: data?.tasksToday?.length ?? 0, detail: 'Due today', tone: '#2563eb' },
      { label: 'Week tasks', value: data?.tasksWeek?.length ?? 0, detail: 'Due this week', tone: '#7c3aed' },
      { label: 'Memos', value: data?.memos?.length ?? 0, detail: 'Control messages', tone: '#16a34a' },
      { label: 'Access', value: data?.accessRoutes?.length ?? 0, detail: 'Authorized routes', tone: '#0f766e' },
    ],
  }
}
