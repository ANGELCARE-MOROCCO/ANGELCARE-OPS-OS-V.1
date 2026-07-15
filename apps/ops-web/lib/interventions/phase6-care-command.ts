import type { InterventionsState, InterventionOrder, InterventionRequest, RiskLevel, StaffRole } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase6Severity = 'bloquant' | 'risque' | 'conforme' | 'finance' | 'patient'

export type Phase6SafetyGate = {
  id: string
  label: string
  owner: string
  severity: Phase6Severity
  proof: string
  modal: InterventionModalKey
}

export type Phase6CareQueue = {
  id: string
  reference: string
  patientName: string
  city: string
  zone: string
  category: string
  riskLevel: RiskLevel
  consent: string
  status: string
  nextClinicalControl: string
  modal: InterventionModalKey
  entityId?: string
  entityType?: string
}

export const PHASE6_SHIFT_COMMANDS: Record<InterventionPageKey, {
  title: string
  clinicalMandate: string
  shiftBoard: string[]
  releaseCondition: string
  primaryModal: InterventionModalKey
}> = {
  home: { title: 'Accueil Intervention OS', clinicalMandate: 'Garantir que le module reste une entrée production unique, blanche, native et prête terrain.', shiftBoard: ['sidebar unique', 'badges production', 'aucune rupture UX'], releaseCondition: 'navigation blanche opérationnelle partout', primaryModal: 'RequestIntakeModal' },
  command: { title: 'Direction médicale & ops', clinicalMandate: 'Piloter risque patient, consentement, retards SLA, incidents, staff certifié et exposition MAD.', shiftBoard: ['risque patient', 'SLA', 'finance MAD'], releaseCondition: 'décision direction traçable', primaryModal: 'ReportExportModal' },
  demandes: { title: 'Triage & admissibilité', clinicalMandate: 'Aucune demande sensible ne passe sans contact famille, risque, consentement ou décision devis/ordre.', shiftBoard: ['triage', 'consentement', 'contact +212'], releaseCondition: 'Validée ou Devis envoyé avec audit', primaryModal: 'TriageDecisionModal' },
  ordres: { title: 'Ordres soins terrain', clinicalMandate: 'Chaque ordre doit porter staff certifié, checklist, équipement, SLA, risque et preuve de clôture.', shiftBoard: ['staff certifié', 'checklist', 'équipement'], releaseCondition: 'ordre prêt dispatch ou escaladé', primaryModal: 'StaffAssignmentModal' },
  dispatch: { title: 'Commandement dispatch', clinicalMandate: 'Chaque dispatch doit créer preuve temporelle, responsabilité, statut et chemin d’escalade.', shiftBoard: ['dispatch', 'en route', 'sur site'], releaseCondition: 'statut terrain réel + audit', primaryModal: 'DispatchConfirmModal' },
  planning: { title: 'Planning certifié', clinicalMandate: 'Protéger planning contre chevauchements, indisponibilités, certifications expirantes et surcharge.', shiftBoard: ['conflits', 'disponibilités', 'certifications'], releaseCondition: 'planning imprimable et notifiable', primaryModal: 'StaffAvailabilityModal' },
  tournees: { title: 'Tournées sécurisées', clinicalMandate: 'Construire tournées avec ordre de passage, risques patient, contacts famille, équipement et clôture route.', shiftBoard: ['arrêts', 'risque', 'feuille tournée'], releaseCondition: 'feuille tournée prête terrain', primaryModal: 'RouteBuilderModal' },
  personnel: { title: 'Staff clinique & terrain', clinicalMandate: 'Contrôler rôles, certifications, disponibilité, charge, zone et éligibilité urgence.', shiftBoard: ['certifications', 'charge', 'zone'], releaseCondition: 'staff apte assignation', primaryModal: 'StaffCertificationModal' },
  patients: { title: 'Bénéficiaires home-care', clinicalMandate: 'Maintenir identité, contact famille, adresse, risques, consentements et historique interventionnel opérationnel.', shiftBoard: ['contact famille', 'risque', 'documents'], releaseCondition: 'profil exploitable terrain', primaryModal: 'PatientProfileModal' },
  lieux: { title: 'Sites & accès', clinicalMandate: 'Sécuriser l’accès terrain avec ville, zone, consignes, contact et affectation de tournée.', shiftBoard: ['adresse', 'accès', 'zone'], releaseCondition: 'site prêt dispatch', primaryModal: 'ConsentDocumentModal' },
  equipements: { title: 'Équipements soins', clinicalMandate: 'Aucun équipement sensible ne sort sans réservation, mouvement, statut et retour/maintenance traçable.', shiftBoard: ['stock', 'mouvement', 'retour'], releaseCondition: 'timeline équipement complète', primaryModal: 'EquipmentMovementModal' },
  rapports: { title: 'Rapports & conformité', clinicalMandate: 'Transformer interventions terminées, incidents, SLA, staff et finance en rapports auditables.', shiftBoard: ['rapport quotidien', 'incidents', 'SLA'], releaseCondition: 'export tracé avec période', primaryModal: 'ReportExportModal' },
  facturation: { title: 'Finance soins MAD', clinicalMandate: 'Relier intervention terminée, rapport, consommables, devis/facture, paiement et impayé.', shiftBoard: ['devis', 'factures', 'paiements'], releaseCondition: 'exposition MAD maîtrisée', primaryModal: 'PaymentModal' },
  parametres: { title: 'Gouvernance production', clinicalMandate: 'Contrôler SLA, tarifs, checklists, rôles, permissions et documents requis avant changement production.', shiftBoard: ['RBAC', 'SLA', 'tarifs'], releaseCondition: 'changement audité', primaryModal: 'PermissionMatrixModal' },
}

