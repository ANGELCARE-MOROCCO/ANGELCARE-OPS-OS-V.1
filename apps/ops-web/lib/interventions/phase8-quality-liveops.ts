import type { InterventionsState, InterventionOrder, InterventionStaff } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase8LiveOpsSeverity = 'bloquant' | 'surveillance' | 'formation' | 'direction'

export const PHASE8_LIVEOPS_COMMANDS: Record<InterventionPageKey, {
  title: string
  mandate: string
  productionRisk: string
  primaryModal: InterventionModalKey
  operatorChecklist: string[]
}> = {
  home: { title: 'LiveOps qualité & adoption terrain', mandate: 'Transformer le module en centre d’exploitation quotidien avec qualité, formation, notifications et preuve terrain.', productionRisk: 'Déploiement sans adoption staff ni contrôles qualité post-intervention.', primaryModal: 'ChecklistBuilderModal', operatorChecklist: ['Brief équipe du jour', 'Canaux notification actifs', 'Dossiers critiques revus', 'Qualité rapports vérifiée'] },
  command: { title: 'Direction qualité live', mandate: 'Surveiller qualité, adoption, retards, incidents, rapports incomplets et charge staff.', productionRisk: 'Direction sans vision qualité exploitable.', primaryModal: 'ReportExportModal', operatorChecklist: ['Score qualité', 'Incidents ouverts', 'Rapports incomplets', 'Staff non conforme'] },
  demandes: { title: 'Qualité intake & triage', mandate: 'Empêcher les demandes incomplètes avant conversion: contact, adresse, risque, document, service, payeur.', productionRisk: 'Demande convertie avec informations insuffisantes.', primaryModal: 'TriageDecisionModal', operatorChecklist: ['Téléphone +212', 'Adresse exploitable', 'Risque défini', 'Consentement/document'] },
  ordres: { title: 'Qualité ordre exécutable', mandate: 'Chaque ordre doit avoir staff, checklist, équipement, SLA, consignes famille et contrôle facture.', productionRisk: 'Ordre opérationnellement non exécutable sur terrain.', primaryModal: 'OrderBuilderModal', operatorChecklist: ['Staff certifié', 'Checklist métier', 'Équipement réservé', 'Billing clair'] },
  dispatch: { title: 'Live dispatch supervision', mandate: 'Contrôler notifications, preuve de départ, arrivée sur site, incident, remplacement et escalade.', productionRisk: 'Dispatch sans preuve terrain ni retour staff.', primaryModal: 'DispatchConfirmModal', operatorChecklist: ['Notification envoyée', 'Départ confirmé', 'Arrivée attendue', 'Canal urgence ouvert'] },
  planning: { title: 'Qualité planning & conflits', mandate: 'Contrôler chevauchements, indisponibilités, temps déplacement, pauses et charge staff.', productionRisk: 'Planning impossible à exécuter ou non accepté par les équipes.', primaryModal: 'PlanningAssistantModal', operatorChecklist: ['Conflits résolus', 'Disponibilités confirmées', 'Charge équilibrée', 'Planning partagé'] },
  tournees: { title: 'Qualité tournées terrain', mandate: 'Garantir route compréhensible, feuille tournée, ordre arrêts, preuves équipement et clôture retour.', productionRisk: 'Tournée incomplète, non clôturée ou sans preuve.', primaryModal: 'RouteBuilderModal', operatorChecklist: ['Feuille tournée', 'Ordre arrêts', 'Retour dépôt', 'Clôture caisse'] },
  personnel: { title: 'Adoption staff & habilitations', mandate: 'Mesurer disponibilité, certifications, formation workflow, capacité, droit d’action et assignation.', productionRisk: 'Utilisateur terrain incapable d’exécuter correctement son workflow.', primaryModal: 'StaffCertificationModal', operatorChecklist: ['Certification valide', 'Formation module', 'Disponibilité', 'Rôle RBAC'] },
  patients: { title: 'Qualité dossier bénéficiaire', mandate: 'Contrôler contacts famille, risques, documents, historique et consignes sans surpromettre EMR hospitalier.', productionRisk: 'Dossier patient incomplet pour intervention domicile.', primaryModal: 'PatientProfileModal', operatorChecklist: ['Contact famille', 'Adresse', 'Risque', 'Historique intervention'] },
  lieux: { title: 'Qualité accès & zones', mandate: 'Valider accès, zone, ville, consignes, temps d’accès et restrictions spécifiques.', productionRisk: 'Staff bloqué par adresse imprécise ou consignes manquantes.', primaryModal: 'MapDrawerModal', operatorChecklist: ['Zone validée', 'Consignes accès', 'Contact site', 'Temps déplacement'] },
  equipements: { title: 'Qualité équipement & preuve', mandate: 'Garantir disponibilité, mouvement, maintenance, retour, caution, consommation et bon équipement.', productionRisk: 'Équipement absent, non conforme ou non tracé.', primaryModal: 'EquipmentMovementModal', operatorChecklist: ['Disponibilité', 'Bon équipement', 'Maintenance', 'Retour/caution'] },
  rapports: { title: 'Qualité rapports & preuves', mandate: 'Contrôler complétude des comptes rendus, exports, signatures opérationnelles et audit.', productionRisk: 'Rapport inexploitable pour direction, finance ou audit.', primaryModal: 'ReportExportModal', operatorChecklist: ['Compte rendu complet', 'Période correcte', 'Export audité', 'Incident lié'] },
  facturation: { title: 'Qualité facture & recouvrement', mandate: 'Assurer cohérence devis/facture/paiement/relance sans casser workflow opérationnel.', productionRisk: 'Facturation incohérente avec intervention clôturée.', primaryModal: 'PaymentModal', operatorChecklist: ['Facture liée', 'Paiement/reste', 'Reçu', 'Relance'] },
  parametres: { title: 'Gouvernance qualité paramétrage', mandate: 'Contrôler changements SLA, tarifs, checklists, permissions et modèles avant production.', productionRisk: 'Paramètre modifié sans audit ni impact connu.', primaryModal: 'PermissionMatrixModal', operatorChecklist: ['Owner', 'Impact aval', 'Audit', 'Rollback'] },
}

