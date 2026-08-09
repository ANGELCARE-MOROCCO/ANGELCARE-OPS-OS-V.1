import type { SovereignTowerKey } from '@/data/angelcare360/operator-sovereign-navigation'
import type { SovereignEntity, SovereignSourceReport, SovereignWorkspaceSnapshot } from '@/components/angelcare360/operator/sovereign/SovereignTypes'
import {
  getOperatorOverview,
  listOperatorAuditLogs,
  listOperatorBillingAccounts,
  listOperatorClients,
  listOperatorContracts,
  listOperatorDunningActions,
  listOperatorFeatureFlags,
  listOperatorIncidents,
  listOperatorInvoices,
  listOperatorNotes,
  listOperatorOnboardingTasks,
  listOperatorPackages,
  listOperatorPayments,
  listOperatorPlans,
  listOperatorRenewals,
  listOperatorServiceEvents,
  listOperatorServiceRequests,
  listOperatorSubscriptions,
  listOperatorSupportTickets,
  listOperatorTasks,
  listOperatorTenants,
  listOperatorUsageLimits,
} from '@/lib/angelcare360/operator'

type Loader = { key: string; label: string; run: () => Promise<unknown[]> }

export async function loadSovereignWorkspaceSnapshot(tower: SovereignTowerKey): Promise<SovereignWorkspaceSnapshot> {
  const loaders = loadersForTower(tower)
  const results = await Promise.all(loaders.map(async (loader) => {
    try {
      const value = await loader.run()
      return { loader, value: Array.isArray(value) ? value : [], state: 'complete' as const, message: null }
    } catch (error) {
      return {
        loader,
        value: [] as unknown[],
        state: 'unavailable' as const,
        message: error instanceof Error ? error.message : 'Source indisponible',
      }
    }
  }))

  const sources: SovereignSourceReport[] = results.map(({ loader, value, state, message }) => ({
    key: loader.key,
    label: loader.label,
    state,
    count: value.length,
    message,
  }))
  const data = Object.fromEntries(results.map(({ loader, value }) => [loader.key, value])) as Record<string, unknown[]>
  const clients = records(data.clients)
  const tenants = records(data.tenants)
  const subscriptions = records(data.subscriptions)
  const invoices = records(data.invoices)
  const clientLabels = labelMap(clients, 'display_name', 'client_code')
  const tenantLabels = labelMap(tenants, 'tenant_slug')
  const subscriptionLabels = labelMap(subscriptions, 'subscription_code')
  const invoiceLabels = labelMap(invoices, 'invoice_number')

  const entities = buildEntities(tower, data, { clientLabels, tenantLabels, subscriptionLabels, invoiceLabels })
  const unavailable = sources.filter((source) => source.state === 'unavailable').length
  const sourceState = unavailable === 0 ? 'complete' : unavailable === sources.length ? 'unavailable' : 'partial'

  return {
    tower,
    generatedAt: new Date().toISOString(),
    sourceState,
    sources,
    metrics: buildMetrics(tower, data),
    entities,
    relationships: buildRelationships(data),
    labels: { clients: clientLabels, tenants: tenantLabels, subscriptions: subscriptionLabels, invoices: invoiceLabels },
  }
}

async function overviewAsRows() {
  const overview = await getOperatorOverview()
  return [overview]
}

