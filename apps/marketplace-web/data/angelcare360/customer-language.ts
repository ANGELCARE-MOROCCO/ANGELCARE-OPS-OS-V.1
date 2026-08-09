import type {
  GovernanceEntityType,
  GovernanceMatterAction,
  GovernanceOperationKey,
} from '@/types/angelcare360/governance-command'
import type { DirectionMatterAction } from '@/types/angelcare360/direction-command'
import type { PayrollCommandRequest } from '@/types/angelcare360/payroll-sovereign'


export const CUSTOMER_PERMISSION_COPY = {
  approvalRequired: 'Validation de la direction nécessaire',
  requestApproval: 'Demander la validation',
  unavailableForRole: 'Cette action n’est pas disponible avec votre rôle actuel.',
} as const

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau',
  draft: 'Brouillon',
  pending: 'En attente',
  acknowledged: 'Vu',
  owned: 'Pris en charge',
  open: 'À traiter',
  in_progress: 'En cours',
  waiting_evidence: 'Document attendu',
  evidence_required: 'Document nécessaire',
  decision_required: 'Décision nécessaire',
  approved_execution: 'Prêt à appliquer',
  executing: 'Application en cours',
  active: 'Actif',
  ready: 'Prêt à utiliser',
  ready_with_warnings: 'Prêt avec une remarque',
  incomplete: 'À compléter',
  blocked: 'Bloqué',
  expired: 'À renouveler',
  verified: 'Vérifié',
  resolved: 'Réglé',
  released: 'Retiré de la liste',
  snoozed: 'Reporté',
  reopened: 'Réouvert',
  rejected: 'Refusé',
  cancelled: 'Annulé',
  submitted: 'Envoyé pour validation',
  approved: 'Validé',
  conditionally_approved: 'Validé sous conditions',
  executed: 'Appliqué',
  completed: 'Terminé',
  published: 'Rendu actif',
  suspended: 'Temporairement suspendu',
  closed: 'Clôturé',
  archived: 'Archivé',
  unconfigured: 'À configurer',
  stable: 'Stable',
  warning: 'À surveiller',
  critical: 'Action urgente',
  manual_pending: 'Paiement en cours de vérification',
}

const ENTITY_LABELS: Record<GovernanceEntityType, string> = {
  institution: 'Établissement',
  academic_year: 'Année scolaire',
  term: 'Période scolaire',
  class: 'Classe',
  section: 'Section',
  subject: 'Matière',
  assignment: 'Affectation d’un enseignant',
  role: 'Rôle et accès',
  delegation: 'Accès temporaire',
  configuration: 'Réglage de l’école',
  rollover: 'Passage à l’année suivante',
  matter: 'Dossier à traiter',
  audit_event: 'Action enregistrée',
}

export const GOVERNANCE_MATTER_ACTION_LABELS: Record<GovernanceMatterAction, string> = {
  acknowledge: 'Marquer comme vu',
  take_ownership: 'Prendre en charge',
  assign: 'Attribuer à quelqu’un',
  verify: 'Marquer comme vérifié',
  request_evidence: 'Demander le document manquant',
  add_note: 'Ajouter une note interne',
  schedule_review: 'Programmer une vérification',
  snooze: 'Reporter avec une date',
  escalate_direction: 'Demander une décision à la direction',
  resolve: 'Marquer comme réglé',
  release: 'Retirer de la liste à traiter',
  reopen: 'Réouvrir le dossier',
}

export const DIRECTION_MATTER_ACTION_LABELS: Record<DirectionMatterAction, string> = {
  acknowledge: 'Marquer comme vu',
  take_ownership: 'Prendre en charge',
  assign: 'Attribuer à quelqu’un',
  mark_checked: 'Marquer comme vérifié',
  request_evidence: 'Demander le document manquant',
  add_note: 'Ajouter une note interne',
  snooze: 'Reporter avec une date',
  escalate: 'Demander une intervention prioritaire',
  resolve: 'Marquer comme réglé',
  release: 'Retirer de la liste de la direction',
  reopen: 'Réouvrir le dossier',
  approve: 'Valider la décision',
  reject: 'Refuser avec un motif',
  conditional_approval: 'Valider sous conditions',
}

