import type { InterventionsState, InterventionOrder, InterventionInvoice } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase9GovernanceSeverity = 'bloquant' | 'direction' | 'finance' | 'terrain' | 'audit'

export const PHASE9_GOVERNANCE_COMMANDS: Record<InterventionPageKey, {
  title: string
  mandate: string
  accountableRole: string
  nonNegotiableControl: string
  primaryModal: InterventionModalKey
  governanceProofs: string[]
}> = {
  home: { title: 'Gouvernance globale production', mandate: 'Transformer tous les workspaces en système gouverné avant usage réel multi-rôles.', accountableRole: 'Direction / CEO', nonNegotiableControl: 'Aucune page Interventions sans owner, SLA, preuve, audit et workflow clair.', primaryModal: 'PermissionMatrixModal', governanceProofs: ['Owner page', 'SLA visible', 'Audit actif', 'RBAC contrôlé'] },
  command: { title: 'Gouvernance Direction & SLA', mandate: 'Contrôler exceptions, retards, incidents, recettes MAD et adoption avant mise en production terrain.', accountableRole: 'Direction / CEO', nonNegotiableControl: 'La direction doit voir les risques actionnables, pas des cartes décoratives.', primaryModal: 'ReportExportModal', governanceProofs: ['Snapshot direction', 'Retards SLA', 'Finance MAD', 'Incidents ouverts'] },
  demandes: { title: 'Gouvernance intake', mandate: 'Empêcher l’entrée en production de demandes sans identité, contact +212, ville, risque, service ou document.', accountableRole: 'Support Client', nonNegotiableControl: 'Aucune demande critique ne doit rester non triée.', primaryModal: 'TriageDecisionModal', governanceProofs: ['Triage', 'Contact', 'Consentement', 'SLA demande'] },
  ordres: { title: 'Gouvernance ordres exécutables', mandate: 'Chaque ordre doit porter une responsabilité claire: staff, patient, équipement, SLA, checklist, facturation.', accountableRole: 'Manager Opérations', nonNegotiableControl: 'Aucun ordre ne part au dispatch sans assignation traçable.', primaryModal: 'OrderBuilderModal', governanceProofs: ['Assignation', 'Checklist', 'Équipement', 'Facturable'] },
  dispatch: { title: 'Gouvernance dispatch terrain', mandate: 'Contrôler chaque passage de statut terrain: dispatch, en route, sur site, start, clôture, incident.', accountableRole: 'Coordinateur Dispatch', nonNegotiableControl: 'Chaque changement terrain doit créer une preuve opérationnelle et un audit.', primaryModal: 'DispatchConfirmModal', governanceProofs: ['Horodatage', 'Owner', 'Notification', 'Rapport'] },
  planning: { title: 'Gouvernance planning & capacité', mandate: 'Empêcher conflits, surcharges, indisponibilités, manque de compétences et SLA impossibles.', accountableRole: 'Manager Opérations', nonNegotiableControl: 'Aucun planning ne doit publier un chevauchement staff non justifié.', primaryModal: 'PlanningAssistantModal', governanceProofs: ['Conflits', 'Capacité', 'Disponibilité', 'Publication'] },
  tournees: { title: 'Gouvernance tournées & routes', mandate: 'Contrôler chaque tournée: arrêts, ordre, chauffeur, équipement, feuille terrain, clôture retour.', accountableRole: 'Coordinateur Dispatch', nonNegotiableControl: 'Aucune tournée ouverte ne doit rester sans feuille ni clôture.', primaryModal: 'RouteBuilderModal', governanceProofs: ['Arrêts', 'Feuille', 'Retour', 'Clôture'] },
  personnel: { title: 'Gouvernance personnel & habilitations', mandate: 'Garantir que seuls les rôles habilités, disponibles, certifiés et formés exécutent les interventions.', accountableRole: 'Manager Opérations', nonNegotiableControl: 'Aucun staff expiré ou indisponible ne doit être recommandé sans override audit.', primaryModal: 'StaffCertificationModal', governanceProofs: ['Certification', 'Disponibilité', 'Rôle', 'Charge'] },
  patients: { title: 'Gouvernance dossier bénéficiaire', mandate: 'Sécuriser le dossier home-care opérationnel: contact famille, adresse, risques, documents, historique.', accountableRole: 'Superviseur Médical', nonNegotiableControl: 'Aucune intervention sensible sans contact famille ou consigne documentée.', primaryModal: 'PatientProfileModal', governanceProofs: ['Contact famille', 'Risque', 'Adresse', 'Historique'] },
  lieux: { title: 'Gouvernance lieux & accès', mandate: 'Garantir que les sites soient exploitables: zone, consignes, contact, accès, carte, restrictions.', accountableRole: 'Coordinateur Dispatch', nonNegotiableControl: 'Aucune adresse imprécise ne doit passer au terrain.', primaryModal: 'MapDrawerModal', governanceProofs: ['Adresse', 'Zone', 'Consignes', 'Contact site'] },
  equipements: { title: 'Gouvernance équipement & stock', mandate: 'Contrôler matériel, mouvements, cautions, retours, maintenance, consommables et preuve de transfert.', accountableRole: 'Technicien Équipement', nonNegotiableControl: 'Aucun équipement patient/en transit sans owner ni prochaine action.', primaryModal: 'EquipmentMovementModal', governanceProofs: ['Owner', 'Mouvement', 'Retour', 'Maintenance'] },
  rapports: { title: 'Gouvernance rapports & audit', mandate: 'Garantir export, traçabilité, comptes rendus, SLA, incidents, performance et preuves de direction.', accountableRole: 'Audit / Lecture seule', nonNegotiableControl: 'Aucun export direction sans période, owner, source et audit.', primaryModal: 'ReportExportModal', governanceProofs: ['Période', 'Source', 'Owner', 'Audit export'] },
  facturation: { title: 'Gouvernance finance MAD', mandate: 'Contrôler devis, factures, paiements, impayés, reçus, remises et exposition MAD.', accountableRole: 'Finance', nonNegotiableControl: 'Aucune clôture facturable sans lien facture ou justification.', primaryModal: 'PaymentModal', governanceProofs: ['Devis/facture', 'Paiement', 'Relance', 'Audit MAD'] },
  parametres: { title: 'Gouvernance configuration', mandate: 'Protéger tarifs, SLA, statuts, checklists, documents, permissions et modèles contre changements non contrôlés.', accountableRole: 'Direction / CEO', nonNegotiableControl: 'Aucun paramètre critique sans owner, motif, impact et rollback.', primaryModal: 'PermissionMatrixModal', governanceProofs: ['Owner', 'Motif', 'Impact', 'Rollback'] },
}

