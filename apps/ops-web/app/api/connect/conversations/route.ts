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
    if (!user?.id) return NextResponse.json({ ok: false, data: { conversations: [] }, conversations: [], error: 'Unauthorized' }, { status: 401 })
    const conversations = await getMyConversations(user as any)
    return NextResponse.json({ ok: true, data: { conversations }, conversations, error: null })
  } catch (error) {
    return NextResponse.json({ ok: false, data: { conversations: [] }, conversations: [], error: error instanceof Error ? error.message : 'Load Connect conversations failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    if (!String(body?.type || body?.directUserId || body?.title || '').trim()) return NextResponse.json({ ok: false, data: null, error: 'conversation type or title required' }, { status: 400 })
    const conversation = await createConversation(user as any, body)
    return NextResponse.json({ ok: true, data: { conversation }, conversation, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect conversation failed'
    const status = message.toLowerCase().includes('restricted') || message.toLowerCase().includes('cannot') || message.toLowerCase().includes('only the ceo') ? 403 : 500
    return NextResponse.json({ ok: false, data: null, error: message }, { status })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const conversationId = String(body.conversationId || body.conversation_id || '').trim()
    const action = String(body.action || '').trim()
    if (!conversationId) return NextResponse.json({ ok: false, data: null, error: 'conversationId required' }, { status: 400 })

    if (action === 'pin') {
      const result = await pinConversation(user as any, conversationId, Boolean(body.pinned))
      return NextResponse.json({ data: result, ...result, error: null })
    }
    if (action === 'empty') {
      const result = await emptyConversation(user as any, conversationId)
      return NextResponse.json({ data: result, ...result, error: null })
    }
    if (action === 'mute') {
      const result = await muteConversation(user as any, conversationId, Boolean(body.muted))
      return NextResponse.json({ data: result, ...result, error: null })
    }
    return NextResponse.json({ ok: false, data: null, error: 'Unsupported Connect conversation action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update Connect conversation failed'
    return NextResponse.json({ ok: false, data: null, error: message }, { status: message.toLowerCase().includes('cannot') ? 403 : 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const conversationId = String(url.searchParams.get('conversationId') || '').trim()
    if (!conversationId) return NextResponse.json({ ok: false, data: null, error: 'conversationId required' }, { status: 400 })
    const result = await deleteConversationForCurrentUser(user as any, conversationId)
    return NextResponse.json({ data: result, ...result, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete Connect conversation failed'
    return NextResponse.json({ ok: false, data: null, error: message }, { status: message.toLowerCase().includes('cannot') ? 403 : 500 })
  }
}