export const PHASE8_NOTIFICATION_RUNBOOKS: Array<{ id: string; title: string; trigger: string; channel: string; owner: string; modal: InterventionModalKey }> = [
  { id: 'urgent-intake', title: 'Alerte demande critique', trigger: 'Nouvelle demande Critique ou Élevé', channel: 'Dispatch + Superviseur Médical', owner: 'Coordinateur Dispatch', modal: 'TriageDecisionModal' },
  { id: 'late-arrival', title: 'Rappel arrivée terrain', trigger: 'En route > fenêtre prévue', channel: 'Staff assigné + Dispatch', owner: 'Dispatch', modal: 'ArrivalConfirmationModal' },
  { id: 'report-missing', title: 'Rapport obligatoire manquant', trigger: 'Terminée sans compte rendu complet', channel: 'Staff + Superviseur', owner: 'Superviseur Médical', modal: 'CompleteInterventionReportModal' },
  { id: 'cash-open', title: 'Clôture paiement ouverte', trigger: 'Facture impayée ou paiement terrain non justifié', channel: 'Finance + Dispatch', owner: 'Finance', modal: 'PaymentModal' },
  { id: 'equipment-return', title: 'Retour équipement à confirmer', trigger: 'Équipement chez patient / en transit après clôture', channel: 'Équipement + Audit', owner: 'Technicien Équipement', modal: 'EquipmentMovementModal' },
]