export const PHASE9_SLA_GOVERNANCE_RULES: Array<{ id: string; label: string; target: string; owner: string; severity: Phase9GovernanceSeverity; modal: InterventionModalKey }> = [
  { id: 'urgent-triage-15', label: 'Triage demande critique', target: '≤ 15 minutes', owner: 'Superviseur Médical + Dispatch', severity: 'bloquant', modal: 'TriageDecisionModal' },
  { id: 'assignment-30', label: 'Assignation ordre validé', target: '≤ 30 minutes', owner: 'Coordinateur Dispatch', severity: 'terrain', modal: 'StaffAssignmentModal' },
  { id: 'dispatch-proof', label: 'Preuve dispatch terrain', target: 'avant départ', owner: 'Coordinateur Dispatch', severity: 'audit', modal: 'DispatchConfirmModal' },
  { id: 'completion-report', label: 'Compte rendu clôture', target: 'avant clôture/facturation', owner: 'Intervenant + Superviseur', severity: 'bloquant', modal: 'CompleteInterventionReportModal' },
  { id: 'invoice-linkage', label: 'Lien facture MAD', target: '≤ 24h après clôture', owner: 'Finance', severity: 'finance', modal: 'PaymentModal' },
  { id: 'equipment-return', label: 'Retour matériel', target: 'selon feuille tournée', owner: 'Technicien Équipement', severity: 'terrain', modal: 'EquipmentMovementModal' },
]

