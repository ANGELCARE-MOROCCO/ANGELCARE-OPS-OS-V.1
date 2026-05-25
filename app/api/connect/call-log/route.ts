import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createCall } from '@/lib/connect/connect-repository'

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const callLog = await createCall(user as any, {
      conversation_id: body.conversation_id || body.conversationId || null,
      receiver_id: body.receiver_id || body.receiverId || null,
      room_name: body.room_name || body.roomName,
      call_type: body.call_type || body.type || 'audio',
      status: body.status || 'created',
      metadata: body.metadata || {},
    })
    return NextResponse.json({ callLog })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect call log failed'
    return NextResponse.json({ error: message }, { status: message.toLowerCase().includes('private') ? 403 : 500 })
  }
}
