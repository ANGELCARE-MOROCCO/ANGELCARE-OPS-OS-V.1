import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/traininghub/production/server'
import { readDossier } from '@/lib/traininghub/production/workflows'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = adminClient()
  if (!supabase) return NextResponse.json({ ok: false, message: 'Supabase non configuré.' }, { status: 500 })
  const { id } = await context.params
  const result = await readDossier(supabase, id)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
