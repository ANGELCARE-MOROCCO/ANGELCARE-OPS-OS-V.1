import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import {
  createConversation,
  deleteConversationForCurrentUser,
  emptyConversation,
  getMyConversations,
  muteConversation,
  pinConversation,
} from '@/lib/connect/connect-repository'

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ conversations: [], error: 'Unauthorized' }, { status: 401 })
    const conversations = await getMyConversations(user as any)
    return NextResponse.json({ conversations })
  } catch (error) {
    return NextResponse.json({ conversations: [], error: error instanceof Error ? error.message : 'Load Connect conversations failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const conversation = await createConversation(user as any, body)
    return NextResponse.json({ conversation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect conversation failed'
    const status = message.toLowerCase().includes('restricted') || message.toLowerCase().includes('cannot') || message.toLowerCase().includes('only the ceo') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const conversationId = String(body.conversationId || body.conversation_id || '').trim()
    const action = String(body.action || '').trim()
    if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

    if (action === 'pin') {
      const result = await pinConversation(user as any, conversationId, Boolean(body.pinned))
      return NextResponse.json(result)
    }
    if (action === 'empty') {
      const result = await emptyConversation(user as any, conversationId)
      return NextResponse.json(result)
    }
    if (action === 'mute') {
      const result = await muteConversation(user as any, conversationId, Boolean(body.muted))
      return NextResponse.json(result)
    }
    return NextResponse.json({ error: 'Unsupported Connect conversation action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update Connect conversation failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const conversationId = String(url.searchParams.get('conversationId') || '').trim()
    if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })
    const result = await deleteConversationForCurrentUser(user as any, conversationId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Delete Connect conversation failed' }, { status: 500 })
  }
}