export const PHASE9_ACCOUNTABILITY_MATRIX: Array<{ owner: string; canApprove: string[]; cannotBypass: string[]; evidence: string; modal: InterventionModalKey }> = [
  { owner: 'Direction / CEO', canApprove: ['go-live', 'changement SLA', 'tarifs MAD', 'permissions critiques'], cannotBypass: ['audit', 'consentement', 'preuves terrain'], evidence: 'Décision, horodatage, rollback', modal: 'PermissionMatrixModal' },
  { owner: 'Manager Opérations', canApprove: ['planning', 'staffing', 'exceptions capacité'], cannotBypass: ['staff expiré sans justification', 'SLA critique ignoré'], evidence: 'Raison override, staff alternatif, audit', modal: 'PlanningAssistantModal' },
  { owner: 'Coordinateur Dispatch', canApprove: ['dispatch', 'réassignation', 'tournée'], cannotBypass: ['adresse inconnue', 'aucun contact', 'aucun staff'], evidence: 'Horodatage, staff, route, contact', modal: 'DispatchConfirmModal' },
  { owner: 'Superviseur Médical', canApprove: ['triage risque', 'incident', 'clôture sensible'], cannotBypass: ['rapport manquant', 'risque non qualifié'], evidence: 'Note supervision, escalade, outcome', modal: 'IncidentEscalationModal' },
  { owner: 'Finance', canApprove: ['remise', 'paiement', 'relance', 'facture'], cannotBypass: ['montant MAD absent', 'ordre non lié'], evidence: 'Reçu, mode paiement, facture', modal: 'PaymentModal' },
  { owner: 'Audit / Lecture seule', canApprove: ['aucune mutation'], cannotBypass: ['lecture seule stricte'], evidence: 'Export, snapshot, journal', modal: 'ReportExportModal' },
]

export const PHASE9_GO_LIVE_CHECKLIST: Array<{ area: string; minimum: string; blockingFailure: string; modal: InterventionModalKey }> = [
  { area: 'Navigation', minimum: 'Sidebar Interventions unique, active, badges exploitables', blockingFailure: 'Double sidebar ou route 404', modal: 'PermissionMatrixModal' },
  { area: 'Workflow', minimum: 'Demande → ordre → assignation → planning → dispatch → rapport → facture', blockingFailure: 'Action sans mutation/audit', modal: 'WorkflowStageModal' },
  { area: 'RBAC', minimum: 'Manager full, staff assigné uniquement, finance limitée, audit lecture seule', blockingFailure: 'Staff voit tout ou audit peut muter', modal: 'PermissionMatrixModal' },
  { area: 'SLA', minimum: 'Retards visibles, owners, escalade, actions', blockingFailure: 'SLA décoratif sans owner', modal: 'SlaMatrixModal' },
  { area: 'Maroc/MAD', minimum: 'Français, MAD, +212, villes/zones', blockingFailure: 'Texte anglais ou devise non-MAD dans flux métier', modal: 'PricingRuleModal' },
  { area: 'Clôture', minimum: 'Rapport obligatoire et facture contrôlée', blockingFailure: 'Clôture sans preuve ni audit', modal: 'CompleteInterventionReportModal' },
]

export function buildPhase9GovernanceScore(state: InterventionsState) {
  const totalOrders = Math.max(1, state.orders.length)
  const governedOrders = state.orders.filter(o => o.assignedStaffIds.length > 0 && Boolean(o.locationId) && Boolean(o.invoiceId || !['Terminée', 'Clôturée'].includes(o.status))).length
  const auditCoverage = Math.min(30, state.audits.length * 2)
  const openCritical = state.incidents.filter(i => i.status !== 'Résolu' && ['Élevé', 'Critique'].includes(i.riskLevel)).length
  const financeExposure = state.invoices.reduce((sum: number, invoice: InterventionInvoice) => sum + Math.max(0, invoice.amountMad - invoice.paidMad), 0)
  const expiredStaff = state.staff.filter(staff => staff.expiresAt && new Date(staff.expiresAt).getTime() < Date.now()).length
  const score = Math.max(22, Math.min(100, Math.round((governedOrders / totalOrders) * 44 + auditCoverage + 26 - openCritical * 9 - expiredStaff * 6 - Math.min(18, Math.round(financeExposure / 3500)))))
  return { score, label: score >= 90 ? 'go-live contrôlé' : score >= 76 ? 'gouvernance active' : 'blocages à lever', governedOrders, totalOrders, auditCoverage, openCritical, expiredStaff, financeExposure }
}

