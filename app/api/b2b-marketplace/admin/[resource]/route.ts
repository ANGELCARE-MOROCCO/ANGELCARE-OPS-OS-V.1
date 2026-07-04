import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'
import { getAdminResource } from '@/lib/b2b-marketplace/repository'
import { getAdminResourceDefinition } from '@/lib/b2b-marketplace/admin-resources'
import { deleteLocalAdminRow, getLocalAdminRow, getLocalAdminStoreSummary, upsertLocalAdminRow } from '@/lib/b2b-marketplace/local-admin-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AdminUser = { id?: string; role?: string; permissions?: string[] } | null
type MutationResult = { data: Record<string, unknown> | null; mode: 'supabase' | 'local-file'; warning?: string; before?: unknown }

const PUBLIC_PATHS = [
  '/b2b-marketplace',
  '/b2b-marketplace/categories',
  '/b2b-marketplace/products',
  '/b2b-marketplace/academy',
  '/b2b-marketplace/packs',
  '/b2b-marketplace/custom-pack-builder',
  '/b2b-marketplace/quote-cart',
  '/b2b-marketplace/request-quote',
]

async function requireMarketplaceAdmin(): Promise<{ response?: NextResponse; user?: AdminUser }> {
  try {
    const user = (await getCurrentUser()) as AdminUser
    const allowed = user?.role === 'ceo' || user?.role === 'manager' || user?.permissions?.includes('admin:b2b-marketplace')
    if (!allowed) return { response: NextResponse.json({ ok: false, error: 'Marketplace admin access required' }, { status: 401 }) }
    return { user }
  } catch (error) {
    return { response: NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Admin auth unavailable' }, { status: 401 }) }
  }
}

function sanitizeBody(resource: string, body: Record<string, unknown>) {
  const definition = getAdminResourceDefinition(resource)
  if (!definition) return null
  const allowed = new Set([...definition.fields.map((field) => field.name), definition.idField])
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) if (allowed.has(key)) clean[key] = value
  return clean
}

function getLookup(request: NextRequest, body: Record<string, unknown>, idField: string, keyField?: string) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('id') || (typeof body[idField] === 'string' ? body[idField] as string : '')
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requested)
  if (uuidLike || !keyField) return { field: idField, value: requested }
  const keyValue = searchParams.get(keyField) || (typeof body[keyField] === 'string' ? body[keyField] as string : '')
  return { field: keyField, value: keyValue || requested }
}

function revalidateMarketplace() {
  for (const path of PUBLIC_PATHS) {
    try { revalidatePath(path) } catch {}
  }
  try { revalidatePath('/b2b-marketplace', 'layout') } catch {}
}

async function audit(user: AdminUser, action: string, resource: string, id: string | null, beforeData: unknown, afterData: unknown, mode: string) {
  if (!isSupabaseServerConfigured()) return
  try {
    const supabase = await createClient()
    await supabase.from('b2b_marketplace_admin_audit_logs').insert({
      actor_user_id: user?.id || null,
      action: `${action}:${mode}`,
      resource_type: resource,
      resource_id: id,
      before_data: beforeData || null,
      after_data: afterData || null,
    })
  } catch {}
}

async function trySupabaseInsert(table: string, clean: Record<string, unknown>): Promise<MutationResult> {
  if (!isSupabaseServerConfigured()) return { data: null, mode: 'local-file', warning: 'Supabase server env missing; using local file persistence.' }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).insert(clean).select('*').single()
    if (error) return { data: null, mode: 'local-file', warning: error.message }
    return { data: data as Record<string, unknown>, mode: 'supabase' }
  } catch (error) {
    return { data: null, mode: 'local-file', warning: error instanceof Error ? error.message : 'Supabase insert unavailable' }
  }
}

