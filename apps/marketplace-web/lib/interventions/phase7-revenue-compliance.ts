import type { InterventionsState, InterventionInvoice, InterventionOrder } from './types'
import type { InterventionModalKey, InterventionPageKey } from './enterprise-config'

export type Phase7Severity = 'bloquant' | 'finance' | 'conformité' | 'direction'

export const PHASE7_REVENUE_COMMANDS: Record<InterventionPageKey, {
  title: string
  mandate: string
  releaseCondition: string
  primaryModal: InterventionModalKey
  board: string[]
}> = {
  home: { title: 'Cockpit revenus & conformité', mandate: 'Consolider le revenu MAD, les dossiers facturables, les impayés et les preuves de clôture.', releaseCondition: 'Aucun dossier clôturé sans facture, reçu ou justification de non-facturation.', primaryModal: 'PaymentModal', board: ['CA MAD consolidé', 'Dossiers facturables', 'Impayés', 'Exports direction'] },
  command: { title: 'Revenue command center', mandate: 'Afficher l’exposition financière live à côté des risques terrain et incidents.', releaseCondition: 'Chaque urgence doit conserver son statut finance et son audit séparé.', primaryModal: 'ReportExportModal', board: ['CA jour', 'Reste à encaisser', 'Retards SLA facturables', 'Audit finance'] },
  demandes: { title: 'Pré-devis & qualification paiement', mandate: 'Identifier très tôt les demandes nécessitant devis, acompte, prise en charge ou exception.', releaseCondition: 'Pas de conversion sensible sans règle tarifaire MAD ou motif manager.', primaryModal: 'QuoteBuilderModal', board: ['Devis requis', 'Tarif service', 'Contact payeur', 'Consentement document'] },
  ordres: { title: 'Contrôle facturable des ordres', mandate: 'Bloquer les clôtures d’ordres sans décision de facturation, remise ou justification.', releaseCondition: 'Ordre terminé = facture, paiement, remise approuvée ou exception auditée.', primaryModal: 'QuoteBuilderModal', board: ['Facturable', 'Non facturé', 'Équipement facturable', 'Remises'] },
  dispatch: { title: 'Dispatch avec impact finance', mandate: 'Afficher au dispatcher l’impact financier sans exposer les notes sensibles inutiles.', releaseCondition: 'Dispatch terrain ne doit pas écraser la responsabilité finance.', primaryModal: 'PaymentModal', board: ['Encaissement terrain', 'Paiement à confirmer', 'Reçu requis', 'Audit paiement'] },
  planning: { title: 'Planning rentable & capacité', mandate: 'Comparer charge, durée, zone et revenu pour éviter tournées non rentables.', releaseCondition: 'Planning automatique doit signaler les tournées à faible couverture MAD.', primaryModal: 'PlanningAssistantModal', board: ['Durée prévue', 'Revenu par tournée', 'Zones coûteuses', 'Capacité staff'] },
  tournees: { title: 'Tournées & cash closure', mandate: 'Relier chaque tournée aux encaissements, reçus, bons équipement et feuille clôture.', releaseCondition: 'Tournée clôturée seulement avec feuille tournée + preuves MAD/équipement.', primaryModal: 'PrintTemplateModal', board: ['Feuille tournée', 'Reçus', 'Bons équipement', 'Retour dépôt'] },
  personnel: { title: 'Responsabilité finance terrain', mandate: 'Contrôler quels rôles peuvent encaisser, remettre un reçu ou valider une exception.', releaseCondition: 'Aucun staff terrain sans périmètre finance explicite.', primaryModal: 'PermissionMatrixModal', board: ['Rôles encaissement', 'Lecture seule', 'Exceptions', 'Formation reçu'] },
  patients: { title: 'Dossier payeur & relation famille', mandate: 'Centraliser relation facturation sans transformer le profil en EMR hospitalier.', releaseCondition: 'Le contact payeur et contact famille doivent rester traçables.', primaryModal: 'PatientProfileModal', board: ['Contact payeur', 'Historique factures', 'Reste à payer', 'Documents'] },
  lieux: { title: 'Zones tarifaires & accès', mandate: 'Appliquer majorations de zone, consignes accès et coûts de déplacement.', releaseCondition: 'Adresse/zone obligatoire avant devis et tournée.', primaryModal: 'PricingRuleModal', board: ['Ville', 'Zone', 'Majoration', 'Accès'] },
  equipements: { title: 'Équipement facturable & caution', mandate: 'Tracer caution, retour, maintenance, installation et consommation stock.', releaseCondition: 'Aucun mouvement équipement sans statut financier ou bon équipement.', primaryModal: 'EquipmentMovementModal', board: ['Caution', 'Installation', 'Retour', 'Maintenance'] },
  rapports: { title: 'Pack direction & audit finance', mandate: 'Générer exports direction avec CA, recouvrement, SLA, incidents et preuves.', releaseCondition: 'Chaque export rapport doit créer un événement audit.', primaryModal: 'ReportExportModal', board: ['PDF direction', 'CSV finance', 'Audit', 'Comparaison période'] },
  facturation: { title: 'War room facturation MAD', mandate: 'Piloter devis, factures, paiements, impayés, remises et clôture caisse.', releaseCondition: 'Aucune facture en retard sans owner, prochaine action et audit.', primaryModal: 'PaymentModal', board: ['Devis', 'Factures', 'Paiements', 'Relances'] },
  parametres: { title: 'Gouvernance tarifs & permissions', mandate: 'Contrôler règles tarifaires, SLA finance, remises maximales et matrice RBAC.', releaseCondition: 'Changement tarif/RBAC = audit + owner + effet aval documenté.', primaryModal: 'PricingRuleModal', board: ['Tarifs MAD', 'Remises', 'SLA finance', 'RBAC'] },
}

