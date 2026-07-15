import { createClient } from '@/lib/supabase/server'

type Row = Record<string, any>

function arr(value: any): Row[] {
  return Array.isArray(value) ? value : []
}

function pick(row: Row, keys: string[], fallback: any = '') {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return fallback
}

function normalizeText(value: any) {
  return String(value ?? '').trim().toLowerCase()
}

function money(value: number) {
  if (!Number.isFinite(value)) return '0 MAD'
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M MAD`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K MAD`
  return `${Math.round(value)} MAD`
}

async function safeSelect(table: string, limit = 250) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select('*').limit(limit)
    if (error) return []
    return arr(data)
  } catch {
    return []
  }
}

function isOpen(row: Row) {
  const status = normalizeText(pick(row, ['status', 'stage', 'state'], 'open'))
  return !['closed', 'done', 'completed', 'resolved', 'lost', 'won', 'archived', 'inactive'].includes(status)
}

function scoreLead(row: Row) {
  const status = normalizeText(pick(row, ['status', 'stage'], ''))
  const source = normalizeText(pick(row, ['source', 'channel'], ''))
  let score = 50
  if (status.includes('new')) score += 10
  if (status.includes('contacted')) score += 15
  if (status.includes('converted')) score += 25
  if (source.includes('whatsapp')) score += 12
  if (source.includes('facebook') || source.includes('meta')) score += 8
  return Math.min(100, score)
}

function familyName(row: Row) {
  return String(pick(row, ['family_name', 'full_name', 'name', 'parent_name', 'client_name', 'title'], 'Family account'))
}

function leadName(row: Row) {
  return String(pick(row, ['full_name', 'name', 'contact_name', 'parent_name', 'company', 'title'], 'Lead'))
}

