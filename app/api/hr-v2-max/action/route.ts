import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action_type = String(body.action_type || 'manual')
    const title = String(body.title || 'HR manual action')
    const description = String(body.description || '')
    const target_route = String(body.target_route || '/hr/actions')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('hr_execution_action_queue')
      .insert({ action_type, title, description, target_route, priority: body.priority || 'medium', status: 'pending', metadata: body.metadata || {} })
      .select('*')
      .single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
