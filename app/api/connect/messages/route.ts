import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { deleteMessage, getConversationMessages, markConversationRead, sendMessage, updateMessage } from '@/lib/connect/connect-repository'

export async function GET(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ messages: [], error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId') || searchParams.get('roomId')
    if (!conversationId) return NextResponse.json({ messages: [], error: 'conversationId required' }, { status: 400 })
    const messages = await getConversationMessages(user as any, conversationId)
    if (searchParams.get('markRead') !== 'false') await markConversationRead(user as any, conversationId)
    return NextResponse.json({ messages })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Load Connect messages failed'
    return NextResponse.json({ messages: [], error: message }, { status: message.toLowerCase().includes('private') ? 403 : 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const message = await sendMessage(user as any, body)
    return NextResponse.json({ message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Send Connect message failed'
    const status = message.toLowerCase().includes('required') ? 400 : message.toLowerCase().includes('private') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const messageId = String(body.messageId || body.id || '').trim()
    if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    const message = await updateMessage(user as any, messageId, body)
    return NextResponse.json({ message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update Connect message failed'
    const status = message.toLowerCase().includes('cannot') ? 403 : message.toLowerCase().includes('required') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const messageId = String(url.searchParams.get('messageId') || '').trim()
    if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 })
    const result = await deleteMessage(user as any, messageId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete Connect message failed'
    const status = message.toLowerCase().includes('cannot') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
