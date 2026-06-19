import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type BroadcastNotification = {
  id: string
  title: string
  body: string
  situation: string
  priority: string
  createdAt: string
  memoId: string
  targetId: string | null
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function readUserIdentity(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const headerEmail =
    request.headers.get('x-user-email') ||
    request.headers.get('x-angelcare-user-email') ||
    ''

  const emailFromCookie =
    cookie.match(/(?:userEmail|user_email|email)=([^;]+)/i)?.[1] ||
    cookie.match(/(?:angelcare_user_email)=([^;]+)/i)?.[1] ||
    ''

  return decodeURIComponent(headerEmail || emailFromCookie || '').trim().toLowerCase()
}

function memoToNotification(row: any, target: any | null): BroadcastNotification {
  const memo = target?.memo || target?.workspace_broadcast_memos || row

  return {
    id: String(target?.id || memo?.id || row?.id),
    memoId: String(memo?.id || row?.memo_id || row?.id),
    targetId: target?.id ? String(target.id) : null,
    title: String(memo?.title || memo?.subject || memo?.situation || 'Broadcast memo'),
    body: String(memo?.body || memo?.message || memo?.content || memo?.description || ''),
    situation: String(memo?.situation || memo?.category || 'Internal memo'),
    priority: String(memo?.priority || memo?.level || 'normal'),
    createdAt: String(memo?.created_at || memo?.createdAt || row?.created_at || new Date().toISOString()),
  }
}

export async function GET(request: Request) {
  const supabase = supabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ ok: true, data: [], source: 'not_configured' })
  }

  const userEmail = readUserIdentity(request)

  try {
    let userIds: string[] = []

    if (userEmail) {
      const { data: users } = await supabase
        .from('app_users')
        .select('id,email,username')
        .or(`email.eq.${userEmail},username.eq.${userEmail}`)
        .limit(5)

      userIds = Array.isArray(users) ? users.map((u: any) => String(u.id)).filter(Boolean) : []
    }

    const notifications: BroadcastNotification[] = []

    // Preferred normalized target table.
    const targetQuery = supabase
      .from('workspace_broadcast_memo_targets')
      .select(`
        id,
        memo_id,
        user_id,
        user_email,
        read_at,
        acknowledged_at,
        closed_at,
        status,
        workspace_broadcast_memos:memo_id (
          id,
          title,
          subject,
          situation,
          category,
          priority,
          level,
          body,
          message,
          content,
          description,
          status,
          created_at
        )
      `)
      .is('read_at', null)
      .is('closed_at', null)
      .limit(20)

    if (userIds.length > 0 || userEmail) {
      const filters = [
        ...userIds.map((id) => `user_id.eq.${id}`),
        userEmail ? `user_email.eq.${userEmail}` : '',
      ].filter(Boolean)

      if (filters.length > 0) targetQuery.or(filters.join(','))
    }

    const { data: targetRows, error: targetError } = await targetQuery

    if (!targetError && Array.isArray(targetRows)) {
      for (const target of targetRows) {
        const memo = (target as any).workspace_broadcast_memos
        if (!memo) continue
        if (memo.status && !['active', 'open', 'sent', 'broadcasted', 'published'].includes(String(memo.status).toLowerCase())) continue
        notifications.push(memoToNotification(memo, { ...target, memo }))
      }
    }

    // Fallback for less normalized memo table.
    if (notifications.length === 0) {
      const { data: memoRows } = await supabase
        .from('workspace_broadcast_memos')
        .select('id,title,subject,situation,category,priority,level,body,message,content,description,status,created_at,target_user_ids,target_user_emails,read_by,closed_by')
        .in('status', ['active', 'open', 'sent', 'broadcasted', 'published'])
        .order('created_at', { ascending: false })
        .limit(20)

      for (const memo of memoRows || []) {
        const targetUserIds = Array.isArray((memo as any).target_user_ids) ? (memo as any).target_user_ids.map(String) : []
        const targetEmails = Array.isArray((memo as any).target_user_emails) ? (memo as any).target_user_emails.map((x: any) => String(x).toLowerCase()) : []
        const readBy = Array.isArray((memo as any).read_by) ? (memo as any).read_by.map(String) : []
        const closedBy = Array.isArray((memo as any).closed_by) ? (memo as any).closed_by.map(String) : []

        const targeted =
          targetUserIds.length === 0 && targetEmails.length === 0
            ? true
            : userIds.some((id) => targetUserIds.includes(id)) || (!!userEmail && targetEmails.includes(userEmail))

        const alreadyRead = userIds.some((id) => readBy.includes(id)) || (!!userEmail && readBy.includes(userEmail))
        const alreadyClosed = userIds.some((id) => closedBy.includes(id)) || (!!userEmail && closedBy.includes(userEmail))

        if (targeted && !alreadyRead && !alreadyClosed) {
          notifications.push(memoToNotification(memo, null))
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: notifications.slice(0, 12),
      source: notifications.length ? 'broadcast_registry' : 'empty',
    })
  } catch (error) {
    return NextResponse.json({
      ok: true,
      data: [],
      source: 'safe_empty',
      message: error instanceof Error ? error.message : 'Broadcast notifications unavailable',
    })
  }
}

export async function POST(request: Request) {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: true })

  const body = await request.json().catch(() => ({}))
  const memoId = String(body.memoId || '')
  const targetId = body.targetId ? String(body.targetId) : null
  const userEmail = readUserIdentity(request)
  const now = new Date().toISOString()

  try {
    if (targetId) {
      await supabase
        .from('workspace_broadcast_memo_targets')
        .update({ read_at: now, status: 'read' })
        .eq('id', targetId)

      return NextResponse.json({ ok: true })
    }

    if (memoId) {
      const { data: memo } = await supabase
        .from('workspace_broadcast_memos')
        .select('read_by')
        .eq('id', memoId)
        .maybeSingle()

      const readBy = Array.isArray((memo as any)?.read_by) ? (memo as any).read_by : []
      const nextReadBy = Array.from(new Set([...readBy, userEmail].filter(Boolean)))

      await supabase
        .from('workspace_broadcast_memos')
        .update({ read_by: nextReadBy })
        .eq('id', memoId)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
