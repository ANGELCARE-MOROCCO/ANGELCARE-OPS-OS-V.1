import type { CareLinkStatus } from './types'

export const carelinkAllowedTransitions: Partial<Record<CareLinkStatus, CareLinkStatus[]>> = {
  draft: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['matching', 'cancelled'],
  matching: ['assigned', 'cancelled'],
  assigned: ['agent_notified', 'agent_accepted', 'agent_declined', 'cancelled'],
  agent_notified: ['agent_accepted', 'agent_declined', 'cancelled'],
  agent_accepted: ['dispatch_confirmed', 'cancelled'],
  agent_declined: ['matching', 'cancelled'],
  dispatch_confirmed: ['pre_mission_check', 'cancelled'],
  pre_mission_check: ['en_route', 'cancelled'],
  en_route: ['arrived_near_location', 'no_show', 'cancelled'],
  arrived_near_location: ['arrival_confirmed', 'incident_review'],
  arrival_confirmed: ['mission_started', 'incident_review'],
  mission_started: ['in_progress', 'incident_review'],
  in_progress: ['mid_mission_checkpoint', 'completion_requested', 'incident_review'],
  mid_mission_checkpoint: ['in_progress', 'completion_requested', 'incident_review'],
  completion_requested: ['final_report_submitted', 'incident_review'],
  final_report_submitted: ['dispatch_validated', 'incident_review'],
  dispatch_validated: ['hours_validated', 'closed'],
  hours_validated: ['closed', 'finance_ready'],
  incident_review: ['in_progress', 'dispatch_validated', 'closed', 'cancelled'],
  closed: ['finance_ready'],
  finance_ready: [],
  cancelled: [],
  no_show: ['incident_review', 'closed'],
}

export function canTransition(from: CareLinkStatus, to: CareLinkStatus) {
  return (carelinkAllowedTransitions[from] || []).includes(to)
}

export function transitionLabel(status: CareLinkStatus) {
  return status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function nextBestAgentAction(status: CareLinkStatus) {
  switch (status) {
    case 'assigned': return 'ACCEPTER OU REFUSER LA MISSION'
    case 'agent_accepted': return 'ATTENDRE CONFIRMATION DISPATCH'
    case 'dispatch_confirmed': return 'LANCER LA PRÉPARATION'
    case 'pre_mission_check': return 'PASSER EN ROUTE'
    case 'en_route': return 'CONFIRMER ARRIVÉE'
    case 'arrival_confirmed': return 'DÉMARRER LA MISSION'
    case 'in_progress': return 'SUIVRE CHECKLIST ET TERMINER'
    case 'completion_requested': return 'SOUMETTRE RAPPORT FINAL'
    case 'final_report_submitted': return 'VALIDATION DISPATCH EN ATTENTE'
    default: return 'OUVRIR LE DOSSIER MISSION'
  }
}
