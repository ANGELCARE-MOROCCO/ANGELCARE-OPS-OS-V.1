import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const supabase = await createClient()

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('workspace_broadcast_memo_receipts')
      .upsert(
        {
          memo_id: id,
          user_id: user.id,
          acknowledged_at: now,
          updated_at: now,
        },
        {
          onConflict: 'memo_id,user_id',
        },
      )
      .select('id,memo_id,acknowledged_at,comment,commented_at')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to acknowledge memo.',
      },
      { status: 500 },
    )
  }
}
