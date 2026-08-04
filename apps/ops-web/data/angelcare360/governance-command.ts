import type {
  GovernanceMatterAction,
  GovernanceMatterState,
  GovernanceOperationKey,
  GovernancePlaneKey,
  GovernanceSeverity,
  GovernanceTone,
} from '@/types/angelcare360/governance-command'

export const GOVERNANCE_PLANES: Array<{
  key: GovernancePlaneKey
  label: string
  shortLabel: string
  description: string
  localNavigation: string[]
}> = [
  { key: 'institutions', label: 'Commandement institutions & sites', shortLabel: 'Institutions', description: 'Readiness, activation, suspension, fermeture et architecture multi-sites.', localNavigation: ['Vue réseau', 'Établissements', 'Sites', 'Readiness', 'Activations', 'Suspensions', 'Fermetures', 'Historique'] },
  { key: 'academic-structure', label: 'Structure académique souveraine', shortLabel: 'Structure académique', description: 'Années, périodes, publication, clôture et rollover gouverné.', localNavigation: ['Années scolaires', 'Périodes', 'Calendrier', 'Publication', 'Clôture', 'Rollover', 'Exceptions', 'Historique'] },
  { key: 'classes-capacity', label: 'Classes, sections & capacité', shortLabel: 'Classes & capacité', description: 'Occupation réelle, mouvements, conflits, réservations et projections.', localNavigation: ['Commandement', 'Classes', 'Sections', 'Capacité', 'Occupation', 'Conflits', 'Mouvements', 'Projections', 'Historique'] },
  { key: 'subjects', label: 'Matières & couverture pédagogique', shortLabel: 'Matières', description: 'Catalogue versionné, niveaux, curriculum, couverture et conflits.', localNavigation: ['Catalogue', 'Versions', 'Niveaux', 'Classes', 'Curriculum links', 'Enseignants', 'Couverture', 'Conflits', 'Audit'] },
  { key: 'assignments', label: 'Affectations & couverture enseignants', shortLabel: 'Affectations', description: 'Charge, conflits, remplacements, changements et historique effectif.', localNavigation: ['Commandement', 'Enseignants', 'Classes', 'Matières', 'Charge', 'Conflits', 'Remplacements', 'Changements', 'Historique'] },
  { key: 'roles-permissions', label: 'Rôles, permissions & délégations', shortLabel: 'Rôles & permissions', description: 'Bundles versionnés, scopes, simulations, délégations et accès sensibles.', localNavigation: ['Rôles', 'Permission bundles', 'Utilisateurs', 'Délégations', 'Scopes', 'Simulations', 'Changements', 'Exceptions', 'Audit'] },
  { key: 'settings', label: 'Configuration & changements publiés', shortLabel: 'Paramètres', description: 'Ownership, changesets, versions, publication et rollback.', localNavigation: ['Configuration registry', 'Institution settings', 'Academic settings', 'Operational settings', 'Ownership', 'Draft changes', 'Publication', 'Versions', 'Rollback', 'Audit'] },
  { key: 'audit', label: 'Reconstruction institutionnelle', shortLabel: 'Audit', description: 'Chronologie, changements, activations, capacité, accès et configuration.', localNavigation: ['Chronologie', 'Changements', 'Activations', 'Rollover', 'Capacité', 'Affectations', 'Permissions', 'Configuration', 'Exports'] },
]

export const GOVERNANCE_COMMANDS = [
  { key: 'institution', label: 'Créer un établissement', description: 'Ouvrir un dossier institutionnel avec readiness et propriétaire.', plane: 'institutions' as GovernancePlaneKey },
  { key: 'academic_year', label: 'Créer une année scolaire', description: 'Préparer la structure et la publication du prochain cycle.', plane: 'academic-structure' as GovernancePlaneKey },
  { key: 'period', label: 'Configurer les périodes', description: 'Créer et ordonner les périodes de l’année active.', plane: 'academic-structure' as GovernancePlaneKey },
  { key: 'class', label: 'Créer une classe', description: 'Créer une structure de capacité dans l’année active.', plane: 'classes-capacity' as GovernancePlaneKey },
  { key: 'section', label: 'Créer une section', description: 'Étendre une classe avec capacité et contexte propre.', plane: 'classes-capacity' as GovernancePlaneKey },
  { key: 'subject', label: 'Créer une matière', description: 'Publier une matière versionnée et sa couverture.', plane: 'subjects' as GovernancePlaneKey },
  { key: 'assignment', label: 'Créer une affectation', description: 'Affecter un enseignant après contrôle des conflits.', plane: 'assignments' as GovernancePlaneKey },
  { key: 'role', label: 'Réviser un rôle', description: 'Construire une version et simuler son impact.', plane: 'roles-permissions' as GovernancePlaneKey },
  { key: 'delegation', label: 'Déléguer une autorité', description: 'Créer une délégation bornée, révisable et révocable.', plane: 'roles-permissions' as GovernancePlaneKey },
  { key: 'configuration', label: 'Publier une configuration', description: 'Préparer un changeset, valider l’impact et publier.', plane: 'settings' as GovernancePlaneKey },
  { key: 'readiness', label: 'Lancer une revue readiness', description: 'Recalculer les exigences et ouvrir les findings exacts.', plane: 'institutions' as GovernancePlaneKey },
  { key: 'rollover', label: 'Préparer le rollover', description: 'Prévisualiser la population et isoler les exceptions.', plane: 'academic-structure' as GovernancePlaneKey },
]

