import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('revenue_command_dashboards').select('*').eq('is_active', true).order('module_group')
  return NextResponse.json({ ok: !error, dashboards: data || [], error: error?.message || null })
}
