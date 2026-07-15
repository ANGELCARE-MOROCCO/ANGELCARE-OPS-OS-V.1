import type { InterventionsState, InterventionOrder, InterventionRequest, InterventionStaff, InterventionEquipment, InterventionInvoice, InterventionIncident } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase10ControlTone = 'bloquant' | 'surveillance' | 'conforme' | 'direction'

export const PHASE10_PRODUCTION_LAUNCH_COMMANDS: Record<InterventionPageKey, {
  title: string
  commandIntent: string
  goLiveNonNegotiable: string
  liveOpsWatch: string[]
  primaryModal: InterventionModalKey
}> = {
  home: { title: 'Tour de contrôle lancement production', commandIntent: 'Transformer le module en système exploitable par vrais utilisateurs sans zone morte opérationnelle.', goLiveNonNegotiable: 'Aucun accès production sans surveillance, support, rollback et owner par flux.', liveOpsWatch: ['adoption rôles', 'incidents ouverts', 'SLA', 'finance MAD'], primaryModal: 'ReportExportModal' },
  command: { title: 'War room Direction', commandIntent: 'Fournir aux exécutifs une lecture immédiate: sécurité patient, SLA, staff, équipement, cash, incidents.', goLiveNonNegotiable: 'Direction voit tous les risques majeurs sans dépendre d’un écran terrain.', liveOpsWatch: ['score lancement', 'risques bloquants', 'cadence war-room', 'exports'], primaryModal: 'ReportExportModal' },
  demandes: { title: 'Contrôle intake production', commandIntent: 'Garantir que chaque demande réelle possède contact, adresse, type, risque, document et décision.', goLiveNonNegotiable: 'Aucune demande sensible ne reste sans triage et owner.', liveOpsWatch: ['demandes sans triage', 'consentements', 'doublons', 'contact +212'], primaryModal: 'TriageDecisionModal' },
  ordres: { title: 'Contrôle exécution ordres', commandIntent: 'Bloquer les ordres sans staff, rendez-vous, équipement requis, checklist ou statut finance.', goLiveNonNegotiable: 'Un ordre actif doit avoir une prochaine action, un owner et une preuve attendue.', liveOpsWatch: ['ordres orphelins', 'staff manquant', 'rapport obligatoire', 'audit'], primaryModal: 'OrderBuilderModal' },
  dispatch: { title: 'Contrôle terrain live', commandIntent: 'Maintenir une vraie discipline dispatch: dispatché, en route, sur site, démarré, terminé, annulé avec raison.', goLiveNonNegotiable: 'Chaque changement terrain crée un événement auditable et une conséquence visible.', liveOpsWatch: ['retards', 'en route', 'incidents', 'réassignations'], primaryModal: 'DispatchConfirmModal' },
  planning: { title: 'Contrôle planning stable', commandIntent: 'Assurer capacité staff, conflits, disponibilités, zones et notifications avant usage réel.', goLiveNonNegotiable: 'Aucun planning publié avec conflit staff ou certification expirée.', liveOpsWatch: ['conflits', 'indisponibilités', 'certifications', 'impression bureau'], primaryModal: 'PlanningAssistantModal' },
  tournees: { title: 'Contrôle tournées terrain', commandIntent: 'Sécuriser routes, arrêts, conducteurs, feuilles terrain, cash closure et retours équipement.', goLiveNonNegotiable: 'Une tournée clôturée doit fermer arrêts, équipement, incidents et finance terrain.', liveOpsWatch: ['arrêts ouverts', 'retours dépôt', 'feuilles imprimées', 'cash closure'], primaryModal: 'RouteBuilderModal' },
  personnel: { title: 'Contrôle adoption staff', commandIntent: 'Préparer médecins, infirmiers, adult-care, équipement et chauffeurs à utiliser les workflows réels.', goLiveNonNegotiable: 'Aucun rôle terrain sans formation, périmètre, permissions et protocole escalade.', liveOpsWatch: ['formation', 'RBAC', 'certifications', 'charge'], primaryModal: 'StaffCertificationModal' },
  patients: { title: 'Contrôle relation bénéficiaire', commandIntent: 'Maintenir un dossier opérationnel utile: contact famille, risque, adresse, consentement, historique.', goLiveNonNegotiable: 'Ne pas transformer en EMR hospitalier; seulement home-care opérationnel avec confidentialité.', liveOpsWatch: ['contacts famille', 'documents', 'risques', 'historique'], primaryModal: 'PatientProfileModal' },
  lieux: { title: 'Contrôle sites Maroc', commandIntent: 'Fiabiliser domiciles, crèches, entreprises, dépôts, consignes accès et zones tarifaires.', goLiveNonNegotiable: 'Aucune intervention terrain sans adresse exploitable et consigne accès si nécessaire.', liveOpsWatch: ['zones', 'accès', 'carte', 'liens patients'], primaryModal: 'MapDrawerModal' },
  equipements: { title: 'Contrôle matériel et consommables', commandIntent: 'Assurer traçabilité des actifs: disponible, réservé, sorti, chez patient, retour, maintenance.', goLiveNonNegotiable: 'Aucun équipement sensible sans mouvement et statut financier/audit.', liveOpsWatch: ['mouvements', 'maintenance', 'stock consommé', 'retours'], primaryModal: 'EquipmentMovementModal' },
  rapports: { title: 'Contrôle reporting production', commandIntent: 'Produire rapports utiles à direction, finance, dispatch, audit et supervision médicale.', goLiveNonNegotiable: 'Chaque export doit être audité avec période, auteur, section et usage.', liveOpsWatch: ['exports', 'rapports journaliers', 'SLA', 'incidents'], primaryModal: 'ReportExportModal' },
  facturation: { title: 'Contrôle cash & MAD', commandIntent: 'Fermer devis, factures, paiements, impayés, remises et exceptions avant production intensive.', goLiveNonNegotiable: 'Aucun dossier terminé sans statut finance explicite.', liveOpsWatch: ['impayés', 'factures manquantes', 'paiements', 'remises'], primaryModal: 'PaymentModal' },
  parametres: { title: 'Contrôle configuration production', commandIntent: 'Verrouiller SLA, tarifs, checklists, permissions, documents requis et modèles imprimables.', goLiveNonNegotiable: 'Tout changement paramètre critique doit créer audit et posséder rollback documenté.', liveOpsWatch: ['RBAC', 'SLA', 'tarifs', 'rollback'], primaryModal: 'PermissionMatrixModal' },
}

