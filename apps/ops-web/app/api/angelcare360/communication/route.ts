import { NextRequest, NextResponse } from 'next/server'
import {
  archiveAngelcare360Conversation,
  blockAngelcare360ExternalChannel,
  createAngelcare360Announcement,
  createAngelcare360Conversation,
  createAngelcare360InternalMessage,
  createAngelcare360MessageTemplate,
  getAngelcare360AudienceReadiness,
  getAngelcare360CommunicationOverview,
  listAngelcare360CommunicationAuditEvents,
  markAngelcare360MessageRead,
  publishAngelcare360AnnouncementInternally,
  updateAngelcare360Announcement,
  updateAngelcare360MessageTemplate,
} from '@/lib/angelcare360/server/communication'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'

export const runtime = 'nodejs'

type Body = {
  entity?: string
  operation?: string
  id?: string
  payload?: Record<string, unknown>
}

function normalizePayload(body: Body): Record<string, unknown> {
  return {
    ...(body.payload || {}),
    id: body.id || body.payload?.id || null,
  }
}

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get('schoolId')
  const mode = request.nextUrl.searchParams.get('mode') || 'overview'

  if (mode === 'audit') {
    const events = await listAngelcare360CommunicationAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }

  if (mode === 'audience') {
    const readiness = await getAngelcare360AudienceReadiness({ schoolId })
    return NextResponse.json({ ok: true, readiness }, { status: 200 })
  }

  const overview = await getAngelcare360CommunicationOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête communication est incomplète.' }, { status: 422 })
    }
    const payload = normalizePayload(body)

    if (body.entity === 'conversation') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Conversation(payload), { status: 200 })
      if (body.operation === 'archive') return NextResponse.json(await archiveAngelcare360Conversation(payload), { status: 200 })
    }

    if (body.entity === 'message') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360InternalMessage(payload), { status: 200 })
      if (body.operation === 'read') return NextResponse.json(await markAngelcare360MessageRead(payload), { status: 200 })
    }

    if (body.entity === 'announcement') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360Announcement(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360Announcement(payload), { status: 200 })
      if (body.operation === 'publishInternal') return NextResponse.json(await publishAngelcare360AnnouncementInternally(payload), { status: 200 })
    }

    if (body.entity === 'template') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360MessageTemplate(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360MessageTemplate(payload), { status: 200 })
    }

    if (body.entity === 'externalChannel' && body.operation === 'block') {
      return NextResponse.json(await blockAngelcare360ExternalChannel({
        schoolId: typeof payload.schoolId === 'string' ? payload.schoolId : null,
        channel: typeof payload.channel === 'string' ? payload.channel : null,
        reason: typeof payload.reason === 'string' ? payload.reason : null,
      }), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité communication inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

