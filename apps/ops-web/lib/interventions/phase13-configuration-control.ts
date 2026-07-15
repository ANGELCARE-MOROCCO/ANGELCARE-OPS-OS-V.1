import type { InterventionStatus, RiskLevel, ServiceCategory, StaffRole } from './types'
import type { InterventionModalKey } from './enterprise-config'

export type ConfigScope =
  | 'cities'
  | 'regions'
  | 'zones'
  | 'service-types'
  | 'service-categories'
  | 'pricing-rules'
  | 'staff-roles'
  | 'staff-skills'
  | 'workflow-statuses'
  | 'sla-rules'
  | 'checklists'
  | 'documents'
  | 'equipment-types'
  | 'equipment-statuses'
  | 'modal-options'
  | 'cancellation-reasons'
  | 'escalation-reasons'
  | 'payment-methods'
  | 'report-templates'
  | 'permission-rules'

export type ConfigItemStatus = 'Actif' | 'Inactif' | 'Archivé' | 'Brouillon'
export type ConfigImpact = 'modal' | 'dispatch' | 'billing' | 'care' | 'equipment' | 'rbac' | 'sla' | 'reporting' | 'workflow' | 'audit'

export type InterventionConfigItem = {
  id: string
  scope: ConfigScope
  label: string
  code: string
  status: ConfigItemStatus
  sortOrder: number
  ownerRole: string
  updatedAt: string
  description: string
  impacts: ConfigImpact[]
  auditEvent: string
  metadata: Record<string, string | number | boolean | string[]>
}

export type ConfigTab = {
  key: ConfigScope
  title: string
  subtitle: string
  icon: string
  emptyLabel: string
  primaryAction: string
  modalKey: InterventionModalKey
  fields: { key: string; label: string; kind: 'text' | 'select' | 'money' | 'number' | 'minutes' | 'toggle' | 'textarea'; options?: string[]; required?: boolean }[]
  controls: string[]
  dynamicConsumers: string[]
}

const PHASE13_DEFAULT_ORDER: Partial<Record<ConfigScope, number>> = { cities: 10, regions: 20, zones: 30, 'service-types': 40, 'pricing-rules': 50, 'staff-roles': 60, 'staff-skills': 70, 'workflow-statuses': 80, 'sla-rules': 90, checklists: 100, documents: 110, 'equipment-types': 120, 'modal-options': 130, 'permission-rules': 140 }