export const PHASE10_GO_LIVE_WAR_ROOM = [
  { id: 'launch-day-0', title: 'J0 lancement contrôlé', cadence: 'Toutes les 30 minutes', owner: 'Direction / CEO', evidence: 'Score lancement, incidents ouverts, staff connecté, flux finance MAD', modal: 'ReportExportModal' as InterventionModalKey },
  { id: 'launch-day-1', title: 'J+1 stabilisation', cadence: 'Matin + fin journée', owner: 'Manager Opérations', evidence: 'SLA, réassignations, rapports incomplets, staff bloqué', modal: 'SlaMatrixModal' as InterventionModalKey },
  { id: 'launch-week-1', title: 'Semaine 1 adoption', cadence: 'Quotidien', owner: 'Coordinateur Dispatch', evidence: 'Taux actions réelles, planning publié, tournées clôturées, formations', modal: 'PlanningAssistantModal' as InterventionModalKey },
  { id: 'launch-finance', title: 'Clôture finance production', cadence: 'Fin de journée', owner: 'Finance', evidence: 'Factures, paiements, impayés, remises, exceptions', modal: 'PaymentModal' as InterventionModalKey },
  { id: 'launch-audit', title: 'Audit go-live', cadence: 'Hebdomadaire', owner: 'Audit / Lecture seule', evidence: 'Exports, RBAC, logs mutations, changements paramètres', modal: 'PermissionMatrixModal' as InterventionModalKey },
]

