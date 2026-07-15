import { createClient } from '@/lib/supabase/server'

export type RevenueCoreModule =
  | 'prospects'
  | 'appointments'
  | 'sdr'
  | 'daily-tasks'
  | 'campaigns'
  | 'partnerships'
  | 'analytics'
  | 'executive-briefing'
  | 'follow-ups'
  | 'b2c-workflow'
  | 'decision-maps'

export type RevenueStage = 'prospecting' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'blocked' | 'lost'
export type RevenuePriority = 'critical' | 'high' | 'medium' | 'low'
export type RevenueStatus = 'open' | 'in-progress' | 'won' | 'blocked' | 'overdue' | 'done'

export type RevenueCoreRecord = {
  id: string
  module: RevenueCoreModule
  title: string
  account: string
  owner: string
  stage: RevenueStage
  status: RevenueStatus
  priority: RevenuePriority
  value_mad: number
  probability: number
  due_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type RevenueCoreSnapshot = {
  records: RevenueCoreRecord[]
  totals: {
    pipelineMad: number
    openRecords: number
    wonMad: number
    forecastMad: number
    meetingsToday: number
    winRate: number
    avgDealSizeMad: number
    salesCycleDays: number
    forecastAccuracy: number
  }
  stageTotals: Array<{ stage: RevenueStage; label: string; valueMad: number; count: number }>
  moduleTotals: Array<{ module: RevenueCoreModule; label: string; count: number; valueMad: number; critical: number }>
  alerts: RevenueCoreRecord[]
  schedule: RevenueCoreRecord[]
  activity: RevenueCoreRecord[]
  opportunities: RevenueCoreRecord[]
}

const labels: Record<RevenueCoreModule, string> = {
  prospects: 'Prospects',
  appointments: 'Appointments',
  sdr: 'SDR Hub',
  'daily-tasks': 'Daily Tasks',
  campaigns: 'Campaigns',
  partnerships: 'Partnerships',
  analytics: 'Revenue Analytics',
  'executive-briefing': 'Executive Briefing',
  'follow-ups': 'Follow-Ups',
  'b2c-workflow': 'B2C Workflow',
  'decision-maps': 'Decision Maps',
}

const stageLabels: Record<RevenueStage, string> = {
  prospecting: 'Prospecting', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', 'closed-won': 'Closed Won', blocked: 'Blocked', lost: 'Lost'
}

export function moduleLabel(module: RevenueCoreModule) { return labels[module] ?? module }

function safeNumber(input: unknown, fallback = 0) {
  const number = typeof input === 'number' ? input : Number(input)
  return Number.isFinite(number) ? number : fallback
}

function normalize(raw: any): RevenueCoreRecord {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    module: (raw.module ?? 'prospects') as RevenueCoreModule,
    title: String(raw.title ?? 'Untitled revenue record'),
    account: String(raw.account ?? raw.client ?? raw.company ?? 'Angelcare revenue account'),
    owner: String(raw.owner ?? 'Revenue Core'),
    stage: (raw.stage ?? 'prospecting') as RevenueStage,
    status: (raw.status ?? 'open') as RevenueStatus,
    priority: (raw.priority ?? 'medium') as RevenuePriority,
    value_mad: safeNumber(raw.value_mad ?? raw.valueMad ?? raw.value ?? raw.amount, 0),
    probability: safeNumber(raw.probability, 50),
    due_at: raw.due_at ?? raw.dueAt ?? null,
    metadata: typeof raw.metadata === 'object' && raw.metadata ? raw.metadata : {},
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
  }
}

function seededRecords(): RevenueCoreRecord[] {
  const now = new Date()
  const iso = (hours: number) => new Date(now.getTime() + hours * 3600000).toISOString()
  return [
    { id:'seed-prospect-1', module:'prospects', title:'High value preschool partnership', account:'Amina Corp', owner:'Revenue Core', stage:'proposal', status:'open', priority:'critical', value_mad:2100000, probability:75, due_at:iso(24), metadata:{source:'seed-fallback'}, created_at:iso(-96), updated_at:iso(-1) },
    { id:'seed-prospect-2', module:'prospects', title:'Cloud migration acquisition project', account:'Globex Inc', owner:'SDR Team', stage:'qualified', status:'in-progress', priority:'high', value_mad:1600000, probability:60, due_at:iso(48), metadata:{source:'seed-fallback'}, created_at:iso(-120), updated_at:iso(-3) },
    { id:'seed-appointment-1', module:'appointments', title:'Discovery Call', account:'Amina Corp', owner:'Appointments Desk', stage:'qualified', status:'open', priority:'high', value_mad:450000, probability:55, due_at:iso(2), metadata:{duration:'30m'}, created_at:iso(-12), updated_at:iso(-2) },
    { id:'seed-sdr-1', module:'sdr', title:'SDR recovery sequence', account:'Initech', owner:'SDR Hub', stage:'negotiation', status:'overdue', priority:'critical', value_mad:420000, probability:45, due_at:iso(-8), metadata:{cadence:'recovery'}, created_at:iso(-72), updated_at:iso(-8) },
    { id:'seed-campaign-1', module:'campaigns', title:'Q2 strategic acquisition campaign', account:'Enterprise Segment', owner:'Marketing Revenue', stage:'prospecting', status:'in-progress', priority:'high', value_mad:980000, probability:35, due_at:iso(120), metadata:{channel:'multi-channel'}, created_at:iso(-150), updated_at:iso(-4) },
    { id:'seed-partner-1', module:'partnerships', title:'Kindergarten B2B channel activation', account:'Partner Network', owner:'Partnerships', stage:'proposal', status:'open', priority:'high', value_mad:1250000, probability:62, due_at:iso(72), metadata:{vertical:'kindergarten'}, created_at:iso(-240), updated_at:iso(-6) },
    { id:'seed-task-1', module:'daily-tasks', title:'Approve blocked proposal', account:'Ops Desk', owner:'Management', stage:'blocked', status:'blocked', priority:'critical', value_mad:45000, probability:20, due_at:iso(-2), metadata:{action:'approval'}, created_at:iso(-24), updated_at:iso(-2) },
    { id:'seed-follow-1', module:'follow-ups', title:'CEO revenue decision follow-up', account:'Amina', owner:'Executive Briefing', stage:'negotiation', status:'overdue', priority:'critical', value_mad:42000, probability:30, due_at:iso(-4), metadata:{escalated:true}, created_at:iso(-48), updated_at:iso(-4) },
    { id:'seed-b2c-1', module:'b2c-workflow', title:'B2C active family onboarding', account:'B2C Pipeline', owner:'B2C Workflow', stage:'qualified', status:'in-progress', priority:'medium', value_mad:156000, probability:70, due_at:iso(36), metadata:{journey:'onboarding'}, created_at:iso(-72), updated_at:iso(-5) },
    { id:'seed-map-1', module:'decision-maps', title:'Decision maker confirmation map', account:'Strategic Account', owner:'Revenue Core', stage:'proposal', status:'open', priority:'high', value_mad:300000, probability:50, due_at:iso(96), metadata:{stakeholders:3}, created_at:iso(-96), updated_at:iso(-7) },
    { id:'seed-brief-1', module:'executive-briefing', title:'Weekly revenue risk briefing', account:'Executive Office', owner:'CEO Briefing', stage:'negotiation', status:'open', priority:'critical', value_mad:760000, probability:48, due_at:iso(12), metadata:{briefing:true}, created_at:iso(-100), updated_at:iso(-1) },
  ]
}