export const GOVERNANCE_OPERATION_LABELS: Record<GovernanceOperationKey, string> = {
  'governance.institution.create': 'Créer un établissement',
  'governance.institution.review': 'Vérifier si l’établissement est prêt',
  'governance.institution.activate': 'Ouvrir l’établissement dans le système',
  'governance.institution.suspend': 'Suspendre temporairement l’établissement',
  'governance.institution.reactivate': 'Réouvrir l’établissement',
  'governance.institution.close': 'Clôturer l’établissement',
  'governance.institution.archive': 'Archiver l’établissement',
  'governance.academic_year.create': 'Créer une année scolaire',
  'governance.academic_year.publish': 'Rendre l’année scolaire disponible',
  'governance.academic_year.activate': 'Démarrer l’année scolaire',
  'governance.academic_year.close': 'Clôturer l’année scolaire',
  'governance.academic_year.reopen': 'Réouvrir l’année scolaire',
  'governance.rollover.preview': 'Préparer le passage à l’année suivante',
  'governance.rollover.execute': 'Appliquer le passage à l’année suivante',
  'governance.rollover.repair': 'Corriger les dossiers non transférés',
  'governance.period.create': 'Créer une période scolaire',
  'governance.period.publish': 'Rendre la période disponible',
  'governance.period.close': 'Clôturer la période',
  'governance.period.reopen': 'Réouvrir la période',
  'governance.class.create': 'Créer une classe',
  'governance.section.create': 'Créer une section',
  'governance.capacity.change': 'Modifier la capacité de la classe',
  'governance.population.move': 'Déplacer des enfants vers une autre classe',
  'governance.enrollment.freeze': 'Bloquer temporairement les nouvelles inscriptions',
  'governance.subject.create': 'Créer une matière',
  'governance.subject.publish': 'Rendre la matière disponible',
  'governance.subject.replace': 'Remplacer cette matière',
  'governance.subject.retire': 'Retirer cette matière des nouvelles affectations',
  'governance.assignment.create': 'Affecter un enseignant',
  'governance.assignment.change': 'Modifier cette affectation',
  'governance.assignment.replace': 'Choisir un enseignant remplaçant',
  'governance.assignment.end': 'Terminer cette affectation',
  'governance.role.create': 'Créer un rôle utilisateur',
  'governance.role.publish': 'Appliquer les nouveaux droits d’accès',
  'governance.role.assign': 'Attribuer ce rôle',
  'governance.role.revoke': 'Retirer ce rôle',
  'governance.delegation.create': 'Donner un accès temporaire',
  'governance.delegation.revoke': 'Retirer l’accès temporaire',
  'governance.configuration.publish': 'Appliquer ce réglage',
  'governance.configuration.rollback': 'Revenir au réglage précédent',
  'governance.matter.action': 'Mettre à jour le dossier',
  'governance.briefing.generate': 'Préparer le résumé de l’école',
}

const PAYROLL_OPERATION_LABELS: Partial<Record<PayrollCommandRequest['operationKey'], string>> = {
  'workforce.employment.create': 'Créer le dossier d’un salarié',
  'workforce.employment.transition': 'Modifier la situation du salarié',
  'workforce.contract.create': 'Ajouter un contrat',
  'workforce.compensation.assign': 'Attribuer une rémunération',
  'payroll.policy.publish': 'Rendre les règles de paie actives',
  'payroll.input.create': 'Ajouter un élément de paie',
  'payroll.advance.request': 'Enregistrer une demande d’avance',
  'payroll.period.open': 'Ouvrir la période de paie',
  'payroll.period.cutoff': 'Fermer la saisie des éléments',
  'payroll.run.preview': 'Prévisualiser la paie',
  'payroll.run.calculate': 'Calculer la paie',
  'payroll.run.validate': 'Vérifier la paie',
  'payroll.run.approve': 'Valider la paie',
  'payroll.run.finalize': 'Finaliser la paie',
  'payroll.payslip.generate': 'Générer les bulletins de paie',
  'payroll.payslip.publish': 'Mettre les bulletins à disposition',
  'payroll.payment_batch.create': 'Préparer les paiements',
  'payroll.reconciliation.resolve': 'Confirmer le rapprochement des paiements',
  'payroll.report.execute': 'Générer le rapport de paie',
  'payroll.export.execute': 'Préparer l’export de paie',
}


