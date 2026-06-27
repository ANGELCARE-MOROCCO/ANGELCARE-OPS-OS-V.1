import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

type Row = Record<string, any>

function normalize(value: unknown) {
  return String(value || '').trim()
}

function lower(value: unknown) {
  return normalize(value).toLowerCase()
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => normalize(item)).filter(Boolean) : []
}

function extractLine(message: unknown, key: string) {
  const text = normalize(message)
  const prefix = `${key.toLowerCase()}:`
  const line = text.split('\n').find((entry) => entry.trim().toLowerCase().startsWith(prefix))
  return line ? line.split(':').slice(1).join(':').trim() : ''
}

function extractLink(message: unknown) {
  const text = normalize(message)
  const match = text.match(/(?:COURSE_LINK|OPEN_URL|ACTION_URL):\s*(\/[^\s]+)/i)
  return match?.[1] || null
}

function isTrainingMemo(memo: Row) {
  const title = lower(memo.title)
  const message = lower(memo.message)

  return (
    lower(memo.memo_type) === 'hr_training_assignment' ||
    title.includes('formation assignée') ||
    message.includes('/hr/training/online/') ||
    message.includes('course_link:') ||
    message.includes('resource_id:')
  )
}

function memoTargetsCurrentUser(memo: Row, userId: string, userEmail: string) {
  const targetUserIds = asArray(memo.target_user_ids)
  const message = normalize(memo.message)
  const memoEmail = lower(extractLine(message, 'EMAIL') || extractLine(message, 'EMPLOYEE_EMAIL'))

  if (targetUserIds.length && userId && targetUserIds.includes(userId)) return true
  if (memoEmail && userEmail && memoEmail === userEmail) return true

  // Personal red-bell rule:
  // no target_user_ids and no EMAIL/EMPLOYEE_EMAIL means it is not personal.
  // Global/internal broadcast noise must not appear in every user's red bell.
  return false
}

function memoToNotification(memo: Row) {
  const memoId = normalize(memo.id)
  const createdAt = normalize(memo.created_at) || new Date().toISOString()
  const message = normalize(memo.message)
  const linkUrl = extractLink(message)

  return {
    id: `broadcast-${memoId}`,
    memoId,
    targetId: memoId,
    title: normalize(memo.title) || 'Personal command alert',
    body: message,
    message,
    description: message,
    situation: isTrainingMemo(memo) ? 'HR Training' : normalize(memo.memo_type || 'Broadcast memo'),
    type: isTrainingMemo(memo) ? 'hr_training_assignment' : normalize(memo.memo_type || 'broadcast'),
    source_type: isTrainingMemo(memo) ? 'hr_training_assignment' : normalize(memo.memo_type || 'broadcast'),
    priority: normalize(memo.priority) || 'normal',
    status: 'unread',
    read: false,
    unread: true,
    is_read: false,
    createdAt,
    created_at: createdAt,
    linkUrl,
    href: linkUrl,
    url: linkUrl,
    actionUrl: linkUrl,
    action_url: linkUrl,
    route: linkUrl,
    cta_href: linkUrl,
    cta_label: linkUrl ? 'Open training course' : 'Open memo',
  }
}

async function supabaseForRoute() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY

  if (url && serviceKey) {
    return createSupabaseAdminClient(url, serviceKey, { auth: { persistSession: false } })
  }

  return await createSupabaseServerClient()
}

async function currentUserIdentity(supabase: any) {
  const user = await getCurrentAppUser().catch(() => null)
  const userId = normalize((user as Row | null)?.id)
  let userEmail = lower((user as Row | null)?.email || (user as Row | null)?.user_email || (user as Row | null)?.username)

  if (userId && !userEmail) {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('email,username,user_email')
        .eq('id', userId)
        .maybeSingle()

      userEmail = lower(data?.email || data?.user_email || data?.username)
    } catch {}
  }

  return { user, userId, userEmail }
}

export async function GET() {
  try {
    const supabase = await supabaseForRoute()
    const { userId, userEmail } = await currentUserIdentity(supabase)

    if (!userId && !userEmail) {
      return NextResponse.json({
        ok: true,
        data: [],
        notifications: [],
        unreadCount: 0,
        source: 'no_current_user',
      })
    }

    let readMemoIds = new Set<string>()

    if (userId) {
      try {
        const { data: receipts } = await supabase
          .from('workspace_broadcast_memo_receipts')
          .select('memo_id,user_id,acknowledged_at,closed_at')
          .eq('user_id', userId)
          .limit(1000)

        readMemoIds = new Set((receipts || []).map((receipt: Row) => normalize(receipt.memo_id)).filter(Boolean))
      } catch {}
    }

    const { data: memos, error } = await supabase
      .from('workspace_broadcast_memos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(120)

    if (error) {
      return NextResponse.json({
        ok: false,
        data: [],
        notifications: [],
        unreadCount: 0,
        error: error.message,
      })
    }

    const now = Date.now()

    const notifications = (memos || [])
      .filter((memo: Row) => {
        const status = lower(memo.status || 'active')
        if (!['active', 'open', 'sent', 'broadcasted', 'published'].includes(status)) return false

        const startsAt = memo.starts_at ? new Date(memo.starts_at).getTime() : 0
        const expiresAt = memo.expires_at ? new Date(memo.expires_at).getTime() : 0

        if (startsAt && startsAt > now) return false
        if (expiresAt && expiresAt < now) return false
        if (readMemoIds.has(normalize(memo.id))) return false

        return memoTargetsCurrentUser(memo, userId, userEmail)
      })
      .map(memoToNotification)
      .slice(0, 20)

    return NextResponse.json({
      ok: true,
      data: notifications,
      notifications,
      unreadCount: notifications.length,
      source: notifications.length ? 'workspace_broadcast_memos' : 'empty',
    })
  } catch (error) {
    return NextResponse.json({
      ok: true,
      data: [],
      notifications: [],
      unreadCount: 0,
      source: 'safe_empty',
      error: error instanceof Error ? error.message : 'Broadcast notifications unavailable',
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await supabaseForRoute()
    const { userId } = await currentUserIdentity(supabase)

    const body = await request.json().catch(() => ({}))
    const rawId = normalize(body.memoId || body.targetId || body.id || body.notificationId)
    const memoId = rawId.replace(/^broadcast-/, '').replace(/^hr-training-/, '')
    const now = new Date().toISOString()

    if (memoId && userId) {
      try {
        await supabase
          .from('workspace_broadcast_memo_receipts')
          .upsert(
            {
              memo_id: memoId,
              user_id: userId,
              acknowledged_at: now,
              created_at: now,
              updated_at: now,
            },
            { onConflict: 'memo_id,user_id' },
          )
      } catch {}
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
