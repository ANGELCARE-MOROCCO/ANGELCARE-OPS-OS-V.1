import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const checks = await Promise.all([
    supabase.from('market_os_records').select('id', { count: 'exact', head: true }),
    supabase.from('market_os_agents').select('id', { count: 'exact', head: true }),
    supabase.from('market_os_kpis').select('id', { count: 'exact', head: true }),
    supabase.from('market_os_actions').select('id', { count: 'exact', head: true }),
    supabase.from('market_os_audit').select('id', { count: 'exact', head: true }),
    supabase.from('market_os_sessions').select('id', { count: 'exact', head: true }),
  ])

  const error = checks.find((check) => check.error)?.error
  if (error) return NextResponse.json({ status: 'error', error: error.message }, { status: 500 })
  return NextResponse.json({ status: 'ok', module: 'market-os', checked_at: new Date().toISOString() })
}
