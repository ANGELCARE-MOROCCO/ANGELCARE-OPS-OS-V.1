import type { InterventionsState, RiskLevel } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase4Gate = {
  id: string
  title: string
  description: string
  severity: 'bloquant' | 'surveillance' | 'info'
  evidence: string[]
}

export type Phase4WarRoom = {
  title: string
  description: string
  primaryModal: InterventionModalKey
  controls: string[]
  outputProofs: string[]
}

export type Phase4OpsRow = {
  id: string
  priority: string
  subject: string
  detail: string
  risk: RiskLevel
  owner: string
  cta: string
  modal: InterventionModalKey
  entityId?: string
  entityType?: string
}

export const PHASE4_PRODUCTION_GATES: Phase4Gate[] = [
  {
    id: 'gate-assigned-only',
    title: 'Visibilité assignée uniquement',
    description: 'Les profils terrain ne doivent voir que les interventions qui leur sont affectées, avec escalade manager pour toute exception.',
    severity: 'bloquant',
    evidence: ['staffIds contrôlés', 'role matrix appliquée', 'audit lecture sensible'],
  },
  {
    id: 'gate-dispatch-proof',
    title: 'Preuve avant dispatch',
    description: 'Aucune intervention ne passe en Dispatchée sans adresse, staff, créneau, contact, équipement et SLA visibles.',
    severity: 'bloquant',
    evidence: ['adresse confirmée', 'créneau défini', 'staff disponible', 'SLA restant'],
  },
  {
    id: 'gate-completion-report',
    title: 'Compte rendu obligatoire',
    description: 'La clôture doit produire un compte rendu exploitable par opérations, finance et audit.',
    severity: 'bloquant',
    evidence: ['notes intervention', 'checklist', 'équipement utilisé', 'statut facturation'],
  },
  {
    id: 'gate-mad-billing',
    title: 'Contrôle financier MAD',
    description: 'Toute facturation ou devis doit rester en MAD avec montant, remise, statut paiement et traçabilité.',
    severity: 'surveillance',
    evidence: ['montant MAD', 'statut paiement', 'audit finance'],
  },
  {
    id: 'gate-morocco-context',
    title: 'Contexte Maroc',
    description: 'Les workflows doivent respecter villes, zones, téléphone +212, langue française et logique domicile/partenaire.',
    severity: 'info',
    evidence: ['ville/zone', 'téléphone +212', 'modèle français'],
  },
]

