import { carelinkJson, getCarelinkSupabase, CARELINK_TABLES } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await getCarelinkSupabase()
  if (!supabase) return carelinkJson({ ok: true, source: 'seed', documents: [{ id: 'doc-001', type: 'availability_certificate', status: 'due_soon' }] })
  const { data, error } = await supabase.from(CARELINK_TABLES.documents).select('*').order('expires_at', { ascending: true }).limit(50)
  if (error) return carelinkJson({ ok: false, error: error.message }, { status: 500 })
  return carelinkJson({ ok: true, source: 'supabase', documents: data || [] })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const supabase = await getCarelinkSupabase()
  if (!supabase) return carelinkJson({ ok: true, source: 'seed', queued: true, document: body })
  const { data, error } = await supabase.from(CARELINK_TABLES.documents).insert({
    agent_id: body.agentId || 'agent-demo-001',
    document_type: body.documentType || 'field_document',
    document_url: body.documentUrl || null,
    status: 'pending_review',
    expires_at: body.expiresAt || null,
  }).select('*').single()
  if (error) return carelinkJson({ ok: false, error: error.message }, { status: 500 })
  return carelinkJson({ ok: true, source: 'supabase', document: data })
}