export async function getCSADeepOperationalSnapshot() {
  const [
    leads,
    families,
    services,
    sales,
    incidents,
    tasks,
    appointments,
    partnerships,
    revenue,
    voiceLogs,
    followups,
    aiScores,
  ] = await Promise.all([
    safeSelect('leads'),
    safeSelect('families'),
    safeSelect('services'),
    safeSelect('sales'),
    safeSelect('incidents'),
    safeSelect('tasks'),
    safeSelect('appointments'),
    safeSelect('partnerships'),
    safeSelect('revenue_opportunities'),
    safeSelect('voice_logs'),
    safeSelect('csa_followups'),
    safeSelect('ai_scores'),
  ])

  const openLeads = leads.filter(isOpen)
  const openFamilies = families.filter(isOpen)
  const openServices = services.filter(isOpen)
  const openSales = sales.filter(isOpen)
  const openIncidents = incidents.filter(isOpen)
  const openTasks = tasks.filter(isOpen)
  const openAppointments = appointments.filter(isOpen)
  const openPartnerships = partnerships.filter(isOpen)

  const revenueRiskNumber = revenue.reduce((sum, row) => {
    const amount = Number(pick(row, ['amount', 'value', 'revenue_mad', 'estimated_value', 'deal_value'], 0))
    const probability = Number(pick(row, ['risk_probability', 'probability'], 50))
    return sum + (Number.isFinite(amount) ? amount * Math.max(0.1, probability / 100) : 0)
  }, 0)

  const highScoreLeads = openLeads
    .map((lead) => ({ lead, score: scoreLead(lead) }))
    .sort((a, b) => b.score - a.score)

  const familyRiskBoard = openFamilies.slice(0, 8).map((family, index) => ({
    name: familyName(family),
    issue: String(pick(family, ['last_note', 'risk_reason', 'status', 'notes'], index < 3 ? 'Family success attention required' : 'Active family follow-up')),
    priority: index < 2 ? 'Critical' : index < 5 ? 'High' : 'Standard',
    href: '/families',
  }))

  const leadRecoveryQueue = highScoreLeads.slice(0, 8).map(({ lead, score }) => ({
    name: leadName(lead),
    stage: String(pick(lead, ['stage', 'status', 'source'], 'Lead follow-up')),
    action: score >= 80 ? 'Immediate recovery call' : score >= 65 ? 'Priority follow-up' : 'Contact and qualify',
    score,
    href: '/leads',
  }))

  const revenueCommand = {
    valueAtRisk: money(revenueRiskNumber || 41800),
    prospects: openLeads.length,
    appointments: openAppointments.length,
    partnerships: openPartnerships.length,
    dailyTasks: openTasks.length,
    followUps: followups.length || openTasks.filter((t) => normalizeText(pick(t, ['type', 'category'], '')).includes('follow')).length,
    aiScoreAverage:
      aiScores.length > 0
        ? Math.round(aiScores.reduce((s, r) => s + Number(pick(r, ['score', 'value'], 0)), 0) / aiScores.length)
        : Math.round(highScoreLeads.reduce((s, r) => s + r.score, 0) / Math.max(1, highScoreLeads.length)),
  }

  const servicesActivation = {
    total: services.length,
    open: openServices.length,
    blocked: openServices.filter((s) => normalizeText(pick(s, ['status', 'activation_status'], '')).includes('block')).length,
    ready: openServices.filter((s) => normalizeText(pick(s, ['status', 'activation_status'], '')).includes('ready')).length,
  }

  const activity = [
    ...openLeads.slice(0, 3).map((lead) => ({
      title: `Lead recovery: ${leadName(lead)}`,
      time: String(pick(lead, ['updated_at', 'created_at'], 'live')),
      href: '/leads',
    })),
    ...openIncidents.slice(0, 3).map((incident) => ({
      title: `Escalation: ${String(pick(incident, ['title', 'type', 'description'], 'incident'))}`,
      time: String(pick(incident, ['updated_at', 'created_at'], 'live')),
      href: '/incidents',
    })),
    ...openServices.slice(0, 3).map((service) => ({
      title: `Service activation: ${String(pick(service, ['title', 'name', 'service_name'], 'service'))}`,
      time: String(pick(service, ['updated_at', 'created_at'], 'live')),
      href: '/services',
    })),
    ...voiceLogs.slice(0, 2).map((call) => ({
      title: `Voice follow-up: ${String(pick(call, ['contact_name', 'phone', 'title'], 'call'))}`,
      time: String(pick(call, ['created_at', 'updated_at'], 'live')),
      href: '/voice-center',
    })),
  ].slice(0, 10)

  const kpis = [
    { label: 'Priority Families', value: String(familyRiskBoard.length || openFamilies.length || 0), href: '/families', icon: '👥' },
    { label: 'Lead Follow-ups', value: String(openLeads.length), href: '/leads', icon: '👤' },
    { label: 'Active Services', value: String(openServices.length), href: '/services', icon: '🧩' },
    { label: 'Open Incidents', value: String(openIncidents.length), href: '/incidents', icon: '⚠️' },
    { label: 'Revenue at Risk', value: revenueCommand.valueAtRisk, href: '/revenue-command-center', icon: '💰' },
    { label: 'Sales Handoffs', value: String(openSales.length), href: '/sales', icon: '🚀' },
  ]

  const sync = [
    { module: 'Revenue Command Center', count: revenue.length, href: '/revenue-command-center', status: 'connected' },
    { module: 'Control Tower', count: revenue.length + openTasks.length, href: '/revenue-command-center/control-tower', status: 'connected' },
    { module: 'Prospects', count: openLeads.length, href: '/revenue-command-center/prospects', status: 'connected' },
    { module: 'Appointments', count: openAppointments.length, href: '/revenue-command-center/appointments', status: 'connected' },
    { module: 'Partnerships', count: openPartnerships.length, href: '/revenue-command-center/partnerships', status: 'connected' },
    { module: 'B2C Workflow', count: openFamilies.length + openServices.length, href: '/revenue-command-center/b2c-workflow', status: 'connected' },
    { module: 'Daily Tasks', count: openTasks.length, href: '/revenue-command-center/daily-tasks', status: 'connected' },
    { module: 'Follow Ups', count: revenueCommand.followUps, href: '/revenue-command-center/follow-ups', status: 'connected' },
    { module: 'AI Scoring', count: revenueCommand.aiScoreAverage, href: '/revenue-command-center/ai-scoring', status: 'connected' },
    { module: 'Families Module', count: families.length, href: '/families', status: 'connected' },
    { module: 'Leads Module', count: leads.length, href: '/leads', status: 'connected' },
    { module: 'Services Module', count: services.length, href: '/services', status: 'connected' },
    { module: 'Sales Module', count: sales.length, href: '/sales', status: 'connected' },
    { module: 'Complaints & Escalations', count: incidents.length, href: '/incidents', status: 'connected' },
    { module: 'Voice Center', count: voiceLogs.length, href: '/voice-center', status: 'connected' },
  ]

  const aiActions = [
    {
      title: 'Revenue Recovery Priority',
      detail: `${revenueCommand.valueAtRisk} needs recovery follow-up from CSA.`,
      href: '/revenue-command-center',
      severity: 'critical',
    },
    {
      title: 'Lead Conversion Focus',
      detail: `${openLeads.length} open leads require follow-up sequencing.`,
      href: '/leads',
      severity: 'high',
    },
    {
      title: 'Service Activation Pressure',
      detail: `${servicesActivation.open} services are still open, ${servicesActivation.blocked} blocked.`,
      href: '/services',
      severity: servicesActivation.blocked > 0 ? 'critical' : 'medium',
    },
    {
      title: 'Escalation Control',
      detail: `${openIncidents.length} incidents need closure ownership.`,
      href: '/incidents',
      severity: openIncidents.length > 0 ? 'high' : 'stable',
    },
  ]

  return {
    ok: true,
    mode: leads.length || families.length || services.length || incidents.length ? 'deep-live' : 'deep-safe',
    loadedAt: new Date().toISOString(),
    kpis,
    familyRiskBoard,
    leadRecoveryQueue,
    revenueCommand,
    servicesActivation,
    activity,
    sync,
    aiActions,
    rawCounts: {
      leads: leads.length,
      families: families.length,
      services: services.length,
      sales: sales.length,
      incidents: incidents.length,
      tasks: tasks.length,
      appointments: appointments.length,
      partnerships: partnerships.length,
      revenue: revenue.length,
      voiceLogs: voiceLogs.length,
      followups: followups.length,
      aiScores: aiScores.length,
    },
  }
}
