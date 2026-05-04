// lib/market-os/core.ts

export type MarketEngine =
  | 'acquisition'
  | 'content'
  | 'conversion'
  | 'data'
  | 'network'
  | 'product'
  | 'seo'
  | 'daily'
  | 'system'

export type MarketPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical'

export type MarketActionInput = {
  action: string
  engine?: MarketEngine
  recordId?: string | null
  actorName?: string
  ownerAgent?: string
  title?: string
  description?: string
  status?: string
  stage?: string
  priority?: MarketPriority | string
  recordType?: string
  payload?: Record<string, unknown>
}

export type MarketRecord = {
  id: string
  kind?: string | null
  record_type: string
  engine: MarketEngine | string
  pipeline?: string | null
  title: string
  description?: string | null
  owner?: string | null
  owner_agent?: string | null
  status: string
  priority: MarketPriority | string
  stage?: string | null
  due_date?: string | null
  score?: number | null
  notes?: string | null
  payload?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type MarketAgent = {
  id: string
  agent_key: string
  name: string
  role: string
  engine: MarketEngine | string
  mission?: string | null
  daily_routine?: Record<string, unknown> | null
  target_kpis?: Record<string, unknown> | null
  is_active?: boolean
}

export type MarketKpi = {
  id: string
  kpi_key: string
  label: string
  engine: MarketEngine | string
  current_value: number
  target_value: number
  unit?: string | null
  status: string
  last_updated_at?: string | null
}

export type MarketAuditEvent = {
  id: string
  action_key?: string | null
  title: string
  summary?: string | null
  engine?: MarketEngine | string | null
  record_id?: string | null
  actor_name?: string | null
  payload?: Record<string, unknown> | null
  created_at: string
}

export function marketActionLabel(action: string): string {
  return String(action || 'market_action')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function defaultRecordTitle(action: string): string {
  return marketActionLabel(action) || 'Market-OS Task'
}

export function nextStatusForAction(action: string, fallback = 'active'): string {
  const map: Record<string, string> = {
    launch_campaign: 'active',
    pause_campaign: 'paused',
    submit_review: 'review',
    approve_content: 'approved',
    reject_content: 'rejected',
    mark_published: 'published',
    publish_article: 'published',
    publish_product_page: 'published',
    mark_converted: 'converted',
    update_lead_status: 'qualified',
    complete_record: 'completed',
    escalate_record: 'risk',
    cancel_record: 'cancelled',
    archive_record: 'archived',
    flag_underperformance: 'risk',
  }
  return map[action] || fallback
}

export function nextStageForAction(action: string, fallback = 'active'): string {
  const map: Record<string, string> = {
    launch_campaign: 'launched',
    pause_campaign: 'paused',
    submit_review: 'review',
    approve_content: 'approval',
    reject_content: 'correction',
    mark_published: 'published',
    publish_article: 'published',
    publish_product_page: 'published',
    mark_converted: 'converted',
    update_lead_status: 'qualified',
    complete_record: 'completed',
    escalate_record: 'escalated',
    cancel_record: 'cancelled',
    archive_record: 'archived',
    move_ambassador_stage: 'onboard',
    optimize_product_page: 'optimized',
    validate_version: 'reviewed',
    assign_keyword: 'keyword',
    schedule_publish: 'scheduled',
    track_traffic: 'track',
    optimize_article: 'optimize',
  }
  return map[action] || fallback
}

export function priorityForAction(action: string, fallback: MarketPriority | string = 'normal'): MarketPriority | string {
  if (action.includes('urgent') || action.includes('risk') || action.includes('flag') || action.includes('escalate')) return 'urgent'
  return fallback
}
