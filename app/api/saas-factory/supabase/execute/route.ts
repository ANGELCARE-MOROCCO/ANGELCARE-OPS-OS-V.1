import { NextResponse } from 'next/server'
import { executeSupabaseOperation } from '../../../../../lib/saas-factory/supabase-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    return NextResponse.json(await executeSupabaseOperation(await request.json()))
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Supabase operation failed.' }, { status: 200 })
  }
}
