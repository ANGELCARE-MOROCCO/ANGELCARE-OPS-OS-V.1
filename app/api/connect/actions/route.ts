import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'

const memoryActions: any[] = []

export async function GET() {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ actions: [] }, { status: 401 })
  const userId = String((user as any).id)
  return NextResponse.json({ actions: memoryActions.filter((a) => a.owner_id === userId || a.created_by === userId) })
}

export async function POST(req: Request) {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const action = {
    id: crypto.randomUUID(),
    source: 'connect',
    source_message_id: body.message_id || null,
    title: String(body.title || 'Connect follow-up'),
    owner_id: body.owner_id || String((user as any).id),
    status: 'open',
    priority: body.priority || 'normal',
    due_at: body.due_at || null,
    created_by: String((user as any).id),
    created_at: new Date().toISOString(),
  }
  memoryActions.push(action)
  return NextResponse.json({ action })
}
