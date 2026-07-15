import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function normalizeRole(role: unknown) {
  return String(role || '').trim().toLowerCase()
}

function memoVisibleForUser(memo: any, user: any) {
  const role = normalizeRole(user.role)
  const userId = String(user.id || '')

  const roles = Array.isArray(memo.target_roles) ? memo.target_roles.map(normalizeRole).filter(Boolean) : []
  const userIds = Array.isArray(memo.target_user_ids) ? memo.target_user_ids.map(String) : []

  if (!roles.length && !userIds.length) return true
  if (roles.includes(role)) return true
  if (userIds.includes(userId)) return true
  return false
}

export async function GET() {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const now = new Date().toISOString()

    const { data: memos, error: memoError } = await supabase
      .from('workspace_broadcast_memos')
      .select('id,title,message,memo_type,priority,status,target_roles,target_user_ids,starts_at,expires_at,created_at')
      .eq('status', 'active')
      .lte('starts_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (memoError) {
      return NextResponse.json(
        {
          ok: false,
          error: memoError.message,
        },
        { status: 500 },
      )
    }

    const visibleMemos = (memos || []).filter((memo) => memoVisibleForUser(memo, user))
    const memoIds = visibleMemos.map((memo) => memo.id)

    let receipts: any[] = []
    if (memoIds.length) {
      const { data: receiptRows } = await supabase
        .from('workspace_broadcast_memo_receipts')
        .select('id,memo_id,user_id,acknowledged_at,comment,commented_at')
        .eq('user_id', user.id)
        .in('memo_id', memoIds)

      receipts = receiptRows || []
    }

    const receiptByMemo = new Map(receipts.map((receipt) => [String(receipt.memo_id), receipt]))

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          fullName: user.full_name || user.fullName || user.username || 'ANGELCARE User',
          username: user.username || '',
          email: user.email || '',
          role: user.role || 'user',
          status: user.status || 'active',
          department: user.department || '',
          phone: user.phone || '',
          jobTitle: user.job_title || user.jobTitle || '',
          language: user.language || '',
          permissions: Array.isArray(user.permissions) ? user.permissions : [],
        },
        memos: visibleMemos.map((memo) => {
          const receipt = receiptByMemo.get(String(memo.id))
          return {
            ...memo,
            acknowledgedAt: receipt?.acknowledged_at || null,
            comment: receipt?.comment || '',
            commentedAt: receipt?.commented_at || null,
          }
        }),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load account space.',
      },
      { status: 500 },
    )
  }
}