export const GOVERNANCE_OPERATIONS: Array<{
  key: GovernanceOperationKey
  label: string
  permission: string
  approval: boolean
}> = [
  ['governance.institution.create', 'Créer un établissement', 'parametres.create', false],
  ['governance.institution.review', 'Évaluer la readiness', 'parametres.update', false],
  ['governance.institution.activate', 'Activer un établissement', 'parametres.update', true],
  ['governance.institution.suspend', 'Suspendre un établissement', 'parametres.update', true],
  ['governance.institution.reactivate', 'Réactiver un établissement', 'parametres.update', true],
  ['governance.institution.close', 'Fermer un établissement', 'parametres.update', true],
  ['governance.institution.archive', 'Archiver un établissement', 'parametres.update', true],
  ['governance.academic_year.create', 'Créer une année scolaire', 'annees_scolaires.create', false],
  ['governance.academic_year.publish', 'Publier une année scolaire', 'annees_scolaires.update', true],
  ['governance.academic_year.activate', 'Activer une année scolaire', 'annees_scolaires.update', true],
  ['governance.academic_year.close', 'Clôturer une année scolaire', 'annees_scolaires.update', true],
  ['governance.academic_year.reopen', 'Réouvrir une année scolaire', 'annees_scolaires.update', true],
  ['governance.rollover.preview', 'Prévisualiser le rollover', 'annees_scolaires.update', false],
  ['governance.rollover.execute', 'Exécuter le rollover', 'annees_scolaires.update', true],
  ['governance.rollover.repair', 'Réparer le rollover', 'annees_scolaires.update', true],
  ['governance.period.create', 'Créer une période', 'annees_scolaires.update', false],
  ['governance.period.publish', 'Publier une période', 'annees_scolaires.update', true],
  ['governance.period.close', 'Clôturer une période', 'annees_scolaires.update', true],
  ['governance.period.reopen', 'Réouvrir une période', 'annees_scolaires.update', true],
  ['governance.class.create', 'Créer une classe', 'classes.create', false],
  ['governance.section.create', 'Créer une section', 'classes.create', false],
  ['governance.capacity.change', 'Modifier une capacité', 'classes.update', true],
  ['governance.population.move', 'Déplacer une population', 'classes.update', true],
  ['governance.enrollment.freeze', 'Geler les inscriptions', 'classes.update', true],
  ['governance.subject.create', 'Créer une matière', 'matieres.create', false],
  ['governance.subject.publish', 'Publier une matière', 'matieres.update', true],
  ['governance.subject.replace', 'Remplacer une matière', 'matieres.update', true],
  ['governance.subject.retire', 'Retirer une matière', 'matieres.update', true],
  ['governance.assignment.create', 'Créer une affectation', 'enseignants.assign', false],
  ['governance.assignment.change', 'Modifier une affectation', 'enseignants.assign', true],
  ['governance.assignment.replace', 'Remplacer un enseignant', 'enseignants.assign', true],
  ['governance.assignment.end', 'Terminer une affectation', 'enseignants.assign', true],
  ['governance.role.create', 'Créer un rôle', 'securite.configure', false],
  ['governance.role.publish', 'Publier un rôle', 'securite.configure', true],
  ['governance.role.assign', 'Affecter un rôle', 'securite.configure', true],
  ['governance.role.revoke', 'Révoquer un rôle', 'securite.configure', true],
  ['governance.delegation.create', 'Créer une délégation', 'securite.configure', true],
  ['governance.delegation.revoke', 'Révoquer une délégation', 'securite.configure', true],
  ['governance.configuration.publish', 'Publier une configuration', 'parametres.update', true],
  ['governance.configuration.rollback', 'Restaurer une configuration', 'parametres.update', true],
  ['governance.matter.action', 'Traiter un matter', 'parametres.update', false],
  ['governance.briefing.generate', 'Générer un briefing', 'parametres.view', false],
].map(([key, label, permission, approval]) => ({ key: key as GovernanceOperationKey, label: String(label), permission: String(permission), approval: Boolean(approval) }))

const TERMINAL = new Set<GovernanceMatterState>(['resolved', 'released', 'cancelled'])

export function governanceTone(severity: GovernanceSeverity, state: GovernanceMatterState): GovernanceTone {
  if (TERMINAL.has(state)) return 'verified'
  if (state === 'decision_required' || state === 'approved_execution') return 'decision'
  if (severity === 'critical') return 'critical'
  if (severity === 'high' || state === 'waiting_evidence' || state === 'snoozed') return 'warning'
  if (severity === 'medium' || state === 'in_progress' || state === 'owned') return 'active'
  return 'neutral'
}

export function actionsForGovernanceMatter(state: GovernanceMatterState): GovernanceMatterAction[] {
  if (TERMINAL.has(state)) return ['reopen']
  const actions: GovernanceMatterAction[] = ['add_note']
  if (state === 'new') actions.unshift('acknowledge')
  if (state === 'new' || state === 'acknowledged' || state === 'reopened') actions.push('take_ownership')
  actions.push('assign', 'verify', 'request_evidence', 'schedule_review', 'snooze', 'escalate_direction', 'resolve', 'release')
  return actions
}

export function operationDefinition(key: GovernanceOperationKey) {
  return GOVERNANCE_OPERATIONS.find((operation) => operation.key === key) || null
}
