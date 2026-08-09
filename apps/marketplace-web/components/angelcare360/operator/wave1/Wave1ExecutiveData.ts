import { getOperatorClient } from '@/lib/angelcare360/operator/shared'
import type {
  Angelcare360OperatorClientRecord,
  Angelcare360OperatorContractRecord,
  Angelcare360OperatorIncidentRecord,
  Angelcare360OperatorInvoiceRecord,
  Angelcare360OperatorOnboardingTaskRecord,
  Angelcare360OperatorPaymentRecord,
  Angelcare360OperatorRenewalRecord,
  Angelcare360OperatorServiceEventRecord,
  Angelcare360OperatorServiceRequestRecord,
  Angelcare360OperatorSubscriptionRecord,
  Angelcare360OperatorSupportTicketRecord,
  Angelcare360OperatorTaskRecord,
  Angelcare360OperatorTenantRecord,
  Angelcare360OperatorUsageLimitRecord,
} from '@/types/angelcare360/operator'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type {
  Wave1AccountabilityItem,
  Wave1AuditEvent,
  Wave1Customer,
  Wave1Decision,
  Wave1ExecutiveData,
  Wave1HealthFactor,
  Wave1HorizonItem,
  Wave1RevenueStage,
  Wave1ServicePressure,
  Wave1Signal,
  Wave1Tone,
  Wave1SourceState,
} from './Wave1ExecutiveTypes'

const base = '/angelcare-360-operator'
const openTicketStates = new Set(['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal'])
const openIncidentStates = new Set(['open', 'investigating', 'mitigated'])
const openTaskStates = new Set(['todo', 'in_progress', 'blocked'])
const openOnboardingStates = new Set(['todo', 'in_progress', 'blocked'])
const invoiceOpenStates = new Set(['issued', 'partially_paid', 'overdue'])

