import type { InterventionsState } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase3ExecutionLayer = {
  layer: string
  owner: string
  productionQuestion: string
  hardControl: string
  escalation: string
}

export const PHASE3_EXECUTION_LAYERS: Phase3ExecutionLayer[] = [
  { layer: 'Intake & triage', owner: 'Coordinateur Dispatch', productionQuestion: 'La demande est-elle complète, localisée et priorisée avant conversion ?', hardControl: 'Blocage si patient/contact/ville/type/risque manquant', escalation: 'Manager Opérations' },
  { layer: 'Ordre & protocole', owner: 'Manager Opérations', productionQuestion: 'L’ordre contient-il checklist, SLA, staff requis, équipement et facturation ?', hardControl: 'Impossible de clôturer sans compte-rendu et résultat', escalation: 'Superviseur Médical' },
  { layer: 'Affectation staff', owner: 'Coordinateur Dispatch', productionQuestion: 'Le personnel est-il qualifié, disponible, dans la bonne zone et non en conflit ?', hardControl: 'Signalement conflit disponibilité/compétence/charge', escalation: 'Manager Opérations' },
  { layer: 'Planning terrain', owner: 'Coordinateur Dispatch', productionQuestion: 'Le créneau respecte-t-il SLA, disponibilité, tournée et distance ?', hardControl: 'Détection conflit et retard avant dispatch', escalation: 'Manager Opérations' },
  { layer: 'Tournée & route', owner: 'Chauffeur / Responsable tournée', productionQuestion: 'Les arrêts sont ordonnés, confirmés et reliés au staff/équipement ?', hardControl: 'Feuille de tournée imprimable et auditée', escalation: 'Dispatch' },
  { layer: 'Équipement & stock', owner: 'Technicien Équipement', productionQuestion: 'L’équipement est-il disponible, assigné, traçable et conforme ?', hardControl: 'Mouvement obligatoire pour tout changement de statut', escalation: 'Équipement Team Lead' },
  { layer: 'Exécution intervention', owner: 'Médecin / Infirmier / Adult-care', productionQuestion: 'Le terrain suit-il les étapes En route → Sur site → En cours → Terminé ?', hardControl: 'Chaque changement crée timestamp + audit', escalation: 'Superviseur Médical' },
  { layer: 'Incident & risque', owner: 'Superviseur Médical', productionQuestion: 'Tout risque critique est-il visible et escaladé immédiatement ?', hardControl: 'Incident ouvert visible Command Center + Dispatch', escalation: 'Direction / CEO' },
  { layer: 'Facturation MAD', owner: 'Finance', productionQuestion: 'L’intervention terminée est-elle facturable, payée ou suivie ?', hardControl: 'Montants MAD, paiement, reste à payer et audit finance', escalation: 'Finance Manager' },
  { layer: 'Audit & permissions', owner: 'Audit / Direction', productionQuestion: 'Les mutations sont-elles traçables et role-aware ?', hardControl: 'Lecture seule sans mutation + audit obligatoire', escalation: 'CEO / Admin' },
]

