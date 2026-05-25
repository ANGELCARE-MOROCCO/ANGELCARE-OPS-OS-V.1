import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { getConversationMessages, markConversationRead, sendMessage } from '@/lib/connect/connect-repository'

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