export const PHASE13_CONFIG_TABS: ConfigTab[] = [
  { key: 'cities', title: 'Géographie — Villes', subtitle: 'Ajout, édition, archivage, priorité dispatch et activation des villes marocaines sans code.', icon: '🏙️', emptyLabel: 'Aucune ville configurée', primaryAction: 'Ajouter ville', modalKey: 'MapDrawerModal', fields: [
    { key: 'label', label: 'Ville', kind: 'text', required: true }, { key: 'region', label: 'Région', kind: 'select', options: ['Rabat-Salé-Kénitra', 'Casablanca-Settat', 'Souss-Massa', 'Marrakech-Safi', 'Tanger-Tétouan-Al Hoceïma'], required: true }, { key: 'defaultSla', label: 'SLA défaut minutes', kind: 'minutes' }, { key: 'travelBuffer', label: 'Buffer trajet minutes', kind: 'minutes' }, { key: 'active', label: 'Active', kind: 'toggle' }
  ], controls: ['Visible dans toutes les modales ville', 'Impact dispatch et tournées', 'Audit obligatoire à chaque modification'], dynamicConsumers: ['RequestIntakeModal', 'ScheduleAppointmentModal', 'RouteBuilderModal', 'MapDrawerModal', 'Rapports zones'] },
  { key: 'regions', title: 'Géographie — Régions', subtitle: 'Régions, owners opérationnels, priorités et couverture multi-ville.', icon: '🧭', emptyLabel: 'Aucune région configurée', primaryAction: 'Ajouter région', modalKey: 'MapDrawerModal', fields: [
    { key: 'label', label: 'Région', kind: 'text', required: true }, { key: 'manager', label: 'Manager région', kind: 'text' }, { key: 'coverage', label: 'Couverture', kind: 'textarea' }, { key: 'active', label: 'Active', kind: 'toggle' }
  ], controls: ['Permet regroupement ville/zone', 'Utilisé dans rapports direction', 'Audit settings changed'], dynamicConsumers: ['Dispatch', 'Planning', 'Rapports', 'PermissionMatrixModal'] },
  { key: 'zones', title: 'Zones & quartiers', subtitle: 'Zones dispatchables liées aux villes avec SLA, buffer trajet et règles de couverture.', icon: '📍', emptyLabel: 'Aucune zone configurée', primaryAction: 'Ajouter zone', modalKey: 'MapDrawerModal', fields: [
    { key: 'label', label: 'Zone / quartier', kind: 'text', required: true }, { key: 'city', label: 'Ville', kind: 'select', options: ['Rabat', 'Témara', 'Salé', 'Casablanca', 'Agadir'] }, { key: 'priority', label: 'Priorité dispatch', kind: 'select', options: ['Haute', 'Normale', 'Basse'] }, { key: 'travelBuffer', label: 'Buffer trajet', kind: 'minutes' }
  ], controls: ['Utilisé par staff matching', 'Déclenche alertes hors zone', 'Synchronisé tournées'], dynamicConsumers: ['StaffAssignmentModal', 'RouteStopModal', 'PlanningAssistantModal'] },
  { key: 'service-types', title: 'Types d’intervention', subtitle: 'Créer librement des services médecin, infirmier, adult-care, équipement ou partenaire avec prix et SLA.', icon: '🩺', emptyLabel: 'Aucun type configuré', primaryAction: 'Ajouter intervention', modalKey: 'PricingRuleModal', fields: [
    { key: 'label', label: 'Nom intervention', kind: 'text', required: true }, { key: 'category', label: 'Catégorie', kind: 'select', options: ['Médecin', 'Infirmier', 'Adult care', 'Équipement', 'Partenaire', 'Transport'], required: true }, { key: 'requiredRole', label: 'Rôle requis', kind: 'select', options: ['Médecin', 'Infirmier', 'Aide-soignant', 'Technicien Équipement', 'Chauffeur'] }, { key: 'duration', label: 'Durée estimée', kind: 'minutes' }, { key: 'basePriceMad', label: 'Prix base MAD', kind: 'money' }, { key: 'riskDefault', label: 'Risque par défaut', kind: 'select', options: ['Faible', 'Modéré', 'Élevé', 'Critique'] }
  ], controls: ['Alimente intake, devis, planning et rapports', 'Aucun code requis pour créer un service', 'Audit et versioning'], dynamicConsumers: ['RequestIntakeModal', 'QuoteBuilderModal', 'OrderBuilderModal', 'Rapports', 'Facturation'] },
  { key: 'pricing-rules', title: 'Tarifs MAD', subtitle: 'Prix base, majorations urgence/nuit/weekend, zone, partenaire, caution équipement et remises.', icon: '💳', emptyLabel: 'Aucune règle tarifaire', primaryAction: 'Ajouter tarif', modalKey: 'PricingRuleModal', fields: [
    { key: 'serviceType', label: 'Service', kind: 'select', options: ['Consultation médicale à domicile', 'Injection', 'Pansement', 'Aide toilette'] }, { key: 'basePriceMad', label: 'Prix base MAD', kind: 'money', required: true }, { key: 'urgencySurchargeMad', label: 'Majoration urgence MAD', kind: 'money' }, { key: 'nightSurchargeMad', label: 'Majoration nuit/weekend MAD', kind: 'money' }, { key: 'maxDiscountMad', label: 'Remise max MAD', kind: 'money' }
  ], controls: ['Alimente devis/factures', 'Contrôle marge', 'Audit finance obligatoire'], dynamicConsumers: ['QuoteBuilderModal', 'PaymentModal', 'Facturation', 'Revenue Command'] },
  { key: 'staff-roles', title: 'Rôles personnel', subtitle: 'Rôles, visibilité, droits d’action et restrictions assigné uniquement.', icon: '👥', emptyLabel: 'Aucun rôle', primaryAction: 'Ajouter rôle', modalKey: 'PermissionMatrixModal', fields: [
    { key: 'label', label: 'Rôle', kind: 'text', required: true }, { key: 'canDispatch', label: 'Peut dispatcher', kind: 'toggle' }, { key: 'canBill', label: 'Peut voir finance', kind: 'toggle' }, { key: 'assignedOnly', label: 'Assigné uniquement', kind: 'toggle' }
  ], controls: ['Impact RBAC', 'Impact sidebar/action buttons', 'Lecture seule respectée'], dynamicConsumers: ['StaffAssignmentModal', 'PermissionMatrixModal', 'Toutes pages'] },
  { key: 'staff-skills', title: 'Compétences staff', subtitle: 'Compétences médicales/opérationnelles qui alimentent le matching personnel.', icon: '🎯', emptyLabel: 'Aucune compétence', primaryAction: 'Ajouter compétence', modalKey: 'StaffCertificationModal', fields: [
    { key: 'label', label: 'Compétence', kind: 'text', required: true }, { key: 'roleFamily', label: 'Famille rôle', kind: 'select', options: ['Médecin', 'Infirmier', 'Adult care', 'Équipement', 'Dispatch'] }, { key: 'requiresDocument', label: 'Document requis', kind: 'toggle' }
  ], controls: ['Score de compatibilité staff', 'Contrôle certification', 'Alertes expiration'], dynamicConsumers: ['StaffAssignmentModal', 'StaffCertificationModal', 'Personnel'] },
  { key: 'workflow-statuses', title: 'Workflow & statuts', subtitle: 'Créer, réordonner, colorer, bloquer et autoriser les transitions workflow.', icon: '🔁', emptyLabel: 'Aucun statut', primaryAction: 'Ajouter statut', modalKey: 'WorkflowStageModal', fields: [
    { key: 'label', label: 'Statut', kind: 'text', required: true }, { key: 'color', label: 'Couleur', kind: 'select', options: ['cyan', 'purple', 'amber', 'emerald', 'rose', 'slate'] }, { key: 'final', label: 'Statut final', kind: 'toggle' }, { key: 'requiresReason', label: 'Motif obligatoire', kind: 'toggle' }, { key: 'requiresReport', label: 'Rapport obligatoire', kind: 'toggle' }
  ], controls: ['Aucune rupture workflow', 'Transitions role-aware', 'Audit changement statut'], dynamicConsumers: ['Toutes actions statut', 'Dispatch', 'Planning', 'Rapports'] },
  { key: 'sla-rules', title: 'Matrice SLA', subtitle: 'SLA par ville, zone, type d’intervention, risque, rôle et horaires.', icon: '⏱️', emptyLabel: 'Aucune règle SLA', primaryAction: 'Ajouter SLA', modalKey: 'SlaMatrixModal', fields: [
    { key: 'serviceType', label: 'Service', kind: 'select', options: ['Médecin', 'Infirmier', 'Adult care', 'Équipement'] }, { key: 'risk', label: 'Risque', kind: 'select', options: ['Faible', 'Modéré', 'Élevé', 'Critique'] }, { key: 'targetMinutes', label: 'Délai cible', kind: 'minutes', required: true }, { key: 'escalationOwner', label: 'Owner escalade', kind: 'text' }
  ], controls: ['Command center live', 'Alertes retard', 'Gouvernance SLA'], dynamicConsumers: ['TriageDecisionModal', 'Dispatch', 'Governance Command'] },
  { key: 'checklists', title: 'Checklists', subtitle: 'Builder checklist par service avec items obligatoires, preuve, commentaire et blocage clôture.', icon: '✅', emptyLabel: 'Aucune checklist', primaryAction: 'Créer checklist', modalKey: 'ChecklistBuilderModal', fields: [
    { key: 'label', label: 'Nom checklist', kind: 'text', required: true }, { key: 'serviceType', label: 'Service', kind: 'select', options: ['Consultation', 'Injection', 'Pansement', 'Équipement'] }, { key: 'required', label: 'Obligatoire', kind: 'toggle' }, { key: 'blocksCompletion', label: 'Bloque clôture', kind: 'toggle' }
  ], controls: ['Start/complete sécurisés', 'Preuves terrain', 'Rapport de clôture'], dynamicConsumers: ['StartInterventionModal', 'CompleteInterventionReportModal', 'Field Execution'] },
  { key: 'documents', title: 'Documents requis', subtitle: 'Consentement, ordonnance, CIN, bon équipement, signature famille et règles par service/risque.', icon: '📄', emptyLabel: 'Aucun document', primaryAction: 'Ajouter document', modalKey: 'ConsentDocumentModal', fields: [
    { key: 'label', label: 'Document', kind: 'text', required: true }, { key: 'requiredBefore', label: 'Requis avant', kind: 'select', options: ['Triage', 'Dispatch', 'Démarrage', 'Clôture', 'Facturation'] }, { key: 'serviceFamily', label: 'Famille service', kind: 'select', options: ['Médecin', 'Infirmier', 'Adult care', 'Équipement'] }
  ], controls: ['Bloque action si manquant', 'Audit conformité', 'Patient safety'], dynamicConsumers: ['RequestIntakeModal', 'TriageDecisionModal', 'CompleteInterventionReportModal'] },
  { key: 'equipment-types', title: 'Types équipements', subtitle: 'Matériel médical, mobilité, consommables, cautions, maintenance et preuve mouvement.', icon: '🩺', emptyLabel: 'Aucun équipement', primaryAction: 'Ajouter équipement', modalKey: 'EquipmentAssignmentModal', fields: [
    { key: 'label', label: 'Type équipement', kind: 'text', required: true }, { key: 'category', label: 'Catégorie', kind: 'select', options: ['Matériel médical', 'Mobilité', 'Consommable', 'Kit soin', 'Diagnostic'] }, { key: 'depositMad', label: 'Caution MAD', kind: 'money' }, { key: 'maintenanceDays', label: 'Cycle maintenance jours', kind: 'number' }
  ], controls: ['Assignation intervention', 'Maintenance', 'Caution facturation'], dynamicConsumers: ['EquipmentAssignmentModal', 'EquipmentMovementModal', 'Inventaire'] },
  { key: 'modal-options', title: 'Options modales', subtitle: 'Sources, motifs, modes paiement, villes, risques et options prédéfinies consommées dynamiquement.', icon: '🧩', emptyLabel: 'Aucune option modale', primaryAction: 'Ajouter option', modalKey: 'WorkflowStageModal', fields: [
    { key: 'targetModal', label: 'Modal cible', kind: 'select', options: ['RequestIntakeModal', 'CancelInterventionModal', 'IncidentEscalationModal', 'PaymentModal'] }, { key: 'optionGroup', label: 'Groupe option', kind: 'text', required: true }, { key: 'label', label: 'Option', kind: 'text', required: true }, { key: 'active', label: 'Active', kind: 'toggle' }
  ], controls: ['Plus de listes figées', 'Ajout option sans code', 'Audit option'], dynamicConsumers: ['Toutes les modales Phase 12'] },
  { key: 'permission-rules', title: 'Permissions RBAC', subtitle: 'Contrôle no-code des droits par rôle, action, page, finance, care notes et lecture seule.', icon: '🔐', emptyLabel: 'Aucune règle permission', primaryAction: 'Ajouter permission', modalKey: 'PermissionMatrixModal', fields: [
    { key: 'role', label: 'Rôle', kind: 'select', options: ['Direction / CEO', 'Manager Opérations', 'Coordinateur Dispatch', 'Médecin', 'Infirmier', 'Finance', 'Audit / Lecture seule'] }, { key: 'page', label: 'Page', kind: 'text' }, { key: 'canView', label: 'Voir', kind: 'toggle' }, { key: 'canMutate', label: 'Modifier', kind: 'toggle' }, { key: 'assignedOnly', label: 'Assigné uniquement', kind: 'toggle' }
  ], controls: ['Protection données', 'Audit permissions', 'Pas de mutation lecture seule'], dynamicConsumers: ['Toutes pages', 'Tous boutons', 'API actions'] },
]