export const PHASE8_QUALITY_GATES: Array<{ id: string; label: string; severity: Phase8LiveOpsSeverity; owner: string; evidence: string; modal: InterventionModalKey }> = [
  { id: 'identity-contact', label: 'Identité + contact joignable', severity: 'bloquant', owner: 'Support Client', evidence: 'patient/contact/téléphone +212/adresse', modal: 'PatientProfileModal' },
  { id: 'role-training', label: 'Utilisateur formé au workflow', severity: 'formation', owner: 'Manager Opérations', evidence: 'rôle, formation, permissions, checklist', modal: 'StaffCertificationModal' },
  { id: 'completion-proof', label: 'Compte rendu de clôture complet', severity: 'bloquant', owner: 'Superviseur Médical', evidence: 'rapport, outcome, checklist, incident si besoin', modal: 'CompleteInterventionReportModal' },
  { id: 'notification-proof', label: 'Notification opérationnelle tracée', severity: 'surveillance', owner: 'Coordinateur Dispatch', evidence: 'canal, destinataire, action attendue, timestamp', modal: 'DispatchConfirmModal' },
  { id: 'settings-governance', label: 'Changement paramètre gouverné', severity: 'direction', owner: 'Direction / CEO', evidence: 'owner, motif, impact, audit, rollback', modal: 'WorkflowStageModal' },
]

export const PHASE8_ADOPTION_ROLLOUTS: Array<{ role: string; mustKnow: string[]; dailyProof: string; modal: InterventionModalKey }> = [
  { role: 'Coordinateur Dispatch', mustKnow: ['Triage', 'Affectation', 'Dispatch', 'Réassignation', 'Incidents'], dailyProof: 'File non assignée vide ou justifiée', modal: 'StaffAssignmentModal' },
  { role: 'Médecin / Infirmier / Adult-care', mustKnow: ['Voir missions assignées', 'En route', 'Sur site', 'Compte rendu', 'Incident'], dailyProof: 'Rapport complété avant clôture', modal: 'CompleteInterventionReportModal' },
  { role: 'Équipe Équipement', mustKnow: ['Réservation', 'Bon équipement', 'Mouvement', 'Maintenance', 'Retour'], dailyProof: 'Aucun équipement sans statut', modal: 'EquipmentMovementModal' },
  { role: 'Finance', mustKnow: ['Devis', 'Facture', 'Paiement', 'Relance', 'Exports'], dailyProof: 'Aucune facture critique sans owner', modal: 'PaymentModal' },
  { role: 'Direction / Audit', mustKnow: ['Lecture audit', 'Exports', 'RBAC', 'SLA', 'Exceptions'], dailyProof: 'Snapshot direction disponible', modal: 'ReportExportModal' },
]

export function buildPhase8QualityScore(state: InterventionsState) {
  const totalOrders = Math.max(1, state.orders.length)
  const assignedOrders = state.orders.filter(o => o.assignedStaffIds.length > 0).length
  const reportReady = state.orders.filter(o => ['Terminée', 'Clôturée'].includes(o.status) && state.audits.some(a => a.entityId === o.id && /completed|report|clôture/i.test(a.event + ' ' + a.summary))).length
  const criticalIncidents = state.incidents.filter(i => i.status !== 'Résolu' && ['Élevé', 'Critique'].includes(i.riskLevel)).length
  const expiredStaff = state.staff.filter(staff => staff.expiresAt && new Date(staff.expiresAt).getTime() < Date.now()).length
  const equipmentBlocked = state.equipment.filter(e => ['En maintenance', 'Hors service'].includes(e.status)).length
  const score = Math.max(28, Math.min(100, Math.round((assignedOrders / totalOrders) * 42 + reportReady * 8 + state.audits.length * 1.5 + 36 - criticalIncidents * 12 - expiredStaff * 8 - equipmentBlocked * 4)))
  return { score, label: score >= 88 ? 'prêt exploitation' : score >= 72 ? 'sous contrôle' : 'renfort requis', assignedOrders, totalOrders, reportReady, criticalIncidents, expiredStaff, equipmentBlocked }
}