function loadersForTower(tower: SovereignTowerKey): Loader[] {
  const all: Record<SovereignTowerKey, Loader[]> = {
    direction: [
      { key: 'overview', label: 'Vue exécutive', run: overviewAsRows },
      { key: 'clients', label: 'Clients', run: listOperatorClients },
      { key: 'tenants', label: 'Tenants', run: listOperatorTenants },
      { key: 'subscriptions', label: 'Abonnements', run: listOperatorSubscriptions },
      { key: 'invoices', label: 'Factures', run: listOperatorInvoices },
      { key: 'renewals', label: 'Renouvellements', run: listOperatorRenewals },
      { key: 'tickets', label: 'Support', run: listOperatorSupportTickets },
      { key: 'incidents', label: 'Incidents', run: listOperatorIncidents },
      { key: 'tasks', label: 'Engagements', run: listOperatorTasks },
      { key: 'audit', label: 'Audit', run: () => listOperatorAuditLogs() },
    ],
    growth: [
      { key: 'clients', label: 'Clients', run: listOperatorClients },
      { key: 'tenants', label: 'Tenants', run: listOperatorTenants },
      { key: 'subscriptions', label: 'Abonnements', run: listOperatorSubscriptions },
      { key: 'contracts', label: 'Contrats', run: listOperatorContracts },
      { key: 'renewals', label: 'Renouvellements', run: listOperatorRenewals },
      { key: 'tickets', label: 'Support', run: listOperatorSupportTickets },
      { key: 'notes', label: 'Notes relationnelles', run: listOperatorNotes },
      { key: 'tasks', label: 'Actions commerciales', run: listOperatorTasks },
    ],
    tenants: [
      { key: 'clients', label: 'Clients', run: listOperatorClients },
      { key: 'tenants', label: 'Tenants', run: listOperatorTenants },
      { key: 'subscriptions', label: 'Abonnements', run: listOperatorSubscriptions },
      { key: 'plans', label: 'Plans', run: listOperatorPlans },
      { key: 'packages', label: 'Packages', run: listOperatorPackages },
      { key: 'features', label: 'Entitlements', run: listOperatorFeatureFlags },
      { key: 'limits', label: 'Usage et limites', run: listOperatorUsageLimits },
      { key: 'incidents', label: 'Incidents', run: listOperatorIncidents },
      { key: 'onboarding', label: 'Provisioning', run: listOperatorOnboardingTasks },
    ],
    revenue: [
      { key: 'clients', label: 'Clients', run: listOperatorClients },
      { key: 'subscriptions', label: 'Abonnements', run: listOperatorSubscriptions },
      { key: 'contracts', label: 'Contrats', run: listOperatorContracts },
      { key: 'billingAccounts', label: 'Comptes de facturation', run: listOperatorBillingAccounts },
      { key: 'invoices', label: 'Factures', run: listOperatorInvoices },
      { key: 'payments', label: 'Paiements', run: listOperatorPayments },
      { key: 'dunning', label: 'Recouvrement', run: listOperatorDunningActions },
      { key: 'renewals', label: 'Renouvellements', run: listOperatorRenewals },
      { key: 'plans', label: 'Pricing', run: listOperatorPlans },
    ],
    service: [
      { key: 'clients', label: 'Clients', run: listOperatorClients },
      { key: 'tenants', label: 'Tenants', run: listOperatorTenants },
      { key: 'onboarding', label: 'Onboarding', run: listOperatorOnboardingTasks },
      { key: 'tickets', label: 'Support', run: listOperatorSupportTickets },
      { key: 'requests', label: 'Demandes de service', run: listOperatorServiceRequests },
      { key: 'incidents', label: 'Incidents', run: listOperatorIncidents },
      { key: 'tasks', label: 'Tâches', run: listOperatorTasks },
      { key: 'notes', label: 'Notes', run: listOperatorNotes },
      { key: 'events', label: 'Événements', run: () => listOperatorServiceEvents() },
    ],
    platform: [
      { key: 'clients', label: 'Clients', run: listOperatorClients },
      { key: 'tenants', label: 'Tenants', run: listOperatorTenants },
      { key: 'features', label: 'Feature flags', run: listOperatorFeatureFlags },
      { key: 'limits', label: 'Limites', run: listOperatorUsageLimits },
      { key: 'audit', label: 'Audit', run: () => listOperatorAuditLogs() },
      { key: 'events', label: 'Événements plateforme', run: () => listOperatorServiceEvents() },
      { key: 'incidents', label: 'Incidents', run: listOperatorIncidents },
    ],
  }
  return all[tower]
}

function records(value: unknown[] | undefined): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : []
}

function labelMap(rows: Record<string, unknown>[], ...keys: string[]) {
  return Object.fromEntries(rows.map((row) => {
    const id = String(row.id || '')
    const label = keys.map((key) => String(row[key] || '')).find(Boolean) || 'Élément sans libellé'
    return [id, label]
  }).filter(([id]) => Boolean(id)))
}

