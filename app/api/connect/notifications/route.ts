import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createNotification, getNotifications, markNotificationsRead } from '@/lib/connect/connect-repository'

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: { notifications: [] }, notifications: [], error: 'Unauthorized' }, { status: 401 })
    const notifications = await getNotifications(user as any)
    return NextResponse.json({ ok: true, data: { notifications }, notifications, error: null })
  } catch (error) {
    return NextResponse.json({ ok: false, data: { notifications: [] }, notifications: [], error: error instanceof Error ? error.message : 'Load Connect notifications failed' }, { status: 500 })
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