export const PAGE_CONTROL_ROOMS: Record<InterventionPageKey, { title: string; focus: string; operatingCadence: string; controls: string[]; criticalButtons: InterventionModalKey[] }> = {
  home: { title: 'Entrée Intervention OS', focus: 'Redirection naturelle vers Command Center avec vue globale.', operatingCadence: 'Vue exécutive au lancement', controls: ['Sidebar synchronisée', 'KPI visibles', 'Actions directes'], criticalButtons: ['RequestIntakeModal', 'IncidentEscalationModal', 'PlanningAssistantModal'] },
  command: { title: 'Command Center', focus: 'Surveillance live des urgences, SLA, staff, incidents, équipement et MAD.', operatingCadence: 'Toutes les 45 secondes ou mutation critique', controls: ['SLA court', 'Incidents ouverts', 'Revenu jour', 'Audit feed'], criticalButtons: ['RequestIntakeModal', 'IncidentEscalationModal', 'StaffAssignmentModal', 'ReportExportModal'] },
  demandes: { title: 'Demandes & triage', focus: 'Transformer la demande brute en dossier exploitable.', operatingCadence: 'À chaque appel/WhatsApp/partenaire', controls: ['Consentement', 'Risque', 'Ville/zone', 'Source'], criticalButtons: ['RequestIntakeModal', 'TriageDecisionModal', 'ConvertRequestToOrderModal', 'QuoteBuilderModal'] },
  ordres: { title: 'Ordres d’intervention', focus: 'Centraliser protocole, affectation, planification, équipement et clôture.', operatingCadence: 'Avant et après chaque intervention', controls: ['Checklist', 'SLA', 'Staff', 'Équipement', 'Facturation'], criticalButtons: ['OrderBuilderModal', 'StaffAssignmentModal', 'ScheduleAppointmentModal', 'CompleteInterventionReportModal'] },
  dispatch: { title: 'Dispatch terrain', focus: 'Piloter le terrain en statuts réels et actions dédiées.', operatingCadence: 'Temps opérationnel permanent', controls: ['Non assigné', 'En route', 'Sur site', 'Incident'], criticalButtons: ['DispatchConfirmModal', 'EnRouteModal', 'ArrivalConfirmationModal', 'StartInterventionModal'] },
  planning: { title: 'Planning', focus: 'Prévenir conflits de disponibilité et retards SLA.', operatingCadence: 'Matin, midi, fin de journée et urgence', controls: ['Conflits', 'Indisponibilités', 'Vues jour/semaine/mois', 'Impression'], criticalButtons: ['ScheduleAppointmentModal', 'PlanningAssistantModal', 'StaffAvailabilityModal', 'PrintTemplateModal'] },
  tournees: { title: 'Tournées', focus: 'Regrouper arrêts, staff, chauffeur, équipement et feuille terrain.', operatingCadence: 'Préparation quotidienne et replanification urgence', controls: ['Ordre arrêts', 'Chauffeur', 'Zone', 'Clôture tournée'], criticalButtons: ['RouteBuilderModal', 'RouteStopModal', 'ReassignStaffModal', 'PrintTemplateModal'] },
  personnel: { title: 'Personnel', focus: 'Sécuriser disponibilité, compétences, charge et certifications.', operatingCadence: 'Avant affectation et revue RH', controls: ['Disponibilité', 'Charge', 'Certifications', 'Éligibilité urgence'], criticalButtons: ['StaffAvailabilityModal', 'StaffCertificationModal', 'StaffAssignmentModal'] },
  patients: { title: 'Patients / bénéficiaires', focus: 'Profil opérationnel home-care sans prétendre à un EMR hospitalier.', operatingCadence: 'Création, historique et mises à jour care', controls: ['Contact famille', 'Adresse', 'Alertes', 'Documents'], criticalButtons: ['PatientProfileModal', 'CarePlanModal', 'ConsentDocumentModal'] },
  lieux: { title: 'Lieux', focus: 'Adresses, consignes accès, zones et sites partenaires.', operatingCadence: 'Avant planification, dispatch et tournée', controls: ['Ville/zone', 'Consignes', 'Lien patient', 'Carte'], criticalButtons: ['MapDrawerModal', 'PatientProfileModal', 'RouteBuilderModal'] },
  equipements: { title: 'Équipements', focus: 'Disponibilité, transit, maintenance, stock et mouvement traçable.', operatingCadence: 'Avant assignation et après retour terrain', controls: ['Statut', 'Série', 'Maintenance', 'Stock consommé'], criticalButtons: ['EquipmentAssignmentModal', 'EquipmentMovementModal', 'InventoryConsumptionModal'] },
  rapports: { title: 'Rapports', focus: 'Contrôle journalier, SLA, staff, zones, incidents, équipement, finance.', operatingCadence: 'Quotidien, hebdomadaire, audit ponctuel', controls: ['Période', 'Sections', 'Export', 'Archivage'], criticalButtons: ['ReportExportModal', 'PrintTemplateModal'] },
  facturation: { title: 'Facturation MAD', focus: 'Devis, factures, paiements, impayés et ajustements.', operatingCadence: 'Après clôture et suivi financier', controls: ['Montant MAD', 'Reste à payer', 'Paiement', 'Remise'], criticalButtons: ['QuoteBuilderModal', 'PaymentModal', 'PricingRuleModal', 'PrintTemplateModal'] },
  parametres: { title: 'Paramètres', focus: 'Workflow, SLA, rôles, checklists, templates, permissions.', operatingCadence: 'Configuration contrôlée et auditée', controls: ['SLA', 'RBAC', 'Templates', 'Permissions'], criticalButtons: ['SlaMatrixModal', 'ChecklistBuilderModal', 'WorkflowStageModal', 'PermissionMatrixModal'] },
}

