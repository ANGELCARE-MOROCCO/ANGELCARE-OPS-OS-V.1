import type { InterventionsState, InterventionAppointment, InterventionEquipment, InterventionOrder, InterventionRouteStop, InterventionStaff } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase11ProofTone = 'bloquant' | 'preuve' | 'mobile' | 'support' | 'finance'

export const PHASE11_FIELD_EXECUTION_COMMANDS: Record<InterventionPageKey, {
  title: string
  fieldIntent: string
  mobileNonNegotiable: string
  evidenceRequired: string[]
  primaryModal: InterventionModalKey
}> = {
  home: { title: 'Centre preuve terrain mobile', fieldIntent: 'S’assurer que chaque workflow terrain possède preuve, horodatage, owner et suite opérationnelle.', mobileNonNegotiable: 'Aucune action terrain critique ne peut rester sans preuve exploitable.', evidenceRequired: ['statut réel', 'rapport', 'contact famille', 'audit'], primaryModal: 'CompleteInterventionReportModal' },
  command: { title: 'Direction preuve terrain', fieldIntent: 'Donner à la direction une lecture claire des actions terrain réellement prouvées.', mobileNonNegotiable: 'Le command center doit révéler les preuves manquantes avant go-live utilisateurs.', evidenceRequired: ['retards SLA', 'preuves dispatch', 'incidents', 'cash MAD'], primaryModal: 'ReportExportModal' },
  demandes: { title: 'Intake preuve contact', fieldIntent: 'Valider identité, téléphone +212, adresse et consentement avant conversion.', mobileNonNegotiable: 'Aucune demande sensible sans contact vérifiable et consentement statuté.', evidenceRequired: ['téléphone', 'adresse', 'consentement', 'source'], primaryModal: 'ConsentDocumentModal' },
  ordres: { title: 'Ordres avec preuve d’exécution', fieldIntent: 'Transformer chaque ordre en dossier opérationnel avec checklist, staff, équipement et rapport attendu.', mobileNonNegotiable: 'Un ordre ne peut être fermé sans compte rendu et statut finance MAD.', evidenceRequired: ['staff', 'planning', 'checklist', 'rapport'], primaryModal: 'CompleteInterventionReportModal' },
  dispatch: { title: 'Dispatch mobile terrain', fieldIntent: 'Piloter dispatch → en route → sur site → démarré → terminé avec preuve et escalade.', mobileNonNegotiable: 'Chaque transition terrain doit alimenter audit et écran dispatch.', evidenceRequired: ['dispatch', 'en route', 'arrivée', 'début', 'fin'], primaryModal: 'DispatchConfirmModal' },
  planning: { title: 'Planning terrain publiable', fieldIntent: 'Vérifier qu’un planning publié contient disponibilités, notifications et feuille staff.', mobileNonNegotiable: 'Aucun planning terrain sans conflit résolu et staff notifié.', evidenceRequired: ['absence conflit', 'notification', 'feuille planning', 'certification'], primaryModal: 'PrintTemplateModal' },
  tournees: { title: 'Tournées avec preuve arrêt par arrêt', fieldIntent: 'Rendre chaque arrêt traçable avec statut, heure, contact, équipement et retour éventuel.', mobileNonNegotiable: 'Une tournée clôturée doit avoir tous les arrêts traités ou justifiés.', evidenceRequired: ['arrêts', 'ordre tournée', 'retour équipement', 'cash closure'], primaryModal: 'RouteStopModal' },
  personnel: { title: 'Personnel mobile-ready', fieldIntent: 'Vérifier disponibilité, certification, rôle, téléphone et capacité d’usage terrain.', mobileNonNegotiable: 'Aucun staff terrain sans rôle, certification utile et disponibilité claire.', evidenceRequired: ['rôle', 'certification', 'téléphone', 'charge'], primaryModal: 'StaffAvailabilityModal' },
  patients: { title: 'Bénéficiaire joignable et sécurisé', fieldIntent: 'S’assurer que contact famille, adresse, risque et historique sont disponibles avant terrain.', mobileNonNegotiable: 'Pas de visite terrain sans informations utiles et niveau de risque lisible.', evidenceRequired: ['contact famille', 'adresse', 'risque', 'notes'], primaryModal: 'PatientProfileModal' },
  lieux: { title: 'Lieux exploitables terrain Maroc', fieldIntent: 'Vérifier adresses, zones, consignes accès et rattachement patient/client.', mobileNonNegotiable: 'Aucune intervention active sans lieu exploitable.', evidenceRequired: ['adresse', 'zone', 'consigne accès', 'contact'], primaryModal: 'RouteStopModal' },
  equipements: { title: 'Preuve équipement et consommables', fieldIntent: 'Traçabilité des actifs et consommables: assigné, sorti, utilisé, retourné, facturé.', mobileNonNegotiable: 'Aucun équipement critique sans mouvement et statut opérationnel.', evidenceRequired: ['mouvement', 'série', 'retour', 'maintenance'], primaryModal: 'EquipmentMovementModal' },
  rapports: { title: 'Rapports terrain auditables', fieldIntent: 'Transformer les comptes rendus terrain en preuve consultable, exportable et auditable.', mobileNonNegotiable: 'Les exports et rapports doivent être reliés au dossier et à l’auteur.', evidenceRequired: ['auteur', 'période', 'dossier', 'audit'], primaryModal: 'ReportExportModal' },
  facturation: { title: 'Clôture cash terrain MAD', fieldIntent: 'Relier fin d’intervention, paiement terrain, impayés, remise et facture MAD.', mobileNonNegotiable: 'Aucun paiement ou remise terrain sans audit finance.', evidenceRequired: ['montant MAD', 'mode paiement', 'reste à payer', 'audit'], primaryModal: 'PaymentModal' },
  parametres: { title: 'Paramètres terrain verrouillés', fieldIntent: 'S’assurer que les preuves, checklists, permissions et modèles imprimables sont configurés.', mobileNonNegotiable: 'Tout changement critique doit avoir owner, audit et retour arrière.', evidenceRequired: ['RBAC', 'checklists', 'documents', 'templates'], primaryModal: 'ChecklistBuilderModal' },
}