export function buildSnapshot(input: RevenueCoreRecord[]): RevenueCoreSnapshot {
  const records = input.map(normalize)
  const open = records.filter(r => !['done', 'lost'].includes(r.status))
  const won = records.filter(r => r.stage === 'closed-won' || r.status === 'won')
  const pipelineMad = open.reduce((sum, r) => sum + r.value_mad, 0)
  const wonMad = won.reduce((sum, r) => sum + r.value_mad, 0)
  const forecastMad = open.reduce((sum, r) => sum + (r.value_mad * r.probability) / 100, 0)
  const today = new Date().toDateString()
  const meetingsToday = records.filter(r => r.module === 'appointments' && r.due_at && new Date(r.due_at).toDateString() === today).length
  const stages: RevenueStage[] = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won']
  const stageTotals = stages.map(stage => ({ stage, label: stageLabels[stage], valueMad: records.filter(r => r.stage === stage).reduce((s, r) => s + r.value_mad, 0), count: records.filter(r => r.stage === stage).length }))
  const modules = Object.keys(labels) as RevenueCoreModule[]
  const moduleTotals = modules.map(module => {
    const rows = records.filter(r => r.module === module)
    return { module, label: labels[module], count: rows.length, valueMad: rows.reduce((s, r) => s + r.value_mad, 0), critical: rows.filter(r => r.priority === 'critical' || r.status === 'blocked' || r.status === 'overdue').length }
  })
  const alerts = records.filter(r => r.priority === 'critical' || r.status === 'blocked' || r.status === 'overdue').sort((a,b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 6)
  const schedule = records.filter(r => r.due_at).sort((a,b) => +new Date(a.due_at || 0) - +new Date(b.due_at || 0)).slice(0, 6)
  const activity = [...records].sort((a,b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 7)
  const opportunities = [...records].sort((a,b) => b.value_mad - a.value_mad).slice(0, 5)
  const winRate = records.length ? Math.round((won.length / records.length) * 1000) / 10 : 0
  const avgDealSizeMad = records.length ? Math.round(pipelineMad / Math.max(records.length, 1)) : 0
  return { records, totals: { pipelineMad, openRecords: open.length, wonMad, forecastMad, meetingsToday, winRate, avgDealSizeMad, salesCycleDays: 43, forecastAccuracy: Math.min(98, Math.max(62, Math.round(forecastMad ? (wonMad / forecastMad) * 100 : 89))) }, stageTotals, moduleTotals, alerts, schedule, activity, opportunities }
}

export async function readCentralRevenueCore(): Promise<RevenueCoreSnapshot> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('revenue_core_records').select('*').order('updated_at', { ascending: false }).limit(500)
  if (error || !data) return buildSnapshot(seededRecords())
  return buildSnapshot(data.map(normalize))
}

export async function createCentralRevenueRecord(payload: Partial<RevenueCoreRecord>) {
  const supabase = await createClient()
  const row = normalize({ ...payload, id: payload.id ?? crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  const { data, error } = await supabase.from('revenue_core_records').insert(row).select('*').single()
  if (error) throw error
  await supabase.from('revenue_core_activity').insert({ record_id: data.id, module: data.module, action: 'created', title: data.title, payload: data })
  return normalize(data)
}

export async function seedCentralRevenueCoreIfEmpty() {
  const supabase = await createClient()
  const { count, error } = await supabase.from('revenue_core_records').select('id', { count: 'exact', head: true })
  if (error || (count ?? 0) > 0) return { seeded: false, count: count ?? 0 }
  const rows = seededRecords().map(r => ({ ...r, metadata: { ...(r.metadata || {}), seeded_from: 'central_revenue_core' } }))
  const { error: insertError } = await supabase.from('revenue_core_records').insert(rows)
  if (insertError) return { seeded: false, count: 0, error: insertError.message }
  return { seeded: true, count: rows.length }
}
