export type OpsosModule = {
  key: string
  label: string
  href: string
  commandHref: string
  tone: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'slate'
  mission: string
  output: string
  widgets: string[]
}

export const OPSOS_MODULES: OpsosModule[] = [
  {
    key: 'staff',
    label: 'Staff Portal OS',
    href: '/staff-home',
    commandHref: '/staff-portal-command',
    tone: 'blue',
    mission: 'Personalized employee operating cockpit after login.',
    output: 'Role-aware landing, task execution, memos, services and access.',
    widgets: ['My Space', 'Task Center', 'ATC Memos', 'Permission Access', 'Services'],
  },
  {
    key: 'hr',
    label: 'HR MAX',
    href: '/hr',
    commandHref: '/hr/operations-console',
    tone: 'purple',
    mission: 'Workforce, recruitment, rosters, attendance and HR governance.',
    output: 'Workforce command, boardroom, approvals, audits and sync center.',
    widgets: ['Recruitment', 'Staff 360', 'Rosters', 'Attendance', 'Compliance'],
  },
  {
    key: 'revenue',
    label: 'Revenue Command',
    href: '/revenue-command-center',
    commandHref: '/revenue-war-room',
    tone: 'green',
    mission: 'Commercial execution, pipeline pressure, clients and contracts.',
    output: 'Sales war-room, pipeline, appointments and follow-up execution.',
    widgets: ['Pipeline', 'Contracts', 'Appointments', 'Conversion', 'Revenue Tasks'],
  },
  {
    key: 'market',
    label: 'Market OS',
    href: '/market-os',
    commandHref: '/growth-war-room',
    tone: 'amber',
    mission: 'Marketing execution, campaigns, SEO, ambassadors and growth.',
    output: 'Growth war-room, campaign command, editorial production and acquisition.',
    widgets: ['Campaigns', 'SEO', 'Content', 'Ambassadors', 'Market Intelligence'],
  },
  {
    key: 'academy',
    label: 'Academy Command',
    href: '/academy',
    commandHref: '/academy-campus-command',
    tone: 'cyan',
    mission: 'Training center operations, programs, cohorts and certifications.',
    output: 'Campus command, trainer coordination and trainee progression.',
    widgets: ['Programs', 'Cohorts', 'Trainers', 'Trainees', 'Certificates'],
  },
]

export const OPSOS_GLOBAL_ROUTES = [
  '/enterprise-command',
  '/executive-cockpit',
  '/module-specialization',
  '/operations-war-room',
  '/growth-war-room',
  '/revenue-war-room',
  '/academy-campus-command',
  '/opsos-final-qa',
  '/opsos-design-system',
]
