import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TABLES = [
  'market_os_campaigns',
  'market_os_campaign_tasks',
  'market_os_campaign_budget_entries',
  'market_os_campaign_calendar_items',
  'market_os_campaign_approvals',
  'market_os_campaign_assets',
  'market_os_campaign_risks',
] as const

const WORKSPACE_ROW_ID = '00000000-0000-4000-8000-000000000111'
const WORKSPACE_ROW_TITLE = '__ANGELCARE_MARKET_OS_CAMPAIGN_LIFECYCLE_WORKSPACE__'

type AnyRow = Record<string, any>

function isSupportedTable(value: string) {
  return TABLES.includes(value as any)
}

async function audit(supabase: Awaited<ReturnType<typeof createClient>>, payload: AnyRow) {
  try {
    await supabase.from('market_os_audit_log').insert({
      action_key: payload.action || 'market_os_campaign_lifecycle',
      title: payload.title || 'Market OS campaign lifecycle update',
      engine: 'market-os',
      payload,
    })
  } catch (error) {
    console.error('[MARKET_OS_CAMPAIGN_AUDIT_FAILED]', error)
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(req.url)
    const mode = url.searchParams.get('mode')
    const table = url.searchParams.get('table')

    if (mode === 'workspace') {
      const { data, error } = await supabase
        .from('market_os_campaigns')
        .select('id,title,payload,updated_at')
        .eq('id', WORKSPACE_ROW_ID)
        .maybeSingle()

      if (error) {
        console.error('[MARKET_OS_WORKSPACE_LOAD_FAILED]', error)
        return NextResponse.json({ ok: false, live: false, error: error.message, state: null }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        live: true,
        state: data?.payload?.state || null,
        updatedAt: data?.updated_at || null,
      })
    }

    if (table) {
      if (!isSupportedTable(table)) {
        return NextResponse.json({ ok: false, live: false, error: 'Unsupported campaign lifecycle table.' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(2000)

      if (error) {
        console.error('[MARKET_OS_CAMPAIGN_TABLE_LOAD_FAILED]', { table, error })
        return NextResponse.json({ ok: false, live: false, error: error.message, data: [] }, { status: 500 })
      }

      return NextResponse.json({ ok: true, live: true, table, data: data || [] })
    }

    const data: Record<string, AnyRow[]> = {}

    for (const item of TABLES) {
      const { data: rows, error } = await supabase.from(item).select('*').limit(2000)

      if (error) {
        console.error('[MARKET_OS_CAMPAIGN_LOAD_FAILED]', { table: item, error })
        return NextResponse.json({ ok: false, live: false, error: error.message, data }, { status: 500 })
      }

      data[item] = rows || []
    }

    return NextResponse.json({ ok: true, live: true, data })
  } catch (error) {
    console.error('[MARKET_OS_CAMPAIGN_GET_CRASHED]', error)
    return NextResponse.json({ ok: false, live: false, error: 'Unable to load campaign lifecycle data.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json().catch(() => ({}))

    if (body?.mode === 'workspace') {
      const state = body.state || {}

      const row = {
        id: WORKSPACE_ROW_ID,
        title: WORKSPACE_ROW_TITLE,
        objective: 'Live Market OS campaign lifecycle workspace state',
        owner: 'Market-OS',
        city: 'Global',
        status: 'active',
        payload: {
          state,
          source: 'campaign_lifecycle_workspace',
          savedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('market_os_campaigns')
        .upsert(row, { onConflict: 'id' })
        .select('id,title,payload,updated_at')
        .single()

      if (error) {
        console.error('[MARKET_OS_WORKSPACE_SAVE_FAILED]', error)
        return NextResponse.json({ ok: false, live: false, error: error.message }, { status: 500 })
      }

      await audit(supabase, {
        action: 'market_os_campaign_lifecycle_workspace_saved',
        title: 'Campaign lifecycle workspace saved live',
        rowId: WORKSPACE_ROW_ID,
      })

      return NextResponse.json({ ok: true, live: true, row: data })
    }

    const table = String(body.table || '')

    if (!isSupportedTable(table)) {
      return NextResponse.json({ ok: false, live: false, error: 'Unsupported campaign lifecycle table.' }, { status: 400 })
    }

    const rows = Array.isArray(body.rows)
      ? body.rows
      : Array.isArray(body.data)
        ? body.data
        : body.row
          ? [body.row]
          : []

    if (!rows.length) {
      return NextResponse.json({ ok: false, live: false, error: 'No row data received.' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ ok: false, live: false, error: 'Maximum 500 records per request.' }, { status: 400 })
    }

    const cleaned = rows.map((row: AnyRow) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from(table)
      .upsert(cleaned, { onConflict: 'id' })
      .select('*')

    if (error) {
      console.error('[MARKET_OS_CAMPAIGN_SAVE_FAILED]', { table, error })
      return NextResponse.json({ ok: false, live: false, error: error.message }, { status: 500 })
    }

    await audit(supabase, {
      action: body.action || 'campaign_lifecycle_upsert',
      title: body.title || `${table} upsert`,
      table,
      count: cleaned.length,
    })

    return NextResponse.json({
      ok: true,
      live: true,
      table,
      row: body.row ? data?.[0] || null : undefined,
      data: data || [],
    })
  } catch (error) {
    console.error('[MARKET_OS_CAMPAIGN_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, live: false, error: 'Unable to save campaign lifecycle data.' }, { status: 500 })
  }
}
