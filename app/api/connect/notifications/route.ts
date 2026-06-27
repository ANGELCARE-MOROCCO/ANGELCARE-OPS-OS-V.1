import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createNotification, getNotifications, markNotificationsRead } from '@/lib/connect/connect-repository'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'


function acExtractTrainingCourseLinkFromMemo(message: unknown) {
  const text = String(message || '')
  const match = text.match(/(?:COURSE_LINK|OPEN_URL|ACTION_URL):\s*(\/[^\s]+)/i)
  return match?.[1] || null
}

function acNormalizeConnectEmail(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function acConnectMemoTargetsUser(memo: any, userIds: string[], userEmail: string) {
  const targetUserIds = Array.isArray(memo?.target_user_ids)
    ? memo.target_user_ids.map((value: any) => String(value || '').trim()).filter(Boolean)
    : []

  const message = String(memo?.message || '')
  const memoEmail =
    acNormalizeConnectEmail(message.match(/EMAIL:\s*([^\s]+)/i)?.[1]) ||
    acNormalizeConnectEmail(message.match(/EMPLOYEE_EMAIL:\s*([^\s]+)/i)?.[1])

  if (targetUserIds.length && userIds.some((id) => targetUserIds.includes(id))) return true
  if (userEmail && memoEmail && userEmail === memoEmail) return true

  return targetUserIds.length === 0 && !memoEmail
}

function acMemoToConnectNotification(memo: any) {
  const linkUrl = acExtractTrainingCourseLinkFromMemo(memo?.message)
  const memoId = String(memo?.id || '')
  const createdAt = String(memo?.created_at || new Date().toISOString())
  const message = String(memo?.message || '')

  return {
    id: `hr-training-${memoId}`,
    notification_id: `hr-training-${memoId}`,
    memoId,
    source_id: memoId,
    targetId: null,
    title: String(memo?.title || 'Formation assignée'),
    body: message,
    message,
    content: message,
    description: message,
    situation: 'HR Training',
    type: 'hr_training_assignment',
    source_type: 'hr_training_assignment',
    priority: String(memo?.priority || 'normal'),
    status: 'unread',
    read: false,
    is_read: false,
    unread: true,
    createdAt,
    created_at: createdAt,
    linkUrl,
    href: linkUrl,
    url: linkUrl,
    actionUrl: linkUrl,
    action_url: linkUrl,
    route: linkUrl,
    cta_href: linkUrl,
    cta_label: 'Open training course',
  }
}


export async function GET() {
  try {
    const user = await getCurrentAppUser()

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, data: { notifications: [] }, notifications: [], error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const baseNotifications = await getNotifications(user as any)
    let trainingNotifications: any[] = []

    try {
      const supabase = await createSupabaseServerClient()
      const userId = String((user as any).id || '')
      const userIds = [userId].filter(Boolean)
      const userEmail = acNormalizeConnectEmail((user as any).email || (user as any).user_email || (user as any).username)

      const { data: memos } = await supabase
        .from('workspace_broadcast_memos')
        .select('id,title,message,memo_type,priority,status,target_user_ids,created_at,starts_at,expires_at')
        .eq('memo_type', 'hr_training_assignment')
        .in('status', ['active', 'open', 'sent', 'broadcasted', 'published'])
        .order('created_at', { ascending: false })
        .limit(80)

      const now = Date.now()

      trainingNotifications = (memos || [])
        .filter((memo: any) => {
          const startsAt = memo.starts_at ? new Date(memo.starts_at).getTime() : 0
          const expiresAt = memo.expires_at ? new Date(memo.expires_at).getTime() : 0

          if (startsAt && startsAt > now) return false
          if (expiresAt && expiresAt < now) return false

          return acConnectMemoTargetsUser(memo, userIds, userEmail)
        })
        .map(acMemoToConnectNotification)
    } catch {
      trainingNotifications = []
    }

    const seen = new Set<string>()
    const notifications = [...trainingNotifications, ...(Array.isArray(baseNotifications) ? baseNotifications : [])]
      .filter((notice: any) => {
        const key = String(notice?.id || notice?.notification_id || notice?.memoId || Math.random())
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

    return NextResponse.json({
      ok: true,
      data: { notifications },
      notifications,
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        data: { notifications: [] },
        notifications: [],
        error: error instanceof Error ? error.message : 'Load Connect notifications failed',
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    if (!String(body?.title || '').trim()) return NextResponse.json({ ok: false, data: null, error: 'title required' }, { status: 400 })
    const notification = await createNotification(user as any, body)
    return NextResponse.json({ ok: true, data: { notification }, notification, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect notification failed'
    return NextResponse.json({ ok: false, data: null, error: message }, { status: message.toLowerCase().includes('restricted') ? 403 : 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const result = await markNotificationsRead(user as any, body.notificationIds || body.ids)
    return NextResponse.json({ data: result, ...result, error: null })
  } catch (error) {
    return NextResponse.json({ ok: false, data: null, error: error instanceof Error ? error.message : 'Update Connect notifications failed' }, { status: 500 })
  }
}
