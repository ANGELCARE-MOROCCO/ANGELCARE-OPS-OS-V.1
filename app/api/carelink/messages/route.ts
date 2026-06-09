import { carelinkJson, getCarelinkSupabase, CARELINK_TABLES } from '@/lib/carelink/server'
import { seedMessages } from '@/lib/carelink/seed'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await getCarelinkSupabase()
  if (!supabase) return carelinkJson({ ok: true, source: 'seed', messages: seedMessages })
  try {
    const { data, error } = await supabase.from(CARELINK_TABLES.messages).select('*').order('created_at', { ascending: false }).limit(50)
    if (error) throw new Error(error.message)
    return carelinkJson({ ok: true, source: 'supabase', messages: data || [] })
  } catch {
    return carelinkJson({ ok: true, source: 'seed', messages: seedMessages })
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const supabase = await getCarelinkSupabase()
  if (!supabase) return carelinkJson({ ok: true, source: 'seed', queued: true, message: body })
  const { data, error } = await supabase.from(CARELINK_TABLES.messages).insert({
    mission_id: body.missionId || null,
    sender: 'agent',
    title: body.title || 'MESSAGE AGENT TERRAIN',
    body: body.body || body.message || '',
    urgent: Boolean(body.urgent),
  }).select('*').single()
  if (error) return carelinkJson({ ok: false, error: error.message }, { status: 500 })
  return carelinkJson({ ok: true, source: 'supabase', message: data })
}
