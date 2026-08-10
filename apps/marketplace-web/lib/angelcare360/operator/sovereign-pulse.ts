import { asNumber, asString, safeList, summarizeMoney } from './shared'
import { requireAngelcare360OperatorPermission } from './access'
import type {
  SovereignPulseCustomerNode,
  SovereignPulseEvent,
  SovereignPulseExperienceSector,
  SovereignPulseMission,
  SovereignPulsePlatformService,
  SovereignPulsePriority,
  SovereignPulseRevenueStage,
  SovereignPulseSnapshot,
  SovereignPulseSourceState,
  SovereignPulseTenantStage,
  SovereignPulseTone,
  SovereignPulseTower,
} from '@/types/angelcare360/operator/sovereign-pulse'

type Row = Record<string, unknown>

const nowIso = () => new Date().toISOString()
const money = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} Dh`
const compactMoney = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Dh`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K Dh`
  return money(value)
}

function firstString(row: Row | undefined, keys: string[], fallback = '') {
  if (!row) return fallback
  for (const key of keys) {
    const value = asString(row[key])
    if (value) return value
  }
  return fallback
}

function firstNumber(row: Row | undefined, keys: string[], fallback = 0) {
  if (!row) return fallback
  for (const key of keys) {
    const value = asNumber(row[key], Number.NaN)
    if (Number.isFinite(value)) return value
  }
  return fallback
}

function dateValue(row: Row | undefined, keys: string[]) {
  const value = firstString(row, keys)
  const parsed = value ? new Date(value).getTime() : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeStatus(row: Row | undefined) {
  return firstString(row, ['status', 'state', 'lifecycle_stage', 'stage'], 'unknown').toLowerCase()
}

function isOpenStatus(status: string) {
  return !['closed', 'resolved', 'done', 'paid', 'cancelled', 'canceled', 'archived', 'expired', 'lost', 'rejected', 'inactive'].includes(status)
}

function toneFromPressure(value: number): SovereignPulseTone {
  if (value >= 75) return 'critical'
  if (value >= 45) return 'warning'
  if (value >= 20) return 'info'
  return 'good'
}

const MOROCCO_CITY_COORDINATES: Record<string, [number, number]> = {
  agadir: [30.4278, -9.5981],
  beni_mellal: [32.3373, -6.3498],
  berrechid: [33.2655, -7.5875],
  casablanca: [33.5731, -7.5898],
  dakhla: [23.6848, -15.9570],
  el_jadida: [33.2316, -8.5007],
  essaouira: [31.5085, -9.7595],
  fes: [34.0181, -5.0078],
  kenitra: [34.2610, -6.5802],
  khouribga: [32.8860, -6.9063],
  laayoune: [27.1536, -13.2033],
  marrakech: [31.6295, -7.9811],
  meknes: [33.8935, -5.5473],
  mohammedia: [33.6861, -7.3828],
  nador: [35.1681, -2.9335],
  oujda: [34.6814, -1.9086],
  rabat: [34.0209, -6.8416],
  safi: [32.2994, -9.2372],
  sale: [34.0337, -6.7985],
  settat: [33.0010, -7.6166],
  tangier: [35.7595, -5.8340],
  tanger: [35.7595, -5.8340],
  temara: [33.9287, -6.9066],
  tetouan: [35.5889, -5.3626],
}

const MOROCCO_CITY_ALIASES: Record<string, string> = {
  casa: 'casablanca',
  casablanca: 'casablanca',
  rabat: 'rabat',
  kenitra: 'kenitra',
  fes: 'fes',
  tanger: 'tanger',
  tangier: 'tanger',
  marrakech: 'marrakech',
  agadir: 'agadir',
  temara: 'temara',
  sale: 'sale',
  mohammedia: 'mohammedia',
  tetouan: 'tetouan',
  meknes: 'meknes',
  oujda: 'oujda',
  nador: 'nador',
  el_jadida: 'el_jadida',
  jadida: 'el_jadida',
}

const MOROCCO_CITY_LABELS: Record<string, string> = {
  casablanca: 'Casablanca', rabat: 'Rabat', kenitra: 'Kénitra', fes: 'Fès',
  tanger: 'Tanger', marrakech: 'Marrakech', agadir: 'Agadir', temara: 'Témara',
  sale: 'Salé', mohammedia: 'Mohammedia', tetouan: 'Tétouan', meknes: 'Meknès',
  oujda: 'Oujda', nador: 'Nador', el_jadida: 'El Jadida',
}

function normalizeLocationKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function cityKeyFromText(value: string) {
  const normalized = normalizeLocationKey(value)
  const tokens = normalized.split('_').filter(Boolean)
  for (const [alias, key] of Object.entries(MOROCCO_CITY_ALIASES)) {
    if (tokens.includes(alias) || normalized.includes(alias)) return key
  }
  return Object.keys(MOROCCO_CITY_COORDINATES).find((key) => normalized.includes(key) || key.includes(normalized)) || ''
}

function customerCity(row: Row) {
  const explicit = firstString(row, ['city', 'address_city', 'billing_city', 'site_city', 'campus_city', 'town', 'locality', 'municipality'])
  const evidence = [
    explicit,
    firstString(row, ['region', 'province', 'area']),
    firstString(row, ['address', 'address_line_1', 'street_address', 'billing_address']),
    firstString(row, ['client_code', 'code']),
    firstString(row, ['legal_name', 'trade_name', 'name', 'organization_name']),
  ].filter(Boolean).join(' ')
  const key = cityKeyFromText(evidence)
  return key ? (MOROCCO_CITY_LABELS[key] || key.replaceAll('_', ' ')) : (explicit || 'Maroc')
}

function deterministicOffset(seed: string, axis: 'lat' | 'lng') {
  let hash = axis === 'lat' ? 17 : 29
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return ((hash % 1000) / 1000 - 0.5) * 0.055
}

function customerLocation(row: Row, id: string, city: string) {
  const directLatitude = firstNumber(row, ['latitude', 'lat', 'location_latitude', 'location_lat', 'geo_latitude'], Number.NaN)
  const directLongitude = firstNumber(row, ['longitude', 'lng', 'lon', 'location_longitude', 'location_lng', 'geo_longitude'], Number.NaN)
  if (Number.isFinite(directLatitude) && Number.isFinite(directLongitude) && directLatitude >= 20 && directLatitude <= 37 && directLongitude >= -18 && directLongitude <= 1) {
    return { latitude: directLatitude, longitude: directLongitude, locationPrecision: 'exact' as const }
  }

  const normalizedCity = normalizeLocationKey(city)
  const resolvedCityKey = MOROCCO_CITY_ALIASES[normalizedCity] || cityKeyFromText(city)
  const directCity = MOROCCO_CITY_COORDINATES[resolvedCityKey || normalizedCity]
  const fuzzyCityKey = Object.keys(MOROCCO_CITY_COORDINATES).find((key) => normalizedCity.includes(key) || key.includes(normalizedCity))
  const resolved = directCity || (fuzzyCityKey ? MOROCCO_CITY_COORDINATES[fuzzyCityKey] : null)
  if (resolved) {
    return {
      latitude: resolved[0] + deterministicOffset(id, 'lat'),
      longitude: resolved[1] + deterministicOffset(id, 'lng'),
      locationPrecision: 'city' as const,
    }
  }

  const region = firstString(row, ['region', 'province', 'area'])
  const normalizedRegion = normalizeLocationKey(region)
  const regionKey = Object.keys(MOROCCO_CITY_COORDINATES).find((key) => normalizedRegion.includes(key) || key.includes(normalizedRegion))
  if (regionKey) {
    const coordinate = MOROCCO_CITY_COORDINATES[regionKey]
    return {
      latitude: coordinate[0] + deterministicOffset(id, 'lat') * 1.8,
      longitude: coordinate[1] + deterministicOffset(id, 'lng') * 1.8,
      locationPrecision: 'regional' as const,
    }
  }

  return {
    latitude: 31.7917 + deterministicOffset(id, 'lat') * 14,
    longitude: -7.0926 + deterministicOffset(id, 'lng') * 22,
    locationPrecision: 'fallback' as const,
  }
}

function renewalDaysForCustomer(row: Row) {
  const explicit = firstNumber(row, ['renewal_days', 'days_to_renewal'], Number.NaN)
  if (Number.isFinite(explicit)) return Math.round(explicit)
  const renewalAt = dateValue(row, ['renewal_at', 'next_renewal_at', 'renewal_date', 'contract_end_date', 'subscription_end_at'])
  if (!renewalAt) return null
  return Math.ceil((renewalAt - Date.now()) / 86_400_000)
}

async function readRows(table: string, limit = 250, orderColumn = 'created_at') {
  const rows = await safeList(table, '*', [], [orderColumn, { ascending: false }], limit)
  return rows as Row[]
}

async function readCandidates(candidates: string[], limit = 250, orderColumn = 'created_at') {
  const results = await Promise.all(candidates.map((table) => readRows(table, limit, orderColumn)))
  return results.find((rows) => rows.length > 0) || []
}

function source(key: string, label: string, rows: Row[], message?: string): SovereignPulseSourceState {
  return {
    key,
    label,
    state: rows.length > 0 ? 'live' : 'partial',
    count: rows.length,
    updatedAt: nowIso(),
    message: rows.length > 0 ? null : message || 'Aucun enregistrement disponible ou source non initialisée.',
  }
}

function buildEvents(groups: Array<{ domain: SovereignPulseEvent['domain']; rows: Row[]; href: string; fallbackTitle: string }>) {
  const events: SovereignPulseEvent[] = []
  for (const group of groups) {
    group.rows.slice(0, 12).forEach((row, index) => {
      const status = normalizeStatus(row)
      events.push({
        id: firstString(row, ['id'], `${group.domain}-${index}`),
        occurredAt: firstString(row, ['occurred_at', 'created_at', 'updated_at', 'sent_at', 'paid_at'], nowIso()),
        domain: group.domain,
        title: firstString(row, ['title', 'subject', 'event_type', 'action', 'name'], group.fallbackTitle),
        summary: firstString(row, ['summary', 'description', 'message', 'notes', 'status'], status),
        context: firstString(row, ['customer_name', 'client_name', 'tenant_name', 'organization_name', 'entity_type'], 'AngelCare 360'),
        tone: ['failed', 'critical', 'blocked', 'overdue', 'suspended'].some((needle) => status.includes(needle))
          ? 'critical'
          : ['warning', 'pending', 'waiting', 'at_risk'].some((needle) => status.includes(needle))
            ? 'warning'
            : ['active', 'sent', 'paid', 'resolved', 'published'].some((needle) => status.includes(needle))
              ? 'good'
              : 'info',
        href: group.href,
      })
    })
  }
  return events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 28)
}

export async function getSovereignPulseSnapshot(): Promise<SovereignPulseSnapshot> {
  await requireAngelcare360OperatorPermission('operator.audit.view')

  const [
    clients,
    subscriptions,
    invoices,
    payments,
    contracts,
    renewals,
    tenants,
    onboarding,
    supportTickets,
    incidents,
    customerCases,
    interventions,
    opportunities,
    offers,
    tenantAccess,
    invitations,
    emailMessages,
    emailExecutions,
    emailDeliveryEvents,
    productSnapshots,
    brandProfiles,
    storageEvents,
    auditEvents,
    tasks,
  ] = await Promise.all([
    readRows('angelcare360_operator_clients', 300),
    readRows('angelcare360_operator_subscriptions', 300),
    readRows('angelcare360_operator_invoices', 300),
    readRows('angelcare360_operator_payments', 300),
    readRows('angelcare360_operator_contracts', 250),
    readRows('angelcare360_operator_renewals', 250),
    readRows('angelcare360_operator_tenants', 300),
    readRows('angelcare360_operator_onboarding_tasks', 300),
    readRows('angelcare360_operator_support_tickets', 300),
    readRows('angelcare360_operator_incidents', 250),
    readCandidates(['angelcare360_operator_customer_cases', 'angelcare360_operator_growth_customer_cases'], 300),
    readCandidates(['angelcare360_operator_customer_interventions', 'angelcare360_operator_growth_interventions'], 250),
    readRows('angelcare360_operator_growth_opportunities', 300),
    readRows('angelcare360_operator_growth_offers', 300),
    readCandidates(['angelcare360_operator_tenant_access_accounts', 'angelcare360_operator_tenant_admin_accounts'], 300),
    readRows('angelcare360_operator_tenant_admin_invitations', 300),
    readCandidates(['angelcare360_operator_email_messages', 'email_os_messages', 'email_messages'], 350),
    readCandidates(['angelcare360_operator_email_automation_executions', 'email_automation_executions'], 250),
    readCandidates(['angelcare360_operator_email_delivery_events', 'email_delivery_events'], 300),
    readRows('angelcare360_operator_tenant_entitlement_snapshots', 300),
    readRows('angelcare360_operator_brand_profiles', 200),
    readRows('angelcare_storage_events', 200),
    readRows('angelcare360_operator_audit_logs', 300),
    readCandidates(['angelcare360_operator_tasks', 'tasks'], 300),
  ])

  const activeClients = clients.filter((row) => ['active', 'pilot', 'live'].includes(normalizeStatus(row)))
  const atRiskClients = clients.filter((row) => ['at_risk', 'warning', 'suspended'].includes(normalizeStatus(row)))
  const activeSubscriptions = subscriptions.filter((row) => ['active', 'trial', 'live'].includes(normalizeStatus(row)))
  const activeTenants = tenants.filter((row) => ['active', 'live', 'operational', 'provisioned'].includes(normalizeStatus(row)))
  const openCases = [...supportTickets, ...customerCases].filter((row) => isOpenStatus(normalizeStatus(row)))
  const criticalCases = openCases.filter((row) => ['urgent', 'critical', 'p0', 'p1'].includes(firstString(row, ['priority', 'severity']).toLowerCase()))
  const overdueInvoices = invoices.filter((row) => ['overdue', 'past_due'].includes(normalizeStatus(row)))
  const openIncidents = incidents.filter((row) => isOpenStatus(normalizeStatus(row)))
  const openInterventions = interventions.filter((row) => isOpenStatus(normalizeStatus(row)))
  const pendingInvitations = invitations.filter((row) => ['ready', 'invited', 'opened', 'activation_pending', 'manual_link_ready'].includes(normalizeStatus(row)))

  const activeMrr = summarizeMoney(activeSubscriptions.map((row) => row.billing_amount_mad ?? row.monthly_price_mad ?? row.mrr_mad))
  const pipelineValue = summarizeMoney(opportunities.filter((row) => isOpenStatus(normalizeStatus(row))).map((row) => row.expected_arr_mad ?? row.expected_value_mad ?? row.amount_mad))
  const weightedForecast = opportunities.reduce((sum, row) => {
    const value = firstNumber(row, ['expected_arr_mad', 'expected_value_mad', 'amount_mad'])
    const probability = firstNumber(row, ['probability'], 40)
    return sum + value * Math.max(0, Math.min(100, probability)) / 100
  }, 0)
  const offeredValue = summarizeMoney(offers.filter((row) => !['rejected', 'expired', 'archived'].includes(normalizeStatus(row))).map((row) => row.contract_value_mad ?? row.annual_price_mad ?? row.total_mad))
  const contractedValue = summarizeMoney(contracts.filter((row) => ['active', 'executed', 'signed'].includes(normalizeStatus(row))).map((row) => row.contract_value_mad ?? row.annual_value_mad ?? row.amount_mad))
  const invoicedValue = summarizeMoney(invoices.map((row) => row.total_mad ?? row.amount_mad ?? row.total_amount_mad))
  const collectedValue = summarizeMoney(payments.map((row) => row.amount_mad ?? row.paid_amount_mad))
  const overdueValue = summarizeMoney(overdueInvoices.map((row) => row.balance_due_mad ?? row.amount_due_mad ?? row.total_mad))
  const renewedValue = summarizeMoney(renewals.filter((row) => ['renewed', 'won', 'completed'].includes(normalizeStatus(row))).map((row) => row.renewal_value_mad ?? row.amount_mad))

  const sourceRows = [
    source('customers', 'Clients', clients),
    source('commercial', 'Commercial', opportunities, 'Les tables Growth ne contiennent encore aucune opportunité.'),
    source('tenants', 'Tenants', tenants),
    source('service', 'Service & cases', [...supportTickets, ...customerCases, ...incidents]),
    source('finance', 'Finance', [...invoices, ...payments]),
    source('communications', 'Email & correspondance', [...emailMessages, ...emailExecutions]),
    source('platform', 'Plateforme & audit', [...auditEvents, ...storageEvents]),
    source('product', 'Produit & entitlements', productSnapshots),
  ]
  const liveSourceCount = sourceRows.filter((item) => item.state === 'live').length
  const sourceState = liveSourceCount === sourceRows.length ? 'live' : liveSourceCount >= 3 ? 'partial' : 'unavailable'

  const operationalPressure = criticalCases.length * 6 + overdueInvoices.length * 2 + openIncidents.length * 4 + pendingInvitations.length
  const globalHealth = Math.max(22, Math.min(99, Math.round(98 - operationalPressure * 0.75 - (sourceRows.length - liveSourceCount) * 2)))

  const revenueFlow: SovereignPulseRevenueStage[] = [
    { key: 'pipeline', label: 'Pipeline', value: pipelineValue, displayValue: compactMoney(pipelineValue), target: Math.max(pipelineValue * 1.18, 1), blocked: 0, atRisk: pipelineValue * 0.12, conversion: 100, href: '/angelcare-360-operator/growth?view=pipeline' },
    { key: 'forecast', label: 'Forecast pondéré', value: weightedForecast, displayValue: compactMoney(weightedForecast), target: Math.max(pipelineValue * 0.45, 1), blocked: 0, atRisk: weightedForecast * 0.15, conversion: pipelineValue ? Math.round(weightedForecast / pipelineValue * 100) : 0, href: '/angelcare-360-operator/growth?view=performance' },
    { key: 'offered', label: 'Offres', value: offeredValue, displayValue: compactMoney(offeredValue), target: Math.max(weightedForecast * 0.82, 1), blocked: 0, atRisk: offeredValue * 0.08, conversion: weightedForecast ? Math.round(offeredValue / weightedForecast * 100) : 0, href: '/angelcare-360-operator/growth?view=offers' },
    { key: 'contracted', label: 'Contracté', value: contractedValue, displayValue: compactMoney(contractedValue), target: Math.max(offeredValue * 0.68, 1), blocked: 0, atRisk: contractedValue * 0.04, conversion: offeredValue ? Math.round(contractedValue / offeredValue * 100) : 0, href: '/angelcare-360-operator/growth?view=contracts' },
    { key: 'activated', label: 'MRR activé', value: activeMrr, displayValue: compactMoney(activeMrr), target: Math.max(activeMrr * 1.12, 1), blocked: 0, atRisk: activeMrr * Math.min(0.3, atRiskClients.length / Math.max(1, clients.length)), conversion: contractedValue ? Math.round(activeMrr * 12 / contractedValue * 100) : 0, href: '/angelcare-360-operator/tenants-product?view=deployments' },
    { key: 'invoiced', label: 'Facturé', value: invoicedValue, displayValue: compactMoney(invoicedValue), target: Math.max(activeMrr, 1), blocked: overdueValue, atRisk: overdueValue, conversion: activeMrr ? Math.round(invoicedValue / activeMrr * 100) : 0, href: '/angelcare-360-operator/billing/invoices' },
    { key: 'collected', label: 'Collecté', value: collectedValue, displayValue: compactMoney(collectedValue), target: Math.max(invoicedValue, 1), blocked: overdueValue, atRisk: overdueValue, conversion: invoicedValue ? Math.round(collectedValue / invoicedValue * 100) : 0, href: '/angelcare-360-operator/billing/payments' },
    { key: 'renewed', label: 'Renouvelé', value: renewedValue, displayValue: compactMoney(renewedValue), target: Math.max(contractedValue * 0.75, 1), blocked: 0, atRisk: 0, conversion: contractedValue ? Math.round(renewedValue / contractedValue * 100) : 0, href: '/angelcare-360-operator/growth?view=renewals' },
  ]

  const customerNodes: SovereignPulseCustomerNode[] = clients.slice(0, 30).map((row, index) => {
    const status = normalizeStatus(row)
    const healthRaw = firstNumber(row, ['health_score', 'customer_health_score'], status === 'active' ? 82 : status === 'at_risk' ? 48 : 68)
    const state: SovereignPulseCustomerNode['state'] = status === 'suspended' || status === 'inactive'
      ? 'inactive'
      : healthRaw < 45
        ? 'intervention'
        : healthRaw < 65
          ? 'attention'
          : status === 'pilot' || status === 'onboarding'
            ? 'onboarding'
            : 'healthy'
    const id = firstString(row, ['id'], `client-${index}`)
    const city = customerCity(row)
    const location = customerLocation(row, id, city)
    return {
      id,
      label: firstString(row, ['legal_name', 'trade_name', 'name', 'organization_name'], `Client ${index + 1}`),
      code: firstString(row, ['client_code', 'code'], `AC-${String(index + 1).padStart(3, '0')}`),
      segment: firstString(row, ['segment', 'organization_type', 'client_type'], 'Éducation'),
      city,
      addressLabel: firstString(row, ['address', 'address_line_1', 'street_address', 'billing_address'], city),
      latitude: location.latitude,
      longitude: location.longitude,
      locationPrecision: location.locationPrecision,
      value: firstNumber(row, ['mrr_mad', 'annual_value_mad', 'contract_value_mad'], 1),
      health: Math.max(0, Math.min(100, Math.round(healthRaw))),
      state,
      renewalDays: renewalDaysForCustomer(row),
      openCases: firstNumber(row, ['open_cases'], 0),
      href: `/angelcare-360-operator/growth?view=portfolio&client=${encodeURIComponent(id)}`,
    }
  })

  const stageDefinitions = [
    ['contracted', 'Contracté'],
    ['provisioning', 'Provisioning'],
    ['admin_activation', 'Activation admin'],
    ['configuration', 'Configuration'],
    ['entitlement', 'Compilation'],
    ['training', 'Formation'],
    ['go_live', 'Go-live'],
    ['operational', 'Opérationnel'],
  ] as const
  const tenantStages: SovereignPulseTenantStage[] = stageDefinitions.map(([key, label]) => {
    const related = tenants.filter((row) => {
      const stage = firstString(row, ['provisioning_status', 'deployment_stage', 'status']).toLowerCase()
      if (key === 'operational') return ['active', 'operational', 'live'].includes(stage)
      if (key === 'admin_activation') return ['admin_pending', 'activation_pending', 'invited'].includes(stage)
      return stage.includes(key)
    })
    const blocked = related.filter((row) => firstString(row, ['blocker_reason', 'blocking_reason']) || normalizeStatus(row) === 'blocked').length
    return { key, label, count: related.length, blocked, tone: blocked ? 'warning' : related.length ? 'good' : 'neutral', href: '/angelcare-360-operator/tenants-product?view=deployments' }
  })

  const experience: SovereignPulseExperienceSector[] = [
    { key: 'support', label: 'Support', rows: supportTickets, href: '/angelcare-360-operator/growth?view=health' },
    { key: 'complaints', label: 'Réclamations', rows: customerCases.filter((row) => firstString(row, ['case_type']).includes('complaint')), href: '/angelcare-360-operator/growth?view=health' },
    { key: 'incidents', label: 'Incidents', rows: incidents, href: '/angelcare-360-operator/incidents' },
    { key: 'implementation', label: 'Implémentation', rows: onboarding, href: '/angelcare-360-operator/onboarding' },
    { key: 'finance', label: 'Finance', rows: overdueInvoices, href: '/angelcare-360-operator/billing/balances' },
    { key: 'product', label: 'Produit', rows: productSnapshots.filter((row) => firstString(row, ['drift_status', 'status']).toLowerCase().includes('drift')), href: '/angelcare-360-operator/tenants-product?view=deployments' },
    { key: 'access', label: 'Accès', rows: pendingInvitations, href: '/angelcare-360-operator/tenants-product?view=deployments' },
    { key: 'relationship', label: 'Relation', rows: interventions, href: '/angelcare-360-operator/growth?view=health' },
  ].map((item) => {
    const rows = item.rows as Row[]
    const open = rows.filter((row) => isOpenStatus(normalizeStatus(row))).length
    const critical = rows.filter((row) => ['critical', 'urgent', 'p0', 'p1', 'blocked'].includes(firstString(row, ['severity', 'priority', 'status']).toLowerCase())).length
    const pressure = Math.min(100, open * 8 + critical * 17)
    return { key: item.key, label: item.label, pressure, openCount: open, criticalCount: critical, trend: critical ? 'up' : open ? 'stable' : 'down', tone: toneFromPressure(pressure), href: item.href } as SovereignPulseExperienceSector
  })

  const emailStatusCount = (needles: string[]) => emailMessages.filter((row) => needles.some((needle) => normalizeStatus(row).includes(needle))).length
  const emailFlow = [
    { key: 'generated', label: 'Générés', count: emailMessages.length, tone: 'info' as const, href: '/angelcare-360-operator/email-command?view=command' },
    { key: 'approval', label: 'Approbation', count: emailStatusCount(['approval', 'pending']), tone: 'warning' as const, href: '/angelcare-360-operator/email-command?view=approvals' },
    { key: 'queued', label: 'File', count: emailStatusCount(['queued', 'scheduled']), tone: 'info' as const, href: '/angelcare-360-operator/email-command?view=outbound' },
    { key: 'processing', label: 'Bridge', count: emailStatusCount(['processing', 'bridge']), tone: 'info' as const, href: '/angelcare-360-operator/email-command?view=deliverability' },
    { key: 'accepted', label: 'SMTP accepté', count: emailStatusCount(['sent', 'accepted', 'delivered']), tone: 'good' as const, href: '/angelcare-360-operator/email-command?view=outbound' },
    { key: 'replied', label: 'Réponses', count: emailStatusCount(['replied', 'inbound']), tone: 'good' as const, href: '/angelcare-360-operator/email-command?view=inbound' },
    { key: 'failed', label: 'Échecs', count: emailStatusCount(['failed', 'bounced', 'permanent']), tone: 'critical' as const, href: '/angelcare-360-operator/email-command?view=deliverability' },
  ]

  const platformServices: SovereignPulsePlatformService[] = [
    { key: 'web', label: 'Application web', healthy: true, rows: auditEvents, href: '/angelcare-360-operator/platform' },
    { key: 'database', label: 'Supabase / DB', healthy: liveSourceCount >= 3, rows: clients, href: '/angelcare-360-operator/platform' },
    { key: 'email_bridge', label: 'Windows Email Bridge', healthy: emailDeliveryEvents.length > 0 || emailMessages.length === 0, rows: emailDeliveryEvents, href: '/angelcare-360-operator/email-command?view=deliverability' },
    { key: 'storage', label: 'Windows Storage Node', healthy: storageEvents.length > 0 || brandProfiles.length === 0, rows: storageEvents, href: '/angelcare-360-operator/brand-governance?view=assets' },
    { key: 'smtp', label: 'SMTP Menara', healthy: emailFlow.find((item) => item.key === 'failed')?.count === 0, rows: emailDeliveryEvents, href: '/angelcare-360-operator/email-command?view=deliverability' },
    { key: 'pop3', label: 'POP3 Inbound', healthy: emailMessages.length > 0 || emailExecutions.length === 0, rows: emailMessages, href: '/angelcare-360-operator/email-command?view=inbound' },
    { key: 'auth', label: 'Identité & sessions', healthy: true, rows: tenantAccess, href: '/angelcare-360-operator/tenants-product?view=deployments' },
    { key: 'automation', label: 'Automation Worker', healthy: emailExecutions.length > 0 || emailMessages.length === 0, rows: emailExecutions, href: '/angelcare-360-operator/email-command?view=automation' },
    { key: 'entitlements', label: 'Entitlement Compiler', healthy: productSnapshots.length > 0 || tenants.length === 0, rows: productSnapshots, href: '/angelcare-360-operator/tenants-product?view=deployments' },
  ].map((item) => {
    const newest = item.rows.reduce((max, row) => Math.max(max, dateValue(row, ['updated_at', 'created_at', 'occurred_at'])), 0)
    const ageMinutes = newest ? Math.max(0, Math.round((Date.now() - newest) / 60000)) : null
    return {
      key: item.key,
      label: item.label,
      status: item.healthy ? 'healthy' : item.rows.length ? 'degraded' : 'unknown',
      latencyLabel: item.healthy ? '< 1.2 s' : 'À vérifier',
      freshnessLabel: ageMinutes === null ? 'Aucune preuve récente' : ageMinutes < 1 ? 'À l’instant' : `${ageMinutes} min`,
      impact: item.healthy ? 'Opérationnel' : 'Source partielle ou preuve de santé indisponible',
      href: item.href,
    } as SovereignPulsePlatformService
  })

  const priorities: SovereignPulsePriority[] = []
  const addPriority = (priority: Omit<SovereignPulsePriority, 'id' | 'rank'>) => priorities.push({ ...priority, id: `priority-${priorities.length + 1}`, rank: priorities.length + 1 })
  if (criticalCases.length) addPriority({ category: 'intervention', title: `${criticalCases.length} dossier(s) critique(s)`, context: 'Support, réclamations ou incidents', impact: 'Risque relationnel et renouvellement', evidence: 'Sévérité urgente/critique détectée', owner: 'Customer Operations', deadlineLabel: 'Immédiat', tone: 'critical', href: '/angelcare-360-operator/growth?view=health' })
  if (overdueInvoices.length) addPriority({ category: 'deadline', title: `${overdueInvoices.length} facture(s) en retard`, context: compactMoney(overdueValue), impact: 'Exposition de trésorerie', evidence: 'Statut overdue/past_due', owner: 'Finance', deadlineLabel: 'Aujourd’hui', tone: overdueValue > activeMrr ? 'critical' : 'warning', href: '/angelcare-360-operator/billing/balances' })
  if (pendingInvitations.length) addPriority({ category: 'blocker', title: `${pendingInvitations.length} activation(s) administrateur en attente`, context: 'Accès tenant', impact: 'Risque de blocage go-live', evidence: 'Invitation non finalisée', owner: 'Customer Operations', deadlineLabel: '< 24 h', tone: 'warning', href: '/angelcare-360-operator/tenants-product?view=deployments' })
  if (openIncidents.length) addPriority({ category: 'intervention', title: `${openIncidents.length} incident(s) ouvert(s)`, context: 'Plateforme ou service client', impact: 'Continuité opérationnelle', evidence: 'Incident non résolu', owner: 'Platform & Service', deadlineLabel: 'Surveillance active', tone: openIncidents.length > 2 ? 'critical' : 'warning', href: '/angelcare-360-operator/incidents' })
  if (weightedForecast > contractedValue) addPriority({ category: 'opportunity', title: `${compactMoney(Math.max(0, weightedForecast - contractedValue))} à convertir`, context: 'Forecast non encore contracté', impact: 'Accélération du revenu', evidence: 'Écart forecast / contracté', owner: 'Commercial', deadlineLabel: 'Cette semaine', tone: 'info', href: '/angelcare-360-operator/growth?view=pipeline' })
  if (!priorities.length) addPriority({ category: 'delegated', title: 'Réseau opérationnel sous contrôle', context: 'Aucune alerte prioritaire détectée', impact: 'Maintenir la cadence', evidence: 'Sources disponibles sans exposition critique', owner: 'Direction', deadlineLabel: 'Surveillance continue', tone: 'good', href: '/angelcare-360-operator' })

  const towers: SovereignPulseTower[] = [
    { key: 'direction', number: '01', label: 'Direction Générale', shortLabel: 'Direction', health: globalHealth, tone: globalHealth < 65 ? 'warning' : 'good', primarySignal: `${priorities.filter((item) => item.category === 'decision').length} décision(s)`, secondarySignal: `${priorities.length} priorité(s)`, valueLabel: `${globalHealth}%`, href: '/angelcare-360-operator/direction' },
    { key: 'growth', number: '02', label: 'Clients & Croissance', shortLabel: 'Croissance', health: Math.max(30, 92 - atRiskClients.length * 7), tone: atRiskClients.length ? 'warning' : 'good', primarySignal: `${opportunities.filter((row) => isOpenStatus(normalizeStatus(row))).length} opportunité(s)`, secondarySignal: `${atRiskClients.length} client(s) à risque`, valueLabel: compactMoney(weightedForecast), href: '/angelcare-360-operator/growth' },
    { key: 'product', number: '03', label: 'Tenants & Produit', shortLabel: 'Tenants', health: Math.max(30, 95 - pendingInvitations.length * 3 - tenantStages.reduce((sum, item) => sum + item.blocked, 0) * 6), tone: pendingInvitations.length ? 'warning' : 'good', primarySignal: `${activeTenants.length} tenant(s) actif(s)`, secondarySignal: `${pendingInvitations.length} activation(s)`, valueLabel: `${activeSubscriptions.length} abonn.`, href: '/angelcare-360-operator/tenants-product' },
    { key: 'revenue', number: '04', label: 'Revenus & Contrats', shortLabel: 'Revenus', health: Math.max(25, 96 - overdueInvoices.length * 5), tone: overdueInvoices.length ? 'warning' : 'good', primarySignal: `${contracts.length} contrat(s)`, secondarySignal: `${overdueInvoices.length} encours`, valueLabel: compactMoney(activeMrr), href: '/angelcare-360-operator/revenue' },
    { key: 'service', number: '05', label: 'Déploiement & Service', shortLabel: 'Service', health: Math.max(20, 97 - criticalCases.length * 10 - openIncidents.length * 5), tone: criticalCases.length ? 'critical' : openCases.length ? 'warning' : 'good', primarySignal: `${openCases.length} case(s) ouvert(s)`, secondarySignal: `${openIncidents.length} incident(s)`, valueLabel: `${openInterventions.length} recovery`, href: '/angelcare-360-operator/service' },
    { key: 'platform', number: '06', label: 'Plateforme & Contrôle', shortLabel: 'Plateforme', health: Math.round(platformServices.filter((item) => item.status === 'healthy').length / Math.max(1, platformServices.length) * 100), tone: platformServices.some((item) => item.status === 'degraded') ? 'warning' : 'good', primarySignal: `${platformServices.filter((item) => item.status === 'healthy').length}/${platformServices.length} services`, secondarySignal: `${emailFlow.find((item) => item.key === 'failed')?.count || 0} email fail`, valueLabel: `${brandProfiles.filter((row) => normalizeStatus(row) === 'published').length} brand(s)`, href: '/angelcare-360-operator/platform' },
  ]

  const missionRows = [...tasks, ...onboarding, ...renewals].sort((a, b) => dateValue(a, ['due_at', 'due_date', 'scheduled_at']) - dateValue(b, ['due_at', 'due_date', 'scheduled_at']))
  const missions: SovereignPulseMission[] = missionRows.slice(0, 10).map((row, index) => {
    const due = firstString(row, ['due_at', 'due_date', 'scheduled_at', 'next_action_at'])
    const dueDate = due ? new Date(due) : null
    const overdue = dueDate ? dueDate.getTime() < Date.now() : false
    const status = normalizeStatus(row)
    const blocked = status === 'blocked' || Boolean(firstString(row, ['blocker_reason']))
    return {
      id: firstString(row, ['id'], `mission-${index}`),
      timeLabel: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
      title: firstString(row, ['title', 'name', 'next_action'], 'Mission opérationnelle'),
      context: firstString(row, ['customer_name', 'client_name', 'tenant_name', 'organization_name'], 'AngelCare 360'),
      owner: firstString(row, ['owner_name', 'assignee_name', 'department'], 'Équipe AngelCare'),
      readiness: blocked ? 28 : overdue ? 44 : ['done', 'ready', 'confirmed'].includes(status) ? 100 : 72,
      state: blocked ? 'blocked' : overdue ? 'overdue' : status === 'ready' ? 'ready' : 'attention',
      href: firstString(row, ['href'], '/angelcare-360-operator/tasks'),
    }
  })
  if (!missions.length) {
    missions.push(
      { id: 'mission-1', timeLabel: '08:00', title: 'Ouverture opérationnelle', context: 'Réseau AngelCare', owner: 'Operations', readiness: 88, state: 'ready', href: '/angelcare-360-operator/service' },
      { id: 'mission-2', timeLabel: '10:00', title: 'Revue activations tenants', context: 'Portfolio clients', owner: 'Customer Operations', readiness: 74, state: 'attention', href: '/angelcare-360-operator/tenants-product?view=deployments' },
      { id: 'mission-3', timeLabel: '16:00', title: 'Revue revenus & encours', context: 'Finance', owner: 'Finance', readiness: 68, state: 'attention', href: '/angelcare-360-operator/revenue' },
    )
  }

  const events = buildEvents([
    { domain: 'business', rows: [...payments, ...contracts, ...offers], href: '/angelcare-360-operator/growth', fallbackTitle: 'Mouvement commercial' },
    { domain: 'customer', rows: [...customerCases, ...interventions, ...emailMessages], href: '/angelcare-360-operator/growth?view=portfolio', fallbackTitle: 'Événement client' },
    { domain: 'platform', rows: [...auditEvents, ...storageEvents, ...emailDeliveryEvents], href: '/angelcare-360-operator/platform', fallbackTitle: 'Événement plateforme' },
  ])

  const criticalEvent = criticalCases.length >= 3 || platformServices.filter((item) => item.status === 'degraded').length >= 3
    ? {
        id: 'critical-network-event',
        title: criticalCases.length >= 3 ? 'Pression client critique détectée' : 'Dégradation multi-service détectée',
        summary: `${criticalCases.length} dossier(s) critique(s) et ${platformServices.filter((item) => item.status === 'degraded').length} service(s) dégradé(s).`,
        impact: [
          criticalCases.length ? 'Relations clients et renouvellements' : 'Continuité de plateforme',
          overdueInvoices.length ? 'Exposition financière active' : 'Aucune exposition financière majeure détectée',
          pendingInvitations.length ? 'Activations administrateurs en attente' : 'Accès tenants sous contrôle',
        ],
        owner: criticalCases.length >= 3 ? 'Customer Operations' : 'Platform Operations',
        currentAction: 'Ouvrir le commandement prioritaire et confirmer le plan de réponse.',
        startedAt: nowIso(),
        severity: 'critical' as const,
        href: criticalCases.length >= 3 ? '/angelcare-360-operator/growth?view=health' : '/angelcare-360-operator/platform',
      }
    : null

  return {
    generatedAt: nowIso(),
    sourceState,
    globalHealth,
    environmentLabel: process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production' ? 'Production' : 'Local / validation',
    headline: globalHealth >= 85 ? 'Le réseau est opérationnel.' : globalHealth >= 65 ? 'Le réseau est opérationnel sous surveillance.' : 'Le réseau exige une intervention coordonnée.',
    subheadline: `${activeClients.length} clients actifs · ${activeTenants.length} tenants actifs · ${priorities.length} priorité(s) · ${liveSourceCount}/${sourceRows.length} sources vivantes`,
    sources: sourceRows,
    metrics: [
      { key: 'clients', label: 'Clients actifs', value: String(activeClients.length), numericValue: activeClients.length, deltaLabel: `${atRiskClients.length} à risque`, detail: `${clients.length} organisations suivies`, tone: atRiskClients.length ? 'warning' : 'good', href: '/angelcare-360-operator/growth?view=portfolio', source: 'Clients', updatedAt: nowIso() },
      { key: 'tenants', label: 'Tenants actifs', value: String(activeTenants.length), numericValue: activeTenants.length, deltaLabel: `${pendingInvitations.length} activations`, detail: `${tenants.length} tenants connus`, tone: pendingInvitations.length ? 'warning' : 'good', href: '/angelcare-360-operator/tenants-product?view=deployments', source: 'Tenants', updatedAt: nowIso() },
      { key: 'mrr', label: 'MRR activé', value: compactMoney(activeMrr), numericValue: activeMrr, deltaLabel: `${activeSubscriptions.length} abonnements`, detail: 'Valeur récurrente active', tone: 'good', href: '/angelcare-360-operator/revenue', source: 'Subscriptions', updatedAt: nowIso() },
      { key: 'health', label: 'Santé globale', value: `${globalHealth}%`, numericValue: globalHealth, deltaLabel: sourceState === 'live' ? 'Toutes sources live' : `${liveSourceCount}/${sourceRows.length} sources`, detail: 'Indice opérationnel explicable', tone: globalHealth < 65 ? 'critical' : globalHealth < 82 ? 'warning' : 'good', href: '/angelcare-360-operator/platform', source: 'Sovereign aggregator', updatedAt: nowIso() },
      { key: 'priorities', label: 'Missions critiques', value: String(priorities.filter((item) => item.tone === 'critical').length), numericValue: priorities.filter((item) => item.tone === 'critical').length, deltaLabel: `${priorities.length} priorités`, detail: 'Décisions et interventions', tone: priorities.some((item) => item.tone === 'critical') ? 'critical' : priorities.length > 2 ? 'warning' : 'good', href: '/angelcare-360-operator/tasks', source: 'Priority engine', updatedAt: nowIso() },
      { key: 'email', label: 'Correspondance', value: String(emailMessages.length), numericValue: emailMessages.length, deltaLabel: `${emailFlow.find((item) => item.key === 'failed')?.count || 0} échec(s)`, detail: 'Messages et automatisations', tone: (emailFlow.find((item) => item.key === 'failed')?.count || 0) > 0 ? 'warning' : 'good', href: '/angelcare-360-operator/email-command', source: 'Email OS', updatedAt: nowIso() },
    ],
    towers,
    priorities,
    events,
    revenueFlow,
    customerNodes,
    tenantStages,
    experience,
    emailFlow,
    platformServices,
    missions,
    criticalEvent,
    nextDecisiveEvent: missions[0] ? `${missions[0].title} — ${missions[0].timeLabel}` : 'Surveillance continue',
    privacyDefault: 'team_safe',
    rotationSeconds: 24,
  }
}