export const PHASE4_PAGE_WAR_ROOMS: Record<InterventionPageKey, Phase4WarRoom> = {
  home: {
    title: 'Accueil interventions production',
    description: 'Entrée unique vers command center, badges live, risques et raccourcis exécutifs.',
    primaryModal: 'RequestIntakeModal',
    controls: ['Routage vers Command Center', 'Badges sidebar synchronisés', 'Aucune dépendance Odoo/Frappe', 'Fond blanc enterprise'],
    outputProofs: ['route active', 'sidebar unique', 'MAD visible'],
  },
  command: {
    title: 'Command Center exécutif',
    description: 'Contrôle quotidien des urgences, SLA, finance, staff, équipement et incidents.',
    primaryModal: 'IncidentEscalationModal',
    controls: ['Urgences priorisées', 'Retards SLA visibles', 'Incidents ouverts', 'Revenu jour MAD', 'Audit live'],
    outputProofs: ['snapshot direction', 'priorités dispatch', 'risques affichés'],
  },
  demandes: {
    title: 'Intake & triage',
    description: 'File d’entrée robuste pour téléphone, WhatsApp, portail, partenaire et interne.',
    primaryModal: 'TriageDecisionModal',
    controls: ['Consentement', 'Téléphone +212', 'Ville/zone', 'Source', 'Décision triage'],
    outputProofs: ['demande traçable', 'devis possible', 'ordre possible'],
  },
  ordres: {
    title: 'Exécution ordre',
    description: 'Transformation des demandes validées en ordre terrain assignable et facturable.',
    primaryModal: 'StaffAssignmentModal',
    controls: ['Statut pipeline', 'Staff requis', 'Équipement requis', 'Checklist', 'Audit ordre'],
    outputProofs: ['ordre prêt', 'staff match', 'blocages visibles'],
  },
  dispatch: {
    title: 'Dispatch terrain',
    description: 'Affectation, dispatch, en route, sur site, démarrage, clôture et incident avec modals dédiés.',
    primaryModal: 'DispatchConfirmModal',
    controls: ['Aucun bouton générique', 'Chaque statut a son modal', 'Reassign/Cancel/Incident séparés'],
    outputProofs: ['timestamps', 'audit', 'statut terrain'],
  },
  planning: {
    title: 'Planning production',
    description: 'Calendrier jour/semaine/mois avec conflits, indisponibilités et impression bureau.',
    primaryModal: 'PlanningAssistantModal',
    controls: ['Conflits', 'Disponibilité staff', 'Créneaux', 'Impression planning'],
    outputProofs: ['planning imprimable', 'conflits résolus', 'notifications prêtes'],
  },
  tournees: {
    title: 'Tournées terrain',
    description: 'Routes quotidiennes par service, séquence arrêts, chauffeur et feuille tournée.',
    primaryModal: 'RouteBuilderModal',
    controls: ['Arrêts ordonnés', 'Chauffeur', 'Staff', 'Équipement', 'Clôture tournée'],
    outputProofs: ['feuille route', 'ordre arrêts', 'preuve clôture'],
  },
  personnel: {
    title: 'Couverture staff',
    description: 'Médecins, infirmiers, adultes care, techniciens, chauffeurs, certifications et disponibilité.',
    primaryModal: 'StaffCertificationModal',
    controls: ['Certificats', 'Charge', 'Zones', 'Éligibilité urgence'],
    outputProofs: ['score couverture', 'alerte expiration', 'matching staff'],
  },
  patients: {
    title: 'Bénéficiaires home-care',
    description: 'Profil opérationnel non-EMR avec contacts famille, historique, risques, documents et plan simple.',
    primaryModal: 'CarePlanModal',
    controls: ['Contacts famille', 'Adresse', 'Risque', 'Consentement', 'Historique'],
    outputProofs: ['fiche patient', 'risques visibles', 'documents'],
  },
  lieux: {
    title: 'Sites et zones',
    description: 'Domiciles, crèches, entreprises, cliniques partenaires, dépôts et consignes accès.',
    primaryModal: 'MapDrawerModal',
    controls: ['Zone', 'Ville', 'Consignes accès', 'Patient/client lié'],
    outputProofs: ['carte opérationnelle', 'route possible', 'accès terrain'],
  },
  equipements: {
    title: 'Équipements & stock',
    description: 'Traçabilité disponibilité, réservation, transit, maintenance, retour et consommation stock.',
    primaryModal: 'EquipmentMovementModal',
    controls: ['Statut équipement', 'Mouvement', 'Maintenance', 'Consommables'],
    outputProofs: ['timeline équipement', 'stock consommé', 'retour dépôt'],
  },
  rapports: {
    title: 'Rapports & audit',
    description: 'Exports journaliers, SLA, staff, zones, incidents, équipement et facturation MAD.',
    primaryModal: 'ReportExportModal',
    controls: ['Période', 'Sections', 'Format', 'Archivage audit'],
    outputProofs: ['PDF/CSV prêt', 'snapshot audit', 'rapport direction'],
  },
  facturation: {
    title: 'Facturation MAD',
    description: 'Devis, factures, paiements, impayés, remises, conversion et relance.',
    primaryModal: 'PaymentModal',
    controls: ['MAD', 'Paiement', 'Impayés', 'Remises', 'Lien intervention'],
    outputProofs: ['statut finance', 'paiement enregistré', 'audit finance'],
  },
  parametres: {
    title: 'Configuration production',
    description: 'Types, tarifs, SLA, checklists, workflow, documents, notifications et permissions.',
    primaryModal: 'PermissionMatrixModal',
    controls: ['RBAC', 'SLA', 'Tarifs MAD', 'Checklists', 'Documents requis'],
    outputProofs: ['paramètre audité', 'workflow stable', 'permission appliquée'],
  },
}

export const PHASE4_ROLE_HANDOFFS = [
  { from: 'Support Client', to: 'Coordinateur Dispatch', payload: 'Demande qualifiée avec téléphone +212, ville, créneau, source et notes client.', proof: 'request created + triage pending' },
  { from: 'Coordinateur Dispatch', to: 'Superviseur Médical', payload: 'Risque élevé, documents manquants ou incident terrain nécessitant validation.', proof: 'incident escalated / request triaged' },
  { from: 'Dispatch', to: 'Personnel terrain', payload: 'Adresse, contact, checklist, timing, risque et équipement requis.', proof: 'dispatch confirmed + appointment scheduled' },
  { from: 'Personnel terrain', to: 'Finance', payload: 'Compte rendu terminé, consommables, durée réelle et statut facturable.', proof: 'intervention completed + invoice created' },
  { from: 'Équipement', to: 'Audit', payload: 'Mouvement équipement, transit, maintenance, retour dépôt ou consommation stock.', proof: 'equipment moved / inventory consumed' },
]