export const PHASE7_FINANCE_GATES: Array<{ id: string; label: string; owner: string; severity: Phase7Severity; proof: string; modal: InterventionModalKey }> = [
  { id: 'invoice-link', label: 'Lien facture obligatoire', owner: 'Finance', severity: 'bloquant', proof: 'order_id + invoice_id + statut billing synchronisés', modal: 'QuoteBuilderModal' },
  { id: 'payment-proof', label: 'Preuve paiement / reçu', owner: 'Finance terrain', severity: 'finance', proof: 'mode paiement, montant MAD, référence reçu, acteur', modal: 'PaymentModal' },
  { id: 'discount-control', label: 'Remise contrôlée', owner: 'Manager Opérations', severity: 'direction', proof: 'remise, motif, approbateur, audit settings changed', modal: 'PricingRuleModal' },
  { id: 'equipment-billing', label: 'Équipement facturable ou caution', owner: 'Équipe équipement', severity: 'finance', proof: 'bon équipement, mouvement, caution/retour, facture liée', modal: 'EquipmentMovementModal' },
  { id: 'export-audit', label: 'Export direction audité', owner: 'Audit / Lecture seule', severity: 'conformité', proof: 'période, format, sections, destinataire, report exported', modal: 'ReportExportModal' },
]

export const PHASE7_CASH_CLOSURE_PROTOCOLS: Array<{ id: string; title: string; owner: string; deadline: string; proof: string; modal: InterventionModalKey }> = [
  { id: 'daily-cash', title: 'Clôture caisse quotidienne', owner: 'Finance', deadline: 'Fin de journée', proof: 'Somme encaissée MAD + reçus + reste à payer + audit', modal: 'PaymentModal' },
  { id: 'route-cash', title: 'Clôture tournée avec encaissement', owner: 'Coordinateur Dispatch', deadline: 'Après retour terrain', proof: 'Feuille tournée + paiements terrain + bons équipement', modal: 'PrintTemplateModal' },
  { id: 'invoice-recovery', title: 'Relance impayés', owner: 'Finance', deadline: 'J+1 si impayée', proof: 'Prochaine action, contact payeur, statut facture', modal: 'PaymentModal' },
  { id: 'exception-review', title: 'Revue exceptions non facturées', owner: 'Direction / CEO', deadline: 'Hebdomadaire', proof: 'Liste exceptions, raison, approbateur, impact MAD', modal: 'ReportExportModal' },
]

export const PHASE7_COMPLIANCE_EXPORTS: Array<{ id: string; label: string; audience: string; contents: string[]; modal: InterventionModalKey }> = [
  { id: 'direction-pack', label: 'Pack Direction Interventions', audience: 'Direction / CEO', contents: ['CA MAD', 'Recouvrement', 'SLA', 'Incidents', 'Staff', 'Équipement'], modal: 'ReportExportModal' },
  { id: 'finance-pack', label: 'Pack Finance MAD', audience: 'Finance', contents: ['Devis', 'Factures', 'Paiements', 'Impayés', 'Remises', 'Exceptions'], modal: 'ReportExportModal' },
  { id: 'route-pack', label: 'Pack Tournées & caisse terrain', audience: 'Dispatch + Finance', contents: ['Arrêts', 'Encaissements', 'Bons équipement', 'Retours', 'Incidents'], modal: 'PrintTemplateModal' },
  { id: 'audit-pack', label: 'Pack Audit conformité', audience: 'Audit / Lecture seule', contents: ['Mutations', 'RBAC', 'Exports', 'Paiements', 'Annulations', 'Escalades'], modal: 'PermissionMatrixModal' },
]

export function buildPhase7RevenueAssurance(state: InterventionsState) {
  const total = state.invoices.reduce((sum, inv) => sum + inv.amountMad, 0)
  const paid = state.invoices.reduce((sum, inv) => sum + inv.paidMad, 0)
  const unpaid = Math.max(0, total - paid)
  const invoiceCount = state.invoices.length
  const billableOrders = state.orders.filter(order => ['Facturable', 'Devis', 'Non facturé'].includes(order.billingStatus)).length
  const closedOrders = state.orders.filter(order => ['Terminée', 'Clôturée'].includes(order.status)).length
  const closedWithoutInvoice = state.orders.filter(order => ['Terminée', 'Clôturée'].includes(order.status) && !state.invoices.some(inv => inv.orderId === order.id)).length
  const unpaidInvoices = state.invoices.filter(inv => ['Impayée', 'Partiellement payée', 'Émise'].includes(inv.status) && inv.paidMad < inv.amountMad).length
  const recoveryRate = total ? Math.round((paid / total) * 100) : 100
  const score = Math.max(32, Math.min(100, recoveryRate - closedWithoutInvoice * 12 - unpaidInvoices * 4 + (closedOrders ? 4 : 0)))
  return { total, paid, unpaid, invoiceCount, billableOrders, closedOrders, closedWithoutInvoice, unpaidInvoices, recoveryRate, score, label: score >= 86 ? 'solide' : score >= 70 ? 'sous surveillance' : 'critique' }
}

