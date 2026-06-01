import { NextResponse } from 'next/server'
import { getSupabaseSummary } from '../../../../../lib/saas-factory/supabase-runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getSupabaseSummary())
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Supabase summary failed' }, { status: 200 })
  }
}
