import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isAdmin(user: any) {
  return ['ceo', 'admin', 'super_admin', 'owner'].includes(String(user?.role || '').toLowerCase())
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ ok: false, error: 'Admin access required.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => null)
    const action = String(body?.action || '').trim()
    const supabase = await createClient()
    const now = new Date().toISOString()

    if (action === 'reminder') {
      const { data: current, error: loadError } = await supabase
        .from('workspace_broadcast_memos')
        .select('reminder_count')
        .eq('id', id)
        .single()

      if (loadError) throw new Error(loadError.message)

      const { data, error } = await supabase
        .from('workspace_broadcast_memos')
        .update({
          reminder_count: Number(current?.reminder_count || 0) + 1,
          last_reminder_at: now,
          updated_at: now,
        })
        .eq('id', id)
        .select('id,reminder_count,last_reminder_at')
        .single()

      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'close') {
      const { data, error } = await supabase
        .from('workspace_broadcast_memos')
        .update({
          status: 'closed',
          admin_status: 'closed',
          closed_at: now,
          closed_by: user.id,
          updated_at: now,
        })
        .eq('id', id)
        .select('id,status,admin_status,closed_at')
        .single()

      if (error) throw new Error(error.message)

      await supabase
        .from('workspace_broadcast_memo_receipts')
        .update({
          followup_status: 'closed',
          closed_at: now,
          closed_by: user.id,
          updated_at: now,
        })
        .eq('memo_id', id)

      return NextResponse.json({ ok: true, data })
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action.' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to update broadcast memo.',
      },
      { status: 500 },
    )
  }
}
