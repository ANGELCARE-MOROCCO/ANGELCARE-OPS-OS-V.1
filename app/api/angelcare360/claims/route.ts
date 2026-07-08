import { NextRequest, NextResponse } from 'next/server'
import {
  assignAngelcare360ClaimTicket,
  changeAngelcare360ClaimTicketStatus,
  closeAngelcare360ClaimTicket,
  createAngelcare360ClaimTicket,
  getAngelcare360ClaimsOverview,
  listAngelcare360ClaimAssignments,
  listAngelcare360ClaimAuditEvents,
  listAngelcare360ClaimPriorityView,
  listAngelcare360ClaimTickets,
  resolveAngelcare360ClaimTicket,
  updateAngelcare360ClaimTicket,
} from '@/lib/angelcare360/server/claims'
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
    const events = await listAngelcare360ClaimAuditEvents({ schoolId, filters: {} })
    return NextResponse.json({ ok: true, events }, { status: 200 })
  }

  if (mode === 'assignments') {
    const assignments = await listAngelcare360ClaimAssignments({ schoolId })
    return NextResponse.json({ ok: true, assignments }, { status: 200 })
  }

  if (mode === 'priority') {
    const tickets = await listAngelcare360ClaimPriorityView({ schoolId })
    return NextResponse.json({ ok: true, tickets }, { status: 200 })
  }

  if (mode === 'tickets') {
    const tickets = await listAngelcare360ClaimTickets({ schoolId })
    return NextResponse.json({ ok: true, tickets }, { status: 200 })
  }

  const overview = await getAngelcare360ClaimsOverview({ schoolId })
  return NextResponse.json({ ok: Boolean(overview), overview }, { status: overview ? 200 : 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) {
      return NextResponse.json({ ok: false, error: 'La requête réclamations est incomplète.' }, { status: 422 })
    }
    const payload = normalizePayload(body)

    if (body.entity === 'claim') {
      if (body.operation === 'create') return NextResponse.json(await createAngelcare360ClaimTicket(payload), { status: 200 })
      if (body.operation === 'update') return NextResponse.json(await updateAngelcare360ClaimTicket(payload), { status: 200 })
      if (body.operation === 'assign') return NextResponse.json(await assignAngelcare360ClaimTicket(payload), { status: 200 })
      if (body.operation === 'status') return NextResponse.json(await changeAngelcare360ClaimTicketStatus(payload), { status: 200 })
      if (body.operation === 'resolve') return NextResponse.json(await resolveAngelcare360ClaimTicket(payload), { status: 200 })
      if (body.operation === 'close') return NextResponse.json(await closeAngelcare360ClaimTicket(payload), { status: 200 })
    }

    return NextResponse.json({ ok: false, error: 'Entité réclamations inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