export async function loadWave1ExecutiveData(): Promise<Wave1ExecutiveData> {
  const sourceResults = await Promise.all([
    executiveList<Angelcare360OperatorClientRecord>('clients', 'angelcare360_operator_clients', 'updated_at', false, 500),
    executiveList<Angelcare360OperatorTenantRecord>('tenants', 'angelcare360_operator_tenants', 'updated_at', false, 500),
    executiveList<Angelcare360OperatorSubscriptionRecord>('subscriptions', 'angelcare360_operator_subscriptions', 'updated_at', false, 500),
    executiveList<Angelcare360OperatorInvoiceRecord>('invoices', 'angelcare360_operator_invoices', 'updated_at', false, 1000),
    executiveList<Angelcare360OperatorPaymentRecord>('payments', 'angelcare360_operator_payments', 'updated_at', false, 1000),
    executiveList<Angelcare360OperatorSupportTicketRecord>('tickets', 'angelcare360_operator_support_tickets', 'updated_at', false, 1000),
    executiveList<Angelcare360OperatorIncidentRecord>('incidents', 'angelcare360_operator_incidents', 'updated_at', false, 500),
    executiveList<Angelcare360OperatorRenewalRecord>('renewals', 'angelcare360_operator_renewals', 'renewal_date', true, 500),
    executiveList<Angelcare360OperatorOnboardingTaskRecord>('onboarding', 'angelcare360_operator_onboarding_tasks', 'updated_at', false, 1000),
    executiveList<Angelcare360OperatorTaskRecord>('tasks', 'angelcare360_operator_tasks', 'updated_at', false, 1000),
    executiveList<Angelcare360OperatorServiceRequestRecord>('serviceRequests', 'angelcare360_operator_service_requests', 'updated_at', false, 1000),
    executiveList<Angelcare360OperatorServiceEventRecord>('serviceEvents', 'angelcare360_operator_service_events', 'occurred_at', false, 200),
    executiveList<Angelcare360OperatorContractRecord>('contracts', 'angelcare360_operator_contracts', 'updated_at', false, 500),
    executiveList<Angelcare360OperatorUsageLimitRecord>('usage', 'angelcare360_operator_usage_limits', 'updated_at', false, 1000),
    executiveList<Angelcare360AuditRecord>('audit', 'angelcare360_operator_audit_logs', 'created_at', false, 150),
  ])
  const byKey = new Map(sourceResults.map((result) => [result.state.key, result.data]))
  const sourceStates = sourceResults.map((result) => result.state)
  const sourceFailures = sourceStates.filter((source) => !source.available)
  const clients = (byKey.get('clients') || []) as Angelcare360OperatorClientRecord[]
  const tenants = (byKey.get('tenants') || []) as Angelcare360OperatorTenantRecord[]
  const subscriptions = (byKey.get('subscriptions') || []) as Angelcare360OperatorSubscriptionRecord[]
  const invoices = (byKey.get('invoices') || []) as Angelcare360OperatorInvoiceRecord[]
  const payments = (byKey.get('payments') || []) as Angelcare360OperatorPaymentRecord[]
  const tickets = (byKey.get('tickets') || []) as Angelcare360OperatorSupportTicketRecord[]
  const incidents = (byKey.get('incidents') || []) as Angelcare360OperatorIncidentRecord[]
  const renewals = (byKey.get('renewals') || []) as Angelcare360OperatorRenewalRecord[]
  const onboarding = (byKey.get('onboarding') || []) as Angelcare360OperatorOnboardingTaskRecord[]
  const tasks = (byKey.get('tasks') || []) as Angelcare360OperatorTaskRecord[]
  const serviceRequests = (byKey.get('serviceRequests') || []) as Angelcare360OperatorServiceRequestRecord[]
  const serviceEvents = (byKey.get('serviceEvents') || []) as Angelcare360OperatorServiceEventRecord[]
  const contracts = (byKey.get('contracts') || []) as Angelcare360OperatorContractRecord[]
  const usage = (byKey.get('usage') || []) as Angelcare360OperatorUsageLimitRecord[]
  const audits = (byKey.get('audit') || []) as Angelcare360AuditRecord[]

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const clientNames = new Map(clients.map((client) => [client.id, client.display_name]))

  const activeSubscriptions = subscriptions.filter((item) => item.status === 'active')
  const openInvoices = invoices.filter((item) => invoiceOpenStates.has(String(item.status)))
  const overdueInvoices = invoices.filter((item) => item.status === 'overdue')
  const confirmedPayments = payments.filter((item) => item.status === 'confirmed')
  const openTickets = tickets.filter((item) => openTicketStates.has(String(item.status)))
  const urgentTickets = openTickets.filter((item) => item.priority === 'urgent')
  const openIncidents = incidents.filter((item) => openIncidentStates.has(String(item.status)))
  const blockedOnboarding = onboarding.filter((item) => item.status === 'blocked')
  const upcomingRenewals = renewals.filter((item) => ['upcoming', 'in_discussion', 'proposal_sent', 'at_risk'].includes(String(item.status)))

  const mrrDh = sum(activeSubscriptions.map((item) => item.billing_amount_mad))
  const invoicedPeriodDh = sum(invoices.filter((item) => inPeriod(item.issue_date, monthStart, monthEnd)).map((item) => item.total_mad))
  const collectedPeriodDh = sum(confirmedPayments.filter((item) => inPeriod(item.payment_date, monthStart, monthEnd)).map((item) => item.amount_mad))
  const outstandingDh = sum(openInvoices.map((item) => item.balance_due_mad))
  const overdueDh = sum(overdueInvoices.map((item) => item.balance_due_mad))
  const renewalRiskDh = sum(upcomingRenewals.filter((item) => item.status === 'at_risk' || Number(item.probability ?? 100) < 60).map((item) => item.expected_amount_mad))
  const expansionPotentialDh = sum(upcomingRenewals.filter((item) => Number(item.probability ?? 0) >= 70).map((item) => item.expected_amount_mad))

  const customerRows = clients.map((client) => buildCustomer({
    client,
    tenants,
    subscriptions,
    invoices,
    tickets,
    incidents,
    renewals,
    onboarding,
  })).sort((a, b) => riskWeight(b) - riskWeight(a) || b.balanceDh - a.balanceDh)

  const decisions = buildDecisions({ clients: clientNames, invoices, renewals, incidents, onboarding, tenants })
  const horizon = buildHorizon({ clients: clientNames, invoices, renewals, contracts, onboarding, tasks, usage })
  const accountability = buildAccountability({ clients: clientNames, tasks, onboarding, serviceRequests, decisions })
  const servicePressure = buildServicePressure({ clients: clientNames, tickets, incidents, onboarding, serviceRequests, subscriptions })
  const revenueStages = buildRevenueStages({ subscriptions, invoices, payments, renewals })
  const signals = buildSignals({
    clients,
    tenants,
    activeSubscriptions,
    mrrDh,
    outstandingDh,
    overdueDh,
    renewalRiskDh,
    criticalServiceCount: urgentTickets.length + openIncidents.filter((item) => item.severity === 'critical').length,
    decisions,
  })
  const auditEvents = buildAuditEvents(audits, serviceEvents)
  const criticalCustomers = customerRows.filter((item) => item.healthBand === 'critical')
  const concentration = topConcentration(customerRows)

  return {
    generatedAt: now.toISOString(),
    periodLabel: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    sourceHealth: {
      state: sourceFailures.length === 0 ? 'complete' : sourceFailures.length === sourceStates.length ? 'unavailable' : 'partial',
      availableSources: sourceStates.length - sourceFailures.length,
      totalSources: sourceStates.length,
      failures: sourceFailures,
      sources: sourceStates,
    },
    summary: {
      totalClients: clients.length,
      activeClients: clients.filter((item) => item.status === 'active').length,
      activeTenants: tenants.filter((item) => item.status === 'active').length,
      activeSubscriptions: activeSubscriptions.length,
      mrrDh,
      arrDh: mrrDh * 12,
      invoicedPeriodDh,
      collectedPeriodDh,
      outstandingDh,
      overdueDh,
      renewalRiskDh,
      expansionPotentialDh,
      criticalServiceCount: servicePressure.filter((item) => item.severity === 'critical').length,
      executiveDecisionCount: decisions.length,
    },
    signals,
    customers: customerRows,
    revenueStages,
    decisions,
    horizon,
    accountability,
    servicePressure,
    auditEvents,
    narrative: {
      headline: criticalCustomers.length
        ? `${criticalCustomers.length} relation(s) requièrent une intervention de direction.`
        : 'Le portefeuille ne présente aucun signal client critique selon les données actuellement disponibles.',
      body: buildNarrative({ overdueDh, renewalRiskDh, criticalCustomers, concentration, decisions, servicePressure }),
      evidence: [
        { label: 'Exposition financière', href: `${base}/executive/revenue` },
        { label: 'Risques clients', href: `${base}/executive/customers` },
        { label: 'Décisions requises', href: `${base}/executive/decisions` },
      ],
    },
  }
}

async function executiveList<T>(key: string, table: string, orderColumn: string, ascending: boolean, limit: number): Promise<{ data: T[]; state: Wave1SourceState }> {
  try {
    const supabase = await getOperatorClient()
    const { data, error } = await supabase.from(table).select('*').order(orderColumn, { ascending }).limit(limit)
    if (error) return { data: [], state: { key, table, available: false, count: 0, error: error.message || 'Erreur de lecture non détaillée' } }
    const rows = (data || []) as T[]
    return { data: rows, state: { key, table, available: true, count: rows.length } }
  } catch (error) {
    return { data: [], state: { key, table, available: false, count: 0, error: error instanceof Error ? error.message : 'Source indisponible' } }
  }
}

