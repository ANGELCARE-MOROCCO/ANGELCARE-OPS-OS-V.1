export type Angelcare360AttendanceNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_ATTENDANCE_NAVIGATION: Angelcare360AttendanceNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/presences',
    summary: 'Cockpit opérationnel, risques et complétude de la journée.',
    permission: 'presences.view',
    badge: 'Hub',
  },
  {
    key: 'jour',
    label: 'Présence du jour',
    href: '/angelcare-360-command-center/presences/jour',
    summary: 'Ouverture des sessions, complétude et suivi quotidien.',
    permission: 'presences.view',
  },
  {
    key: 'classes',
    label: 'Feuilles par classe',
    href: '/angelcare-360-command-center/presences/classes',
    summary: 'Feuilles de présence et saisie par classe.',
    permission: 'presences.update',
  },
  {
    key: 'eleves',
    label: 'Présence par élève',
    href: '/angelcare-360-command-center/presences/eleves',
    summary: 'Synthèse individuelle des présences, retards et absences.',
    permission: 'presences.view',
  },
  {
    key: 'retards',
    label: 'Retards',
    href: '/angelcare-360-command-center/presences/retards',
    summary: 'Liste des retards et suivi des minutes de retard.',
    permission: 'presences.view',
  },
  {
    key: 'absences',
    label: 'Absences',
    href: '/angelcare-360-command-center/presences/absences',
    summary: 'Liste des absences et des justifications associées.',
    permission: 'presences.view',
  },
  {
    key: 'justifications',
    label: 'Justifications',
    href: '/angelcare-360-command-center/presences/justifications',
    summary: 'Saisie, approbation et rejet des justificatifs.',
    permission: 'presences.approve',
  },
  {
    key: 'timetable',
    label: 'Emploi du temps',
    href: '/angelcare-360-command-center/emploi-du-temps',
    summary: 'Créneaux, conflits et vue d’ensemble hebdomadaire.',
    permission: 'emploi_du_temps.view',
  },
  {
    key: 'audit',
    label: 'Audit présences',
    href: '/angelcare-360-command-center/presences/audit',
    summary: 'Traçabilité des mutations et alertes de sécurité.',
    permission: 'audit.view',
  },
]