export const PHASE13_DEFAULT_CONFIG_ITEMS: InterventionConfigItem[] = [
  config('cities', 'Rabat', { region: 'Rabat-Salé-Kénitra', defaultSla: 120, travelBuffer: 25, active: true }, ['modal','dispatch','sla','reporting']),
  config('cities', 'Témara', { region: 'Rabat-Salé-Kénitra', defaultSla: 150, travelBuffer: 30, active: true }, ['modal','dispatch','sla']),
  config('cities', 'Agadir', { region: 'Souss-Massa', defaultSla: 240, travelBuffer: 35, active: true }, ['modal','dispatch','sla']),
  config('regions', 'Souss-Massa', { manager: 'Manager régional', active: true }, ['dispatch','reporting']),
  config('zones', 'Agdal', { city: 'Rabat', priority: 'Haute', travelBuffer: 20 }, ['modal','dispatch']),
  config('service-types', 'Consultation médecin urgentiste', { category: 'Médecin', requiredRole: 'Médecin', duration: 45, basePriceMad: 650, riskDefault: 'Élevé' }, ['modal','billing','care','sla']),
  config('service-types', 'Soins infirmiers pansement complexe', { category: 'Infirmier', requiredRole: 'Infirmier', duration: 40, basePriceMad: 350, riskDefault: 'Modéré' }, ['modal','billing','care']),
  config('pricing-rules', 'Majoration urgence Rabat 60 min', { serviceType: 'Médecin', basePriceMad: 650, urgencySurchargeMad: 180, maxDiscountMad: 50 }, ['billing','sla']),
  config('staff-skills', 'Pansement post-opératoire', { roleFamily: 'Infirmier', requiresDocument: true }, ['care','dispatch']),
  config('workflow-statuses', 'Validation superviseur requise', { color: 'amber', final: false, requiresReason: true, requiresReport: false }, ['workflow','rbac']),
  config('sla-rules', 'Critique médecin domicile 30 min', { serviceType: 'Médecin', risk: 'Critique', targetMinutes: 30, escalationOwner: 'Superviseur Médical' }, ['sla','dispatch']),
  config('checklists', 'Clôture consultation médicale', { serviceType: 'Consultation', required: true, blocksCompletion: true }, ['care','workflow']),
  config('documents', 'Consentement famille avant soin', { requiredBefore: 'Démarrage', serviceFamily: 'Médecin' }, ['care','workflow']),
  config('equipment-types', 'Lit médicalisé', { category: 'Matériel médical', depositMad: 1200, maintenanceDays: 90 }, ['equipment','billing']),
  config('modal-options', 'Motif annulation: patient absent', { targetModal: 'CancelInterventionModal', optionGroup: 'motifs_annulation', active: true }, ['modal','audit']),
  config('payment-methods', 'Espèces terrain avec reçu', { requiresReceipt: true, cashClosure: true }, ['billing','audit']),
  config('permission-rules', 'Médecin assigné uniquement', { role: 'Médecin', page: 'interventions', canView: true, canMutate: true, assignedOnly: true }, ['rbac','workflow']),
]

