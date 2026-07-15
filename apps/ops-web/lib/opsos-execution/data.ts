import { createClient } from '@/lib/supabase/server'

export type ExecutionWorkflow = {
  id: string
  title: string
  module_key: string
  workflow_type: string
  status: string
  priority: string
  owner: string | null
  current_step: string | null
  progress: number
  source_route: string | null
  target_route: string | null
  created_at: string
}

export type ExecutionAction = {
  id: string
  title: string
  module_key: string
  action_type: string
  status: string
  priority: string
  route: string
  payload: Record<string, unknown>
  created_at: string
}

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

function s(value: unknown, fallback = ''): string {
  const out = String(value ?? '').trim()
  return out || fallback
}

function n(value: unknown, fallback = 0): number {
  const out = Number(value)
  return Number.isFinite(out) ? out : fallback
}

export async function getOpsosExecutionData() {
  const supabase = await createClient()

  const [workflowsRes, actionsRes, escalationsRes, syncRes] = await Promise.all([
    supabase.from('opsos_workflows').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('opsos_command_actions').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('opsos_escalations').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('opsos_sync_events').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  const workflows: ExecutionWorkflow[] = rows(workflowsRes).map((item: any) => ({
    id: String(item.id),
    title: s(item.title, 'Workflow'),
    module_key: s(item.module_key, 'global'),
    workflow_type: s(item.workflow_type, 'general'),
    status: s(item.status, 'open'),
    priority: s(item.priority, 'medium'),
    owner: item.owner || null,
    current_step: item.current_step || null,
    progress: n(item.progress, 0),
    source_route: item.source_route || null,
    target_route: item.target_route || null,
    created_at: s(item.created_at, new Date().toISOString()),
  }))

  const actions: ExecutionAction[] = rows(actionsRes).map((item: any) => ({
    id: String(item.id),
    title: s(item.title, 'Command action'),
    module_key: s(item.module_key, 'global'),
    action_type: s(item.action_type, 'execute'),
    status: s(item.status, 'open'),
    priority: s(item.priority, 'medium'),
    route: s(item.route, '/executive-cockpit'),
    payload: item.payload || {},
    created_at: s(item.created_at, new Date().toISOString()),
  }))

  const escalations = rows(escalationsRes)
  const syncEvents = rows(syncRes)
  const openWorkflows = workflows.filter((x) => !['closed', 'completed', 'cancelled', 'resolved'].includes(x.status.toLowerCase()))
  const openActions = actions.filter((x) => !['closed', 'completed', 'cancelled', 'resolved'].includes(x.status.toLowerCase()))
  const openEscalations = escalations.filter((x: any) => !['closed', 'completed', 'cancelled', 'resolved'].includes(String(x.status || '').toLowerCase()))

  return {
    workflows,
    actions,
    escalations,
    syncEvents,
    openWorkflows,
    openActions,
    openEscalations,
    metrics: [
      { label: 'Open workflows', value: openWorkflows.length, detail: 'Active execution chains', tone: 'blue' as const },
      { label: 'Command actions', value: openActions.length, detail: 'Pending operational commands', tone: 'purple' as const },
      { label: 'Escalations', value: openEscalations.length, detail: 'Cross-module risk items', tone: openEscalations.length ? 'red' as const : 'green' as const },
      { label: 'Sync events', value: syncEvents.length, detail: 'Recorded cross-module signals', tone: 'cyan' as const },
    ],
  }
}