export const PHASE11_MOBILE_FIELD_RUNBOOKS = [
  { id: 'field-dispatch-proof', title: 'Preuve dispatch avant départ', owner: 'Coordinateur Dispatch', trigger: 'Ordre planifié prêt terrain', steps: ['Ouvrir DispatchConfirmModal', 'Confirmer staff et téléphone', 'Valider adresse/zone', 'Notifier intervenant', 'Créer audit dispatch'], modal: 'DispatchConfirmModal' as InterventionModalKey },
  { id: 'field-enroute-proof', title: 'Preuve en route', owner: 'Intervenant terrain', trigger: 'Staff démarre déplacement', steps: ['Marquer En route', 'Confirmer tournée/arrêt', 'Afficher contact famille', 'Surveiller SLA', 'Audit horodaté'], modal: 'EnRouteModal' as InterventionModalKey },
  { id: 'field-arrival-proof', title: 'Preuve arrivée sur site', owner: 'Intervenant terrain', trigger: 'Arrivée domicile/site', steps: ['Ouvrir ArrivalConfirmationModal', 'Confirmer lieu', 'Lire consignes accès', 'Signaler écart adresse', 'Audit arrivée'], modal: 'ArrivalConfirmationModal' as InterventionModalKey },
  { id: 'field-start-proof', title: 'Démarrage sécurisé', owner: 'Médecin / Infirmier / Aide-soignant', trigger: 'Début intervention', steps: ['Ouvrir StartInterventionModal', 'Vérifier checklist', 'Vérifier consentement', 'Lister équipement/consommables', 'Audit début'], modal: 'StartInterventionModal' as InterventionModalKey },
  { id: 'field-complete-proof', title: 'Clôture avec compte rendu', owner: 'Intervenant + Superviseur', trigger: 'Intervention terminée', steps: ['Ouvrir CompleteInterventionReportModal', 'Renseigner résultat', 'Déclarer consommables', 'Signaler incident si besoin', 'Basculer facturation MAD'], modal: 'CompleteInterventionReportModal' as InterventionModalKey },
  { id: 'field-cancel-proof', title: 'Annulation justifiée', owner: 'Dispatch / Support', trigger: 'Patient absent, annulation, impossibilité terrain', steps: ['Ouvrir CancelInterventionModal', 'Motif obligatoire', 'Notifier famille/support', 'Replanifier ou clôturer', 'Audit annulation'], modal: 'CancelInterventionModal' as InterventionModalKey },
]

