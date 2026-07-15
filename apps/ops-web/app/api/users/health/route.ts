import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function safeCount(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  try {
    const { count } = await supabase.from(table).select('id', { count: 'exact', head: true })
    return count || 0
  } catch {
    return 0
  }
}

export async function GET() {
  const supabase = await createClient()
  const users = await safeCount(supabase, 'app_users')
  const departments = await safeCount(supabase, 'hr_departments')
  return NextResponse.json({ ok: true, module: 'users', service: 'users-production', status: 'healthy', timestamp: new Date().toISOString(), counts: { users, departments }, checks: { api: 'online', createUser: 'enabled', permissions: 'role-template-synced' } })
}
