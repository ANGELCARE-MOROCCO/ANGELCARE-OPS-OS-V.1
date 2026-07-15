import type { InterventionsState, InterventionOrder, InterventionStaff, InterventionEquipment, RiskLevel, StaffRole } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase5Severity = 'bloquant' | 'surveillance' | 'stable' | 'finance' | 'terrain'

export type Phase5ContinuityControl = {
  id: string
  label: string
  owner: string
  severity: Phase5Severity
  proof: string
  modal: InterventionModalKey
}

export type Phase5ExecutionQueue = {
  id: string
  reference: string
  patientName: string
  city: string
  zone: string
  riskLevel: RiskLevel
  status: string
  owner: string
  nextAction: string
  modal: InterventionModalKey
  entityId?: string
  entityType?: string
}

export const PHASE5_PRODUCTION_CONTINUITY: Record<InterventionPageKey, {
  title: string
  mandate: string
  shiftCadence: string
  fieldProof: string[]
  primaryModal: InterventionModalKey
}> = {
  home: { title: 'Continuité module', mandate: 'Entrée blanche unique vers toutes les opérations terrain sans sidebar globale ni rupture de navigation.', shiftCadence: 'Contrôle ouverture journée + revue fin de service', fieldProof: ['sidebar unique', 'badges live', 'accès command center'], primaryModal: 'RequestIntakeModal' },
  command: { title: 'Continuité direction', mandate: 'Garantir que les demandes urgentes, SLA, incidents, staff, équipement et MAD restent visibles en permanence.', shiftCadence: 'Point toutes les 30 minutes en journée opérationnelle', fieldProof: ['SLA visibles', 'risques priorisés', 'audit alimenté'], primaryModal: 'ReportExportModal' },
  demandes: { title: 'Continuité intake', mandate: 'Aucune demande ne doit rester sans triage, consentement, ville, contact +212 ou décision suivante.', shiftCadence: 'Revue file toutes les 15 minutes', fieldProof: ['triage', 'contact famille', 'conversion ordre/devis'], primaryModal: 'TriageDecisionModal' },
  ordres: { title: 'Continuité exécution', mandate: 'Tout ordre validé doit avoir statut, staff, checklist, équipement, SLA et responsabilité claire.', shiftCadence: 'Revue exécution horaire', fieldProof: ['staff assigné', 'checklist', 'équipement'], primaryModal: 'StaffAssignmentModal' },
  dispatch: { title: 'Continuité dispatch', mandate: 'Chaque action terrain doit générer timestamp, audit, statut réel et modal dédié sans bouton décoratif.', shiftCadence: 'Pilotage temps réel', fieldProof: ['dispatch confirmé', 'en route', 'sur site', 'start/complete'], primaryModal: 'DispatchConfirmModal' },
  planning: { title: 'Continuité planning', mandate: 'Les conflits, indisponibilités, capacités et impressions bureau doivent être maîtrisés avant envoi terrain.', shiftCadence: 'Préparation J-1 + ajustements live', fieldProof: ['conflits résolus', 'planning imprimé', 'staff notifié'], primaryModal: 'PlanningAssistantModal' },
  tournees: { title: 'Continuité tournées', mandate: 'Les routes doivent être séquencées, assignées, imprimables et clôturables avec preuve terrain.', shiftCadence: 'Préparation matin + clôture fin tournée', fieldProof: ['arrêts ordonnés', 'chauffeur/staff', 'feuille tournée'], primaryModal: 'RouteBuilderModal' },
  personnel: { title: 'Continuité RH terrain', mandate: 'Disponibilité, charge, certifications, zones et éligibilité urgence doivent bloquer les mauvaises affectations.', shiftCadence: 'Revue disponibilité début/mi-journée', fieldProof: ['certification valide', 'charge visible', 'zone couverte'], primaryModal: 'StaffAvailabilityModal' },
  patients: { title: 'Continuité bénéficiaires', mandate: 'Profil opérationnel home-care, contacts famille, risques, consentements et historique doivent être utilisables terrain.', shiftCadence: 'Vérification avant intervention sensible', fieldProof: ['contact famille', 'risque', 'documents'], primaryModal: 'PatientProfileModal' },
  lieux: { title: 'Continuité lieux', mandate: 'Chaque site doit porter zone, accès, contact, ville et possibilité de tournée.', shiftCadence: 'Validation avant dispatch', fieldProof: ['consignes accès', 'ville/zone', 'map drawer'], primaryModal: 'MapDrawerModal' },
  equipements: { title: 'Continuité équipements', mandate: 'Tout équipement doit avoir statut, disponibilité, mouvement, maintenance et lien intervention traçable.', shiftCadence: 'Contrôle matin + retour dépôt', fieldProof: ['réservation', 'mouvement', 'retour/maintenance'], primaryModal: 'EquipmentMovementModal' },
  rapports: { title: 'Continuité audit', mandate: 'Les rapports doivent sortir de données réelles avec période, sections, format et trace audit.', shiftCadence: 'Rapport journalier + synthèse direction', fieldProof: ['export', 'audit', 'SLA/incidents'], primaryModal: 'ReportExportModal' },
  facturation: { title: 'Continuité finance MAD', mandate: 'Chaque ordre facturable doit avoir devis/facture/paiement/relance et exposition MAD visible.', shiftCadence: 'Revue finance quotidienne', fieldProof: ['montants MAD', 'paiements', 'reste à payer'], primaryModal: 'PaymentModal' },
  parametres: { title: 'Continuité gouvernance', mandate: 'Les changements SLA, tarifs, workflow, checklists et permissions doivent être audités et maîtrisés.', shiftCadence: 'Contrôle changement avant production', fieldProof: ['RBAC', 'SLA', 'tarifs MAD'], primaryModal: 'PermissionMatrixModal' },
}

