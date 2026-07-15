import type { CareLinkStatus } from './types'

export const CARELINK_AGENT_VISIBLE_STATUSES: Partial<Record<CareLinkStatus, string>> = {
  assigned: 'NOUVELLE MISSION',
  agent_accepted: 'ACCEPTÉE',
  dispatch_confirmed: 'CONFIRMÉE DISPATCH',
  pre_mission_check: 'PRÉPARATION',
  en_route: 'EN ROUTE',
  arrived_near_location: 'ARRIVÉE ZONE',
  arrival_confirmed: 'ARRIVÉE CONFIRMÉE',
  mission_started: 'DÉMARRÉE',
  in_progress: 'EN COURS',
  completion_requested: 'CLÔTURE EN COURS',
  final_report_submitted: 'RAPPORT SOUMIS',
  dispatch_validated: 'VALIDÉE',
  closed: 'CLÔTURÉE',
  cancelled: 'ANNULÉE',
}

export const CARELINK_ADMIN_STATUSES: CareLinkStatus[] = [
  'ready_for_dispatch',
  'matching',
  'assigned',
  'agent_accepted',
  'dispatch_confirmed',
  'pre_mission_check',
  'en_route',
  'arrival_confirmed',
  'mission_started',
  'in_progress',
  'final_report_submitted',
  'dispatch_validated',
  'closed',
  'incident_review',
]

export const CARELINK_MOBILE_NAV = [
  { href: '/carelink', label: 'Accueil' },
  { href: '/carelink/missions', label: 'Missions' },
  { href: '/carelink/schedule', label: 'Planning' },
  { href: '/carelink/messages', label: 'Messages' },
  { href: '/carelink/profile', label: 'Profil' },
]

export const CARELINK_OPS_NAV = [
  { href: '/carelink-ops', label: 'Vue générale' },
  { href: '/carelink-ops/dispatch', label: 'Dispatch' },
  { href: '/carelink-ops/missions', label: 'Missions' },
  { href: '/carelink-ops/agents', label: 'Agents' },
  { href: '/carelink-ops/schedule', label: 'Planning' },
  { href: '/carelink-ops/incidents', label: 'Incidents' },
  { href: '/carelink-ops/reports', label: 'Rapports' },
  { href: '/carelink-ops/compliance', label: 'Conformité' },
  { href: '/carelink-ops/settings', label: 'Réglages' },
]