function text(row: Record<string, unknown>, key: string, fallback = '—') {
  const value = row[key]
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function money(value: unknown) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} Dh`
}

function date(value: unknown) {
  if (!value) return '—'
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('fr-FR')
}

function entity(kind: SovereignEntity['kind'], row: Record<string, unknown>, title: string, subtitle: string, fields: Array<{ label: string; value: string }>, href?: string | null): SovereignEntity {
  return {
    id: String(row.id || `${kind}-${title}`), kind, title, subtitle, status: text(row, 'status', null as unknown as string),
    clientId: row.client_id ? String(row.client_id) : null,
    tenantId: row.tenant_id ? String(row.tenant_id) : null,
    href: href || null, fields, raw: row,
  }
}

function buildEntities(tower: SovereignTowerKey, data: Record<string, unknown[]>, labels: { clientLabels: Record<string,string>; tenantLabels: Record<string,string>; subscriptionLabels: Record<string,string>; invoiceLabels: Record<string,string> }) {
  const out: SovereignEntity[] = []
  const clients = records(data.clients)
  const tenants = records(data.tenants)
  const subscriptions = records(data.subscriptions)
  const clientName = (id: unknown) => labels.clientLabels[String(id || '')] || 'Client non résolu'
  const tenantName = (id: unknown) => labels.tenantLabels[String(id || '')] || 'Tenant non résolu'

  if (tower === 'direction' || tower === 'growth') {
    clients.forEach((row) => out.push(entity('client', row, text(row,'display_name'), `${text(row,'client_type')} · ${text(row,'city')}`, [
      { label:'Cycle', value:text(row,'lifecycle_stage') }, { label:'Santé', value:text(row,'health_status') }, { label:'Risque', value:text(row,'risk_level') }, { label:'Contact', value:text(row,'primary_contact_name') },
    ], `/angelcare-360-operator/clients/${row.id}`)))
  }
  if (tower === 'direction' || tower === 'tenants') {
    tenants.forEach((row) => out.push(entity('tenant', row, text(row,'tenant_slug'), clientName(row.client_id), [
      { label:'Environnement', value:text(row,'environment') }, { label:'Provisioning', value:text(row,'provisioning_status') }, { label:'Go-live', value:date(row.go_live_date) }, { label:'Dernier accès', value:date(row.last_access_at) },
    ], `/angelcare-360-operator/tenants/${row.id}`)))
  }
  if (tower === 'direction' || tower === 'tenants' || tower === 'revenue') {
    subscriptions.forEach((row) => out.push(entity('subscription', row, text(row,'subscription_code'), clientName(row.client_id), [
      { label:'Valeur', value:money(row.billing_amount_mad) }, { label:'Cycle', value:text(row,'billing_cycle') }, { label:'Période', value:date(row.current_period_end) }, { label:'Tenant', value:tenantName(row.tenant_id) },
    ], `/angelcare-360-operator/subscriptions/${row.id}`)))
  }
  if (tower === 'tenants' || tower === 'revenue') {
    records(data.plans).forEach((row) => out.push(entity('plan', row, text(row,'name'), text(row,'plan_code'), [
      { label:'Mensuel', value:money(row.monthly_price_mad) }, { label:'Annuel', value:money(row.annual_price_mad) }, { label:'Cycle', value:text(row,'billing_cycle') }, { label:'Support', value:text(row,'support_level') },
    ])))
    records(data.packages).forEach((row) => out.push(entity('package', row, text(row,'name'), text(row,'package_code'), [
      { label:'Modules', value:Array.isArray(row.module_keys) ? String(row.module_keys.length) : '0' }, { label:'Fonctionnalités', value:Array.isArray(row.feature_keys) ? String(row.feature_keys.length) : '0' }, { label:'Statut', value:text(row,'status') }, { label:'Description', value:text(row,'description') },
    ])))
  }
  if (tower === 'revenue') {
    records(data.billingAccounts).forEach((row) => out.push(entity('billing-account', row, text(row,'billing_name'), clientName(row.client_id), [
      { label:'Email', value:text(row,'billing_email') }, { label:'Conditions', value:`${text(row,'payment_terms_days','0')} jours` }, { label:'Fiscal', value:text(row,'tax_identifier') }, { label:'Téléphone', value:text(row,'billing_phone') },
    ], `/angelcare-360-operator/billing/accounts/${row.id}`)))
    records(data.invoices).forEach((row) => out.push(entity('invoice', row, text(row,'invoice_number'), clientName(row.client_id), [
      { label:'Total', value:money(row.total_mad) }, { label:'Solde', value:money(row.balance_due_mad) }, { label:'Échéance', value:date(row.due_date) }, { label:'Abonnement', value:labels.subscriptionLabels[String(row.subscription_id || '')] || '—' },
    ])))
    records(data.payments).forEach((row) => out.push(entity('payment', row, text(row,'payment_reference'), clientName(row.client_id), [
      { label:'Montant', value:money(row.amount_mad) }, { label:'Date', value:date(row.payment_date) }, { label:'Méthode', value:text(row,'method') }, { label:'Facture', value:labels.invoiceLabels[String(row.invoice_id || '')] || 'Non alloué' },
    ])))
    records(data.dunning).forEach((row) => out.push(entity('dunning', row, text(row,'action_type'), clientName(row.client_id), [
      { label:'Statut', value:text(row,'status') }, { label:'Échéance', value:date(row.due_date) }, { label:'Facture', value:labels.invoiceLabels[String(row.invoice_id || '')] || 'Compte global' }, { label:'Notes', value:text(row,'notes') },
    ])))
  }
  if (tower === 'growth' || tower === 'revenue') {
    records(data.contracts).forEach((row) => out.push(entity('contract', row, text(row,'contract_code'), clientName(row.client_id), [
      { label:'Début', value:date(row.start_date) }, { label:'Fin', value:date(row.end_date) }, { label:'Renouvellement', value:date(row.renewal_date) }, { label:'Signature', value:date(row.signed_at) },
    ])))
    records(data.renewals).forEach((row) => out.push(entity('renewal', row, `Renouvellement · ${clientName(row.client_id)}`, text(row,'status'), [
      { label:'Date', value:date(row.renewal_date) }, { label:'Valeur', value:money(row.expected_amount_mad) }, { label:'Probabilité', value:row.probability === null || row.probability === undefined ? 'Indisponible' : `${row.probability}%` }, { label:'Owner', value:text(row,'owner_id','Non assigné') },
    ], `/angelcare-360-operator/renewals/${row.id}`)))
  }
  if (tower === 'service' || tower === 'direction') {
    records(data.tickets).forEach((row) => out.push(entity('ticket', row, text(row,'subject'), clientName(row.client_id), [
      { label:'Priorité', value:text(row,'priority') }, { label:'Catégorie', value:text(row,'category') }, { label:'Assigné à', value:text(row,'assigned_to','Non assigné') }, { label:'Créé', value:date(row.created_at) },
    ])))
    records(data.incidents).forEach((row) => out.push(entity('incident', row, text(row,'title'), row.client_id ? clientName(row.client_id) : tenantName(row.tenant_id), [
      { label:'Sévérité', value:text(row,'severity') }, { label:'Début', value:date(row.started_at) }, { label:'Résolu', value:date(row.resolved_at) }, { label:'Tenant', value:tenantName(row.tenant_id) },
    ], `/angelcare-360-operator/incidents/${row.id}`)))
    records(data.onboarding).forEach((row) => out.push(entity('onboarding', row, text(row,'title'), clientName(row.client_id), [
      { label:'Priorité', value:text(row,'priority') }, { label:'Échéance', value:date(row.due_date) }, { label:'Owner', value:text(row,'owner_id','Non assigné') }, { label:'Tenant', value:tenantName(row.tenant_id) },
    ])))
    records(data.requests).forEach((row) => out.push(entity('service-request', row, text(row,'title'), clientName(row.client_id), [
      { label:'Type', value:text(row,'request_type') }, { label:'Priorité', value:text(row,'priority') }, { label:'Échéance', value:date(row.due_date) }, { label:'Assigné à', value:text(row,'assigned_to','Non assigné') },
    ])))
    records(data.tasks).forEach((row) => out.push(entity('task', row, text(row,'title'), row.client_id ? clientName(row.client_id) : tenantName(row.tenant_id), [
      { label:'Priorité', value:text(row,'priority') }, { label:'Échéance', value:date(row.due_date) }, { label:'Owner', value:text(row,'owner_id','Non assigné') }, { label:'Description', value:text(row,'description') },
    ])))
    records(data.notes).forEach((row) => out.push(entity('note', row, text(row,'note_type'), row.client_id ? clientName(row.client_id) : tenantName(row.tenant_id), [
      { label:'Visibilité', value:text(row,'visibility') }, { label:'Auteur', value:text(row,'author_id','Système') }, { label:'Créée', value:date(row.created_at) }, { label:'Contenu', value:text(row,'body') },
    ])))
  }
  if (tower === 'platform' || tower === 'tenants') {
    records(data.features).forEach((row) => out.push(entity('feature', row, text(row,'feature_label'), `${clientName(row.client_id)} · ${tenantName(row.tenant_id)}`, [
      { label:'Clé', value:text(row,'feature_key') }, { label:'Module', value:text(row,'module_key') }, { label:'Activé', value:row.enabled ? 'Oui' : 'Non' }, { label:'Verrou', value:text(row,'locked_reason','Aucun') },
    ])))
    records(data.limits).forEach((row) => out.push(entity('limit', row, text(row,'label'), `${clientName(row.client_id)} · ${tenantName(row.tenant_id)}`, [
      { label:'Consommé', value:`${text(row,'current_value','0')} ${text(row,'unit','')}` }, { label:'Autorisé', value:row.allowed_value === null || row.allowed_value === undefined ? 'Illimité/non défini' : `${row.allowed_value} ${text(row,'unit','')}` }, { label:'Cycle', value:text(row,'reset_cycle') }, { label:'Clé', value:text(row,'limit_key') },
    ])))
  }
  if (tower === 'platform') {
    records(data.audit).slice(0,50).forEach((row) => out.push(entity('audit', row, `${text(row,'module')} · ${text(row,'action')}`, text(row,'entity_type'), [
      { label:'Sévérité', value:text(row,'severity') }, { label:'Acteur', value:text(row,'actor_role','Système') }, { label:'Date', value:date(row.created_at) }, { label:'Entité', value:text(row,'entity_type') },
    ])))
  }
  return out
}

function sum(rows: Record<string, unknown>[], key: string) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0)
}

function buildMetrics(tower: SovereignTowerKey, data: Record<string, unknown[]>) {
  const clients = records(data.clients), tenants = records(data.tenants), subscriptions = records(data.subscriptions), invoices = records(data.invoices), payments = records(data.payments)
  const activeClients = clients.filter((row) => ['active','pilot'].includes(text(row,'status',''))).length
  const activeTenants = tenants.filter((row) => text(row,'status','') === 'active').length
  const activeSubscriptions = subscriptions.filter((row) => text(row,'status','') === 'active').length
  const mrr = sum(subscriptions.filter((row) => text(row,'status','') === 'active'), 'billing_amount_mad')
  const overdue = sum(invoices.filter((row) => text(row,'status','') === 'overdue'), 'balance_due_mad')
  const collected = sum(payments.filter((row) => text(row,'status','') === 'confirmed'), 'amount_mad')
  const tickets = records(data.tickets), incidents = records(data.incidents), renewals = records(data.renewals)
  const common = {
    direction: [
      { key:'clients',label:'Clients actifs',value:String(activeClients),detail:`${clients.length} comptes suivis` },
      { key:'mrr',label:'MRR piloté',value:money(mrr),detail:`${activeSubscriptions} abonnements actifs` },
      { key:'exposure',label:'Exposition échue',value:money(overdue),detail:'Factures en retard' ,tone: overdue>0?'warning':'good' as const},
      { key:'pressure',label:'Pression service',value:String(tickets.filter(r=>!['resolved','closed','archived'].includes(text(r,'status',''))).length + incidents.filter(r=>!['resolved','archived'].includes(text(r,'status',''))).length),detail:'Tickets et incidents ouverts' },
    ],
    growth: [
      { key:'portfolio',label:'Portefeuille',value:String(clients.length),detail:`${activeClients} actifs ou pilotes` },
      { key:'renewals',label:'Renouvellements',value:String(renewals.length),detail:`${renewals.filter(r=>['at_risk','lost'].includes(text(r,'status',''))).length} à risque` },
      { key:'contracts',label:'Contrats',value:String(records(data.contracts).length),detail:'Relations contractuelles' },
      { key:'value',label:'Valeur récurrente',value:money(mrr),detail:'Base mensuelle active' },
    ],
    tenants: [
      { key:'fleet',label:'Flotte tenants',value:String(tenants.length),detail:`${activeTenants} actifs` },
      { key:'provisioning',label:'Provisioning',value:String(tenants.filter(r=>text(r,'provisioning_status','')!=='active').length),detail:'Environnements non finalisés' },
      { key:'features',label:'Entitlements',value:String(records(data.features).length),detail:`${records(data.features).filter(r=>Boolean(r.enabled)).length} activés` },
      { key:'limits',label:'Limites suivies',value:String(records(data.limits).length),detail:'Capacité et consommation' },
    ],
    revenue: [
      { key:'mrr',label:'MRR actif',value:money(mrr),detail:`${activeSubscriptions} abonnements` },
      { key:'invoiced',label:'Facturé',value:money(sum(invoices,'total_mad')),detail:`${invoices.length} factures` },
      { key:'collected',label:'Encaissé confirmé',value:money(collected),detail:`${payments.length} paiements enregistrés` },
      { key:'overdue',label:'Échu',value:money(overdue),detail:`${invoices.filter(r=>text(r,'status','')==='overdue').length} factures`,tone: overdue>0?'critical':'good' as const },
    ],
    service: [
      { key:'onboarding',label:'Missions activation',value:String(records(data.onboarding).length),detail:`${records(data.onboarding).filter(r=>['blocked','in_progress'].includes(text(r,'status',''))).length} sous pression` },
      { key:'tickets',label:'Tickets',value:String(tickets.length),detail:`${tickets.filter(r=>!['resolved','closed','archived'].includes(text(r,'status',''))).length} ouverts` },
      { key:'incidents',label:'Incidents',value:String(incidents.length),detail:`${incidents.filter(r=>!['resolved','archived'].includes(text(r,'status',''))).length} actifs` },
      { key:'tasks',label:'Travaux service',value:String(records(data.tasks).length),detail:'Actions et suivis' },
    ],
    platform: [
      { key:'audit',label:'Événements audités',value:String(records(data.audit).length),detail:'Traçabilité disponible' },
      { key:'features',label:'Contrôles produit',value:String(records(data.features).length),detail:'Feature flags et entitlements' },
      { key:'tenants',label:'Périmètre protégé',value:String(tenants.length),detail:`${clients.length} clients` },
      { key:'incidents',label:'Incidents plateforme',value:String(incidents.length),detail:'Sécurité et stabilité' },
    ],
  }
  return common[tower].map((metric) => ({ ...metric, tone: ('tone' in metric && metric.tone ? metric.tone : 'neutral') as 'neutral' | 'good' | 'warning' | 'critical' }))
}

function buildRelationships(data: Record<string, unknown[]>) {
  const relationships: Record<string, string[]> = {}
  for (const rows of Object.values(data)) {
    for (const row of records(rows)) {
      const id = String(row.id || '')
      if (!id) continue
      const connected = [row.client_id, row.tenant_id, row.subscription_id, row.invoice_id, row.billing_account_id].filter(Boolean).map(String)
      relationships[id] = Array.from(new Set(connected))
    }
  }
  return relationships
}