export const PHASE6_PATIENT_SAFETY_GATES: Phase6SafetyGate[] = [
  { id: 'safety-consent', label: 'Consentement / document avant intervention', owner: 'Support + Superviseur Médical', severity: 'bloquant', proof: 'ConsentDocumentModal attache une référence documentaire ou justification non requise.', modal: 'ConsentDocumentModal' },
  { id: 'safety-family-contact', label: 'Contact famille/client joignable', owner: 'Support Client', severity: 'patient', proof: 'Téléphone +212 et contact opérationnel visibles avant dispatch.', modal: 'PatientProfileModal' },
  { id: 'safety-risk-triage', label: 'Risque médical/opérationnel trié', owner: 'Superviseur Médical', severity: 'risque', proof: 'TriageDecisionModal fixe risque, statut et décision suivante.', modal: 'TriageDecisionModal' },
  { id: 'safety-certified-staff', label: 'Staff certifié pour le type de soin', owner: 'Manager Opérations', severity: 'bloquant', proof: 'StaffCertificationModal vérifie rôle, compétence, expiration et éligibilité urgence.', modal: 'StaffCertificationModal' },
  { id: 'safety-completion-report', label: 'Compte rendu obligatoire avant clôture', owner: 'Personnel terrain', severity: 'bloquant', proof: 'CompleteInterventionReportModal écrit issue, notes, consommables, incident et facturation.', modal: 'CompleteInterventionReportModal' },
  { id: 'safety-incident-path', label: 'Chemin incident / escalade disponible', owner: 'Superviseur Médical', severity: 'risque', proof: 'IncidentEscalationModal crée owner, niveau et trace audit.', modal: 'IncidentEscalationModal' },
  { id: 'safety-equipment-proof', label: 'Équipement médical avec mouvement tracé', owner: 'Technicien Équipement', severity: 'patient', proof: 'EquipmentMovementModal verrouille sortie, retour, maintenance et stock consommé.', modal: 'EquipmentMovementModal' },
  { id: 'safety-billing-care-lock', label: 'Facturation MAD liée au rapport', owner: 'Finance', severity: 'finance', proof: 'PaymentModal / facture reliée à ordre terminé et rapport.', modal: 'PaymentModal' },
]

export const PHASE6_CARE_PACKS = [
  { id: 'pack-medecin', title: 'Pack médecin domicile', staff: 'Médecin' as StaffRole, checks: ['Évaluation', 'contact famille', 'rapport visite', 'facturation MAD'], modal: 'CarePlanModal' as InterventionModalKey },
  { id: 'pack-infirmier', title: 'Pack soins infirmiers', staff: 'Infirmier' as StaffRole, checks: ['prescription/document', 'matériel', 'consommables', 'compte rendu'], modal: 'ChecklistBuilderModal' as InterventionModalKey },
  { id: 'pack-adult-care', title: 'Pack adult-care', staff: 'Aide-soignant' as StaffRole, checks: ['plan de passage', 'préférences', 'risques', 'famille joignable'], modal: 'CarePlanModal' as InterventionModalKey },
  { id: 'pack-equipement', title: 'Pack équipement médical', staff: 'Technicien Équipement' as StaffRole, checks: ['réservation', 'installation', 'retour', 'maintenance'], modal: 'EquipmentAssignmentModal' as InterventionModalKey },
  { id: 'pack-partenaire', title: 'Pack partenaire crèche/école/entreprise', staff: 'Coordinateur' as StaffRole, checks: ['site', 'responsable', 'consignes accès', 'rapport direction'], modal: 'RouteBuilderModal' as InterventionModalKey },
]