export const PHASE5_HANDOVER_PROTOCOLS = [
  { id: 'handover-support-dispatch', title: 'Support → Dispatch', owner: 'Support Client', receiver: 'Coordinateur Dispatch', proof: 'Demande avec téléphone +212, ville, zone, créneau et motif client.', modal: 'TriageDecisionModal' as InterventionModalKey },
  { id: 'handover-dispatch-field', title: 'Dispatch → Terrain', owner: 'Coordinateur Dispatch', receiver: 'Personnel terrain', proof: 'Ordre assigné, créneau, adresse, checklist, risque et équipement requis.', modal: 'DispatchConfirmModal' as InterventionModalKey },
  { id: 'handover-field-supervisor', title: 'Terrain → Supervision médicale', owner: 'Médecin / Infirmier / Adult-care', receiver: 'Superviseur Médical', proof: 'Incident, risque élevé, note visite ou blocage clôture.', modal: 'IncidentEscalationModal' as InterventionModalKey },
  { id: 'handover-field-finance', title: 'Terrain → Finance', owner: 'Personnel terrain', receiver: 'Finance', proof: 'Rapport terminé, consommables, durée réelle et statut facturable.', modal: 'PaymentModal' as InterventionModalKey },
  { id: 'handover-equipment-audit', title: 'Équipement → Audit', owner: 'Technicien Équipement', receiver: 'Audit / Lecture seule', proof: 'Mouvement équipement, stock consommé, retour dépôt ou maintenance.', modal: 'EquipmentMovementModal' as InterventionModalKey },
]

export const PHASE5_FIELD_COMMAND_CHECKS: Phase5ContinuityControl[] = [
  { id: 'check-assign-only', label: 'Visibilité assignée uniquement', owner: 'RBAC', severity: 'bloquant', proof: 'staff terrain ne voit que ses interventions assignées', modal: 'PermissionMatrixModal' },
  { id: 'check-complete-report', label: 'Rapport obligatoire avant clôture', owner: 'Superviseur Médical', severity: 'bloquant', proof: 'CompleteInterventionReportModal écrit compte rendu + audit', modal: 'CompleteInterventionReportModal' },
  { id: 'check-equipment-return', label: 'Retour équipement vérifié', owner: 'Technicien Équipement', severity: 'terrain', proof: 'timeline mouvement et statut dépôt/maintenance', modal: 'EquipmentMovementModal' },
  { id: 'check-payment-exposure', label: 'Exposition MAD contrôlée', owner: 'Finance', severity: 'finance', proof: 'reste à payer et paiements visibles', modal: 'PaymentModal' },
  { id: 'check-sla-pressure', label: 'Pression SLA priorisée', owner: 'Dispatch', severity: 'surveillance', proof: 'ordres en retard remontés en haut', modal: 'SlaMatrixModal' },
  { id: 'check-morocco-context', label: 'Contexte Maroc validé', owner: 'Ops', severity: 'stable', proof: 'ville, zone, téléphone +212, MAD, français', modal: 'RequestIntakeModal' },
]

export const PHASE5_ESCALATION_TIERS = [
  { level: 'N1', name: 'Coordinateur Dispatch', trigger: 'retard planning, staff indisponible, route à corriger', response: 'réassigner, replanifier, notifier', modal: 'ReassignStaffModal' as InterventionModalKey },
  { level: 'N2', name: 'Superviseur Médical', trigger: 'risque élevé, incident soin, document critique manquant', response: 'valider, escalader, ajouter consigne médicale opérationnelle', modal: 'IncidentEscalationModal' as InterventionModalKey },
  { level: 'N3', name: 'Manager Opérations', trigger: 'SLA critique, tournée bloquée, manque capacité multi-zone', response: 'arbitrage capacité, renfort, priorisation', modal: 'PlanningAssistantModal' as InterventionModalKey },
  { level: 'N4', name: 'Direction / CEO', trigger: 'incident majeur, risque réputation, exposition finance élevée', response: 'décision direction, communication, verrouillage audit', modal: 'ReportExportModal' as InterventionModalKey },
]

