import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { createDispatchMessage, loadDispatchMessages } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const feed = await loadDispatchMessages({ caregiverId: workspace.agent?.id ? Number(workspace.agent.id) : null, missionIds: workspace.records.map((record) => record.id) }).catch(() => ({ messages: [], threads: [], unreadCount: 0 }))
    return NextResponse.json({ ok: true, data: feed.messages.length ? feed.messages : workspace.messages, threads: feed.threads, unreadCount: feed.unreadCount || workspace.messages.filter((item) => item.unread).length })
  } catch (error) {
    return NextResponse.json({ ok: false, data: [], error: error instanceof Error ? error.message : 'Load CareLink messages failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      missionId?: number
      caregiverId?: number
      senderType?: string
      senderId?: string
      recipientType?: string
      subject?: string | null
      body?: string
      priority?: string
      threadKey?: string | null
      metadata?: Record<string, unknown>
      idempotencyKey?: string
    }

    if (!body.body || !String(body.body).trim()) {
      return NextResponse.json({ ok: false, error: 'Le message ne peut pas être vide.' }, { status: 400 })
    }

    const message = await createDispatchMessage({
      missionId: body.missionId ?? null,
      caregiverId: body.caregiverId ?? null,
      senderType: body.senderType || 'agent',
      senderId: body.senderId || null,
      recipientType: body.recipientType || 'dispatch',
      subject: body.subject || null,
      body: String(body.body),
      priority: body.priority || 'normal',
      threadKey: body.threadKey || (body.missionId ? `mission:${body.missionId}` : null),
      metadata: { ...(body.metadata || {}), idempotency_key: body.idempotencyKey || null },
    })

    return NextResponse.json({ ok: true, data: message })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Send message failed' }, { status: 500 })
  }
}