export const PHASE11_EVIDENCE_GATES = [
  { id: 'phone-plus212', label: 'Téléphone +212 exploitable', owner: 'Support Client', tone: 'preuve' as Phase11ProofTone, modal: 'PatientProfileModal' as InterventionModalKey, evidence: 'Contact principal ou famille présent pour demande et patient.' },
  { id: 'route-stop-proof', label: 'Arrêt tournée prouvé', owner: 'Coordinateur Dispatch', tone: 'mobile' as Phase11ProofTone, modal: 'RouteStopModal' as InterventionModalKey, evidence: 'Chaque arrêt a statut, heure planifiée, ordre lié et justification si non terminé.' },
  { id: 'arrival-proof', label: 'Arrivée terrain prouvée', owner: 'Intervenant terrain', tone: 'bloquant' as Phase11ProofTone, modal: 'ArrivalConfirmationModal' as InterventionModalKey, evidence: 'Transition Sur site horodatée avant démarrage.' },
  { id: 'completion-report-proof', label: 'Compte rendu obligatoire', owner: 'Superviseur Médical', tone: 'bloquant' as Phase11ProofTone, modal: 'CompleteInterventionReportModal' as InterventionModalKey, evidence: 'Impossible de clôturer sans résultat, notes et consommables/équipement.' },
  { id: 'equipment-proof', label: 'Mouvement équipement prouvé', owner: 'Technicien Équipement', tone: 'preuve' as Phase11ProofTone, modal: 'EquipmentMovementModal' as InterventionModalKey, evidence: 'Sortie, retour, maintenance ou assignation visible et auditée.' },
  { id: 'cash-proof', label: 'Paiement terrain MAD prouvé', owner: 'Finance', tone: 'finance' as Phase11ProofTone, modal: 'PaymentModal' as InterventionModalKey, evidence: 'Montant, statut facture, reste à payer et responsable de clôture.' },
  { id: 'incident-proof', label: 'Incident terrain escaladé', owner: 'Superviseur Médical', tone: 'support' as Phase11ProofTone, modal: 'IncidentEscalationModal' as InterventionModalKey, evidence: 'Incident ouvert avec owner, niveau risque et prochaine action.' },
]

export const PHASE11_FIELD_PRINT_AND_HANDOFF_PACKS = [
  { id: 'mobile-staff-sheet', title: 'Fiche mobile intervenant', owner: 'Intervenant terrain', content: ['ordre', 'patient', 'contact', 'adresse', 'checklist', 'SLA'], modal: 'PrintTemplateModal' as InterventionModalKey },
  { id: 'family-confirmation', title: 'Confirmation famille/client', owner: 'Support Client', content: ['créneau', 'intervenant', 'téléphone', 'consignes', 'montant MAD si applicable'], modal: 'ConsentDocumentModal' as InterventionModalKey },
  { id: 'equipment-handoff', title: 'Bon sortie/retour équipement', owner: 'Équipement', content: ['actif', 'série', 'état sortie', 'état retour', 'responsable'], modal: 'EquipmentAssignmentModal' as InterventionModalKey },
  { id: 'route-mobile-sheet', title: 'Feuille tournée mobile', owner: 'Dispatch', content: ['arrêts', 'ordre', 'heures', 'contacts', 'statuts', 'retours'], modal: 'RouteBuilderModal' as InterventionModalKey },
  { id: 'cash-handoff', title: 'Fiche clôture cash terrain', owner: 'Finance', content: ['facture', 'paiement', 'remise', 'reste dû', 'audit'], modal: 'PaymentModal' as InterventionModalKey },
]

