import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { createCall, getCalls, updateCall } from '@/lib/connect/connect-repository'

const CALL_STATUSES = new Set(['ringing', 'answered', 'connected', 'rejected', 'ended', 'missed'])
const CALL_TYPES = new Set(['audio', 'video'])

export async function GET() {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: { calls: [] }, calls: [], error: 'Unauthorized' }, { status: 401 })
    const calls = await getCalls(user as any)
    return NextResponse.json({ ok: true, data: { calls }, calls, error: null })
  } catch (error) {
    return NextResponse.json({ ok: false, data: { calls: [] }, calls: [], error: error instanceof Error ? error.message : 'Load Connect calls failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const callType = String(body?.call_type || body?.type || 'audio')
    if (!CALL_TYPES.has(callType)) return NextResponse.json({ ok: false, data: null, error: 'Invalid call_type' }, { status: 400 })
    if (!String(body?.conversation_id || body?.conversationId || '').trim()) return NextResponse.json({ ok: false, data: null, error: 'conversation_id required' }, { status: 400 })
    const call = await createCall(user as any, {
      ...body,
      conversation_id: body.conversation_id || body.conversationId,
      receiver_id: body.receiver_id || body.receiverId || null,
      call_type: callType as 'audio' | 'video',
      status: body.status || 'ringing',
    })
    return NextResponse.json({ ok: true, data: { call }, call, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create Connect call failed'
    return NextResponse.json({ ok: false, data: null, error: message }, { status: message.toLowerCase().includes('required') ? 400 : message.toLowerCase().includes('private') || message.toLowerCase().includes('recipient') ? 403 : 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentAppUser()
    if (!user?.id) return NextResponse.json({ ok: false, data: null, error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const callId = String(body.callId || body.id || '').trim()
    if (!callId) return NextResponse.json({ ok: false, data: null, error: 'callId required' }, { status: 400 })
    if (body.status && !CALL_STATUSES.has(String(body.status))) return NextResponse.json({ ok: false, data: null, error: 'Invalid call status' }, { status: 400 })
    const call = await updateCall(user as any, callId, body)
    return NextResponse.json({ ok: true, data: { call }, call, error: null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update Connect call failed'
    return NextResponse.json({ ok: false, data: null, error: message }, { status: message.toLowerCase().includes('invalid') || message.toLowerCase().includes('required') ? 400 : message.toLowerCase().includes('cannot') || message.toLowerCase().includes('private') ? 403 : 500 })
  }
}