const GOVERNANCE_LOCAL_VIEW_LABELS: Record<string, string> = {
  network: 'Vue d’ensemble',
  institutions: 'Établissements',
  sites: 'Sites',
  readiness: 'Éléments à compléter',
  activations: 'Ouvertures',
  suspensions: 'Suspensions',
  closures: 'Fermetures',
  history: 'Historique',
  academic_years: 'Années scolaires',
  periods: 'Périodes',
  calendar: 'Calendrier',
  publication: 'Mise en service',
  closure: 'Clôture',
  rollover: 'Passage à l’année suivante',
  exceptions: 'Dossiers à vérifier',
  command: 'À traiter aujourd’hui',
  classes: 'Classes',
  sections: 'Sections',
  capacity: 'Capacité',
  occupancy: 'Places occupées',
  conflicts: 'Problèmes à régler',
  movements: 'Changements de classe',
  projections: 'Prévisions',
  catalogue: 'Liste des matières',
  versions: 'Versions',
  levels: 'Niveaux',
  teachers: 'Enseignants',
  coverage: 'Classes couvertes',
  workload: 'Charge de travail',
  replacements: 'Remplacements',
  changes: 'Modifications',
  roles: 'Rôles',
  users: 'Utilisateurs',
  delegations: 'Accès temporaires',
  scopes: 'Périmètres d’accès',
  simulations: 'Vérifier les effets',
  configuration_registry: 'Réglages de l’école',
  ownership: 'Qui peut modifier',
  drafts: 'Modifications préparées',
  rollback: 'Revenir en arrière',
  chronology: 'Historique',
  exports: 'Exports',
}
const MODULE_LABELS: Record<string, string> = {
  governance: 'Administration de l’école',
  direction: 'Direction',
  people: 'Enfants, parents et équipe',
  admissions: 'Inscriptions',
  attendance: 'Présences',
  academics: 'Pédagogie',
  finance: 'Facturation et paiements',
  payroll: 'Personnel et paie',
  transport: 'Transport scolaire',
  reports: 'Documents et rapports',
  communication: 'Messages et notifications',
}


export function governanceLocalViewLabel(value: string) {
  const key = value.toLowerCase().trim().replace(/[\s.-]+/g, '_')
  return GOVERNANCE_LOCAL_VIEW_LABELS[key] || humanizeTechnicalLabel(value)
}

export function schoolStatusLabel(value: string | null | undefined) {
  if (!value) return 'Non renseigné'
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return STATUS_LABELS[key] || humanizeTechnicalLabel(value)
}

export function schoolEntityLabel(type: GovernanceEntityType | string) {
  return ENTITY_LABELS[type as GovernanceEntityType] || humanizeTechnicalLabel(type)
}

export function governanceOperationLabel(key: GovernanceOperationKey) {
  return GOVERNANCE_OPERATION_LABELS[key] || humanizeTechnicalLabel(key)
}

export function payrollOperationLabel(key: PayrollCommandRequest['operationKey']) {
  return PAYROLL_OPERATION_LABELS[key] || humanizeTechnicalLabel(key)
}

export function customerModuleLabel(value: string) {
  const key = value.toLowerCase().replace(/[\s.-]+/g, '_')
  return MODULE_LABELS[key] || humanizeTechnicalLabel(value)
}

export function humanizeTechnicalLabel(value: string) {
  return value
    .replace(/^governance\.|^payroll\.|^workforce\.|^finance\./, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\bapi\b/gi, '')
    .replace(/\bid\b/gi, 'référence')
    .replace(/\btenant\b/gi, 'école')
    .replace(/\bscope\b/gi, 'périmètre')
    .replace(/\breadiness\b/gi, 'préparation')
    .replace(/\brollover\b/gi, 'passage à l’année suivante')
    .replace(/\bworkflow\b/gi, 'étapes')
    .replace(/\baudit\b/gi, 'historique')
    .replace(/\bmetadata\b/gi, 'informations complémentaires')
    .replace(/\bownership\b/gi, 'responsabilité du réglage')
    .replace(/\bconfiguration\b/gi, 'réglage')
    .replace(/\boperation\b/gi, 'action')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (character) => character.toUpperCase())
}
