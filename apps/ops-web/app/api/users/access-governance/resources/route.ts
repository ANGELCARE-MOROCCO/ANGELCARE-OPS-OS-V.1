import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canViewAccessGovernance } from '@/lib/users/access-governance/registry'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewAccessGovernance(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const supabase = await createClient()
  let query = supabase.from('access_resource_registry').select('*').order('display_name', { ascending: true }).limit(20000)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, resources: data || [] })
}