function buildCustomer(input: {
  client: Angelcare360OperatorClientRecord
  tenants: Angelcare360OperatorTenantRecord[]
  subscriptions: Angelcare360OperatorSubscriptionRecord[]
  invoices: Angelcare360OperatorInvoiceRecord[]
  tickets: Angelcare360OperatorSupportTicketRecord[]
  incidents: Angelcare360OperatorIncidentRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
  onboarding: Angelcare360OperatorOnboardingTaskRecord[]
}): Wave1Customer {
  const { client } = input
  const clientTenants = input.tenants.filter((item) => item.client_id === client.id)
  const clientSubscriptions = input.subscriptions.filter((item) => item.client_id === client.id && item.status === 'active')
  const clientInvoices = input.invoices.filter((item) => item.client_id === client.id && invoiceOpenStates.has(String(item.status)))
  const clientOverdue = clientInvoices.filter((item) => item.status === 'overdue')
  const clientTickets = input.tickets.filter((item) => item.client_id === client.id && openTicketStates.has(String(item.status)))
  const clientIncidents = input.incidents.filter((item) => item.client_id === client.id && openIncidentStates.has(String(item.status)))
  const clientRenewals = input.renewals.filter((item) => item.client_id === client.id && ['upcoming', 'in_discussion', 'proposal_sent', 'at_risk'].includes(String(item.status)))
  const nextRenewal = [...clientRenewals].sort((a, b) => +new Date(a.renewal_date) - +new Date(b.renewal_date))[0]
  const blockedActivation = input.onboarding.filter((item) => item.client_id === client.id && item.status === 'blocked').length
  const latestAccess = clientTenants.map((item) => item.last_access_at).filter(Boolean).sort().at(-1) || null

  const factors: Wave1HealthFactor[] = [
    factor('finance', 'Santé financière', clientOverdue.length ? 'critical' : clientInvoices.length ? 'watch' : 'healthy',
      clientOverdue.length ? `${clientOverdue.length} facture(s) en retard` : clientInvoices.length ? `${clientInvoices.length} encours ouvert(s)` : 'Aucun encours ouvert',
      clientOverdue.length ? 'Une facture en retard crée un risque de collection et peut déclencher une restriction selon la politique active.' : 'Lecture fondée sur les factures et soldes disponibles.',
      'Factures et soldes SaaS', `${base}/billing/balances`),
    factor('service', 'Pression service', clientIncidents.length || clientTickets.some((item) => item.priority === 'urgent') ? 'critical' : clientTickets.length ? 'watch' : 'healthy',
      clientIncidents.length ? `${clientIncidents.length} incident(s) actif(s)` : clientTickets.length ? `${clientTickets.length} ticket(s) ouvert(s)` : 'Aucun incident ou ticket ouvert',
      'Lecture fondée sur les incidents et tickets non clôturés du client.',
      'Support et incidents', `${base}/support`),
    factor('retention', 'Continuité commerciale', nextRenewal?.status === 'at_risk' || Number(nextRenewal?.probability ?? 100) < 60 ? 'critical' : nextRenewal ? 'watch' : 'unknown',
      nextRenewal ? `${nextRenewal.status} · ${dateLabel(nextRenewal.renewal_date)}` : 'Aucun renouvellement disponible',
      'La criticité dépend du statut et de la probabilité enregistrée sur le renouvellement.',
      'Renouvellements', `${base}/renewals`),
    factor('activation', 'Activation', blockedActivation ? 'critical' : clientTenants.some((item) => item.provisioning_status !== 'active') ? 'watch' : clientTenants.length ? 'healthy' : 'unknown',
      blockedActivation ? `${blockedActivation} blocage(s)` : clientTenants.length ? `${clientTenants.filter((item) => item.provisioning_status === 'active').length}/${clientTenants.length} tenant(s) actif(s)` : 'Aucun tenant',
      'Lecture fondée sur les tâches onboarding et les statuts de provisionnement.',
      'Onboarding et tenants', `${base}/onboarding`),
    factor('engagement', 'Activité tenant', latestAccess && daysUntil(latestAccess) >= -30 ? 'healthy' : latestAccess ? 'watch' : 'unknown',
      latestAccess ? `Dernier accès ${relativeDate(latestAccess)}` : 'Aucun dernier accès disponible',
      'Une absence d’activité récente peut signaler une baisse d’adoption mais nécessite une confirmation opérationnelle.',
      'Dernier accès tenant', `${base}/tenants`),
  ]

  const criticalCount = factors.filter((item) => item.state === 'critical').length
  const watchCount = factors.filter((item) => item.state === 'watch').length
  const healthBand = criticalCount || client.lifecycle_stage === 'at_risk' || client.risk_level === 'critical'
    ? 'critical'
    : watchCount || client.risk_level === 'high'
      ? 'watch'
      : factors.every((item) => item.state === 'unknown')
        ? 'unknown'
        : 'healthy'

  return {
    id: client.id,
    name: client.display_name,
    code: client.client_code,
    city: client.city || 'Ville non renseignée',
    status: String(client.status),
    lifecycle: String(client.lifecycle_stage),
    risk: client.risk_level || 'non qualifié',
    healthBand,
    healthLabel: healthBand === 'critical' ? 'Intervention requise' : healthBand === 'watch' ? 'Sous surveillance' : healthBand === 'healthy' ? 'Situation maîtrisée' : 'Données insuffisantes',
    mrrDh: sum(clientSubscriptions.map((item) => item.billing_amount_mad)),
    balanceDh: sum(clientInvoices.map((item) => item.balance_due_mad)),
    overdueInvoices: clientOverdue.length,
    openTickets: clientTickets.length,
    urgentTickets: clientTickets.filter((item) => item.priority === 'urgent').length,
    openIncidents: clientIncidents.length,
    blockedActivation,
    tenantCount: clientTenants.length,
    renewalDate: nextRenewal?.renewal_date || null,
    renewalProbability: nextRenewal?.probability ?? null,
    renewalValueDh: numberValue(nextRenewal?.expected_amount_mad),
    lastAccessAt: latestAccess,
    owner: client.account_manager_id || client.commercial_owner_id || 'Non attribué',
    factors,
    href: `${base}/clients/${client.id}`,
  }
}

