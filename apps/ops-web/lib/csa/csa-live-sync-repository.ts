import { createClient } from '@/lib/supabase/server'
import { csaPortalData } from '@/lib/csa/csa-staff-portal-data'

type AnyRow = Record<string, any>

function rows(value: any): AnyRow[] {
  return Array.isArray(value) ? value : []
}

function text(value: any, fallback = '—') {
  const s = String(value ?? '').trim()
  return s || fallback
}

function first(row: AnyRow, keys: string[], fallback = '—') {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && String(row[key]).trim() !== '') return row[key]
  }
  return fallback
}

function hrefFor(source: string) {
  if (source === 'leads') return '/leads'
  if (source === 'families') return '/families'
  if (source === 'services') return '/services'
  if (source === 'sales') return '/sales'
  if (source === 'revenue') return '/revenue-command-center'
  if (source === 'incidents') return '/incidents'
  return '/csa-home'
}

async function safeSelect(table: string, query = '*', limit = 50) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select(query).limit(limit)
    if (error) return []
    return rows(data)
  } catch {
    return []
  }
}

export async function getCsaLiveSnapshot() {
  const [leads, families, services, sales, incidents, tasks] = await Promise.all([
    safeSelect('leads', '*', 80),
    safeSelect('families', '*', 80),
    safeSelect('services', '*', 80),
    safeSelect('sales', '*', 80),
    safeSelect('incidents', '*', 80),
    safeSelect('tasks', '*', 80),
  ])

  const openLeads = leads.filter((x) => !['closed', 'won', 'lost', 'done'].includes(String(first(x, ['status', 'stage'], '')).toLowerCase()))
  const activeFamilies = families.filter((x) => !['inactive', 'archived', 'closed'].includes(String(first(x, ['status'], '')).toLowerCase()))
  const openIncidents = incidents.filter((x) => !['closed', 'resolved', 'done'].includes(String(first(x, ['status'], '')).toLowerCase()))
  const pendingServices = services.filter((x) => ['pending', 'draft', 'active', 'ready', 'planned'].some((s) => String(first(x, ['status', 'activation_status'], '')).toLowerCase().includes(s)))

  const priorityFamilies = activeFamilies.slice(0, 6).map((family) => ({
    name: text(first(family, ['full_name', 'name', 'family_name', 'parent_name', 'client_name'], 'Family account')),
    issue: text(first(family, ['last_note', 'need', 'notes', 'status'], 'Family follow-up required')),
    priority: String(first(family, ['priority', 'risk_level'], 'Medium')),
    href: '/families',
  }))

  const leadQueue = openLeads.slice(0, 6).map((lead) => ({
    name: text(first(lead, ['full_name', 'name', 'contact_name', 'parent_name', 'company'], 'Lead')),
    stage: text(first(lead, ['stage', 'status', 'source'], 'Follow-up')),
    action: text(first(lead, ['next_action', 'notes'], 'Contact and qualify')),
    href: '/leads',
  }))

  const activity = [
    ...openLeads.slice(0, 3).map((lead) => ({
      title: `Lead follow-up: ${text(first(lead, ['full_name', 'name', 'contact_name'], 'new lead'))}`,
      time: text(first(lead, ['updated_at', 'created_at'], 'recent')),
      href: '/leads',
    })),
    ...openIncidents.slice(0, 3).map((incident) => ({
      title: `Escalation: ${text(first(incident, ['title', 'type', 'description'], 'incident'))}`,
      time: text(first(incident, ['updated_at', 'created_at'], 'recent')),
      href: '/incidents',
    })),
    ...pendingServices.slice(0, 3).map((service) => ({
      title: `Service activation: ${text(first(service, ['title', 'name', 'service_name'], 'service'))}`,
      time: text(first(service, ['updated_at', 'created_at'], 'recent')),
      href: '/services',
    })),
  ].slice(0, 8)

  const kpis = [
    { label: 'Priority Families', value: String(priorityFamilies.length || activeFamilies.length || csaPortalData.kpis[0].value), href: '/families', icon: '🏡' },
    { label: 'Lead Follow-ups', value: String(openLeads.length || csaPortalData.kpis[1].value), href: '/leads', icon: '📞' },
    { label: 'Revenue at Risk', value: csaPortalData.kpis[2].value, href: '/revenue-command-center', icon: '💎' },
    { label: 'Service Activations', value: String(pendingServices.length || csaPortalData.kpis[3].value), href: '/services', icon: '🧩' },
    { label: 'Open Escalations', value: String(openIncidents.length || csaPortalData.kpis[4].value), href: '/incidents', icon: '🚨' },
  ]

  return {
    loadedAt: new Date().toISOString(),
    mode: leads.length || families.length || services.length || incidents.length ? 'live-partial' : 'fallback',
    kpis,
    priorityFamilies: priorityFamilies.length ? priorityFamilies : csaPortalData.familyQueue.map(([name, issue, priority, href]: any) => ({ name, issue, priority, href })),
    leadQueue: leadQueue.length ? leadQueue : [
      { name: 'Crèche Les Petits Génies', stage: 'B2B warm lead', action: 'Schedule visit', href: '/leads' },
      { name: 'Famille Berrada', stage: 'WhatsApp inquiry', action: 'Call within 2h', href: '/leads' },
      { name: 'Famille Tazi', stage: 'Pricing objection', action: 'Send value package', href: '/revenue-command-center' },
    ],
    activity: activity.length ? activity : csaPortalData.activity.map(([title, time, href]: any) => ({ title, time, href })),
    counts: {
      leads: leads.length,
      families: families.length,
      services: services.length,
      sales: sales.length,
      incidents: incidents.length,
      tasks: tasks.length,
    },
    sync: [
      { module: 'Leads', table: 'leads', count: leads.length, href: '/leads' },
      { module: 'Families', table: 'families', count: families.length, href: '/families' },
      { module: 'Services', table: 'services', count: services.length, href: '/services' },
      { module: 'Sales', table: 'sales', count: sales.length, href: '/sales' },
      { module: 'Incidents', table: 'incidents', count: incidents.length, href: '/incidents' },
      { module: 'Tasks', table: 'tasks', count: tasks.length, href: '/revenue-command-center/tasks' },
    ],
  }
}
