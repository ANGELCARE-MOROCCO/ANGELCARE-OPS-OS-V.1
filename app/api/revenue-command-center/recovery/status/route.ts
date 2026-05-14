import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { count: recoveredEntities } = await supabase.from('revenue_command_recovered_entities').select('*', { count: 'exact', head: true })
    const { count: centralRecords } = await supabase.from('revenue_command_records').select('*', { count: 'exact', head: true }).contains('metadata', { recovered: true })
    return NextResponse.json({ ok: true, recoveredEntities: recoveredEntities || 0, centralRecords: centralRecords || 0 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Recovery status unavailable' }, { status: 500 })
  }
}
