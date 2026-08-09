import type {
  DirectionDomainKey,
  DirectionMatterAction,
  DirectionMatterState,
  DirectionPlaneKey,
  DirectionSeverity,
  DirectionTone,
} from '@/types/angelcare360/direction-command'

export const DIRECTION_PLANES: Array<{
  key: DirectionPlaneKey
  label: string
  shortLabel: string
  description: string
}> = [
  { key: 'today', label: "Commandement d'aujourd'hui", shortLabel: "Aujourd'hui", description: 'Priorités, décisions et engagements exigeant une action immédiate.' },
  { key: 'network', label: 'Réseau & établissements', shortLabel: 'Réseau', description: 'Posture consolidée des sites et domaines opérationnels.' },
  { key: 'decisions', label: 'Conseil de décisions', shortLabel: 'Décisions', description: 'Décisions structurées, conséquences, preuves et exécution.' },
  { key: 'risks', label: 'Risques & interventions', shortLabel: 'Risques', description: 'Expositions critiques, escalades et plans de résolution.' },
  { key: 'commitments', label: 'Engagements exécutifs', shortLabel: 'Engagements', description: 'Responsabilités, échéances, preuves et clôture.' },
  { key: 'performance', label: 'Performance consolidée', shortLabel: 'Performance', description: 'Santé des domaines et évolution de la charge exécutive.' },
  { key: 'calendar', label: 'Calendrier de Direction', shortLabel: 'Calendrier', description: 'Échéances, revues, décisions et engagements planifiés.' },
  { key: 'audit', label: 'Chronologie & audit', shortLabel: 'Audit', description: 'Conséquences, acteurs, preuves et historique immutable.' },
]

export const DIRECTION_DOMAINS: Record<DirectionDomainKey, {
  label: string
  shortLabel: string
  tone: DirectionTone
  exactBaseHref: string
}> = {
  governance: { label: 'Gouvernance', shortLabel: 'Gouvernance', tone: 'decision', exactBaseHref: '/angelcare-360-command-center/administration' },
  people: { label: 'Personnes & communauté', shortLabel: 'Personnes', tone: 'active', exactBaseHref: '/angelcare-360-command-center/personnes' },
  admissions: { label: 'Admissions & inscriptions', shortLabel: 'Admissions', tone: 'decision', exactBaseHref: '/angelcare-360-command-center/admissions' },
  attendance: { label: 'Présence & journée scolaire', shortLabel: 'Présence', tone: 'active', exactBaseHref: '/angelcare-360-command-center/presences' },
  academics: { label: 'Académique & progression', shortLabel: 'Académique', tone: 'active', exactBaseHref: '/angelcare-360-command-center/academique' },
  finance: { label: 'Finance & recouvrement', shortLabel: 'Finance', tone: 'verified', exactBaseHref: '/angelcare-360-command-center/finance' },
  payroll: { label: 'Workforce & paie', shortLabel: 'Paie', tone: 'decision', exactBaseHref: '/angelcare-360-command-center/paie' },
  transport: { label: 'Transport & sécurité', shortLabel: 'Transport', tone: 'warning', exactBaseHref: '/angelcare-360-command-center/transport' },
  quality: { label: 'Qualité & incidents', shortLabel: 'Qualité', tone: 'warning', exactBaseHref: '/angelcare-360-command-center/reclamations' },
  communications: { label: 'Communication familles', shortLabel: 'Communication', tone: 'active', exactBaseHref: '/angelcare-360-command-center/messagerie' },
  compliance: { label: 'Conformité & contrôle', shortLabel: 'Conformité', tone: 'neutral', exactBaseHref: '/angelcare-360-command-center/rapports' },
}