export function buildPhase8LiveOpsQueue(state: InterventionsState) {
  const unassigned = state.orders.filter(order => order.assignedStaffIds.length === 0).map(order => ({
    id: `assign-${order.id}`,
    title: `Ordre non assigné ${order.reference}`,
    owner: 'Coordinateur Dispatch',
    severity: order.riskLevel === 'Critique' ? 'bloquant' : 'surveillance',
    detail: `${order.patientName} • ${order.city}/${order.zone} • ${order.category}`,
    modal: 'StaffAssignmentModal' as InterventionModalKey,
  }))
  const missingReport = state.orders.filter(order => ['Terminée', 'Clôturée'].includes(order.status) && !state.audits.some(a => a.entityId === order.id && /completed|report|clôture/i.test(a.event + ' ' + a.summary))).map(order => ({
    id: `report-${order.id}`,
    title: `Compte rendu à contrôler ${order.reference}`,
    owner: 'Superviseur Médical',
    severity: 'bloquant',
    detail: `${order.patientName} • clôture sans preuve rapport suffisante`,
    modal: 'CompleteInterventionReportModal' as InterventionModalKey,
  }))
  const expired = state.staff.filter(staff => staff.expiresAt && new Date(staff.expiresAt).getTime() < Date.now()).map(staff => ({
    id: `cert-${staff.id}`,
    title: `Certification expirée ${staff.fullName}`,
    owner: 'Manager Opérations',
    severity: 'formation',
    detail: `${staff.role} • ${staff.city}/${staff.zone}`,
    modal: 'StaffCertificationModal' as InterventionModalKey,
  }))
  return [...unassigned, ...missingReport, ...expired].slice(0, 12)
}

export function buildPhase8StaffAdoption(state: InterventionsState) {
  return state.staff.map((staff: InterventionStaff) => {
    const assignments = state.orders.filter(order => order.assignedStaffIds.includes(staff.id)).length
    const readiness = Math.max(35, Math.min(100, 65 + (staff.availability === 'Disponible' ? 12 : 0) + (staff.certifications.length * 4) + (staff.emergencyEligible ? 6 : 0) - staff.workload - (staff.expiresAt && new Date(staff.expiresAt).getTime() < Date.now() ? 28 : 0)))
    return {
      id: staff.id,
      name: staff.fullName,
      role: staff.role,
      zone: `${staff.city}/${staff.zone}`,
      assignments,
      readiness,
      label: readiness >= 86 ? 'autonome' : readiness >= 70 ? 'coaché' : 'à former',
      modal: readiness < 70 ? 'StaffCertificationModal' as InterventionModalKey : 'StaffAvailabilityModal' as InterventionModalKey,
    }
  }).sort((a, b) => a.readiness - b.readiness)
}

export function buildPhase8PatientExperience(state: InterventionsState) {
  const requestsWithConsent = state.requests.filter(req => req.consentStatus === 'Collecté' || req.consentStatus === 'Non requis').length
  const consentRate = state.requests.length ? Math.round((requestsWithConsent / state.requests.length) * 100) : 100
  const familyReachable = state.requests.filter(req => /^\+?212|^0[5-7]/.test(req.phone.replace(/\s/g, ''))).length
  const familyReachRate = state.requests.length ? Math.round((familyReachable / state.requests.length) * 100) : 100
  const highRiskOpen = state.orders.filter(order => ['Critique', 'Élevé'].includes(order.riskLevel) && !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  return { consentRate, familyReachRate, highRiskOpen, summary: `${consentRate}% consentement/document • ${familyReachRate}% contacts exploitables • ${highRiskOpen} risques ouverts` }
}

export function buildPhase8RunbookCoverage(state: InterventionsState) {
  const activeOrders = state.orders.filter(order => !['Clôturée', 'Annulée'].includes(order.status)).length
  const notifications = PHASE8_NOTIFICATION_RUNBOOKS.length
  const auditDensity = Math.round((state.audits.length / Math.max(1, activeOrders)) * 100) / 100
  return { activeOrders, notifications, auditDensity, ready: auditDensity >= 1 && notifications >= 5 }
}
