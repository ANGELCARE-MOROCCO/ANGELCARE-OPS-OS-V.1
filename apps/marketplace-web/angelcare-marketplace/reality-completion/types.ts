export type RealityDomain = 'growth' | 'qa' | 'intelligence' | 'platform_performance' | 'security' | 'trust' | 'launch'

export interface RealityRecord {
  id: string
  public_reference: string
  workspace_key: string
  territory_id?: string | null
  tenant_id?: string | null
  source_id: string | null
  title: string
  status: string
  owner_id?: string | null
  due_at?: string | null
  severity?: string | null
  priority?: string | null
  next_action?: string | null
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface RealityEvent {
  id: string
  domain: RealityDomain
  workspace_key: string
  territory_id?: string | null
  tenant_id?: string | null
  entity_id: string
  action: string
  previous_status: string | null
  next_status: string | null
  reason: string | null
  actor_id: string | null
  request_id: string | null
  created_at: string
}

export interface RealityWorkspaceData {
  records: RealityRecord[]
  sourceRecords: Array<{
    id: string
    title: string
    status: string
    meta: string
    raw: Record<string, unknown>
  }>
  events: RealityEvent[]
}

export interface RealityCreateInput {
  workspaceKey: string
  sourceId?: string | null
  title: string
  values: Record<string, unknown>
}

export interface RealityCommandInput {
  action: string
  reason: string
  values: Record<string, unknown>
}
