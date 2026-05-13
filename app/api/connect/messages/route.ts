import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'

const memoryMessages: any[] = []
const memoryMembership = new Map<string, Set<string>>()

export async function GET(req: Request) {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ messages: [] }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId') || searchParams.get('roomId')
  if (!conversationId) return NextResponse.json({ messages: [] })

  const members = memoryMembership.get(conversationId)
  if (members && !members.has(String((user as any).id))) {
    return NextResponse.json({ error: 'Private conversation' }, { status: 403 })
  }

  return NextResponse.json({ messages: memoryMessages.filter((m) => m.conversation_id === conversationId) })
}

export async function POST(req: Request) {
  const user = await getCurrentAppUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const conversationId = String(body.conversationId || body.roomId || '')
  if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

  const members = memoryMembership.get(conversationId) || new Set<string>()
  members.add(String((user as any).id))
  memoryMembership.set(conversationId, members)

  const message = {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    sender_id: String((user as any).id),
    body: String(body.body || '').trim(),
    message_type: body.message_type || 'text',
    priority: body.priority || 'normal',
    confidential: Boolean(body.confidential),
    metadata: body.metadata || {},
    created_at: new Date().toISOString(),
  }

  if (!message.body) return NextResponse.json({ error: 'Message body required' }, { status: 400 })
  memoryMessages.push(message)
  return NextResponse.json({ message })
}