export function buildPhase7InvoiceExposure(state: InterventionsState) {
  const byInvoice = state.invoices.map(invoice => {
    const order = state.orders.find(o => o.id === invoice.orderId)
    const outstanding = Math.max(0, invoice.amountMad - invoice.paidMad)
    const daysLeft = Math.ceil((new Date(invoice.dueAt).getTime() - Date.now()) / 86400000)
    return {
      id: invoice.id,
      reference: invoice.reference,
      patientName: invoice.patientName,
      amountMad: invoice.amountMad,
      paidMad: invoice.paidMad,
      outstanding,
      status: invoice.status,
      dueAt: invoice.dueAt,
      daysLeft,
      orderStatus: order?.status || 'Ordre inconnu',
      risk: outstanding > 0 && daysLeft < 0 ? 'Critique' : outstanding > 0 ? 'Élevé' : 'Faible',
      modal: 'PaymentModal' as InterventionModalKey,
    }
  })
  const missingInvoices = state.orders.filter(order => ['Terminée', 'Clôturée'].includes(order.status) && !state.invoices.some(inv => inv.orderId === order.id)).map(order => ({
    id: order.id,
    reference: order.reference,
    patientName: order.patientName,
    amountMad: order.amountMad,
    paidMad: 0,
    outstanding: order.amountMad,
    status: 'Non facturé',
    dueAt: order.slaDueAt,
    daysLeft: 0,
    orderStatus: order.status,
    risk: 'Critique',
    modal: 'QuoteBuilderModal' as InterventionModalKey,
  }))
  return [...missingInvoices, ...byInvoice].sort((a, b) => b.outstanding - a.outstanding).slice(0, 10)
}

export function buildPhase7MarginProtection(state: InterventionsState) {
  return state.routes.map(route => {
    const stopOrders = state.routeStops.filter(stop => stop.routeId === route.id).map(stop => state.orders.find(order => order.id === stop.orderId)).filter(Boolean) as InterventionOrder[]
    const revenue = stopOrders.reduce((sum, order) => sum + order.amountMad, 0)
    const staff = state.staff.find(s => s.id === route.staffId)
    const equipmentCount = stopOrders.reduce((sum, order) => sum + order.requiredEquipment.length, 0)
    const operationalLoad = stopOrders.length * 140 + equipmentCount * 75 + (staff?.role === 'Médecin' ? 220 : 120)
    const marginScore = revenue ? Math.round(Math.max(0, Math.min(100, ((revenue - operationalLoad) / revenue) * 100))) : 0
    return { id: route.id, name: route.name, city: route.city, zone: route.zone, revenue, stopCount: stopOrders.length, staffName: staff?.fullName || 'Non assigné', marginScore, status: marginScore >= 35 ? 'rentable' : marginScore >= 15 ? 'à surveiller' : 'à risque', modal: 'RouteBuilderModal' as InterventionModalKey }
  }).sort((a, b) => a.marginScore - b.marginScore)
}

export function buildPhase7RoleFinanceLocks(state: InterventionsState) {
  const financeStaff = state.staff.filter(staff => ['Coordinateur', 'Superviseur Médical', 'Chauffeur'].includes(staff.role) || staff.skills.some(skill => /facturation|paiement|reçu|caisse/i.test(skill)))
  return [
    { role: 'Finance', scope: 'devis, facture, paiement, remise, relance', lock: 'Mutation complète finance avec audit obligatoire', count: state.invoices.length, modal: 'PaymentModal' as InterventionModalKey },
    { role: 'Coordinateur Dispatch', scope: 'visualisation finance opérationnelle + encaissement terrain si autorisé', lock: 'Pas de remise sans approbation manager', count: financeStaff.length, modal: 'PermissionMatrixModal' as InterventionModalKey },
    { role: 'Staff terrain', scope: 'reçu terrain, statut paiement, aucun accès aux remises globales', lock: 'Assigné uniquement + preuve paiement', count: state.staff.filter(s => s.availability === 'Disponible').length, modal: 'StaffAvailabilityModal' as InterventionModalKey },
    { role: 'Audit / Lecture seule', scope: 'exports et historique sans mutation', lock: 'Aucune mutation, lecture filtrée', count: state.audits.filter(a => /payment|invoice|report|settings/i.test(a.event)).length, modal: 'ReportExportModal' as InterventionModalKey },
  ]
}