export function buildPhase5ContinuityScore(state: InterventionsState) {
  const active = state.orders.filter(order => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  const unassigned = state.orders.filter(order => !order.assignedStaffIds.length).length
  const late = state.orders.filter(order => new Date(order.slaDueAt).getTime() < Date.now() && !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  const openIncidents = state.incidents.filter(incident => incident.status !== 'Résolu').length
  const equipmentBlocked = state.equipment.filter(eq => ['En maintenance', 'Hors service', 'En transit'].includes(eq.status)).length
  const auditCoverage = Math.min(18, state.audits.length * 2)
  const score = Math.max(36, Math.min(99, 84 + auditCoverage + active - unassigned * 8 - late * 9 - openIncidents * 10 - equipmentBlocked * 3))
  return {
    score,
    label: score >= 88 ? 'continuité robuste' : score >= 74 ? 'production sous surveillance' : 'continuité fragile',
    unassigned,
    late,
    openIncidents,
    equipmentBlocked,
  }
}

export function buildPhase5ExecutionQueues(state: InterventionsState): Phase5ExecutionQueue[] {
  const byRisk: Record<RiskLevel, number> = { Critique: 0, Élevé: 1, Modéré: 2, Faible: 3 }
  return state.orders
    .filter(order => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status))
    .sort((a, b) => byRisk[a.riskLevel] - byRisk[b.riskLevel] || new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime())
    .slice(0, 6)
    .map((order: InterventionOrder) => {
      const hasStaff = order.assignedStaffIds.length > 0
      const isLate = new Date(order.slaDueAt).getTime() < Date.now()
      const modal: InterventionModalKey = !hasStaff ? 'StaffAssignmentModal' : isLate ? 'ReassignStaffModal' : order.status === 'Planifiée' ? 'DispatchConfirmModal' : 'CompleteInterventionReportModal'
      return {
        id: `phase5-${order.id}`,
        reference: order.reference,
        patientName: order.patientName,
        city: order.city,
        zone: order.zone,
        riskLevel: order.riskLevel,
        status: order.status,
        owner: !hasStaff ? 'Coordinateur Dispatch' : isLate ? 'Manager Opérations' : 'Personnel terrain',
        nextAction: !hasStaff ? 'Affecter personnel certifié' : isLate ? 'Réassigner / escalader SLA' : order.status === 'Planifiée' ? 'Dispatcher maintenant' : 'Contrôler clôture/reporting',
        modal,
        entityId: order.id,
        entityType: 'order',
      }
    })
}

export function buildPhase5RoleLocks(state: InterventionsState) {
  const roleSet = new Set<StaffRole>(state.staff.map((staff: InterventionStaff) => staff.role))
  const available = state.staff.filter(staff => staff.availability === 'Disponible')
  const expiring = state.staff.filter(staff => staff.expiresAt && new Date(staff.expiresAt).getTime() < Date.now() + 1000 * 60 * 60 * 24 * 45)
  return {
    rolesCovered: roleSet.size,
    available: available.length,
    expiring: expiring.length,
    locks: [
      { label: 'Staff assigné uniquement', value: `${state.orders.filter(o => o.assignedStaffIds.length).length}/${state.orders.length}`, severity: 'bloquant' as Phase5Severity },
      { label: 'Rôles couverts', value: roleSet.size, severity: roleSet.size >= 5 ? 'stable' as Phase5Severity : 'surveillance' as Phase5Severity },
      { label: 'Disponibles terrain', value: available.length, severity: available.length >= 3 ? 'stable' as Phase5Severity : 'bloquant' as Phase5Severity },
      { label: 'Certifs à surveiller', value: expiring.length, severity: expiring.length ? 'surveillance' as Phase5Severity : 'stable' as Phase5Severity },
    ],
  }
}

export function buildPhase5BillingExposure(state: InterventionsState) {
  const exposure = state.invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amountMad - invoice.paidMad), 0)
  const billableOrders = state.orders.filter(order => ['Facturable', 'Facturé'].includes(order.billingStatus)).length
  const paid = state.invoices.reduce((sum, invoice) => sum + invoice.paidMad, 0)
  return {
    exposure,
    billableOrders,
    paid,
    control: exposure > 20000 ? 'relance finance obligatoire' : exposure > 8000 ? 'surveillance impayés' : 'finance stable',
  }
}

export function buildPhase5EquipmentContinuity(state: InterventionsState) {
  const available = state.equipment.filter((eq: InterventionEquipment) => eq.status === 'Disponible').length
  const blocked = state.equipment.filter((eq: InterventionEquipment) => ['En maintenance', 'Hors service'].includes(eq.status)).length
  const inField = state.equipment.filter((eq: InterventionEquipment) => ['En intervention', 'Chez patient', 'En transit'].includes(eq.status)).length
  return {
    available,
    blocked,
    inField,
    label: blocked > 2 ? 'maintenance critique' : inField > available ? 'retours à surveiller' : 'stock terrain équilibré',
  }
}