function buildRevenueStages(input: {
  subscriptions: Angelcare360OperatorSubscriptionRecord[]
  invoices: Angelcare360OperatorInvoiceRecord[]
  payments: Angelcare360OperatorPaymentRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
}): Wave1RevenueStage[] {
  const active = input.subscriptions.filter((item) => item.status === 'active')
  const issued = input.invoices.filter((item) => ['issued', 'partially_paid', 'paid', 'overdue'].includes(String(item.status)))
  const paid = input.payments.filter((item) => item.status === 'confirmed')
  const open = input.invoices.filter((item) => invoiceOpenStates.has(String(item.status)))
  const overdue = input.invoices.filter((item) => item.status === 'overdue')
  const risk = input.renewals.filter((item) => item.status === 'at_risk' || Number(item.probability ?? 100) < 60)
  return [
    stage('contracted', 'Abonné actif', sum(active.map((item) => item.billing_amount_mad)) * 12, active.length, 'info', 'Valeur annualisée indicative des abonnements actifs.', `${base}/subscriptions`),
    stage('invoiced', 'Facturé', sum(issued.map((item) => item.total_mad)), issued.length, 'neutral', 'Valeur totale des factures émises disponibles.', `${base}/billing/invoices`),
    stage('collected', 'Encaissé confirmé', sum(paid.map((item) => item.amount_mad)), paid.length, 'success', 'Paiements confirmés dans le registre actuel.', `${base}/billing/payments`),
    stage('outstanding', 'Encours', sum(open.map((item) => item.balance_due_mad)), open.length, 'warning', 'Solde restant des factures non soldées.', `${base}/billing/balances`),
    stage('overdue', 'En retard', sum(overdue.map((item) => item.balance_due_mad)), overdue.length, 'critical', 'Exposition des factures au statut en retard.', `${base}/billing/dunning`),
    stage('at-risk', 'Renouvellement exposé', sum(risk.map((item) => item.expected_amount_mad)), risk.length, 'critical', 'Valeur attendue sur les renouvellements à risque.', `${base}/renewals`),
  ]
}