export const PHASE10_PRODUCTION_LOCKS = [
  { id: 'no-dead-buttons', label: 'Aucun bouton mort', owner: 'Product / Engineering', tone: 'bloquant' as Phase10ControlTone, proof: 'Chaque bouton ouvre modal unique, mutation, navigation, filtre, export ou audit.', modal: 'ChecklistBuilderModal' as InterventionModalKey },
  { id: 'modal-uniqueness', label: 'Modals uniques par action', owner: 'Product / Ops', tone: 'bloquant' as Phase10ControlTone, proof: 'Aucune action critique ne réutilise une modal générique non adaptée.', modal: 'WorkflowStageModal' as InterventionModalKey },
  { id: 'assigned-only', label: 'Visibilité assignée terrain', owner: 'Security / RBAC', tone: 'bloquant' as Phase10ControlTone, proof: 'Staff terrain voit uniquement ses interventions; managers voient tout.', modal: 'PermissionMatrixModal' as InterventionModalKey },
  { id: 'mandatory-report', label: 'Rapport obligatoire clôture', owner: 'Superviseur Médical', tone: 'bloquant' as Phase10ControlTone, proof: 'Terminée/Clôturée requiert compte rendu, issue, consommables, incident éventuel.', modal: 'CompleteInterventionReportModal' as InterventionModalKey },
  { id: 'mad-finance', label: 'Finance MAD explicite', owner: 'Finance', tone: 'direction' as Phase10ControlTone, proof: 'Devis/facture/paiement/exception visible pour tous les dossiers terminés.', modal: 'PaymentModal' as InterventionModalKey },
  { id: 'white-enterprise-ui', label: 'UI blanche enterprise', owner: 'Design System', tone: 'conforme' as Phase10ControlTone, proof: 'Module interventions blanc, sidebar unique, pas de double shell global.', modal: 'PrintTemplateModal' as InterventionModalKey },
  { id: 'vercel-safe', label: 'Compatibilité Vercel', owner: 'Engineering', tone: 'surveillance' as Phase10ControlTone, proof: 'Routes API natives Next.js, migrations additives, pas Odoo/Frappe/Docker.', modal: 'ReportExportModal' as InterventionModalKey },
]

export const PHASE10_SUPPORT_RUNBOOKS = [
  { id: 'support-request-stuck', title: 'Demande bloquée au triage', trigger: 'Demande Nouvelle/À trier > SLA', owner: 'Support Client', steps: ['Vérifier téléphone +212', 'Confirmer adresse', 'Ouvrir TriageDecisionModal', 'Notifier dispatch'], modal: 'TriageDecisionModal' as InterventionModalKey },
  { id: 'support-staff-no-show', title: 'Intervenant non disponible / no-show', trigger: 'Statut Dispatchée sans En route', owner: 'Coordinateur Dispatch', steps: ['Contacter staff', 'Ouvrir ReassignStaffModal', 'Mettre audit', 'Informer famille'], modal: 'ReassignStaffModal' as InterventionModalKey },
  { id: 'support-equipment-missing', title: 'Équipement indisponible terrain', trigger: 'Équipement requis non Disponible/Réservé', owner: 'Technicien Équipement', steps: ['Vérifier stock', 'Ouvrir EquipmentMovementModal', 'Substituer matériel', 'Audit équipement'], modal: 'EquipmentMovementModal' as InterventionModalKey },
  { id: 'support-incident-critical', title: 'Incident critique patient/famille', trigger: 'Incident Ouvert + risque Critique/Élevé', owner: 'Superviseur Médical', steps: ['Ouvrir IncidentEscalationModal', 'Assigner owner', 'Informer direction', 'Clôturer preuve'], modal: 'IncidentEscalationModal' as InterventionModalKey },
  { id: 'support-unpaid-completion', title: 'Intervention terminée impayée', trigger: 'Terminée/Clôturée sans paiement complet', owner: 'Finance', steps: ['Créer facture', 'Ouvrir PaymentModal', 'Planifier relance', 'Exporter finance'], modal: 'PaymentModal' as InterventionModalKey },
]