export function buildProductionReadiness(state: InterventionsState) {
  const totalOrders = Math.max(state.orders.length, 1)
  const assignedOrders = state.orders.filter((order) => order.assignedStaffIds.length > 0).length
  const activeOrders = state.orders.filter((order) => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  const overdueOrders = state.orders.filter((order) => new Date(order.slaDueAt).getTime() < Date.now() && !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  const equipmentReady = state.equipment.filter((item) => ['Disponible', 'Réservé'].includes(item.status)).length
  const staffReady = state.staff.filter((person) => person.availability === 'Disponible' && person.certifications.length > 0).length
  const invoiceRecovery = state.invoices.reduce((sum, invoice) => sum + invoice.paidMad, 0)
  const invoiceTotal = Math.max(state.invoices.reduce((sum, invoice) => sum + invoice.amountMad, 0), 1)

  return [
    { label: 'Ordres assignés', value: `${Math.round((assignedOrders / totalOrders) * 100)}%`, detail: `${assignedOrders}/${state.orders.length} avec staff`, severity: assignedOrders === state.orders.length ? 'success' : 'warning' },
    { label: 'Pression SLA', value: overdueOrders, detail: `${activeOrders} ordres actifs`, severity: overdueOrders > 0 ? 'danger' : 'success' },
    { label: 'Personnel prêt', value: staffReady, detail: 'certifié + disponible', severity: staffReady > 0 ? 'success' : 'danger' },
    { label: 'Équipement prêt', value: equipmentReady, detail: 'disponible ou réservé', severity: equipmentReady > 0 ? 'success' : 'warning' },
    { label: 'Recouvrement', value: `${Math.round((invoiceRecovery / invoiceTotal) * 100)}%`, detail: 'paiements MAD', severity: invoiceRecovery >= invoiceTotal ? 'success' : 'warning' },
    { label: 'Audit events', value: state.audits.length, detail: 'traçabilité workflow', severity: state.audits.length > 0 ? 'success' : 'warning' },
  ]
}

export function buildSlaPressureRows(state: InterventionsState) {
  return state.orders
    .filter((order) => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status))
    .map((order) => {
      const minutes = Math.round((new Date(order.slaDueAt).getTime() - Date.now()) / 60000)
      return {
        id: order.id,
        reference: order.reference,
        patientName: order.patientName,
        city: order.city,
        zone: order.zone,
        status: order.status,
        riskLevel: order.riskLevel,
        minutesRemaining: minutes,
        control: minutes < 0 ? 'SLA dépassé — escalade immédiate' : minutes < 90 ? 'SLA court — priorité dispatch' : 'SLA sous contrôle',
      }
    })
    .sort((a, b) => a.minutesRemaining - b.minutesRemaining)
}

export function buildModalExecutionPlan(modalKey: InterventionModalKey, state: InterventionsState) {
  const readiness = buildProductionReadiness(state)
  return {
    modalKey,
    requiredBeforeSubmit: ['Validation champs obligatoires', 'Contrôle permission rôle', 'Contrôle impact opérationnel', 'Écriture audit'],
    writeTargets: ['workflow state', 'audit log', 'sidebar badges', 'command center feed'],
    liveAfterSubmit: ['revalidation API', 'local durable cache', 'table refresh', 'KPI recalculés'],
    readiness,
  }
}