export function buildPhase9SlaBreachRegister(state: InterventionsState) {
  const now = Date.now()
  return state.orders
    .filter((order: InterventionOrder) => !['Clôturée', 'Annulée'].includes(order.status))
    .map(order => {
      const minutesToSla = Math.round((new Date(order.slaDueAt).getTime() - now) / 60000)
      const missingAssignment = order.assignedStaffIds.length === 0
      const missingInvoice = ['Terminée', 'Clôturée'].includes(order.status) && !order.invoiceId
      const breach = minutesToSla < 0 || missingAssignment || missingInvoice
      return {
        id: order.id,
        reference: order.reference,
        patientName: order.patientName,
        city: order.city,
        zone: order.zone,
        status: order.status,
        riskLevel: order.riskLevel,
        minutesToSla,
        breach,
        control: missingAssignment ? 'assignation absente' : missingInvoice ? 'facture absente' : minutesToSla < 0 ? 'SLA dépassé' : 'sous surveillance',
        owner: missingAssignment ? 'Coordinateur Dispatch' : missingInvoice ? 'Finance' : 'Manager Opérations',
        modal: missingAssignment ? 'StaffAssignmentModal' as InterventionModalKey : missingInvoice ? 'PaymentModal' as InterventionModalKey : 'SlaMatrixModal' as InterventionModalKey,
      }
    })
    .sort((a, b) => Number(b.breach) - Number(a.breach) || a.minutesToSla - b.minutesToSla)
    .slice(0, 12)
}

export function buildPhase9ReadinessGates(state: InterventionsState) {
  const score = buildPhase9GovernanceScore(state)
  const unassigned = state.orders.filter(o => o.assignedStaffIds.length === 0).length
  const missingReports = state.orders.filter(o => ['Terminée', 'Clôturée'].includes(o.status) && !state.audits.some(a => a.entityId === o.id && /completed|report|clôture/i.test(a.event + ' ' + a.summary))).length
  const equipmentInTransit = state.equipment.filter(e => ['En transit', 'Chez patient', 'Réservé'].includes(e.status)).length
  return [
    { label: 'Gouvernance globale', value: `${score.score}%`, detail: score.label, blocked: score.score < 76, modal: 'ReportExportModal' as InterventionModalKey },
    { label: 'Ordres non assignés', value: unassigned, detail: 'à traiter avant production', blocked: unassigned > 0, modal: 'StaffAssignmentModal' as InterventionModalKey },
    { label: 'Rapports manquants', value: missingReports, detail: 'clôtures à corriger', blocked: missingReports > 0, modal: 'CompleteInterventionReportModal' as InterventionModalKey },
    { label: 'Exposition MAD', value: `${Math.round(score.financeExposure).toLocaleString('fr-MA')} MAD`, detail: 'reste à encaisser/justifier', blocked: score.financeExposure > 20000, modal: 'PaymentModal' as InterventionModalKey },
    { label: 'Équipements ouverts', value: equipmentInTransit, detail: 'mouvements à gouverner', blocked: equipmentInTransit > 2, modal: 'EquipmentMovementModal' as InterventionModalKey },
  ]
}

export function buildPhase9HandoffExceptions(state: InterventionsState) {
  const staffBlocked = state.staff.filter(staff => staff.availability !== 'Disponible' || (staff.expiresAt && new Date(staff.expiresAt).getTime() < Date.now())).slice(0, 5).map(staff => ({
    id: `staff-${staff.id}`,
    title: `Habilitation staff à revoir: ${staff.fullName}`,
    owner: 'Manager Opérations',
    detail: `${staff.role} • ${staff.city}/${staff.zone} • ${staff.availability}`,
    severity: 'terrain' as Phase9GovernanceSeverity,
    modal: 'StaffCertificationModal' as InterventionModalKey,
  }))
  const financeBlocked = state.invoices.filter(invoice => invoice.status !== 'Payée' && invoice.amountMad > invoice.paidMad).slice(0, 5).map(invoice => ({
    id: `invoice-${invoice.id}`,
    title: `Facture MAD à gouverner: ${invoice.reference}`,
    owner: 'Finance',
    detail: `${invoice.patientName} • reste ${Math.round(invoice.amountMad - invoice.paidMad).toLocaleString('fr-MA')} MAD`,
    severity: 'finance' as Phase9GovernanceSeverity,
    modal: 'PaymentModal' as InterventionModalKey,
  }))
  const routeBlocked = state.routes.filter(route => route.status !== 'Clôturée').slice(0, 5).map(route => ({
    id: `route-${route.id}`,
    title: `Tournée non clôturée: ${route.name}`,
    owner: 'Coordinateur Dispatch',
    detail: `${route.city}/${route.zone} • ${route.stopIds.length} arrêts`,
    severity: 'audit' as Phase9GovernanceSeverity,
    modal: 'RouteBuilderModal' as InterventionModalKey,
  }))
  return [...staffBlocked, ...financeBlocked, ...routeBlocked].slice(0, 12)
}