export const PHASE10_OBSERVABILITY_SIGNALS = [
  { id: 'signal-action-rate', label: 'Taux actions réelles', target: '100% boutons critiques', owner: 'Engineering', modal: 'ChecklistBuilderModal' as InterventionModalKey },
  { id: 'signal-audit-rate', label: 'Couverture audit', target: '≥ 95% mutations critiques', owner: 'Audit', modal: 'ReportExportModal' as InterventionModalKey },
  { id: 'signal-sla-breach', label: 'Retards SLA', target: '0 critique non assigné', owner: 'Operations', modal: 'SlaMatrixModal' as InterventionModalKey },
  { id: 'signal-training', label: 'Adoption staff', target: 'Tous rôles formés avant go-live complet', owner: 'Manager Opérations', modal: 'StaffCertificationModal' as InterventionModalKey },
  { id: 'signal-cash', label: 'Cash closure MAD', target: '100% dossiers clôturés avec finance explicite', owner: 'Finance', modal: 'PaymentModal' as InterventionModalKey },
]

export const PHASE10_ROLLBACK_AND_CHANGE_CONTROL = [
  { id: 'rollback-feature-flag', label: 'Gel/rollback module interventions', allowedBy: 'Direction / CEO + Engineering', condition: 'Erreur bloquante production ou incident RBAC', proof: 'Journal changement + impact + décision', modal: 'PermissionMatrixModal' as InterventionModalKey },
  { id: 'rollback-pricing', label: 'Rollback tarifs MAD', allowedBy: 'Direction / CEO + Finance', condition: 'Tarif erroné ou remise abusive', proof: 'Règle précédente, période, factures impactées', modal: 'PricingRuleModal' as InterventionModalKey },
  { id: 'rollback-workflow', label: 'Rollback workflow/SLA', allowedBy: 'Manager Opérations', condition: 'Statut bloquant ou conflit dispatch', proof: 'Étape précédente, owner, validation audit', modal: 'WorkflowStageModal' as InterventionModalKey },
  { id: 'rollback-template', label: 'Rollback modèle impression/rapport', allowedBy: 'Audit + Operations', condition: 'Document incomplet ou non conforme', proof: 'Version, période, export concerné', modal: 'PrintTemplateModal' as InterventionModalKey },
]

export function buildPhase10LaunchScore(state: InterventionsState) {
  const activeOrders = state.orders.filter((order: InterventionOrder) => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status))
  const unassigned = activeOrders.filter(order => !order.assignedStaffIds.length).length
  const late = activeOrders.filter(order => new Date(order.slaDueAt).getTime() < Date.now()).length
  const criticalIncidents = state.incidents.filter((incident: InterventionIncident) => incident.status !== 'Résolu' && ['Critique', 'Élevé'].includes(incident.riskLevel)).length
  const missingConsent = state.requests.filter((request: InterventionRequest) => request.consentStatus === 'À collecter' && request.status !== 'Annulée').length
  const expiredOrUnavailable = state.staff.filter((staff: InterventionStaff) => staff.availability === 'Indisponible' || (staff.expiresAt && new Date(staff.expiresAt).getTime() < Date.now())).length
  const equipmentBlocked = state.equipment.filter((equipment: InterventionEquipment) => ['Hors service', 'En maintenance'].includes(equipment.status)).length
  const closedWithoutFinance = state.orders.filter(order => ['Terminée', 'Clôturée'].includes(order.status) && !state.invoices.some((invoice: InterventionInvoice) => invoice.orderId === order.id)).length
  const auditRate = state.audits.length ? Math.min(100, Math.round((state.audits.length / Math.max(1, state.orders.length + state.requests.length)) * 100)) : 0
  const raw = 96 - unassigned * 6 - late * 7 - criticalIncidents * 10 - missingConsent * 5 - expiredOrUnavailable * 3 - equipmentBlocked * 4 - closedWithoutFinance * 8 + Math.min(6, Math.floor(auditRate / 20))
  const score = Math.max(22, Math.min(100, raw))
  return {
    score,
    label: score >= 90 ? 'go-live contrôlé' : score >= 78 ? 'go-live sous surveillance' : score >= 62 ? 'pré-production risquée' : 'blocage production',
    activeOrders,
    unassigned,
    late,
    criticalIncidents,
    missingConsent,
    expiredOrUnavailable,
    equipmentBlocked,
    closedWithoutFinance,
    auditRate,
  }
}