function buildDecisions(input: {
  clients: Map<string, string>
  invoices: Angelcare360OperatorInvoiceRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
  incidents: Angelcare360OperatorIncidentRecord[]
  onboarding: Angelcare360OperatorOnboardingTaskRecord[]
  tenants: Angelcare360OperatorTenantRecord[]
}): Wave1Decision[] {
  const decisions: Wave1Decision[] = []
  input.invoices.filter((item) => item.status === 'overdue').slice(0, 12).forEach((invoice) => {
    decisions.push({
      id: `invoice-${invoice.id}`,
      kind: 'finance',
      title: 'Déterminer le niveau d’intervention sur un impayé',
      entityLabel: invoice.invoice_number,
      customerId: invoice.client_id,
      customerName: nameFor(input.clients, invoice.client_id),
      situation: `${money(invoice.balance_due_mad)} reste dû depuis l’échéance du ${dateLabel(invoice.due_date)}.`,
      recommendation: 'Ouvrir le dossier de recouvrement, vérifier les engagements et décider du prochain niveau d’intervention.',
      alternative: 'Maintenir le service pendant une période de grâce documentée si la relation et la preuve de paiement le justifient.',
      financialImpactDh: numberValue(invoice.balance_due_mad),
      operationalImpact: 'Une restriction peut affecter les utilisateurs du tenant associé; l’impact exact doit être vérifié dans le dossier.',
      riskOfNoAction: 'Allongement de l’ancienneté, dégradation de la probabilité de recouvrement et incohérence de gouvernance.',
      authority: 'Direction financière / direction générale selon le niveau de restriction',
      deadline: invoice.due_date,
      owner: 'Finance Operator',
      evidence: [
        { label: 'Facture', value: invoice.invoice_number, href: `${base}/billing/invoices` },
        { label: 'Solde', value: money(invoice.balance_due_mad), href: `${base}/billing/balances` },
        { label: 'Client', value: nameFor(input.clients, invoice.client_id), href: `${base}/clients/${invoice.client_id}` },
      ],
      executionHref: `${base}/billing/dunning`,
      tone: 'critical',
    })
  })
  input.renewals.filter((item) => item.status === 'at_risk' || Number(item.probability ?? 100) < 60).slice(0, 10).forEach((renewal) => {
    decisions.push({
      id: `renewal-${renewal.id}`,
      kind: 'retention',
      title: 'Autoriser une stratégie de sécurisation du renouvellement',
      entityLabel: `Renouvellement ${dateLabel(renewal.renewal_date)}`,
      customerId: renewal.client_id,
      customerName: nameFor(input.clients, renewal.client_id),
      situation: `Probabilité enregistrée ${renewal.probability ?? 'non renseignée'}% pour une valeur attendue de ${money(renewal.expected_amount_mad)}.`,
      recommendation: 'Nommer un sponsor, confirmer les causes du risque et valider une stratégie de renouvellement documentée.',
      alternative: 'Préparer une proposition adaptée sans concession non approuvée.',
      financialImpactDh: numberValue(renewal.expected_amount_mad),
      operationalImpact: 'La décision coordonne commercial, support et opérations autour d’un plan unique.',
      riskOfNoAction: 'Perte de revenu récurrent et dégradation de la relation avant l’échéance.',
      authority: 'Direction commerciale / direction générale',
      deadline: renewal.renewal_date,
      owner: renewal.owner_id || 'Non attribué',
      evidence: [
        { label: 'Renouvellement', value: String(renewal.status), href: `${base}/renewals` },
        { label: 'Probabilité', value: renewal.probability === null || renewal.probability === undefined ? 'Non renseignée' : `${renewal.probability}%`, href: `${base}/renewals` },
        { label: 'Client', value: nameFor(input.clients, renewal.client_id), href: `${base}/clients/${renewal.client_id}` },
      ],
      executionHref: `${base}/renewals`,
      tone: 'warning',
    })
  })
  input.incidents.filter((item) => openIncidentStates.has(String(item.status)) && ['critical', 'warning'].includes(String(item.severity))).slice(0, 10).forEach((incident) => {
    decisions.push({
      id: `incident-${incident.id}`,
      kind: 'service',
      title: 'Confirmer le commandement et le plan de stabilisation',
      entityLabel: incident.title,
      customerId: incident.client_id || null,
      customerName: nameFor(input.clients, incident.client_id),
      situation: `${incident.description} · actif depuis ${relativeDate(incident.started_at)}.`,
      recommendation: 'Désigner le commandant, confirmer le confinement et imposer une prochaine mise à jour horodatée.',
      alternative: 'Maintenir la surveillance uniquement si l’impact est confirmé comme contenu.',
      financialImpactDh: 0,
      operationalImpact: 'Le service du client ou du tenant peut être affecté; ouvrir la salle d’incident pour la portée exacte.',
      riskOfNoAction: 'Prolongation de l’impact client, dépassement SLA et dégradation de la confiance.',
      authority: 'Direction des opérations',
      deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      owner: 'Incident Commander à désigner',
      evidence: [
        { label: 'Sévérité', value: String(incident.severity), href: `${base}/incidents` },
        { label: 'Statut', value: String(incident.status), href: `${base}/incidents` },
        { label: 'Client', value: nameFor(input.clients, incident.client_id), href: incident.client_id ? `${base}/clients/${incident.client_id}` : `${base}/incidents` },
      ],
      executionHref: `${base}/incidents`,
      tone: incident.severity === 'critical' ? 'critical' : 'warning',
    })
  })
  input.onboarding.filter((item) => item.status === 'blocked' && ['urgent', 'high'].includes(String(item.priority))).slice(0, 8).forEach((task) => {
    decisions.push({
      id: `activation-${task.id}`,
      kind: 'activation',
      title: 'Arbitrer un blocage de mise en service',
      entityLabel: task.title,
      customerId: task.client_id,
      customerName: nameFor(input.clients, task.client_id),
      situation: task.description || 'Une étape prioritaire d’onboarding est bloquée.',
      recommendation: 'Identifier la dépendance, attribuer un sponsor et décider d’un plan de levée avec preuve.',
      alternative: 'Replanifier la date de lancement avec communication client formelle.',
      financialImpactDh: 0,
      operationalImpact: 'Le go-live et la capacité de facturation peuvent être retardés.',
      riskOfNoAction: 'Retard de mise en service, perte de confiance et consommation non maîtrisée des ressources d’implémentation.',
      authority: 'Direction implémentation / opérations',
      deadline: task.due_date || null,
      owner: task.owner_id || 'Non attribué',
      evidence: [
        { label: 'Priorité', value: String(task.priority), href: `${base}/onboarding` },
        { label: 'Statut', value: String(task.status), href: `${base}/onboarding` },
        { label: 'Client', value: nameFor(input.clients, task.client_id), href: `${base}/clients/${task.client_id}` },
      ],
      executionHref: `${base}/onboarding`,
      tone: 'warning',
    })
  })
  input.tenants.filter((item) => item.status === 'suspended' || item.provisioning_status === 'failed').slice(0, 8).forEach((tenant) => {
    decisions.push({
      id: `tenant-${tenant.id}`,
      kind: 'governance',
      title: tenant.status === 'suspended' ? 'Revoir le maintien de la suspension tenant' : 'Arbitrer un échec de provisionnement',
      entityLabel: tenant.tenant_slug,
      customerId: tenant.client_id,
      customerName: nameFor(input.clients, tenant.client_id),
      situation: `Tenant ${tenant.status} · provisionnement ${tenant.provisioning_status}.`,
      recommendation: 'Vérifier le motif, l’impact utilisateur et la condition de restauration avant toute intervention.',
      alternative: 'Maintenir l’état actuel avec une échéance de revue et un propriétaire explicites.',
      financialImpactDh: 0,
      operationalImpact: 'L’accès client peut être limité ou indisponible.',
      riskOfNoAction: 'Absence de gouvernance sur un état critique et prolongation de l’impact client.',
      authority: 'Operator Admin / direction générale selon le motif',
      deadline: null,
      owner: 'Operator Admin',
      evidence: [
        { label: 'Tenant', value: tenant.tenant_slug, href: `${base}/tenants` },
        { label: 'Statut', value: String(tenant.status), href: `${base}/tenants` },
        { label: 'Provisionnement', value: String(tenant.provisioning_status), href: `${base}/implementation` },
      ],
      executionHref: `${base}/tenants`,
      tone: 'critical',
    })
  })
  return decisions.sort((a, b) => toneWeight(b.tone) - toneWeight(a.tone) || b.financialImpactDh - a.financialImpactDh)
}

