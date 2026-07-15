import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseServerConfigured } from '@/lib/supabase/env'
import { listQuoteRequests } from '@/lib/b2b-marketplace/crm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AdminUser = { id?: string; email?: string; name?: string; role?: string; permissions?: string[] } | null

async function requireMarketplaceAdmin(): Promise<{ response?: NextResponse; user?: AdminUser }> {
  try {
    const user = (await getCurrentUser()) as AdminUser
    const allowed = user?.role === 'ceo' || user?.role === 'manager' || user?.permissions?.includes('admin:b2b-marketplace')
    if (!allowed) return { response: NextResponse.json({ ok: false, error: 'Marketplace CRM admin access required' }, { status: 401 }) }
    return { user }
  } catch (error) {
    return { response: NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Admin auth unavailable' }, { status: 401 }) }
  }
}

export async function GET(request: NextRequest) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  const { searchParams } = new URL(request.url)
  const data = await listQuoteRequests({
    status: searchParams.get('status') || undefined,
    source: searchParams.get('source') || undefined,
    city: searchParams.get('city') || undefined,
    priority: searchParams.get('priority') || undefined,
    assigned: searchParams.get('assigned') || undefined,
    search: searchParams.get('q') || undefined,
  })
  return NextResponse.json({ ok: true, data })
}

export async function POST(request: NextRequest) {
  const guard = await requireMarketplaceAdmin()
  if (guard.response) return guard.response
  if (!isSupabaseServerConfigured()) return NextResponse.json({ ok: false, error: 'Supabase server env required' }, { status: 503 })
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const supabase = await createClient()
  const quoteReference = String(body.quote_reference || `AC-B2B-CRM-${Date.now().toString(36).toUpperCase()}`)
  const { data, error } = await supabase.from('b2b_marketplace_quote_requests').insert({
    quote_reference: quoteReference,
    school_name: String(body.school_name || body.schoolName || 'Demande B2B'),
    contact_name: String(body.contact_name || body.contactName || 'Contact à compléter'),
    phone: String(body.phone || ''),
    email: String(body.email || ''),
    city: String(body.city || ''),
    message: String(body.message || ''),
    status: String(body.status || 'new_request'),
    priority: String(body.priority || 'normal'),
    request_type: String(body.request_type || 'manual_admin'),
    source: String(body.source || 'admin_created'),
    estimated_total_mad: Number(body.estimated_total_mad || 0),
    assigned_name: String(body.assigned_name || ''),
    next_action: String(body.next_action || ''),
  }).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data }, { status: 201 })
}
