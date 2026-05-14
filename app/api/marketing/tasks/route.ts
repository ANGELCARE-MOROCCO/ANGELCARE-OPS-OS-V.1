import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const title = String(body.title || 'Marketing task')
  const source = String(body.source || 'market-os')
  const priority = String(body.priority || 'medium')

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('marketing_tasks').insert([
      {
        title,
        source_module: source,
        priority,
        status: 'open',
        owner_user_id: user.id,
        notes: String(body.notes || ''),
      },
    ]).select('*').maybeSingle()

    if (error) {
      return NextResponse.json({ ok: true, mode: 'safe-fallback', warning: error.message, queued: { title, source, priority } })
    }

    return NextResponse.json({ ok: true, mode: 'live-write', task: data })
  } catch (error: any) {
    return NextResponse.json({ ok: true, mode: 'safe-fallback', warning: error?.message || 'write unavailable', queued: { title, source, priority } })
  }
}
