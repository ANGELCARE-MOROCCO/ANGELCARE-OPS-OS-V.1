export type AcademyNavItem = {
  label: string
  href: string
  description?: string
  group: 'command' | 'operations' | 'learning' | 'finance' | 'growth' | 'system'
}

export const academyNavigation: AcademyNavItem[] = [
  {
    label: 'Command Center',
    href: '/academy',
    description: 'Executive Academy cockpit',
    group: 'command',
  },
  {
    label: 'Trainees',
    href: '/academy/trainees',
    description: 'Dossiers, eligibility, lifecycle',
    group: 'operations',
  },
  {
    label: 'Enrollments',
    href: '/academy/enrollments',
    description: 'Registration and admission flow',
    group: 'operations',
  },
  {
    label: 'Programs',
    href: '/academy/courses',
    description: 'Canonical training programs',
    group: 'learning',
  },
  {
    label: 'Cohorts',
    href: '/academy/cohorts',
    description: 'Groups, sessions, planning',
    group: 'learning',
  },
  {
    label: 'Trainers',
    href: '/academy/trainers',
    description: 'Trainer assignments and payments',
    group: 'learning',
  },
  {
    label: 'Attendance',
    href: '/academy/attendance',
    description: 'Presence, absences, follow-up',
    group: 'operations',
  },
  {
    label: 'Certificates',
    href: '/academy/certificates',
    description: 'Certificates and verification',
    group: 'learning',
  },
  {
    label: 'Payments',
    href: '/academy/payments',
    description: 'Invoices, receipts, refunds',
    group: 'finance',
  },
  {
    label: 'Partners',
    href: '/academy/partners',
    description: 'Placement and B2B partners',
    group: 'growth',
  },
  {
    label: 'Job Placement',
    href: '/academy/job-placement',
    description: 'Graduate placement pipeline',
    group: 'growth',
  },
  {
    label: 'Reports',
    href: '/academy/reports',
    description: 'Academy reporting and audit',
    group: 'system',
  },
  {
    label: 'Automation',
    href: '/academy/automation',
    description: 'Notifications and workflows',
    group: 'system',
  },
  {
    label: 'Integrations',
    href: '/academy/integrations',
    description: 'Connected systems',
    group: 'system',
  },
  {
    label: 'Settings',
    href: '/academy/settings',
    description: 'Module configuration',
    group: 'system',
  },
]

export const academyNavGroups: Array<{
  key: AcademyNavItem['group']
  label: string
}> = [
  { key: 'command', label: 'Command' },
  { key: 'operations', label: 'Operations' },
  { key: 'learning', label: 'Learning Factory' },
  { key: 'finance', label: 'Finance' },
  { key: 'growth', label: 'Growth & Placement' },
  { key: 'system', label: 'System' },
]
