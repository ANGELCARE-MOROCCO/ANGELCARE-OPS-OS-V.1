import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canViewAccessGovernance } from '@/lib/users/access-governance/registry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const actor = await getCurrentAppUser()
  if (!actor) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
  if (!canViewAccessGovernance(actor)) return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 403 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('access_registry_versions')
    .select('id,version_number,status,checksum,resource_count,module_count,route_count,actor_email,created_at,published_at,rolled_back_at,metadata')
    .order('version_number', { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, versions: data || [] })
}
