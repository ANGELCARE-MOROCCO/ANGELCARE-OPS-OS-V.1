import { carelinkJson, getCarelinkSupabase, CARELINK_TABLES } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return carelinkJson({ ok: true, availability: { status: 'available', windows: [], source: 'carelink' } })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const supabase = await getCarelinkSupabase()
  if (!supabase) return carelinkJson({ ok: true, source: 'seed', saved: true, availability: body })
  const { data, error } = await supabase.from(CARELINK_TABLES.availability).insert({
    agent_id: body.agentId || 'agent-demo-001',
    starts_at: body.startsAt || null,
    ends_at: body.endsAt || null,
    status: body.status || 'available',
    note: body.note || null,
  }).select('*').single()
  if (error) return carelinkJson({ ok: false, error: error.message }, { status: 500 })
  return carelinkJson({ ok: true, source: 'supabase', availability: data })
}