export const PHASE6_CARE_COMPLIANCE_CONTROLS = [
  { label: 'Français + MAD + Maroc', detail: 'Tous les workflows restent localisés: dates DD/MM/YYYY, MAD, villes marocaines, téléphone +212.', modal: 'PricingRuleModal' as InterventionModalKey },
  { label: 'Pas de faux dossier hospitalier', detail: 'Le profil patient reste opérationnel home-care: contacts, risques, documents, historique interventions.', modal: 'PatientProfileModal' as InterventionModalKey },
  { label: 'Assigned-only terrain', detail: 'Les intervenants terrain ne doivent accéder qu’aux interventions affectées selon RBAC existant.', modal: 'PermissionMatrixModal' as InterventionModalKey },
  { label: 'Clôture impossible sans rapport', detail: 'Chaque intervention terminée nécessite compte rendu, issue, horaires, consommables, incident éventuel.', modal: 'CompleteInterventionReportModal' as InterventionModalKey },
]

export function buildPhase6CareContinuity(state: InterventionsState) {
  const consentMissing = state.requests.filter((request: InterventionRequest) => request.consentStatus === 'À collecter' && request.status !== 'Annulée').length
  const criticalActive = state.orders.filter((order: InterventionOrder) => order.riskLevel === 'Critique' && !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  const missingStaff = state.orders.filter(order => !order.assignedStaffIds.length && !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  const unresolvedIncidents = state.incidents.filter(incident => incident.status !== 'Résolu').length
  const certifiedAvailable = state.staff.filter(staff => staff.availability === 'Disponible' && staff.certifications.length).length
  const score = Math.max(30, Math.min(99, 90 - consentMissing * 7 - criticalActive * 8 - missingStaff * 6 - unresolvedIncidents * 9 + Math.min(10, certifiedAvailable * 2)))
  return {
    score,
    label: score >= 88 ? 'sécurité patient robuste' : score >= 74 ? 'sécurité sous surveillance' : 'sécurité fragile',
    consentMissing,
    criticalActive,
    missingStaff,
    unresolvedIncidents,
    certifiedAvailable,
  }
}

export function buildPhase6ConsentExposure(state: InterventionsState) {
  const rows = state.requests
    .filter((request: InterventionRequest) => request.consentStatus === 'À collecter' || ['Élevé', 'Critique'].includes(request.riskLevel))
    .slice(0, 7)
    .map(request => ({
      id: `consent-${request.id}`,
      reference: request.reference,
      patientName: request.patientName,
      city: request.city,
      zone: request.zone,
      riskLevel: request.riskLevel,
      consent: request.consentStatus,
      next: request.consentStatus === 'À collecter' ? 'Collecter consentement/document' : 'Contrôle risque avant dispatch',
      modal: request.consentStatus === 'À collecter' ? 'ConsentDocumentModal' as InterventionModalKey : 'TriageDecisionModal' as InterventionModalKey,
      entityId: request.id,
      entityType: 'request',
    }))
  return rows
}

export function buildPhase6CriticalCareQueue(state: InterventionsState): Phase6CareQueue[] {
  return state.orders
    .filter(order => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status))
    .sort((a, b) => {
      const riskOrder: Record<RiskLevel, number> = { Critique: 0, Élevé: 1, Modéré: 2, Faible: 3 }
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel] || new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime()
    })
    .slice(0, 8)
    .map(order => {
      const request = state.requests.find(r => r.id === order.requestId)
      const consent = request?.consentStatus || 'À collecter'
      const needsStaff = !order.assignedStaffIds.length
      const modal: InterventionModalKey = consent === 'À collecter' ? 'ConsentDocumentModal' : needsStaff ? 'StaffAssignmentModal' : order.riskLevel === 'Critique' ? 'IncidentEscalationModal' : 'CompleteInterventionReportModal'
      return {
        id: `care-${order.id}`,
        reference: order.reference,
        patientName: order.patientName,
        city: order.city,
        zone: order.zone,
        category: order.category,
        riskLevel: order.riskLevel,
        consent,
        status: order.status,
        nextClinicalControl: consent === 'À collecter' ? 'Document / consentement' : needsStaff ? 'Staff certifié' : order.riskLevel === 'Critique' ? 'Supervision médicale' : 'Rapport/clôture',
        modal,
        entityId: order.id,
        entityType: 'order',
      }
    })
}

export function buildPhase6RoleScenarioCoverage(state: InterventionsState) {
  const byRole = new Map<StaffRole, number>()
  state.staff.forEach(staff => byRole.set(staff.role, (byRole.get(staff.role) || 0) + 1))
  return PHASE6_CARE_PACKS.map(pack => ({
    ...pack,
    availableCount: byRole.get(pack.staff) || 0,
    status: (byRole.get(pack.staff) || 0) > 0 ? 'couvert' : 'à renforcer',
  }))
}
