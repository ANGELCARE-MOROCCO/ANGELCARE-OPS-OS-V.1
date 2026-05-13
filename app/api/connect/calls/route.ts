import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'

const calls: any[] = []

export async function GET() {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ calls: [] }, { status: 401 })
  const userId = String((user as any).id)
  return NextResponse.json({ calls: calls.filter((c) => c.caller_id === userId || c.receiver_id === userId) })
}

export async function POST(req: Request) {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const call = {
    id: crypto.randomUUID(),
    conversation_id: body.conversation_id || null,
    caller_id: String((user as any).id),
    receiver_id: body.receiver_id || null,
    room_name: body.room_name || `connect-${crypto.randomUUID()}`,
    call_type: body.call_type || 'audio',
    status: 'created',
    created_at: new Date().toISOString(),
  }
  calls.push(call)
  return NextResponse.json({ call })
}