function buildHorizon(input: {
  clients: Map<string, string>
  invoices: Angelcare360OperatorInvoiceRecord[]
  renewals: Angelcare360OperatorRenewalRecord[]
  contracts: Angelcare360OperatorContractRecord[]
  onboarding: Angelcare360OperatorOnboardingTaskRecord[]
  tasks: Angelcare360OperatorTaskRecord[]
  usage: Angelcare360OperatorUsageLimitRecord[]
}): Wave1HorizonItem[] {
  const items: Wave1HorizonItem[] = []
  input.renewals.filter((item) => ['upcoming', 'in_discussion', 'proposal_sent', 'at_risk'].includes(String(item.status))).forEach((item) => items.push({
    id: `renewal-${item.id}`, category: 'renewal', title: `Renouvellement · ${item.status}`, customerName: nameFor(input.clients, item.client_id), date: item.renewal_date,
    daysRemaining: daysUntil(item.renewal_date), valueDh: numberValue(item.expected_amount_mad), risk: item.status === 'at_risk' || Number(item.probability ?? 100) < 60 ? 'critical' : daysUntil(item.renewal_date) <= 30 ? 'warning' : 'info',
    owner: item.owner_id || 'Non attribué', readiness: item.probability === null || item.probability === undefined ? 'Probabilité non renseignée' : `${item.probability}% de probabilité`, href: `${base}/renewals`,
  }))
  input.invoices.filter((item) => invoiceOpenStates.has(String(item.status))).forEach((item) => items.push({
    id: `invoice-${item.id}`, category: 'billing', title: `Échéance ${item.invoice_number}`, customerName: nameFor(input.clients, item.client_id), date: item.due_date,
    daysRemaining: daysUntil(item.due_date), valueDh: numberValue(item.balance_due_mad), risk: item.status === 'overdue' || daysUntil(item.due_date) < 0 ? 'critical' : daysUntil(item.due_date) <= 7 ? 'warning' : 'info',
    owner: 'Finance Operator', readiness: item.status === 'overdue' ? 'Intervention requise' : 'Suivi d’échéance', href: `${base}/billing/invoices`,
  }))
  input.contracts.filter((item) => item.end_date && ['signed', 'active'].includes(String(item.status))).forEach((item) => items.push({
    id: `contract-${item.id}`, category: 'contract', title: `Fin de contrat ${item.contract_code}`, customerName: nameFor(input.clients, item.client_id), date: item.end_date as string,
    daysRemaining: daysUntil(item.end_date as string), valueDh: 0, risk: daysUntil(item.end_date as string) <= 30 ? 'warning' : 'info', owner: 'Direction commerciale', readiness: String(item.status), href: `${base}/contracts`,
  }))
  input.onboarding.filter((item) => openOnboardingStates.has(String(item.status)) && item.due_date).forEach((item) => items.push({
    id: `activation-${item.id}`, category: 'activation', title: item.title, customerName: nameFor(input.clients, item.client_id), date: item.due_date as string,
    daysRemaining: daysUntil(item.due_date as string), valueDh: 0, risk: item.status === 'blocked' || daysUntil(item.due_date as string) < 0 ? 'critical' : item.priority === 'urgent' ? 'warning' : 'info', owner: item.owner_id || 'Non attribué', readiness: String(item.status), href: `${base}/onboarding`,
  }))
  input.tasks.filter((item) => openTaskStates.has(String(item.status)) && item.due_date).forEach((item) => items.push({
    id: `task-${item.id}`, category: 'commitment', title: item.title, customerName: nameFor(input.clients, item.client_id), date: item.due_date as string,
    daysRemaining: daysUntil(item.due_date as string), valueDh: 0, risk: item.status === 'blocked' || daysUntil(item.due_date as string) < 0 ? 'critical' : item.priority === 'urgent' ? 'warning' : 'info', owner: item.owner_id || 'Non attribué', readiness: String(item.status), href: `${base}/tasks`,
  }))
  input.usage.filter((item) => item.allowed_value && item.allowed_value > 0 && item.current_value / item.allowed_value >= .8).forEach((item) => {
    const ratio = item.current_value / Number(item.allowed_value)
    items.push({
      id: `capacity-${item.id}`, category: 'capacity', title: `${item.label} · ${Math.round(ratio * 100)}%`, customerName: nameFor(input.clients, item.client_id), date: new Date(Date.now() + (ratio >= .95 ? 7 : 30) * 86400000).toISOString(),
      daysRemaining: ratio >= .95 ? 7 : 30, valueDh: 0, risk: ratio >= .95 ? 'critical' : 'warning', owner: 'Account Manager', readiness: `${item.current_value}/${item.allowed_value} ${item.unit}`, href: `${base}/usage-limits`,
    })
  })
  return items.filter((item) => item.daysRemaining <= 180).sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 120)
}

function buildAccountability(input: {
  clients: Map<string, string>
  tasks: Angelcare360OperatorTaskRecord[]
  onboarding: Angelcare360OperatorOnboardingTaskRecord[]
  serviceRequests: Angelcare360OperatorServiceRequestRecord[]
  decisions: Wave1Decision[]
}): Wave1AccountabilityItem[] {
  const taskItems: Wave1AccountabilityItem[] = input.tasks.filter((item) => openTaskStates.has(String(item.status))).map((item) => ({
    id: `task-${item.id}`, title: item.title, customerName: nameFor(input.clients, item.client_id), objectType: 'commitment', owner: item.owner_id || 'Non attribué', sponsor: 'À confirmer', dueDate: item.due_date || null,
    state: String(item.status), progress: item.status === 'in_progress' ? 55 : item.status === 'blocked' ? 25 : 10, priority: String(item.priority), evidenceState: item.description ? 'present' : 'missing',
    impact: item.priority === 'urgent' ? 'Engagement prioritaire' : 'Engagement opérationnel', href: `${base}/tasks`,
  }))
  const activationItems: Wave1AccountabilityItem[] = input.onboarding.filter((item) => openOnboardingStates.has(String(item.status))).map((item) => ({
    id: `activation-${item.id}`, title: item.title, customerName: nameFor(input.clients, item.client_id), objectType: 'activation', owner: item.owner_id || 'Non attribué', sponsor: 'Implementation Manager', dueDate: item.due_date || null,
    state: String(item.status), progress: item.status === 'in_progress' ? 60 : item.status === 'blocked' ? 20 : 5, priority: String(item.priority), evidenceState: item.description ? 'present' : 'missing',
    impact: item.status === 'blocked' ? 'Bloque la mise en service' : 'Préparation client', href: `${base}/onboarding`,
  }))
  const requestItems: Wave1AccountabilityItem[] = input.serviceRequests.filter((item) => openTicketStates.has(String(item.status))).map((item) => ({
    id: `request-${item.id}`, title: item.title, customerName: nameFor(input.clients, item.client_id), objectType: 'service', owner: item.assigned_to || 'Non attribué', sponsor: 'Service Manager', dueDate: item.due_date || null,
    state: String(item.status), progress: item.status === 'assigned' ? 45 : item.status === 'waiting_client' ? 65 : 15, priority: String(item.priority), evidenceState: item.description ? 'present' : 'missing',
    impact: 'Demande client en cours', href: `${base}/service-requests`,
  }))
  const decisionItems: Wave1AccountabilityItem[] = input.decisions.map((item) => ({
    id: `decision-${item.id}`, title: item.title, customerName: item.customerName, objectType: 'decision', owner: item.owner, sponsor: item.authority, dueDate: item.deadline || null,
    state: 'ready_for_review', progress: 35, priority: item.tone === 'critical' ? 'urgent' : 'high', evidenceState: item.evidence.length ? 'present' : 'missing',
    impact: item.financialImpactDh ? `${money(item.financialImpactDh)} exposés` : item.operationalImpact, href: `${base}/executive/decisions`,
  }))
  return [...decisionItems, ...taskItems, ...activationItems, ...requestItems]
    .sort((a, b) => accountabilityWeight(b) - accountabilityWeight(a))
    .slice(0, 160)
}

