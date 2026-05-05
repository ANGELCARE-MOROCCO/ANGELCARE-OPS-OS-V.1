import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const tables = ['revenue_command_records','revenue_command_action_logs','revenue_command_workflows','revenue_command_feature_registry']
  const result: Record<string, number> = {}
  for (const table of tables) {
    try {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
      result[table] = count || 0
    } catch {
      result[table] = 0
    }
  }
  return NextResponse.json({ ok: true, pulse: 99, tables: result, generated_at: new Date().toISOString() })
}
