import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function isAdmin(user: any) {
  return ['ceo', 'admin', 'super_admin', 'owner'].includes(String(user?.role || '').toLowerCase())
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function normalizeBroadcastUser(user: any) {
  const fullName =
    user.full_name ||
    user.fullName ||
    user.name ||
    user.display_name ||
    user.username ||
    user.email ||
    'Utilisateur'

  return {
    id: String(user.id || ''),
    full_name: fullName,
    username: user.username || '',
    email: user.email || '',
    role: user.role || '',
    status: user.status || 'active',
    department: user.department || '',
    job_title: user.job_title || user.jobTitle || '',
  }
}

function visibleTargets(memo: any, users: any[]) {
  const userIds = safeArray(memo.target_user_ids)
  const roles = safeArray(memo.target_roles).map((item) => item.toLowerCase())

  if (!userIds.length && !roles.length) return users
  return users.filter((user) => userIds.includes(String(user.id)) || roles.includes(String(user.role || '').toLowerCase()))
}

export async function GET() {
  try {
    const user = await requireUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ ok: false, error: 'Admin access required.' }, { status: 403 })
    }

    const supabase = await createClient()

    const [usersResult, memosResult, receiptsResult] = await Promise.all([
      supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('workspace_broadcast_memos')
        .select('id,title,message,memo_type,priority,status,admin_status,situation_key,situation_label,template_key,template_label,target_roles,target_user_ids,starts_at,expires_at,created_at,reminder_count,last_reminder_at,closed_at,closed_by')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('workspace_broadcast_memo_receipts')
        .select('id,memo_id,user_id,acknowledged_at,comment,commented_at,admin_response,admin_responded_at,followup_status,closed_at')
        .order('created_at', { ascending: false }),
    ])

    // Users can fail independently; keep the control tower visible and expose the exact user loading state.
    if (memosResult.error) throw new Error(memosResult.error.message)
    if (receiptsResult.error) throw new Error(receiptsResult.error.message)

    const usersLoadError = usersResult.error?.message || null
    const users = (usersResult.data || [])
      .map(normalizeBroadcastUser)
      .filter((item) => item.id)
      .filter((item) => !['deleted', 'archived', 'inactive_deleted'].includes(String(item.status || '').toLowerCase()))

    const receipts = receiptsResult.data || []

    const usersById = new Map(users.map((item) => [String(item.id), item]))
    const receiptsByMemo = new Map<string, any[]>()

    for (const receipt of receipts) {
      const key = String(receipt.memo_id)
      const list = receiptsByMemo.get(key) || []
      list.push({
        ...receipt,
        user: usersById.get(String(receipt.user_id)) || null,
      })
      receiptsByMemo.set(key, list)
    }

    const now = Date.now()

    const memos = (memosResult.data || []).map((memo) => {
      const targets = visibleTargets(memo, users)
      const memoReceipts = receiptsByMemo.get(String(memo.id)) || []
      const acknowledgedCount = memoReceipts.filter((receipt) => receipt.acknowledged_at).length
      const commentCount = memoReceipts.filter((receipt) => String(receipt.comment || '').trim()).length
      const openCommentCount = memoReceipts.filter((receipt) => String(receipt.comment || '').trim() && receipt.followup_status !== 'closed').length
      const pendingCount = Math.max(0, targets.length - acknowledgedCount)
      const createdMs = new Date(memo.created_at).getTime()
      const delayed = pendingCount > 0 && !Number.isNaN(createdMs) && now - createdMs > 24 * 60 * 60 * 1000

      return {
        ...memo,
        targetUsers: targets,
        receipts: memoReceipts,
        stats: {
          targetCount: targets.length,
          acknowledgedCount,
          pendingCount,
          commentCount,
          openCommentCount,
          delayed,
          reminderCount: memo.reminder_count || 0,
        },
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        users,
        usersLoadError,
        memos,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load broadcast control.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ ok: false, error: 'Admin access required.' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const title = String(body?.title || '').trim()
    const message = String(body?.message || '').trim()
    const priority = String(body?.priority || 'normal').trim()
    const situationKey = String(body?.situationKey || '').trim()
    const situationLabel = String(body?.situationLabel || '').trim()
    const templateKey = String(body?.templateKey || '').trim()
    const templateLabel = String(body?.templateLabel || '').trim()
    const targetUserIds = Array.isArray(body?.targetUserIds) ? body.targetUserIds.map(String).filter(Boolean) : []
    const targetRoles = Array.isArray(body?.targetRoles) ? body.targetRoles.map(String).filter(Boolean) : []

    if (!title) return NextResponse.json({ ok: false, error: 'Title is required.' }, { status: 400 })
    if (!message) return NextResponse.json({ ok: false, error: 'Message is required.' }, { status: 400 })
    if (!targetUserIds.length && !targetRoles.length) {
      return NextResponse.json({ ok: false, error: 'Select at least one user or role target.' }, { status: 400 })
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('workspace_broadcast_memos')
      .insert({
        title,
        message,
        memo_type: situationKey || 'memo',
        priority,
        status: 'active',
        admin_status: 'open',
        situation_key: situationKey,
        situation_label: situationLabel,
        template_key: templateKey,
        template_label: templateLabel,
        target_user_ids: targetUserIds,
        target_roles: targetRoles,
        starts_at: now,
        created_by: user.id,
        created_at: now,
        updated_at: now,
      })
      .select('id,title')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to broadcast memo.',
      },
      { status: 500 },
    )
  }
}