export function buildPhase11FieldProofScore(state: InterventionsState) {
  const activeAppointments = state.appointments.filter((appointment: InterventionAppointment) => !['Terminée', 'Clôturée', 'Annulée'].includes(appointment.status))
  const dispatchedWithoutProgress = state.appointments.filter((appointment: InterventionAppointment) => appointment.status === 'Dispatchée' && !appointment.actualStartAt).length
  const startedWithoutEnd = state.appointments.filter((appointment: InterventionAppointment) => appointment.status === 'En cours' && !appointment.actualEndAt).length
  const ordersWithoutReport = state.orders.filter((order: InterventionOrder) => ['Terminée', 'Clôturée'].includes(order.status) && !state.audits.some(audit => audit.entityId === order.id && audit.event === 'intervention completed')).length
  const routeStopsOpen = state.routeStops.filter((stop: InterventionRouteStop) => !['Terminée', 'Clôturée', 'Annulée'].includes(stop.status)).length
  const equipmentUnproven = state.equipment.filter((equipment: InterventionEquipment) => ['En intervention', 'Chez patient', 'En transit'].includes(equipment.status) && !equipment.assignedOrderId).length
  const fieldStaffReady = state.staff.filter((staff: InterventionStaff) => staff.availability !== 'Indisponible' && staff.phone.startsWith('+212') && staff.certifications.length > 0).length
  const incidentOpen = state.incidents.filter(incident => incident.status !== 'Résolu').length
  const raw = 94 - dispatchedWithoutProgress * 6 - startedWithoutEnd * 5 - ordersWithoutReport * 8 - equipmentUnproven * 5 - incidentOpen * 4 - Math.max(0, routeStopsOpen - 4) * 2 + Math.min(8, fieldStaffReady)
  const score = Math.max(24, Math.min(100, raw))
  return {
    score,
    label: score >= 90 ? 'terrain prouvé' : score >= 78 ? 'terrain sous contrôle' : score >= 62 ? 'preuves incomplètes' : 'blocage preuve terrain',
    activeAppointments: activeAppointments.length,
    dispatchedWithoutProgress,
    startedWithoutEnd,
    ordersWithoutReport,
    routeStopsOpen,
    equipmentUnproven,
    fieldStaffReady,
    incidentOpen,
  }
}

export function buildPhase11MobileExecutionQueue(state: InterventionsState) {
  const rows: Array<{ id: string; title: string; owner: string; tone: Phase11ProofTone; detail: string; modal: InterventionModalKey; entityId?: string; entityType?: string }> = []
  state.appointments
    .filter((appointment: InterventionAppointment) => ['Dispatchée', 'En route', 'Sur site', 'En cours'].includes(appointment.status))
    .slice(0, 7)
    .forEach(appointment => {
      const order = state.orders.find((item: InterventionOrder) => item.id === appointment.orderId)
      const modal: InterventionModalKey = appointment.status === 'Dispatchée' ? 'EnRouteModal' : appointment.status === 'En route' ? 'ArrivalConfirmationModal' : appointment.status === 'Sur site' ? 'StartInterventionModal' : 'CompleteInterventionReportModal'
      rows.push({ id: `appointment-${appointment.id}`, title: `${appointment.reference} • ${order?.patientName || 'Bénéficiaire'}`, owner: 'Intervenant terrain', tone: appointment.status === 'En cours' ? 'bloquant' : 'mobile', detail: `Statut actuel: ${appointment.status}. Prochaine preuve requise via modal dédiée.`, modal, entityId: appointment.id, entityType: 'appointment' })
    })
  state.routeStops
    .filter((stop: InterventionRouteStop) => !['Terminée', 'Clôturée', 'Annulée'].includes(stop.status))
    .slice(0, 5)
    .forEach(stop => rows.push({ id: `stop-${stop.id}`, title: `Arrêt #${stop.sequence} • ${stop.plannedTime}`, owner: 'Dispatch / Chauffeur', tone: 'preuve', detail: `Arrêt tournée encore ouvert avec statut ${stop.status}.`, modal: 'RouteStopModal', entityId: stop.id, entityType: 'route_stop' }))
  state.equipment
    .filter((equipment: InterventionEquipment) => ['En intervention', 'Chez patient', 'En transit', 'Réservé'].includes(equipment.status))
    .slice(0, 5)
    .forEach(equipment => rows.push({ id: `equipment-${equipment.id}`, title: equipment.name, owner: 'Technicien Équipement', tone: 'preuve', detail: `Statut équipement: ${equipment.status}. Mouvement ou retour à confirmer.`, modal: 'EquipmentMovementModal', entityId: equipment.id, entityType: 'equipment' }))
  return rows.slice(0, 14)
}

