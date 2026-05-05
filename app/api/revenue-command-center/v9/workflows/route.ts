import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('revenue_command_workflows').select('*').eq('is_active', true).order('created_at', { ascending: false })
  return NextResponse.json({ ok: !error, workflows: data || [], error: error?.message || null })
}
