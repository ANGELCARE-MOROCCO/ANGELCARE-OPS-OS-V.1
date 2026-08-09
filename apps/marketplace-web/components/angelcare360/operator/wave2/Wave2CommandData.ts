import { getOperatorClientById, listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { listOperatorTenants } from '@/lib/angelcare360/operator/tenants'
import { listOperatorSubscriptions } from '@/lib/angelcare360/operator/subscriptions'
import { listOperatorBillingAccounts, listOperatorInvoices, listOperatorPayments } from '@/lib/angelcare360/operator/billing'
import { listOperatorPlans } from '@/lib/angelcare360/operator/plans'
import { listOperatorFeatureFlags, listOperatorUsageLimits } from '@/lib/angelcare360/operator/features'
import { listOperatorRenewals } from '@/lib/angelcare360/operator/renewals'
import { listOperatorContracts } from '@/lib/angelcare360/operator/contracts'
import { listOperatorSupportTickets } from '@/lib/angelcare360/operator/support'
import { listOperatorIncidents, listOperatorNotes, listOperatorServiceEvents, listOperatorTasks } from '@/lib/angelcare360/operator/service'
import type {
  Angelcare360OperatorBillingAccountRecord,
  Angelcare360OperatorClientRecord,
  Angelcare360OperatorContractRecord,
  Angelcare360OperatorFeatureFlagRecord,
  Angelcare360OperatorIncidentRecord,
  Angelcare360OperatorInvoiceRecord,
  Angelcare360OperatorNoteRecord,
  Angelcare360OperatorPaymentRecord,
  Angelcare360OperatorPlanRecord,
  Angelcare360OperatorRenewalRecord,
  Angelcare360OperatorServiceEventRecord,
  Angelcare360OperatorSubscriptionRecord,
  Angelcare360OperatorSupportTicketRecord,
  Angelcare360OperatorTaskRecord,
  Angelcare360OperatorTenantRecord,
  Angelcare360OperatorUsageLimitRecord,
} from '@/types/angelcare360/operator'
import type {
  Wave2Action,
  Wave2BillingCommand,
  Wave2CommandBase,
  Wave2CustomerCommand,
  Wave2DataSource,
  Wave2Decision,
  Wave2Evidence,
  Wave2Factor,
  Wave2IncidentCommand,
  Wave2RelationshipNode,
  Wave2RenewalCommand,
  Wave2RenewalScenario,
  Wave2RibbonItem,
  Wave2Simulation,
  Wave2SourceState,
  Wave2SubscriptionCommand,
  Wave2TenantCommand,
  Wave2TimelineEvent,
  Wave2Tone,
} from './Wave2CommandTypes'

const base = '/angelcare-360-operator'
const openTicketStates = new Set(['new', 'triage', 'assigned', 'waiting_client', 'waiting_internal'])
const openIncidentStates = new Set(['open', 'investigating', 'mitigated'])
const openInvoiceStates = new Set(['issued', 'partially_paid', 'overdue'])

export async function loadWave2CustomerCommand(id: string): Promise<Wave2CustomerCommand | null> {
  const [source, ticketSource, incidentSource, taskSource, noteSource, eventSource] = await Promise.all([
    safeSource('customer', 'Dossier client', () => getOperatorClientById(id)),
    safeSource('tickets', 'Tickets support', listOperatorSupportTickets),
    safeSource('incidents', 'Incidents', listOperatorIncidents),
    safeSource('tasks', 'Tâches opérateur', listOperatorTasks),
    safeSource('notes', 'Notes opérateur', listOperatorNotes),
    safeSource('events', 'Événements service', () => listOperatorServiceEvents({ clientId: id })),
  ])
  const client = source.data as (Angelcare360OperatorClientRecord & Record<string, any>) | null
  if (!client) return null
  const tenants = asArray<Angelcare360OperatorTenantRecord>(client.tenants)
  const subscriptions = asArray<Angelcare360OperatorSubscriptionRecord>(client.subscriptions)
  const billingAccounts = asArray<Angelcare360OperatorBillingAccountRecord>(client.billingAccounts)
  const invoices = asArray<Angelcare360OperatorInvoiceRecord>(client.invoices)
  const payments = asArray<Angelcare360OperatorPaymentRecord>(client.payments)
  const contracts = asArray<Angelcare360OperatorContractRecord>(client.contracts)
  const renewals = asArray<Angelcare360OperatorRenewalRecord>(client.renewals)
  const tickets = asArray<Angelcare360OperatorSupportTicketRecord>(ticketSource.data).filter((item) => item.client_id === id)
  const incidents = asArray<Angelcare360OperatorIncidentRecord>(incidentSource.data).filter((item) => item.client_id === id)
  const tasks = asArray<Angelcare360OperatorTaskRecord>(taskSource.data).filter((item) => item.client_id === id)
  const notes = asArray<Angelcare360OperatorNoteRecord>(noteSource.data).filter((item) => item.client_id === id)
  const serviceEvents = asArray<Angelcare360OperatorServiceEventRecord>(eventSource.data).filter((item) => item.client_id === id)
  const overdue = invoices.filter((item) => item.status === 'overdue')
  const openTickets = tickets.filter((item) => openTicketStates.has(String(item.status)))
  const openIncidents = incidents.filter((item) => openIncidentStates.has(String(item.status)))
  const activeSubscriptions = subscriptions.filter((item) => item.status === 'active')
  const balanceDh = sum(invoices.filter((item) => openInvoiceStates.has(String(item.status))).map((item) => item.balance_due_mad))
  const overdueDh = sum(overdue.map((item) => item.balance_due_mad))
  const mrrDh = sum(activeSubscriptions.map((item) => item.billing_amount_mad))
  const renewal = renewals.slice().sort((a, b) => time(a.renewal_date) - time(b.renewal_date))[0] || null
  const healthScore = clamp(100 - overdue.length * 14 - openTickets.length * 8 - openIncidents.length * 16 - (client.status === 'active' ? 0 : 12), 0, 100)
  const evidence: Wave2Evidence[] = [
    ...invoices.slice(0, 30).map((item) => evidenceInvoice(item)),
    ...payments.slice(0, 20).map((item) => evidencePayment(item)),
    ...tickets.slice(0, 20).map((item) => evidenceTicket(item)),
    ...incidents.slice(0, 15).map((item) => evidenceIncident(item)),
    ...contracts.slice(0, 12).map((item) => evidenceContract(item)),
    ...renewals.slice(0, 12).map((item) => evidenceRenewal(item)),
    ...serviceEvents.slice(0, 20).map((item) => evidenceServiceEvent(item)),
  ]
  const factors: Wave2Factor[] = [
    factor('finance', 'Santé financière', balanceDh > 0 ? money(balanceDh) : 'Aucun encours visible', overdueDh > 0 ? `${money(overdueDh)} en retard exige une intervention documentée.` : 'Aucune facture en retard dans les données disponibles.', overdueDh > 0 ? 'critical' : balanceDh > 0 ? 'warning' : 'success', evidence.filter((item) => item.type === 'financial').map((item) => item.id), overdueDh > 0 ? 'down' : 'stable'),
    factor('adoption', 'Adoption produit', `${tenants.filter((item) => item.status === 'active').length}/${tenants.length || 0} tenant(s) actif(s)`, tenants.length ? 'Lecture dérivée des états tenant; la télémétrie détaillée reste disponible dans le Tenant Twin.' : 'Aucun tenant lié au dossier.', tenants.some((item) => item.status !== 'active') ? 'warning' : tenants.length ? 'success' : 'neutral', tenants.map((item) => `tenant-${item.id}`), 'unknown'),
    factor('service', 'Pression de service', `${openTickets.length} ticket(s) · ${openIncidents.length} incident(s)`, openIncidents.length ? 'La relation est exposée à un incident actif.' : openTickets.length ? 'Des demandes ouvertes nécessitent un suivi.' : 'Aucune pression ouverte visible.', openIncidents.length ? 'critical' : openTickets.length ? 'warning' : 'success', evidence.filter((item) => item.type === 'service').map((item) => item.id), openIncidents.length || openTickets.length ? 'down' : 'stable'),
    factor('renewal', 'Préparation renouvellement', renewal ? `${daysUntil(renewal.renewal_date)} jour(s)` : 'Non planifié', renewal ? `Statut ${renewal.status}; valeur attendue ${money(renewal.expected_amount_mad || 0)}.` : 'Aucun renouvellement disponible.', renewal?.status === 'at_risk' ? 'critical' : renewal ? 'info' : 'neutral', renewal ? [`renewal-${renewal.id}`] : [], renewal?.status === 'at_risk' ? 'down' : 'unknown'),
    factor('relationship', 'Relation et gouvernance', client.account_manager_id || client.commercial_owner_id || 'Owner non attribué', client.primary_contact_name ? `Contact principal: ${client.primary_contact_name}.` : 'Contact principal non renseigné.', client.account_manager_id || client.commercial_owner_id ? 'success' : 'warning', [], 'unknown'),
  ]
  const ribbon: Wave2RibbonItem[] = [
    ribbonItem('health', 'Santé explicable', `${healthScore}/100`, healthScore >= 80 ? 'Relation stable selon les signaux disponibles.' : 'Des facteurs exigent une intervention.', healthScore >= 80 ? 'success' : healthScore >= 55 ? 'warning' : 'critical', factors.flatMap((item) => item.evidenceIds)),
    ribbonItem('value', 'Valeur récurrente', money(mrrDh * 12), `${money(mrrDh)} de valeur mensuelle active.`, 'commercial', activeSubscriptions.map((item) => `subscription-${item.id}`)),
    ribbonItem('balance', 'Exposition financière', money(balanceDh), overdueDh ? `${money(overdueDh)} en retard.` : 'Encours sans retard critique visible.', overdueDh ? 'critical' : balanceDh ? 'warning' : 'success', invoices.map((item) => `invoice-${item.id}`)),
    ribbonItem('service', 'Pression service', `${openTickets.length + openIncidents.length}`, `${openTickets.length} ticket(s), ${openIncidents.length} incident(s) actif(s).`, openIncidents.length ? 'critical' : openTickets.length ? 'warning' : 'success', evidence.filter((item) => item.type === 'service').map((item) => item.id)),
    ribbonItem('renewal', 'Horizon renouvellement', renewal ? dateLabel(renewal.renewal_date) : 'Non planifié', renewal ? `${daysUntil(renewal.renewal_date)} jour(s) restant(s).` : 'Créer une mission de renouvellement.', renewal?.status === 'at_risk' ? 'critical' : renewal ? 'info' : 'neutral', renewal ? [`renewal-${renewal.id}`] : []),
  ]
  const relationships: Wave2RelationshipNode[] = [
    ...tenants.map((item) => relationship('tenant', item.id, item.tenant_slug, `${item.environment} · ${item.provisioning_status}`, String(item.status), toneForStatus(item.status), `${base}/tenants/${item.id}`)),
    ...subscriptions.map((item) => relationship('subscription', item.id, item.subscription_code, `${money(item.billing_amount_mad)} · ${item.billing_cycle}`, String(item.status), toneForStatus(item.status), `${base}/subscriptions/${item.id}`)),
    ...billingAccounts.map((item) => relationship('billing', item.id, item.billing_name, `${item.payment_terms_days} jours · ${item.billing_email}`, String(item.status), toneForStatus(item.status), `${base}/billing/accounts/${item.id}`)),
    ...renewals.map((item) => relationship('renewal', item.id, `Renouvellement ${dateLabel(item.renewal_date)}`, money(item.expected_amount_mad || 0), String(item.status), toneForStatus(item.status), `${base}/renewals/${item.id}`)),
    ...tickets.map((item) => relationship('ticket', item.id, item.subject, `${item.priority} · ${dateLabel(item.created_at)}`, String(item.status), item.priority === 'urgent' ? 'critical' : item.priority === 'high' ? 'warning' : 'info', `${base}/support`)),
    ...incidents.map((item) => relationship('incident', item.id, item.title, dateLabel(item.started_at), String(item.status), item.severity === 'critical' ? 'critical' : 'warning', `${base}/incidents/${item.id}`)),
    ...tasks.map((item) => relationship('task', item.id, item.title, item.due_date ? dateLabel(item.due_date) : 'Sans échéance', String(item.status), toneForStatus(item.status), `${base}/tasks`)),
    ...contracts.map((item) => relationship('contract', item.id, item.contract_code, `${dateLabel(item.start_date)} → ${dateLabel(item.end_date)}`, String(item.status), toneForStatus(item.status), `${base}/contracts`)),
  ]
  const timeline = buildTimeline({ invoices, payments, tickets, incidents, contracts, renewals, serviceEvents })
  const decision = customerEscalationDecision(client, balanceDh, overdueDh, openTickets.length, openIncidents.length, evidence)
  const actions: Wave2Action[] = [
    action('open-tenant', 'Ouvrir le Tenant Twin', 'Entrer dans l’environnement opérationnel principal.', 'info', tenants[0] ? `${base}/tenants/${tenants[0].id}` : undefined, tenants[0] ? undefined : 'Aucun tenant lié.'),
    action('start-renewal', 'Piloter le renouvellement', 'Ouvrir la stratégie de rétention et d’expansion.', 'commercial', renewal ? `${base}/renewals/${renewal.id}` : `${base}/renewals`, undefined),
    action('billing', 'Commander la situation financière', 'Examiner compte, factures, paiements et restriction.', balanceDh ? 'warning' : 'success', billingAccounts[0] ? `${base}/billing/accounts/${billingAccounts[0].id}` : `${base}/billing/accounts`),
    action('escalate', 'Ouvrir une intervention exécutive', 'Examiner impacts, preuves, autorité et alternatives.', decision.tone, undefined, undefined, decision),
    action('note', 'Ajouter une note confidentielle', 'Utiliser le registre opérateur existant.', 'neutral', `${base}/notes`),
  ]
  return {
    ...baseCommand({
      entityId: id,
      entityKind: 'client',
      title: client.display_name || client.legal_name || client.client_code,
      subtitle: `${client.client_type || 'Client'} · ${client.city || 'Localisation non renseignée'} · ${client.client_code}`,
      status: String(client.status),
      tone: healthScore < 55 ? 'critical' : healthScore < 80 ? 'warning' : 'success',
      owner: client.account_manager_id || client.commercial_owner_id || 'Owner non attribué',
      sponsor: client.support_owner_id || 'Sponsor non attribué',
      financialValueDh: mrrDh * 12,
      riskLabel: client.risk_level || (healthScore < 55 ? 'Risque élevé' : healthScore < 80 ? 'Sous surveillance' : 'Stable'),
      lastMeaningfulEvent: timeline[0]?.title || 'Aucun événement disponible',
      nextDeadline: renewal ? dateLabel(renewal.renewal_date) : nextDate([overdue[0]?.due_date, contracts[0]?.end_date]),
      primaryRecommendation: healthScore < 80 ? 'Traiter les facteurs critiques depuis le command room, nommer un owner et vérifier le résultat.' : 'Maintenir la relation et préparer la prochaine expansion ou échéance.',
      ribbon, factors, relationships, evidence, timeline, actions,
      sources: [source.state, ticketSource.state, incidentSource.state, taskSource.state, noteSource.state, eventSource.state],
    }),
    kind: 'customer', client, tenants, subscriptions, billingAccounts, invoices, payments, contracts, renewals, tickets, incidents, tasks, notes, serviceEvents,
    lifecycle: customerLifecycle(client.lifecycle_stage, overdue.length > 0 || openIncidents.length > 0),
    healthScore,
  }
}

export async function loadWave2TenantCommand(id: string): Promise<Wave2TenantCommand | null> {
  const [tenantSource, clientSource, subscriptionSource, featureSource, usageSource, ticketSource, incidentSource, taskSource, invoiceSource] = await Promise.all([
    safeSource('tenants', 'Tenants', listOperatorTenants),
    safeSource('clients', 'Clients', listOperatorClients),
    safeSource('subscriptions', 'Abonnements', listOperatorSubscriptions),
    safeSource('features', 'Fonctionnalités', listOperatorFeatureFlags),
    safeSource('usage', 'Limites et usage', listOperatorUsageLimits),
    safeSource('tickets', 'Tickets support', listOperatorSupportTickets),
    safeSource('incidents', 'Incidents', listOperatorIncidents),
    safeSource('tasks', 'Tâches opérateur', listOperatorTasks),
    safeSource('invoices', 'Factures', listOperatorInvoices),
  ])
  const tenant = asArray<Angelcare360OperatorTenantRecord>(tenantSource.data).find((item) => item.id === id) || null
  if (!tenant) return null
  const client = asArray<Angelcare360OperatorClientRecord>(clientSource.data).find((item) => item.id === tenant.client_id) || null
  const subscriptions = asArray<Angelcare360OperatorSubscriptionRecord>(subscriptionSource.data).filter((item) => item.tenant_id === id)
  const features = asArray<Angelcare360OperatorFeatureFlagRecord>(featureSource.data).filter((item) => item.tenant_id === id)
  const usage = asArray<Angelcare360OperatorUsageLimitRecord>(usageSource.data).filter((item) => item.tenant_id === id)
  const tickets = asArray<Angelcare360OperatorSupportTicketRecord>(ticketSource.data).filter((item) => item.tenant_id === id)
  const incidents = asArray<Angelcare360OperatorIncidentRecord>(incidentSource.data).filter((item) => item.tenant_id === id)
  const tasks = asArray<Angelcare360OperatorTaskRecord>(taskSource.data).filter((item) => item.tenant_id === id)
  const invoices = asArray<Angelcare360OperatorInvoiceRecord>(invoiceSource.data).filter((item) => subscriptions.some((sub) => sub.id === item.subscription_id))
  const activeSub = subscriptions.find((item) => item.status === 'active') || subscriptions[0] || null
  const outstandingDh = sum(invoices.filter((item) => openInvoiceStates.has(String(item.status))).map((item) => item.balance_due_mad))
  const usagePressure = usage.length ? Math.max(...usage.map((item) => percent(item.current_value, item.allowed_value))) : null
  const restrictedFeatures = features.filter((item) => !item.enabled || ['locked', 'disabled'].includes(String(item.status)))
  const openTickets = tickets.filter((item) => openTicketStates.has(String(item.status)))
  const openIncidents = incidents.filter((item) => openIncidentStates.has(String(item.status)))
  const evidence: Wave2Evidence[] = [
    ...features.map((item) => evidenceFeature(item)),
    ...usage.map((item) => evidenceUsage(item)),
    ...tickets.map((item) => evidenceTicket(item)),
    ...incidents.map((item) => evidenceIncident(item)),
    ...invoices.map((item) => evidenceInvoice(item)),
    ...subscriptions.map((item) => evidenceSubscription(item)),
  ]
  const factors: Wave2Factor[] = [
    factor('service', 'État de service', String(tenant.status), tenant.status === 'active' ? 'Tenant accessible selon son état principal.' : 'L’état principal limite ou empêche le service.', tenant.status === 'active' ? 'success' : tenant.status === 'provisioning' ? 'info' : 'critical', [`tenant-${tenant.id}`], 'unknown'),
    factor('provisioning', 'Provisionnement', String(tenant.provisioning_status), tenant.command_center_url ? `Point d’entrée: ${tenant.command_center_url}.` : 'URL du Command Center non renseignée.', tenant.provisioning_status === 'active' ? 'success' : tenant.provisioning_status === 'failed' || tenant.provisioning_status === 'blocked' ? 'critical' : 'warning', [], 'unknown'),
    factor('capacity', 'Pression de capacité', usagePressure === null ? 'Non disponible' : `${Math.round(usagePressure)}%`, usagePressure === null ? 'Aucune limite d’usage liée.' : usagePressure >= 90 ? 'Une limite approche ou dépasse son seuil.' : 'Capacité sous contrôle selon les limites disponibles.', usagePressure === null ? 'neutral' : usagePressure >= 100 ? 'critical' : usagePressure >= 80 ? 'warning' : 'success', usage.map((item) => `usage-${item.id}`), usagePressure && usagePressure >= 80 ? 'up' : 'stable'),
    factor('capabilities', 'Capacités restreintes', `${restrictedFeatures.length}/${features.length}`, restrictedFeatures.length ? 'Certaines fonctionnalités sont désactivées ou verrouillées.' : 'Aucune restriction explicite dans les flags disponibles.', restrictedFeatures.length ? 'warning' : features.length ? 'success' : 'neutral', restrictedFeatures.map((item) => `feature-${item.id}`), 'unknown'),
    factor('incident', 'Pression opérationnelle', `${openTickets.length + openIncidents.length}`, `${openTickets.length} ticket(s) ouvert(s), ${openIncidents.length} incident(s) actif(s).`, openIncidents.length ? 'critical' : openTickets.length ? 'warning' : 'success', [...tickets.map((item) => `ticket-${item.id}`), ...incidents.map((item) => `incident-${item.id}`)], openIncidents.length || openTickets.length ? 'down' : 'stable'),
  ]
  const capabilities = groupCapabilities(features)
  const suspension = tenantSuspensionSimulation({ tenant, client, activeSub, features, usage, outstandingDh })
  const restoration = tenantRestorationSimulation({ tenant, activeSub, outstandingDh, restrictedFeatures })
  const decision = tenantDecision(tenant, client, suspension, evidence)
  const ribbon: Wave2RibbonItem[] = [
    ribbonItem('state', 'État runtime', String(tenant.status), `${tenant.environment} · provisionnement ${tenant.provisioning_status}`, tenant.status === 'active' ? 'success' : 'critical', [`tenant-${tenant.id}`]),
    ribbonItem('users', 'Utilisateurs affectés', usageValue(usage, ['users', 'active_users']), 'Valeur issue des limites d’usage lorsqu’elle existe.', usage.length ? 'info' : 'neutral', usage.map((item) => `usage-${item.id}`)),
    ribbonItem('capacity', 'Capacité maximale', usagePressure === null ? 'Non disponible' : `${Math.round(usagePressure)}%`, usagePressure === null ? 'Aucune source de capacité.' : 'Plus forte consommation par rapport à une limite.', usagePressure === null ? 'neutral' : usagePressure >= 100 ? 'critical' : usagePressure >= 80 ? 'warning' : 'success', usage.map((item) => `usage-${item.id}`)),
    ribbonItem('restricted', 'Capacités restreintes', String(restrictedFeatures.length), restrictedFeatures.length ? 'Flags désactivés ou verrouillés.' : 'Aucune restriction visible.', restrictedFeatures.length ? 'warning' : 'success', restrictedFeatures.map((item) => `feature-${item.id}`)),
    ribbonItem('exposure', 'Encours lié', money(outstandingDh), activeSub ? `Abonnement ${activeSub.subscription_code}.` : 'Aucun abonnement lié.', outstandingDh ? 'warning' : 'success', invoices.map((item) => `invoice-${item.id}`)),
  ]
  const relationships: Wave2RelationshipNode[] = [
    client ? relationship('customer', client.id, client.display_name, client.client_code, String(client.status), toneForStatus(client.status), `${base}/clients/${client.id}`) : relationship('customer', tenant.client_id, 'Client indisponible', tenant.client_id, 'unavailable', 'neutral'),
    ...subscriptions.map((item) => relationship('subscription', item.id, item.subscription_code, money(item.billing_amount_mad), String(item.status), toneForStatus(item.status), `${base}/subscriptions/${item.id}`)),
    ...features.slice(0, 30).map((item) => relationship('feature', item.id, item.feature_label || item.feature_key, item.module_key, String(item.status), item.enabled ? 'success' : 'warning', `${base}/features`)),
    ...usage.slice(0, 20).map((item) => relationship('usage', item.id, item.label, `${item.current_value}/${item.allowed_value ?? '∞'} ${item.unit}`, String(item.status), percent(item.current_value, item.allowed_value) >= 90 ? 'warning' : 'success', `${base}/usage-limits`)),
    ...incidents.map((item) => relationship('incident', item.id, item.title, dateLabel(item.started_at), String(item.status), item.severity === 'critical' ? 'critical' : 'warning', `${base}/incidents/${item.id}`)),
    ...tickets.map((item) => relationship('ticket', item.id, item.subject, String(item.priority), String(item.status), item.priority === 'urgent' ? 'critical' : 'warning', `${base}/support`)),
  ]
  const timeline = buildTimeline({ tickets, incidents, subscriptions, invoices, tasks })
  const actions: Wave2Action[] = [
    action('portal', 'Ouvrir le Command Center client', 'Accéder au point d’entrée du tenant.', 'info', tenant.command_center_url || undefined, tenant.command_center_url ? undefined : 'URL non configurée.'),
    action('subscription', 'Contrôler l’abonnement', 'Examiner package, périodes et entitlements.', 'commercial', activeSub ? `${base}/subscriptions/${activeSub.id}` : `${base}/subscriptions`, undefined),
    action('capabilities', 'Inspecter les capacités', 'Examiner flags et limites du tenant.', 'info', `${base}/features`),
    action('suspend', 'Simuler une suspension', 'Afficher utilisateurs, services et conséquences avant décision.', 'critical', undefined, undefined, decision),
    action('incident', 'Ouvrir une investigation', 'Accéder à l’incident actif ou au centre incident.', openIncidents.length ? 'critical' : 'warning', openIncidents[0] ? `${base}/incidents/${openIncidents[0].id}` : `${base}/incidents`),
  ]
  return {
    ...baseCommand({
      entityId: id, entityKind: 'tenant', title: tenant.tenant_slug, subtitle: `${client?.display_name || 'Client indisponible'} · ${tenant.environment} · ${tenant.command_center_url || 'URL non configurée'}`,
      status: String(tenant.status), tone: tenant.status === 'active' ? 'success' : tenant.status === 'provisioning' ? 'info' : 'critical', owner: client?.account_manager_id || 'Owner non attribué', sponsor: client?.support_owner_id || 'Sponsor non attribué',
      financialValueDh: numberValue(activeSub?.billing_amount_mad || 0) * 12, riskLabel: openIncidents.length ? 'Incident actif' : restrictedFeatures.length ? 'Capacités restreintes' : tenant.status === 'active' ? 'Sous contrôle' : 'Service limité',
      lastMeaningfulEvent: timeline[0]?.title || 'Aucun événement disponible', nextDeadline: activeSub?.current_period_end ? dateLabel(activeSub.current_period_end) : 'Non disponible',
      primaryRecommendation: tenant.status === 'active' && !openIncidents.length ? 'Maintenir le service, surveiller capacité et restrictions.' : 'Examiner les causes et utiliser une décision chamber avant toute mutation.',
      ribbon, factors, relationships, evidence, timeline, actions,
      sources: [tenantSource.state, clientSource.state, subscriptionSource.state, featureSource.state, usageSource.state, ticketSource.state, incidentSource.state, taskSource.state, invoiceSource.state],
    }),
    kind: 'tenant', tenant, client, subscriptions, features, usage, tickets, incidents, tasks, invoices, capabilitySummary: capabilities, suspensionSimulation: suspension, restorationSimulation: restoration,
  }
}

export async function loadWave2SubscriptionCommand(id: string): Promise<Wave2SubscriptionCommand | null> {
  const [subSource, clientSource, tenantSource, planSource, featureSource, usageSource, invoiceSource, contractSource, renewalSource] = await Promise.all([
    safeSource('subscriptions', 'Abonnements', listOperatorSubscriptions), safeSource('clients', 'Clients', listOperatorClients), safeSource('tenants', 'Tenants', listOperatorTenants), safeSource('plans', 'Plans', listOperatorPlans), safeSource('features', 'Fonctionnalités', listOperatorFeatureFlags), safeSource('usage', 'Usage', listOperatorUsageLimits), safeSource('invoices', 'Factures', listOperatorInvoices), safeSource('contracts', 'Contrats', listOperatorContracts), safeSource('renewals', 'Renouvellements', listOperatorRenewals),
  ])
  const subscription = asArray<Angelcare360OperatorSubscriptionRecord>(subSource.data).find((item) => item.id === id) || null
  if (!subscription) return null
  const client = asArray<Angelcare360OperatorClientRecord>(clientSource.data).find((item) => item.id === subscription.client_id) || null
  const tenant = asArray<Angelcare360OperatorTenantRecord>(tenantSource.data).find((item) => item.id === subscription.tenant_id) || null
  const plan = asArray<Angelcare360OperatorPlanRecord>(planSource.data).find((item) => item.id === subscription.plan_id) || null
  const features = asArray<Angelcare360OperatorFeatureFlagRecord>(featureSource.data).filter((item) => item.client_id === subscription.client_id && (!subscription.tenant_id || item.tenant_id === subscription.tenant_id))
  const usage = asArray<Angelcare360OperatorUsageLimitRecord>(usageSource.data).filter((item) => item.client_id === subscription.client_id && (!subscription.tenant_id || item.tenant_id === subscription.tenant_id))
  const invoices = asArray<Angelcare360OperatorInvoiceRecord>(invoiceSource.data).filter((item) => item.subscription_id === id)
  const contracts = asArray<Angelcare360OperatorContractRecord>(contractSource.data).filter((item) => item.subscription_id === id)
  const renewals = asArray<Angelcare360OperatorRenewalRecord>(renewalSource.data).filter((item) => item.subscription_id === id)
  const outstandingDh = sum(invoices.filter((item) => openInvoiceStates.has(String(item.status))).map((item) => item.balance_due_mad))
  const restrictedFeatures = features.filter((item) => !item.enabled || ['locked', 'disabled'].includes(String(item.status)))
  const usagePressure = usage.length ? Math.max(...usage.map((item) => percent(item.current_value, item.allowed_value))) : null
  const evidence: Wave2Evidence[] = [...features.map(evidenceFeature), ...usage.map(evidenceUsage), ...invoices.map(evidenceInvoice), ...contracts.map(evidenceContract), ...renewals.map(evidenceRenewal), evidenceSubscription(subscription)]
  const factors: Wave2Factor[] = [
    factor('commercial', 'Valeur commerciale', money(subscription.billing_amount_mad), `${subscription.billing_cycle} · remise ${money(subscription.discount_amount_mad)}.`, 'commercial', [`subscription-${subscription.id}`], 'stable'),
    factor('entitlements', 'Architecture de capacité', `${features.filter((item) => item.enabled).length}/${features.length}`, restrictedFeatures.length ? `${restrictedFeatures.length} fonctionnalité(s) restreinte(s).` : 'Aucune restriction visible.', restrictedFeatures.length ? 'warning' : features.length ? 'success' : 'neutral', features.map((item) => `feature-${item.id}`), 'unknown'),
    factor('usage', 'Usage vs limites', usagePressure === null ? 'Non disponible' : `${Math.round(usagePressure)}%`, usagePressure === null ? 'Aucune limite liée.' : 'Pression maximale parmi les limites disponibles.', usagePressure === null ? 'neutral' : usagePressure >= 100 ? 'critical' : usagePressure >= 80 ? 'warning' : 'success', usage.map((item) => `usage-${item.id}`), usagePressure && usagePressure >= 80 ? 'up' : 'stable'),
    factor('billing', 'Position de facturation', money(outstandingDh), outstandingDh ? 'Un encours reste lié à cet abonnement.' : 'Aucun encours visible.', outstandingDh ? 'warning' : 'success', invoices.map((item) => `invoice-${item.id}`), outstandingDh ? 'down' : 'stable'),
    factor('renewal', 'Préparation de renouvellement', renewals[0] ? dateLabel(renewals[0].renewal_date) : 'Non planifié', renewals[0] ? `Statut ${renewals[0].status}.` : 'Aucun renouvellement lié.', renewals[0]?.status === 'at_risk' ? 'critical' : renewals[0] ? 'info' : 'neutral', renewals.map((item) => `renewal-${item.id}`), 'unknown'),
  ]
  const simulations = subscriptionSimulations(subscription, plan, features, usage)
  const changeDecision = subscriptionDecision(subscription, client, tenant, simulations[0], evidence)
  const ribbon: Wave2RibbonItem[] = [
    ribbonItem('state', 'État contractuel', String(subscription.status), `${dateLabel(subscription.start_date)} → ${dateLabel(subscription.current_period_end)}`, toneForStatus(subscription.status), [`subscription-${subscription.id}`]),
    ribbonItem('value', 'Valeur récurrente', money(subscription.billing_amount_mad), `${subscription.billing_cycle}; ${money(subscription.discount_amount_mad)} de remise.`, 'commercial', [`subscription-${subscription.id}`]),
    ribbonItem('adoption', 'Capacités activées', `${features.filter((item) => item.enabled).length}/${features.length}`, restrictedFeatures.length ? `${restrictedFeatures.length} restriction(s).` : 'Toutes les capacités visibles sont actives.', restrictedFeatures.length ? 'warning' : 'success', features.map((item) => `feature-${item.id}`)),
    ribbonItem('usage', 'Pression d’usage', usagePressure === null ? 'Non disponible' : `${Math.round(usagePressure)}%`, 'Plus forte pression sur les limites disponibles.', usagePressure === null ? 'neutral' : usagePressure >= 90 ? 'warning' : 'success', usage.map((item) => `usage-${item.id}`)),
    ribbonItem('renewal', 'Échéance', renewals[0] ? dateLabel(renewals[0].renewal_date) : dateLabel(subscription.current_period_end), renewals[0] ? `${daysUntil(renewals[0].renewal_date)} jour(s).` : 'Période contractuelle actuelle.', renewals[0]?.status === 'at_risk' ? 'critical' : 'info', renewals.map((item) => `renewal-${item.id}`)),
  ]
  const relationships: Wave2RelationshipNode[] = [
    client ? relationship('customer', client.id, client.display_name, client.client_code, String(client.status), toneForStatus(client.status), `${base}/clients/${client.id}`) : relationship('customer', subscription.client_id, 'Client indisponible', subscription.client_id, 'unavailable', 'neutral'),
    tenant ? relationship('tenant', tenant.id, tenant.tenant_slug, tenant.environment, String(tenant.status), toneForStatus(tenant.status), `${base}/tenants/${tenant.id}`) : relationship('tenant', subscription.tenant_id || 'none', 'Tenant non lié', '—', 'unavailable', 'neutral'),
    ...invoices.map((item) => relationship('invoice', item.id, item.invoice_number, money(item.balance_due_mad), String(item.status), toneForStatus(item.status), `${base}/billing/invoices`)),
    ...contracts.map((item) => relationship('contract', item.id, item.contract_code, dateLabel(item.end_date), String(item.status), toneForStatus(item.status), `${base}/contracts`)),
    ...renewals.map((item) => relationship('renewal', item.id, `Renouvellement ${dateLabel(item.renewal_date)}`, money(item.expected_amount_mad || 0), String(item.status), toneForStatus(item.status), `${base}/renewals/${item.id}`)),
  ]
  const timeline = buildTimeline({ subscriptions: [subscription], invoices, contracts, renewals })
  const actions: Wave2Action[] = [
    action('tenant', 'Ouvrir le Tenant Twin', 'Vérifier l’impact runtime de l’abonnement.', 'info', tenant ? `${base}/tenants/${tenant.id}` : undefined, tenant ? undefined : 'Aucun tenant lié.'),
    action('billing', 'Ouvrir la facturation liée', 'Examiner factures et encours.', outstandingDh ? 'warning' : 'success', `${base}/billing/invoices`),
    action('simulate', 'Simuler un changement', 'Comparer valeur, capacité et impact runtime.', 'commercial', undefined, undefined, changeDecision),
    action('renewal', 'Préparer le renouvellement', 'Ouvrir la stratégie liée.', renewals[0]?.status === 'at_risk' ? 'critical' : 'info', renewals[0] ? `${base}/renewals/${renewals[0].id}` : `${base}/renewals`),
  ]
  return {
    ...baseCommand({ entityId: id, entityKind: 'subscription', title: subscription.subscription_code, subtitle: `${client?.display_name || 'Client indisponible'} · ${plan?.name || 'Plan indisponible'} · ${subscription.billing_cycle}`, status: String(subscription.status), tone: toneForStatus(subscription.status), owner: client?.account_manager_id || 'Owner non attribué', sponsor: client?.commercial_owner_id || 'Sponsor non attribué', financialValueDh: numberValue(subscription.billing_amount_mad) * 12, riskLabel: outstandingDh ? 'Encours actif' : restrictedFeatures.length ? 'Restrictions visibles' : 'Sous contrôle', lastMeaningfulEvent: timeline[0]?.title || 'Aucun événement disponible', nextDeadline: dateLabel(renewals[0]?.renewal_date || subscription.current_period_end), primaryRecommendation: outstandingDh || restrictedFeatures.length ? 'Comparer les options et obtenir l’autorité avant modification.' : 'Préserver la valeur, surveiller l’usage et préparer la prochaine échéance.', ribbon, factors, relationships, evidence, timeline, actions, sources: [subSource.state, clientSource.state, tenantSource.state, planSource.state, featureSource.state, usageSource.state, invoiceSource.state, contractSource.state, renewalSource.state] }),
    kind: 'subscription', subscription, client, tenant, plan, features, usage, invoices, contracts, renewals, lifecycle: subscriptionLifecycle(subscription.status), simulations,
  }
}

export async function loadWave2BillingCommand(id: string): Promise<Wave2BillingCommand | null> {
  const [accountSource, clientSource, subscriptionSource, invoiceSource, paymentSource, renewalSource] = await Promise.all([
    safeSource('billingAccounts', 'Comptes de facturation', listOperatorBillingAccounts), safeSource('clients', 'Clients', listOperatorClients), safeSource('subscriptions', 'Abonnements', listOperatorSubscriptions), safeSource('invoices', 'Factures', listOperatorInvoices), safeSource('payments', 'Paiements', listOperatorPayments), safeSource('renewals', 'Renouvellements', listOperatorRenewals),
  ])
  const account = asArray<Angelcare360OperatorBillingAccountRecord>(accountSource.data).find((item) => item.id === id) || null
  if (!account) return null
  const client = asArray<Angelcare360OperatorClientRecord>(clientSource.data).find((item) => item.id === account.client_id) || null
  const subscriptions = asArray<Angelcare360OperatorSubscriptionRecord>(subscriptionSource.data).filter((item) => item.client_id === account.client_id)
  const invoices = asArray<Angelcare360OperatorInvoiceRecord>(invoiceSource.data).filter((item) => item.billing_account_id === id || (!item.billing_account_id && item.client_id === account.client_id))
  const invoiceIds = new Set(invoices.map((item) => item.id))
  const payments = asArray<Angelcare360OperatorPaymentRecord>(paymentSource.data).filter((item) => item.client_id === account.client_id && (!item.invoice_id || invoiceIds.has(item.invoice_id)))
  const renewals = asArray<Angelcare360OperatorRenewalRecord>(renewalSource.data).filter((item) => item.client_id === account.client_id)
  const outstandingDh = sum(invoices.filter((item) => openInvoiceStates.has(String(item.status))).map((item) => item.balance_due_mad))
  const overdueInvoices = invoices.filter((item) => item.status === 'overdue')
  const overdueDh = sum(overdueInvoices.map((item) => item.balance_due_mad))
  const confirmedDh = sum(payments.filter((item) => item.status === 'confirmed').map((item) => item.amount_mad))
  const pendingPayments = payments.filter((item) => item.status === 'pending')
  const evidence: Wave2Evidence[] = [...invoices.map(evidenceInvoice), ...payments.map(evidencePayment), ...subscriptions.map(evidenceSubscription), ...renewals.map(evidenceRenewal)]
  const collectionStages = [
    collectionStage('issued', 'Facturé', invoices.filter((item) => ['issued', 'partially_paid', 'paid', 'overdue'].includes(String(item.status))), 'info', 'Factures émises disponibles.'),
    collectionStage('paid', 'Encaissé', payments.filter((item) => item.status === 'confirmed'), 'success', 'Paiements confirmés.'),
    collectionStage('outstanding', 'Encours', invoices.filter((item) => openInvoiceStates.has(String(item.status))), 'warning', 'Solde restant non soldé.'),
    collectionStage('overdue', 'En retard', overdueInvoices, 'critical', 'Factures en dépassement d’échéance.'),
    collectionStage('pending', 'À vérifier', pendingPayments, 'warning', 'Paiements en attente de validation.'),
  ]
  const factors: Wave2Factor[] = [
    factor('position', 'Position financière', money(outstandingDh), overdueDh ? `${money(overdueDh)} en retard.` : 'Encours sans retard critique visible.', overdueDh ? 'critical' : outstandingDh ? 'warning' : 'success', invoices.map((item) => `invoice-${item.id}`), overdueDh ? 'down' : 'stable'),
    factor('collection', 'Encaissements confirmés', money(confirmedDh), `${payments.filter((item) => item.status === 'confirmed').length} paiement(s) confirmé(s).`, 'success', payments.filter((item) => item.status === 'confirmed').map((item) => `payment-${item.id}`), 'stable'),
    factor('verification', 'Paiements à vérifier', String(pendingPayments.length), pendingPayments.length ? 'Une validation opérateur reste nécessaire.' : 'Aucun paiement en attente.', pendingPayments.length ? 'warning' : 'success', pendingPayments.map((item) => `payment-${item.id}`), pendingPayments.length ? 'up' : 'stable'),
    factor('terms', 'Conditions de paiement', `${account.payment_terms_days} jours`, account.tax_identifier ? `Identifiant fiscal ${account.tax_identifier}.` : 'Identifiant fiscal non renseigné.', 'info', [], 'stable'),
    factor('relationship', 'Sensibilité relationnelle', client?.health_status || 'Non évaluée', renewals[0] ? `Renouvellement le ${dateLabel(renewals[0].renewal_date)}.` : 'Aucun renouvellement lié.', renewals[0]?.status === 'at_risk' ? 'critical' : 'neutral', renewals.map((item) => `renewal-${item.id}`), 'unknown'),
  ]
  const restriction = billingRestrictionSimulation({ client, account, subscriptions, invoices, overdueDh })
  const decision = billingDecision(account, client, restriction, evidence)
  const ribbon: Wave2RibbonItem[] = [
    ribbonItem('balance', 'Encours total', money(outstandingDh), `${invoices.filter((item) => openInvoiceStates.has(String(item.status))).length} facture(s) ouverte(s).`, outstandingDh ? 'warning' : 'success', invoices.map((item) => `invoice-${item.id}`)),
    ribbonItem('overdue', 'Retard', money(overdueDh), `${overdueInvoices.length} facture(s) en retard.`, overdueDh ? 'critical' : 'success', overdueInvoices.map((item) => `invoice-${item.id}`)),
    ribbonItem('collected', 'Encaissé confirmé', money(confirmedDh), `${payments.filter((item) => item.status === 'confirmed').length} paiement(s).`, 'success', payments.filter((item) => item.status === 'confirmed').map((item) => `payment-${item.id}`)),
    ribbonItem('pending', 'Paiements à vérifier', String(pendingPayments.length), 'Pièces ou validation encore requises.', pendingPayments.length ? 'warning' : 'success', pendingPayments.map((item) => `payment-${item.id}`)),
    ribbonItem('restriction', 'Risque de restriction', overdueDh ? 'À évaluer' : 'Aucun signal', overdueDh ? 'La conséquence doit être simulée avant recommandation.' : 'Aucun retard critique visible.', overdueDh ? 'critical' : 'success', overdueInvoices.map((item) => `invoice-${item.id}`)),
  ]
  const relationships: Wave2RelationshipNode[] = [
    client ? relationship('customer', client.id, client.display_name, client.client_code, String(client.status), toneForStatus(client.status), `${base}/clients/${client.id}`) : relationship('customer', account.client_id, 'Client indisponible', account.client_id, 'unavailable', 'neutral'),
    ...subscriptions.map((item) => relationship('subscription', item.id, item.subscription_code, money(item.billing_amount_mad), String(item.status), toneForStatus(item.status), `${base}/subscriptions/${item.id}`)),
    ...invoices.map((item) => relationship('invoice', item.id, item.invoice_number, `${money(item.balance_due_mad)} · ${dateLabel(item.due_date)}`, String(item.status), toneForStatus(item.status), `${base}/billing/invoices`)),
    ...payments.map((item) => relationship('payment', item.id, item.payment_reference, money(item.amount_mad), String(item.status), toneForStatus(item.status), `${base}/billing/payments`)),
    ...renewals.map((item) => relationship('renewal', item.id, `Renouvellement ${dateLabel(item.renewal_date)}`, money(item.expected_amount_mad || 0), String(item.status), toneForStatus(item.status), `${base}/renewals/${item.id}`)),
  ]
  const timeline = buildTimeline({ invoices, payments, renewals })
  const actions: Wave2Action[] = [
    action('invoice', 'Examiner les factures', 'Ouvrir le registre détaillé des factures.', overdueDh ? 'critical' : 'info', `${base}/billing/invoices`),
    action('payment', 'Vérifier les paiements', 'Examiner preuves, statut et allocation.', pendingPayments.length ? 'warning' : 'success', `${base}/billing/payments`),
    action('restriction', 'Simuler une restriction', 'Comprendre services, utilisateurs et relation avant décision.', 'critical', undefined, undefined, decision),
    action('customer', 'Ouvrir le Customer Command', 'Replacer la décision dans la relation complète.', 'info', client ? `${base}/clients/${client.id}` : undefined, client ? undefined : 'Client indisponible.'),
  ]
  return {
    ...baseCommand({ entityId: id, entityKind: 'billing-account', title: account.billing_name, subtitle: `${client?.display_name || 'Client indisponible'} · ${account.billing_email} · conditions ${account.payment_terms_days} jours`, status: String(account.status), tone: overdueDh ? 'critical' : outstandingDh ? 'warning' : 'success', owner: 'Finance Operator', sponsor: client?.account_manager_id || 'Sponsor non attribué', financialValueDh: outstandingDh, riskLabel: overdueDh ? 'Retard critique' : outstandingDh ? 'Encours à surveiller' : 'Position soldée', lastMeaningfulEvent: timeline[0]?.title || 'Aucun événement disponible', nextDeadline: nextDate(overdueInvoices.map((item) => item.due_date)), primaryRecommendation: overdueDh ? 'Vérifier paiements, engagements et relation avant une décision de restriction.' : 'Maintenir la discipline de facturation et préparer la prochaine échéance.', ribbon, factors, relationships, evidence, timeline, actions, sources: [accountSource.state, clientSource.state, subscriptionSource.state, invoiceSource.state, paymentSource.state, renewalSource.state] }),
    kind: 'billing', account, client, subscriptions, invoices, payments, renewals, collectionStages, restrictionSimulation: restriction,
  }
}

export async function loadWave2RenewalCommand(id: string): Promise<Wave2RenewalCommand | null> {
  const [renewalSource, clientSource, subscriptionSource, tenantSource, planSource, contractSource, invoiceSource, ticketSource, incidentSource] = await Promise.all([
    safeSource('renewals', 'Renouvellements', listOperatorRenewals), safeSource('clients', 'Clients', listOperatorClients), safeSource('subscriptions', 'Abonnements', listOperatorSubscriptions), safeSource('tenants', 'Tenants', listOperatorTenants), safeSource('plans', 'Plans', listOperatorPlans), safeSource('contracts', 'Contrats', listOperatorContracts), safeSource('invoices', 'Factures', listOperatorInvoices), safeSource('tickets', 'Tickets', listOperatorSupportTickets), safeSource('incidents', 'Incidents', listOperatorIncidents),
  ])
  const renewal = asArray<Angelcare360OperatorRenewalRecord>(renewalSource.data).find((item) => item.id === id) || null
  if (!renewal) return null
  const client = asArray<Angelcare360OperatorClientRecord>(clientSource.data).find((item) => item.id === renewal.client_id) || null
  const subscription = asArray<Angelcare360OperatorSubscriptionRecord>(subscriptionSource.data).find((item) => item.id === renewal.subscription_id) || null
  const tenant = asArray<Angelcare360OperatorTenantRecord>(tenantSource.data).find((item) => item.id === subscription?.tenant_id) || null
  const plan = asArray<Angelcare360OperatorPlanRecord>(planSource.data).find((item) => item.id === subscription?.plan_id) || null
  const contracts = asArray<Angelcare360OperatorContractRecord>(contractSource.data).filter((item) => item.client_id === renewal.client_id && (!renewal.subscription_id || item.subscription_id === renewal.subscription_id))
  const invoices = asArray<Angelcare360OperatorInvoiceRecord>(invoiceSource.data).filter((item) => item.client_id === renewal.client_id)
  const tickets = asArray<Angelcare360OperatorSupportTicketRecord>(ticketSource.data).filter((item) => item.client_id === renewal.client_id)
  const incidents = asArray<Angelcare360OperatorIncidentRecord>(incidentSource.data).filter((item) => item.client_id === renewal.client_id)
  const overdueDh = sum(invoices.filter((item) => item.status === 'overdue').map((item) => item.balance_due_mad))
  const openTickets = tickets.filter((item) => openTicketStates.has(String(item.status)))
  const openIncidents = incidents.filter((item) => openIncidentStates.has(String(item.status)))
  const currentAnnualDh = numberValue(subscription?.billing_amount_mad || renewal.expected_amount_mad || 0) * (subscription?.billing_cycle === 'annual' ? 1 : 12)
  const evidence: Wave2Evidence[] = [...contracts.map(evidenceContract), ...invoices.map(evidenceInvoice), ...tickets.map(evidenceTicket), ...incidents.map(evidenceIncident), evidenceRenewal(renewal), ...(subscription ? [evidenceSubscription(subscription)] : [])]
  const readiness = clamp(Number(renewal.probability ?? 50) - (overdueDh > 0 ? 15 : 0) - openIncidents.length * 12 - openTickets.length * 4, 0, 100)
  const factors: Wave2Factor[] = [
    factor('engagement', 'Engagement décisionnaire', renewal.owner_id || 'Owner non attribué', renewal.notes || 'Aucune position client documentée.', renewal.owner_id ? 'info' : 'warning', [`renewal-${renewal.id}`], 'unknown'),
    factor('adoption', 'Adoption et valeur démontrée', tenant?.last_access_at ? `Dernier accès ${dateLabel(tenant.last_access_at)}` : 'Non disponible', tenant ? `Tenant ${tenant.status}; plan ${plan?.name || 'non disponible'}.` : 'Aucun tenant lié.', tenant?.status === 'active' ? 'success' : tenant ? 'warning' : 'neutral', tenant ? [`tenant-${tenant.id}`] : [], 'unknown'),
    factor('financial', 'Fiabilité financière', overdueDh ? money(overdueDh) : 'Aucun retard', overdueDh ? 'Des factures en retard fragilisent la négociation.' : 'Aucun retard visible.', overdueDh ? 'critical' : 'success', invoices.filter((item) => item.status === 'overdue').map((item) => `invoice-${item.id}`), overdueDh ? 'down' : 'stable'),
    factor('service', 'Expérience de service', `${openTickets.length} ticket(s) · ${openIncidents.length} incident(s)`, openIncidents.length ? 'Un incident actif menace la rétention.' : openTickets.length ? 'Des tickets doivent être stabilisés avant l’échéance.' : 'Aucun signal service ouvert.', openIncidents.length ? 'critical' : openTickets.length ? 'warning' : 'success', [...tickets.map((item) => `ticket-${item.id}`), ...incidents.map((item) => `incident-${item.id}`)], openIncidents.length || openTickets.length ? 'down' : 'stable'),
    factor('contract', 'Préparation contractuelle', contracts[0]?.status || 'Contrat non disponible', contracts[0] ? `${contracts[0].contract_code} · échéance ${dateLabel(contracts[0].renewal_date || contracts[0].end_date)}.` : 'Aucun contrat lié.', contracts[0]?.status === 'active' ? 'success' : contracts.length ? 'warning' : 'neutral', contracts.map((item) => `contract-${item.id}`), 'unknown'),
  ]
  const scenarios = renewalScenarios({ renewal, subscription, plan, currentAnnualDh })
  const decision = renewalDecision(renewal, client, scenarios, evidence)
  const ribbon: Wave2RibbonItem[] = [
    ribbonItem('readiness', 'Préparation', `${readiness}/100`, `Probabilité enregistrée ${renewal.probability ?? 'non renseignée'}%.`, readiness < 45 ? 'critical' : readiness < 70 ? 'warning' : 'success', factors.flatMap((item) => item.evidenceIds)),
    ribbonItem('value', 'Valeur à protéger', money(renewal.expected_amount_mad || currentAnnualDh), 'Valeur attendue déclarée ou annualisée.', 'commercial', [`renewal-${renewal.id}`]),
    ribbonItem('deadline', 'Échéance', dateLabel(renewal.renewal_date), `${daysUntil(renewal.renewal_date)} jour(s) restant(s).`, daysUntil(renewal.renewal_date) < 30 ? 'critical' : daysUntil(renewal.renewal_date) < 90 ? 'warning' : 'info', [`renewal-${renewal.id}`]),
    ribbonItem('service', 'Pression service', String(openTickets.length + openIncidents.length), `${openTickets.length} ticket(s), ${openIncidents.length} incident(s).`, openIncidents.length ? 'critical' : openTickets.length ? 'warning' : 'success', evidence.filter((item) => item.type === 'service').map((item) => item.id)),
    ribbonItem('financial', 'Retard financier', money(overdueDh), overdueDh ? 'À résoudre avant accord final.' : 'Aucun retard visible.', overdueDh ? 'critical' : 'success', invoices.filter((item) => item.status === 'overdue').map((item) => `invoice-${item.id}`)),
  ]
  const relationships: Wave2RelationshipNode[] = [
    client ? relationship('customer', client.id, client.display_name, client.client_code, String(client.status), toneForStatus(client.status), `${base}/clients/${client.id}`) : relationship('customer', renewal.client_id, 'Client indisponible', renewal.client_id, 'unavailable', 'neutral'),
    subscription ? relationship('subscription', subscription.id, subscription.subscription_code, money(subscription.billing_amount_mad), String(subscription.status), toneForStatus(subscription.status), `${base}/subscriptions/${subscription.id}`) : relationship('subscription', renewal.subscription_id || 'none', 'Abonnement indisponible', '—', 'unavailable', 'neutral'),
    tenant ? relationship('tenant', tenant.id, tenant.tenant_slug, tenant.environment, String(tenant.status), toneForStatus(tenant.status), `${base}/tenants/${tenant.id}`) : relationship('tenant', 'none', 'Tenant indisponible', '—', 'unavailable', 'neutral'),
    ...contracts.map((item) => relationship('contract', item.id, item.contract_code, dateLabel(item.end_date), String(item.status), toneForStatus(item.status), `${base}/contracts`)),
    ...incidents.map((item) => relationship('incident', item.id, item.title, dateLabel(item.started_at), String(item.status), item.severity === 'critical' ? 'critical' : 'warning', `${base}/incidents/${item.id}`)),
  ]
  const timeline = buildTimeline({ renewals: [renewal], contracts, invoices, tickets, incidents })
  const strategyFields = [
    { label: 'Objectif', value: renewal.status === 'at_risk' ? 'Sécuriser la relation' : 'Renouveler et développer', detail: 'Doit être confirmé par le responsable.', tone: renewal.status === 'at_risk' ? 'critical' : 'commercial' as Wave2Tone },
    { label: 'Décisionnaires', value: client?.primary_contact_name || 'Non renseigné', detail: client?.primary_contact_email || 'Aucun canal principal.', tone: client?.primary_contact_name ? 'info' : 'warning' as Wave2Tone },
    { label: 'Valeur démontrée', value: plan?.name || 'Plan indisponible', detail: tenant?.last_access_at ? `Dernier usage ${dateLabel(tenant.last_access_at)}.` : 'Usage détaillé non disponible.', tone: plan ? 'success' : 'neutral' as Wave2Tone },
    { label: 'Questions ouvertes', value: String(openTickets.length + openIncidents.length), detail: 'Tickets et incidents à traiter avant décision.', tone: openIncidents.length ? 'critical' : openTickets.length ? 'warning' : 'success' as Wave2Tone },
    { label: 'Position prix', value: money(renewal.expected_amount_mad || currentAnnualDh), detail: 'Montant attendu actuellement enregistré.', tone: 'commercial' as Wave2Tone },
    { label: 'Prochaine étape', value: daysUntil(renewal.renewal_date) < 30 ? 'Revue exécutive immédiate' : 'Préparer proposition et preuves', detail: `Échéance dans ${daysUntil(renewal.renewal_date)} jour(s).`, tone: daysUntil(renewal.renewal_date) < 30 ? 'critical' : 'info' as Wave2Tone },
  ]
  const actions: Wave2Action[] = [
    action('customer', 'Ouvrir le Customer Command', 'Examiner relation, service et finance.', 'info', client ? `${base}/clients/${client.id}` : undefined, client ? undefined : 'Client indisponible.'),
    action('subscription', 'Contrôler l’abonnement', 'Examiner package, usage et entitlements.', 'commercial', subscription ? `${base}/subscriptions/${subscription.id}` : undefined, subscription ? undefined : 'Abonnement indisponible.'),
    action('scenario', 'Comparer les scénarios', 'Arbitrer maintien, upgrade, concession ou non-renouvellement.', 'commercial', undefined, undefined, decision),
    action('status', 'Exécuter la prochaine étape', 'Utiliser le registre de renouvellement existant.', renewal.status === 'at_risk' ? 'critical' : 'info', `${base}/renewals`),
  ]
  return {
    ...baseCommand({ entityId: id, entityKind: 'renewal', title: `Renouvellement ${client?.display_name || renewal.client_id}`, subtitle: `${dateLabel(renewal.renewal_date)} · ${subscription?.subscription_code || 'Abonnement non lié'} · owner ${renewal.owner_id || 'non attribué'}`, status: String(renewal.status), tone: renewal.status === 'at_risk' ? 'critical' : readiness < 70 ? 'warning' : 'commercial', owner: renewal.owner_id || 'Owner non attribué', sponsor: client?.commercial_owner_id || 'Sponsor non attribué', financialValueDh: numberValue(renewal.expected_amount_mad || currentAnnualDh), riskLabel: readiness < 45 ? 'Risque élevé' : readiness < 70 ? 'Préparation insuffisante' : 'Trajectoire favorable', lastMeaningfulEvent: timeline[0]?.title || 'Aucun événement disponible', nextDeadline: dateLabel(renewal.renewal_date), primaryRecommendation: readiness < 70 ? 'Fermer les risques financiers et service, confirmer les décisionnaires et choisir un scénario approuvé.' : 'Convertir la préparation en proposition claire et sécuriser la signature.', ribbon, factors, relationships, evidence, timeline, actions, sources: [renewalSource.state, clientSource.state, subscriptionSource.state, tenantSource.state, planSource.state, contractSource.state, invoiceSource.state, ticketSource.state, incidentSource.state] }),
    kind: 'renewal', renewal, client, subscription, tenant, plan, contracts, invoices, tickets, incidents, scenarios, strategyFields,
  }
}

export async function loadWave2IncidentCommand(id: string): Promise<Wave2IncidentCommand | null> {
  const [incidentSource, clientSource, tenantSource, ticketSource, taskSource, eventSource, subscriptionSource, renewalSource] = await Promise.all([
    safeSource('incidents', 'Incidents', listOperatorIncidents), safeSource('clients', 'Clients', listOperatorClients), safeSource('tenants', 'Tenants', listOperatorTenants), safeSource('tickets', 'Tickets', listOperatorSupportTickets), safeSource('tasks', 'Tâches', listOperatorTasks), safeSource('events', 'Événements service', () => listOperatorServiceEvents()), safeSource('subscriptions', 'Abonnements', listOperatorSubscriptions), safeSource('renewals', 'Renouvellements', listOperatorRenewals),
  ])
  const incident = asArray<Angelcare360OperatorIncidentRecord>(incidentSource.data).find((item) => item.id === id) || null
  if (!incident) return null
  const client = asArray<Angelcare360OperatorClientRecord>(clientSource.data).find((item) => item.id === incident.client_id) || null
  const tenant = asArray<Angelcare360OperatorTenantRecord>(tenantSource.data).find((item) => item.id === incident.tenant_id) || null
  const tickets = asArray<Angelcare360OperatorSupportTicketRecord>(ticketSource.data).filter((item) => (incident.client_id && item.client_id === incident.client_id) || (incident.tenant_id && item.tenant_id === incident.tenant_id))
  const tasks = asArray<Angelcare360OperatorTaskRecord>(taskSource.data).filter((item) => (incident.client_id && item.client_id === incident.client_id) || (incident.tenant_id && item.tenant_id === incident.tenant_id))
  const serviceEvents = asArray<Angelcare360OperatorServiceEventRecord>(eventSource.data).filter((item) => (incident.client_id && item.client_id === incident.client_id) || (incident.tenant_id && item.tenant_id === incident.tenant_id))
  const subscriptions = asArray<Angelcare360OperatorSubscriptionRecord>(subscriptionSource.data).filter((item) => (incident.client_id && item.client_id === incident.client_id) || (incident.tenant_id && item.tenant_id === incident.tenant_id))
  const renewals = asArray<Angelcare360OperatorRenewalRecord>(renewalSource.data).filter((item) => incident.client_id && item.client_id === incident.client_id)
  const exposureDh = sum(subscriptions.filter((item) => item.status === 'active').map((item) => numberValue(item.billing_amount_mad) * 12)) + sum(renewals.filter((item) => item.status === 'at_risk').map((item) => item.expected_amount_mad || 0))
  const duration = durationLabel(incident.started_at, incident.resolved_at)
  const openTasks = tasks.filter((item) => ['todo', 'in_progress', 'blocked'].includes(String(item.status)))
  const evidence: Wave2Evidence[] = [evidenceIncident(incident), ...tickets.map(evidenceTicket), ...serviceEvents.map(evidenceServiceEvent), ...subscriptions.map(evidenceSubscription), ...renewals.map(evidenceRenewal), ...tasks.map(evidenceTask)]
  const factors: Wave2Factor[] = [
    factor('severity', 'Sévérité et durée', `${incident.severity} · ${duration}`, incident.description, incident.severity === 'critical' ? 'critical' : incident.severity === 'warning' || incident.severity === 'high' ? 'warning' : 'info', [`incident-${incident.id}`], incident.status === 'resolved' ? 'stable' : 'down'),
    factor('impact', 'Périmètre client', client?.display_name || 'Client non lié', tenant ? `Tenant ${tenant.tenant_slug}.` : 'Tenant non lié.', incident.client_id || incident.tenant_id ? 'warning' : 'neutral', [], 'unknown'),
    factor('service', 'Objets associés', `${tickets.length} ticket(s) · ${openTasks.length} action(s)`, openTasks.some((item) => item.status === 'blocked') ? 'Une action de recovery est bloquée.' : 'Actions et tickets liés au périmètre.', openTasks.some((item) => item.status === 'blocked') ? 'critical' : openTasks.length ? 'warning' : 'success', [...tickets.map((item) => `ticket-${item.id}`), ...tasks.map((item) => `task-${item.id}`)], 'unknown'),
    factor('communication', 'Communication client', serviceEvents.some((item) => item.event_type.toLowerCase().includes('communication')) ? 'Trace disponible' : 'Non documentée', serviceEvents.some((item) => item.event_type.toLowerCase().includes('communication')) ? 'Un événement de communication est visible.' : 'Aucune preuve explicite de communication.', serviceEvents.some((item) => item.event_type.toLowerCase().includes('communication')) ? 'success' : 'warning', serviceEvents.map((item) => `event-${item.id}`), 'unknown'),
    factor('exposure', 'Valeur relationnelle exposée', money(exposureDh), 'Valeur annualisée des abonnements actifs et renouvellements à risque associés.', exposureDh ? 'commercial' : 'neutral', subscriptions.map((item) => `subscription-${item.id}`), 'unknown'),
  ]
  const closureDecision = incidentClosureDecision(incident, client, tenant, exposureDh, openTasks, evidence)
  const phases = incidentPhases(incident.status)
  const ribbon: Wave2RibbonItem[] = [
    ribbonItem('severity', 'Sévérité', String(incident.severity), `Incident ${incident.status} depuis ${duration}.`, incident.severity === 'critical' ? 'critical' : 'warning', [`incident-${incident.id}`]),
    ribbonItem('impact', 'Périmètre', `${client ? 1 : 0} client · ${tenant ? 1 : 0} tenant`, tenant?.tenant_slug || client?.display_name || 'Périmètre non lié.', 'warning', []),
    ribbonItem('actions', 'Actions ouvertes', String(openTasks.length), openTasks.some((item) => item.status === 'blocked') ? 'Au moins une action bloquée.' : 'Recovery à suivre.', openTasks.some((item) => item.status === 'blocked') ? 'critical' : openTasks.length ? 'warning' : 'success', openTasks.map((item) => `task-${item.id}`)),
    ribbonItem('communication', 'Communication', serviceEvents.some((item) => item.event_type.toLowerCase().includes('communication')) ? 'Documentée' : 'À confirmer', 'État dérivé des événements service.', serviceEvents.some((item) => item.event_type.toLowerCase().includes('communication')) ? 'success' : 'warning', serviceEvents.map((item) => `event-${item.id}`)),
    ribbonItem('revenue', 'Valeur exposée', money(exposureDh), 'Abonnements actifs et renouvellements à risque associés.', exposureDh ? 'commercial' : 'neutral', subscriptions.map((item) => `subscription-${item.id}`)),
  ]
  const relationships: Wave2RelationshipNode[] = [
    client ? relationship('customer', client.id, client.display_name, client.client_code, String(client.status), toneForStatus(client.status), `${base}/clients/${client.id}`) : relationship('customer', incident.client_id || 'none', 'Client non lié', '—', 'unavailable', 'neutral'),
    tenant ? relationship('tenant', tenant.id, tenant.tenant_slug, tenant.environment, String(tenant.status), toneForStatus(tenant.status), `${base}/tenants/${tenant.id}`) : relationship('tenant', incident.tenant_id || 'none', 'Tenant non lié', '—', 'unavailable', 'neutral'),
    ...tickets.map((item) => relationship('ticket', item.id, item.subject, `${item.priority} · ${dateLabel(item.created_at)}`, String(item.status), item.priority === 'urgent' ? 'critical' : 'warning', `${base}/support`)),
    ...tasks.map((item) => relationship('task', item.id, item.title, `${item.owner_id || 'owner non attribué'} · ${dateLabel(item.due_date)}`, String(item.status), item.status === 'blocked' ? 'critical' : 'info', `${base}/tasks`)),
    ...subscriptions.map((item) => relationship('subscription', item.id, item.subscription_code, money(item.billing_amount_mad), String(item.status), toneForStatus(item.status), `${base}/subscriptions/${item.id}`)),
    ...renewals.map((item) => relationship('renewal', item.id, `Renouvellement ${dateLabel(item.renewal_date)}`, money(item.expected_amount_mad || 0), String(item.status), toneForStatus(item.status), `${base}/renewals/${item.id}`)),
  ]
  const timeline = buildTimeline({ incidents: [incident], tickets, tasks, serviceEvents })
  const actions: Wave2Action[] = [
    action('customer', 'Ouvrir le Customer Command', 'Mesurer l’impact relationnel complet.', 'info', client ? `${base}/clients/${client.id}` : undefined, client ? undefined : 'Client non lié.'),
    action('tenant', 'Ouvrir le Tenant Twin', 'Examiner le runtime affecté.', 'info', tenant ? `${base}/tenants/${tenant.id}` : undefined, tenant ? undefined : 'Tenant non lié.'),
    action('tasks', 'Commander les actions de recovery', 'Ouvrir le registre des engagements opérationnels.', openTasks.some((item) => item.status === 'blocked') ? 'critical' : 'warning', `${base}/tasks`),
    action('close', 'Ouvrir la chambre de clôture', 'Vérifier recovery, communication, risques et follow-up.', 'critical', undefined, undefined, closureDecision),
  ]
  return {
    ...baseCommand({ entityId: id, entityKind: 'incident', title: incident.title, subtitle: `${client?.display_name || 'Client non lié'} · ${tenant?.tenant_slug || 'Tenant non lié'} · début ${dateLabel(incident.started_at)}`, status: String(incident.status), tone: incident.severity === 'critical' ? 'critical' : incident.status === 'resolved' ? 'success' : 'warning', owner: 'Incident commander à confirmer', sponsor: client?.support_owner_id || 'Sponsor non attribué', financialValueDh: exposureDh, riskLabel: incident.status === 'resolved' ? 'Recovery à vérifier' : incident.severity === 'critical' ? 'Impact critique' : 'Incident actif', lastMeaningfulEvent: timeline[0]?.title || 'Incident détecté', nextDeadline: openTasks[0]?.due_date ? dateLabel(openTasks[0].due_date) : 'Prochain checkpoint non enregistré', primaryRecommendation: incident.status === 'resolved' ? 'Vérifier les preuves, risques résiduels et follow-up avant clôture.' : 'Établir commandement, containment, communication et checkpoints documentés.', ribbon, factors, relationships, evidence, timeline, actions, sources: [incidentSource.state, clientSource.state, tenantSource.state, ticketSource.state, taskSource.state, eventSource.state, subscriptionSource.state, renewalSource.state] }),
    kind: 'incident', incident, client, tenant, tickets, tasks, serviceEvents, subscriptions, renewals, phases, closureDecision,
  }
}

function baseCommand(input: Omit<Wave2CommandBase, 'generatedAt' | 'sourceState'> & { sources: Wave2DataSource[] }): Wave2CommandBase {
  return { ...input, generatedAt: new Date().toISOString(), sourceState: overallSourceState(input.sources) }
}

async function safeSource<T>(key: string, label: string, loader: () => Promise<T>): Promise<{ data: T | null; state: Wave2DataSource }> {
  try {
    const data = await loader()
    const count = Array.isArray(data) ? data.length : data ? 1 : 0
    return { data, state: { key, label, state: 'complete', count, detail: count ? `${count} enregistrement(s) disponible(s).` : 'Source disponible; aucun enregistrement.' } }
  } catch (error) {
    return { data: null, state: { key, label, state: 'unavailable', count: 0, detail: error instanceof Error ? error.message : 'Source indisponible.' } }
  }
}

function overallSourceState(sources: Wave2DataSource[]): Wave2SourceState {
  const unavailable = sources.filter((item) => item.state === 'unavailable').length
  return unavailable === 0 ? 'complete' : unavailable === sources.length ? 'unavailable' : 'partial'
}

function customerLifecycle(stage: string, blocked: boolean) {
  const steps = ['lead', 'qualified', 'contracted', 'onboarding', 'implementing', 'live', 'expanding', 'renewal']
  const normalized = stage === 'contract_pending' ? 'contracted' : stage === 'demo_done' || stage === 'proposal_sent' ? 'qualified' : stage === 'at_risk' ? 'renewal' : stage
  const current = Math.max(0, steps.indexOf(normalized))
  return steps.map((step, index) => ({ label: lifecycleLabel(step), state: index < current ? 'done' as const : index === current ? (blocked ? 'blocked' as const : 'current' as const) : 'upcoming' as const, detail: index < current ? 'Étape franchie selon le cycle enregistré.' : index === current ? blocked ? 'Étape active avec signal de blocage.' : 'Étape active.' : 'Étape future.' }))
}

function subscriptionLifecycle(status: string) {
  const steps = ['trial', 'active', 'past_due', 'suspended', 'renewal', 'cancelled']
  const current = Math.max(0, steps.indexOf(status === 'expired' ? 'cancelled' : status))
  return steps.map((step, index) => ({ label: lifecycleLabel(step), state: index < current ? 'done' as const : index === current ? (status === 'suspended' || status === 'past_due' ? 'blocked' as const : 'current' as const) : 'upcoming' as const, detail: index === current ? `État actuel: ${status}.` : index < current ? 'Transition historique indicative.' : 'État futur possible.' }))
}

function incidentPhases(status: string) {
  const steps = ['detected', 'qualified', 'command', 'investigating', 'containing', 'mitigated', 'recovering', 'resolved', 'review', 'closed']
  const map: Record<string, number> = { open: 1, investigating: 3, mitigated: 5, resolved: 7, archived: 9 }
  const current = map[status] ?? 1
  return steps.map((step, index) => ({ label: lifecycleLabel(step), state: index < current ? 'done' as const : index === current ? (status === 'open' ? 'blocked' as const : 'current' as const) : 'upcoming' as const, detail: index === current ? `Phase active selon le statut ${status}.` : index < current ? 'Phase franchie selon la progression enregistrée.' : 'Phase future à documenter.' }))
}

function customerEscalationDecision(client: Angelcare360OperatorClientRecord, balanceDh: number, overdueDh: number, tickets: number, incidents: number, evidence: Wave2Evidence[]): Wave2Decision {
  return {
    id: `customer-escalation-${client.id}`, title: `Intervention exécutive — ${client.display_name}`, situation: `${money(balanceDh)} d’encours, ${money(overdueDh)} en retard, ${tickets} ticket(s) et ${incidents} incident(s) ouverts.`, recommendation: 'Nommer un owner unique, traiter le facteur critique principal et fixer un outcome mesurable.', alternatives: ['Maintenir le suivi au niveau account manager.', 'Ouvrir une revue finance et service conjointe.', 'Préparer une intervention de direction auprès du client.'], customerImpact: 'Peut accélérer la résolution mais doit conserver une communication cohérente et proportionnée.', tenantImpact: 'Aucun changement runtime automatique; toute restriction exige une décision dédiée.', financialImpactDh: Math.max(balanceDh, overdueDh), contractImpact: 'À vérifier dans les contrats actifs avant concession ou restriction.', reversibility: 'L’escalade organisationnelle est réversible; les décisions financières ou d’accès sont séparées.', authority: 'Direction commerciale, opérations ou direction générale selon l’impact.', requiredReason: 'Décrire le facteur causal, l’objectif et le délai attendu.', notifications: ['Account owner', 'Sponsor exécutif', 'Finance si exposition', 'Support si incident'], auditResult: 'Décision et preuves ajoutées au registre opérateur lorsqu’une mutation supportée est exécutée.', followUp: 'Vérifier l’évolution de la santé, de l’encours et des objets service.', evidenceIds: evidence.slice(0, 18).map((item) => item.id), executionHref: `${base}/executive/decisions`, tone: overdueDh || incidents ? 'critical' : 'warning',
  }
}

function tenantDecision(tenant: Angelcare360OperatorTenantRecord, client: Angelcare360OperatorClientRecord | null, simulation: Wave2Simulation, evidence: Wave2Evidence[]): Wave2Decision {
  return { id: `tenant-suspension-${tenant.id}`, title: `Décision de suspension — ${tenant.tenant_slug}`, situation: `Tenant ${tenant.status}, provisionnement ${tenant.provisioning_status}; ${client?.display_name || 'client indisponible'}.`, recommendation: 'Suspendre uniquement si le motif contractuel ou de sécurité est vérifié et si le plan de communication/restauration est prêt.', alternatives: ['Maintenir l’accès pendant une grâce documentée.', 'Restreindre seulement certaines capacités lorsque le backend le permet.', 'Escalader la collecte ou la sécurité sans suspension immédiate.'], customerImpact: 'Les utilisateurs peuvent perdre l’accès à leurs opérations quotidiennes.', tenantImpact: `${simulation.affectedUsers ?? 'Nombre inconnu'} utilisateur(s) potentiellement affecté(s); ${simulation.blockedCapabilities ?? 'nombre inconnu'} capacité(s) visibles.`, financialImpactDh: simulation.financialDeltaDh, contractImpact: 'Vérifier les clauses de paiement, suspension, notification et conservation des données.', reversibility: 'Le statut peut être restauré par l’opération existante, sous réserve des conditions métier.', authority: 'Direction financière ou direction générale selon le motif et la valeur.', requiredReason: 'Motif détaillé, preuve, portée, date d’effet et condition de restauration.', notifications: ['Customer owner', 'Finance', 'Support', 'Administrateur client'], auditResult: 'La mutation tenant existante reste exécutée côté serveur et auditée.', followUp: 'Vérifier l’accès, la communication et la condition de restauration.', evidenceIds: evidence.slice(0, 20).map((item) => item.id), executionHref: `${base}/tenants`, tone: 'critical' }
}

function subscriptionDecision(subscription: Angelcare360OperatorSubscriptionRecord, client: Angelcare360OperatorClientRecord | null, tenant: Angelcare360OperatorTenantRecord | null, simulation: Wave2Simulation, evidence: Wave2Evidence[]): Wave2Decision {
  return { id: `subscription-change-${subscription.id}`, title: `Changement d’abonnement — ${subscription.subscription_code}`, situation: `${client?.display_name || 'Client indisponible'} utilise ${subscription.status} pour ${money(subscription.billing_amount_mad)} par ${subscription.billing_cycle}.`, recommendation: 'Comparer la valeur, les capacités, l’usage réel et l’impact tenant avant toute modification.', alternatives: ['Maintenir le plan actuel.', 'Programmer un upgrade à la prochaine période.', 'Appliquer une exception temporaire documentée.', 'Réduire le périmètre uniquement avec accord et vérification d’usage.'], customerImpact: simulation.warning, tenantImpact: tenant ? `Tenant ${tenant.tenant_slug} actuellement ${tenant.status}.` : 'Tenant non lié; impact runtime incomplet.', financialImpactDh: Math.abs(simulation.financialDeltaDh), contractImpact: 'Vérifier la période contractuelle, la remise, la proratisation et l’autorité commerciale.', reversibility: 'Dépend de la date d’effet et des capacités retirées.', authority: 'Direction commerciale / finance selon delta et remise.', requiredReason: 'Objectif commercial, date d’effet, capacités modifiées et accord client.', notifications: ['Account owner', 'Finance', 'Implementation si capacités changent'], auditResult: 'La modification existante crée un changement d’état et doit rester auditée.', followUp: 'Contrôler la facture suivante, les entitlements et l’adoption.', evidenceIds: evidence.slice(0, 20).map((item) => item.id), executionHref: `${base}/subscriptions`, tone: 'commercial' }
}

function billingDecision(account: Angelcare360OperatorBillingAccountRecord, client: Angelcare360OperatorClientRecord | null, simulation: Wave2Simulation, evidence: Wave2Evidence[]): Wave2Decision {
  return { id: `billing-restriction-${account.id}`, title: `Restriction pour impayé — ${account.billing_name}`, situation: `${client?.display_name || 'Client indisponible'} présente ${money(simulation.financialDeltaDh)} d’exposition liée à ce compte.`, recommendation: 'Vérifier les paiements, engagements, historique de relance, clauses et impact utilisateur avant recommandation.', alternatives: ['Accorder une grâce approuvée.', 'Obtenir un engagement daté.', 'Restreindre après notification formelle.', 'Maintenir le service pour protéger une échéance stratégique documentée.'], customerImpact: simulation.warning, tenantImpact: `${simulation.affectedSites ?? 'Nombre inconnu'} tenant(s) ou site(s) potentiellement concernés; utilisateur(s) ${simulation.affectedUsers ?? 'non disponibles'}.`, financialImpactDh: simulation.financialDeltaDh, contractImpact: 'Conditions de paiement, délai de notification et droit de suspension à vérifier.', reversibility: 'La restriction peut être levée après validation des conditions de restauration.', authority: 'Finance Operator recommande; direction financière ou générale approuve selon seuil.', requiredReason: 'Montant, ancienneté, interventions précédentes, alternative rejetée et date d’effet.', notifications: ['Client', 'Account owner', 'Support', 'Finance'], auditResult: 'La décision doit référencer les factures et preuves de paiement.', followUp: 'Contrôler recouvrement, réaction client, accès tenant et renewal risk.', evidenceIds: evidence.slice(0, 24).map((item) => item.id), executionHref: `${base}/billing/dunning`, tone: 'critical' }
}

function renewalDecision(renewal: Angelcare360OperatorRenewalRecord, client: Angelcare360OperatorClientRecord | null, scenarios: Wave2RenewalScenario[], evidence: Wave2Evidence[]): Wave2Decision {
  return { id: `renewal-strategy-${renewal.id}`, title: `Arbitrage de renouvellement — ${client?.display_name || renewal.client_id}`, situation: `Échéance ${dateLabel(renewal.renewal_date)}, probabilité ${renewal.probability ?? 'non renseignée'}%, valeur ${money(renewal.expected_amount_mad || 0)}.`, recommendation: 'Choisir un scénario qui protège la valeur et ferme les risques service, finance et décisionnaires.', alternatives: scenarios.map((item) => `${item.title}: ${money(item.annualValueDh)} annuels; ${item.relationshipImpact}`), customerImpact: 'Le scénario modifie la proposition de valeur, le prix ou le périmètre de service.', tenantImpact: 'Les scénarios de réduction ou non-renouvellement peuvent retirer des capacités ou fermer l’accès.', financialImpactDh: Math.max(...scenarios.map((item) => Math.abs(item.deltaDh)), 0), contractImpact: 'Le terme, la remise, les capacités et la date d’effet doivent être validés.', reversibility: 'Réversible avant signature; après signature selon amendement et conditions contractuelles.', authority: 'Direction commerciale, finance et direction générale selon concession.', requiredReason: 'Position client, preuve de valeur, risques, scénario retenu et boundaries de négociation.', notifications: ['Renewal owner', 'Account owner', 'Finance', 'Executive sponsor'], auditResult: 'Statut et décision de renouvellement restent traçables dans le registre existant.', followUp: 'Vérifier proposition, accord, signature, activation et résultat de revenu.', evidenceIds: evidence.slice(0, 24).map((item) => item.id), executionHref: `${base}/renewals`, tone: renewal.status === 'at_risk' ? 'critical' : 'commercial' }
}

function incidentClosureDecision(incident: Angelcare360OperatorIncidentRecord, client: Angelcare360OperatorClientRecord | null, tenant: Angelcare360OperatorTenantRecord | null, exposureDh: number, openTasks: Angelcare360OperatorTaskRecord[], evidence: Wave2Evidence[]): Wave2Decision {
  return { id: `incident-closure-${incident.id}`, title: `Clôture contrôlée — ${incident.title}`, situation: `Incident ${incident.status}, sévérité ${incident.severity}, durée ${durationLabel(incident.started_at, incident.resolved_at)}.`, recommendation: openTasks.length ? 'Ne pas clôturer tant que les actions ouvertes, la communication et les risques résiduels ne sont pas traités.' : 'Vérifier recovery, preuve client, root cause et follow-up avant clôture.', alternatives: ['Maintenir en monitoring.', 'Déclarer résolu sans clôturer le post-incident.', 'Réouvrir l’investigation si un signal persiste.'], customerImpact: client ? `Relation ${client.display_name}; communication et validation doivent être complètes.` : 'Client non lié; impact relationnel incomplet.', tenantImpact: tenant ? `Tenant ${tenant.tenant_slug}; confirmer la restauration du service.` : 'Tenant non lié; validation runtime indisponible.', financialImpactDh: exposureDh, contractImpact: 'Vérifier SLA, crédits de service et obligations de communication.', reversibility: 'Un incident peut être rouvert, mais une clôture prématurée dégrade l’audit et la confiance.', authority: incident.severity === 'critical' ? 'Incident commander + executive sponsor' : 'Operations manager', requiredReason: 'Recovery prouvée, risques restants, communication, root cause et owners de follow-up.', notifications: ['Affected customer', 'Support', 'Operations', 'Executive sponsor'], auditResult: 'La résolution existante doit être exécutée côté serveur; le post-incident reste documenté.', followUp: 'Post-incident review, commitments et vérification de non-récurrence.', evidenceIds: evidence.slice(0, 24).map((item) => item.id), executionHref: `${base}/incidents`, tone: 'critical' }
}

function tenantSuspensionSimulation(input: { tenant: Angelcare360OperatorTenantRecord; client: Angelcare360OperatorClientRecord | null; activeSub: Angelcare360OperatorSubscriptionRecord | null; features: Angelcare360OperatorFeatureFlagRecord[]; usage: Angelcare360OperatorUsageLimitRecord[]; outstandingDh: number }): Wave2Simulation {
  const users = usageNumber(input.usage, ['users', 'active_users'])
  const sites = usageNumber(input.usage, ['sites', 'schools'])
  return { id: `suspend-${input.tenant.id}`, title: 'Simulation de suspension', description: 'Projection déterministe fondée sur l’état tenant, les flags, les limites et l’abonnement disponibles.', lines: [
    simulationLine('access', 'Accès tenant', input.tenant.status, 'suspended', 'Les utilisateurs ne pourront plus utiliser le Command Center selon le comportement serveur existant.', 'critical', 'exact'),
    simulationLine('users', 'Utilisateurs', users === null ? 'Non disponible' : String(users), users === null ? 'Non disponible' : `${users} affecté(s)`, 'Valeur issue des limites d’usage; pas de télémétrie inventée.', users === null ? 'neutral' : 'warning', users === null ? 'unavailable' : 'derived'),
    simulationLine('features', 'Capacités', `${input.features.filter((item) => item.enabled).length} actives`, 'Accès global restreint', 'Les flags sont conservés mais le tenant devient indisponible.', 'warning', 'derived'),
    simulationLine('billing', 'Facturation', money(input.outstandingDh), 'Reste régie par les contrats', 'La suspension ne présume pas l’annulation de la facturation.', input.outstandingDh ? 'warning' : 'neutral', 'derived'),
    simulationLine('data', 'Données', 'Présentes', 'Préservées', 'Aucune suppression n’est incluse dans l’opération de statut existante.', 'success', 'derived'),
  ], financialDeltaDh: input.outstandingDh || numberValue(input.activeSub?.billing_amount_mad || 0), affectedUsers: users, affectedSites: sites, blockedCapabilities: input.features.filter((item) => item.enabled).length, evidenceIds: [...input.features.map((item) => `feature-${item.id}`), ...input.usage.map((item) => `usage-${item.id}`)], warning: 'La simulation n’exécute rien. Vérifier le contrat, la communication et l’autorité avant la mutation existante.' }
}

function tenantRestorationSimulation(input: { tenant: Angelcare360OperatorTenantRecord; activeSub: Angelcare360OperatorSubscriptionRecord | null; outstandingDh: number; restrictedFeatures: Angelcare360OperatorFeatureFlagRecord[] }): Wave2Simulation {
  return { id: `restore-${input.tenant.id}`, title: 'Simulation de restauration', description: 'Projection des conditions visibles avant retour à un tenant actif.', lines: [
    simulationLine('state', 'État tenant', input.tenant.status, 'active', 'Rétablit l’état principal via l’opération existante.', 'success', 'exact'),
    simulationLine('subscription', 'Abonnement', input.activeSub?.status || 'Non disponible', input.activeSub?.status === 'active' ? 'Compatible' : 'À régulariser', 'Un tenant actif avec un abonnement non actif crée une incohérence.', input.activeSub?.status === 'active' ? 'success' : 'warning', input.activeSub ? 'exact' : 'unavailable'),
    simulationLine('finance', 'Encours', money(input.outstandingDh), input.outstandingDh ? 'Preuve ou grâce requise' : 'Aucune condition financière visible', 'La condition de restauration doit être explicitement documentée.', input.outstandingDh ? 'warning' : 'success', 'derived'),
    simulationLine('flags', 'Restrictions fonctionnelles', String(input.restrictedFeatures.length), 'Conservées', 'La restauration du tenant ne modifie pas automatiquement les flags.', input.restrictedFeatures.length ? 'warning' : 'success', 'exact'),
  ], financialDeltaDh: input.outstandingDh, affectedUsers: null, affectedSites: null, blockedCapabilities: input.restrictedFeatures.length, evidenceIds: input.restrictedFeatures.map((item) => `feature-${item.id}`), warning: 'Restaurer seulement après preuve de résolution et vérification de l’abonnement.' }
}

function subscriptionSimulations(subscription: Angelcare360OperatorSubscriptionRecord, plan: Angelcare360OperatorPlanRecord | null, features: Angelcare360OperatorFeatureFlagRecord[], usage: Angelcare360OperatorUsageLimitRecord[]): Wave2Simulation[] {
  const current = numberValue(subscription.billing_amount_mad)
  const list = [
    { id: 'maintain', title: 'Maintien du plan actuel', proposed: current, feature: 'Aucun changement de capacité', tone: 'success' as Wave2Tone },
    { id: 'annualize', title: 'Passage en cycle annuel', proposed: subscription.billing_cycle === 'annual' ? current : current * 12, feature: 'Périmètre identique; rythme financier modifié', tone: 'commercial' as Wave2Tone },
    { id: 'downgrade', title: 'Réduction de périmètre', proposed: Math.max(0, current - numberValue(subscription.discount_amount_mad || 0)), feature: `${features.filter((item) => item.enabled).length} capacité(s) à vérifier avant retrait`, tone: 'warning' as Wave2Tone },
  ]
  return list.map((item) => ({ id: `${subscription.id}-${item.id}`, title: item.title, description: 'Scénario de comparaison; toute proposition commerciale finale exige des données de plan et une validation.', lines: [
    simulationLine('price', 'Valeur', money(current), money(item.proposed), `Delta ${money(item.proposed - current)}.`, item.tone, item.id === 'maintain' ? 'exact' : 'estimated'),
    simulationLine('cycle', 'Cycle', subscription.billing_cycle, item.id === 'annualize' ? 'annual' : subscription.billing_cycle, item.id === 'annualize' ? 'Facturation regroupée.' : 'Cycle inchangé.', 'info', 'derived'),
    simulationLine('features', 'Capacités', `${features.filter((feature) => feature.enabled).length} actives`, item.feature, 'Les retraits doivent être vérifiés contre l’usage.', item.tone, features.length ? 'derived' : 'unavailable'),
    simulationLine('usage', 'Pression d’usage', usage.length ? `${Math.round(Math.max(...usage.map((limit) => percent(limit.current_value, limit.allowed_value))))}%` : 'Non disponible', 'À comparer au plan cible', 'Aucun plan cible complet n’est inventé.', usage.length ? 'warning' : 'neutral', usage.length ? 'derived' : 'unavailable'),
  ], financialDeltaDh: item.proposed - current, affectedUsers: usageNumber(usage, ['users', 'active_users']), affectedSites: usageNumber(usage, ['sites', 'schools']), blockedCapabilities: item.id === 'downgrade' ? features.filter((feature) => feature.enabled).length : 0, evidenceIds: [...features.map((feature) => `feature-${feature.id}`), ...usage.map((limit) => `usage-${limit.id}`), `subscription-${subscription.id}`], warning: plan ? `Plan actuel: ${plan.name}. Les capacités du plan cible doivent provenir du registre réel.` : 'Plan actuel indisponible; aucune capacité cible ne peut être garantie.' }))
}

function billingRestrictionSimulation(input: { client: Angelcare360OperatorClientRecord | null; account: Angelcare360OperatorBillingAccountRecord; subscriptions: Angelcare360OperatorSubscriptionRecord[]; invoices: Angelcare360OperatorInvoiceRecord[]; overdueDh: number }): Wave2Simulation {
  const active = input.subscriptions.filter((item) => item.status === 'active')
  return { id: `billing-restriction-${input.account.id}`, title: 'Simulation de restriction financière', description: 'Projection du périmètre commercial visible avant toute décision.', lines: [
    simulationLine('finance', 'Montant en retard', money(input.overdueDh), money(input.overdueDh), `${input.invoices.filter((item) => item.status === 'overdue').length} facture(s) concernée(s).`, input.overdueDh ? 'critical' : 'success', 'exact'),
    simulationLine('subscriptions', 'Abonnements actifs', String(active.length), `${active.length} potentiellement exposé(s)`, 'Une restriction doit cibler le périmètre approprié.', active.length ? 'warning' : 'neutral', 'derived'),
    simulationLine('tenants', 'Tenants', String(new Set(active.map((item) => item.tenant_id).filter(Boolean)).size), 'À vérifier dans chaque Tenant Twin', 'Le compte de facturation peut couvrir plusieurs tenants.', 'warning', 'derived'),
    simulationLine('relationship', 'Santé client', input.client?.health_status || 'Non évaluée', 'Peut se dégrader', 'La collection doit être coordonnée avec l’account owner.', 'warning', input.client ? 'exact' : 'unavailable'),
    simulationLine('billing', 'Facturation', 'Active', 'Continue sauf décision contractuelle', 'Une restriction d’accès ne vaut pas annulation.', 'info', 'derived'),
  ], financialDeltaDh: input.overdueDh, affectedUsers: null, affectedSites: new Set(active.map((item) => item.tenant_id).filter(Boolean)).size, blockedCapabilities: null, evidenceIds: input.invoices.map((item) => `invoice-${item.id}`), warning: 'Aucun utilisateur n’est inventé: ouvrir les Tenant Twins concernés pour mesurer l’impact runtime.' }
}

function renewalScenarios(input: { renewal: Angelcare360OperatorRenewalRecord; subscription: Angelcare360OperatorSubscriptionRecord | null; plan: Angelcare360OperatorPlanRecord | null; currentAnnualDh: number }): Wave2RenewalScenario[] {
  const expected = numberValue(input.renewal.expected_amount_mad || input.currentAnnualDh)
  const discount = Math.round(expected * 0.08)
  return [
    { id: 'current', title: 'Renouvellement à périmètre constant', subtitle: input.plan?.name || 'Plan actuel', recurringValueDh: expected / 12, annualValueDh: expected, deltaDh: expected - input.currentAnnualDh, featureImpact: 'Aucune modification de capacité déclarée.', relationshipImpact: 'Continuité simple; nécessite preuve de valeur et accord.', approval: 'Renewal owner', tone: 'success' },
    { id: 'upgrade', title: 'Expansion / upgrade', subtitle: 'Scénario indicatif à chiffrer avec un plan réel', recurringValueDh: expected * 1.2 / 12, annualValueDh: expected * 1.2, deltaDh: expected * 1.2 - input.currentAnnualDh, featureImpact: 'Capacités supplémentaires à choisir dans le catalogue réel.', relationshipImpact: 'Augmente la valeur si l’adoption et le besoin sont prouvés.', approval: 'Direction commerciale', tone: 'commercial' },
    { id: 'discount', title: 'Renouvellement avec concession', subtitle: 'Hypothèse de 8% uniquement pour comparaison', recurringValueDh: (expected - discount) / 12, annualValueDh: expected - discount, deltaDh: expected - discount - input.currentAnnualDh, featureImpact: 'Périmètre maintenu.', relationshipImpact: 'Peut sécuriser la relation mais réduit la valeur.', approval: 'Direction commerciale + finance', tone: 'warning' },
    { id: 'reduced', title: 'Périmètre réduit', subtitle: 'Valeur indicative; capacités à définir', recurringValueDh: expected * 0.7 / 12, annualValueDh: expected * 0.7, deltaDh: expected * 0.7 - input.currentAnnualDh, featureImpact: 'Modules ou limites retirés; impact tenant à simuler.', relationshipImpact: 'Protège une partie du revenu mais peut réduire l’adoption.', approval: 'Direction commerciale', tone: 'warning' },
    { id: 'lost', title: 'Non-renouvellement', subtitle: 'Scénario de sortie', recurringValueDh: 0, annualValueDh: 0, deltaDh: -input.currentAnnualDh, featureImpact: 'Accès et données soumis aux clauses de clôture.', relationshipImpact: 'Perte de revenu et fin de relation à gérer.', approval: 'Direction générale', tone: 'critical' },
  ]
}

function collectionStage(key: string, label: string, rows: Array<any>, tone: Wave2Tone, detail: string) {
  const amountDh = sum(rows.map((row) => row.total_mad ?? row.amount_mad ?? row.balance_due_mad ?? 0))
  return { key, label, count: rows.length, amountDh, tone, detail }
}

function groupCapabilities(features: Angelcare360OperatorFeatureFlagRecord[]) {
  const groups = new Map<string, { module: string; enabled: number; restricted: number; total: number; tone: Wave2Tone }>()
  features.forEach((item) => {
    const current = groups.get(item.module_key) || { module: item.module_key || 'Autres', enabled: 0, restricted: 0, total: 0, tone: 'neutral' as Wave2Tone }
    current.total += 1
    if (item.enabled && item.status === 'enabled') current.enabled += 1
    else current.restricted += 1
    current.tone = current.restricted ? 'warning' : 'success'
    groups.set(item.module_key, current)
  })
  return [...groups.values()].sort((a, b) => b.restricted - a.restricted || a.module.localeCompare(b.module))
}

function buildTimeline(input: Record<string, Array<any> | undefined>): Wave2TimelineEvent[] {
  const events: Wave2TimelineEvent[] = []
  ;(input.invoices || []).forEach((item) => events.push(timelineEvent(`invoice-${item.id}`, `Facture ${item.invoice_number}`, `${money(item.total_mad)} · ${item.status}`, item.updated_at || item.issue_date, 'Finance Operator', toneForStatus(item.status), [`invoice-${item.id}`])))
  ;(input.payments || []).forEach((item) => events.push(timelineEvent(`payment-${item.id}`, `Paiement ${item.payment_reference}`, `${money(item.amount_mad)} · ${item.status}`, item.updated_at || item.payment_date, item.received_by || 'Finance Operator', toneForStatus(item.status), [`payment-${item.id}`])))
  ;(input.tickets || []).forEach((item) => events.push(timelineEvent(`ticket-${item.id}`, item.subject, `${item.priority} · ${item.status}`, item.updated_at || item.created_at, item.assigned_to || 'Support', item.priority === 'urgent' ? 'critical' : toneForStatus(item.status), [`ticket-${item.id}`])))
  ;(input.incidents || []).forEach((item) => events.push(timelineEvent(`incident-${item.id}`, item.title, `${item.severity} · ${item.status}`, item.updated_at || item.started_at, 'Operations', item.severity === 'critical' ? 'critical' : toneForStatus(item.status), [`incident-${item.id}`])))
  ;(input.contracts || []).forEach((item) => events.push(timelineEvent(`contract-${item.id}`, `Contrat ${item.contract_code}`, `${item.status} · ${dateLabel(item.end_date)}`, item.updated_at || item.created_at, 'Commercial', toneForStatus(item.status), [`contract-${item.id}`])))
  ;(input.renewals || []).forEach((item) => events.push(timelineEvent(`renewal-${item.id}`, `Renouvellement ${dateLabel(item.renewal_date)}`, `${item.status} · ${money(item.expected_amount_mad || 0)}`, item.updated_at || item.created_at, item.owner_id || 'Renewal owner', toneForStatus(item.status), [`renewal-${item.id}`])))
  ;(input.serviceEvents || []).forEach((item) => events.push(timelineEvent(`event-${item.id}`, item.title, item.description || item.event_type, item.occurred_at || item.created_at, 'Service', toneForStatus(item.severity), [`event-${item.id}`])))
  ;(input.subscriptions || []).forEach((item) => events.push(timelineEvent(`subscription-${item.id}`, `Abonnement ${item.subscription_code}`, `${item.status} · ${money(item.billing_amount_mad)}`, item.updated_at || item.created_at, 'Commercial', toneForStatus(item.status), [`subscription-${item.id}`])))
  ;(input.tasks || []).forEach((item) => events.push(timelineEvent(`task-${item.id}`, item.title, `${item.status} · échéance ${dateLabel(item.due_date)}`, item.updated_at || item.created_at, item.owner_id || 'Owner non attribué', item.status === 'blocked' ? 'critical' : toneForStatus(item.status), [`task-${item.id}`])))
  return events.sort((a, b) => time(b.timestamp) - time(a.timestamp)).slice(0, 80)
}

function evidenceInvoice(item: Angelcare360OperatorInvoiceRecord): Wave2Evidence { return { id: `invoice-${item.id}`, type: 'financial', label: 'Facture', title: item.invoice_number, detail: `Émise ${dateLabel(item.issue_date)} · échéance ${dateLabel(item.due_date)}`, value: money(item.balance_due_mad), timestamp: item.updated_at, status: String(item.status), tone: toneForStatus(item.status), href: `${base}/billing/invoices`, source: 'angelcare360_operator_invoices', verified: true } }
function evidencePayment(item: Angelcare360OperatorPaymentRecord): Wave2Evidence { return { id: `payment-${item.id}`, type: 'financial', label: 'Paiement', title: item.payment_reference, detail: `${item.method} · ${dateLabel(item.payment_date)}`, value: money(item.amount_mad), timestamp: item.updated_at, status: String(item.status), tone: toneForStatus(item.status), href: `${base}/billing/payments`, source: 'angelcare360_operator_payments', verified: item.status === 'confirmed' } }
function evidenceTicket(item: Angelcare360OperatorSupportTicketRecord): Wave2Evidence { return { id: `ticket-${item.id}`, type: 'service', label: 'Ticket', title: item.subject, detail: item.description, timestamp: item.updated_at, status: String(item.status), tone: item.priority === 'urgent' ? 'critical' : toneForStatus(item.status), href: `${base}/support`, source: 'angelcare360_operator_support_tickets', verified: true } }
function evidenceIncident(item: Angelcare360OperatorIncidentRecord): Wave2Evidence { return { id: `incident-${item.id}`, type: 'service', label: 'Incident', title: item.title, detail: item.description, timestamp: item.updated_at || item.started_at, status: String(item.status), tone: item.severity === 'critical' ? 'critical' : toneForStatus(item.status), href: `${base}/incidents/${item.id}`, source: 'angelcare360_operator_incidents', verified: true } }
function evidenceContract(item: Angelcare360OperatorContractRecord): Wave2Evidence { return { id: `contract-${item.id}`, type: 'contract', label: 'Contrat', title: item.contract_code, detail: `${dateLabel(item.start_date)} → ${dateLabel(item.end_date)}`, timestamp: item.updated_at, status: String(item.status), tone: toneForStatus(item.status), href: `${base}/contracts`, source: 'angelcare360_operator_contracts', verified: Boolean(item.signed_at || item.status === 'active') } }
function evidenceRenewal(item: Angelcare360OperatorRenewalRecord): Wave2Evidence { return { id: `renewal-${item.id}`, type: 'relationship', label: 'Renouvellement', title: dateLabel(item.renewal_date), detail: `Probabilité ${item.probability ?? 'non renseignée'}%`, value: money(item.expected_amount_mad || 0), timestamp: item.updated_at, status: String(item.status), tone: toneForStatus(item.status), href: `${base}/renewals/${item.id}`, source: 'angelcare360_operator_renewals', verified: true } }
function evidenceServiceEvent(item: Angelcare360OperatorServiceEventRecord): Wave2Evidence { return { id: `event-${item.id}`, type: 'service', label: item.event_type, title: item.title, detail: item.description || 'Aucun détail.', timestamp: item.occurred_at, status: String(item.status), tone: toneForStatus(item.severity), href: `${base}/service-operations`, source: 'angelcare360_operator_service_events', verified: true } }
function evidenceFeature(item: Angelcare360OperatorFeatureFlagRecord): Wave2Evidence { return { id: `feature-${item.id}`, type: 'configuration', label: item.module_key, title: item.feature_label || item.feature_key, detail: item.locked_reason || `État ${item.status}.`, timestamp: item.updated_at, status: String(item.status), tone: item.enabled ? 'success' : 'warning', href: `${base}/features`, source: 'angelcare360_operator_feature_flags', verified: true } }
function evidenceUsage(item: Angelcare360OperatorUsageLimitRecord): Wave2Evidence { const pressure = percent(item.current_value, item.allowed_value); return { id: `usage-${item.id}`, type: 'usage', label: 'Usage', title: item.label, detail: `${item.current_value}/${item.allowed_value ?? '∞'} ${item.unit}`, value: item.allowed_value ? `${Math.round(pressure)}%` : 'Sans plafond', timestamp: item.updated_at, status: String(item.status), tone: pressure >= 100 ? 'critical' : pressure >= 80 ? 'warning' : 'success', href: `${base}/usage-limits`, source: 'angelcare360_operator_usage_limits', verified: true } }
function evidenceSubscription(item: Angelcare360OperatorSubscriptionRecord): Wave2Evidence { return { id: `subscription-${item.id}`, type: 'contract', label: 'Abonnement', title: item.subscription_code, detail: `${item.billing_cycle} · ${dateLabel(item.current_period_end)}`, value: money(item.billing_amount_mad), timestamp: item.updated_at, status: String(item.status), tone: toneForStatus(item.status), href: `${base}/subscriptions/${item.id}`, source: 'angelcare360_operator_subscriptions', verified: true } }
function evidenceTask(item: Angelcare360OperatorTaskRecord): Wave2Evidence { return { id: `task-${item.id}`, type: 'audit', label: 'Action', title: item.title, detail: `${item.owner_id || 'Owner non attribué'} · échéance ${dateLabel(item.due_date)}`, timestamp: item.updated_at, status: String(item.status), tone: item.status === 'blocked' ? 'critical' : toneForStatus(item.status), href: `${base}/tasks`, source: 'angelcare360_operator_tasks', verified: item.status === 'done' } }

function factor(id: string, label: string, value: string, detail: string, tone: Wave2Tone, evidenceIds: string[], movement: Wave2Factor['movement']): Wave2Factor { return { id, label, value, detail, tone, evidenceIds, movement } }
function ribbonItem(id: string, label: string, value: string, detail: string, tone: Wave2Tone, evidenceIds: string[], href?: string): Wave2RibbonItem { return { id, label, value, detail, tone, evidenceIds, href } }
function relationship(kind: Wave2RelationshipNode['kind'], id: string, label: string, meta: string, status: string, tone: Wave2Tone, href?: string): Wave2RelationshipNode { return { id: `${kind}-${id}`, kind, label, meta, status, tone, href, evidenceIds: [`${kind}-${id}`] } }
function action(id: string, label: string, description: string, tone: Wave2Tone, href?: string, lockedReason?: string, decision?: Wave2Decision): Wave2Action { return { id, label, description, tone, href, lockedReason, decision } }
function simulationLine(id: string, label: string, current: string, proposed: string, impact: string, tone: Wave2Tone, certainty: 'exact' | 'derived' | 'estimated' | 'unavailable') { return { id, label, current, proposed, impact, tone, certainty } }
function timelineEvent(id: string, title: string, detail: string, timestamp: string, actor: string, tone: Wave2Tone, evidenceIds: string[]): Wave2TimelineEvent { return { id, title, detail, timestamp, actor, tone, evidenceIds } }

function toneForStatus(status: unknown): Wave2Tone {
  const value = String(status || '').toLowerCase()
  if (['active', 'paid', 'confirmed', 'resolved', 'renewed', 'done', 'signed', 'enabled', 'healthy'].includes(value)) return 'success'
  if (['critical', 'overdue', 'at_risk', 'suspended', 'failed', 'blocked', 'rejected', 'lost', 'cancelled'].includes(value)) return 'critical'
  if (['past_due', 'partially_paid', 'pending', 'in_progress', 'investigating', 'mitigated', 'waiting_client', 'waiting_internal', 'proposal_sent'].includes(value)) return 'warning'
  if (['trial', 'provisioning', 'upcoming', 'issued', 'draft', 'new', 'triage', 'assigned'].includes(value)) return 'info'
  return 'neutral'
}

function lifecycleLabel(value: string) {
  const labels: Record<string, string> = { lead: 'Prospect', qualified: 'Qualifié', contracted: 'Contracté', onboarding: 'Onboarding', implementing: 'Implémentation', live: 'Opérationnel', expanding: 'Expansion', renewal: 'Renouvellement', trial: 'Essai', active: 'Actif', past_due: 'En retard', suspended: 'Suspendu', cancelled: 'Clôturé', detected: 'Détecté', command: 'Commandement établi', investigating: 'Investigation', containing: 'Containment', mitigated: 'Stabilisé', recovering: 'Recovery', resolved: 'Résolu', review: 'Post-incident', closed: 'Clôturé' }
  return labels[value] || value.replaceAll('_', ' ')
}

function asArray<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : [] }
function numberValue(value: unknown) { const number = Number(value || 0); return Number.isFinite(number) ? number : 0 }
function sum(values: unknown[]) { return values.reduce<number>((total, value) => total + numberValue(value), 0) }
function money(value: unknown) { return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(numberValue(value))} Dh` }
function dateLabel(value: unknown) { if (!value) return 'Non disponible'; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) }
function time(value: unknown) { const parsed = new Date(String(value || '')).getTime(); return Number.isFinite(parsed) ? parsed : 0 }
function daysUntil(value: unknown) { if (!value) return 9999; return Math.ceil((time(value) - Date.now()) / 86_400_000) }
function durationLabel(start: unknown, end?: unknown) { const diff = Math.max(0, (end ? time(end) : Date.now()) - time(start)); const hours = Math.floor(diff / 3_600_000); if (hours < 24) return `${hours} h`; return `${Math.floor(hours / 24)} j ${hours % 24} h` }
function percent(current: unknown, allowed: unknown) { const max = numberValue(allowed); return max > 0 ? numberValue(current) / max * 100 : 0 }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)) }
function nextDate(values: unknown[]) { const future = values.filter(Boolean).map((value) => ({ value, time: time(value) })).filter((item) => item.time > Date.now()).sort((a, b) => a.time - b.time)[0]; return future ? dateLabel(future.value) : 'Non disponible' }
function usageNumber(usage: Angelcare360OperatorUsageLimitRecord[], keys: string[]) { const item = usage.find((row) => keys.some((key) => row.limit_key.toLowerCase().includes(key))); return item ? numberValue(item.current_value) : null }
function usageValue(usage: Angelcare360OperatorUsageLimitRecord[], keys: string[]) { const value = usageNumber(usage, keys); return value === null ? 'Non disponible' : new Intl.NumberFormat('fr-FR').format(value) }
