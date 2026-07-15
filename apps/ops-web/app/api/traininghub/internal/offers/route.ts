import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/traininghub/production/server'
import { createOffer } from '@/lib/traininghub/production/workflows'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = adminClient()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })
  const body = await request.json().catch(() => ({}))
  const result = await createOffer(supabase, body)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
