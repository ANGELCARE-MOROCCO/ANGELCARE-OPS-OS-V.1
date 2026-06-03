import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createNotification, getNotifications, markNotificationsRead } from '@/lib/connect/connect-repository'

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ notifications: [], error: 'Unauthorized' }, { status: 401 })
    const notifications = await getNotifications(user as any)
    return NextResponse.json({ notifications })
  } catch (error) {
    return NextResponse.json({ notifications: [], error: error instanceof Error ? error.message : 'Load Connect notifications failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const notification = await createNotification(user as any, await req.json())
    return NextResponse.json({ notification })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect notification failed'
    return NextResponse.json({ error: message }, { status: message.toLowerCase().includes('restricted') ? 403 : 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const result = await markNotificationsRead(user as any, body.notificationIds || body.ids)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update Connect notifications failed' }, { status: 500 })
  }
}