export const DIRECTION_COMMAND_TEMPLATES = [
  { key: 'operational', label: 'Décision opérationnelle', description: 'Trancher un blocage quotidien et déclencher son exécution.', domain: 'governance' as DirectionDomainKey },
  { key: 'financial', label: 'Décision financière', description: 'Décider une exposition, remise, remboursement ou clôture.', domain: 'finance' as DirectionDomainKey },
  { key: 'people', label: 'Décision personnes', description: 'Gouverner un dossier personne, emploi ou paie sensible.', domain: 'people' as DirectionDomainKey },
  { key: 'admission', label: 'Décision admission', description: 'Décider capacité, conditions, acceptation ou exception.', domain: 'admissions' as DirectionDomainKey },
  { key: 'risk', label: 'Intervention risque', description: 'Ouvrir une intervention exécutive avec propriétaire et SLA.', domain: 'quality' as DirectionDomainKey },
  { key: 'compliance', label: 'Décision conformité', description: 'Traiter preuve, contrôle, exception et mesure corrective.', domain: 'compliance' as DirectionDomainKey },
  { key: 'directive', label: 'Directive transverse', description: 'Émettre une instruction multi-domaines et suivre ses engagements.', domain: 'governance' as DirectionDomainKey },
  { key: 'review', label: 'Revue urgente', description: 'Programmer une revue gouvernée avec preuve et participants.', domain: 'governance' as DirectionDomainKey },
]

const TERMINAL_STATES = new Set<DirectionMatterState>(['resolved', 'released', 'rejected', 'cancelled'])

export function matterTone(severity: DirectionSeverity, state: DirectionMatterState): DirectionTone {
  if (TERMINAL_STATES.has(state)) return 'verified'
  if (state === 'decision_required' || state === 'approved_execution') return 'decision'
  if (severity === 'critical') return 'critical'
  if (severity === 'high' || state === 'waiting_evidence' || state === 'snoozed') return 'warning'
  if (severity === 'medium' || state === 'in_progress' || state === 'owned') return 'active'
  return 'neutral'
}

export function matterLane(input: {
  severity: DirectionSeverity
  state: DirectionMatterState
  dueAt?: string | null
}) {
  if (TERMINAL_STATES.has(input.state)) return 'resolved' as const
  if (input.state === 'decision_required' || input.state === 'approved_execution') return 'decision' as const
  if (input.dueAt && Date.parse(input.dueAt) < Date.now()) return 'overdue' as const
  if (input.severity === 'critical' || input.severity === 'high') return 'immediate' as const
  return 'watch' as const
}

export function actionsForMatter(state: DirectionMatterState, canDecide: boolean): DirectionMatterAction[] {
  if (state === 'resolved' || state === 'released' || state === 'rejected' || state === 'cancelled') {
    return canDecide ? ['reopen'] : []
  }
  const actions: DirectionMatterAction[] = ['add_note']
  if (state === 'new') actions.unshift('acknowledge')
  if (state === 'new' || state === 'acknowledged' || state === 'reopened') actions.push('take_ownership')
  if (state !== 'waiting_evidence') actions.push('request_evidence')
  if (state !== 'snoozed') actions.push('snooze')
  actions.push('mark_checked')
  if (canDecide) {
    actions.push('assign', 'escalate', 'resolve', 'release')
  }
  return [...new Set(actions)]
}

export const DIRECTION_OPERATION_KEYS = [
  'direction.matter.acknowledge',
  'direction.matter.take_ownership',
  'direction.matter.assign',
  'direction.matter.mark_checked',
  'direction.matter.request_evidence',
  'direction.matter.add_note',
  'direction.matter.snooze',
  'direction.matter.escalate',
  'direction.matter.resolve',
  'direction.matter.release',
  'direction.matter.reopen',
  'direction.decision.create',
  'direction.decision.submit',
  'direction.decision.request_evidence',
  'direction.decision.approve',
  'direction.decision.conditional_approval',
  'direction.decision.reject',
  'direction.decision.execute',
  'direction.commitment.create',
  'direction.commitment.update',
  'direction.briefing.generate',
  'direction.saved_view.upsert',
] as const