function buildServicePressure(input: {
  clients: Map<string, string>
  tickets: Angelcare360OperatorSupportTicketRecord[]
  incidents: Angelcare360OperatorIncidentRecord[]
  onboarding: Angelcare360OperatorOnboardingTaskRecord[]
  serviceRequests: Angelcare360OperatorServiceRequestRecord[]
  subscriptions: Angelcare360OperatorSubscriptionRecord[]
}): Wave1ServicePressure[] {
  const mrrByClient = new Map<string, number>()
  input.subscriptions.filter((item) => item.status === 'active').forEach((item) => mrrByClient.set(item.client_id, (mrrByClient.get(item.client_id) || 0) + numberValue(item.billing_amount_mad)))
  const tickets: Wave1ServicePressure[] = input.tickets.filter((item) => openTicketStates.has(String(item.status))).map((item) => ({
    id: `ticket-${item.id}`, type: 'ticket', title: item.subject, customerName: nameFor(input.clients, item.client_id), severity: item.priority === 'urgent' ? 'critical' : item.priority === 'high' ? 'warning' : 'info',
    durationLabel: relativeDate(item.created_at), owner: item.assigned_to || 'Non attribué', impact: `${item.category} · ${item.status}`, financialExposureDh: (mrrByClient.get(item.client_id) || 0) * 12, href: `${base}/support`,
  }))
  const incidents: Wave1ServicePressure[] = input.incidents.filter((item) => openIncidentStates.has(String(item.status))).map((item) => ({
    id: `incident-${item.id}`, type: 'incident', title: item.title, customerName: nameFor(input.clients, item.client_id), severity: item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'info',
    durationLabel: relativeDate(item.started_at), owner: 'Incident Commander', impact: item.description, financialExposureDh: item.client_id ? (mrrByClient.get(item.client_id) || 0) * 12 : 0, href: `${base}/incidents`,
  }))
  const activation: Wave1ServicePressure[] = input.onboarding.filter((item) => item.status === 'blocked').map((item) => ({
    id: `activation-${item.id}`, type: 'activation', title: item.title, customerName: nameFor(input.clients, item.client_id), severity: item.priority === 'urgent' ? 'critical' : 'warning',
    durationLabel: relativeDate(item.updated_at), owner: item.owner_id || 'Non attribué', impact: 'Mise en service bloquée', financialExposureDh: (mrrByClient.get(item.client_id) || 0) * 12, href: `${base}/onboarding`,
  }))
  const requests: Wave1ServicePressure[] = input.serviceRequests.filter((item) => openTicketStates.has(String(item.status)) && ['urgent', 'high'].includes(String(item.priority))).map((item) => ({
    id: `request-${item.id}`, type: 'request', title: item.title, customerName: nameFor(input.clients, item.client_id), severity: item.priority === 'urgent' ? 'critical' : 'warning',
    durationLabel: relativeDate(item.created_at), owner: item.assigned_to || 'Non attribué', impact: `${item.request_type} · ${item.status}`, financialExposureDh: (mrrByClient.get(item.client_id) || 0) * 12, href: `${base}/service-requests`,
  }))
  return [...incidents, ...tickets, ...activation, ...requests].sort((a, b) => toneWeight(b.severity) - toneWeight(a.severity) || b.financialExposureDh - a.financialExposureDh)
}

function buildSignals(input: {
  clients: Angelcare360OperatorClientRecord[]
  tenants: Angelcare360OperatorTenantRecord[]
  activeSubscriptions: Angelcare360OperatorSubscriptionRecord[]
  mrrDh: number
  outstandingDh: number
  overdueDh: number
  renewalRiskDh: number
  criticalServiceCount: number
  decisions: Wave1Decision[]
}): Wave1Signal[] {
  return [
    signal('clients', 'Clients sous pilotage', String(input.clients.length), `${input.clients.filter((item) => item.status === 'active').length} actifs`, 'info', `${base}/executive/customers`),
    signal('tenants', 'Tenants actifs', String(input.tenants.filter((item) => item.status === 'active').length), `${input.tenants.filter((item) => item.status === 'suspended').length} suspendus`, input.tenants.some((item) => item.status === 'suspended') ? 'warning' : 'success', `${base}/tenants`),
    signal('mrr', 'MRR estimé', money(input.mrrDh), `${input.activeSubscriptions.length} abonnement(s) actif(s)`, 'success', `${base}/executive/revenue`),
    signal('outstanding', 'Encours SaaS', money(input.outstandingDh), `${money(input.overdueDh)} en retard`, input.overdueDh > 0 ? 'critical' : input.outstandingDh > 0 ? 'warning' : 'success', `${base}/executive/revenue`),
    signal('renewal', 'Revenu renouvellement exposé', money(input.renewalRiskDh), 'Calculé sur les renouvellements à risque', input.renewalRiskDh > 0 ? 'warning' : 'success', `${base}/renewals`),
    signal('service', 'Pression service critique', String(input.criticalServiceCount), 'Tickets urgents et incidents critiques ouverts', input.criticalServiceCount ? 'critical' : 'success', `${base}/executive/service`),
    signal('decisions', 'Décisions de direction', String(input.decisions.length), 'Dossiers présentant une condition de décision', input.decisions.length ? 'warning' : 'success', `${base}/executive/decisions`),
  ]
}

