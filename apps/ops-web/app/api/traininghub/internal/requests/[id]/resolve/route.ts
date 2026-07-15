import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/traininghub/production/server'
import { resolveRequest } from '@/lib/traininghub/production/workflows'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = adminClient()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const result = await resolveRequest(supabase, id, body)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
