import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'

const memoryNotifications: any[] = []

export async function GET() {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ notifications: [] }, { status: 401 })
  const userId = String((user as any).id)
  return NextResponse.json({ notifications: memoryNotifications.filter((n) => n.user_id === userId || n.audience === 'all') })
}

export async function POST(req: Request) {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const notification = {
    id: crypto.randomUUID(),
    user_id: body.user_id || null,
    audience: body.audience || 'selected',
    title: String(body.title || 'Connect notification'),
    body: String(body.body || ''),
    priority: body.priority || 'normal',
    read: false,
    created_by: String((user as any).id),
    created_at: new Date().toISOString(),
  }
  memoryNotifications.push(notification)
  return NextResponse.json({ notification })
}
