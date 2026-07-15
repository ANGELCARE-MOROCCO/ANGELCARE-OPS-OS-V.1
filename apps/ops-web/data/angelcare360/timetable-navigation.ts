export type Angelcare360TimetableNavigationItem = {
  key: string
  label: string
  href: string
  summary: string
  permission: string
  badge?: string
}

export const ANGELCARE360_TIMETABLE_NAVIGATION: Angelcare360TimetableNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/emploi-du-temps',
    summary: 'Créneaux, conflits et planning global.',
    permission: 'emploi_du_temps.view',
    badge: 'Centre',
  },
  {
    key: 'classes',
    label: 'Emploi du temps par classe',
    href: '/angelcare-360-command-center/emploi-du-temps/classes',
    summary: 'Planning groupé par classe et section.',
    permission: 'emploi_du_temps.view',
  },
  {
    key: 'enseignants',
    label: 'Emploi du temps par enseignant',
    href: '/angelcare-360-command-center/emploi-du-temps/enseignants',
    summary: 'Planning groupé par enseignant.',
    permission: 'emploi_du_temps.view',
  },
  {
    key: 'calendrier',
    label: 'Calendrier scolaire',
    href: '/angelcare-360-command-center/emploi-du-temps/calendrier',
    summary: 'Évènements scolaires, fermetures et activités.',
    permission: 'emploi_du_temps.view',
  },
]