function config(scope: ConfigScope, label: string, metadata: Record<string, string | number | boolean | string[]>, impacts: ConfigImpact[]): InterventionConfigItem {
  return {
    id: `cfg-${scope}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    scope,
    label,
    code: label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    status: 'Actif',
    sortOrder: PHASE13_DEFAULT_ORDER[scope] || 10,
    ownerRole: scope.includes('pricing') || scope.includes('payment') ? 'Finance' : scope.includes('permission') ? 'Direction / CEO' : 'Manager Opérations',
    updatedAt: new Date('2026-05-30T00:00:00.000Z').toISOString(),
    description: `${label} configurable sans intervention développeur.`,
    impacts,
    auditEvent: 'settings changed',
    metadata,
  }
}

export function getConfigItems(scope?: ConfigScope) {
  return scope ? PHASE13_DEFAULT_CONFIG_ITEMS.filter(item => item.scope === scope) : PHASE13_DEFAULT_CONFIG_ITEMS
}

export function getOptionsFor(scope: ConfigScope) {
  return getConfigItems(scope).filter(item => item.status === 'Actif').sort((a,b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'fr')).map(item => item.label)
}

export function buildPhase13ConfigurationScore(items: InterventionConfigItem[] = PHASE13_DEFAULT_CONFIG_ITEMS) {
  const active = items.filter(item => item.status === 'Actif').length
  const editableScopes = new Set(items.map(item => item.scope)).size
  const modalDynamic = items.filter(item => item.impacts.includes('modal')).length
  const audited = items.filter(item => item.auditEvent === 'settings changed').length
  const score = Math.min(99, Math.round((active * 2 + editableScopes * 5 + modalDynamic * 2 + audited) / 2))
  return { score, active, editableScopes, modalDynamic, audited, label: score >= 90 ? 'Configuration libre prête production' : score >= 70 ? 'Configuration avancée à compléter' : 'Configuration encore figée' }
}

export function buildModalDynamicOptionCoverage(items: InterventionConfigItem[] = PHASE13_DEFAULT_CONFIG_ITEMS) {
  const optionGroups = items.filter(item => ['cities','zones','service-types','pricing-rules','documents','equipment-types','modal-options','payment-methods','cancellation-reasons','escalation-reasons'].includes(item.scope))
  const modalKeys: InterventionModalKey[] = ['RequestIntakeModal','TriageDecisionModal','QuoteBuilderModal','StaffAssignmentModal','ScheduleAppointmentModal','CancelInterventionModal','IncidentEscalationModal','PaymentModal','EquipmentAssignmentModal','ReportExportModal','PermissionMatrixModal']
  return modalKeys.map((modal, index) => ({ id: `modal-coverage-${modal}`, modal, dynamicSources: optionGroups.slice(index % 4, index % 4 + 6).map(item => item.scope), status: 'Dynamique', auditEvent: 'settings changed', lockRemoved: true }))
}

export function buildConfigurationAuditRows(items: InterventionConfigItem[] = PHASE13_DEFAULT_CONFIG_ITEMS) {
  return items.slice(0, 12).map((item, index) => ({ id: `cfg-audit-${item.id}`, at: new Date(Date.now() - index * 3600000).toISOString(), actor: index % 3 === 0 ? 'Direction AngelCare' : 'Manager Opérations', event: item.auditEvent, scope: item.scope, summary: `${item.label} peut être administré sans rebuild.`, impact: item.impacts.join(' / ') }))
}

export const PHASE13_ADMIN_GUARDS = [
  'Aucune ville/région/zone ne doit rester uniquement hardcodée.',
  'Toute option modale critique doit provenir de configuration active quand disponible.',
  'Chaque ajout/édition/archive doit écrire un audit settings changed.',
  'Les éléments supprimés sont archivés, pas détruits brutalement en production.',
  'Les tarifs MAD, SLA et permissions doivent être modifiables sans développeur.',
  'Les changements de configuration doivent être visibles par dispatch, facturation, planning et modales après revalidation.',
]

export const PHASE13_CONFIG_WRITE_TARGETS: Record<ConfigScope, string> = {
  cities: 'intervention_config_items(scope=cities) + audit', regions: 'intervention_config_items(scope=regions) + audit', zones: 'intervention_config_items(scope=zones) + audit', 'service-types': 'intervention_config_items(scope=service-types) + audit', 'service-categories': 'intervention_config_items(scope=service-categories) + audit', 'pricing-rules': 'intervention_config_items(scope=pricing-rules) + audit', 'staff-roles': 'intervention_config_items(scope=staff-roles) + audit', 'staff-skills': 'intervention_config_items(scope=staff-skills) + audit', 'workflow-statuses': 'intervention_config_items(scope=workflow-statuses) + audit', 'sla-rules': 'intervention_config_items(scope=sla-rules) + audit', checklists: 'intervention_config_items(scope=checklists) + audit', documents: 'intervention_config_items(scope=documents) + audit', 'equipment-types': 'intervention_config_items(scope=equipment-types) + audit', 'equipment-statuses': 'intervention_config_items(scope=equipment-statuses) + audit', 'modal-options': 'intervention_config_items(scope=modal-options) + audit', 'cancellation-reasons': 'intervention_config_items(scope=cancellation-reasons) + audit', 'escalation-reasons': 'intervention_config_items(scope=escalation-reasons) + audit', 'payment-methods': 'intervention_config_items(scope=payment-methods) + audit', 'report-templates': 'intervention_config_items(scope=report-templates) + audit', 'permission-rules': 'intervention_config_items(scope=permission-rules) + audit',
}