async function trySupabaseUpdate(table: string, clean: Record<string, unknown>, lookup: { field: string; value: string }): Promise<MutationResult> {
  if (!isSupabaseServerConfigured()) return { data: null, mode: 'local-file', warning: 'Supabase server env missing; using local file persistence.' }
  try {
    const supabase = await createClient()
    const { data: before } = await supabase.from(table).select('*').eq(lookup.field, lookup.value).maybeSingle()
    const { data, error } = await supabase.from(table).update(clean).eq(lookup.field, lookup.value).select('*').maybeSingle()
    if (error || !data) return { data: null, mode: 'local-file', warning: error?.message || 'No Supabase row matched; using local override.', before }
    return { data: data as Record<string, unknown>, mode: 'supabase', before }
  } catch (error) {
    return { data: null, mode: 'local-file', warning: error instanceof Error ? error.message : 'Supabase update unavailable' }
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  const { resource } = await params
  const definition = getAdminResourceDefinition(resource)
  if (!definition) return NextResponse.json({ ok: false, error: 'Admin resource not found' }, { status: 404 })
  const data = await getAdminResource(resource)
  return NextResponse.json({ ok: true, data, resource, definition, store: getLocalAdminStoreSummary() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  const { resource } = await params
  const definition = getAdminResourceDefinition(resource)
  if (!definition) return NextResponse.json({ ok: false, error: 'Admin resource not found' }, { status: 404 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const clean = sanitizeBody(resource, body)
  if (!clean) return NextResponse.json({ ok: false, error: 'Invalid resource' }, { status: 400 })
  delete clean[definition.idField]

  const supabaseResult = await trySupabaseInsert(definition.table, clean)
  let data = supabaseResult.data
  let mode = supabaseResult.mode
  let warning = supabaseResult.warning

  if (!data) {
    data = upsertLocalAdminRow(definition.table, clean, { idField: definition.idField, keyField: definition.keyField })
    mode = 'local-file'
  }

  revalidateMarketplace()
  await audit(guard.user!, 'create', resource, String(data?.[definition.idField] || data?.[definition.keyField || ''] || ''), null, data, mode)
  return NextResponse.json({ ok: true, resource, action: 'create', persistenceMode: mode, warning, data, store: getLocalAdminStoreSummary() }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  const { resource } = await params
  const definition = getAdminResourceDefinition(resource)
  if (!definition) return NextResponse.json({ ok: false, error: 'Admin resource not found' }, { status: 404 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const lookup = getLookup(request, body, definition.idField, definition.keyField)
  const id = lookup.value
  if (!id) return NextResponse.json({ ok: false, error: 'Missing record id' }, { status: 400 })
  const clean = sanitizeBody(resource, body)
  if (!clean) return NextResponse.json({ ok: false, error: 'Invalid resource' }, { status: 400 })
  delete clean[definition.idField]

  const localBefore = getLocalAdminRow(definition.table, lookup.field, id)
  const supabaseResult = await trySupabaseUpdate(definition.table, clean, lookup)
  let data = supabaseResult.data
  let mode = supabaseResult.mode
  let warning = supabaseResult.warning
  const before = supabaseResult.before || localBefore

  if (!data) {
    data = upsertLocalAdminRow(definition.table, clean, { idField: definition.idField, keyField: definition.keyField, lookupField: lookup.field, lookupValue: id })
    mode = 'local-file'
  }

  revalidateMarketplace()
  await audit(guard.user!, 'update', resource, id, before, data, mode)
  return NextResponse.json({ ok: true, resource, action: 'update', persistenceMode: mode, warning, data, store: getLocalAdminStoreSummary() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  const { resource } = await params
  const definition = getAdminResourceDefinition(resource)
  if (!definition) return NextResponse.json({ ok: false, error: 'Admin resource not found' }, { status: 404 })

  const lookup = getLookup(request, {}, definition.idField, definition.keyField)
  const id = lookup.value
  if (!id) return NextResponse.json({ ok: false, error: 'Missing record id' }, { status: 400 })

  let mode: 'supabase' | 'local-file' = 'local-file'
  let warning: string | undefined
  const before = getLocalAdminRow(definition.table, lookup.field, id)

  if (isSupabaseServerConfigured()) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from(definition.table).delete().eq(lookup.field, id)
      if (error) warning = error.message
      else mode = 'supabase'
    } catch (error) {
      warning = error instanceof Error ? error.message : 'Supabase delete unavailable'
    }
  }

  const deletedLocal = deleteLocalAdminRow(definition.table, lookup.field, id)
  revalidateMarketplace()
  await audit(guard.user!, 'delete', resource, id, before, null, mode)
  return NextResponse.json({ ok: true, resource, action: 'delete', id, deletedLocal, persistenceMode: mode, warning, store: getLocalAdminStoreSummary() }, { headers: { 'Cache-Control': 'no-store' } })
}