export function buildPhase11StaffMobileReadiness(state: InterventionsState) {
  return state.staff.map((staff: InterventionStaff) => {
    const assignedActive = state.appointments.filter((appointment: InterventionAppointment) => appointment.staffIds.includes(staff.id) && !['Terminée', 'Clôturée', 'Annulée'].includes(appointment.status)).length
    const phoneOk = staff.phone.startsWith('+212')
    const certificationOk = staff.certifications.length > 0 && (!staff.expiresAt || new Date(staff.expiresAt).getTime() > Date.now())
    const availabilityOk = staff.availability !== 'Indisponible'
    const score = (phoneOk ? 25 : 0) + (certificationOk ? 30 : 0) + (availabilityOk ? 25 : 0) + Math.max(0, 20 - assignedActive * 4)
    return {
      id: staff.id,
      name: staff.fullName,
      role: staff.role,
      city: staff.city,
      zone: staff.zone,
      assignedActive,
      score,
      ready: score >= 75,
      checks: [phoneOk ? 'Téléphone +212 OK' : 'Téléphone à vérifier', certificationOk ? 'Certification OK' : 'Certification à contrôler', availabilityOk ? 'Disponible terrain' : 'Indisponible', `${assignedActive} intervention(s) active(s)`],
      modal: certificationOk ? 'StaffAvailabilityModal' as InterventionModalKey : 'StaffCertificationModal' as InterventionModalKey,
    }
  })
}

export function buildPhase11OfflineFallbackControls(state: InterventionsState) {
  const auditsLastDay = state.audits.filter(audit => Date.now() - new Date(audit.at).getTime() < 24 * 60 * 60 * 1000).length
  return [
    { id: 'local-state-warning', title: 'Mode fallback local encadré', owner: 'Engineering / Ops', state: state.audits.length > 0 ? 'surveillance' : 'à préparer', detail: 'Si realtime indisponible, polling/revalidation et audit local doivent rester visibles.', modal: 'ReportExportModal' as InterventionModalKey },
    { id: 'mobile-no-network', title: 'Procédure absence réseau terrain', owner: 'Dispatch', state: 'production contrôlée', detail: 'Intervenant appelle dispatch; coordinateur exécute la transition et ajoute audit.', modal: 'IncidentEscalationModal' as InterventionModalKey },
    { id: 'audit-last-day', title: 'Activité audit 24h', owner: 'Audit / Lecture seule', state: auditsLastDay ? 'actif' : 'à surveiller', detail: `${auditsLastDay} évènement(s) audit récent(s) sur workflows interventions.`, modal: 'PermissionMatrixModal' as InterventionModalKey },
    { id: 'paper-pack-backup', title: 'Pack papier secours', owner: 'Manager Opérations', state: 'prêt', detail: 'Fiche intervention, feuille tournée, bon équipement, cash closure en version imprimable.', modal: 'PrintTemplateModal' as InterventionModalKey },
  ]
}