export function buildPhase10ProductionRiskRegister(state: InterventionsState) {
  const rows: Array<{ id: string; title: string; owner: string; severity: Phase10ControlTone; detail: string; modal: InterventionModalKey; entityId?: string; entityType?: string }> = []
  state.orders
    .filter((order: InterventionOrder) => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status) && (!order.assignedStaffIds.length || new Date(order.slaDueAt).getTime() < Date.now()))
    .slice(0, 5)
    .forEach(order => rows.push({ id: `order-${order.id}`, title: `${order.reference} • ${order.patientName}`, owner: 'Coordinateur Dispatch', severity: order.riskLevel === 'Critique' ? 'bloquant' : 'surveillance', detail: !order.assignedStaffIds.length ? 'Ordre actif sans staff assigné.' : 'Ordre actif en retard SLA.', modal: !order.assignedStaffIds.length ? 'StaffAssignmentModal' : 'SlaMatrixModal', entityId: order.id, entityType: 'order' }))
  state.requests
    .filter((request: InterventionRequest) => request.consentStatus === 'À collecter' && request.status !== 'Annulée')
    .slice(0, 4)
    .forEach(request => rows.push({ id: `request-${request.id}`, title: `${request.reference} • ${request.patientName}`, owner: 'Support Client', severity: 'bloquant', detail: 'Consentement/document requis avant workflow terrain.', modal: 'ConsentDocumentModal', entityId: request.id, entityType: 'request' }))
  state.incidents
    .filter((incident: InterventionIncident) => incident.status !== 'Résolu')
    .slice(0, 4)
    .forEach(incident => rows.push({ id: `incident-${incident.id}`, title: incident.title, owner: incident.owner, severity: incident.riskLevel === 'Critique' ? 'bloquant' : 'surveillance', detail: `Incident ${incident.status} à traiter avant stabilisation production.`, modal: 'IncidentEscalationModal', entityId: incident.id, entityType: 'incident' }))
  state.invoices
    .filter((invoice: InterventionInvoice) => invoice.paidMad < invoice.amountMad && ['Émise', 'Partiellement payée', 'Impayée'].includes(invoice.status))
    .slice(0, 4)
    .forEach(invoice => rows.push({ id: `invoice-${invoice.id}`, title: `${invoice.reference} • ${invoice.patientName}`, owner: 'Finance', severity: 'direction', detail: `Reste à encaisser: ${invoice.amountMad - invoice.paidMad} MAD.`, modal: 'PaymentModal', entityId: invoice.id, entityType: 'invoice' }))
  return rows.slice(0, 12)
}