export const PHASE4_PRINT_PACKS = [
  { name: 'Fiche intervention terrain', use: 'Document staff avec patient, adresse, checklist et contact famille.', sections: ['Référence ordre', 'Adresse', 'Risque', 'Checklist', 'Notes terrain'] },
  { name: 'Planning bureau', use: 'Affichage jour/semaine/mois pour coordination interne.', sections: ['Créneaux', 'Staff', 'Zones', 'Conflits', 'Retards'] },
  { name: 'Feuille tournée', use: 'Ordre des arrêts et contacts pour chauffeur/staff.', sections: ['Route', 'Arrêts', 'Temps prévu', 'Équipement', 'Signature clôture'] },
  { name: 'Bon équipement', use: 'Traçabilité livraison, installation, récupération ou maintenance.', sections: ['Équipement', 'Serial', 'Statut', 'Intervention liée', 'Retour'] },
  { name: 'Rapport direction', use: 'Synthèse quotidienne opérations, SLA, incidents et MAD.', sections: ['KPI', 'SLA', 'Incidents', 'Finance MAD', 'Audit'] },
  { name: 'Facture / devis MAD', use: 'Modèle finance en dirham marocain avec remise et reste à payer.', sections: ['Client', 'Services', 'Montant MAD', 'Paiement', 'Conditions'] },
]

export function buildPhase4CommandAssurance(state: InterventionsState) {
  const active = state.orders.filter(order => !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)).length
  const blocked = state.orders.filter(order => !order.assignedStaffIds.length || new Date(order.slaDueAt).getTime() < Date.now()).length
  const incidents = state.incidents.filter(incident => incident.status !== 'Résolu').length
  const auditFactor = Math.min(20, state.audits.length * 2)
  const score = Math.max(42, Math.min(99, 78 + auditFactor - blocked * 9 - incidents * 7 + active))
  return {
    score,
    label: score >= 85 ? 'prête production' : score >= 70 ? 'surveillance active' : 'blocages à résoudre',
    openGates: blocked + incidents,
  }
}

export function buildPhase4StaffCoverage(state: InterventionsState) {
  const roles = new Set(state.staff.map(staff => staff.role))
  const available = state.staff.filter(staff => staff.availability === 'Disponible').length
  const coverage = Math.min(100, Math.round((available / Math.max(1, state.staff.length)) * 70 + roles.size * 5))
  return {
    coverage,
    summary: `${available}/${state.staff.length} disponibles • ${roles.size} rôles couverts`,
  }
}

export function buildPhase4FinancialControl(state: InterventionsState) {
  const exposedMad = state.invoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amountMad - invoice.paidMad), 0)
  const paidMad = state.invoices.reduce((sum, invoice) => sum + invoice.paidMad, 0)
  return {
    exposedMad,
    paidMad,
    summary: `${paidMad.toLocaleString('fr-FR')} MAD encaissés`,
  }
}

export function buildPhase4WhiteOpsRows(state: InterventionsState, page: InterventionPageKey): Phase4OpsRow[] {
  const firstOrder = state.orders[0]
  const urgentOrder = state.orders.find(order => order.riskLevel === 'Critique' || order.riskLevel === 'Élevé') || firstOrder
  const firstRequest = state.requests[0]
  const firstEquipment = state.equipment[0]
  const rows: Phase4OpsRow[] = [
    {
      id: `${page}-sla`,
      priority: 'P1',
      subject: urgentOrder ? `${urgentOrder.reference} • ${urgentOrder.patientName}` : 'Aucun ordre critique',
      detail: 'Contrôle SLA, staff, équipement et décision dispatch avec audit.',
      risk: urgentOrder?.riskLevel || 'Modéré',
      owner: 'Coordinateur Dispatch',
      cta: 'Résoudre',
      modal: 'DispatchConfirmModal',
      entityId: urgentOrder?.id,
      entityType: 'order',
    },
    {
      id: `${page}-triage`,
      priority: 'P2',
      subject: firstRequest ? `${firstRequest.reference} • ${firstRequest.patientName}` : 'File triage propre',
      detail: 'Vérifier consentement, +212, ville/zone, documents et conversion possible.',
      risk: firstRequest?.riskLevel || 'Faible',
      owner: 'Support Client',
      cta: 'Trier',
      modal: 'TriageDecisionModal',
      entityId: firstRequest?.id,
      entityType: 'request',
    },
    {
      id: `${page}-equipment`,
      priority: 'P3',
      subject: firstEquipment ? `${firstEquipment.name} • ${firstEquipment.status}` : 'Stock stable',
      detail: 'Tracer disponibilité, réservation, transit, maintenance, retour ou consommation.',
      risk: firstEquipment?.status === 'Hors service' ? 'Critique' : firstEquipment?.status === 'En maintenance' ? 'Élevé' : 'Modéré',
      owner: 'Équipe équipement',
      cta: 'Mouvement',
      modal: 'EquipmentMovementModal',
      entityId: firstEquipment?.id,
      entityType: 'equipment',
    },
  ]
  return rows
}
