import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { deleteMessage, getConversationMessages, markConversationRead, sendMessage, updateMessage } from '@/lib/connect/connect-repository'

export async function GET(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: { messages: [] }, messages: [], error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId') || searchParams.get('roomId')
    if (!conversationId) return NextResponse.json({ ok: false, data: { messages: [] }, messages: [], error: 'conversationId required' }, { status: 400 })
    const messages = await getConversationMessages(user as any, conversationId)
    if (searchParams.get('markRead') !== 'false') await markConversationRead(user as any, conversationId)
    return NextResponse.json({ ok: true, data: { messages }, messages, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load Connect messages failed'
    return NextResponse.json({ ok: false, data: { messages: [] }, messages: [], error: message }, { status: message.toLowerCase().includes('private') ? 403 : 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    if (!String(body?.conversationId || body?.roomId || '').trim()) return NextResponse.json({ ok: false, data: null, error: 'conversationId required' }, { status: 400 })
    if (!String(body?.body || '').trim()) return NextResponse.json({ ok: false, data: null, error: 'Message body required' }, { status: 400 })
    const message = await sendMessage(user as any, body)
    return NextResponse.json({ ok: true, data: { message }, message, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Send Connect message failed'
    const status = message.toLowerCase().includes('required') ? 400 : message.toLowerCase().includes('private') ? 403 : 500
    return NextResponse.json({ ok: false, data: null, error: message }, { status })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    if (String(body.action || '').trim() === 'read') {
      const conversationId = String(body.conversationId || body.conversation_id || '').trim()
      if (!conversationId) return NextResponse.json({ ok: false, data: null, error: 'conversationId required' }, { status: 400 })
      const result = await markConversationRead(user as any, conversationId)
      return NextResponse.json({ data: result, ...result, error: null })
    }
    const messageId = String(body.messageId || body.id || '').trim()
    if (!messageId) return NextResponse.json({ ok: false, data: null, error: 'messageId required' }, { status: 400 })
    const message = await updateMessage(user as any, messageId, body)
    return NextResponse.json({ ok: true, data: { message }, message, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update Connect message failed'
    const status = message.toLowerCase().includes('cannot') ? 403 : message.toLowerCase().includes('required') ? 400 : 500
    return NextResponse.json({ ok: false, data: null, error: message }, { status })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const messageId = String(url.searchParams.get('messageId') || '').trim()
    if (!messageId) return NextResponse.json({ ok: false, data: null, error: 'messageId required' }, { status: 400 })
    const result = await deleteMessage(user as any, messageId)
    return NextResponse.json({ data: result, ...result, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete Connect message failed'
    const status = message.toLowerCase().includes('cannot') ? 403 : 500
    return NextResponse.json({ ok: false, data: null, error: message }, { status })
  }
}
