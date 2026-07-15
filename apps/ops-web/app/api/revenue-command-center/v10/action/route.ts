import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type JsonBody = Record<string, unknown>

type RevenueCommandUpdate = {
  updated_at: string
  status?: string
  priority?: string
  risk_level?: string
  owner_name?: string
  [key: string]: unknown
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

const TABLE = 'revenue_command_records'
const LOGS = 'revenue_command_action_logs'

function updatesForAction(action: string, explicit: JsonBody = {}): RevenueCommandUpdate {
  const update: RevenueCommandUpdate = {
    ...(explicit || {}),
    updated_at: new Date().toISOString(),
  }

  const normalizedAction = action.toLowerCase()

  if (normalizedAction.includes('complete') || normalizedAction === 'bulk_done') update.status = 'Done'
  if (normalizedAction.includes('start')) update.status = 'In progress'
  if (normalizedAction.includes('urgent')) update.priority = 'urgent'

  if (normalizedAction.includes('escalate') || normalizedAction.includes('block')) {
    update.status = 'Blocked'
    update.risk_level = 'high'
    update.priority = typeof update.priority === 'string' ? update.priority : 'urgent'
  }

  if (normalizedAction.includes('assign')) {
    update.owner_name = typeof explicit.owner_name === 'string' && explicit.owner_name.trim() ? explicit.owner_name : 'Amina'
  }

  if (normalizedAction.includes('archive')) update.status = 'Archived'

  return update
}

function normalizeSelected(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => String(item))
    .filter((item) => item.length > 0 && !item.startsWith('local'))
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as JsonBody
    const supabase = await createClient()

    const action = String(payload.action || 'unknown')
    const module = String(payload.module || 'revenue_hq')
    const page = String(payload.page || '/revenue-command-center')
    const selected = normalizeSelected(payload.selected)
    const explicitUpdates = typeof payload.updates === 'object' && payload.updates !== null ? (payload.updates as JsonBody) : {}
    const update = updatesForAction(action, explicitUpdates)

    let updated: JsonBody[] = []

    if (selected.length) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(update)
        .in('id', selected)
        .select('*')

      if (error) return json({ ok: false, error: error.message }, 500)

      updated = (data || []) as JsonBody[]
    }

    try {
      await supabase
        .from(LOGS)
        .insert({
          module_key: module,
          page_key: page,
          action_key: action,
          selected_count: selected.length,
          payload: {
            ...payload,
            applied_update: update,
          },
          status: 'logged',
        })
        .throwOnError()
    } catch {
      // Audit logging must never block the main action endpoint.
    }

    return json({
      ok: true,
      action,
      module,
      page,
      selected_count: selected.length,
      updated,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'action failed'
    return json({ ok: false, error: message }, 500)
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from(LOGS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return json({ ok: false, logs: [], error: error.message }, 500)

    return json({ ok: true, logs: data || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'logs failed'
    return json({ ok: false, logs: [], error: message }, 500)
  }
}