export function buildPhase10RoleGoLiveReadiness(state: InterventionsState) {
  const staffByRole = new Map<string, number>()
  state.staff.forEach((staff: InterventionStaff) => staffByRole.set(staff.role, (staffByRole.get(staff.role) || 0) + 1))
  return [
    { role: 'Direction / CEO', ready: true, coverage: 'Command, rapports, audit, finance MAD', modal: 'ReportExportModal' as InterventionModalKey },
    { role: 'Manager Opérations', ready: state.orders.length > 0, coverage: 'Ordres, planning, continuité, exceptions', modal: 'SlaMatrixModal' as InterventionModalKey },
    { role: 'Coordinateur Dispatch', ready: state.appointments.length > 0, coverage: 'Dispatch, en route, sur site, réassignation', modal: 'DispatchConfirmModal' as InterventionModalKey },
    { role: 'Superviseur Médical', ready: state.incidents.length >= 0, coverage: 'Triage, risque, incident, clôture rapport', modal: 'IncidentEscalationModal' as InterventionModalKey },
    { role: 'Médecin', ready: (staffByRole.get('Médecin') || 0) > 0, coverage: 'Interventions médecin assignées', modal: 'StaffCertificationModal' as InterventionModalKey },
    { role: 'Infirmier', ready: (staffByRole.get('Infirmier') || 0) > 0, coverage: 'Soins infirmiers et checklist', modal: 'StaffCertificationModal' as InterventionModalKey },
    { role: 'Adult-care', ready: (staffByRole.get('Aide-soignant') || 0) > 0 || (staffByRole.get('Auxiliaire de vie') || 0) > 0, coverage: 'Assistance adulte et suivi famille', modal: 'CarePlanModal' as InterventionModalKey },
    { role: 'Équipement', ready: (staffByRole.get('Technicien Équipement') || 0) > 0 && state.equipment.length > 0, coverage: 'Mouvements, retours, maintenance', modal: 'EquipmentMovementModal' as InterventionModalKey },
    { role: 'Finance', ready: state.invoices.length > 0, coverage: 'Devis, factures, paiements, impayés', modal: 'PaymentModal' as InterventionModalKey },
    { role: 'Audit / Lecture seule', ready: state.audits.length > 0, coverage: 'Lecture audit et exports', modal: 'PermissionMatrixModal' as InterventionModalKey },
  ]
}

export function buildPhase10CutoverChecklist(state: InterventionsState) {
  const launch = buildPhase10LaunchScore(state)
  return [
    { area: 'Architecture', status: 'validé', detail: 'Module natif Next.js/Vercel, pas Odoo/Frappe/Docker.', modal: 'ReportExportModal' as InterventionModalKey },
    { area: 'Sidebar unique', status: 'validé', detail: 'Navigation Interventions standard et synchronisée.', modal: 'PrintTemplateModal' as InterventionModalKey },
    { area: 'Workflow réel', status: launch.unassigned ? 'surveillance' : 'validé', detail: `${launch.unassigned} ordres actifs sans staff.`, modal: 'StaffAssignmentModal' as InterventionModalKey },
    { area: 'SLA', status: launch.late ? 'bloquant' : 'validé', detail: `${launch.late} retards SLA actifs.`, modal: 'SlaMatrixModal' as InterventionModalKey },
    { area: 'Sécurité patient', status: launch.missingConsent || launch.criticalIncidents ? 'bloquant' : 'validé', detail: `${launch.missingConsent} consentements à collecter, ${launch.criticalIncidents} incidents critiques/élevés.`, modal: 'ConsentDocumentModal' as InterventionModalKey },
    { area: 'Finance MAD', status: launch.closedWithoutFinance ? 'bloquant' : 'validé', detail: `${launch.closedWithoutFinance} dossiers clôturés sans finance explicite.`, modal: 'PaymentModal' as InterventionModalKey },
    { area: 'Audit', status: launch.auditRate >= 60 ? 'validé' : 'surveillance', detail: `Couverture audit estimée ${launch.auditRate}%.`, modal: 'PermissionMatrixModal' as InterventionModalKey },
    { area: 'Support runbooks', status: 'validé', detail: `${PHASE10_SUPPORT_RUNBOOKS.length} runbooks de production prêts.`, modal: 'ChecklistBuilderModal' as InterventionModalKey },
  ]
}