function buildAuditEvents(audits: Angelcare360AuditRecord[], events: Angelcare360OperatorServiceEventRecord[]): Wave1AuditEvent[] {
  const auditEvents = audits.slice(0, 40).map((item) => ({
    id: `audit-${item.id}`,
    title: `${item.module} · ${item.action}`,
    detail: `${item.actor_role || 'Rôle non renseigné'} · ${item.entity_type || 'Entité non renseignée'}`,
    timestamp: item.created_at,
    tone: item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : item.severity === 'notice' ? 'success' : 'info' as Wave1Tone,
    href: `${base}/audit`,
  }))
  const service = events.slice(0, 30).map((item) => ({
    id: `service-${item.id}`,
    title: `${item.event_type} · ${item.title}`,
    detail: item.description || String(item.status),
    timestamp: item.occurred_at,
    tone: item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'info' as Wave1Tone,
    href: `${base}/service-operations`,
  }))
  return [...auditEvents, ...service].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)).slice(0, 50)
}

function buildNarrative(input: {
  overdueDh: number
  renewalRiskDh: number
  criticalCustomers: Wave1Customer[]
  concentration: number
  decisions: Wave1Decision[]
  servicePressure: Wave1ServicePressure[]
}) {
  const parts: string[] = []
  if (input.overdueDh > 0) parts.push(`${money(input.overdueDh)} d’encours est actuellement au statut en retard.`)
  if (input.renewalRiskDh > 0) parts.push(`${money(input.renewalRiskDh)} de valeur de renouvellement est exposée selon les probabilités et statuts enregistrés.`)
  if (input.criticalCustomers.length) parts.push(`${input.criticalCustomers.length} client(s) cumulent au moins un facteur critique explicable.`)
  if (input.concentration > 0) parts.push(`Les trois premiers clients représentent ${Math.round(input.concentration * 100)}% du MRR observé, ce qui mérite une surveillance de concentration.`)
  if (input.servicePressure.some((item) => item.severity === 'critical')) parts.push(`${input.servicePressure.filter((item) => item.severity === 'critical').length} pression(s) de service critique(s) restent ouvertes.`)
  if (input.decisions.length) parts.push(`${input.decisions.length} dossier(s) répondent actuellement aux règles déterministes de la file de décision.`)
  return parts.length ? parts.join(' ') : 'Les données disponibles ne déclenchent aucune alerte exécutive déterministe. La direction doit néanmoins confirmer la fraîcheur et la complétude des sources.'
}

function factor(key: string, label: string, state: Wave1HealthFactor['state'], value: string, explanation: string, source: string, href: string): Wave1HealthFactor {
  return { key, label, state, value, explanation, source, href }
}
function stage(key: string, label: string, valueDh: number, count: number, tone: Wave1Tone, description: string, href: string): Wave1RevenueStage {
  return { key, label, valueDh, count, tone, description, href }
}
function signal(id: string, label: string, value: string, detail: string, tone: Wave1Tone, href: string): Wave1Signal {
  return { id, label, value, detail, tone, href, evidenceLabel: 'Ouvrir la preuve' }
}
function sum(values: Array<unknown>): number { return values.reduce<number>((total, value) => total + numberValue(value), 0) }
function numberValue(value: unknown) { const number = Number(value ?? 0); return Number.isFinite(number) ? number : 0 }
function money(value: unknown) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(numberValue(value))} Dh` }
function dateLabel(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'date invalide' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
function inPeriod(value: string, start: Date, end: Date) { const date = new Date(value); return !Number.isNaN(date.getTime()) && date >= start && date < end }
function daysUntil(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) return 9999; return Math.ceil((date.getTime() - Date.now()) / 86400000) }
function relativeDate(value: string) { const days = daysUntil(value); if (days === 0) return 'aujourd’hui'; if (days > 0) return `dans ${days} j`; return `depuis ${Math.abs(days)} j` }
function nameFor(map: Map<string, string>, id?: string | null) { return id ? map.get(id) || 'Client non résolu' : 'Portée réseau' }
function toneWeight(tone: Wave1Tone) { return tone === 'critical' ? 4 : tone === 'warning' ? 3 : tone === 'info' ? 2 : tone === 'success' ? 1 : 0 }
function riskWeight(customer: Wave1Customer) { return customer.healthBand === 'critical' ? 100 : customer.healthBand === 'watch' ? 50 : customer.healthBand === 'healthy' ? 10 : 0 }
function accountabilityWeight(item: Wave1AccountabilityItem) { return (item.owner === 'Non attribué' ? 50 : 0) + (item.state === 'blocked' ? 40 : 0) + (item.dueDate && daysUntil(item.dueDate) < 0 ? 35 : 0) + (item.priority === 'urgent' ? 25 : item.priority === 'high' ? 15 : 0) + (item.evidenceState === 'missing' ? 10 : 0) }
function topConcentration(customers: Wave1Customer[]) { const total = sum(customers.map((item) => item.mrrDh)); if (!total) return 0; return sum([...customers].sort((a, b) => b.mrrDh - a.mrrDh).slice(0, 3).map((item) => item.mrrDh)) / total }
