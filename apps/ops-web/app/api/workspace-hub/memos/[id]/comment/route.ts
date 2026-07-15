import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await request.json().catch(() => null)
    const comment = String(body?.comment || '').trim()

    if (!comment) {
      return NextResponse.json({ ok: false, error: 'Comment is required.' }, { status: 400 })
    }

    if (comment.length > 1500) {
      return NextResponse.json({ ok: false, error: 'Comment is too long.' }, { status: 400 })
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('workspace_broadcast_memo_receipts')
      .upsert(
        {
          memo_id: id,
          user_id: user.id,
          comment,
          commented_at: now,
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
        error: error instanceof Error ? error.message : 'Unable to save memo comment.',
      },
      { status: 500 },
    )
  }
}
