import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { createDispatchMessage, loadDispatchMessages } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent, requireCareLinkMobileMissionAccess } from '@/lib/carelink/mobile-auth'
import { beginCareLinkMobileAction, completeCareLinkMobileAction } from '@/lib/carelink/mobile-action-idempotency'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const feed = await loadDispatchMessages({ caregiverId: workspace.agent?.id ? Number(workspace.agent.id) : null, missionIds: workspace.records.map((record) => record.id) }).catch(() => ({ messages: [], threads: [], unreadCount: 0 }))
    return NextResponse.json({ ok: true, data: feed.messages.length ? feed.messages : workspace.messages, threads: feed.threads, unreadCount: feed.unreadCount || workspace.messages.filter((item) => item.unread).length })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load CareLink messages failed')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      missionId?: number
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

    const session = body.missionId
      ? await requireCareLinkMobileMissionAccess(Number(body.missionId), 'can_view_missions')
      : await requireCareLinkMobileAgent('can_view_missions')

    const idempotency = await beginCareLinkMobileAction({
      missionId: body.missionId ?? null,
      caregiverId: session.caregiverId,
      actionType: 'message_sent',
      idempotencyKey: body.idempotencyKey || null,
      payload: body,
    })
    if (idempotency.duplicate) return NextResponse.json({ ok: true, duplicate: true, data: idempotency.existing?.response_payload || null })

    const message = await createDispatchMessage({
      missionId: body.missionId ?? null,
      caregiverId: session.caregiverId,
      senderType: 'agent',
      senderId: String(session.caregiverId),
      recipientType: body.recipientType || 'dispatch',
      subject: body.subject || null,
      body: String(body.body),
      priority: body.priority || 'normal',
      threadKey: body.threadKey || (body.missionId ? `mission:${body.missionId}` : null),
      metadata: { ...(body.metadata || {}), idempotency_key: body.idempotencyKey || null },
    })

    await completeCareLinkMobileAction({ idempotencyKey: body.idempotencyKey || null, responsePayload: { message } })
    return NextResponse.json({ ok: true, data: message })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Send message failed')
  }
}
